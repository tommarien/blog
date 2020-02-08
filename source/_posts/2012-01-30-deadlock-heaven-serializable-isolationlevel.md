---
layout: post
title: "Deadlock heaven: Serializable IsolationLevel"
date: 2012-01-30 14:25
tags:
  - csharp
  - performance
  - database
  - sqlserver
---

I recently got the opportunity to investigate deadlocks, that occurred on a production environment. I always volunteer when deadlocks are involved. Just because you get a chance to learn a lot about locking and how it works on SqlServer. Most of the time, deadlocks can be solved by adding an index. But not this time, this time i discovered something bigger. The client was using WCF as a service tier. By default using transactions on a wcf service or with the use of a TransactionScope your transaction isolationlevel becomes **Serializable** by default.

> With a lock-based <a title="Concurrency control" href="http://en.wikipedia.org/wiki/Concurrency_control">concurrency control</a> DBMS implementation, <a title="Serializability" href="http://en.wikipedia.org/wiki/Serializability">serializability</a> requires read and write locks (acquired on selected data) to be released at the end of the transaction. Also <em>range-locks</em> must be acquired when a <a title="SELECT" href="http://en.wikipedia.org/wiki/SELECT">SELECT</a> query uses a ranged <em>WHERE</em> clause, especially to avoid the **phantom reads** phenomenon.

So by default your actions will cause Range locks[^1][^2][^3], which under high load in parallel execution will cause deadlocks and serious scalability issues. Remember that on SqlServer your default isolationlevel is **ReadCommitted**, either by running statements on Management Studio or by using default ITransaction instances.

I am going to try to prove that TransactionLevel serializable is **unusable** in any SqlServer system that has parallel execution and has a decent to high load. So remember to set it on ReadCommitted whenever you use the TransactionAttribute or use a TransactionScope. You could eventually add the snapshot option by executing following statement:

```sql
ALTER DATABASE MyDatabase
SET READ_COMMITTED_SNAPSHOT ON
```

## Test Setup for the scenario

Create two query windows in SqlServer Management Studio, from here indicated by spid 52 and spid 56.
To see which locks are issued use following statement in another query window:

```sql
select * from sys.dm_tran_locks
```

Don't forget to rollback your transaction on any query window after each scenario:

```sql
ROLLBACK TRAN
```

## Scenario: table with primary key

### Prerequisites

```sql
CREATE SCHEMA [Scenario1]
GO
CREATE TABLE [Scenario1].[Person]
[Id] [bigint] NOT NULL,
CONSTRAINT [PK_Person] PRIMARY KEY CLUSTERED
(
  [Id] ASC
) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT INTO [Scenario1].[Person] (Id) VALUES (1);
INSERT INTO [Scenario1].[Person] (Id) VALUES (6);
GO
```

### Steps

#### spid 52

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
BEGIN TRAN
SELECT * FROM Scenario1.Person where Id = 2;
GO
```

You will see a RangeS-S[^2] lock on KEY (primary) for spid 52

#### spid 56

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
BEGIN TRAN
SELECT * FROM Scenario1.Person where Id = 4;
GO
```

You will see a RangeS-S[^2] lock on the same KEY (primary) for spid 56

#### spid 52

```sql
INSERT INTO Scenario1.Person (Id) Values (2);
GO
```

You will see a RangeI-N[^2] lock on KEY (primary) for spid 52, because spid 56 holds the range lock, also your query is blocked

#### spid 56

```sql
INSERT INTO Scenario1.Person (Id) Values (4);
```

> Msg 1205, Level 13, State 48, Line 1
> Transaction (Process ID 56) was deadlocked on lock resources with another process and has been chosen as the deadlock victim. Rerun the transaction.

### Reasoning

Well besides from the obvious deadlock what did just happen?

_Step 1_: Places a RangeS-S lock on the primary key with the range 1-6 (inclusive), because those are the only existing values in the database, if id with value 2 existed a shared lock would have been sufficient. So remember this, if the value does not exist a range lock will be issued. When you got no values greater than the one you selected this behavior will even get worse because an infinite range lock will then be issued.

_Step 2_: Place exactly the same rangelock on the primary key

_Step 3_: Waiting on spid56 to release range lock, so that spid 52 can insert a value in the range

_Step 4_: OMG, what shall i do, sql server cannot guarantee any longer that the values you read are still consistent so you will be the victim.

## Now why is this unusable, as i never select before update?

Just be carefull when implementing a OneToMany relationship and loading it eager because it will place a range lock on your foreign key index!

For instance an order with no orderlines present in the db will instance a range lock on your orderline foreign key index because you will do the following in pseudo:

```csharp
var order = orderSet.Where(o=> o.Id = 1).Include("OrderLines").Single();
```

This would issue a rangelock (depending on the data allready present) on the orderid column index in table orderline.

If you were using WCF with the TransactionAttribute, remember that wcf only commits the transaction when everything is serialized over the wire!

## Conclusion

The default IsolationLevel of a **TransactionScope** is Serializable, make an aware choice next time you use it.

[^1]: [http://msdn.microsoft.com/en-us/library/ms191272.aspx](http://msdn.microsoft.com/en-us/library/ms191272.aspx)
[^2]: [http://yrushka.com/index.php/performance-tunning/key-range-locking-types-in-serializable-isolation-level/](http://yrushka.com/index.php/performance-tunning/key-range-locking-types-in-serializable-isolation-level/)
[^3]: [http://blogs.msdn.com/b/sqlserverstorageengine/archive/2006/05/26/range-locks.aspx](http://blogs.msdn.com/b/sqlserverstorageengine/archive/2006/05/26/range-locks.aspx)

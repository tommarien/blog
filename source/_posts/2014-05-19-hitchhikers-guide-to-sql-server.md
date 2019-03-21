---
layout: post
title: "Hitchhiker's guide to Sql Server"
date: 2014-05-19 12:40:30 +0200
tags:
  - SqlServer
  - Performance
  - Tuning
---

More and more people are taking the **'There is no database'** statement to it's limit, i think it's time to share some insights into how we could let SQLServer help us when investigating performance issues.

## Initial Setup

When it comes to performance on SQLServer these are the two most important factors that have a direct impact on system performance:

- Memory
- IO

As we are running on a filesystem where disk fragmentation is costly and unavoidable, there are some settings to think about when creating a new database:

- **Initial Size (MB)**: set this both for data and log to a reasonable size. Don't start with the defaults of 3 Mb data and 1 Mb log, but instead with about 100 Mb for data and 50 Mb on logs (depending on the recovery model), as increasing the size will impact performance and has a major impact to fragmentation on your hard drive.
- **AutoGrowth**: Default is to grow 1 Mb a time, set this to a percentage or at least 1/10 of the initial size.

## While running

Remember SQLServer is your friend, using Actual Query plan while executing a query can give you hints about the underlying problem. But in general if you don't know where to start you could use built-in statistics:

### Top 25 Missing indexes

```sql
SELECT TOP 25
dm_mid.database_id AS DatabaseID,
dm_migs.avg_user_impact*(dm_migs.user_seeks+dm_migs.user_scans) Avg_Estimated_Impact,
dm_migs.last_user_seek AS Last_User_Seek,
OBJECT_NAME(dm_mid.OBJECT_ID,dm_mid.database_id) AS [TableName],
'CREATE INDEX [IX_' + OBJECT_NAME(dm_mid.OBJECT_ID,dm_mid.database_id) + '_'
+ REPLACE(REPLACE(REPLACE(ISNULL(dm_mid.equality_columns,''),', ','_'),'[',''),']','') +
CASE
WHEN dm_mid.equality_columns IS NOT NULL AND dm_mid.inequality_columns IS NOT NULL THEN '_'
ELSE ''
END
+ REPLACE(REPLACE(REPLACE(ISNULL(dm_mid.inequality_columns,''),', ','_'),'[',''),']','')
+ ']'
+ ' ON ' + dm_mid.statement
+ ' (' + ISNULL (dm_mid.equality_columns,'')
+ CASE WHEN dm_mid.equality_columns IS NOT NULL AND dm_mid.inequality_columns IS NOT NULL THEN ',' ELSE
'' END
+ ISNULL (dm_mid.inequality_columns, '')
+ ')'
+ ISNULL (' INCLUDE (' + dm_mid.included_columns + ')', '') AS Create_Statement
FROM sys.dm_db_missing_index_groups dm_mig
INNER JOIN sys.dm_db_missing_index_group_stats dm_migs
ON dm_migs.group_handle = dm_mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details dm_mid
ON dm_mig.index_handle = dm_mid.index_handle
WHERE dm_mid.database_ID = DB_ID()
ORDER BY Avg_Estimated_Impact DESC
```

> This query will output the top 25 missing indexes ordered by estimated impact, look at indexes where the avg estimated impact is above 100000 and are frequently used (Try to avoid the INCLUDE indexes at first).

If the above query does not help you in any way, it could mean that the indexes exist but have been fragmented too much.

### Index Fragmentation

```sql
SELECT dbschemas.[name] as 'Schema',
dbtables.[name] as 'Table',
dbindexes.[name] as 'Index',
indexstats.avg_fragmentation_in_percent,
indexstats.page_count
FROM sys.dm_db_index_physical_stats (DB_ID(), NULL, NULL, NULL, NULL) AS indexstats
INNER JOIN sys.tables dbtables on dbtables.[object_id] = indexstats.[object_id]
INNER JOIN sys.schemas dbschemas on dbtables.[schema_id] = dbschemas.[schema_id]
INNER JOIN sys.indexes AS dbindexes ON dbindexes.[object_id] = indexstats.[object_id]
AND indexstats.index_id = dbindexes.index_id
WHERE indexstats.database_id = DB_ID()
ORDER BY indexstats.avg_fragmentation_in_percent desc
```

> Look for indexes that have a fragmentation level higher than 30 % and a high page count (by default on sql server the page size is 8K).

### Rebuild Indexes

```sql
ALTER INDEX PK_TABLE ON [dbo].[TABLE]
	REBUILD WITH (FILLFACTOR = 90 , STATISTICS_NORECOMPUTE = OFF)
```

#### FILLFACTOR?

Usually, the higher the better (max is 100), but it depends on how often the table changes and what the index contains. Two examples:

- PK on a int identity key, use fill factor 100% as new records are always created at the bottom (normally index fragmentation on these should be low, or a lot of records have been deleted)
- PK on a guid key, use fill factor depending on how often new records are added (start by 80% or 90%) and monitor page splits to fine tune (see query below)

### Monitor Page Splits

```sql
select Operation, AllocUnitName, COUNT(*) as NumberofIncidents
from   ::fn_dblog(null, null)
where Operation = N'LOP_DELETE_SPLIT'
group by Operation, AllocUnitName
```

## Further reading

- [Effective Clustered Indexes](https://www.simple-talk.com/sql/learn-sql-server/effective-clustered-indexes)
- [http://www.mssqltips.com/sqlservertip/1642/finding-a-better-candidate-for-your-sql-server-clustered-indexes](http://www.mssqltips.com/sqlservertip/1642/finding-a-better-candidate-for-your-sql-server-clustered-indexes)

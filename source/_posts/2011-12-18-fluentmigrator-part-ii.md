---
layout: post
title: FluentMigrator Part II
date: 2011-12-18 17:12
categories:
  - Continuous Integration
  - FluentMigrator
tags:
  - Database
  - Migrations
---

As a result of [my previous post](/blog/2011/12/09/fluentmigrator-database-migrations-done-right) of FluentMigrator, i thought publishing a follow-up article would be a great idea.  Meanwhile I joined the team of FluentMigrator as a contributor.   I would like to continue on the previous post and show some more common scenario's.

## The start

Let's revisit the first migration we wrote, we where creating a unique index on email with a separate Create expression, with the latest bits, that is no longer necessary as the Unique() and Indexed() methods are now implemented for single column indexes.

```csharp
using FluentMigrator;

namespace Blog.Migrations
{
  [Migration(20111209182700)]
  public class M0001_AddPerson : Migration
  {
    public const string SchemaName = "Personalia";
    public const string TableName = "Person";
    public override void Up()
    {
      Create.Schema(SchemaName);

      Create.Table(TableName).InSchema(SchemaName)
        .WithColumn("Id").AsInt64().Identity().PrimaryKey()
        .WithColumn("Firstname").AsAnsiString(40).Nullable()
        .WithColumn("Lastname").AsAnsiString(60).Nullable()
        .WithColumn("Email").AsAnsiString(128).NotNullable().Unique();
    }
    public override void Down()
    {
      Delete.Table(TableName).InSchema(SchemaName);

      Delete.Schema(SchemaName);
    }
  }
}
```

Just for reference i will add the command prompt syntax for the last time

```
..\Lib\Migrate.exe -a .\Blog.Migrations\bin\Debug\Blog.Migrations.dll -db SqlServer2008
```

**Important:** we no longer define the -conn parameter, if we add a connection to the app.config of our migration assembly named the same as our machine name, it will automagically fall back to that one. Another recent addition.

## Let's add some data to it

We'll use the embedded script just as a showcase for it because you could also make this work with an Insert expression.

```csharp
using FluentMigrator;

namespace Blog.Migrations
{
  [Migration(20111209184700)]
  public class M0002_AddDataToPerson :Migration
  {
    public override void Up()
    {
      Execute.EmbeddedScript("M0002_Data.sql");
    }
    public override void Down()
    {
      Execute.Sql("DELETE FROM Personalia.Person");
    }
  }
}
```

We'll also need an embedded sql script named: M0002_Data.sql

```sql
INSERT INTO Personalia.Person (FirstName, LastName, Email) VALUES ('Tom','Marien','tommarien@gmail.com');
INSERT INTO Personalia.Person (FirstName, LastName, Email) VALUES ('John','Doe','john.doe@gmail.com');
```

Remember that we could just rollback 1 step (1 migration) with following command (see [Wiki](https://github.com/schambers/fluentmigrator/wiki/Command-Line-Runner-Options))

```
..\Lib\Migrate.exe -a .\Blog.Migrations\bin\Debug\Blog.Migrations.dll -db SqlServer2008 -task rollback -steps 1
```

## Add PersonType table with data

```csharp
using FluentMigrator;
namespace Blog.Migrations
{
  [Migration(20111218143205)]
  public class M0003_AddPersonType : Migration
  {
    public const string TableName = "PersonType";
    public override void Up()
    {
      Create.Table(TableName).InSchema(M0001_AddPerson.SchemaName)
        .WithColumn("Id").AsInt32().NotNullable().PrimaryKey()
        .WithColumn("Name").AsAnsiString(40).NotNullable();

      Insert.IntoTable(TableName).InSchema(M0001_AddPerson.SchemaName).Row(new {Id = 0, Name = "None"});
      Insert.IntoTable(TableName).InSchema(M0001_AddPerson.SchemaName).Row(new {Id = 1, Name = "Natural"});
      Insert.IntoTable(TableName).InSchema(M0001_AddPerson.SchemaName).Row(new { Id = 2, Name = "Legal" });
    }
    public override void Down()
    {
      Delete.Table(TableName).InSchema(M0001_AddPerson.SchemaName);
    }
  }
}
```

## Last but not least

Add a column and foreign key constraint from Person.PersonTypeId to PersonType.Id

```csharp
using FluentMigrator;
namespace Blog.Migrations
{
  [Migration(20111218144345)]
  public class M0004_AddForeignKeyToPerson : Migration
  {
    public override void Up()
    {
      Create.Column("PersonTypeId").OnTable(M0001_AddPerson.TableName)
        .InSchema(M0001_AddPerson.SchemaName)
        .AsInt32().Nullable();

      Execute.Sql("UPDATE Personalia.Person SET PersonTypeId = 0");

      Alter.Column("PersonTypeId").OnTable(M0001_AddPerson.TableName)
        .InSchema(M0001_AddPerson.SchemaName)
        .AsInt32().NotNullable();

      Create.ForeignKey("FK_Person_PersonType").FromTable(M0001_AddPerson.TableName)
        .InSchema(M0001_AddPerson.SchemaName)
        .ForeignColumn("PersonTypeId")
        .ToTable(M0003_AddPersonType.TableName).InSchema(M0001_AddPerson.SchemaName)
        .PrimaryColumn("Id");
    }
    public override void Down()
    {
      Delete.ForeignKey("FK_Person_PersonType").OnTable(M0001_AddPerson.TableName).InSchema(M0001_AddPerson.SchemaName);
      Delete.Column("PersonTypeId").FromTable(M0001_AddPerson.TableName).InSchema(M0001_AddPerson.SchemaName);
    }
  }
}
```

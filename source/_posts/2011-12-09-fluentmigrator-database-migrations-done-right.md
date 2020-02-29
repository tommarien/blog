---
layout: post
title: FluentMigrator, database migrations done right
date: 2011-12-09 19:53
updated: 2011-12-09 19:53
tags:
  - csharp
  - fluent migrator
  - database
  - migrations
---

People that know me in real life, know I can be a real stickler when it comes to continuous integration and TDD.  I like my code to be continuously integrated. And i am not only talking about unit-tests, that mock out your database, in my oppinion this is the lie part of your code.  No you shouldn't be testing your orm, but writing logic around assumptions (namely your queries and database operations) is only covering a part of your code.  How would you be certain that you have an unique index in place for instance ?

I like all of my code to be tested including all queries and database operations. To be able to do that you need to be able to put your database in a specific state, not only schema but also your data.

I know it's possible by doing some scripting magic, but what do i do if i need to revert some of the changes i made ?

Integration testing becomes a brease using a good ORM, if you got your database covered!

## History

When Ruby on Rails first became big everyone grew accustomed to their migration framework that was baked in called [Rails migrations](http://guides.rubyonrails.org/migrations.html "Rails migrations"). Migration frameworks quickly popped up in other areas and languages like for instance in .Net :

- [Migrator.Net](http://code.google.com/p/migratordotnet)
- [SharpMigrations](http://sharpmigrations.codeplex.com)

[FluentMigrator](https://github.com/schambers/fluentmigrator/wiki) was originally started by Sean Chambers, Nate Kohari and Justin Etheredge, but it really was the community around it that got it to evolve.

## What is a migration?

Well in the end it all comes down to making a change in the database, it could be a schema-migration, a data-migration or a combination of both.

A migration has two parts namely:

- Up: moving forward in time
- Down: moving backward in time

And a migration is always unique identified by a number, which indicates the version of the database.

## Show us the code

- Add a class library project and install trough Nuget the FluentMigrator Package.
- Add a new class call it whatever you want and add a MigrationAttribute to it and inherit from migration

```csharp
using FluentMigrator;

[Migration(201112091827)]
public class M0001_Add_Person : Migration
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
        .WithColumn("Email").AsAnsiString(128).NotNullable();

    Create.Index().OnTable(TableName).InSchema(SchemaName).OnColumn("Email").Unique();
  }
  public override void Down()
  {
    Delete.Table(TableName).InSchema(SchemaName);
    Delete.Schema(SchemaName);
  }
}
```

- Add an app.config file for it and add a named connectionstring to your configuration, i called it "Dummy", create the referenced database on your sql server.
- Build your class library, open up a command prompt and type (depending on your location of your libraries, dbtype etc)

```shell
..\Lib\Migrate.exe -a ..\Blog.Migrations\bin\Debug\Blog.Migrations.dll -db SqlServer2008 -conn "Dummy"
```

- And press "enter"

> If you get a BadImageFormatException, that is because you tried to use a .net 2.0 assembly (namely migrate.exe) that calls a .NET 4.0 class library, install FluentMigrator.Tools package and use the Migrate.exe for your target .net framework version.

So everything should be fine now, look at your database and you should see that there are now two tables namely:

- Person in Schema 'Personalia'
- VersionInfo in Schema dbo

In the table VersionInfo there will be a record with in our situation the number 201112091827 in it, which is basicly the version specified in the migration attribute in the format of YYYYMMDDHHMM, you could also use 1 but if you are in a team i'd suggest using a timestamped version number, which has a low conflict chance.

So let's try to undo it (command prompt):

```shell
..\Lib\Migrate.exe -a ..\Blog.Migrations\bin\Debug\Blog.Migrations.dll -db SqlServer2008 -conn "Dummy" -task rollback:all
```

Your database should be empty again.

What if you wanted to change the default VersionInfoTable you could just add following code:

```csharp
using FluentMigrator;

[VersionTableMetaData]
public class CustomVersionMetaData : IVersionTableMetaData
{
  public string SchemaName
  {
    get { return "dbo"; }
  }

  public string TableName
  {
    get { return "SchemaVersionInfo"; }
  }

  public string ColumnName
  {
    get { return "Version"; }
  }
}
```

If you migrate up again you should get the expected VersionInfo table created, namely "SchemaVersionInfo" in schema "Database" !

## Benefits

- You can use the fluent syntax for all basic schema migrations
- You can use Insert, Delete, Update to manipulate data
- You can use Execute. (script, embedded script, sql) whenever you need something more complex, this also means you can't get stuck because you can't do it using the fluent syntax
- Very fast

Just give it a try, you'll learn to love it!

---
layout: post
title: Use your container to manage Session lifetime
date: 2013-05-25 10:00
categories:
  - csharp
tags:
  - nhibernate
  - castle windsor
  - inversion of control
---

There are many blog posts on how to manage the lifetime of ISession in a web application. Mainly because only ISessionFactory is thread-safe, which is a good thing because your ISession instance acts as a unit of work. For a web application the advised solution is to use the _session-per-request_ pattern.

- [NHibernate Forge](http://nhforge.org/blogs/nhibernate/archive/2011/03/03/effective-nhibernate-session-management-for-web-apps.aspx)
- [SessionManager by Nelson Moltavo](http://lostechies.com/nelsonmontalvo/2007/03/30/simple-nhibernate-example-part-4-session-management)
- [NHibernate documentation](http://nhforge.org/doc/nh/en/index.html#quickstart-playingwithcats)

Even myself created one in the golden years, I've even posted it SourceForge a decade ago, but I've seem to have lost the link over the years. Coincidence, maybe?

I tend to include a container in my projects, why not let your container manage this for you? It knows about lifetime/lifestyle's, so why reinventing the wheel again?

## NHibernateConfigurationBuilder

First we create a builder around the Configuration class, because i personally hate to put everything in an Xml file and I don't believe my database of choice is going to change in the middle of my project. This is not a needed step, but it includes some goodies

```csharp
using NHibernate.Cfg;
using NHibernate.Dialect;
using NHibernate.Driver;
using NHibernate.Mapping.ByCode;
using NHibernate.Tool.hbm2ddl;

namespace Nebula.Data
{
  public class NHibernateConfigurationBuilder
  {
    private string connectionStringName;

    public NHibernateConfigurationBuilder()
    {
      connectionStringName = "Nebula";
    }

    public NHibernateConfigurationBuilder UsingNamedConnectionString(
        string connectionStringName)
    {
      this.connectionStringName = connectionStringName;
      return this;
    }

    public Configuration Build()
    {
      var configuration = new Configuration();

      // initialize database configuration
      configuration.DataBaseIntegration(cfg =>
      {
          cfg.ConnectionStringName = connectionStringName;
          cfg.Driver<Sql2008ClientDriver>();
          cfg.Dialect<MsSql2008Dialect>();
          cfg.KeywordsAutoImport = Hbm2DDLKeyWords.AutoQuote;
      });

      // initialize mappers
      var mapper = new ModelMapper();
      mapper.AddMappings(GetType().Assembly.GetExportedTypes());
      configuration.AddMapping(mapper.CompileMappingForAllExplicitlyAddedEntities());

      // Auto Quote all table and column names
      SchemaMetadataUpdater.QuoteTableAndColumns(configuration);
      return configuration;
    }
  }
}
```

## The Installer

Wrap all registrations up in an installer and inject session anywhere you want

```csharp
using Castle.MicroKernel.Registration;
using Castle.MicroKernel.SubSystems.Configuration;
using Castle.Windsor;
using NHibernate;
using Nebula.Data;

namespace Nebula.Bootstrapper.Installers
{
  public class NHibernateInstaller : IWindsorInstaller
  {
    public void Install(IWindsorContainer container, IConfigurationStore store)
    {
      ISessionFactory sessionfactory = new NHibernateConfigurationBuilder()
        .Build()
        .BuildSessionFactory();

      container.Register(
        Component
            .For<ISessionFactory>()
            .Instance(sessionfactory));

      container.Register(
        Component
            .For<ISession>()
            .UsingFactory<ISessionFactory, ISession>(
                factory => factory.OpenSession())
            .LifestylePerWebRequest());
    }
  }
}
```

For the registration of ISessionFactory i could have used a factory method, but that would delay any possible configuration mismatches until the first time a sessionfactory/session is needed.

If you have a usecase for IStatelessSession, append this to the installer and you are good to go:

```csharp
container.Register(
  Component.For<IStatelessSession>()
            .UsingFactory<ISessionFactory, IStatelessSession>(
                  factory => factory.OpenStatelessSession())
            .LifestylePerWebRequest());
```

## Side note

The same mechanics can also be used to manage the lifetime of Entity framework's objectcontext! Even if you are in a wcf context, just change the lifestyle of your session accordingly (see wcf facility).

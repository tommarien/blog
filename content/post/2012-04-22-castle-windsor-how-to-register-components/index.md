---
title: "Castle Windsor: How to register components"
date: 2012-04-22
lastmod: 2012-04-22
tags:
  - csharp
  - castle-windsor
---

You can register your components in the following ways:

- [Registering components one-by-one](https://github.com/castleproject/Windsor/blob/master/docs/registering-components-one-by-one.md)
- [Registering components by conventions](https://github.com/castleproject/Windsor/blob/master/docs/registering-components-by-conventions.md)
- [Registering components using Xml configuration, which can be combined with the code options](https://github.com/castleproject/Windsor/blob/master/docs/xml-registration-reference.md)

## Registering components one-by-one

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register your component with the desired lifestyle
container.Register(Component.For<IComponent>()
                       .ImplementedBy<Component>()
                       .LifestylePerThread());
```

### What about open generic types?

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register your component for instance with the default lifestyle = Singleton
container.Register(Component.For(typeof (IRepository<>)
                       .ImplementedBy(typeof (Repository<>));
```

### How to replace an allready registered component?

In Windsor you can simple register it again, the last registered component will be the one used

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register your component for instance with a lifestyle
container.Register(Component.For(typeof (IRepository<>)
                       .ImplementedBy(typeof (Repository<>)
                       .LifestylePerWebRequest());

// Register a specialized CustomerRepository
container.Register(Component.For<IRepository<Customer>>()
                       .ImplementedBy<CustomerRepository>()
                       .LifestylePerWebRequest());
```

### How to make one class resolvable by two interface but have them share the same instance?

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register your component
container.Register(Component.For<IRepository<Customer>, ICustomerRepository>()
                       .ImplementedBy<CustomerRepository>()
                       .LifestylePerWebRequest());
```

### How can i use the decorator pattern?

First let's create a logging decorator

```csharp
public class LoggingCustomerRepository : IRepository<Customer>
{
  public ILogger Logger { get; set; };
  public IRepository<Customer> Repository { get; private set; }

  public LoggingCustomerRepository(IRepository<Customer> repository)
  {
    this.Repository = repository;
  }

  public Customer this[int id]
  {
    get { return Repository[id]; }
  }

  public void Add(Customer instance)
  {
    logger.Debug("Adding customer");
    Repository.Add(instance);
  }
}
```

With Castle Windsor the order of the registrations enables this behavior, so the first implementation will be injected into the decorator.

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register the default implementation
container.Register(Component.For<IRepository<Customer>()
                       .ImplementedBy<CustomerRepository>()
                       .LifestylePerWebRequest());

// Now register the decorator
container.Register(Component.For<IRepository<Customer>()
                       .ImplementedBy<LoggingCustomerRepository>()
                       .LifestylePerWebRequest());
```

## Registering components by conventions

To do exactly the same but with conventions syntax

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register all non abstract class inheriting from IRepository with all interfaces
// as service, so resolvable by all interfaces
container.Register(Classes.FromThisAssembly()
                       .BasedOn(typeof(IRepository<>))
                       .WithServiceAllInterfaces());
```

**WithServiceAllInterfaces**: Means windsor will register the component bound to all it's interfaces, so if for instance your CustomerRepository implements IRepository<Customer> but also ICustomerRepository, when you resolve an instance, it will be shared across both contracts for the specified lifetime ( transient means no sharing )

## Using installers

Installers provide you a way to group related registrations into one class, to create an installer simply create a class and implement IWindsorInstaller, like this:

```csharp
using Castle.MicroKernel.Registration;
using Castle.MicroKernel.SubSystems.Configuration;
using Castle.Windsor;

namespace Windsor.Tests.Generics
{
  public class RepositoryInstaller : IWindsorInstaller
  {
    public void Install(IWindsorContainer container, IConfigurationStore store)
    {
      container.Register(Classes.FromThisAssembly()
                            .BasedOn(typeof(IRepository<>))
                            .WithServiceAllInterfaces());
    }
  }
}
```

To use this installer simple install it on your container instance

```csharp
// Initialize the container
var container = new WindsorContainer();

// Install the installer(s)
container.Install(new RepositoryInstaller());
```

---
layout: post
title: I command you
date: 2013-05-11 21:03
categories:
  - Command Query Separation
  - Castle Windsor
---

Today we are going to talk about <a href="http://en.wikipedia.org/wiki/Command%E2%80%93query_separation" target="_blank">CQS</a> (Command Query Separation). In this blog post i will focus on the command part. Commands are simple objects that instruct our application to do something. I will show you the most simple implementation possible, combined with the power of Castle Windsor, which will act as our command handler registry.

Let's show the basic duo, namely our command and it's respective handler.

```csharp
public interface ICommand { }

public interface ICommandHandler<T> where T : ICommand
{
  void Handle(T command);
}
```

The 'ICommand' interface acts as a marker interface to mark all of our commands in our code base. Let's take the example model from [my previous blog post](/blog/2013/05/05/currying-your-monolithic-code-with-some-ddd-principles) as a starting point for our first command:

```csharp
public class MoveCustomerCommand : ICommand
{
  public int CustomerId { get; set; }
  public string Street { get; set; }
  public string StreetNumber { get; set; }
  public string PostalCode { get; set; }
  public string City { get; set; }
  public string Country { get; set; }
}
```

And it's dedicated handler:

```csharp
public class MoveCustomerCommandHandler : ICommandHandler<MoveCustomerCommand>
{
  private readonly ICustomerRepository _customerRepository;
  private readonly IUnitOfWork _unitOfWork;

  public MoveCustomerCommandHandler(ICustomerRepository customerRepository
                                    , IUnitOfWork unitOfWork)
  {
    _customerRepository = customerRepository;
    _unitOfWork = unitOfWork;
  }

  public void Handle(MoveCustomerCommand command)
  {
    Customer existingCustomer = _customerRepository.GetById(customer.Id);
    if (existingCustomer == null)
        throw new InvalidOperationException("Customer does not exist");

    var newAddress = new Address(customer.Street
                                  , customer.StreetNumber
                                  , customer.PostalCode
                                  , customer.City
                                  , customer.Country);

    existingCustomer.Move(newAddress);

    _unitOfWork.SaveChanges();
    }
}
```

## Infrastructure

### Bus

The Bus acts as the primal communication point in our application, it's responsibility is too send command's, directly we add a single command send and a multiple command send, so we can use this later as a facade for our unit of work/transaction setup.

```csharp
public interface IBus
{
  void Send(ICommand command);
  void Send(ICommand[] commands);
}
```

### Dispatcher

The dispatcher's primary role is execute the handler of the command given. Later we could use this to do for instance validation on our commands.

```csharp
public interface ICommandDispatcher
{
  void Dispatch<T>(T command) where T : ICommand;
}
```

### Show me the code

A possible bus implementation, that will invoke the dispatcher's generic dispatch method:

```csharp
public class DispatchingCommandBus : IBus
{
  private readonly ICommandDispatcher _dispatcher;

  public DispatchingCommandBus(ICommandDispatcher dispatcher)
  {
    _dispatcher = dispatcher;
  }

  public virtual void Send(ICommand command)
  {
    if (command == null) return;
    MethodInfo method = typeof (ICommandDispatcher).GetMethod("Dispatch");
    MethodInfo generic = method.MakeGenericMethod(command.GetType());
    generic.Invoke(_dispatcher, new object[] {command});
  }

  public void Send(ICommand[] commands)
  {
    if (commands == null) return;
    foreach (ICommand command in commands) Send(command);
  }
}
```

And an example implementation of our dispatcher, which will use a commandhandler factory to get the respective handler:

```csharp
public class DirectExecutingCommandDispatcher : ICommandDispatcher
{
  private readonly ICommandHandlerFactory _factory;

  public DirectExecutingCommandDispatcher(ICommandHandlerFactory factory)
  {
    _factory = factory;
  }

  public void Dispatch<T>(T command) where T : ICommand
  {
    ICommandHandler<T> handler = _factory.CreateHandler<T>();
    try
    {
        handler.Handle(command);
    }
    finally
    {
        _factory.Release(handler);
    }
  }
}
```

The _ICommandHandlerFactory_ is fully implemented by Castle Windsor's TypedFactory facility, and if you are wondering why the release code, please read my post about [understanding memory leaks]({{ root_url }}/blog/2012/04/21/castle-windsor-avoid-memory-leaks-by-learning-the-underlying-mechanics) with Castle Windsor.

### The commanding facility

All necessary registration's nicely molded into a custom facility:

```csharp
using System.Linq;
using Castle.Core.Configuration;
using Castle.Facilities.TypedFactory;
using Castle.MicroKernel;
using Castle.MicroKernel.Facilities;
using Castle.MicroKernel.Registration;
namespace Sapphire.Commands
{
  public class CommandingFacility : IFacility
  {
    public void Init(IKernel kernel, IConfiguration facilityConfig)
    {
        AssertFacility<TypedFactoryFacility>(kernel);
        kernel.Register(Component.For<ICommandHandlerFactory>().AsFactory());
        kernel.Register(Component.For<ICommandDispatcher>()
                                  .ImplementedBy<DirectExecutingCommandDispatcher>()
                                  .LifestyleTransient());
        kernel.Register(Component.For<IBus>()
                                  .ImplementedBy<DispatchingCommandBus>()
                                  .LifestyleTransient());
    }

    public void Terminate()
    {
    }

    private void AssertFacility<T>(IKernel kernel)
    {
        if (kernel.GetFacilities().Any(f => f is T)) return;
        throw new FacilityException(
          string.Format("CommandingFacility is dependent on {0}"
          , typeof (T).Name));
    }
  }
}
```

### Wrapup

So to use this code, just register all of your command handlers, best with a lifestyle of transient, add TypedFactoryFacility and CommandFacility into the mix and start commanding yourself:

```csharp
var container = new WindsorContainer();
container.AddFacility<TypedFactoryFacility>();
container.AddFacility<CommandingFacility>();
//Register all your command handlers
...
```

The code, and the supplementary unit tests, are available on <a href="https://github.com/tommarien/Sapphire" title="Sapphire Github Repository" target="_blank">Github</a>.

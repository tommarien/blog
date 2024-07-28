---
title: "Castle Windsor: Facilities and specialized resolving"
date: 2012-05-01
lastmod: 2012-05-01
tags:
  - csharp
  - castle-windsor
---

In my previous [post](/blog/2012/04/22/castle-windsor-how-to-register-components), I showed you how to register and resolve the most basic components.

- But how can we resolve Func or Lazy ?
- What's up with facilities ? What are they and how to use them.

I will briefly touch one of many facilities available for Castle Windsor: TypedFactoryFacility.

## Array[T] - IEnumerable&lt;T&gt; - IList&lt;T&gt; - ICollection&lt;T&gt;

What if one of your components depend on an array or a IEnumerable&lt;T&gt;. Consider following scenario:

```csharp
public class TaskExecutorWithArray
{
  private readonly ITask[] tasks;

  public TaskExecutorWithArray(ITask[] tasks)
  {
    this.tasks = tasks;
  }
}
```

In Castle Windsor you need to **opt-in** for this behavior before registering components, so the container knows you want this behavior.

```csharp
// Initialize the container
var container = new WindsorContainer();

// Important opt-in for this behavior before registering components !
container.Kernel.Resolver.AddSubResolver(
                                new CollectionResolver(container.Kernel, true));

// Register components
container.Register(Component.For<ITask>().ImplementedBy<FirstTask>());
container.Register(Component.For<ITask>().ImplementedBy<SecondTask>());
container.Register(Component.For<TaskExecutorWithArray>());
// Resolve our array

TaskExecutorWithArray executor= container.Resolve<TaskExecutorWithArray>();
```

This will work if your TaskExecutor is depending on an IEnumerable, ICollection, IList or an array of ITask. The second constructor parameter of CollectionResolver determines if Windsor allows **empty collections**, so if the value is true it will not throw an exception if you have no components registered.

> You need to **opt-in before registering any components** otherwise it will not work!

### CollectionResolverFacility

As this does not exist out of the box and it is so important to opt-in before registering any components, let's create our first facility. A facility is more or less an extension of Castle.Windsor.

```csharp
using Castle.Core.Configuration;
using Castle.MicroKernel;
using Castle.MicroKernel.Resolvers.SpecializedResolvers;

namespace Windsor.Tests.Facilities
{
  public class CollectionResolverFacility : IFacility
  {
    public void Init(IKernel kernel, IConfiguration facilityConfig)
    {
      kernel.Resolver.AddSubResolver(new CollectionResolver(kernel, true));
    }

    public void Terminate() {}
  }
}
```

Now next time you need to have collection dependencies you will just need to add the facility to Windsor like this:

```csharp
// Initialize the container
var container = new WindsorContainer();

// Add the facility to the container before adding any component registrations !
container.AddFacility<CollectionResolverFacility>();
```

## Func&lt;T&gt;

What if you needed to resolve a Func ? You could just do this, albeit a little bit cumbersome:

```csharp
// Initialize the container
var container = new WindsorContainer();

// Register your component
container.Register(Component.For<ITask>().ImplementedBy<FirstTask>());

// Now register your delegate as a factory
container.Register(Component.For<Func<ITask>>()
                            .UsingFactoryMethod(
                                  kernel => new Func<ITask>(kernel.Resolve<ITask>)));

// Now you can resolve your func
Func<ITask> taskFunc = container.Resolve<Func<ITask>>();
```

What if you wanted this behavior out of the box without registering every delegate by hand: use the power of **TypedFactoryFacility**:

```csharp
// Initialize the container
var container = new WindsorContainer();

// Add the facility
container.AddFacility<TypedFactoryFacility>();

// Register your component(s)
container.Register(Component.For<ITask>().ImplementedBy<FirstTask>());

// Now you can resolve a func for every component you registered !
Func<ITask> taskFunc = container.Resolve<Func<ITask>>();
```

## Lazy&lt;T&gt;

Last but not least how to use Lazy&lt;T&gt;, a recent addition to Castle Windsor (as of version 3)

```csharp
// Initialize the container
var container = new WindsorContainer();

// Opt-in for this behavior
container.Register(Component.For<ILazyComponentLoader>()
                            .ImplementedBy<LazyOfTComponentLoader>());

// Register your component
container.Register(Component.For<ITask>().ImplementedBy<FirstTask>());

// Now resolve your Lazy<ITask>
Lazy<ITask> lazyTask = container.Resolve<Lazy<ITask>>();
```

Next time i will try to elaborate on the trough power of the TypedFactoryFacility, i hope you are liking the series so far. Remember your feedback is important!

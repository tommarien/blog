---
layout: post
title: "Castle Windsor: Avoid memory leaks by learning the underlying mechanics"
date: 2012-04-21 02:31
comments: true
sharing: true
footer: true
categories:
  - inversion of control
  - castle windsor
published: true
---

## Lifestyles

In am not going to explain all the different lifestyles Windsor has as you could read up on them on the <a title="Castle Wiki" href="http://docs.castleproject.org/Windsor.MainPage.ashx" target="_blank">Castle Wiki</a> but for the sake of completeness I will list the most important ones and explain them in my own words

- Singleton: This is actually the default lifestyle, means there will be only 1 instance of that class in your container (think static)
- PerThread: There will only 1 instance per thread (think threadstatic)
- PerWebRequest: There will only be 1 instance per web request
- Pooled: There will be multiple instances of the same object but in a pool with a minimum pool size and a maximum pool size
- Transient: Each time an instance is requested windsor will initialize a new one

## Service Locator

Part of ASP.NET MVC 3 is the <a title="IDependencyResolver" href="http://msdn.microsoft.com/en-us/library/system.web.mvc.idependencyresolver%28v=vs.98%29.aspx" target="_blank">IDependencyResolver</a> interface which is basically the contract of the service locator pattern (described by Martin Fowler <a href="http://martinfowler.com/articles/injection.html" target="_blank">here</a>) or better said <a title="ServiceLocator Anti-Pattern" href="http://blog.ploeh.dk/2010/02/03/ServiceLocatorIsAnAntiPattern.aspx" target="_blank">anti pattern</a>!

If you are using Castle Windsor combined with service location you can get a lot of memory issues basically because the contract has no method for releasing your services/components.
When you are using Windsor you should always try to **avoid getting an instance from the container yourself** and when you have to, remember to **always release the component after using it**!

```csharp
IComponent component = container.Resolve();
component.Act();
container.Release(component);
```

But why is that? Why do we need to release our components that we ask for explicitly?

## Release Policy

Again this is explained very detailed on the <a title="Castle Wiki" href="http://docs.castleproject.org/Windsor.Release-Policy.ashx" target="_blank">Castle Wiki</a> but i will list the important ones.

- LifecycledComponentsReleasePolicy (default)
- NoTrackingReleasePolicy

> By default Windsor will use **LifecycledComponentsReleasePolicy** which keeps track of all components that were created, and upon releasing them, invokes all their decommission lifecycle steps.

In other words your garbage collector will not be able to cleanup if your container still tracks your component. Which will result into memory leaks. Now i've seen many posts and questions on the web about this where people are advising to use the NoTrackingReleasePolicy, don't because the **default release policy** is actually **a good thing**!

## Lifecycle concerns

See <a title="Castle Wiki" href="http://docs.castleproject.org/Windsor.Lifecycle.ashx" target="_blank">Castle Wiki</a> for a detailed description.

- Creation - commission concerns : everything happening within 'container.Resolve' or similar method
- Destruction - decommission concerns : everything happening within and/or after 'container.ReleaseComponent'.

A good example of a decommission concern is when your component implements IDisposable, the container will automatically recognize this as a decommission concern.

### But why and exactly when does the memory leak happen?

If you look back on the lifestyles you will see that there are lifestyles, where the begin and end of the lifetime of the component is clear:

- Singleton : the life of the component start at commission (resolve) and ends when the container is disposed
- PerThread : the life of the component ends when the thread ends
- PerWebRequest : ...

But what about Transient and Pooled ? Especially with these you gotta watch out!

### Setup

```csharp
public interface IComponent { }

public class MyComponent: IComponent { }

public interface IDisposableComponent: IComponent,IDisposable
{
   bool IsDisposed { get; }
}

public class MyDisposableComponent: IDisposableComponent
{
   public bool IsDisposed { get; private set; }
   public void Dispose()
   {
    IsDisposed = true;
   }
}

public interface IService
{
   IDisposableComponent Component { get; }
}

public class MyServiceUsingComponent: IService
{
   public IDisposableComponent Component { get; private set; }
   public MyServiceUsingComponent(IDisposableComponent component)
   {
      Component = component;
   }
}

```

### What happens if we resolve a transient

```csharp
container.Register(Component.For<IComponent>()
                            .ImplementedBy<MyComponent>()
                            .LifestyleTransient());

var component = container.Resolve<IComponent>();
Assert.IsFalse(container.Kernel.ReleasePolicy.HasTrack(component));
```

So this actually means that Windsor is not tracking the component, which means the garbage collector will be able to clean up this instance.

#### What happens if we resolve a transient with a decommission concern for instance IDisposable

```csharp
container.Register(Component.For<IDisposableComponent>()
                            .ImplementedBy<MyDisposableComponent>()
                            .LifeStyle.Transient);

var component = container.Resolve<IDisposableComponent>();
Assert.IsTrue(container.Kernel.ReleasePolicy.HasTrack(component));
```

So if we don't release the component after using it, the garbage collector will not be able to pick it up as Windsor is still referencing it and your dispose method will never get invoked!

### What happens if we resolve a transient component that is dependent on another transient component with a decommission concern?

```csharp
container.Register(Component.For<IDisposableComponent>()
                            .ImplementedBy<MyDisposableComponent>()
                            .LifeStyle.Transient);

container.Register(Component.For<IService>()
                            .ImplementedBy<MyServiceUsingComponent>()
                            .LifeStyle.Transient);

var service = container.Resolve<IService>();
Assert.IsTrue(container.Kernel.ReleasePolicy.HasTrack(service));
```

The tracking will propagate onto the parent service so again if we don't release the service after using it, we will get a memory leak!

### Always release after you are done

```csharp
Container.Register(Component.For<IDisposableComponent>()
                            .ImplementedBy<MyDisposableComponent>()
                            .LifeStyle.Transient);

var component = Container.Resolve<IDisposableComponent>();
Container.Release(component);
Assert.IsTrue(component.IsDisposed);
```

### Why does Windsor track components with a decommission concern?

At the end of the lifetime of the component, either trough a implicit (Component or Component dependent on ends life) or explicit release (trough a container.Release), Windsor will execute all decommission steps. For instance when your component implements IDisposable, Windsor will call the Dispose method.

## Conclusion

The **LifecycledComponentsReleasePolicy** is great because it will track your components that have no real end of life defined and will cleanup after you. But especially be aware if you have a singleton component taking in a transient dependency with a decommission concern, because even if you release your singleton component after using it, it will not release the transient dependency immediatly, it will have to wait until your singleton's life ends!

Because the real releasing (think disposing) of your transient dependency will happen at the end the life of the singleton component, most of the time when your application stops, only then will the container release the reference to the transient dependency and eventually call the dispose method. And even then this is just 1 instance of that transient component, so that will not cause a memory issue.

But in a real world scenario where you follow the advice of if you have to resolve yourself, you release after using the component. You will have no memory leaks!

---
layout: post
title: "Castle Windsor: Avoiding runtime errors due to misconfigured components"
date: 2013-04-26 23:15
updated: 2013-04-26 23:15
tags:
  - csharp
  - inversion of control
  - castle windsor
---

Components that have missing dependencies can lead to pesky runtime exceptions:

> **HandlerException was unhandled**
>
> Can't create component 'ConsoleApplication1.ComponentA' as it has dependencies to be satisfied.
> 'ConsoleApplication1.ComponentA' is waiting for the following dependencies:
>
> - Service 'ConsoleApplication1.IDependency' which was not registered.

In debug mode the container helps you discovering your issue while hovering over your container instance it will show you all the information you need under **Potentially misconfigured items**.

Let's try to improve this, first we need to make our component registrations reusable:

```csharp
public static class Boot
{
  public static IWindsorContainer Container()
  {
    var container = new WindsorContainer();
    container.Install(new SomeInstaller());
    return container;
  }
}
```

We can use this class for instance in our global.asax to instantiate our container. Now lets write a test that verifies that everything is well configured

```csharp
public class WindsorRegistrationFixture
{
  [Test]
  public void ShouldNotHaveAnyMisconfiguredComponents()
  {
    var container = Boot.Container();
    var diagnostic = new PotentiallyMisconfiguredComponentsDiagnostic(container.Kernel);
    IHandler[] handlers = diagnostic.Inspect();
    if (handlers != null && handlers.Any())
    {
      var builder = new StringBuilder();
      builder.AppendFormat("Misconfigured components ({0})\r\n", handlers.Count());
      foreach (IHandler handler in handlers)
      {
        var info = (IExposeDependencyInfo) handler;
        var inspector = new DependencyInspector(builder);
        info.ObtainDependencyDetails(inspector);
      }
      Assert.Fail(builder.ToString());
    }
  }
}
```

Which will output this :

> Misconfigured components (1)
> 'ConsoleApplication1.ComponentA' is waiting for the following dependencies:

- Service 'ConsoleApplication1.IDependency' which was not registered.

So now every time this test runs (either locally or on your CI build), you know that if this test was green, you will not get any Runtime exceptions caused by misconfigured components.

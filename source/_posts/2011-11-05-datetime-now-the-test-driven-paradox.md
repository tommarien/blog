---
layout: post
title: DateTime.Now, the test-driven paradox
date: 2011-11-05 22:56
categories:
  - Test Driven Design
tags:
  - Mock
  - Clock
  - Time
---

Although i know already a lot has been written about this dilemma, i never saw a good and descriptive enough solution to this problem. Let's first start by situating the problem with a simple code example.

```csharp
public class Order
{
  public Order()
  {
    CreatedDate = DateTime.Now;
  }

  public DateTime CreatedDate { get; private set; }
}
```

So how would I be able to test the fact that when I create a new order, the _CreatedDate_ is filled in with the value of **DateTime.Now**.

The only thing i could test for is if the _CreatedDate_ is not null.  But that would be a lousy test because the code in the _Order_ constructor could also be setting the _CreatedDate_ to a given date (01/01/1830).

## Proposed Solution 1

Creating an interface (for instance ISystemClock) with off course the implementation

```csharp
public interface ISystemClock
{
  DateTime Now();
}

public class RealSystemClock : ISystemClock
{
  public DateTime Now()
  {
    return DateTime.Now;
  }
}
```

Although it allows the dependency to be  mocked in unit tests, it would make the _Order_ code look like this, which feels a little strange

```csharp
public class Order
{
  public Order(ISystemClock clock)
  {
    CreatedDate = clock.Now();
  }

  public DateTime CreatedDate { get; private set; }
}
```

## Proposed Solution 2

Wrap the _ISystemClock_ into a static class which allows changing the implementation:

```csharp
public static class SystemClock
{
  private static ISystemClock Clock = new RealSystemClock();

  public static DateTime Now
  {
    get { return Clock.Now(); }
  }

  public static void Set(ISystemClock clock)
  {
    Clock = clock;
  }
}
```

Which would result in the following, much nicer _Order_ constructor:

```csharp
public Order()
{
  CreatedDate = SystemClock.Now;
}
```

This is beginning to get more like it, it allows mocking the value of _ISystemClock_.**Now** trough setting the implementation via the _Set_ method. But this could get you into a whole lot of trouble of you didn't put the right test initialization code into your tests to reset the _SystemClock_ underlying implementation class back to _RealSystemClock_.

What about if our test runner allowed multithreaded testing, 1 test could affect another.

What if someone changed it in your real code, I know developers are not morons, but still the concern remains and it seems to be a whole lot of code to just mock out **DateTime.Now**.

## Proposed Solution 3

Expose **DateTime.Now** as an instance of  a function, that can be replaced in tests , this is [Ayende's](http://ayende.com/blog/3408/dealing-with-time-in-tests "Ayende's SystemTime") solution:

```csharp
public static class SystemTime
{
  public static Func<DateTime> Now = () => DateTime.Now;
}
```

Although i like the simplicity of this solution, this is just a simplification of the code in Solution 2. I think most of the remarks of solution 2 also counts for this beauty, which can also be seen in the comments on Ayende's blog.

## Proposed Solution 4

Let's alter Ayende's solution and tackle the first problem: Thread Safety

```csharp
public static class SystemClock
{
  [ThreadStatic]
  private static Func provider;

  private static Func<DateTime> Provider
  {
    get { return provider ?? (provider = () => DateTime.Now); }
  }

  public static DateTime Now()
  {
    return Provider();
  }
}
```

Ok, this seems to solve the problem, but it removed the ability to mock our **DateTime.Now**. Let's solve this by adding a method that returns a [DisposableAction](http://ayende.com/blog/890/the-ultimate-disposable "DisposableAction"), that could be used in our testing.

```csharp
public static class SystemClock
{
  [ThreadStatic]
  private static Func provider;

  private static Func<DateTime> Provider
  {
    get { return provider ?? (provider = () => DateTime.Now); }
  }

  public static DateTime Now()
  {
    return Provider();
  }

  public static IDisposable Frozen(DateTime pointInTime)
  {
    var value = Provider;
    var undo = new DisposableAction(() => provider = value);
    provider = () => pointInTime;
    return undo;
  }
}

public class DisposableAction : IDisposable
{
  private readonly Action action;
  private bool isDisposed;

  public DisposableAction(Action action)
  {
    if (action == null) throw new ArgumentNullException("action");
    this.action = action;
  }

  public void Dispose()
  {
    if (isDisposed) return;
    action();
    isDisposed = true;
  }
}
```

As the _SystemClock_.**Frozen** method returns a IDisposable, it would auto-cleanup during testing and allows a very discriptive way of testing

```csharp
[Test]
public void Should_set_the_createddate_to_systemclock_now()
{
  using (SystemClock.Frozen(new DateTime(2001, 1, 1)))
  {
    var order = new Order();
    Assert.AreEqual(SystemClock.Now(), order.CreatedDate);
  }
}
```

Although this solution is still not idiot proof, it guides us to the correct use of the SystemClock's Frozen method.

Now it's up to you to pick your own poison!

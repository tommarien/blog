---
layout: post
title: I let you know that something happened
date: 2013-05-21 21:20
comments: true
sharing: true
footer: true
categories:
- command query separation
- castle windsor
---
How do you handle follow-up actions of important things that happened in your code? For instance when a new user registered on your site you need to send him a registration verification link.  Are you just adding the necessary pieces of code into your existing code block?  What happens if you need to also send an email to the administrator of the website, so he may already setup the necessary roles for the newly registered user?  Or you need to automatically create a backorder when stock of a specific product runs out?

## The event
An event is the acknowledgement that something important did happen in your system. The name always indicates that something did happen, so it is always in past tense.

{% highlight csharp %}
public interface IEvent { }
{% endhighlight %}

### Possible example

{% highlight csharp %}
public class AccountRegistered : IEvent
{
   public string Email { get;set; }
}
{% endhighlight %}

## The event subscriber/handler
An event subscriber subscribes to a specific event, its execution happens synchronously. Important thing to notice here is that there can be multiple subscribers to the same event, they will be run in any order. Normally they will happen into the same Context/UnitOfwork/Transaction as the event originator. But it is also possible to queue a new message on a MSMQ/Bus in a subscriber.

{% highlight csharp %}
public interface ISubscribe<T>
{
    void On(T @event);
}
{% endhighlight %}

### Possible example

{% highlight csharp %}
public class SendVerificationMailOnAccountRegistered : ISubscribe<AccountRegistered>
{
   	public void On(AccountRegistered @event)
	{
		// Send email to registered user with email
	}
}
{% endhighlight %}

## Easy access
Now i personally prefer raising these events from where it belongs, more specific in the domain code. Now how could we raise events in an easy way and automatically execute all the needed subscribers? I avoid doing any form of Dependency Injection in my domain, we'll need some static gateway to something that dispatches the events

{% highlight csharp %}
public static class DomainEvents
{
    private static volatile IEventDispatcher _dispatcher = new NullEventDispatcher();
    private static readonly object Syncroot = new object();

    public static IEventDispatcher Dispatcher
    {
        get { return _dispatcher; }
        set
        {
            lock (Syncroot)
                _dispatcher = value ?? new NullEventDispatcher();
        }
    }

    public static void Raise<T>(T @event) where T : IEvent
    {
        Dispatcher.Dispatch(@event);
    }
}
{% endhighlight %}

This allows me to do the following in my domain code:

{% highlight csharp %}
DomainEvents.Raise(new AccountRegistered { Email="someone@google.com" });
{% endhighlight %}

## IEventDispatcher

Let's take a closer look at the event dispatcher contract and 3 example implementations

### The contract

{% highlight csharp %}
public interface IEventDispatcher
{
    void Dispatch<T>(T @event) where T : IEvent;
}
{% endhighlight %}

### NullEventDispatcher

As i hate those pesky NullReferenceExceptions, i made myself a default null object implementation.

{% highlight csharp %}
public class NullEventDispatcher : IEventDispatcher
{
    public void Dispatch<T>(T @event) where T : IEvent
    {
    }
}
{% endhighlight %}

### Collecting Events for unit test purposes

This implementation can be used to unit test if a specific event has occurred, although one could also use mocked one.

{% highlight csharp %}
public class CollectingEventDispatcher : IEventDispatcher, IEnumerable<IEvent>
{
	[ThreadStatic]
    private static Queue<IEvent> _occurredEvents;

    private static Queue<IEvent> OccurredEvents
    {
        get { return _occurredEvents ?? (_occurredEvents = new Queue<IEvent>()); }
    }

    public IEnumerator<IEvent> GetEnumerator()
    {
        return OccurredEvents.GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }

    public void Dispatch<T>(T @event) where T : IEvent
    {
        OccurredEvents.Enqueue(@event);
    }

    public void Clear()
    {
        OccurredEvents.Clear();
    }
}
{% endhighlight %}

### The one that glues everything together

This is a example implementation useable in your application, it uses a subscriber factory underneath (Typed Factory Facility - Castle Windsor).

{% highlight csharp %}
public class DispatchToSubscribersEventDispatcher : IEventDispatcher
{
    private readonly ISubscriberFactory _subscriberFactory;

    public DispatchToSubscribersEventDispatcher(ISubscriberFactory subscriberFactory)
    {
        _subscriberFactory = subscriberFactory;
    }

    public void Dispatch<T>(T @event) where T : IEvent
    {
        ISubscribe<T>[] subscribers = _subscriberFactory.GetSubscribers<T>();
        try
        {
            foreach (var subscriber in subscribers)
                subscriber.On(@event);
        }
        finally
        {
            foreach (var handler in subscribers)
                _subscriberFactory.Release(handler);
        }
    }
}
{% endhighlight %}

### Registration details for Windsor and application start code

{% highlight csharp %}
public class EventingInstaller : IWindsorInstaller
{
    public void Install(IWindsorContainer container, IConfigurationStore store)
    {
        container.Register(Component.For<ISubscriberFactory>()
                                    .AsFactory());
        container.Register(Component.For<IEventDispatcher>()
                                    .ImplementedBy<DispatchToSubscribersEventDispatcher>());
    }
}
{% endhighlight %}

And for instance in your Global.asax after you setup your container:

{% highlight csharp %}
var container = new WindsorContainer();
container.AddFacility(new EventingFacility());
DomainEvents.Dispatcher = container.Resolve<IEventDispatcher>();
{% endhighlight %}

## Reference links

- <a href="http://www.udidahan.com/2009/06/14/domain-events-salvation/" target="_blank">Domain Events-Salvation (Udi Dahan)</a>
- <a href="http://mookid.dk/oncode/archives/3182" target="_blank">Domain events salvation example (Mogens Heller Grabe)</a>

As usual the code and supplementary unit tests, are available on <a href="https://github.com/tommarien/Sapphire" title="Sapphire Github Repository" target="_blank">Github</a>.
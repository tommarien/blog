---
layout: post
title: Who manages the transaction?
date: 2013-06-04 20:00
comments: true
sharing: true
footer: true
categories:
- nhibernate
- castle windsor
- inversion of control
---
In my last [post]({{ root_url }}/blog/2013/05/25/use-your-container-to-manage-session-lifetime) we talked about letting our container manage our ISession lifetime. Immediatly after publishing this post, i've got a lot of reactions considering the management of transactions, more specificly about issueing a rollback when an exception has been thrown.

A simplistic approach would be to do this in every commandhandler:
{% highlight csharp %}
public class MoveCustomerCommandHandler : ICommandHandler<MoveCustomerCommand>
{
  private readonly ISession session;

  public MoveCustomerCommandHandler(ISession session)
  {
    this.session = session;
  }

  public void Handle(MoveCustomerCommand command)
  {
    using (var transaction = session.BeginTransaction())
    {
      // Handling code ...
      transaction.Commit();
    }
  }
}
{% endhighlight %}

But this approach seems rather **cumbersome** and **not very flexible**. What if we could automate this repeated code pattern more or less like what behaviors are doing in a WCF context ? We need some sort of AOP approach.

## Meet AutoTx interceptor

{% highlight csharp %}
using System;
using Castle.DynamicProxy;
using NHibernate;
using IInterceptor = Castle.DynamicProxy.IInterceptor;

namespace Nebula.Bootstrapper.Interceptors
{
    public class AutoTxInterceptor : IInterceptor
    {
        private readonly Lazy<ISession> session;

        public AutoTxInterceptor(Lazy<ISession> session)
        {
            this.session = session;
        }

        private IInvocation Owner { get; set; }

        public void Intercept(IInvocation invocation)
        {
            BeginTransactionIfNeeded(invocation);

            try
            {
                invocation.Proceed();
                CommitTransactionIfNeeded(invocation);
            }
            catch (Exception)
            {
                RollBackTransactionIfNeeded(invocation);
                throw;
            }
        }

        private bool IsTransactionOwner(IInvocation invocation)
        {
            return (Owner == invocation);
        }

        private void BeginTransactionIfNeeded(IInvocation invocation)
        {
            if (session.Value.Transaction.IsActive) return;
            session.Value.BeginTransaction();
            Owner = invocation;
        }

        private void CommitTransactionIfNeeded(IInvocation invocation)
        {
            if (!IsTransactionOwner(invocation)) return;
            session.Value.Transaction.Commit();
            Owner = null;
        }

        private void RollBackTransactionIfNeeded(IInvocation invocation)
        {
            if (!IsTransactionOwner(invocation)) return;
            session.Value.Transaction.Rollback();
            Owner = null;
        }
    }
}
{% endhighlight %}

Basicly this code takes the entire transaction idiom from our hands, it starts a transaction if not allready started and if the interceptor started the transaction it will commit/rollback (depending on exceptions thrown) the transaction.

## The registration

Nothing really special going on, just not forget to [opt-in for Lazy]({{ root_url }}/blog/2012/05/01/castle-windsor-facilities-and-specialized-resolving "Castle Windsor: Facilities and specialized resolving") resolving and register the interceptor as transient, so that it's lifetime gets bound to whom it is intercepting.

{% highlight csharp %}
var container = new WindsorContainer()

// opt-in for Lazy
container.Register(Component.For<ILazyComponentLoader>()
                            .ImplementedBy<LazyOfTComponentLoader>());

// Necessary session registration
// ...

// Bind lifestyle of to whom it is intercepting
container.Register(Component.For<AutoTxInterceptor>()
                            .LifestyleTransient());

// register all commandhandlers
container.Register(Classes.FromAssemblyContaining(typeof (NHibernateConfigurationBuilder))
                          .BasedOn(typeof (ICommandHandler<>))
                          .WithService.Base()
                          .Configure(c => { c.Interceptors<AutoTxInterceptor>(); })
                          .LifestyleTransient());
{% endhighlight %}
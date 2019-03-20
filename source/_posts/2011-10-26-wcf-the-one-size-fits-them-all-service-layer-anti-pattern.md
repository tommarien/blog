---
layout: post
title: Wcf, the one size fits them all Service Layer anti-pattern
date: 2011-10-26 08:30
categories:
  - CSharp
tags:
  - Architecture
  - Opinion
  - WCF
---

When you talk with fellow developers and you mention **Service Layer** people automatically hear **WCF Services**. Did i miss a book or some guidance document from Microsoft, stating that WCF stands for service layer?

For those who have been around for a while, back in the dark ages of .NET (pre WCF Era) there where amongst others the following communication options:

- Web services (XML)
- .NET Remoting (XML or Binary)
- Communication using the Socket/SocketPool classes

Each with their specific configuration, setup and usage.

With the release of .Net Framework 3.0/3.5, Microsoft created (or bought) a way to unify all of those options into 1 product that makes it easy, well almost easy, to switch from one option to another. And they named it Windows Communication Foundation.

## What is a Service Layer and when should we implement one?

> A Service Layer defines an application's boundary and its set of available operations from the perspective of interfacing client layers. It encapsulates the application's business logic, controlling transactions and coordinating responses in the implementation of its operations. [[Martin Fowler]](http://martinfowler.com/eaaCatalog/serviceLayer.html)

You typically introduce a Service Layer when you have complex use cases, which possibly will be reused by different UI's, like for instance between a ASP.NET MVC application, a Windows Service or a Console application and you want to avoid code duplication.  Or you want to separate your use cases from your UI Flow for better testability.

## How should we use WCF?

It should be an abstraction layer, you simplify the underlying relational/domain complexity into understandable ServiceContracts with their respective model (data contracts).

And if we do need WCF, it's because we really need it [YAGNI](https://en.wikipedia.org/wiki/You_aren't_gonna_need_it "You aren't gonna need it"):

- We have a need for distributed computing
- We need to be able to communicate across the web or across the enterprise
- ...

And yes, using WCF, introduces complexity but you really needed it.

### How are we using it?

Most of us are using it as a gateway into our data retrieval and crud methods, sending entire domainobject-graphs (anemic) with all their complexity over the wire.  
About 90% of the time, these objects are serialized to SOAP.  
Just so we can use these WCF services, hosted on a IIS Server in our web application, hosted on the same IIS server.

### Reason why we keep on doing this:

About 70% of the time the answer is: It's so easy when we need to make our WCF publicly available. (other possible answer is Simply because we can)

Please consider following scenario and hopefully you will rethink your answer:

```csharp
[DataContract]
public class Product
{
  public Product()
  {
  }

  [DataMember]
  public double Prise { get; set; }
}
```

Which off course is nicely used in following WCF Service:

```csharp
[ServiceContract]
public interface IProductService
{
  [OperationContract]
  Product GetProductById(int id);
}
```

Conversation:

_Armand (Architect):_ John, Lisa has made a screw up in code, you need to rename the property Prise to Price in our product model.
_John ( Senior Developer):_ Can't do Armand!
_Armand (Architect):_ Why not, John?
_John (Senior Developer) :_ [Hesitates] Well ... erm ... because we have to call all of our customers and tell them we have a breaking API change.

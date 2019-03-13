---
layout: post
title: Entities vs Value objects
date: 2011-10-31 20:39
comments: true
sharing: true
footer: true
categories:
  - architecture
  - domain driven design
  - object oriented
published: true
---

I know this is a very popular topic in "Domain Driven Design" fora's, but still most of the definitions still remain vague. As these are the two corner stones of a domain model, i thought they deserved some attention.

### Entities

> Many objects are not fundamentally defined by their attributes, but rather by a thread of continuity and identity. [Eric Evans]

I'll try to make this one a little more clear by giving an example:

```csharp
public class Person
{
   public Person(int id)
   {
   }

   public int Id { get; set; }
   public string Name { get; set; }
}
```

So the question we are answering is the following:

```csharp
Person billy = new Person(1) {Name = "Billy"};
Person billy2 = new Person(2) { Name = "Billy"};
var equal = billy == billy2;
```

So suppose the first "billy" came from Belgium and the second one came from England. Would they be the same billy?

So an entity is not defined by the value of its properties, they are defined by their reference (most ORM's cover this) or in database terms both entities would be the same if they share the same identity value (albeit int, guid, long, string, ...).

> Be carefull with this, because it's not because an object has an identity value, that makes it an entity, if the identity is only there for persistence reasons it's not entity.

Model your entities accordingly, overriding equals and gethashcode to take the identity value into account. For an example of this see [Sharp-Architecture](https://github.com/sharparchitecture/Sharp-Architecture/blob/master/Solutions/SharpArch.Domain/DomainModel/EntityWithTypedId.cs "EntityWithTypedId").

### Value objects

> Many objects have no conceptual identity.  These objects describe characteristics of a thing. [Eric Evans]
> Consider following object

```csharp
public class FullName
{
   public string Firstname { get; private set; };
   public string Lastname { get; private set; };
}
```

So if we have two full name instances, they would be considered equal if they have the same values for both first and last name. Value objects are more groupings of related properties. In persistence terminology, their values would be saved in fields of the Person table. As they are just characteristics of a person.

Define your value objects as immutable objects (values settable with constructor only) with again a overriden equals and gethashcode method, which take into account the property values and the type. To change the value of an address, one must create a new address object. [Micro-classes]({{ root_url }}/blog/2011/10/30/micro-classes-as-building-blocks) are essentially value objects.

### Conclusion

#### By looking at the above definitions we can conclude that **Order** is an entity, but what is an **Orderline** object?

_It is an entity because if one user adds an orderline (for instance 2 times product x) and another user adds the same orderline (two times product x), the order would end up with two orderlines of two times product x each. If it was a value object the order would end up with one orderline (two times product x)._

#### What if we want to store _address_ in an Address table, we need to add an identity value to the object, would it make address an entity?

_No it doesn't, because if we want to use the same address for those customer entities we still need a different instance (albeit with the same values except the id) or clone of address.  Otherwise when we change the address values of one the customers, the other one would move also. The identity of the Address value object is only used to keep our database happy_

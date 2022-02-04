---
layout: post
title: Currying your monolithic code with basic DDD principles
permalink: blog/2013/05/05/currying-your-monolithic-code-with-some-ddd-principles/index.html
date: 2013-05-05
updatedDate: 2013-05-05
tags:
  - post
  - csharp
---

Even the most monolithic code base could benefit by introducing some of the most basic principles of Domain Driven Design. The following blog post is a reproduction of a real life code base, in a simplified form, but not far from reality.

## The breakdown

```csharp
public void Update(CustomerDto customer)
{
  Customer existingCustomer = _customerRepository.GetById(customer.Id);
  if (existingCustomer == null) throw new InvalidOperationException("Customer does not exist");

  // Check to see if we have changes
  bool hasChanges = !existingCustomer.Street.Equals(customer.Street)
                    || !existingCustomer.StreetNumber.Equals(customer.StreetNumber)
                    || !existingCustomer.City.Equals(customer.City)
                    || !existingCustomer.PostalCode.Equals(customer.PostalCode)
                    || !existingCustomer.Country.Equals(customer.Country);

  // Update object
  existingCustomer.Street = customer.Street;
  existingCustomer.StreetNumber = customer.StreetNumber;
  existingCustomer.PostalCode = customer.PostalCode;
  existingCustomer.City = customer.City;
  existingCustomer.Country = customer.Country;

  // If we have address changes update invoicing service
  if (hasChanges)
  {
      _invoicingService.Execute(new UpdateAddress
          {
              Id = customer.Id,
              Street = customer.Street,
              Number = customer.StreetNumber,
              Postal = customer.PostalCode,
              City = customer.City,
              Country = customer.Country
          });
  }

  _unitOfWork.SaveChanges();
}
```

By seeing the above code snippet, even without knowing all the specific implementations, we can clearly identify the requirements of this method:

- Map all necessary values from the data-transfer object to the domain
- When a customer's address has been been changed we need inform the invoicing service of that change
- We need to persist the changes if any

Just for the sake of clarity i will include the initial [anemic](http://martinfowler.com/bliki/AnemicDomainModel.html) domain model

```csharp
public class Customer
{
  public int Id { get; set; }
  public string Street { get; set; }
  public string StreetNumber { get; set; }
  public string PostalCode { get; set; }
  public string City { get; set; }
  public string Country { get; set; }
}
```

## The 'Address' value object

By introducing a DDD value object for all the address related properties we could simplify all the necessary change tracking in this code, i will include the Address code snippet just for clarity but i let my Resharper generate all equality members.

```csharp
public class Address
{
  public Address(string street
      , string streetNumber, string postalCode
      , string city, string country)
  {
    Street = street;
    StreetNumber = streetNumber;
    PostalCode = postalCode;
    City = city;
    Country = country;
  }

  public string Street { get; private set; }
  public string StreetNumber { get; private set; }
  public string PostalCode { get; private set; }
  public string City { get; private set; }
  public string Country { get; private set; }

  protected bool Equals(Address other)
  {
    return string.Equals(Street, other.Street) && string.Equals(StreetNumber, other.StreetNumber) &&
            string.Equals(PostalCode, other.PostalCode) && string.Equals(City, other.City) &&
            string.Equals(Country, other.Country);
  }

  public override bool Equals(object obj)
  {
    if (ReferenceEquals(null, obj)) return false;
    if (ReferenceEquals(this, obj)) return true;
    if (obj.GetType() != typeof (Address)) return false;
    return Equals((Address) obj);
  }

  public override int GetHashCode()
  {
    unchecked
    {
      int hashCode = (Street != null ? Street.GetHashCode() : 0);
      hashCode = (hashCode*397) ^ (StreetNumber != null ? StreetNumber.GetHashCode() : 0);
      hashCode = (hashCode*397) ^ (PostalCode != null ? PostalCode.GetHashCode() : 0);
      hashCode = (hashCode*397) ^ (City != null ? City.GetHashCode() : 0);
      hashCode = (hashCode*397) ^ (Country != null ? Country.GetHashCode() : 0);
      return hashCode;
    }
  }

  public static bool operator ==(Address left, Address right)
  {
    return Equals(left, right);
  }

  public static bool operator !=(Address left, Address right)
  {
    return !Equals(left, right);
  }
}
```

This is how our Customer domain object could look like at this moment:

```csharp
public class Customer
{
  public int Id { get; set; }
  public Address Address { get; set; }
}
```

By doing this we can refactor our main monolithic block to this:

```csharp
public void Update(CustomerDto customer)
{
  Customer existingCustomer = _customerRepository.GetById(customer.Id);
  if (existingCustomer == null) throw new InvalidOperationException("Customer does not exist");

  // Check to see if we have changes
  var newAddress = new Address(customer.Street
                  , customer.StreetNumber
                  , customer.PostalCode
                  , customer.City
                  , customer.Country);

  bool hasChanges = existingCustomer.Address != newAddress;

  // Update object
  existingCustomer.Address = newAddress;

  // If we have address changes update invoicing service
  if (hasChanges)
  {
    _invoicingService.Execute(new UpdateAddress
      {
          Id = customer.Id,
          Street = customer.Street,
          Number = customer.StreetNumber,
          Postal = customer.PostalCode,
          City = customer.City,
          Country = customer.Country
      });
  }

  _unitOfWork.SaveChanges();
}
```

### Introduce a domain event and put the logic where it belongs

For more details i encourage you to read [Udi Dahan's post](http://www.udidahan.com/2009/06/14/domain-events-salvation/) on it.

### The 'CustomerMoved' domain event:

This event indicates that a customer has moved

```csharp
public class CustomerMoved : IDomainEvent
{
  public int Id { get; set; }
  public Address Address { get; set; }
}
```

### It's handler

Which has only the responsability to let the invoicing system know when a customer has moved.

```csharp
public class UpdateInvoicingAddressHandler : IDomainEventHandler<CustomerMoved>
{
  private readonly InvoicingService _invoicingService;

  public UpdateInvoicingAddressHandler(InvoicingService invoicingService)
  {
    _invoicingService = invoicingService;
  }

  public void On(CustomerMoved @event)
  {
    _invoicingService.Execute(new UpdateAddress
          {
              Id = @event.Id,
              Street = @event.Address.Street,
              Number = @event.Address.StreetNumber,
              Postal = @event.Address.PostalCode,
              City = @event.Address.City,
              Country = @event.Address.Country
          });
  }
}
```

### Remove setters

Let's create a move method that does all necessary mechanics and remove the address property setter

```csharp
public class Customer
{
  public int Id { get; set; }
  public Address Address { get; private set; }

  public void Move(Address newAddress)
  {
    if (Address == newAddress) return;
    Address = newAddress;
    DomainEvents.Raise(new CustomerMoved {Id = Id, Address = newAddress});
  }
}
```

## The result, which is no longer monolithic

```csharp
public void Update(CustomerDto customer)
{
  Customer existingCustomer = _customerRepository.GetById(customer.Id);
  if (existingCustomer == null) throw new InvalidOperationException("Customer does not exist");

  var newAddress = new Address(customer.Street, customer.StreetNumber
                              , customer.PostalCode, customer.City, customer.Country);

  existingCustomer.Move(newAddress);

  _unitOfWork.SaveChanges();
}
```

I hope that i convinced or can inspire some of you, we could and should all benefit from the principles applied in DDD.

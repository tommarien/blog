---
layout: post
title: Why didn't i take the blue pill ?
date: 2011-10-21 21:09
tags:
  - code quality
  - rants
---

Half a decade ago, my interest began to grow for **Test Driven Development**. After some research i stumbled my way into the wonderful world of [NUnit](http://nunit.org).

After one year of experimenting with TDD, i began to grasp that the last D in TDD should have been standing for "**Design**" and not for "**Development**". As creating testable classes means making use of dependency injection in some way, making classes that do only one thing and do it great,...

> But wait isn't that the **SOLID** Design principle?

After that i took a leap into ORM, because i was tired of repeating myself, and writing the same _"SELECT x,y,z FROM TableX"_ over and over again. Got introduced into [NHibernate](http://nhforge.org), as for the time being it was the only existing ORM and it enabled me to use JAVA tech's as a reference.

After that i started reading about **Domain Driven Design** and later on **Command Query Separation**.

And now about 3 years later, i begin to wonder, wouldn't i have been a **happier person** if i didn't learn about all of this. Because the only thing i see people do is :

- Methods with an average of 300 lines of code
- Grouping those methods in classes with an average 2k lines of code
- Making "domain models" that are bound to the table design with no behavior in them only get/set properties
- Making classes/methods that have so many responsibilities that they hide the implementation
- Not separating business logic from infrastructure code

And when it's all in place trying to apply TDD to it.

So it makes me wonder ...

> WHY OH WHY DIDN'T I TAKE THE BLUE PILL?

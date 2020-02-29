---
layout: post
title: "Shouldly: how assertions should have been all along"
date: 2014-07-12 20:47:00
updated: 2014-07-12 20:47:00
tags:
  - csharp
  - test driven development
---

A couple of years ago i published a [comparison post on NUnit vs MsTest](/blog/2012/04/16/showdown-mstest-vs-nunit). One of the main benefits i felt NUnit had in comparison with MsTest was the richness of the assertion library it included.

Recently i stumbled upon an assertion framework called [Shouldly](http://shouldly.github.io/). And i must say i am very **impressed** by it. If i would ask myself the question again whether i would prefer NUnit over MsTest, my answer would be:

> It doesn't matter as long as we can include Shouldly as assertion library.

What i liked:

- Very **natural** API, did not have to second guess the usage (think about Assert.AreGreater)
- Due to **clever inspection** of called method or property it even changed the way i named variables in tests, because they could tell part of the story (instead of using var verify all over the place, because it would have made no difference when test failed)
- Mature and helpful maintainer **community** (logged a bug, got response same day)

The [Shouldly site](http://shouldly.github.io/) contains sufficient info to get started. Give it a try, maybe you like it as much as I do!

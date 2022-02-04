---
layout: post
title: 'XP Teams: Tips and pitfalls'
permalink: blog/2013/04/28/xp-teams-tips-and-pitfalls/index.html
date: 2013-04-28
updatedDate: 2015-12-02
tags:
  - post
  - opinion
---

## There is an ‘I’ in Silence

If all team members seem very occupied and don’t say a word except maybe on your daily stand-up meetings, then you probably **don’t have a team** at all. Teams that are not communicating could be **developing next to each other**. All those different parts of software need to form a whole, also known as your product. Good teams need to **communicate** whenever the need arises, form code-pairs naturally and should be **having fun** while working.

## Domain is king

In absence of a domain expert, tackle every new story in pair. The domain of the application is the **most important** and the most **unambiguous** part of the application. Invest some time in it !

- Use a whiteboard (or tool) to draw the basic layout of the domain needed to create.
- Focus on naming and aggregate separation.
- Instead of talking about properties (especially the naked primitive ones) focus on methods, associations and value objects.

**Important**: Domain models contain business logic and not only properties ([Anemic Domain Model](http://martinfowler.com/bliki/AnemicDomainModel.html)), no point in trying to avoid that, your domain model is specific to the project it was created for.

## Stop the future developing train

Except maybe fortune tellers, no one is able to predict the future. But as it comes to developers, it seems that most of them think they are talented fortune tellers. While developing a user story, they create pieces of code they think are reusable, micro frameworks, but in reality are rarely reused. Every time you as developer start thinking: Hey I should refactor and try to make it reusable, **stop it right there, wait until the need arises**. ([YAGNI](http://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it))

## The misconception of DRY

> “Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

The [DRY](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself) principle is so much abused in software development. It is abused to mold two pieces of non-related code into one, just to reuse code. Copying code once does not form a problem, because you cannot predict if two objects just seem to behave similar or have truly shared behavior. Copying the same piece, a third time should ring an alarm bell.

## The chase of code coverage

Every unit test should exist to prove a functional requirement, not just to cover a piece of code perfectly. Non meaningful tests are a drag and can complicate future refactoring’s more than having only 65% of your code covered. ([see Code coverage considered harmful](http://adiws.blogspot.it/2012/04/code-coverage-considered-harmful.html))

A way to avoid this is to write your tests first ([TDD](http://en.wikipedia.org/wiki/Test-driven_development")), but please **stop finding excuses to not write tests** !

## Every rectangle is a square

When working in an object-oriented language, always be careful with inheritance. Use it wisely and scarce. **Favor composition over inheritance**. For me personally inheriting from another object means that the subtype is the base type. Never use inheritance just because objects share the same properties, it’s all about behavior not about data.
A clear example: Even though an eagle and an ostrich are both birds, only 1 of them can fly.

## The hidden perfectionist

When working together on a project, there will exist different opinions on how “quality” code should look like. Sometimes there may be a need to have code reviews. The entire idea behind code reviews is that **both the reviewer as the author** can **learn** something new. If you act as the reviewer always work in pair with the author of the code. Never, and I mean never refactor the code without communication. Remember the intention is to **discuss** about the code not to play a game of ping-pong.

Being right or wrong is just a matter of who is the beholder.

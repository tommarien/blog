---
title: ! "Showdown: MsTest Vs NUnit"
date: 2012-04-16
lastmod: 2012-04-16
tags:
  - csharp
---

More and more **businesses** these days seem to understand the **value** of **unit-tests**. They want a safety net to protect their software investment.

But do they know that **choosing a test framework** is a choice that sticks for the entire project lifetime? As no one is going to rewrite all the tests for a specific project, just because the testing framework changed. The cost of doing that would be too high. So choosing a testing framework is really important at the startup of a project.

By the time Team Foundation Server was marketed and integration for MsTest came out of the box, more and more companies thought MsTest is/was the best choice. But is it?

I've been using NUnit for the largest part of my career, but the last two years I've been seeing more and more businesses having MsTest as test framework.

The test framework choice might come up again with the launch of the new TFS version as **test framework openness** is one of the features.

More and more people i know seem to think that MsTest is equivalent to NUnit or even better. But is it?

### Startup

#### MsTest

Needs a specific project type, 'Test Project', which means you will automatic have the right reference and the correct project type guid.

#### NUnit

Does not require any specific project type, but most of the time people will add a class library to separate their code from their unittests. You need to reference the nunit.framework.dll yourself. But if you use nuget this will be done for you automatic while installing NUnit.

**Conclusion**: If you go for out of the box experience i would say MsTest wins this section, otherwise i would say a draw between MsTest and NUnit.

### Attributing classes and methods

Both frameworks separate the apples from the pears trough attributes.

#### MsTest

- AssemblyInitialize, AssemblyCleanup are two special attributes that can be used to bootstrap or teardown your test assembly
- TestClass with ClassInitialize -> TestInitialize -> TestMethod -> TestCleanup -> ClassCleanup

#### NUnit

- TestFixture with TestFixtureSetup -> Setup -> Test -> TearDown -> TestFixtureTearDown

**Conclusion**: Apart for the missing AssemblyInitialize and Cleanup both frameworks are on par with each other, i must admit MsTest wins this section also, but i would like to point out the fact that having to bootstrap or teardown your test assembly is probably a smell that you are doing something wrong.

### Categorize, Ignore, ...

#### MsTest

- TestCategory
- Ignore
- Timeout
- ExpectedException

#### NUnit

- Category
- Ignore
- Timeout
- ExpectedException : Although this attribute has been deprecated and replaced by Assert.Throws it has more options than the MsTest version

**Conclusion**: I think both frameworks are on par with each other if you look at the basic attributes, but NUnit still has some gems, like Explicit, which will make the test run only when explicitly told so, but there are many more like SetCulture and SetUiCulture. In terms of language completeness i think NUnit wins this section.

### Assert

#### MsTest

- Assert, StringAssert and CollectionAssert

#### NUnit

- Assert, StringAssert and CollectionAssert, Exception Asserts ( Assert.Throws, Assert.Catch etc), File Asserts, Directory Asserts

**Conclusion**: Again the basics are present in both frameworks but the language richness of NUnit makes it to win this section.

### Extensibility

Clearly NUnit wins this section see <a href="http://www.nunit.org/index.php?p=extensibility&amp;r=2.5.10">http://www.nunit.org/index.php?p=extensibility&r=2.5.10</a>

### Data driven tests

#### MsTest

- Takes a file based approach with DataSource to provide testing values, which is nice but you will always have to need to add csv, excel or xml data file

#### NUnit

- Does not have a build in support for filebased datasources but it does have many attributes that can be used to provide values in your test code directly like TestCase and TestCaseSource

**Conclusion**: This section depends on personal preference. For me i prefer the easy way of NUnit because i see no real point in using a file based approach

---
layout: post
title: Targeting .NET 4.0, what could possibly go wrong?
date: 2014-10-09 19:45:21 +0200
modified: 2015-05-06
categories:
- continuous integration
- pitfalls
- dotnet4
comments: true
sharing: true
footer: true
---
While .NET framework is a highly compatible, in-place update to the Microsoft .NET Framework 4, there are some rough edges that you need to be aware of.

We needed to target .NET 4.0 for a brand new application at a client. We had everything perfectly worked out, continuous integration build set up from day 1.  Next day, a release build with an [Inno Setup](http://www.jrsoftware.org/isinfo.php){:target="_blank"} installer.

Later on, when our PO asked us for some screen shots, we showed him the release build on [TeamCity](http://www.jetbrains.com/teamcity/){:target="_blank"}, where he could just download the artifact and install the application.

He did what we asked him to do, he clicked next-next-finish on the installer and the application was supposed to open for the very first time on his machine, instead he got the following issue:

> Could not load type 'System.Runtime.CompilerServices.ExtensionAttribute' from assembly 'mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089'.

At first a bit puzzled by the problem, the google-reflex took over and we started our investigation. Which quickly lead to a very helpfull article on [StackOverflow](http://stackoverflow.com/questions/13748055/could-not-load-type-system-runtime-compilerservices-extensionattribute-from-as){:target="_blank"} and a deep dive [blog post](http://www.hurryupandwait.io/blog/what-you-should-know-about-running-ilmerge-on-net-4-5-assemblies-targeting-net-4-0){:target="_blank"} of Matt Wrock about il-merging.

Apparantly in .NET 4.5, Microsoft decided it was time to move/refactor a couple attributes from System.Core assembly to mscorlib. The types still exist in System.Core but with a [TypeForwardedToAttribute](http://msdn.microsoft.com/en-us/library/system.runtime.compilerservices.typeforwardedtoattribute.aspx){:target="_blank"} to their new home in mscorlib.

I wanted to know how this was possible and how we could have missed it.

Looking at the CI build, a build warning indicated the issue: 

> warning MSB3644: The reference assemblies for framework ".NETFramework,Version=v4.0" were not found. To resolve this, install the SDK or Targeting Pack for this framework version or re-target your application to a version of the framework for which you have the SDK or Targeting Pack installed. Note that assemblies will be resolved from the Global Assembly Cache (GAC) and will be used in place of reference assemblies. Therefore your assembly may not be correctly targeted for the framework you intend.

**Resolution**: Either install .NET SDK (windows 7 sdk) or make sure your build server has the reference assemblies for .NET 4, which are located in:

> "\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.0".

To verify you can quickly open the assembly with ildasm and look at it's manifest:

###### Missing reference assemblies

{% highlight text %}
  .custom instance void [mscorlib]System.Runtime.CompilerServices.ExtensionAttribute::.ctor() = ( 01 00 00 00 )
{% endhighlight %}

###### Correct reference assemblies

{% highlight text %}
  .custom instance void [System.Core]System.Runtime.CompilerServices.ExtensionAttribute::.ctor() = ( 01 00 00 00 ) 
{% endhighlight %}
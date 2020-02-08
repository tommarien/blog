---
layout: post
title: "What Is the Point of the #region Preprocessor Directive?"
date: 2011-10-22 10:00
tags:
  - csharp
  - code quality
---

### Definition taken from MSDN

> **#region** lets you specify a block of code that you can expand or collapse when using the outlining feature of the Visual Studio Code Editor. In longer code files, it is convenient to be able to collapse or hide one or more regions so that you can focus on the part of the file that you are currently working on.

### Mind-blowing example

```csharp
public class PieceTheResistence
{
   #region SomeNameShamelesslyPointingAtTheIntendOfTheWrappedCode
      public void MethodOne()
      {
         // Piece of Art code
      }
      public void MethodTwo()
      {
         // Another Piece of Art
      }
   #endregion

   #region SomeOtherNameShamelesslyPointingAtTheIntendOfTheWrappedCode
      public void SecondMethodOne()
      {
         // Piece of Art code
      }
      public void SecondMethodTwo()
      {
         // Another Piece of Art
      }
   #endregion
}
```

Ah, i see, i can collapse the region i am not working on, which will keep me focused on the code i am working on.

### Why am i having problems with keeping me focused on the code i need to work on ?

Could be that i kept up all night, writing some blog posts or playing on my XBOX, PS3. Being deprived of sleep can have negative effects on concentration.

But a much more common scenario is that the class simply has **too much code**, in other words the class has **too many responsibilities**.

Create classes from the regions, so you'll end up with classes with names revealing their intend. IMHO you don't need regions if you design classes following the **Single responsibility principle (SRP)**

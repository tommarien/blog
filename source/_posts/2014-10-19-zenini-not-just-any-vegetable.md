---
layout: post
title: Zenini not just any vegetable
date: 2014-10-19 14:39:15 +0200
categories:
  - csharp
tags:
  - open source
  - ini
---

Sometimes we, developers, tend to have an itch. When i saw that there was a new kid in town ([AppVeyor](https://ci.appveyor.com/projects)) that does free open source continuous integration, i just had to scratch.

As i resend xml configuration files, i love the simplicity of yaml and the older ini file formats.

But if you would like to read ini files in .net you have to do a dll import:

```csharp
[DllImport("KERNEL32.DLL",   EntryPoint = "GetPrivateProfileStringW",
  SetLastError=true,
  CharSet=CharSet.Unicode, ExactSpelling=true,
  CallingConvention=CallingConvention.StdCall)]
private static extern int GetPrivateProfileString(
  string lpAppName,
  string lpKeyName,
  string lpDefault,
  string lpReturnString,
  int nSize,
  string lpFilename);
```

So i thought of creating a simple relaxed ini parsing library called [ZenIni](https://github.com/tommarien/zenini) which you can obtain through Nuget.

## Getting started

```shell
Install-Package zenini
```

### Provider

Everything starts with constructing the provider, which you could register as a static instance in your DI container of choice:

```csharp
using System;
using Zenini;
using Zenini.Readers;

namespace ConsoleApplication5
{
  internal class Program
  {
    private static void Main(string[] args)
    {
      var provider = new IniSettingsProvider(
        new DefaultSettingsReader(StringComparer.OrdinalIgnoreCase));
    }
  }
}
```

The DefaultSettingsReader allows you to specify how strings should be compared so you can choose whether or not to ignore case.

### IIniSettings

The IniSettings class is the in memory representation of your ini file, which consists out of sections with or without nested key/value pairs.

```csharp
IIniSettings settings = provider.FromFile(@"c:\Temp\DefaultSettings.ini");
```

### Sections

Getting a section is as easy as

```csharp
ISection firstSection = settings["SectionOne"];
```

Even if the original file did not contain the section if will never return null, it will return the static instance Section.Empty. This to relieve you from checking for null when you need to access a value.

### Values

Given the following ini file

```ini
[SectionOne]
Status=Single
Name=Derek
Value=Yes
Age=30
Single=True
```

To get the status you just have to do:

```csharp
var status = settings["SectionOne"].GetValue("Status");
```

## Extensions

There are some extension methods to help you with common used types like booleans and integer values. Given the same ini file, to get the age setting you call:

```csharp
int? age = settings["SectionOne"].GetValueAsInt("Age");
```

It returns a nullable, so if your ini file does not contain the setting you can just add a default like this:

```csharp
int age = settings["SectionOne"].GetValueAsInt("Age") ?? 25;
```

Just give it a spin, it's small and very easy. The [specification](https://github.com/tommarien/zenini/wiki/Specification) is documented on the wiki.

---
layout: post
title: Take control of your configuration
date: 2012-04-12 15:13
tags:
  - csharp
  - test driven development
  - configuration
---

Using configuration values can sometimes be hard to get a SUT thoroughly tested. Especially when you have behavior tied to those configuration values.

Consider this simple scenario where we have a component that will throw errors depending on an appsetting value, if the value is false it will silently ignore those errors. Either way you will have code in your component like this:

```csharp
public class SomeComponent
{
  public void AMethod()
  {
    try
    {
      // Some magical moment
    }
    catch (Exception e)
    {
      bool throwErrors = true;
      bool parsed;

      if (bool.TryParse(ConfigurationManager.AppSettings["ThrowErrors"], out parsed)) throwErrors = parsed;

      logger.Error(e);

      if (throwErrors) throw;
    }
  }
}
```

How would you handle this in your unit tests, adding a real configuration file to your testing assembly will not cover all scenario's as you could only provide one value for your 'ThrowErrors' key, probably you could think of a nice solution to test more scenario's, but still you need to maintain the extra configuration file for your testing assembly.

## Adapter pattern to the rescue

What if we could solve this nasty static dependency to ConfigurationManager. Let's start by creating a simple abstraction

```csharp
using System.Collections.Specialized;
namespace Redux.Configuration
{
  public abstract class ConfigurationManagerBase
  {
    public abstract NameValueCollection AppSettings { get; }
    public abstract string ConnectionString(string name);
    public abstract T GetSection<T>(string sectionName) where T : class;
  }
}
```

This will give us a nice, clean and mockable abstraction for all your configuration needs. Now add an adapter for the static ConfigurationManager that inherits this abstraction:

```csharp
using System.Collections.Specialized;
using System.Configuration;
namespace Redux.Configuration
{
  public class ConfigurationManagerAdapter : ConfigurationManagerBase
  {
    public override NameValueCollection AppSettings
    {
      get { return ConfigurationManager.AppSettings; }
    }

    public override string ConnectionString(string name)
    {
      var connectionString = ConfigurationManager.ConnectionStrings[name];
      return connectionString != null ? connectionString.ConnectionString : null;
    }

    public override T GetSection<T>(string sectionName)
    {
      var section = ConfigurationManager.GetSection(sectionName);
      return section as T;
    }
  }
}
```

Add tests for this adapter so that we have every possible scenario covered. This takes us closer to the real implementation of 'SomeComponent' as we now have a mockable dependency to take in. We could stub the AppSettings property to return a NameValueCollection so we can cover every possible scenario. But still this would not clean up the code for our magical method on our component.

Let's add a string extension to take all that parsing stuff out of the real method.

```csharp
namespace Redux.Extensions
{
  public static class StringExtensions
  {
    public static bool TryParseAsBoolean(this string value, bool defaultValue = false)
    {
      bool parsed;
      return bool.TryParse(value, out parsed) ? parsed : defaultValue;
    }
  }
}
```

And finally create a type-safe appsettings class with a dependency to our abstraction

```csharp
using Redux.Extensions;
namespace Redux.Configuration
{
  public class AppSettings
  {
    public AppSettings(ConfigurationManagerBase configurationManager)
    {
      ThrowErrors = configurationManager.AppSettings["ThrowErrors"].TryParseAsBoolean(true);
    }

    public virtual bool ThrowErrors { get; private set; }
  }
}
```

Let's look at the final solution for our component

```csharp
using System;
using Redux.Configuration;
namespace Redux
{
  public class SomeComponent
  {
    private readonly AppSettings appSettings;

    public SomeComponent(AppSettings appSettings)
    {
      this.appSettings = appSettings;
    }

    public void AMethod()
    {
      try
      {
        // Some magical moment
      }
      catch (Exception e)
      {
        Logger.Error(e);
        if (appSettings.ThrowErrors) throw;
      }
    }
  }
}
```

Sometimes creating simple infrastructure classes can cleanup existing code and improve it's readability. But the biggest surplus is we created a way to mock configuration values.

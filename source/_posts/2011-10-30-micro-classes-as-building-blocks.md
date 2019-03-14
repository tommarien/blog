---
layout: post
title: Micro-classes as building blocks
date: 2011-10-30 22:32
categories:
  - Code Quality
  - Object Oriented
  - Opinion
---

I am pretty sure that everyone already used a micro-class in code. Everytime you use a static class that contains only constants, you are using a micro-class (for example **ResourceKeys** or **Roles**).

```csharp
public static class Roles
{
  public const string Administrator = "Administrator";
  public const string PowerUser = "PowerUser";
  public const string User = "User";
}
```

## What is a micro-class?

A micro-class is a basically a wrapper class around a [built-in Type](http://msdn.microsoft.com/en-us/library/ya5y69ds%28v=vs.80%29.aspx "Built-In Types Table") (or Types). It could have overridden equality members, GetHashCode and/or have implicit operators.

```csharp
public class MicroClass
{
  public MicroClass(string value)
  {
    Value = value;
  }

  public string Value { get; private set; }
}
```

### Is  "property" just any "built-in type"?

Any time you are using a built-in Type, you should be asking yourself is {property} just any {built-in Type}.

- _Path_: Is Path just any string?
- _BirthDate_: Is BirthDate just any nullable DateTime?
- _Amount_: Is amount just any double?
- _Angle_: Is Angle just any double?
- _Email_: Is Email just any string?

When the answer to the question is 'no', then the property is a good candidate for a micro-class.

## Examples

### Horoscope

When thinking about a Horoscope sign, one could just say it's a string holding the name of the sign:

```csharp
public static class Horoscope
{
  public const string Aquarius = "Aquarius";
}
```

Or we could use an Enum to define possible values:

```csharp
public enum HoroscopeEnum
{
  Aquarius = 0
}
```

Or we could use a micro-class for it:

```csharp
public class Horoscope
{
  public static readonly Horoscope Aquarius = new Horoscope("Aquarius");

  private Horoscope(string name)
  {
    Name = name;s
  }

  public string Name { get; private set}
}
```

Although the micro-class needs a little more code, it has the advantage when it comes to adding behavior and properly encapsulation that behavior. As shown here:

```csharp
public class Horoscope
{
  public static readonly Horoscope Aquarius = new Horoscope("Aquarius", new DateTime(1753, 1, 20), new DateTime(1753, 2, 18));
  public static readonly Horoscope Pisces = new Horoscope("Pisces", new DateTime(1753, 2, 19), new DateTime(1753, 3, 20));
  public static readonly Horoscope Aries = new Horoscope("Aries", new DateTime(1753, 3, 21), new DateTime(1753, 4, 19));
  public static readonly Horoscope Taurus = new Horoscope("Taurus", new DateTime(1753, 4, 20), new DateTime(1753, 5, 20));
  public static readonly Horoscope Gemini = new Horoscope("Gemini", new DateTime(1753, 5, 21), new DateTime(1753, 6, 21));
  public static readonly Horoscope Cancer = new Horoscope("Cancer", new DateTime(1753, 6, 22), new DateTime(1753, 7, 22));
  public static readonly Horoscope Leo = new Horoscope("Leo", new DateTime(1753, 7, 23), new DateTime(1753, 8, 22));
  public static readonly Horoscope Virgo = new Horoscope("Virgo", new DateTime(1753, 8, 23), new DateTime(1753, 9, 22));
  public static readonly Horoscope Libra = new Horoscope("Libra", new DateTime(1753, 9, 23), new DateTime(1753, 10, 23));
  public static readonly Horoscope Scorpio = new Horoscope("Scorpio", new DateTime(1753, 10, 24), new DateTime(1753, 11, 21));
  public static readonly Horoscope Sagittarius = new Horoscope("Sagittarius", new DateTime(1753, 11, 22), new DateTime(1753, 12, 21));
  public static readonly Horoscope Capricorn = new Horoscope("Capricorn", new DateTime(1753, 12, 22), new DateTime(1753, 1, 19));

  private Horoscope(string name, DateTime minDate, DateTime maxDate)
  {
    Name = name;
    MinimumDate = minDate;
    MaximumDate = maxDate;
  }

  public string Name { get; private set; }
  public DateTime MinimumDate { get; private set; }
  public DateTime MaximumDate { get; private set; }

  public static IEnumerable All
  {
    get
    {
      yield return Aquarius;
      yield return Pisces;
      yield return Aries;
      yield return Taurus;
      yield return Gemini;
      yield return Cancer;
      yield return Leo;
      yield return Virgo;
      yield return Libra;
      yield return Scorpio;
      yield return Sagittarius;
      yield return Capricorn;
    }
  }

  public bool Matches(DateTime date)
  {
    var month = date.Month;
    var day = date.Day;

    if (month == 2 && day == 29) day--;

    var bDate = new DateTime(1753, month, day);

    return MinimumDate <= bDate && bDate <= MaximumDate;
  }

  public static Horoscope For(DateTime date)
  {
    return All.Single(x => x.Matches(date));
  }

  public override string ToString()
  {
    return Name;
  }
}
```

### BirthDate

With a birthdate we are usually not interested in hours, minutes or seconds, we just want to store the date of birth:

```csharp
public class BirthDate
{
  private readonly DateTime? birthDay;

  public BirthDate(DateTime? birthday)
  {
    birthDay = birthday.HasValue ? birthday.Value.Date : birthday;
  }

  public BirthDate(int year, int month, int day)
  {
    birthDay = new DateTime(year, month, day);
  }

  public DateTime? BirthDay
  {
    get { return birthDay; }
  }

  public override string ToString()
  {
    return string.Format("{0:dd/MM}", birthDay);
  }
}
```

Calculating the age becomes as easy as this:

```csharp
public int CalculateAge(DateTime date)
{
  date = date.Date;
  if (!BirthDay.HasValue || BirthDay.Value > date) return 0;
  var age = date.Year - BirthDay.Value.Year;
  if (date < BirthDay.Value.AddYears(age)) age--;
  return age;
}
```

Now with reusing the horoscope micro-class, we can add that behavior to birthdate:

```csharp
public Horoscope GetHoroscope()
{
  return !birthDay.HasValue ? null : Horoscope.For(birthDay.Value);
}
```

### Angle

How about an angle micro-class, that has by default a degrees, minutes, seconds ToString() representation and normalizes negative angles etc

```csharp
public class Angle
{
  public Angle()
  {
  }

  public Angle(double value)
  {
    this.Value = Normalize(value);
  }

  public double Value { get; private set; }

  public int Degrees
  {
    get { return (int) Math.Floor(ToTimeSpan().TotalHours); }
  }

  public int Minutes
  {
    get { return ToTimeSpan().Minutes; }
  }

  public int Seconds
  {
    get { return ToTimeSpan().Seconds; }
  }

  private TimeSpan ToTimeSpan()
  {
    return TimeSpan.FromHours(Math.Abs(Value));
  }

  private double Normalize(double angle)
  {
    if (angle == 0.0) return 0.0;
    var rest = Math.Abs(angle)%360;
    var sign = Math.Sign(angle);
    return sign == -1 ? rest\*sign + 360.0 : rest;
  }

  public override string ToString()
  {
    return string.Format("{0}° {1}' {2}\"", Degrees, Minutes, Seconds);
  }
}
```

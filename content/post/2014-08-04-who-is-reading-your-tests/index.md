---
title: Who is reading your tests?
date: 2014-08-04
lastmod: 2014-08-04
tags:
  - csharp
---

As the entire **"TDD is dead"** revolt is taking place, let's not talk about the importance of tests nor about the difference between integration, unit and load tests. But instead ask ourselves the following question if we do decide to add tests to our project:

> Who is the audience/stakeholder of these tests?

## Who could be the audience?

- Is it the **next developer** trying to make sense of this unmaintainable puddle of misery?
- Is it the **analyst** clicking on the build server's tests tab?
- Is it **you**, after a two year pause, implementing a new feature?
- Is it **you**, now, just making sure the implementation behaves as expected?
- ...

## Given Scenario

> A user must be able to log in using his username/password.

This looks like something that could have been taken from an analysis document or could be the description on the post-it on your agile board. Now suppose you are assigned with this task, how would you organize your tests?

Let's make it as 'fugly' as we can:

```csharp
public interface IAuthenticationService
{
  bool Authenticate(string user, string password);
}
```

If we start with the simplest thing we could go for a test class called AuthenticationServiceTests. But that would quickly become a big ball of mud as we start thinking about the possible tests:

- Authenticating with a user and password returns true if user is known and password matches
- Authenticating with an unknown user returns false
- Authenticating with an invalid password returns false
- Authenticating with and null or empty user throws a businessexception
- Authenticating with an invalid password should increment the failed logon attempts counter, to make sure we can lock out users after 3 attempts
- Authenticating with an unconfirmed registered user throws a business exception
- ...

### How about this?

```csharp
[TestFixture]
public class When_user_logs_on_using_username_and_password
{
  [Test]
  public void it_returns_true()
  {
  }

  [Test]
  public void it_resets_failed_logon_attempts()
  {
  }

  [Test]
  public void it_updates_last_logon()
  {
  }
}
```

You could debate about not following standard .net naming conventions, but this clearly specifies our requirement. But it also involves code side effects which are necessary but may have a complete different audience (ref tests 2 and 3). This could mean you may need to organize them in that way:

- it_resets_failed_logon_attempts is related to locking out users after 3 attempts
- it_updates_last_logon could be related to tracking we need to do
- it_returns_true seems a little bit technical, in fact we just express that it worked or was successful, maybe it_indicates_success could be better.

Now what happens if we logon with an unknown user, mmm, this seems database oriented, if the record does not exist in the database, the user can not login. But in real life it could mean that the user just did not register on our site or forgot his logon credentials!

So you might go for this:

```csharp
[TestFixture]
public class When_an_unknown_or_unregistered_user_logs_on
{
    [Test]
    public void it_indicates_failure()
    {
    }
}
```

I hope I trickled your mind a bit and that I got the message trough. Expressive **tests are hard work** but can be very useful.

Just having full code coverage and tests where you need to deep-dive into the code to find out what they are doing may not be the point of your tests.

> Tests are a way to express what the code is doing or should be doing ;)

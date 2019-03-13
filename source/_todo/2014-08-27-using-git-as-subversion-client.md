---
layout: post
title: Using git as subversion client
date: 2014-08-27 07:23:40 +0200
updated: 2014-10-05 09:45:35 +0200
categories:
- git
- subversion
comments: true
sharing: true
footer: true
---
Almost a decade ago, a company I worked for, started using *Subversion* which was a great step forward coming from *Visual Source Safe*.

Today, the landscape is totally different, but on enterprise level not much has changed. Some of the companies use *Team Foundation Server* which is great if you like total integration, but it's source control system is not that great.
Others remained with *Subversion*.

They might be thinking of going to *Git*, but most of them are afraid of the learning curve. As with all learning processes, you just have to start somewhere, just dive-in, step by step you'll start learning Git.

## Getting Started
As a fan of [Chocolatey](http://chocolatey.org){:target="_blank"} as machine package manager, just enter at command prompt

{% highlight text %}
cinst git
{% endhighlight %}

Or [download](http://msysgit.github.io){:target="_blank"} the installer for git (at the moment it's version 1.9.4).

## Checking out the repository

If your Subversion has the default trunk, branches, tags layout

{% highlight text %}
git svn clone -s <repo_url> --prefix svn/
{% endhighlight %}

The -s switch is a shortcut for

{% highlight text %}
git svn clone -T trunk --t tags --b branches <repo_url> --prefix svn/
{% endhighlight %}

This will checkout the trunk of the repository by default. Now suppose your repository already had a branch called Test:

{% highlight text %}
> git branch -a
* master
  remotes/svn/Test
  remotes/svn/trunk
{% endhighlight %}

## Advanced: Shallow clone
As the default approach above will crawl trough all svn revisions which can be very slow, if you are in an environment where they are using a single Svn repository with a lot of revisions for different projects, you could be looking at a few hours, days or even weeks (+ 150000 revisions). In that particular use case follow this approach:

### Get first revision of directory in gigantic repository

{% highlight text %}
svn log <repo_url>
{% endhighlight %}

The lowest/first revision number is what you are looking for, if you want full history in git on the project. If you just wanna checkout you can use the last revision number.

### Checkout repository

{% highlight text %}
git svn clone -s <repo_url> --prefix svn/ -r <first-revision>
{% endhighlight %}

This will initialize an empty git repository, now get the trunk

{% highlight text %}
git svn rebase
{% endhighlight %}

If you would look at your branches you would see that the test branch is not there in this case !

{% highlight text %}
> git branch -a
* master
  remotes/svn/trunk
{% endhighlight %}

To get the remote branch to appear you need to

{% highlight text %}
git svn fetch
{% endhighlight %}

## Updating your repository

{% highlight text %}
git svn rebase
{% endhighlight %}

It will fetch latest changes from the trunk and will try to rebase your work on top of it. If any conflicting changes where made, you'll have to merge them.

## Committing your changes
{% highlight text %}
git svn dcommit
{% endhighlight %}

## Further reading
 * [Git and Subversion](http://git-scm.com/book/en/Git-and-Other-Systems-Git-and-Subversion){:target="_blank"}
 * [Effectively Using Git With Subversion](http://viget.com/extend/effectively-using-git-with-subversion){:target="_blank"}
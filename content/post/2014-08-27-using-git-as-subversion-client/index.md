---
title: Using git as subversion client
date: 2014-08-27
lastmod: 2014-08-27
tags:
  - scm
---

Almost a decade ago, a company I worked for, started using _Subversion_ which was a great step forward coming from _Visual Source Safe_.

Today, the landscape is totally different, but on enterprise level not much has changed. Some of the companies use _Team Foundation Server_ which is great if you like total integration, but it's source control system is not that great.
Others remained with _Subversion_.

They might be thinking of going to _Git_, but most of them are afraid of the learning curve. As with all learning processes, you just have to start somewhere, just dive-in, step by step you'll start learning Git.

## Getting Started

As a fan of [Chocolatey](http://chocolatey.org) as machine package manager, just enter at command prompt

```shell
cinst git
```

Or [download](http://msysgit.github.io) the installer for git (at the moment it's version 1.9.4).

## Checking out the repository

If your Subversion has the default trunk, branches, tags layout

```shell
git svn clone -s <repo_url> --prefix svn/
```

The -s switch is a shortcut for

```shell
git svn clone -T trunk --t tags --b branches <repo_url> --prefix svn/
```

This will checkout the trunk of the repository by default. Now suppose your repository already had a branch called Test:

```shell
> git branch -a
* master
  remotes/svn/Test
  remotes/svn/trunk
```

## Advanced: Shallow clone

As the default approach above will crawl trough all svn revisions which can be very slow, if you are in an environment where they are using a single Svn repository with a lot of revisions for different projects, you could be looking at a few hours, days or even weeks (+ 150000 revisions). In that particular use case follow this approach:

### Get first revision of directory in gigantic repository

```shell
svn log <repo_url>
```

The lowest/first revision number is what you are looking for, if you want full history in git on the project. If you just wanna checkout you can use the last revision number.

### Checkout repository

```shell
git svn clone -s <repo_url> --prefix svn/ -r <first-revision>
```

This will initialize an empty git repository, now get the trunk

```shell
git svn rebase
```

If you would look at your branches you would see that the test branch is not there in this case !

```shell
> git branch -a
* master
  remotes/svn/trunk
```

To get the remote branch to appear you need to

```shell
git svn fetch
```

## Updating your repository

```shell
git svn rebase
```

It will fetch latest changes from the trunk and will try to rebase your work on top of it. If any conflicting changes where made, you'll have to merge them.

## Committing your changes

```shell
git svn dcommit
```

## Further reading

- [Git and Subversion](http://git-scm.com/book/en/Git-and-Other-Systems-Git-and-Subversion)
- [Effectively Using Git With Subversion](http://viget.com/extend/effectively-using-git-with-subversion)

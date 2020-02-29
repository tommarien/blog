---
title: From undefined to null
tags:
  - javascript
---

In my honest opinion, **Javascript** continues to be one of the most misunderstood languages on the planet. You'll find evidence of this all over the internet, the [Wat talk by Gary Bernhardt](https://www.destroyallsoftware.com/talks/wat) is my personal favorite.

We'll start with two [primitives](https://developer.mozilla.org/en-US/docs/Glossary/Primitive), `undefined` and `null`. Why do they both exist and what is the difference between them?

## `undefined`

The value that gets assigned to just declared variables or to `function` parameters that are not given.

```js
// 1. Unassigned variable
let variable;
console.log(variable); // => undefined

// 2. Missing function parameter
function greet(name) {
  console.log(name);
}

greet(); // => undefined
```

## `null`

Represents the **intentional** absence of a value, it's a semantical difference. Let's look at an example:

```js
const notDotted = 'googlebe';
console.log(notDotted.match(/\w+\.\w+/)); // => null
```

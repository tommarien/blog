---
title: Practice makes purrfect
tags:
  - react
  - typescript
---

Usually when i want to practice componentization, i'll take a [Bootstrap](https://getbootstrap.com/) component and just start. This time it was my old favorite the [Alert](https://getbootstrap.com/docs/4.4/components/alerts/) component. The nice thing about these exercises is that if you create the same component more than once you can gradually start seeing the progress you made.

## Basic

So according to the documentation an alert in it's most basic form exists out of the following things

```html
<div class="alert alert-primary" role="alert">
  A simple primary alert—check it out!
</div>
```

- a `div` with _alert_ role
- root class: alert
- contextual classes: primary, secondary, success, danger, warning, info, light and dark (alert-{contextual} class)

```tsx
import React, { ReactNode } from 'react';

export type AlertProps = {
  children: ReactNode;
  variant:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';
};

const BS_ROOT = 'alert';

function Alert({ children, variant, heading }: AlertProps): JSX.Element {
  return (
    <div role="alert" className={`${BS_ROOT} ${BS_ROOT}-${variant}`}>
      {children}
    </div>
  );
}

export default Alert;
```

## Heading

```html
<div class="alert alert-success" role="alert">
  <h4 class="alert-heading">Well done!</h4>
  <p>
    You made it.
  </p>
</div>
```

Let's think about this for a while, normally i would advise to create a utility component for the heading:

```tsx
export type AlertHeadingProps = {
  children: ReactNode;
};

function AlertHeading({ children }: AlertHeadingProps): JSX.Element {
  return <h4 className={`${BS_ROOT}-heading`}>{children}</h4>;
}
```

So the resulting component structure would look like:

```tsx
function App(): JSX.Element {
  return (
    <Alert variant="success">
      <AlertHeading>Well done!</AlertHeading>
      <p>You made it.</p>
    </Alert>
  );
}
```

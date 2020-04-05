---
title: How to alert the user
tags:
  - react
  - typescript
---

Usually when i want to practice componentization, i'll take a [Bootstrap](https://getbootstrap.com/) component and just start. This time it was my old favorite the [Alert](https://getbootstrap.com/docs/4.4/components/alerts/) component. The nice thing about these exercises is that if you create the same component more than once with some time in between you can actually start seeing the progress you made.

## Basic

So according to the documentation an alert in it's most basic form exists out of the following things

- a `div` with _alert_ role
- root class: alert
- contextual classes: primary, secondary, success, danger, warning, info, light and dark (alert-{contextual class})

```ts
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

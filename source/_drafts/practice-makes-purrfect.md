---
title: Practice makes purrfect
tags:
  - react
  - typescript
---

Usually when i want to practice componentization, i look for a candidate in [Bootstrap](https://getbootstrap.com/). The nice thing about these exercises is that if you create the same component more than once, you gradually start seeing the progress you've made. This time we'll practice on the [Alert](https://getbootstrap.com/docs/4.4/components/alerts/) component.

## Basic

So according to the documentation an alert in, it's most basic form, looks like this:

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

Let's think about this for a while, normally i would advise to create a utility component `<AlertHeading />` for the heading, but as there is no added behavior a `string` property looks like a match.

```tsx
import React, { ReactNode } from 'react';

export type AlertProps = {
  children: ReactNode;
  heading?: string;
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
      {heading && <h4 className={`${BS_ROOT}-heading`}>{heading}</h4>}
      {children}
    </div>
  );
}

export default Alert;
```

And if you do need to have more fine-grained control of the html of the heading, you can always transform the `heading` prop into a [slot](https://daveceddia.com/pluggable-slots-in-react-components/), by changing the type from `string` to `ReactNode`.

### Usage

```tsx
import React from 'react';
import Alert from './components/Alerts/Alert';

function App(): JSX.Element {
  return (
    <Alert heading="Well done!" variant="success">
      <p>You made it!</p>
    </Alert>
  );
}
```

If you are interested in my setup or in the tests using `@testing-library/react` you can take a look at my [React Playground Repo](https://github.com/tommarien/react-playground/tree/master/src/components/Alerts).

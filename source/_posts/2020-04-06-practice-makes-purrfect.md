---
title: Practice makes purrfect
tags:
  - react
  - typescript
date: 2020-04-06 22:57:41
updated: 2020-04-06 22:57:41
---

When i want to practice componentization, i usually look for a candidate in a library like [Bootstrap](https://getbootstrap.com/). The nice thing about these exercises is that if you create the same component more than once, you can gradually see the progress you've made. This time we'll practice on the [Alert](https://getbootstrap.com/docs/4.4/components/alerts/) component.

## Basic

So according to the documentation an alert, in it's most basic form, looks like this:

```html
<div class="alert alert-primary" role="alert">
  A simple primary alert—check it out!
</div>
```

- a `div` with _alert_ role
- root class: alert
- contextual classes: primary, secondary, success, danger, warning, info, light and dark (alert-{contextual} class)

### Result

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

function Alert({ children, variant }: AlertProps): JSX.Element {
  return (
    <div role="alert" className={`${BS_ROOT} ${BS_ROOT}-${variant}`}>
      {children}
    </div>
  );
}

export default Alert;
```

### Usage

```tsx
import React from 'react';
import Alert from './components/Alerts/Alert';

function App(): JSX.Element {
  return <Alert variant="primary">A simple primary alert—check it out!</Alert>;
}
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

As there is no extra behavior tied to the heading, a `string` property looks like a perfect match otherwise an utility component `<AlertHeader />` would have been in order.

### Result

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

And if you do need to have more fine-grained control of the html of the heading, you could transform the `heading` property into a [slot](https://daveceddia.com/pluggable-slots-in-react-components/), by changing the type from `string` to `ReactNode`.

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

## Dismissing

```html
<div class="alert alert-warning alert-dismissible fade show" role="alert">
  <strong>Holy guacamole!</strong> You should check in on some of those fields
  below.
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>
```

- a button with the class `close`
- the alert needs to be enriched with the `alert-dismissible` class
- when the user clicks on the dismiss button the alert should no longer be visible

> I choose not to use the Bootstrap JS Library and let the alert itself control the dismissed state, if you ever need to do something more than just hiding the alert, you can always add an optional `onAfterDismiss` function property.

### Result

```tsx
import React, { ReactNode, useState } from 'react';
import classNames from 'classnames';

export type AlertProps = {
  children: ReactNode;
  dismissible?: boolean;
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

function Alert({
  children,
  dismissible,
  heading,
  variant,
}: AlertProps): JSX.Element {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div
      className={classNames(BS_ROOT, `${BS_ROOT}-${variant}`, {
        [`${BS_ROOT}-dismissible`]: dismissible,
      })}
      style={{ display: dismissed ? 'none' : undefined }}
      role="alert"
    >
      {heading && <h4 className={`${BS_ROOT}-heading`}>{heading}</h4>}
      {children}
      {dismissible && (
        <button
          type="button"
          className="close"
          aria-label="Close"
          onClick={() => setDismissed(true)}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}

export default Alert;
```

### Usage

```tsx
import React from 'react';
import Alert from './components/Alerts/Alert';

function App(): JSX.Element {
  return (
    <Alert variant="warning" dismissible>
      <strong>Holy guacamole!</strong> You should check in on some of those
      fields below.
    </Alert>
  );
}
```

> If you are interested in my setup or in the tests using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) you can take a look at my [React Playground Repository](https://github.com/tommarien/react-playground/tree/master/src/components/Alerts).

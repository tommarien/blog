---
layout: post
title: Kiss my default props
excerpt: Typing defaultProps with TypeScript
permalink: blog/2020/07/24/kiss-my-default-props/index.html
tags:
  - post
  - typescript
  - react
date: 2020-07-24
updatedDate: 2020-07-24
---

We'll use the [Bootstrap Badge](https://getbootstrap.com/docs/4.0/components/badge/) component as an example. According to the [Typescript React cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/default_props), when we use Typescript > 3.0, we have to use type inference:

```tsx
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Variant } from './Bootstrap';

const defaultProps = {
  pill: false,
};

export type BadgeProps = {
  children: ReactNode;
  variant: Variant;
} & typeof defaultProps;

const BS_ROOT = 'badge';

function Badge({ children, variant, pill }: BadgeProps): JSX.Element {
  return (
    <span
      className={classNames(BS_ROOT, `${BS_ROOT}-${variant}`, {
        [`${BS_ROOT}-pill`]: pill,
      })}
    >
      {children}
    </span>
  );
}

Badge.defaultProps = defaultProps;

export default Badge;
```

But imho, this looses the clear distinction between your component's required and optional props! I would rather have the following BadgeProps type:

```ts
export type BadgeProps = {
  children: ReactNode;
  variant: Variant;
  pill?: boolean;
};
```

#### An alternative approach

What if we would just use object default values?

```tsx
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Variant } from './Bootstrap';

export type BadgeProps = {
  children: ReactNode;
  variant: Variant;
  pill?: boolean;
};

const BS_ROOT = 'badge';

function Badge({ children, variant, pill = false }: BadgeProps): JSX.Element {
  return (
    <span
      className={classNames(BS_ROOT, `${BS_ROOT}-${variant}`, {
        [`${BS_ROOT}-pill`]: pill,
      })}
    >
      {children}
    </span>
  );
}

export default Badge;
```

See easier and simpler ([KISS](https://en.wikipedia.org/wiki/KISS_principle)) and not only that according to a [tweet](https://twitter.com/dan_abramov/status/1133878326358171650) of Dan Abramov, defaultProps will be eventually deprecated for functional components.

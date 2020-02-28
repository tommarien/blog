---
title: Outsource that data-testid!
tags:
  - javascript
  - react
  - react testing library
date: 2020-02-10 15:05:28
updated: 2020-02-10 20:45:00
---

In **React Testing Library**, the recommended way, after the other queries don't work for your use-case, is to add a [`data-testid`](https://testing-library.com/docs/dom-testing-library/api-queries#bytestid) attribute on the element.

This works for all baked-in React HTML components, for instance on a `<div/>`:

```jsx
import React from "react";

export default function Component() {
  return <div data-testid="some-test-id" />;
}
```

**Spec**

```jsx
import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render } from "@testing-library/react";
import Component from "./Component";

test("it renders as expected", () => {
  const { getByTestId } = render(<Component />);

  expect(getByTestId("some-test-id")).toBeInTheDocument();
});
```

## How to do this with custom components?

Due to the `-` in the name it's not so easy and you will see other property names for it or just hard-coding the the _testId_ into the component:

```jsx
import React from "react";
import { string } from "prop-types";

export default function Component({ testId }) {
  return <div data-testid={testId} />;
}

Component.propTypes = {
  testId: string
};

Component.defaultProps = {
  testId: undefined
};
```

**Spec**

```jsx
test("it renders as expected", () => {
  const testId = "some-test-id";

  const { getByTestId } = render(<Component testId={testId} />);

  expect(getByTestId(testId)).toBeInTheDocument();
});
```

## Preferred approach

As i don't like having two different conventions for specifying the `data-testid` attribute, i would suggest the following:

```jsx
import React from "react";
import { string } from "prop-types";

export default function Component({ "data-testid": dataTestId }) {
  return <div data-testid={dataTestId} />;
}

Component.propTypes = {
  "data-testid": string
};

Component.defaultProps = {
  "data-testid": undefined
};
```

**Spec**

```jsx
test("it renders as expected", () => {
  const testId = "some-test-id";

  const { getByTestId } = render(<Component data-testid={testId} />);

  expect(getByTestId(testId)).toBeInTheDocument();
});
```

> Now you can use `data-testid` for baked-in HTML components as well as your custom components.

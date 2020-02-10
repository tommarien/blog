---
title: Outsource that data-testid!
tags:
  - javascript
  - react
  - react testing library
date: 2020-02-10 15:05:28
---


A common approach in **React Testing Library** is to add a [`data-testid`](https://testing-library.com/docs/dom-testing-library/api-queries#bytestid) attribute on the element.

This works brilliantly for all baked-in React HTML components, for instance:

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

## The problem

I don't like hard-coding any context specific data in my components, usually the consuming component should provide that data.

Due to the `-` in the name it's not so easy to do so and you will see people creating other aliases for it:

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

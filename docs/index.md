---
layout: home

hero:
  name: RASK
  text: Web UI Framework
  tagline: Reactive state with reconciling UI
  image:
    src: /logo.png
    alt: RASK Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/christianalfoni/rask-ui

features:
  - title: Use the language
    details: Use the full power of JavaScript to describe your dynamic UI. No special primitives or magical templating language.

  - title: Reactive state
    details: Plain and simple state management. No stale closures, dependency arrays or other mind straining concepts.

  - title: Consistent and minimalistic
    details: A small set of consistent primitives. No special utilities for edge cases.
---

::: warning FEEDBACK WANTED
RASK has concluded its core implementation including the **Inferno-based reconciler**, **JSX transformation plugin**, and **reactive primitives**. The library is feature-complete and considered ready for release.

[**Share your feedback by creating an issue**](https://github.com/christianalfoni/rask/issues/new) - your input will help shape the final release.
:::

## Quick Example

```tsx
import { useState, render } from "rask-ui";

function Counter() {
  // Setup scope (runs once)
  const state = useState({ count: 0 });

  // Returns render scope (runs on reactive changes)
  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </div>
  );
}

render(<Counter />, document.getElementById("app")!);
```

## Key Features

- **Reactive Hooks**: Component-bound reactive primitives like `useState()`, `useEffect()`, `useComputed()`
- **Lifecycle Hooks**: `useMountEffect()`, `useCleanup()`
- **Context API**: Share state without prop drilling with `createContext()` and related hooks
- **Async Operations**: Built-in `useAsync()` for managing async operations
- **Error Boundaries**: Catch and handle errors gracefully
- **Automatic Batching**: State updates batched automatically
- **TypeScript Support**: Full type inference and safety

## Installation

```bash
npm create rask-ui
```

[Learn more →](/guide/getting-started)

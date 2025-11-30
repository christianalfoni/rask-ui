---
layout: home

hero:
  name: RASK
  text: Reactive React
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
  - title: A different path
    details: What if React embraced reactive state management and did not stray to the server.

  - title: Hooks composition
    details: The hooks composition you know and love, but without stale closures, dependency arrays and a melted brain.

  - title: Scale with context
    details: No more adding a second layer for state management. With reactive state management you can finally scale contexts.
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

- **Reactive Hooks**: Component-bound reactive primitives like `useState()`, `useEffect()`, `useDerived()`
- **Lifecycle Hooks**: `useMountEffect()`, `useCleanup()`
- **Context API**: Share state without prop drilling with `createContext()` and related hooks
- **Async Operations**: Built-in hooks for async handling:
  - `useAsync()` - Fetch data with observation and cancellation
  - `useAction()` - Queue operations with retry support
  - `useSuspend()` - Coordinate multiple async values
- **Error Handling**: `useCatchError()` hook for catching component errors
- **Automatic Batching**: State updates batched automatically
- **TypeScript Support**: Full type inference and safety

## Installation

```bash
npm create rask-ui
```

[Learn more →](/guide/getting-started)

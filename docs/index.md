---
layout: home

hero:
  name: RASK
  text: Reactive State with Reconciling UI
  tagline: A lightweight UI library that combines the simplicity of observable state management with the simplicity of reconciling UI
  image:
    src: /logo.png
    alt: RASK Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/christianalfoni/rask

features:
  - title: Write code that feels natural
    details: Use the full power of JavaScript and JSX without learning special syntax. Your code runs exactly as you write it, no magic.

  - title: Consistent and minimalistic
    details: A small set of consistent primitives. No special utilities - just straightforward tools that work the way you expect.

  - title: Tame async complexity
    details: Built-in tools for handling loading states and data fetching. Transform complex async patterns into simple, declarative code.
---

## Open For Feedback

::: tip WE NEED YOUR FEEDBACK
RASK has concluded its core implementation including the **Inferno-based reconciler**, **JSX transformation plugin**, and **reactive primitives**. The library is feature-complete and considered ready for release.

**Before we officially launch, we need your feedback:**
- Would a library like this be valuable for your projects?
- Is the API clear and intuitive?
- Is the documentation helpful and complete?
- Does the approach make sense to you?

[**Share your feedback by creating an issue**](https://github.com/christianalfoni/rask/issues/new) - your input will help shape the final release.
:::

## Quick Example

```tsx
import { createState, render } from "rask-ui";

function Counter() {
  const state = createState({ count: 0 });

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

- **Observable State**: Create reactive state with `createState()`
- **Computed Values**: Derive state with `createComputed()`
- **Lifecycle Hooks**: `createMountEffect()`, `createCleanup()`
- **Context API**: Share state without prop drilling
- **Async Data**: Built-in `createAsync()`, `createQuery()`, `createMutation()`
- **Error Boundaries**: Catch and handle errors gracefully
- **Automatic Batching**: State updates batched automatically
- **TypeScript Support**: Full type inference and safety

## Installation

```bash
npm create rask-ui
```

Then configure your build tool with the RASK plugin. [Learn more →](/guide/getting-started)

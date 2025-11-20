# Core Functions

The fundamental functions for building RASK applications.

## render()

Mounts a component to a DOM element.

```tsx
render(component, container)
```

### Parameters

- `component: ChildNode` - The JSX component to render
- `container: HTMLElement` - The DOM element to mount into

### Example

```tsx
import { render } from "rask-ui";

render(<App />, document.getElementById("app")!);
```

---

## useState()

Creates a reactive state object. Any property access during render is tracked, and changes trigger re-renders.

```tsx
useState<T>(initialState: T): T
```

### Parameters

- `initialState: T` - Initial state object

### Returns

Reactive proxy of the state object

### Example

```tsx
import { useState } from "rask-ui";

function Example() {
  const state = useState({
    count: 0,
    items: ["a", "b", "c"],
    nested: { value: 42 },
  });

  // All mutations are reactive
  state.count++;
  state.items.push("d");
  state.nested.value = 100;

  return () => <div>{state.count}</div>;
}
```

### Features

- **Deep reactivity** - Nested objects and arrays are automatically reactive
- **Direct mutations** - No setter functions required
- **Efficient tracking** - Only re-renders components that access changed properties
- **Automatic batching** - Multiple updates batched into single render

### Notes

::: warning
Never destructure state objects - it breaks reactivity:

```tsx
// ❌ Bad
const { count } = state;

// ✅ Good
state.count
```
:::

---

## useView()

Creates a view that merges multiple objects (reactive or plain) into a single object while maintaining reactivity through getters.

```tsx
useView<T>(...objects: object[]): T
```

### Parameters

- `...objects: object[]` - Objects to merge (reactive or plain). Later arguments override earlier ones.

### Returns

A view object with getters for all properties, maintaining reactivity

### Example

```tsx
import { useView, useState } from "rask-ui";

function createCounter() {
  const state = useState({ count: 0, name: "Counter" });
  const increment = () => state.count++;
  const decrement = () => state.count--;
  const reset = () => (state.count = 0);

  return useView(state, { increment, decrement, reset });
}

function Counter() {
  const counter = createCounter();

  return () => (
    <div>
      <h1>
        {counter.name}: {counter.count}
      </h1>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
```

### Features

- Maintains reactivity through getters
- Changes to source objects reflected in view
- Supports enumerable properties and symbols
- Merges multiple sources

### Notes

::: warning
Do not destructure view objects - breaks reactivity
:::

---

## createRef()

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
createRef<T>(): Ref<T>
```

### Returns

Ref object with:
- `current: T | null` - Reference to the DOM element or component instance
- Function signature for use as ref callback

### Example

```tsx
import { createRef } from "rask-ui";

function Example() {
  const inputRef = createRef<HTMLInputElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}
```

### Usage

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

### TypeScript

```tsx
// Generic type parameter for specific element types
const inputRef = createRef<HTMLInputElement>();
const divRef = createRef<HTMLDivElement>();
const buttonRef = createRef<HTMLButtonElement>();
```

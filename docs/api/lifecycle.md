# Lifecycle Hooks

Functions for managing component lifecycle.

## useMountEffect()

Registers a callback to run after the component is mounted to the DOM.

```tsx
useMountEffect(callback: () => void | (() => void)): void
```

### Parameters

- `callback: () => void | (() => void)` - Function to call on mount. Can optionally return a cleanup function.

### Example

```tsx
import { useMountEffect } from "rask-ui";

function Example() {
  useMountEffect(() => {
    console.log("Component mounted!");
  });

  return () => <div>Hello</div>;
}
```

### With Cleanup

```tsx
function Timer() {
  const state = useState({ time: Date.now() });

  useMountEffect(() => {
    const interval = setInterval(() => {
      state.time = Date.now();
    }, 1000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  });

  return () => <div>{state.time}</div>;
}
```

### Features

- Runs after component is mounted to DOM
- Can return cleanup function
- Multiple mount effects can be registered
- Cleanup runs when component unmounts

### Use Cases

- Initializing subscriptions
- Starting timers
- Adding event listeners
- Fetching initial data
- Setting up third-party libraries

### Notes

::: warning Important
- Only call during component setup phase (not in render function)
- Can be called multiple times to register multiple callbacks
- Cleanup function is optional
:::

---

## useCleanup()

Registers a callback to run when the component is unmounted.

```tsx
useCleanup(callback: () => void): void
```

### Parameters

- `callback: () => void` - Function to call on cleanup

### Example

```tsx
import { useCleanup, useState } from "rask-ui";

function Example() {
  const state = useState({ time: Date.now() });

  const interval = setInterval(() => {
    state.time = Date.now();
  }, 1000);

  useCleanup(() => {
    clearInterval(interval);
  });

  return () => <div>{state.time}</div>;
}
```

### Multiple Cleanups

```tsx
function Example() {
  const state = useState({ data: null });

  // Subscription
  const unsubscribe = subscribe((data) => {
    state.data = data;
  });
  useCleanup(unsubscribe);

  // Event listener
  const handleResize = () => console.log("resize");
  window.addEventListener("resize", handleResize);
  useCleanup(() => {
    window.removeEventListener("resize", handleResize);
  });

  // Timer
  const interval = setInterval(() => {}, 1000);
  useCleanup(() => clearInterval(interval));

  return () => <div>{state.data}</div>;
}
```

### Features

- Runs when component is removed from DOM
- Multiple cleanups can be registered
- Cleanups run in registration order
- Automatic on unmount

### Use Cases

- Clearing timers
- Removing event listeners
- Canceling subscriptions
- Cleaning up resources
- Aborting fetch requests

### Notes

::: warning Important
- Only call during component setup phase
- Can be called multiple times
- All cleanups run when component unmounts
:::

## Lifecycle Order

Understanding the order of lifecycle events:

```tsx
function Component() {
  console.log("1. Setup phase runs");

  useMountEffect(() => {
    console.log("3. Mount effect runs");

    return () => {
      console.log("5. Mount effect cleanup runs");
    };
  });

  useCleanup(() => {
    console.log("6. Cleanup runs");
  });

  return () => {
    console.log("2. Render function runs (and on every update)");
    return <div>Content</div>;
  };
}
```

**Order:**
1. Setup phase executes
2. Initial render
3. Component mounts, mount effects run
4. Updates trigger render function
5. On unmount: mount effect cleanups run
6. On unmount: registered cleanups run

## Common Patterns

### Timer

```tsx
function Timer() {
  const state = useState({ seconds: 0 });

  useMountEffect(() => {
    const interval = setInterval(() => {
      state.seconds++;
    }, 1000);

    return () => clearInterval(interval);
  });

  return () => <div>Seconds: {state.seconds}</div>;
}
```

### Event Listener

```tsx
function WindowSize() {
  const state = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useMountEffect(() => {
    const handleResize = () => {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return () => (
    <div>
      {state.width} x {state.height}
    </div>
  );
}
```

### Subscription

```tsx
function DataSubscriber() {
  const state = useState({ data: null });

  useMountEffect(() => {
    const unsubscribe = dataStore.subscribe((data) => {
      state.data = data;
    });

    return unsubscribe;
  });

  return () => <div>{state.data}</div>;
}
```

# useCleanup()

Registers a callback to run when the component is unmounted.

```tsx
useCleanup(callback);
```

## Example

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

## Multiple Cleanups

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

## Features

- Runs when component is removed from DOM
- Multiple cleanups can be registered
- Cleanups run in registration order
- Automatic on unmount

## Use Cases

- Clearing timers
- Removing event listeners
- Canceling subscriptions
- Cleaning up resources
- Aborting fetch requests

## Notes

::: warning Important

- Only call during component setup phase
- Can be called multiple times
- All cleanups run when component unmounts
  :::

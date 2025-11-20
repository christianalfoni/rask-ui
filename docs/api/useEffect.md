# useEffect()

Creates an effect bound to the component that automatically tracks reactive dependencies and re-runs whenever they change. The effect runs immediately on creation.

```tsx
useEffect(() => {
  // effect code
  return () => {
    // optional cleanup
  }
})
```

## Parameters

- `callback` - Function to run when dependencies change. Can optionally return a cleanup function that runs before the effect executes again

## Examples

### Basic Effect

```tsx
import { useEffect, useState } from "rask-ui";

function Timer() {
  const state = useState({ count: 0, log: [] });

  // Effect runs immediately and whenever state.count changes
  useEffect(() => {
    console.log("Count changed:", state.count);
    state.log.push(`Count: ${state.count}`);
  });

  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
      <ul>
        {state.log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Effect with Disposal

The callback can return a dispose function that runs before the effect executes again. This is useful for cleaning up subscriptions, timers, or other resources:

```tsx
import { useEffect, useState } from "rask-ui";

function LiveData() {
  const state = useState({ url: "/api/data", data: null });

  // Subscribe to data source, cleanup on re-run
  useEffect(() => {
    const eventSource = new EventSource(state.url);

    eventSource.onmessage = (event) => {
      state.data = JSON.parse(event.data);
    };

    // Dispose function runs before effect re-executes
    return () => {
      eventSource.close();
    };
  });

  return () => (
    <div>
      <input
        value={state.url}
        onInput={(e) => state.url = e.target.value}
      />
      <pre>{JSON.stringify(state.data, null, 2)}</pre>
    </div>
  );
}
```

## Features

- **Immediate execution** - Runs immediately and synchronously on creation during setup
- **Automatic tracking** - Tracks reactive dependencies accessed during execution
- **Synchronous execution** - Runs synchronously with the setup phase, making behavior predictable
- **Automatic cleanup** - Cleaned up when component unmounts
- **Disposal support** - Optional dispose function for cleaning up resources before re-execution

## Use Cases

- Logging state changes
- Syncing to localStorage
- Updating derived state
- Side effects based on state
- Managing subscriptions with automatic cleanup
- Setting up and tearing down event listeners
- Working with timers or intervals

## Notes

::: warning Important
- Only call during component setup phase (not in render function)
- Effect runs synchronously during setup, making it predictable and easier to reason about
- Be careful with effects that modify state - can cause infinite loops
- Dispose functions run before the effect re-executes, not when the component unmounts
- For component unmount cleanup, use `useCleanup()` instead
:::

# inspect()

Enables inspection of reactive state, computed values, and actions for building devtools. This API is **development-only** and has zero overhead in production builds.

```tsx
inspect(root, (event) => {
  // handle inspection event
})
```

## Parameters

- `root` - The reactive object to inspect (state, view, computed, etc.)
- `callback` - Callback receiving inspection events

## Event Types

The callback receives events with the following properties:

- **Mutation events**: `type: "mutation"`, `path`, `value`
- **Action events**: `type: "action"`, `path`, `params`
- **Computed events**: `type: "computed"`, `path`, `isDirty`, `value`

## Basic Example

```tsx
import { inspect, useState, useDerived, useView } from "rask-ui";

function Counter() {
  const state = useState({ count: 0, name: "Counter" });

  const computed = useDerived({
    double: () => state.count * 2,
  });

  const actions = {
    increment: () => state.count++,
    decrement: () => state.count--,
    reset: () => state.count = 0,
  };

  const view = useView(state, computed, actions);

  // Enable inspection
  inspect(view, (event) => {
    console.log('Event:', event.type, 'Path:', event.path);

    switch (event.type) {
      case "mutation":
        console.log('New value:', event.value);
        break;
      case "action":
        console.log('Called with params:', event.params);
        break;
      case "computed":
        console.log('Dirty:', event.isDirty, 'Value:', event.value);
        break;
    }
  });

  return () => (
    <div>
      <h1>{view.name}: {view.count}</h1>
      <p>Double: {view.double}</p>
      <button onClick={view.increment}>+</button>
      <button onClick={view.decrement}>-</button>
      <button onClick={view.reset}>Reset</button>
    </div>
  );
}
```

## Event Flow

When the user clicks the increment button, you'll receive events like:

```tsx
// 1. Action called
{
  type: "action",
  path: ["increment"],
  params: []
}

// 2. State mutated
{
  type: "mutation",
  path: ["count"],
  value: 1
}

// 3. Computed becomes dirty
{
  type: "computed",
  path: ["double"],
  isDirty: true,
  value: 0  // Previous value
}

// 4. Computed recomputed (when accessed during render)
{
  type: "computed",
  path: ["double"],
  isDirty: false,
  value: 2  // New value
}
```

## Nested Views

The inspector tracks nested property paths automatically:

```tsx
function App() {
  const userState = useState({
    profile: { name: "Alice", email: "alice@example.com" },
    preferences: { theme: "dark", notifications: true },
  });

  const appState = useView({
    user: useView(userState),
  });

  inspect(appState, (event) => {
    console.log(event);
  });

  // When you do: appState.user.profile.name = "Bob"
  // You receive:
  // {
  //   type: "mutation",
  //   path: ["user", "profile", "name"],
  //   value: "Bob"
  // }

  return () => <div>Welcome, {appState.user.profile.name}!</div>;
}
```

## JSON Serialization

Views and state objects can be serialized to JSON:

```tsx
function App() {
  const state = useState({
    user: { id: 1, name: "Alice" },
    todos: [{ id: 1, text: "Learn RASK", done: false }],
  });

  const view = useView(state);

  // Serialize to JSON
  const snapshot = JSON.stringify(view);
  console.log(snapshot);

  // Send to devtools
  inspect(view, (event) => {
    if (event.type === "mutation") {
      window.postMessage({
        type: "RASK_STATE_UPDATE",
        event,
        snapshot: JSON.parse(JSON.stringify(view)),
      }, "*");
    }
  });

  return () => <div>{/* Your app */}</div>;
}
```

## Production Builds

The inspector has **zero overhead in production**:

```tsx
// In development
inspect(view, console.log); // ✅ Works, logs all events

// In production build
inspect(view, console.log); // No-op, completely removed from bundle
```

## Use Cases

- Browser DevTools Extension
- Time-Travel Debugging
- Action Logging
- State Change Notifications
- Performance Monitoring

## Notes

::: warning Important
- `inspect()` should be called during component setup phase
- The callback is synchronous - avoid heavy computations
- Inspectors are automatically cleaned up when components unmount
- Multiple inspectors can be attached to the same object
- Production builds have zero overhead due to tree-shaking
:::

::: tip Best Practice
Wrap inspector setup in `if (import.meta.env.DEV)` to make your intention explicit, even though the code will be removed in production anyway.
:::

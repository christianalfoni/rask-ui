# useState()

Creates a reactive state object bound to the component. Any property access during render is tracked, and changes trigger re-renders.

```tsx
const state = useState(initialState)
```

## Parameters

- `initialState` - Initial state object

## Returns

Reactive proxy of the state object

## Example

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

## Features

- **Deep reactivity** - Nested objects and arrays are automatically reactive
- **Direct mutations** - No setter functions required
- **Efficient tracking** - Only re-renders components that access changed properties
- **Automatic batching** - Multiple updates batched into single render

## Notes

::: warning
Never destructure state objects - it breaks reactivity:

```tsx
// ❌ Bad
const { count } = state;

// ✅ Good
state.count
```
:::

## Related

### assignState()

Merges properties from a new state object into an existing reactive state object. Returns the updated state object.

```tsx
assignState<T>(state: T, newState: T): T
```

**Parameters:**
- `state: T` - The reactive state object to update
- `newState: T` - Object with properties to merge into the state

**Returns:**
- `T` - The updated state object (same reference as input state)

**Example:**

```tsx
import { assignState, useState } from "rask-ui";

function UserProfile() {
  const state = useState({
    name: "Alice",
    age: 30,
    email: "alice@example.com",
  });

  const loadProfile = async () => {
    const profile = await fetch("/api/profile").then(r => r.json());
    return assignState(state, profile);
  };

  return () => (
    <div>
      <h1>{state.name}</h1>
      <p>Age: {state.age}</p>
      <p>Email: {state.email}</p>
      <button onClick={loadProfile}>Reload Profile</button>
    </div>
  );
}
```

**Notes:**
- Equivalent to `Object.assign(state, newState)` - returns the state for chaining
- Triggers reactivity for all updated properties
- Useful for bulk state updates from form data or API responses
- Properties not present in `newState` remain unchanged

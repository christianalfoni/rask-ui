# useState()

Creates a reactive state object bound to the component. Any property access during render is tracked, and changes trigger re-renders.

```tsx
const state = useState(initialState);
```

## Supported Value Types

`useState()` accepts the following value types:

- **Objects** - Plain JavaScript objects with nested properties
- **Arrays** - Arrays with reactive mutation methods (push, pop, splice, etc.)
- **Maps** - ES6 Map instances with reactive get/set/delete operations
- **Sets** - ES6 Set instances with reactive add/delete/clear operations

All nested structures within these types are automatically made reactive.

## Examples

### Objects and Arrays

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

### Maps

```tsx
function UserCache() {
  const state = useState({
    users: new Map<string, User>(),
  });

  const addUser = (user: User) => {
    state.users.set(user.id, user);
  };

  return () => (
    <ul>
      {Array.from(state.users.values()).map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Sets

```tsx
function TagManager() {
  const state = useState({
    tags: new Set<string>(),
  });

  const toggleTag = (tag: string) => {
    if (state.tags.has(tag)) {
      state.tags.delete(tag);
    } else {
      state.tags.add(tag);
    }
  };

  return () => (
    <div>
      <p>Tags: {Array.from(state.tags).join(", ")}</p>
      <button onClick={() => toggleTag("react")}>Toggle React</button>
    </div>
  );
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
state.count;
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
    const profile = await fetch("/api/profile").then((r) => r.json());
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

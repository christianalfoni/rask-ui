# useLookup()

Creates a reactive lookup function that maps an array to an object for efficient key-based access.

```tsx
const lookup = useLookup(getArray, key)
```

## Parameters

- `getArray: () => T[]` - A function that returns the array to create a lookup from
- `key: keyof T` - The property name to use as the lookup key

## Returns

A lookup function `(key: T[U]) => T | undefined` that returns the item with the matching key, or `undefined` if not found.

## Example

```tsx
import { useLookup, useState } from "rask-ui";

function UserList() {
  const state = useState({
    users: [
      { id: 1, name: "Alice", role: "Admin" },
      { id: 2, name: "Bob", role: "User" },
      { id: 3, name: "Charlie", role: "User" },
    ],
    selectedId: 1,
  });

  const getUserById = useLookup(() => state.users, "id");

  const selectedUser = getUserById(state.selectedId);

  return () => (
    <div>
      <h2>Users</h2>
      {state.users.map((user) => (
        <button
          key={user.id}
          onClick={() => (state.selectedId = user.id)}
        >
          {user.name}
        </button>
      ))}

      {selectedUser && (
        <div>
          <h3>Selected User</h3>
          <p>Name: {selectedUser.name}</p>
          <p>Role: {selectedUser.role}</p>
        </div>
      )}
    </div>
  );
}
```

## Features

- **Efficient lookups** - O(1) lookup time instead of O(n) array search
- **Reactive** - Automatically updates when the array structure changes
- **Type-safe** - Full TypeScript inference for keys and return types

## Important Notes

::: warning
The lookup will only update when the array structure changes (items added, removed, or reordered). Changes to properties of items within the array will not trigger a lookup rebuild.

```tsx
// These will trigger a lookup update:
state.users.push({ id: 4, name: "Dave", role: "User" });
state.users = state.users.filter(u => u.id !== 2);

// This will NOT trigger a lookup update:
state.users[0].name = "Alicia";
```
:::

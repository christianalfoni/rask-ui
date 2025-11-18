# Reactivity

Functions for creating reactive effects and computed values.

## createEffect()

Creates an effect that automatically tracks reactive dependencies and re-runs whenever they change. The effect runs immediately on creation.

```tsx
createEffect(callback: () => void): void
```

### Parameters

- `callback: () => void` - Function to run when dependencies change

### Example

```tsx
import { createEffect, createState } from "rask-ui";

function Timer() {
  const state = createState({ count: 0, log: [] });

  // Effect runs immediately and whenever state.count changes
  createEffect(() => {
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

### Features

- **Immediate execution** - Runs immediately and synchronously on creation during setup
- **Automatic tracking** - Tracks reactive dependencies accessed during execution
- **Synchronous execution** - Runs synchronously with the setup phase, making behavior predictable
- **Automatic cleanup** - Cleaned up when component unmounts

### Use Cases

- Logging state changes
- Syncing to localStorage
- Updating derived state
- Side effects based on state

### Notes

::: warning Important
- Only call during component setup phase (not in render function)
- Effect runs synchronously during setup, making it predictable and easier to reason about
- Be careful with effects that modify state - can cause infinite loops
:::

---

## createComputed()

Creates an object with computed properties that automatically track dependencies and cache results until dependencies change.

```tsx
createComputed<T>(computed: T): T
```

### Parameters

- `computed: T` - Object where each property is a function returning a computed value

### Returns

Reactive object with cached computed properties

### Example

```tsx
import { createComputed, createState } from "rask-ui";

function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, name: "Apple", price: 1.5, quantity: 3 },
      { id: 2, name: "Banana", price: 0.8, quantity: 5 },
    ],
    taxRate: 0.2,
  });

  const computed = createComputed({
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
    itemCount: () => state.items.reduce((sum, item) => sum + item.quantity, 0),
  });

  return () => (
    <div>
      <h2>Cart ({computed.itemCount} items)</h2>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            {item.name}: ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <div>
        <p>Subtotal: ${computed.subtotal.toFixed(2)}</p>
        <p>Tax: ${computed.tax.toFixed(2)}</p>
        <p><strong>Total: ${computed.total.toFixed(2)}</strong></p>
      </div>
    </div>
  );
}
```

### Features

- **Lazy evaluation** - Only calculated when accessed
- **Automatic caching** - Results cached until dependencies change
- **Dependency tracking** - Tracks what state each computed depends on
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Only recomputes when dirty (dependencies changed)
- **Automatic cleanup** - Cleaned up when component unmounts

### Access Pattern

Access computed properties directly (not as functions):

```tsx
// ✅ Correct
<div>{computed.total}</div>

// ❌ Wrong
<div>{computed.total()}</div>
```

### Notes

::: warning Important
- Access properties directly, don't call as functions
- Computed properties are getters, not functions
- **Do not destructure** - Breaks reactivity
- Only call during component setup phase
:::

## Automatic Batching

RASK automatically batches state updates to minimize re-renders. This happens transparently without any special syntax.

### How It Works

- **User interactions** (clicks, inputs, keyboard) - State changes batched and flushed synchronously at the end of the event
- **Other updates** (setTimeout, fetch callbacks) - State changes batched and flushed on next microtask

### Example

```tsx
function BatchingExample() {
  const state = createState({ count: 0, clicks: 0 });

  const handleClick = () => {
    // All three updates are batched into a single render
    state.count++;
    state.clicks++;
    state.count++;
    // UI updates once with count=2, clicks=1
  };

  const handleAsync = () => {
    setTimeout(() => {
      // These updates are also batched (async batch)
      state.count++;
      state.clicks++;
      // UI updates once on next microtask
    }, 100);
  };

  return () => (
    <div>
      <p>Count: {state.count}, Clicks: {state.clicks}</p>
      <button onClick={handleClick}>Sync Update</button>
      <button onClick={handleAsync}>Async Update</button>
    </div>
  );
}
```

### Benefits

- **Performance** - Reduces unnecessary re-renders
- **Consistency** - UI always reflects final state
- **Automatic** - No manual batching required
- **Smart** - Different strategies for sync vs async updates

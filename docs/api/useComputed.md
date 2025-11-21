# useComputed()

Creates an object bound to the component with computed properties that automatically track dependencies and cache results until dependencies change.

```tsx
const computed = useComputed({
  propertyName: () => {
    // compute value
  },
});
```

## Example

```tsx
import { useComputed, useState } from "rask-ui";

function ShoppingCart() {
  const state = useState({
    items: [
      { id: 1, name: "Apple", price: 1.5, quantity: 3 },
      { id: 2, name: "Banana", price: 0.8, quantity: 5 },
    ],
    taxRate: 0.2,
  });

  const computed = useComputed({
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
        <p>
          <strong>Total: ${computed.total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}
```

## Features

- **Lazy evaluation** - Only calculated when accessed
- **Automatic caching** - Results cached until dependencies change
- **Dependency tracking** - Tracks what state each computed depends on
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Only recomputes when dirty (dependencies changed)
- **Automatic cleanup** - Cleaned up when component unmounts

## Access Pattern

Access computed properties directly (not as functions):

```tsx
// ✅ Correct
<div>{computed.total}</div>

// ❌ Wrong
<div>{computed.total()}</div>
```

## Notes

::: warning Important

- Access properties directly, don't call as functions
- Computed properties are getters, not functions
- **Do not destructure** - Breaks reactivity
- Only call during component setup phase
  :::

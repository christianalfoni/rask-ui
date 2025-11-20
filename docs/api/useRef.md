# useRef()

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
const ref = useRef()
```

## Returns

Ref object with a `current` property that references the DOM element or component instance

## Example

```tsx
import { useRef } from "rask-ui";

function Example() {
  const inputRef = useRef<HTMLInputElement>();

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

## Usage

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

## TypeScript

```tsx
// Generic type parameter for specific element types
const inputRef = useRef<HTMLInputElement>();
const divRef = useRef<HTMLDivElement>();
const buttonRef = useRef<HTMLButtonElement>();
```

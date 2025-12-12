# useRef()

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
const ref = useRef();
```

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

## assignRef()

A helper utility for manually assigning the value of a ref. This is useful when you pass a ref down to a nested component and need to manually assign its value in that nested component.

```tsx
import { assignRef, type Ref } from "rask-ui";

function NestedComponent({ inputRef }: { inputRef: Ref<HTMLInputElement> }) {
  const setupInput = (element: HTMLInputElement) => {
    // Manually assign the ref value
    assignRef(inputRef, element);
  };

  return () => <input ref={setupInput} type="text" />;
}

function ParentComponent() {
  const inputRef = useRef<HTMLInputElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div>
      <NestedComponent inputRef={inputRef} />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}
```

## TypeScript

```tsx
// Generic type parameter for specific element types
const inputRef = useRef<HTMLInputElement>();
const divRef = useRef<HTMLDivElement>();
const buttonRef = useRef<HTMLButtonElement>();

// Use the Ref type when passing refs as props
import { type Ref } from "rask-ui";

interface Props {
  inputRef: Ref<HTMLInputElement>;
}
```

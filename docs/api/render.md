# render()

Mounts a component to a DOM element.

```tsx
render(component, container)
```

## Parameters

- `component` - The JSX component to render
- `container` - The DOM element to mount into

## Example

```tsx
import { render } from "rask-ui";

render(<App />, document.getElementById("app")!);
```

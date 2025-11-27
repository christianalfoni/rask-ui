# Components

RASK has two types of components: **stateless components** and **stateful components**.

## Stateless Components

A stateless component is a simple function that returns JSX directly. It has no setup phase and re-renders whenever its props changes or a reactive value from the props changes.

```tsx
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}
```

## Stateful Components

A stateful component is a function that has a **setup phase** and a **render phase**. The setup phase runs once, and the render phase (returned function) runs on every update.

```tsx
function Counter(props) {
  // SETUP PHASE - Runs once
  const state = useState({ count: 0 });

  // RENDER PHASE - Runs on updates
  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
}
```

## Example

This example demonstrates an important pattern: splitting out a `Todo` component that receives the todo object. When you modify properties on the todo object (like `done`), only that specific `Todo` component will reconcile and re-render, not the entire list.

```tsx
function Todo(props) {
  return (
    <li>
      <input
        type="checkbox"
        checked={props.todo.done}
        onChange={() => (props.todo.done = !props.todo.done)}
      />
      <span
        style={{ textDecoration: props.todo.done ? "line-through" : "none" }}
      >
        {props.todo.text}
      </span>
    </li>
  );
}

function TodoList(props) {
  // Setup phase
  const state = useState({
    todos: [],
    newTodo: "",
  });

  const addTodo = () => {
    state.todos.push({ id: Date.now(), text: state.newTodo, done: false });
    state.newTodo = "";
  };

  // Render phase
  return () => (
    <div>
      <h1>Todos</h1>
      <ul>
        {state.todos.map((todo) => (
          <Todo key={todo.id} todo={todo} />
        ))}
      </ul>
      <input
        value={state.newTodo}
        onInput={(e) => (state.newTodo = e.target.value)}
        placeholder="New todo..."
      />
      <button onClick={addTodo}>Add</button>
    </div>
  );
}
```

**Key Point:** When `props.todo.done` changes in a `Todo` component, only that specific component reconciles. The `TodoList` doesn't re-render, and neither do the other `Todo` components. This is because RASK tracks property access at a granular level.

## Event Types

RASK provides event types through the global `Rask` namespace. These types are available automatically when you import from `rask-ui` and don't require the "Inferno" prefix:

```tsx
function MyInput(props) {
  const handleChange = (e: Rask.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleClick = (e: Rask.MouseEvent<HTMLButtonElement>) => {
    console.log("Button clicked!");
  };

  return () => (
    <div>
      <input type="text" onInput={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </div>
  );
}
```

### Available Event Types

All event types are generic and accept an optional element type parameter (defaults to `Element`):

- `Rask.MouseEvent<T>` - Mouse events (click, mousedown, etc.)
- `Rask.KeyboardEvent<T>` - Keyboard events (keydown, keyup, etc.)
- `Rask.FocusEvent<T>` - Focus events (focus, blur, etc.)
- `Rask.ChangeEvent<T>` - Change events (input, textarea changes)
- `Rask.FormEvent<T>` - Form events (submit, reset, etc.)
- `Rask.ClipboardEvent<T>` - Clipboard events (copy, paste, cut)
- `Rask.DragEvent<T>` - Drag and drop events
- `Rask.TouchEvent<T>` - Touch events for mobile devices
- `Rask.PointerEvent<T>` - Pointer events (unified mouse/touch/pen)
- `Rask.WheelEvent<T>` - Mouse wheel events
- `Rask.AnimationEvent<T>` - CSS animation events
- `Rask.TransitionEvent<T>` - CSS transition events
- `Rask.CompositionEvent<T>` - IME composition events
- `Rask.EventHandler<E>` - Generic event handler type

### Example with Specific Element Types

```tsx
function Form(props) {
  const handleInputChange = (e: Rask.ChangeEvent<HTMLInputElement>) => {
    // e.target is typed as HTMLInputElement
    console.log(e.target.value);
  };

  const handleTextareaChange = (e: Rask.ChangeEvent<HTMLTextAreaElement>) => {
    // e.target is typed as HTMLTextAreaElement
    console.log(e.target.value);
  };

  const handleSubmit = (e: Rask.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // e.target is typed as HTMLFormElement
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input type="text" onInput={handleInputChange} />
      <textarea onInput={handleTextareaChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```
## Notes

::: warning Important

- A Component must always return JSX

```tsx
// ❌ Bad
function App(props) {
  return () => props.children // This will throw an error
}

// ✅ Good
function App(props) {
  return () => <>{props.children}</>
}
```

  :::

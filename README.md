# RASK

A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler.

```bash
npm install rask-ui
```

## The Problem with Modern UI Frameworks

Modern UI frameworks present developers with a fundamental tradeoff between state management and UI expression:

### React: Great UI, Complex State

```tsx
function MyApp() {
  const [count, setCount] = useState(0);

  return <h1 onClick={() => setCount(count + 1)}>Count is {count}</h1>;
}
```

React excels at UI composition - you simply use the language to create dynamic UIs. However, including state management within the reconciler causes significant mental strain:

- Understanding closure captures and stale state
- Managing dependency arrays in hooks
- Dealing with re-render cascades
- Optimizing with `useMemo`, `useCallback`, and `memo`
- Wrestling with the "rules of hooks"

### Solid: Simple Reactivity, Hidden Complexity

```tsx
function MyApp() {
  const [count, setCount] = createSignal(0);

  return <h1 onClick={() => setCount(count() + 1)}>Count is {count()}</h1>;
}
```

Solid offers a simpler mental model with fine-grained reactivity. Updates don't happen by calling the component function again, but in "hidden" parts of expressions in the UI. However:

- Requires understanding special compiler transformations
- Special components for expressing dynamic UIs (`<Show>`, `<For>`, etc.)
- Function call syntax for accessing values: `count()`

### RASK: Best of Both Worlds

```tsx
function MyApp() {
  const state = createState({ count: 0 });

  return () => <h1 onClick={() => state.count++}>Count is {state.count}</h1>;
}
```

RASK gives you:

- **Predictable observable state management** - No reconciler interference, just plain reactivity
- **Full reconciler power** - Express complex UIs naturally with components
- **No special syntax** - Access state properties directly, no function calls
- **No compiler magic** - Plain JavaScript/TypeScript
- **Simple mental model** - State updates trigger only affected components

## Getting Started

### Installation

```bash
npm install rask-ui
```

### Basic Example

```tsx
import { createState, render } from "rask-ui";

function Counter() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </div>
  );
}

render(<Counter />, document.getElementById("app")!);
```

### Key Concepts

#### 1. Component Structure

Components in RASK have two phases:

```tsx
function MyComponent(props) {
  // SETUP PHASE - Runs once when component is created
  const state = createState({ value: props.initial });

  onMount(() => {
    console.log("Component mounted!");
  });

  // RENDER PHASE - Returns a function that runs on every update
  return () => (
    <div>
      <p>{state.value}</p>
      <button onClick={() => state.value++}>Update</button>
    </div>
  );
}
```

The setup phase runs once, while the render function runs whenever reactive dependencies change.

#### 2. Reactive State

State objects are automatically reactive. Any property access during render is tracked:

```tsx
function TodoList() {
  const state = createState({
    todos: [],
    filter: "all",
  });

  const addTodo = (text) => {
    state.todos.push({ id: Date.now(), text, done: false });
  };

  return () => (
    <div>
      <input
        value={state.filter}
        onInput={(e) => (state.filter = e.target.value)}
      />
      <ul>
        {state.todos
          .filter(
            (todo) => state.filter === "all" || todo.text.includes(state.filter)
          )
          .map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
      </ul>
    </div>
  );
}
```

#### 3. Props are Reactive Too

Props passed to components are automatically reactive:

```tsx
function Child(props) {
  // props is reactive - accessing props.value tracks the dependency
  return () => <div>{props.value}</div>;
}

function Parent() {
  const state = createState({ count: 0 });

  return () => (
    <div>
      <Child value={state.count} />
      <button onClick={() => state.count++}>Update</button>
    </div>
  );
}
```

When `state.count` changes in Parent, only Child re-renders because it accesses `props.value`.

## API Reference

### Core Functions

#### `render(component, container)`

Mounts a component to a DOM element.

```tsx
import { render } from "rask-ui";

render(<App />, document.getElementById("app")!);
```

**Parameters:**

- `component` - The JSX component to render
- `container` - The DOM element to mount into

---

#### `createState<T>(initialState)`

Creates a reactive state object. Any property access during render is tracked, and changes trigger re-renders.

```tsx
import { createState } from "rask-ui";

function Example() {
  const state = createState({
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

**Parameters:**

- `initialState: T` - Initial state object

**Returns:** Reactive proxy of the state object

**Features:**

- Deep reactivity - nested objects and arrays are automatically reactive
- Direct mutations - no setter functions required
- Efficient tracking - only re-renders components that access changed properties

---

### Lifecycle Hooks

#### `onMount(callback)`

Registers a callback to run after the component is mounted to the DOM.

```tsx
import { onMount } from "rask-ui";

function Example() {
  onMount(() => {
    console.log("Component mounted!");
  });

  return () => <div>Hello</div>;
}
```

**Parameters:**

- `callback: () => void` - Function to call on mount. Can optionally return a cleanup function.

**Notes:**

- Only call during component setup phase (not in render function)
- Can be called multiple times to register multiple mount callbacks

---

#### `onCleanup(callback)`

Registers a callback to run when the component is unmounted.

```tsx
import { onCleanup } from "rask-ui";

function Example() {
  const state = createState({ time: Date.now() });

  const interval = setInterval(() => {
    state.time = Date.now();
  }, 1000);

  onCleanup(() => {
    clearInterval(interval);
  });

  return () => <div>{state.time}</div>;
}
```

**Parameters:**

- `callback: () => void` - Function to call on cleanup

**Notes:**

- Only call during component setup phase
- Can be called multiple times to register multiple cleanup callbacks
- Runs when component is removed from DOM

---

### Context API

#### `createContext<T>()`

Creates a context object for passing data through the component tree without props.

```tsx
import { createContext } from "rask-ui";

const ThemeContext = createContext<{ color: string }>();

function App() {
  ThemeContext.set({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = ThemeContext.get();

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

**Returns:** Context object with `set` and `get` methods

**Methods:**

- `set(value: T)` - Sets context value for child components (call during setup)
- `get(): T` - Gets context value from nearest parent (call during setup)

**Notes:**

- Context traversal happens via component tree (parent-child relationships)
- Must be called during component setup phase
- Throws error if context not found in parent chain

---

### Async Data Management

#### `createAsync<T>(promise)`

Creates reactive state for async operations with loading and error states.

```tsx
import { createAsync } from "rask-ui";

function UserProfile() {
  const user = createAsync(fetch("/api/user").then((r) => r.json()));

  return () => (
    <div>
      {user.isPending && <p>Loading...</p>}
      {user.error && <p>Error: {user.error}</p>}
      {user.value && <p>Hello, {user.value.name}!</p>}
    </div>
  );
}
```

**Parameters:**

- `promise: Promise<T>` - The promise to track

**Returns:** Reactive object with:

- `isPending: boolean` - True while promise is pending
- `value: T | null` - Resolved value (null while pending or on error)
- `error: string | null` - Error message (null while pending or on success)

**States:**

- `{ isPending: true, value: null, error: null }` - Loading
- `{ isPending: false, value: T, error: null }` - Success
- `{ isPending: false, value: null, error: string }` - Error

---

#### `createQuery<T>(fetcher)`

Creates a query with refetch capability and request cancellation.

```tsx
import { createQuery } from "rask-ui";

function Posts() {
  const posts = createQuery(() => fetch("/api/posts").then((r) => r.json()));

  return () => (
    <div>
      <button onClick={() => posts.fetch()}>Refresh</button>
      <button onClick={() => posts.fetch(true)}>Force Refresh</button>

      {posts.isPending && <p>Loading...</p>}
      {posts.error && <p>Error: {posts.error}</p>}
      {posts.data &&
        posts.data.map((post) => <article key={post.id}>{post.title}</article>)}
    </div>
  );
}
```

**Parameters:**

- `fetcher: () => Promise<T>` - Function that returns a promise

**Returns:** Query object with:

- `isPending: boolean` - True while fetching
- `data: T | null` - Fetched data
- `error: string | null` - Error message
- `fetch(force?: boolean)` - Refetch data
  - `force: false` (default) - Keep existing data while refetching
  - `force: true` - Clear data before refetching

**Features:**

- Automatic request cancellation on refetch
- Keeps old data by default during refetch
- Automatically fetches on creation

---

#### `createMutation<T>(mutator)`

Creates a mutation for data updates with pending and error states.

```tsx
import { createMutation } from "rask-ui";

function CreatePost() {
  const state = createState({ title: "", body: "" });

  const create = createMutation((data) =>
    fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.json())
  );

  const handleSubmit = () => {
    create.mutate({ title: state.title, body: state.body });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <textarea
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button disabled={create.isPending}>
        {create.isPending ? "Creating..." : "Create"}
      </button>
      {create.error && <p>Error: {create.error}</p>}
    </form>
  );
}
```

**Parameters:**

- `mutator: (params: T) => Promise<T>` - Function that performs the mutation

**Returns:** Mutation object with:

- `isPending: boolean` - True while mutation is in progress
- `params: T | null` - Current mutation parameters
- `error: string | null` - Error message
- `mutate(params: T)` - Execute the mutation

**Features:**

- Automatic request cancellation if mutation called again
- Tracks mutation parameters
- Resets state after successful completion

---

### Error Handling

#### `ErrorBoundary`

Component that catches errors from child components.

```tsx
import { ErrorBoundary } from "rask-ui";

function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{String(err)}</pre>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}

function MyComponent() {
  const state = createState({ count: 0 });

  return () => {
    if (state.count > 5) {
      throw new Error("Count too high!");
    }

    return <button onClick={() => state.count++}>{state.count}</button>;
  };
}
```

**Props:**

- `error: (error: unknown) => ChildNode | ChildNode[]` - Render function for error state
- `children` - Child components to protect

**Notes:**

- Catches errors during render phase
- Errors bubble up to nearest ErrorBoundary
- Can be nested for granular error handling

---

## Advanced Patterns

### Lists and Keys

Use keys to maintain component identity across re-renders:

```tsx
function TodoList() {
  const state = createState({
    todos: [
      { id: 1, text: "Learn RASK" },
      { id: 2, text: "Build app" },
    ],
  });

  return () => (
    <ul>
      {state.todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem(props) {
  const state = createState({ editing: false });

  return () => (
    <li>
      {state.editing ? (
        <input value={props.todo.text} />
      ) : (
        <span onClick={() => (state.editing = true)}>{props.todo.text}</span>
      )}
    </li>
  );
}
```

Keys prevent component recreation when list order changes.

### Computed Values

Create computed values using functions in setup:

```tsx
function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, price: 10, quantity: 2 },
      { id: 2, price: 20, quantity: 1 },
    ],
  });

  const total = () =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return () => (
    <div>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>Total: ${total()}</p>
    </div>
  );
}
```

Computed functions automatically track dependencies when called during render.

### External State Management

Share state across components:

```tsx
// store.ts
export const store = createState({
  user: null,
  theme: "light",
});

// App.tsx
import { store } from "./store";

function Header() {
  return () => <div>Theme: {store.theme}</div>;
}

function Settings() {
  return () => (
    <button
      onClick={() => (store.theme = store.theme === "light" ? "dark" : "light")}
    >
      Toggle Theme
    </button>
  );
}
```

Any component accessing `store` will re-render when it changes.

### Conditional Rendering

```tsx
function Conditional() {
  const state = createState({ show: false });

  return () => (
    <div>
      <button onClick={() => (state.show = !state.show)}>Toggle</button>
      {state.show && <ExpensiveComponent />}
    </div>
  );
}
```

Components are only created when rendered, and automatically cleaned up when removed.

## TypeScript Support

RASK is written in TypeScript and provides full type inference:

```tsx
import { createState, Component } from "rask-ui";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
}

const TodoItem: Component<TodoItemProps> = (props) => {
  return () => (
    <li onClick={() => props.onToggle(props.todo.id)}>{props.todo.text}</li>
  );
};

function TodoList() {
  const state = createState<{ todos: Todo[] }>({
    todos: [],
  });

  const toggle = (id: number) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
  };

  return () => (
    <ul>
      {state.todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggle} />
      ))}
    </ul>
  );
}
```

## Configuration

### JSX Setup

Configure TypeScript to use RASK's JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "rask-ui"
  }
}
```

## Performance

RASK is designed for performance:

- **Fine-grained reactivity**: Only components that access changed state re-render
- **No wasted renders**: Components skip re-render if reactive dependencies haven't changed
- **Efficient DOM updates**: Powered by Snabbdom's battle-tested virtual DOM
- **No reconciler overhead for state**: State changes are direct, no diffing required
- **Automatic cleanup**: Components and effects cleaned up automatically

## Comparison with Other Frameworks

| Feature           | React                     | Solid                    | RASK             |
| ----------------- | ------------------------- | ------------------------ | ---------------- |
| State management  | Complex (hooks, closures) | Simple (signals)         | Simple (proxies) |
| UI expression     | Excellent                 | Limited                  | Excellent        |
| Reactivity        | Coarse (component level)  | Fine-grained             | Fine-grained     |
| Reconciler        | Yes                       | Limited                  | Yes (Snabbdom)   |
| Syntax            | JSX                       | JSX + special components | JSX              |
| Compiler required | No                        | Yes                      | No               |
| Learning curve    | Steep                     | Moderate                 | Gentle           |
| Access pattern    | Direct                    | Function calls `count()` | Direct           |
| Mental model      | Complex                   | Simple (with rules)      | Simple           |

## Examples

Check out the demo app in `packages/demo` for more examples.

## Contributing

Contributions are welcome! This is an early-stage project.

## License

MIT

## Why "RASK"?

The name comes from Norwegian/Swedish meaning "fast" - which captures the essence of this library: fast to write, fast to understand, and fast to run.

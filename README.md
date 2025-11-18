# RASK

<p align="center">
  <img src="logo.png" alt="Logo" width="200">
</p>

A lightweight reactive component library that combines the simplicity of observable state management with the full power of a virtual DOM reconciler. Ideal for single page applications, using web technology.

```bash
npm install rask-ui
```

---

## 📢 Open For Feedback

**RASK is feature-complete and ready for community feedback!**

The core implementation is finished, including:
- ✅ Inferno-based reconciler for powerful UI expression
- ✅ JSX transformation plugin (Inferno JSX + stateful components)
- ✅ Reactive primitives for simple state management

**Before the official release, we need your input:**
- Would a library like this be valuable for your projects?
- Is the API clear and intuitive?
- Is the documentation helpful and complete?
- Does the approach resonate with you?

**[Share your feedback by creating an issue →](https://github.com/christianalfoni/rask/issues/new)**

Your feedback will directly shape the final release. All perspectives welcome!

---

## The Itch with Modern UI Frameworks

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

Solid offers a seamingly simpler mental model with fine-grained reactivity. Updates don't happen by calling the component function again, which resolves the mental strain of expressing state management, however:

- The code you write is compiled to balance DX vs requirements of the runtime
- Special components for expressing dynamic UIs (`<Show>`, `<For>`, etc.)
- Different signatures for accessing reactive values: `count()` VS `state.count`

### RASK: Best of Both Worlds

```tsx
function MyApp() {
  const state = createState({ count: 0 });

  return () => <h1 onClick={() => state.count++}>Count is {state.count}</h1>;
}
```

RASK gives you:

- **Simple state management** - No reconciler interference with your state management
- **Full reconciler power** - Express complex UIs naturally with the language
- **No compiler magic** - Plain JavaScript/TypeScript, it runs as you write it

:fire: Built on [Inferno JS](https://github.com/infernojs/inferno).

## Getting Started

The fastest way to get started is using `create-rask-ui`:

```bash
npm create rask-ui my-app
cd my-app
npm run dev
```

This will scaffold a new Vite project with RASK UI pre-configured and ready to go. You'll be prompted to choose between TypeScript or JavaScript.

### What's Included

The scaffolded project includes:

- ✅ Vite configured with the RASK plugin
- ✅ TypeScript or JavaScript with proper JSX configuration
- ✅ Hot Module Replacement (HMR) working out of the box
- ✅ Sample counter component to get you started

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

  createMountEffect(() => {
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

### One Rule To Accept

**RASK has observable primitives**: Never destructure reactive objects (state, props, context values, tasks). Destructuring extracts plain values and breaks reactivity.

```tsx
// ❌ BAD - Destructuring breaks reactivity
function Counter(props) {
  const state = createState({ count: 0 });
  const { count } = state; // Extracts plain value!

  return () => <div>{count}</div>; // Won't update!
}

function Child({ value, name }) {
  // Destructuring props!
  return () => (
    <div>
      {value} {name}
    </div>
  ); // Won't update!
}

// ✅ GOOD - Access properties directly in render
function Counter(props) {
  const state = createState({ count: 0 });

  return () => <div>{state.count}</div>; // Reactive!
}

function Child(props) {
  // Don't destructure
  return () => (
    <div>
      {props.value} {props.name}
    </div>
  ); // Reactive!
}
```

**Why this happens:**

Reactive objects are implemented using JavaScript Proxies. When you access a property during render (e.g., `state.count`), the proxy tracks that dependency. But when you destructure (`const { count } = state`), the destructuring happens during setup—before any tracking context exists. You get a plain value instead of a tracked property access.

**This applies to:**

- `createState()` - Never destructure state objects
- Props - Never destructure component props
- `createContext().get()` - Never destructure context values
- `createTask()` - Never destructure task objects
- `createView()` - Never destructure view objects
- `createComputed()` - Never destructure computed objects

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

#### `assignState<T>(state, newState)`

Merges properties from a new state object into an existing reactive state object. Returns the updated state object.

```tsx
import { assignState, createState } from "rask-ui";

function Example() {
  const state = createState({
    name: "Alice",
    age: 30,
    email: "alice@example.com",
  });

  const updateProfile = (updates) => {
    return assignState(state, updates);
  };

  return () => (
    <div>
      <p>{state.name} - {state.email}</p>
      <button onClick={() => updateProfile({ name: "Bob", age: 35 })}>
        Update Profile
      </button>
    </div>
  );
}
```

**Parameters:**

- `state: T` - The reactive state object to update
- `newState: T` - Object with properties to merge into the state

**Returns:** The updated state object (same reference as input state)

**Notes:**

- Equivalent to `Object.assign(state, newState)` - returns the state for chaining
- Triggers reactivity for all updated properties
- Useful for bulk state updates from form data or API responses

---

#### `createView<T>(...objects)`

Creates a view that merges multiple objects (reactive or plain) into a single object while maintaining reactivity through getters. Properties from later arguments override earlier ones.

```tsx
import { createView, createState } from "rask-ui";

function createCounter() {
  const state = createState({ count: 0, name: "Counter" });
  const increment = () => state.count++;
  const decrement = () => state.count--;
  const reset = () => (state.count = 0);

  return createView(state, { increment, decrement, reset });
}

function Counter() {
  const counter = createCounter();

  return () => (
    <div>
      <h1>
        {counter.name}: {counter.count}
      </h1>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
}
```

**Parameters:**

- `...objects: object[]` - Objects to merge (reactive or plain). Later arguments override earlier ones.

**Returns:** A view object with getters for all properties, maintaining reactivity

**Notes:**

- Reactivity is maintained through getters that reference the source objects
- Changes to source objects are reflected in the view
- Only enumerable properties are included
- Symbol keys are supported
- **Do not destructure** - See warning section above

---

#### `createRef<T>()`

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
import { createRef } from "rask-ui";

function Example() {
  const inputRef = createRef<HTMLInputElement>();

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

**Returns:** Ref object with:

- `current: T | null` - Reference to the DOM element or component instance
- Function signature for use as ref callback

**Usage:**

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

---

### Reactivity Primitives

#### `createEffect(callback)`

Creates an effect that automatically tracks reactive dependencies and re-runs whenever they change. The effect runs immediately on creation.

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

**Effect with Disposal:**

The callback can optionally return a dispose function that runs before the effect executes again:

```tsx
import { createEffect, createState } from "rask-ui";

function LiveData() {
  const state = createState({ url: "/api/data", data: null });

  createEffect(() => {
    const eventSource = new EventSource(state.url);

    eventSource.onmessage = (event) => {
      state.data = JSON.parse(event.data);
    };

    // Dispose function runs before effect re-executes
    return () => {
      eventSource.close();
    };
  });

  return () => (
    <div>
      <input value={state.url} onInput={(e) => state.url = e.target.value} />
      <pre>{JSON.stringify(state.data, null, 2)}</pre>
    </div>
  );
}
```

**Parameters:**

- `callback: () => void | (() => void)` - Function to run when dependencies change. Can optionally return a dispose function that runs before the effect executes again.

**Features:**

- Runs immediately and synchronously on creation during setup
- Automatically tracks reactive dependencies accessed during execution
- Re-runs when dependencies change
- Automatically cleaned up when component unmounts
- Optional dispose function for cleaning up resources before re-execution
- Can be used for side effects like logging, syncing to localStorage, managing subscriptions, or updating derived state

**Notes:**

- Only call during component setup phase (not in render function)
- Effect runs synchronously during setup, making it predictable and easier to reason about
- Be careful with effects that modify state - can cause infinite loops if not careful
- Dispose functions run before the effect re-executes, not when the component unmounts
- For component unmount cleanup, use `createCleanup()` instead

---

#### `createComputed<T>(computed)`

Creates an object with computed properties that automatically track dependencies and cache results until dependencies change.

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
            <button onClick={() => item.quantity++}>+</button>
            <button onClick={() => item.quantity--}>-</button>
          </li>
        ))}
      </ul>
      <div>
        <p>Subtotal: ${computed.subtotal.toFixed(2)}</p>
        <p>
          Tax ({state.taxRate * 100}%): ${computed.tax.toFixed(2)}
        </p>
        <p>
          <strong>Total: ${computed.total.toFixed(2)}</strong>
        </p>
      </div>
    </div>
  );
}
```

**Parameters:**

- `computed: T` - Object where each property is a function returning a computed value

**Returns:** Reactive object with cached computed properties

**Features:**

- **Lazy evaluation** - Computed values are only calculated when accessed
- **Automatic caching** - Results are cached until dependencies change
- **Dependency tracking** - Automatically tracks what state each computed depends on
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Only recomputes when dirty (dependencies changed)
- **Automatic cleanup** - Cleaned up when component unmounts

**Notes:**

- Access computed properties directly (e.g., `computed.total`), don't call as functions
- Computed properties are getters, not functions
- **Do not destructure** - Breaks reactivity (see warning section above)
- Only call during component setup phase

---

### Automatic Batching

RASK automatically batches state updates to minimize re-renders. This happens transparently without any special syntax.

**How it works:**

- **User interactions** (clicks, inputs, keyboard, etc.) - State changes are batched and flushed synchronously at the end of the event
- **Other updates** (setTimeout, fetch callbacks, etc.) - State changes are batched and flushed on the next microtask

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
      <p>
        Count: {state.count}, Clicks: {state.clicks}
      </p>
      <button onClick={handleClick}>Sync Update</button>
      <button onClick={handleAsync}>Async Update</button>
    </div>
  );
}
```

---

### Lifecycle Hooks

#### `createMountEffect(callback)`

Registers a callback to run after the component is mounted to the DOM.

```tsx
import { createMountEffect } from "rask-ui";

function Example() {
  createMountEffect(() => {
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

#### `createCleanup(callback)`

Registers a callback to run when the component is unmounted.

```tsx
import { createCleanup } from "rask-ui";

function Example() {
  const state = createState({ time: Date.now() });

  const interval = setInterval(() => {
    state.time = Date.now();
  }, 1000);

  createCleanup(() => {
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
  ThemeContext.inject({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = ThemeContext.get();

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

**Returns:** Context object with `inject` and `get` methods

**Methods:**

- `inject(value: T)` - Injects context value for child components (call during setup)
- `get(): T` - Gets context value from nearest parent (call during setup)

**Notes:**

- Context traversal happens via component tree (parent-child relationships)
- Must be called during component setup phase
- Throws error if context not found in parent chain

---

### Async Data Management

#### `createTask<P, T>(task)`

A low-level reactive primitive for managing any async operation. `createTask` provides the foundation for building data fetching, mutations, polling, debouncing, and any other async pattern you need. It gives you full control without prescribing specific patterns.

The `Task<P, T>` type is also exported for type annotations. When used with one type parameter, it represents a task with no parameters. With two type parameters, the first is the params type and the second is the return type.

```tsx
import { createTask, createState } from "rask-ui";

// Fetching data - auto-runs on creation
function UserProfile() {
  const user = createTask(() => fetch("/api/user").then((r) => r.json()));

  return () => {
    if (user.isRunning) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return <p>Error: {user.error}</p>;
    }

    return <p>Hello, {user.result.name}!</p>;
  };
}

// Fetching with parameters
function Posts() {
  const state = createState({ page: 1 });

  const posts = createTask((page: number) =>
    fetch(`/api/posts?page=${page}&limit=10`).then((r) => r.json())
  );

  // Fetch when page changes
  createEffect(() => {
    posts.run(state.page);
  });

  return () => (
    <div>
      <h1>Posts - Page {state.page}</h1>
      {posts.isRunning && <p>Loading...</p>}
      {posts.result?.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
      <button onClick={() => state.page--}>Previous</button>
      <button onClick={() => state.page++}>Next</button>
    </div>
  );
}

// Mutation - creating data on server
function CreatePost() {
  const state = createState({ title: "", body: "" });

  const createPost = createTask((data: { title: string; body: string }) =>
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json())
  );

  const handleSubmit = async () => {
    await createPost.run({ title: state.title, body: state.body });
    // Clear form on success
    state.title = "";
    state.body = "";
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Title"
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <textarea
        placeholder="Body"
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button disabled={createPost.isRunning}>
        {createPost.isRunning ? "Creating..." : "Create Post"}
      </button>
      {createPost.error && <p>Error: {createPost.error}</p>}
      {createPost.result && <p>Post created! ID: {createPost.result.id}</p>}
    </form>
  );
}

// Optimistic updates - instant UI updates with rollback on error
function TodoList() {
  const state = createState({
    todos: [],
    optimisticTodo: null,
  });

  const createTodo = createTask((text: string) =>
    fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, done: false }),
    }).then((r) => r.json())
  );

  const addTodo = async (text: string) => {
    // Show optimistically
    state.optimisticTodo = { id: Date.now(), text, done: false };

    try {
      const savedTodo = await createTodo.run(text);
      state.todos.push(savedTodo);
      state.optimisticTodo = null;
    } catch {
      // Rollback on error
      state.optimisticTodo = null;
    }
  };

  return () => (
    <div>
      <ul>
        {[...state.todos, state.optimisticTodo]
          .filter(Boolean)
          .map((todo) => (
            <li key={todo.id} style={{ opacity: todo === state.optimisticTodo ? 0.5 : 1 }}>
              {todo.text}
            </li>
          ))}
      </ul>
      <button onClick={() => addTodo("New todo")}>Add Todo</button>
    </div>
  );
}
```

**Type Signatures:**

```tsx
// Task without parameters - auto-runs on creation
createTask<T>(task: () => Promise<T>): Task<T> & {
  run(): Promise<T>;
  rerun(): Promise<T>;
}

// Task with parameters - manual control
createTask<P, T>(task: (params: P) => Promise<T>): Task<P, T> & {
  run(params: P): Promise<T>;
  rerun(params: P): Promise<T>;
}
```

**Task Type:**

The `Task` type is exported and can be used for type annotations:

```tsx
import { Task } from "rask-ui";

// Task that returns a string, no parameters
const myTask: Task<string>;

// Task that accepts string parameters and returns a string
const myTask: Task<string, string>;

// Task that accepts a number parameter and returns a User object
const myTask: Task<number, User>;
```

**Returns:** Task object with reactive state and methods:

**State Properties:**
- `isRunning: boolean` - True while task is executing
- `result: T | null` - Result of successful execution (null if not yet run, running, or error)
- `error: string | null` - Error message from failed execution (null if successful or running)
- `params: P | null` - Current parameters while running (null when idle)

**Methods:**
- `run(params?: P): Promise<T>` - Execute the task, clearing previous result
- `rerun(params?: P): Promise<T>` - Re-execute the task, keeping previous result until new one arrives

**State Transitions:**

Initial state (no params):
```tsx
{ isRunning: false, params: null, result: null, error: null }
```

While running:
```tsx
{ isRunning: true, result: T | null, params: P, error: null }
```

Success:
```tsx
{ isRunning: false, params: null, result: T, error: null }
```

Error:
```tsx
{ isRunning: false, params: null, result: null, error: string }
```

**Features:**

- **Automatic cancellation** - Previous executions are cancelled when a new one starts
- **Flexible control** - Use `run()` to clear old data or `rerun()` to keep it during loading
- **Type-safe** - Full TypeScript inference for parameters and results
- **Auto-run support** - Tasks without parameters run automatically on creation
- **Generic primitive** - Build your own patterns on top (queries, mutations, etc.)

**Usage Patterns:**

`createTask` is a low-level primitive. Use it as a building block for any async pattern:
- **Data fetching**: Fetch data on mount or based on dependencies
- **Mutations**: Create, update, or delete data on the server
- **Optimistic updates**: Update UI instantly with rollback on error
- **Polling**: Periodically refetch data
- **Debounced searches**: Wait for user input to settle
- **Dependent queries**: Chain requests that depend on each other
- **Parallel requests**: Run multiple requests simultaneously
- **Custom patterns**: Build your own abstractions (queries, mutations, etc.)

---

### Developer Tools

#### `inspect(root, callback)`

Enables inspection of reactive state, computed values, and actions for building devtools. This API is **development-only** and has zero overhead in production builds.

```tsx
import { inspect } from "rask-ui";

function DevToolsIntegration() {
  const state = createState({ count: 0, name: "Example" });
  const computed = createComputed({
    double: () => state.count * 2,
  });

  const actions = {
    increment: () => state.count++,
    reset: () => state.count = 0,
  };

  const view = createView(state, computed, actions);

  // Inspect all reactive events
  inspect(view, (event) => {
    console.log(event);
    // Send to devtools panel, logging service, etc.
  });

  return () => (
    <div>
      <h1>{view.name}: {view.count}</h1>
      <p>Double: {view.double}</p>
      <button onClick={view.increment}>+</button>
      <button onClick={view.reset}>Reset</button>
    </div>
  );
}
```

**Parameters:**

- `root: any` - The reactive object to inspect (state, view, computed, etc.)
- `callback: (event: InspectEvent) => void` - Callback receiving inspection events

**Event Types:**

```tsx
type InspectEvent =
  | {
      type: "mutation";
      path: string[];      // Property path, e.g., ["user", "name"]
      value: any;          // New value
    }
  | {
      type: "action";
      path: string[];      // Function name path, e.g., ["increment"]
      params: any[];       // Function parameters
    }
  | {
      type: "computed";
      path: string[];      // Computed property path
      isDirty: boolean;    // true when invalidated, false when recomputed
      value: any;          // Current or recomputed value
    };
```

**Features:**

- **Zero production overhead** - Completely eliminated in production builds via tree-shaking
- **Deep tracking** - Tracks nested state mutations with full property paths
- **Action tracking** - Captures function calls with parameters
- **Computed lifecycle** - Observes when computed values become dirty and when they recompute
- **Nested view support** - Compose deeply nested state trees and track full paths
- **JSON serialization** - Use `JSON.stringify()` to extract state snapshots
- **Flexible integration** - Build custom devtools, time-travel debugging, or logging systems

**Use Cases:**

- Building browser devtools extensions
- Creating debugging panels for development
- Implementing time-travel debugging
- Logging state changes for debugging
- Integrating with external monitoring tools
- Building replay systems for bug reports

**Production Builds:**

The inspector is automatically stripped from production builds using Vite's `import.meta.env.DEV` constant. This means:

- No runtime checks in production code
- No function wrapping overhead
- No symbol property lookups
- Smaller bundle size
- Zero performance impact

```tsx
// In development
inspect(view, console.log); // ✅ Works, logs all events

// In production build
inspect(view, console.log); // No-op, zero overhead, removed by tree-shaking
```

**Nested State Trees:**

The inspector automatically tracks nested property paths. Compose deeply nested views to create organized state trees:

```tsx
function App() {
  // Create nested state structure
  const userState = createState({
    profile: { name: "Alice", email: "alice@example.com" },
    preferences: { theme: "dark", notifications: true },
  });

  const cartState = createState({
    items: [],
    total: 0,
  });

  // Compose into a state tree
  const appState = createView({
    user: createView(userState),
    cart: createView(cartState),
  });

  inspect(appState, (event) => {
    console.log(event);
  });

  // When you do: appState.user.profile.name = "Bob"
  // You receive: { type: "mutation", path: ["user", "profile", "name"], value: "Bob" }

  return () => (
    <div>
      <h1>Welcome, {appState.user.profile.name}!</h1>
      <p>Theme: {appState.user.preferences.theme}</p>
      <p>Cart items: {appState.cart.items.length}</p>
    </div>
  );
}
```

**JSON Serialization:**

Use `JSON.stringify()` to extract state snapshots for devtools, persistence, or debugging:

```tsx
function App() {
  const state = createState({
    user: { id: 1, name: "Alice" },
    todos: [
      { id: 1, text: "Learn RASK", done: false },
      { id: 2, text: "Build app", done: true },
    ],
  });

  const computed = createComputed({
    completedCount: () => state.todos.filter((t) => t.done).length,
  });

  const view = createView(state, computed);

  // Serialize to JSON - includes computed values
  const snapshot = JSON.stringify(view);
  // {
  //   "user": { "id": 1, "name": "Alice" },
  //   "todos": [...],
  //   "completedCount": 1
  // }

  // Send initial state and updates to devtools
  if (import.meta.env.DEV) {
    window.postMessage({
      type: "RASK_DEVTOOLS_INIT",
      initialState: JSON.parse(snapshot),
    }, "*");

    inspect(view, (event) => {
      window.postMessage({
        type: "RASK_DEVTOOLS_EVENT",
        event,
        snapshot: JSON.parse(JSON.stringify(view)),
      }, "*");
    });
  }

  return () => <div>{/* Your app */}</div>;
}
```

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

You can create computed values in two ways:

**1. Simple computed functions** - For basic derived values:

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

**2. Using `createComputed`** - For cached, efficient computed values with automatic dependency tracking:

```tsx
function ShoppingCart() {
  const state = createState({
    items: [
      { id: 1, price: 10, quantity: 2 },
      { id: 2, price: 20, quantity: 1 },
    ],
    taxRate: 0.1,
  });

  const computed = createComputed({
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
  });

  return () => (
    <div>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>Subtotal: ${computed.subtotal}</p>
      <p>Tax: ${computed.tax}</p>
      <p>Total: ${computed.total}</p>
    </div>
  );
}
```

Benefits of `createComputed`:

- **Cached** - Only recalculates when dependencies change
- **Lazy** - Only calculates when accessed
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Better performance for expensive calculations

### Composition

Compose complex logic by combining state and methods using `createView`:

```tsx
function createAuthStore() {
  const state = createState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (username, password) => {
    state.isLoading = true;
    try {
      const user = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }).then((r) => r.json());
      state.user = user;
      state.isAuthenticated = true;
    } finally {
      state.isLoading = false;
    }
  };

  const logout = () => {
    state.user = null;
    state.isAuthenticated = false;
  };

  return createView(state, { login, logout });
}

function App() {
  const auth = createAuthStore();

  return () => (
    <div>
      {auth.isAuthenticated ? (
        <div>
          <p>Welcome, {auth.user.name}!</p>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => auth.login("user", "pass")}>Login</button>
      )}
    </div>
  );
}
```

This pattern is great for organizing complex business logic while keeping both state and methods accessible through a single object.

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

## Performance

RASK is designed for performance:

- **Fine-grained reactivity**: Only components that access changed state re-render
- **No wasted renders**: Components skip re-render if reactive dependencies haven't changed
- **Efficient DOM updates**: Powered by Inferno's highly optimized virtual DOM reconciler
- **No reconciler overhead for state**: State changes are direct, no diffing required
- **Automatic cleanup**: Components and effects cleaned up automatically

## Comparison with Other Frameworks

| Feature           | React                     | Solid                    | RASK             |
| ----------------- | ------------------------- | ------------------------ | ---------------- |
| State management  | Complex (hooks, closures) | Simple (signals)         | Simple (proxies) |
| UI expression     | Excellent                 | Limited                  | Excellent        |
| Reactivity        | Coarse (component level)  | Fine-grained             | Fine-grained     |
| Reconciler        | Yes                       | Limited                  | Yes (Inferno)    |
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

The name comes from Norwegian meaning "fast" - which captures the essence of this library: fast to write, fast to understand, and fast to run.

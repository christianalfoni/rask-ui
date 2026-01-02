# Core Concepts

Understanding the fundamental concepts that make RASK work.

## Reactive State

State objects are automatically reactive. Any property access during render is tracked:

```tsx
function TodoList() {
  const state = useState({
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

### How It Works

RASK's reactivity is powered by **MobX**, a battle-tested reactive state management library:

1. **Proxy-based tracking** - State objects use JavaScript Proxies to track property access
2. **Automatic dependency tracking** - When you access `state.count` during render, that dependency is recorded
3. **Efficient updates** - Only components that access changed properties re-render
4. **Deep reactivity** - Nested objects and arrays are automatically reactive

This proven reactivity system has been used in production by thousands of applications, ensuring reliability and performance.

## Children reconciles

Children passed to components behaves as you expect. They are used in the render scope to render the children.

```tsx
function Header(props) {
  return <h1>{props.children}</h1>;
}

function Parent() {
  const state = useState({ count: 0 });

  return () => (
    <div>
      <Header>Count is {state.count}</Header>
      <button onClick={() => state.count++}>Update</button>
    </div>
  );
}
```

## Props reconcile and are reactive

Props also behaves as you would expect in the render scope, but they are also reactive, meaning they can be used with `useEffect` or `useDerived`.

```tsx
function Header(props) {
  const computed = useDerived({
    double: () => props.count * 2,
  });

  useEffect(() => console.log(props.count));

  return () => <h1>Count is {props.count}</h1>;
}

function Parent() {
  const state = useState({ count: 0 });

  return () => (
    <div>
      <Counter count={state.count} />
      <button onClick={() => state.count++}>Update</button>
    </div>
  );
}
```

## The One Rule: Never Destructure

**RASK has observable primitives**: Never destructure reactive objects (state, props, context values, tasks). Destructuring extracts plain values and breaks reactivity.

Reactive objects are implemented using JavaScript Proxies. When you access a property during render (e.g., `state.count`), the proxy tracks that dependency. But when you destructure (`const { count } = state`), the destructuring happens during setup—before any tracking context exists. You get a plain value instead of a tracked property access.

**This applies to:**

- `useState()` - Never destructure state objects
- Props - Never destructure component props
- `useContext()` - Never destructure context values
- `useAsync()` - Never destructure async state objects
- `useView()` - Never destructure view objects
- `useDerived()` - Never destructure computed objects

## Automatic Batching

RASK automatically batches state updates to minimize re-renders using MobX's transaction system.

- **User interactions** (clicks, inputs, keyboard, etc.) - State changes are batched and flushed synchronously at the end of the event
- **Other updates** (setTimeout, fetch callbacks, etc.) - State changes are batched and flushed on the next microtask

## Effects

Create side effects that automatically track dependencies:

```tsx
function Timer() {
  const state = useState({ count: 0, log: [] });

  // Effect runs immediately and whenever state.count changes
  useEffect(() => {
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

### Effect Behavior

- Runs immediately and synchronously on creation during setup
- Automatically tracks reactive dependencies
- Re-runs when dependencies change
- Automatically cleaned up when component unmounts

## Computed Values

Create derived values that cache results:

```tsx
function ShoppingCart() {
  const state = useState({
    items: [
      { id: 1, name: "Apple", price: 1.5, quantity: 3 },
      { id: 2, name: "Banana", price: 0.8, quantity: 5 },
    ],
    taxRate: 0.2,
  });

  const computed = useDerived({
    subtotal: () =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    tax: () => computed.subtotal * state.taxRate,
    total: () => computed.subtotal + computed.tax,
  });

  return () => (
    <div>
      <h2>Cart</h2>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            {item.name}: ${item.price} x {item.quantity}
          </li>
        ))}
      </ul>
      <p>Subtotal: ${computed.subtotal.toFixed(2)}</p>
      <p>Tax: ${computed.tax.toFixed(2)}</p>
      <p>
        <strong>Total: ${computed.total.toFixed(2)}</strong>
      </p>
    </div>
  );
}
```

### Computed Benefits

- **Lazy evaluation** - Only calculated when accessed
- **Automatic caching** - Results cached until dependencies change
- **Composable** - Computed properties can depend on other computed properties
- **Efficient** - Only recomputes when dirty

## Lifecycle Hooks

Manage component lifecycle:

```tsx
function Example() {
  const state = useState({ time: Date.now() });

  // Runs after component mounts
  useMountEffect(() => {
    console.log("Component mounted!");
  });

  // Set up interval
  const interval = setInterval(() => {
    state.time = Date.now();
  }, 1000);

  // Clean up when component unmounts
  useCleanup(() => {
    clearInterval(interval);
  });

  return () => <div>{state.time}</div>;
}
```

## Context API

Share state without prop drilling:

```tsx
const ThemeContext = createContext<{ color: string }>();

function App() {
  const injectTheme = useInjectContext(ThemeContext);

  injectTheme({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext);

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

## Lists and Keys

Use keys to maintain component identity:

```tsx
function TodoList() {
  const state = useState({
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
```

Keys prevent component recreation when list order changes.

## Composition with Views

Compose complex logic using `useView`:

```tsx
function createAuthStore() {
  const state = useState({
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

  return useView(state, { login, logout });
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

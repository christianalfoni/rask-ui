# Context API

Functions for sharing data through the component tree without props.

## createContext()

Creates a context by wrapping a hook function that will be used as a context identifier. The hook defines how the context value is created.

```tsx
const CounterContext = createContext(() => {
  const state = useState({ count: 0 });

  const increment = () => state.count++;
  const decrement = () => state.count--;

  return useView(state, { increment, decrement });
});
```

Returns the hook function, which can be used with `useContext()` and `useInjectContext()`.

### Example

```tsx
import { createContext, useContext, useInjectContext, useState, useView } from "rask-ui";

const CounterContext = createContext(() => {
  const state = useState({ count: 0 });

  const increment = () => state.count++;
  const decrement = () => state.count--;

  return useView(state, { increment, decrement });
});

function App() {
  const counter = useInjectContext(CounterContext);

  return () => <Child />;
}

function Child() {
  const counter = useContext(CounterContext);

  return () => (
    <div>
      <p>Count: {counter.count}</p>
      <button onClick={counter.increment}>Increment</button>
      <button onClick={counter.decrement}>Decrement</button>
    </div>
  );
}
```

## useInjectContext()

Injects a context value by calling the context hook with parameters. The value will be available to the current component and all child components.

```tsx
const value = useInjectContext(MyContext, ...params);
```

### Example

```tsx
const CounterContext = createContext((initialCount: number) => {
  const state = useState({ count: initialCount });

  const increment = () => state.count++;
  const decrement = () => state.count--;

  return useView(state, { increment, decrement });
});

function App() {
  const counter = useInjectContext(CounterContext, 10);

  return () => <Content />;
}
```

### Notes

- Must be called during component setup phase
- Value is available to all child components in the tree
- Child contexts can override parent contexts

---

## useContext()

Gets the context value from the nearest parent component that injected a value for this context.

```tsx
const value = useContext(MyContext);
```

### Example

```tsx
const CounterContext = createContext(() => {
  const state = useState({ count: 0 });

  const increment = () => state.count++;
  const decrement = () => state.count--;

  return useView(state, { increment, decrement });
});

function Child() {
  const counter = useContext(CounterContext);

  return () => (
    <div>
      <p>Count: {counter.count}</p>
      <button onClick={counter.increment}>Increment</button>
      <button onClick={counter.decrement}>Decrement</button>
    </div>
  );
}
```

### Notes

- Must be called during component setup phase
- Throws error if context not found in parent chain
- Returns the value from the nearest parent context

## Complete Example

```tsx
import {
  createContext,
  useContext,
  useInjectContext,
  useState,
  useView,
} from "rask-ui";

interface AuthState {
  user: { name: string; email: string } | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext(() => {
  const state = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = async (email: string, password: string) => {
    const user = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((r) => r.json());

    state.user = user;
    state.isAuthenticated = true;
  };

  const logout = () => {
    state.user = null;
    state.isAuthenticated = false;
  };

  return useView(state, { login, logout });
});

function LoginButton() {
  const auth = useContext(AuthContext);

  return () => (
    <div>
      {auth.isAuthenticated ? (
        <div>
          <span>Welcome, {auth.user.name}!</span>
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => auth.login("user@example.com", "password")}>
          Login
        </button>
      )}
    </div>
  );
}

function App() {
  useInjectContext(AuthContext);

  return () => <LoginButton />;
}
```

## Nested Contexts

Child contexts override parent contexts:

```tsx
const CounterContext = createContext((initialCount: number) => {
  const state = useState({ count: initialCount });

  const increment = () => state.count++;
  const decrement = () => state.count--;

  return useView(state, { increment, decrement });
});

function App() {
  useInjectContext(CounterContext, 0);

  return () => (
    <div>
      <Counter /> {/* Uses count starting at 0 */}
      <Sidebar />
    </div>
  );
}

function Sidebar() {
  useInjectContext(CounterContext, 100);

  return () => <Counter />; {/* Uses count starting at 100 */}
}

function Counter() {
  const counter = useContext(CounterContext);

  return () => (
    <div>
      <p>Count: {counter.count}</p>
      <button onClick={counter.increment}>Increment</button>
      <button onClick={counter.decrement}>Decrement</button>
    </div>
  );
}
```

## Notes

::: warning Important

- Context traversal happens via component tree (parent-child relationships)
- Must be called during component setup phase
- Throws error if context not found
- **Do not destructure** context values - breaks reactivity
  :::

::: tip Best Practice
Use context for:

- Theme configuration
- Authentication state
- Localization
- Global app state
- Feature flags

Avoid context for:

- Frequently changing data (use props instead)
- Data that only a few components need (use props instead)
  :::

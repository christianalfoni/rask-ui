# Context API

Functions for sharing data through the component tree without props.

## createContext()

Creates a context by wrapping a hook function that will be used as a context identifier. The hook defines how the context value is created.

```tsx
const useTheme = () => {
  return useState({ color: "blue" });
};
```

Returns the hook function, which can be used with `useContext()` and `useInjectContext()`.

### Example

```tsx
import { createContext, useContext, useInjectContext, useState } from "rask-ui";

const ThemeContext = createContext(() => {
  return useState({ color: "blue" });
});

function App() {
  const theme = useInjectContext(ThemeContext);

  theme.color = "blue";

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext);

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

## useInjectContext()

Injects a context value by calling the context hook with parameters. The value will be available to the current component and all child components.

```tsx
const value = useInjectContext(MyContext, ...params);
```

### Example

```tsx
const ThemeContext = createContext((defaultColor: string) => {
  return useState({ color: defaultColor });
});

function App() {
  const theme = useInjectContext(ThemeContext, "blue");

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
const ThemeContext = createContext(() => useState({ color: "blue" }));

function Child() {
  const theme = useContext(ThemeContext);

  return () => <div style={{ color: theme.color }}>Themed content</div>;
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
const ThemeContext = createContext((color) => useState({ color }));

function App() {
  useInjectContext(ThemeContext, "blue");

  return () => (
    <div>
      <Content /> {/* Uses blue */}
      <Sidebar />
    </div>
  );
}

function Sidebar() {
  useInjectContext(ThemeContext, "red");

  return () => <Content />;
  {
    /* Uses red */
  }
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

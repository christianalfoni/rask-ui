# createContext() and useContext()

Creates a context object for passing data through the component tree without prop drilling.

## createContext()

```tsx
const Context = createContext()
```

Returns a context object with `inject` and `get` methods.

## useContext()

A utility function that can both inject and get context values. Provides a simpler API than calling `context.inject()` or `context.get()` directly.

```tsx
// Inject mode
useContext(Context, value)

// Get mode
const value = useContext(Context)
```

### Parameters

- `context` - The context object created by `createContext()`
- `value` (optional) - Value to inject. If provided, acts as inject; if omitted, acts as get

### Returns

When called without a value (get mode), returns the context value from the nearest parent

## Examples

### Using useContext (Recommended)

```tsx
import { createContext, useContext } from "rask-ui";

const ThemeContext = createContext<{ color: string }>();

function App() {
  useContext(ThemeContext, { color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext);

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

### Using inject/get (Alternative)

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

## Context Methods

### inject()

Injects context value for child components.

```tsx
context.inject(value: T): void
```

**Parameters:**
- `value: T` - The value to provide to child components

**Example:**

```tsx
function App() {
  const ThemeContext = createContext<Theme>();

  ThemeContext.inject({
    color: "blue",
    fontSize: 16,
  });

  return () => <Content />;
}
```

**Notes:**
- Must be called during component setup phase
- Value is available to all child components in the tree
- Child contexts can override parent contexts

### get()

Gets context value from nearest parent.

```tsx
context.get(): T
```

**Returns:**
The context value from the nearest parent that called `inject()`

**Example:**

```tsx
function Child() {
  const theme = ThemeContext.get();

  return () => (
    <div style={{ color: theme.color }}>
      Themed content
    </div>
  );
}
```

**Notes:**
- Must be called during component setup phase
- Throws error if context not found in parent chain
- Returns the value from the nearest parent context

## Complete Example

```tsx
import { createContext, useContext, useState, useView } from "rask-ui";

interface AuthContext {
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext>();

function AuthProvider(props) {
  const state = useState({
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

  const auth = useView(state, { login, logout });

  useContext(AuthContext, auth);

  return () => props.children;
}

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
  return () => (
    <AuthProvider>
      <LoginButton />
    </AuthProvider>
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

# Context API

Functions for sharing data through the component tree without props.

## createContext()

Creates a context symbol for passing data through the component tree without prop drilling.

```tsx
createContext<T>(): Context<T>
```

### Type Parameters

- `T` - The type of value this context will hold

### Returns

A `Context<T>` symbol that can be used with `useContext()` and `useInjectContext()`

### Example

```tsx
import { createContext, useContext, useInjectContext } from "rask-ui";

const ThemeContext = createContext<{ color: string }>();

function App() {
  const inject = useInjectContext(ThemeContext);
  inject({ color: "blue" });

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext);

  return () => <div style={{ color: theme.color }}>Themed text</div>;
}
```

## useInjectContext()

Returns a function to inject a context value that will be available to all child components.

```tsx
useInjectContext<T>(context: Context<T>): (value: T) => void
```

### Parameters

- `context: Context<T>` - The context symbol created by `createContext()`

### Returns

An inject function that takes a value and makes it available to child components

### Example

```tsx
function App() {
  const ThemeContext = createContext<Theme>();
  const inject = useInjectContext(ThemeContext);

  inject({
    color: "blue",
    fontSize: 16,
  });

  return () => <Content />;
}
```

### Notes

- Must be called during component setup phase
- Value is available to all child components in the tree
- Child contexts can override parent contexts

---

## useContext()

Gets context value from nearest parent component that injected a value for this context.

```tsx
useContext<T>(context: Context<T>): T
```

### Parameters

- `context: Context<T>` - The context symbol created by `createContext()`

### Returns

The context value from the nearest parent that called the inject function

### Example

```tsx
function Child() {
  const theme = useContext(ThemeContext);

  return () => (
    <div style={{ color: theme.color }}>
      Themed content
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

  const inject = useInjectContext(AuthContext);
  inject(auth);

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

## TypeScript Support

Context is fully typed:

```tsx
interface Theme {
  color: string;
  fontSize: number;
  spacing: number;
}

const ThemeContext = createContext<Theme>();

function Provider() {
  const inject = useInjectContext(ThemeContext);
  inject({
    color: "blue",
    fontSize: 16,
    spacing: 8,
  });

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext); // Type is Theme

  return () => (
    <div style={{
      color: theme.color,
      fontSize: theme.fontSize,
      padding: theme.spacing,
    }}>
      Content
    </div>
  );
}
```

## Multiple Contexts

Use multiple contexts for different concerns:

```tsx
const ThemeContext = createContext<Theme>();
const AuthContext = createContext<Auth>();
const I18nContext = createContext<I18n>();

function App() {
  const injectTheme = useInjectContext(ThemeContext);
  const injectAuth = useInjectContext(AuthContext);
  const injectI18n = useInjectContext(I18nContext);

  injectTheme({ color: "blue" });
  injectAuth({ user: null });
  injectI18n({ locale: "en" });

  return () => <Content />;
}

function Content() {
  const theme = useContext(ThemeContext);
  const auth = useContext(AuthContext);
  const i18n = useContext(I18nContext);

  return () => (
    <div style={{ color: theme.color }}>
      {i18n.locale === "en" ? "Hello" : "Hola"}, {auth.user?.name}!
    </div>
  );
}
```

## Nested Contexts

Child contexts override parent contexts:

```tsx
function App() {
  const inject = useInjectContext(ThemeContext);
  inject({ color: "blue" });

  return () => (
    <div>
      <Content /> {/* Uses blue */}
      <Sidebar />
    </div>
  );
}

function Sidebar() {
  const inject = useInjectContext(ThemeContext);
  inject({ color: "red" }); // Override

  return () => <Content />; {/* Uses red */}
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

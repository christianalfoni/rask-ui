# Context API

Functions for sharing data through the component tree without props.

## createContext()

Creates a context symbol for passing data through the component tree without prop drilling.

```tsx
const Context = createContext();
```

Return a symbol that can be used with `useContext()` and `useInjectContext()`

### Example

```tsx
import { createContext, useContext, useInjectContext } from "rask-ui";

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

## useInjectContext()

Returns a function to inject a context value that will be available to current component and all child components.

```tsx
const inject = useInjectContext(Context);
```

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
const context = useContext(Context);
```

### Example

```tsx
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

interface AuthContext {
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContext>();

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
  const injectAuth = useInjectContext(AuthContext);
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

  injectAuth(auth);

  return () => <LoginButton />;
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
  const injectTheme = useInjectContext(ThemeContext);

  injectTheme({
    color: "blue",
    fontSize: 16,
    spacing: 8,
  });

  return () => <Child />;
}

function Child() {
  const theme = useContext(ThemeContext); // Type is Theme

  return () => (
    <div
      style={{
        color: theme.color,
        fontSize: theme.fontSize,
        padding: theme.spacing,
      }}
    >
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
  const injectTheme = useInjectContext(ThemeContext);

  injectTheme({ color: "blue" });

  return () => (
    <div>
      <Content /> {/* Uses blue */}
      <Sidebar />
    </div>
  );
}

function Sidebar() {
  const injectTheme = useInjectContext(ThemeContext);

  injectTheme({ color: "red" }); // Override

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

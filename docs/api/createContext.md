# createContext(), useContext(), and useInjectContext()

Creates a context symbol for passing data through the component tree without prop drilling.

## createContext()

```tsx
const Context = createContext<T>();
```

Creates and returns a unique symbol that serves as a context identifier.

### Type Parameters

- `T` - The type of value this context will hold

### Returns

Returns a `Context<T>` symbol that can be used with `useContext()` and `useInjectContext()`

## useContext()

Gets context value from the nearest parent component that injected a value for this context.

```tsx
const value = useContext(Context);
```

### Parameters

- `context` - The context symbol created by `createContext()`

### Returns

Returns the context value from the nearest parent that called the inject function from `useInjectContext()`

## useInjectContext()

Returns a function to inject a context value that will be available to all child components.

```tsx
const inject = useInjectContext(Context);
inject(value);
```

### Parameters

- `context` - The context symbol created by `createContext()`

### Returns

Returns an inject function that takes a value and makes it available to child components

## Examples

### Basic Usage

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

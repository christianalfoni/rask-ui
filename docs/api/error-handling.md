# Error Handling

Components and patterns for handling errors in RASK applications.

## ErrorBoundary

Component that catches errors from child components during render.

```tsx
<ErrorBoundary error={(error) => JSX}>
  {children}
</ErrorBoundary>
```

### Props

- `error: (error: unknown) => ChildNode | ChildNode[]` - Render function for error state
- `children: ChildNode` - Child components to protect

### Example

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
```

### Catching Component Errors

```tsx
function MyComponent() {
  const state = useState({ count: 0 });

  return () => {
    if (state.count > 5) {
      throw new Error("Count too high!");
    }

    return <button onClick={() => state.count++}>{state.count}</button>;
  };
}

function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h2>Error in component</h2>
          <p>{String(err)}</p>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Features

- Catches errors during render phase
- Errors bubble up to nearest ErrorBoundary
- Can be nested for granular error handling
- Receives the error object

### Nested Error Boundaries

Use multiple error boundaries for different parts of your app:

```tsx
function App() {
  return () => (
    <ErrorBoundary error={(err) => <GlobalError error={err} />}>
      <Header />

      <ErrorBoundary error={(err) => <SidebarError error={err} />}>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary error={(err) => <ContentError error={err} />}>
        <Content />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

### With Recovery

```tsx
function App() {
  const state = useState({ hasError: false });

  return () => {
    if (state.hasError) {
      return <SafeComponent />;
    }

    return (
      <ErrorBoundary
        error={(err) => (
          <div>
            <h1>Error occurred</h1>
            <pre>{String(err)}</pre>
            <button onClick={() => (state.hasError = true)}>
              Switch to safe mode
            </button>
          </div>
        )}
      >
        <RiskyComponent />
      </ErrorBoundary>
    );
  };
}
```

## Async Error Handling

Handle errors from async operations:

### createAsync

```tsx
function UserProfile() {
  const user = createAsync(
    fetch("/api/user").then((r) => {
      if (!r.ok) throw new Error("Failed to fetch user");
      return r.json();
    })
  );

  return () => {
    if (user.isPending) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return (
        <div>
          <h2>Failed to load user</h2>
          <p>{user.error}</p>
        </div>
      );
    }

    return <p>Hello, {user.value.name}!</p>;
  };
}
```

### createQuery

```tsx
function Posts() {
  const posts = createQuery(() =>
    fetch("/api/posts").then((r) => {
      if (!r.ok) throw new Error("Failed to fetch posts");
      return r.json();
    })
  );

  return () => (
    <div>
      {posts.error && (
        <div>
          <p>Error: {posts.error}</p>
          <button onClick={() => posts.fetch(true)}>Retry</button>
        </div>
      )}

      {posts.isPending && <p>Loading...</p>}

      {posts.data && (
        <ul>
          {posts.data.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### createMutation

```tsx
function CreatePost() {
  const state = useState({ title: "", body: "" });

  const create = createMutation((data) =>
    fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to create post");
      return r.json();
    })
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
      <button disabled={create.isPending}>Create</button>

      {create.error && (
        <div>
          <p>Error: {create.error}</p>
          <button onClick={handleSubmit}>Retry</button>
        </div>
      )}
    </form>
  );
}
```

## Error Patterns

### Global Error Handler

```tsx
const ErrorContext = createContext<{
  error: string | null;
  setError: (error: string | null) => void;
}>();

function ErrorProvider(props) {
  const state = useState({ error: null });

  const setError = (error: string | null) => {
    state.error = error;
  };

  ErrorContext.inject(useView(state, { setError }));

  return () => props.children;
}

function GlobalErrorDisplay() {
  const errorState = useContext(ErrorContext);

  return () =>
    errorState.error ? (
      <div className="error-toast">
        {errorState.error}
        <button onClick={() => errorState.setError(null)}>Dismiss</button>
      </div>
    ) : null;
}

function App() {
  return () => (
    <ErrorProvider>
      <GlobalErrorDisplay />
      <Content />
    </ErrorProvider>
  );
}
```

### Try-Catch in Effects

```tsx
function DataFetcher() {
  const state = useState({
    data: null,
    error: null,
    loading: false,
  });

  useMountEffect(() => {
    const fetchData = async () => {
      state.loading = true;
      state.error = null;

      try {
        const response = await fetch("/api/data");
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        state.data = await response.json();
      } catch (err) {
        state.error = String(err);
      } finally {
        state.loading = false;
      }
    };

    fetchData();
  });

  return () => (
    <div>
      {state.loading && <p>Loading...</p>}
      {state.error && <p>Error: {state.error}</p>}
      {state.data && <pre>{JSON.stringify(state.data, null, 2)}</pre>}
    </div>
  );
}
```

### Form Validation Errors

```tsx
function SignupForm() {
  const state = useState({
    email: "",
    password: "",
    errors: {} as Record<string, string>,
  });

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!state.email.includes("@")) {
      errors.email = "Invalid email address";
    }

    if (state.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    state.errors = errors;
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });
    } catch (err) {
      state.errors.submit = String(err);
    }
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={state.email}
          onInput={(e) => (state.email = e.target.value)}
          placeholder="Email"
        />
        {state.errors.email && <p className="error">{state.errors.email}</p>}
      </div>

      <div>
        <input
          type="password"
          value={state.password}
          onInput={(e) => (state.password = e.target.value)}
          placeholder="Password"
        />
        {state.errors.password && (
          <p className="error">{state.errors.password}</p>
        )}
      </div>

      {state.errors.submit && <p className="error">{state.errors.submit}</p>}

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Best Practices

### 1. Use Error Boundaries for Render Errors

```tsx
// ✅ Good - Catches render errors
<ErrorBoundary error={(err) => <ErrorDisplay error={err} />}>
  <ComplexComponent />
</ErrorBoundary>
```

### 2. Handle Async Errors Explicitly

```tsx
// ✅ Good - Explicit error handling
const data = createQuery(() =>
  fetch("/api/data").then((r) => {
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  })
);

return () => {
  if (data.error) {
    return <ErrorMessage error={data.error} />;
  }
  // ... render data
};
```

### 3. Provide Recovery Options

```tsx
// ✅ Good - User can recover
return () => {
  if (posts.error) {
    return (
      <div>
        <p>Error: {posts.error}</p>
        <button onClick={() => posts.fetch(true)}>Retry</button>
      </div>
    );
  }
  // ... render posts
};
```

### 4. Log Errors

```tsx
// ✅ Good - Log for debugging
<ErrorBoundary
  error={(err) => {
    console.error("Component error:", err);
    // Report to error tracking service
    reportError(err);

    return <ErrorDisplay error={err} />;
  }}
>
  <App />
</ErrorBoundary>
```

### 5. Granular Error Boundaries

```tsx
// ✅ Good - Isolate errors to specific sections
<div>
  <ErrorBoundary error={(err) => <HeaderError />}>
    <Header />
  </ErrorBoundary>

  <ErrorBoundary error={(err) => <ContentError />}>
    <Content />
  </ErrorBoundary>

  <ErrorBoundary error={(err) => <SidebarError />}>
    <Sidebar />
  </ErrorBoundary>
</div>
```

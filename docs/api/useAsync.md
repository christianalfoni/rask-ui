# useAsync()

A reactive hook for managing asynchronous operations. Use `useAsync` for data fetching, mutations, background operations, and any async work. It provides automatic cancellation, optional initial values, and a unified API for all async patterns.

```tsx
// Without parameters
const [state, run] = useAsync(async (_, signal) => {
  // async operation
});

// With initial value
const [state, run] = useAsync(initialValue, async (_, signal) => {
  // async operation
});

// With parameters
const [state, run] = useAsync(async (params, signal) => {
  // async operation with params
});

// With parameters and initial value
const [state, run] = useAsync(initialValue, async (params, signal) => {
  // async operation with params
});
```

## Basic Example - Data Fetching

```tsx
import { useAsync } from "rask-ui";

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const [user, fetchUser] = useAsync(async (id: number, signal) => {
    const response = await fetch(`/api/users/${id}`, { signal });
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json() as Promise<User>;
  });

  fetchUser(1);

  return () => {
    if (user.isPending) {
      return <p>Loading...</p>;
    }

    if (user.error) {
      return <p>Error: {user.error}</p>;
    }

    return (
      <div>
        <h1>{user.value.name}</h1>
        <p>{user.value.email}</p>
        <button onClick={() => fetchUser(1)}>Refresh</button>
      </div>
    );
  };
}
```

## With Initial Value

Provide an initial value to avoid null checks:

```tsx
import { useAsync } from "rask-ui";

function TodoList() {
  const [todos, fetchTodos] = useAsync([], async (_, signal) => {
    const response = await fetch("/api/todos", { signal });
    return response.json();
  });

  fetchTodos();

  return () => (
    <div>
      <h1>Todos</h1>
      {todos.isPending && <p>Loading...</p>}
      <ul>
        {todos.value.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
      <button onClick={fetchTodos}>Refresh</button>
    </div>
  );
}
```

## Form Submission

```tsx
import { useAsync, useState } from "rask-ui";

interface LoginData {
  email: string;
  password: string;
}

function LoginForm() {
  const state = useState({ email: "", password: "" });

  const [user, login] = useAsync(async (data: LoginData, signal) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal,
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    login({ email: state.email, password: state.password });
  };

  return () => {
    if (!user.value) {
      return (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={state.email}
            onInput={(e) => (state.email = e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={state.password}
            onInput={(e) => (state.password = e.target.value)}
            placeholder="Password"
          />
          <button type="submit" disabled={loginState.isPending}>
            {user.isPending ? "Logging in..." : "Login"}
          </button>
          {user.error && <p>Error: {user.error}</p>}
        </form>
      );
    }

    return <p>Welcome back!</p>;
  };
}
```

## Search with Debouncing

```tsx
import { useAsync, useState, useEffect } from "rask-ui";

function SearchComponent() {
  const state = useState({ query: "" });

  const [results, search] = useAsync([], async (query: string, signal) => {
    const response = await fetch(`/api/search?q=${query}`, { signal });
    return response.json();
  });

  useEffect(() => {
    if (state.query.length > 2) {
      const timeout = setTimeout(() => {
        search(state.query);
      }, 300);
      return () => clearTimeout(timeout);
    }
  });

  return () => (
    <div>
      <input
        value={state.query}
        onInput={(e) => (state.query = e.target.value)}
        placeholder="Search..."
      />
      {results.isPending && <p>Searching...</p>}
      {results.error && <p>Error: {results.error}</p>}
      <ul>
        {results.value.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## File Upload

```tsx
function FileUploader() {
  const state = useState<{ file: File | null }>({ file: null });

  const [uploadState, uploadFile] = useAsync(async (file: File, signal) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  });

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    state.file = input.files?.[0] || null;
  };

  const handleUpload = () => {
    if (state.file) {
      uploadFile(state.file);
    }
  };

  return () => (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={!state.file || uploadState.isPending}
      >
        {uploadState.isPending ? "Uploading..." : "Upload"}
      </button>

      {uploadState.isPending && <progress>Uploading...</progress>}
      {uploadState.error && <p>Error: {uploadState.error}</p>}
      {uploadState.value && <p>Upload successful: {uploadState.value.url}</p>}
    </div>
  );
}
```

## Using the Signal Parameter

### Cancelling Fetch Requests

The signal is automatically passed to fetch and will cancel in-flight requests when a new operation starts:

```tsx
function DataFetcher() {
  const state = useState({ userId: 1 });

  const [user, fetchUser] = useAsync(async (id: number, signal) => {
    // Signal automatically cancels this request if fetchUser is called again
    const response = await fetch(`/api/users/${id}`, { signal });
    return response.json();
  });

  return () => (
    <div>
      <button onClick={() => fetchUser(state.userId++)}>Fetch Next User</button>
      {user.value && <div>{user.value.name}</div>}
    </div>
  );
}
```

### Detecting Cancellation in Multi-Step Operations

```tsx
function ComplexOperation() {
  const [result, runOperation] = useAsync(async (id: number, signal) => {
    const step1 = await fetch(`/api/step1/${id}`).then((r) => r.json());

    // Check if operation was cancelled after first step
    if (signal.aborted) {
      return;
    }

    // Only continue if not cancelled
    const step2 = await fetch(`/api/step2/${step1.data}`).then((r) => r.json());

    return step2;
  });

  return () => <div>{/* ... */}</div>;
}
```

## Features

- **Automatic cancellation** - Previous executions are cancelled when a new one starts
- **Optional initial values** - Avoid null checks by providing initial values
- **Type-safe** - Full TypeScript inference for parameters and results
- **Signal support** - AbortSignal provided for cancellation detection and request cancellation
- **Unified API** - Single hook for all async patterns (fetching, mutations, polling, etc.)
- **Value retention** - When using initial values, the previous value is retained during loading
- **Reactive state** - All properties are reactive and tracked automatically

## Notes

::: warning Important

- Previous executions are automatically cancelled when a new one starts
- **Do not destructure** state objects - breaks reactivity
- Error messages are automatically converted to strings
- Only call `useAsync` during component setup phase
  :::

## Related

- [useState](/api/useState) - Reactive state management
- [useEffect](/api/useEffect) - Side effects
- [useMountEffect](/api/useMountEffect) - Run effects on mount

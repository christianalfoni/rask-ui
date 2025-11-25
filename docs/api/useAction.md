# useAction()

A reactive hook for managing async operations with state tracking. Use `useAction` for mutations, form submissions, and operations where you want to track the execution state, parameters, results, and errors.

```tsx
const [state, run] = useAction(async (params) => {
  // async operation
});
```

## Basic Example

```tsx
import { useAction } from "rask-ui";

function TodoForm() {
  const [createState, createTodo] = useAction(async (text: string) => {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error("Failed to create todo");
    return response.json();
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("todo") as HTMLInputElement;

    createTodo(input.value);
    input.value = "";
  };

  return () => (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="todo" placeholder="New todo..." />
        <button type="submit" disabled={createState.isPending}>
          {createState.isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {createState.error && (
        <div>Error: {createState.error.message}</div>
      )}

      {createState.result && (
        <div>Created todo: {createState.result.text}</div>
      )}
    </div>
  );
}
```

## Without Parameters

When your action doesn't need parameters, you can omit them:

```tsx
import { useAction } from "rask-ui";

function RefreshButton() {
  const [state, refresh] = useAction(async () => {
    const response = await fetch("/api/refresh", { method: "POST" });
    if (!response.ok) throw new Error("Refresh failed");
  });

  return () => (
    <button onClick={refresh} disabled={state.isPending}>
      {state.isPending ? "Refreshing..." : "Refresh"}
    </button>
  );
}
```

## Form Submission with Validation

```tsx
import { useAction, useState } from "rask-ui";

interface LoginData {
  email: string;
  password: string;
}

function LoginForm() {
  const form = useState({ email: "", password: "" });

  const [loginState, login] = useAction(async (data: LoginData) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please fill in all fields");
      return;
    }

    login({ email: form.email, password: form.password });
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form.email}
        onInput={(e) => (form.email = e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={form.password}
        onInput={(e) => (form.password = e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loginState.isPending}>
        {loginState.isPending ? "Logging in..." : "Login"}
      </button>

      {loginState.error && (
        <div>
          <p>Error: {loginState.error.message}</p>
        </div>
      )}
    </form>
  );
}
```

## File Upload

```tsx
import { useAction, useState } from "rask-ui";

function FileUploader() {
  const [uploadState, uploadFile] = useAction(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
    return response.json();
  });

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  return () => (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploadState.isPending}
      />

      {uploadState.isPending && (
        <div>Uploading {uploadState.params?.name}...</div>
      )}

      {uploadState.error && (
        <div>
          Error: {uploadState.error.message}
        </div>
      )}

      {uploadState.result && (
        <div>
          Successfully uploaded {uploadState.params?.name}
        </div>
      )}
    </div>
  );
}
```

## Tracking State Changes

The action state tracks the full lifecycle of your async operation:

```tsx
import { useAction } from "rask-ui";

function DataProcessor() {
  const [processState, processData] = useAction(async (data: string) => {
    const response = await fetch("/api/process", {
      method: "POST",
      body: JSON.stringify({ data }),
    });

    if (!response.ok) throw new Error("Processing failed");
    return response.json();
  });

  return () => (
    <div>
      <button onClick={() => processData("test")} disabled={processState.isPending}>
        Process Data
      </button>

      <div>
        <h3>State</h3>
        <p>Pending: {processState.isPending ? "Yes" : "No"}</p>
        <p>Params: {JSON.stringify(processState.params)}</p>
        <p>Result: {JSON.stringify(processState.result)}</p>
        <p>Error: {processState.error?.message || "None"}</p>
      </div>
    </div>
  );
}
```

## State Type

The state is a discriminated union that represents different stages of the action:

```tsx
type ActionState<T, P> =
  | {
      isPending: false;
      params: null;
      result: null;
      error: null;
    }
  | {
      isPending: true;
      params: P;
      result: null;
      error: null;
    }
  | {
      isPending: false;
      params: P;
      result: T;
      error: null;
    }
  | {
      isPending: false;
      params: P;
      result: null;
      error: Error;
    };
```

## Features

- **State tracking** - Tracks pending, params, result, and error states
- **Automatic cancellation** - Starting a new action cancels the previous one
- **Type-safe** - Full TypeScript inference for parameters and results
- **Discriminated union** - State type narrows based on isPending/error/result
- **Reactive state** - All properties are reactive and tracked automatically

## Notes

::: warning Important

- Starting a new action will abort the previous one (if still pending)
- **Do not destructure** state objects - breaks reactivity
- Only call `useAction` during component setup phase
  :::

## Related

- [useAsync](/api/useAsync) - Fetch async values with observation
- [useSuspend](/api/useSuspend) - Suspend until multiple async values resolve
- [useState](/api/useState) - Reactive state management

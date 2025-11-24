# useAction()

A reactive hook for managing async operations that should be queued rather than cancelled. Use `useAction` for mutations, form submissions, and operations where you want to preserve and track each invocation.

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

      {createState.queue.length > 0 && (
        <div>
          <h3>Pending Actions</h3>
          <ul>
            {createState.queue.map((action, index) => (
              <li key={index}>
                {action.error ? (
                  <div>
                    <span>Failed: {action.params}</span>
                    <button onClick={action.retry}>Retry</button>
                    <button onClick={action.cancel}>Cancel</button>
                  </div>
                ) : (
                  <span>Creating: {action.params}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
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

      {loginState.queue.map((action, index) =>
        action.error ? (
          <div key={index}>
            <p>Error: {action.error.message}</p>
            <button onClick={action.retry}>Retry</button>
            <button onClick={action.cancel}>Dismiss</button>
          </div>
        ) : null
      )}
    </form>
  );
}
```

## File Upload Queue

```tsx
import { useAction, useState } from "rask-ui";

function FileUploader() {
  const state = useState<{ files: File[] }>({ files: [] });

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

  const handleFilesChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    state.files = Array.from(input.files || []);
  };

  const handleUpload = () => {
    state.files.forEach((file) => uploadFile(file));
    state.files = [];
  };

  return () => (
    <div>
      <input type="file" multiple onChange={handleFilesChange} />
      <button
        onClick={handleUpload}
        disabled={state.files.length === 0 || uploadState.isPending}
      >
        Upload {state.files.length} file(s)
      </button>

      {uploadState.queue.length > 0 && (
        <div>
          <h3>Upload Queue</h3>
          <ul>
            {uploadState.queue.map((action, index) => (
              <li key={index}>
                {action.error ? (
                  <div>
                    <span>
                      ❌ {action.params.name} - {action.error.message}
                    </span>
                    <button onClick={action.retry}>Retry</button>
                    <button onClick={action.cancel}>Cancel</button>
                  </div>
                ) : (
                  <span>⏳ Uploading {action.params.name}...</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Action Queue Management

Actions are processed sequentially, and each action can be retried or cancelled:

```tsx
import { useAction } from "rask-ui";

function BatchProcessor() {
  const [processState, processItem] = useAction(async (itemId: string) => {
    const response = await fetch(`/api/process/${itemId}`, {
      method: "POST",
    });

    if (!response.ok) throw new Error(`Failed to process ${itemId}`);
    return response.json();
  });

  const handleBatchProcess = () => {
    const items = ["item-1", "item-2", "item-3", "item-4"];
    items.forEach((id) => processItem(id));
  };

  return () => (
    <div>
      <button onClick={handleBatchProcess} disabled={processState.isPending}>
        Process Batch
      </button>

      <div>
        <h3>Queue Status</h3>
        <p>Processing: {processState.isPending ? "Yes" : "No"}</p>
        <p>Queue Size: {processState.queue.length}</p>

        {processState.queue.map((action, index) => (
          <div key={index}>
            <span>
              {index === 0 && processState.isPending ? "⏳" : "⏸️"} Item:{" "}
              {action.params}
            </span>
            {action.error && (
              <div>
                <span>Error: {action.error.message}</span>
                <button onClick={action.retry}>Retry</button>
                <button onClick={action.cancel}>Skip</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## State Type

```tsx
type ActionState<P> = {
  isPending: boolean;
  queue: QueuedAction<P>[];
};

type QueuedAction<P> = {
  params: P;
  error: Error | null;
  retry(): void;
  cancel(): void;
};
```

## Features

- **Action queuing** - Actions are queued and processed sequentially
- **Retry support** - Each action can be individually retried
- **Cancel support** - Actions can be cancelled and removed from the queue
- **Error tracking** - Errors are captured per action
- **Type-safe** - Full TypeScript inference for parameters
- **Sequential processing** - Only one action runs at a time
- **Reactive state** - All properties are reactive and tracked automatically

## Notes

::: warning Important

- Actions are processed sequentially, not in parallel
- **Failed actions stop the queue** - processing will not continue to the next action until the failed action is either retried or cancelled
- **Do not destructure** state objects - breaks reactivity
- Only call `useAction` during component setup phase
  :::

## Related

- [useAsync](/api/useAsync) - Fetch async values with observation
- [useSuspend](/api/useSuspend) - Suspend until multiple async values resolve
- [useState](/api/useState) - Reactive state management

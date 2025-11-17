# Async Data Management

## createTask()

A low-level reactive primitive for managing any async operation. `createTask` provides the foundation for building data fetching, mutations, polling, debouncing, and any other async pattern you need. It gives you full control without prescribing specific patterns.

```tsx
// Task without parameters - auto-runs on creation
createTask<T>(task: () => Promise<T>): Task<T>

// Task with parameters - manual control
createTask<P, T>(task: (params: P) => Promise<T>): Task<P, T>
```

### Task Type

The `Task` type is exported and can be used for type annotations:

```tsx
import { Task } from "rask-ui";

// Task that returns a string, no parameters
const myTask: Task<string>;

// Task that accepts string parameters and returns a string
const myTask: Task<string, string>;

// Task that accepts a number parameter and returns a User object
const myTask: Task<number, User>;
```

**Type Parameters:**
- `Task<T>` - Task with no parameters, returns type `T`
- `Task<P, T>` - Task with parameters of type `P`, returns type `T`

### Parameters

- `task: () => Promise<T>` - Async function without parameters (auto-runs on creation)
- `task: (params: P) => Promise<T>` - Async function with parameters (manual control)

### Returns

Task object with reactive state and methods:

**State Properties:**
- `isRunning: boolean` - True while task is executing
- `result: T | null` - Result of successful execution (null if not yet run, running, or error)
- `error: string | null` - Error message from failed execution (null if successful or running)
- `params: P | null` - Current parameters while running (null when idle)

**Methods:**
- `run(params?: P): Promise<T>` - Execute the task, clearing previous result
- `rerun(params?: P): Promise<T>` - Re-execute the task, keeping previous result until new one arrives

### State Transitions

Initial state (no params):
```tsx
{ isRunning: false, params: null, result: null, error: null }
```

While running:
```tsx
{ isRunning: true, result: T | null, params: P, error: null }
```

Success:
```tsx
{ isRunning: false, params: null, result: T, error: null }
```

Error:
```tsx
{ isRunning: false, params: null, result: null, error: string }
```

## Basic Examples

### Fetching Data

Use tasks without parameters to fetch data on component mount:

```tsx
import { createTask } from "rask-ui";

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  // Auto-runs on creation
  const user = createTask(() =>
    fetch("/api/user").then((r) => r.json() as Promise<User>)
  );

  return () => {
    if (user.isRunning) {
      return <div>Loading user...</div>;
    }

    if (user.error) {
      return <div>Error: {user.error}</div>;
    }

    return (
      <div>
        <h1>{user.result.name}</h1>
        <p>{user.result.email}</p>
        <button onClick={() => user.rerun()}>Refresh</button>
      </div>
    );
  };
}
```

### Fetching with Parameters

Use tasks with parameters to fetch data based on user input or props:

```tsx
interface Post {
  id: number;
  title: string;
  body: string;
}

function PostsList() {
  const state = createState({ page: 1 });

  const posts = createTask((page: number) =>
    fetch(`/api/posts?page=${page}&limit=10`)
      .then((r) => r.json() as Promise<Post[]>)
  );

  // Fetch when page changes
  createEffect(() => {
    posts.run(state.page);
  });

  return () => (
    <div>
      <h1>Posts - Page {state.page}</h1>

      {posts.isRunning && <p>Loading...</p>}

      {posts.error && <p>Error: {posts.error}</p>}

      {posts.result && (
        <ul>
          {posts.result.map((post) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          onClick={() => state.page--}
          disabled={state.page === 1}
        >
          Previous
        </button>
        <button onClick={() => state.page++}>Next</button>
      </div>
    </div>
  );
}
```

## Mutation Examples

### Creating Data

Use tasks to create or update data on the server:

```tsx
interface CreatePostData {
  title: string;
  body: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

function CreatePost() {
  const state = createState({
    title: "",
    body: "",
  });

  const createPost = createTask((data: CreatePostData) =>
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to create post");
      return r.json() as Promise<Post>;
    })
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      const post = await createPost.run({
        title: state.title,
        body: state.body,
      });

      // Success! Clear form
      state.title = "";
      state.body = "";

      console.log("Created post:", post);
    } catch (error) {
      // Error is already captured in createPost.error
      console.error("Failed to create post");
    }
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <h1>Create New Post</h1>

      <input
        type="text"
        placeholder="Title"
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />

      <textarea
        placeholder="Body"
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />

      <button
        type="submit"
        disabled={createPost.isRunning || !state.title || !state.body}
      >
        {createPost.isRunning ? "Creating..." : "Create Post"}
      </button>

      {createPost.error && (
        <p style={{ color: "red" }}>Error: {createPost.error}</p>
      )}

      {createPost.result && (
        <p style={{ color: "green" }}>
          Post created successfully! ID: {createPost.result.id}
        </p>
      )}
    </form>
  );
}
```

### Updating Data

```tsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoItem(props: { todo: Todo; onUpdate: () => void }) {
  const updateTodo = createTask((updates: Partial<Todo>) =>
    fetch(`/api/todos/${props.todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((r) => r.json() as Promise<Todo>)
  );

  const toggleDone = async () => {
    await updateTodo.run({ done: !props.todo.done });
    props.onUpdate(); // Refresh parent list
  };

  return () => (
    <li>
      <input
        type="checkbox"
        checked={props.todo.done}
        onChange={toggleDone}
        disabled={updateTodo.isRunning}
      />
      <span style={{ textDecoration: props.todo.done ? "line-through" : "none" }}>
        {props.todo.text}
      </span>
      {updateTodo.isRunning && <span> Updating...</span>}
      {updateTodo.error && <span style={{ color: "red" }}> Error!</span>}
    </li>
  );
}
```

### Deleting Data

```tsx
function TodoList() {
  const state = createState<{ todos: Todo[] }>({ todos: [] });

  const fetchTodos = createTask(() =>
    fetch("/api/todos").then((r) => r.json() as Promise<Todo[]>)
  );

  const deleteTodo = createTask((id: number) =>
    fetch(`/api/todos/${id}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
        return id;
      })
  );

  // Fetch on mount
  createEffect(() => {
    if (fetchTodos.result) {
      state.todos = fetchTodos.result;
    }
  });

  const handleDelete = async (id: number) => {
    await deleteTodo.run(id);
    // Refresh list after deletion
    fetchTodos.rerun();
  };

  return () => (
    <div>
      <h1>Todos</h1>

      {fetchTodos.isRunning && <p>Loading...</p>}

      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id}>
            {todo.text}
            <button
              onClick={() => handleDelete(todo.id)}
              disabled={deleteTodo.isRunning && deleteTodo.params === todo.id}
            >
              {deleteTodo.isRunning && deleteTodo.params === todo.id
                ? "Deleting..."
                : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Optimistic Updates

Optimistic updates improve perceived performance by updating the UI immediately, then rolling back if the server request fails:

```tsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoList() {
  const state = createState<{
    todos: Todo[];
    optimisticTodo: Todo | null;
  }>({
    todos: [],
    optimisticTodo: null,
  });

  const fetchTodos = createTask(() =>
    fetch("/api/todos").then((r) => r.json() as Promise<Todo[]>)
  );

  const createTodo = createTask((text: string) =>
    fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, done: false }),
    }).then((r) => r.json() as Promise<Todo>)
  );

  // Load todos on mount
  createEffect(() => {
    if (fetchTodos.result) {
      state.todos = fetchTodos.result;
    }
  });

  const addTodo = async (text: string) => {
    // Optimistic update - show immediately with temporary ID
    const optimisticTodo: Todo = {
      id: Date.now(), // Temporary ID
      text,
      done: false,
    };

    state.optimisticTodo = optimisticTodo;

    try {
      // Send to server
      const savedTodo = await createTodo.run(text);

      // Success - replace optimistic todo with real one
      state.todos.push(savedTodo);
      state.optimisticTodo = null;
    } catch (error) {
      // Failed - remove optimistic todo (error shown via createTodo.error)
      state.optimisticTodo = null;
    }
  };

  const renderTodos = () => {
    const allTodos = state.optimisticTodo
      ? [...state.todos, state.optimisticTodo]
      : state.todos;

    return allTodos.map((todo) => {
      const isOptimistic = todo.id === state.optimisticTodo?.id;

      return (
        <li
          key={todo.id}
          style={{ opacity: isOptimistic ? 0.5 : 1 }}
        >
          <input type="checkbox" checked={todo.done} disabled={isOptimistic} />
          {todo.text}
          {isOptimistic && <span> (Saving...)</span>}
        </li>
      );
    });
  };

  return () => (
    <div>
      <h1>Todos with Optimistic Updates</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.target.elements.namedItem("text") as HTMLInputElement;
          addTodo(input.value);
          input.value = "";
        }}
      >
        <input name="text" placeholder="New todo..." />
        <button type="submit" disabled={createTodo.isRunning}>
          Add
        </button>
      </form>

      {createTodo.error && (
        <p style={{ color: "red" }}>Failed to save: {createTodo.error}</p>
      )}

      {fetchTodos.isRunning ? (
        <p>Loading todos...</p>
      ) : (
        <ul>{renderTodos()}</ul>
      )}
    </div>
  );
}
```

### Advanced Optimistic Update Pattern

For more complex scenarios with updates and deletes:

```tsx
function TodoListAdvanced() {
  const state = createState<{
    todos: Todo[];
    optimisticOps: Map<number, "creating" | "updating" | "deleting">;
  }>({
    todos: [],
    optimisticOps: new Map(),
  });

  const updateTodo = createTask(
    (update: { id: number; changes: Partial<Todo> }) =>
      fetch(`/api/todos/${update.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update.changes),
      }).then((r) => r.json() as Promise<Todo>)
  );

  const deleteTodo = createTask((id: number) =>
    fetch(`/api/todos/${id}`, { method: "DELETE" }).then((r) => {
      if (!r.ok) throw new Error("Delete failed");
      return id;
    })
  );

  const toggleTodo = async (id: number) => {
    const todo = state.todos.find((t) => t.id === id);
    if (!todo) return;

    // Optimistic update
    const previousDone = todo.done;
    todo.done = !todo.done;
    state.optimisticOps.set(id, "updating");

    try {
      await updateTodo.run({ id, changes: { done: todo.done } });
      state.optimisticOps.delete(id);
    } catch (error) {
      // Rollback on error
      todo.done = previousDone;
      state.optimisticOps.delete(id);
    }
  };

  const removeTodo = async (id: number) => {
    const index = state.todos.findIndex((t) => t.id === id);
    if (index === -1) return;

    // Optimistic delete
    const [removedTodo] = state.todos.splice(index, 1);
    state.optimisticOps.set(id, "deleting");

    try {
      await deleteTodo.run(id);
      state.optimisticOps.delete(id);
    } catch (error) {
      // Rollback - restore todo
      state.todos.splice(index, 0, removedTodo);
      state.optimisticOps.delete(id);
    }
  };

  return () => (
    <div>
      <h1>Advanced Optimistic Updates</h1>

      <ul>
        {state.todos.map((todo) => {
          const op = state.optimisticOps.get(todo.id);

          return (
            <li
              key={todo.id}
              style={{
                opacity: op ? 0.5 : 1,
                textDecoration: op === "deleting" ? "line-through" : "none",
              }}
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                disabled={!!op}
              />
              {todo.text}
              {op && <span> ({op}...)</span>}
              <button onClick={() => removeTodo(todo.id)} disabled={!!op}>
                Delete
              </button>
            </li>
          );
        })}
      </ul>

      {(updateTodo.error || deleteTodo.error) && (
        <p style={{ color: "red" }}>
          Error: {updateTodo.error || deleteTodo.error}
        </p>
      )}
    </div>
  );
}
```

## Advanced Patterns

### run() vs rerun()

- **`run(params)`** - Clears previous result before executing. Use when you want to show loading state without stale data.
- **`rerun(params)`** - Keeps previous result during execution. Use when you want to show old data while refreshing.

```tsx
function DataRefresh() {
  const data = createTask(() => fetch("/api/data").then((r) => r.json()));

  return () => (
    <div>
      {/* Clear data and show loading */}
      <button onClick={() => data.run()}>Refresh (clear)</button>

      {/* Keep showing old data while reloading */}
      <button onClick={() => data.rerun()}>Refresh (keep)</button>

      {data.isRunning && <p>Loading...</p>}
      {data.result && <pre>{JSON.stringify(data.result)}</pre>}
    </div>
  );
}
```

### Polling

Periodically refetch data:

```tsx
function LiveData() {
  const data = createTask(() => fetch("/api/live").then((r) => r.json()));

  createMountEffect(() => {
    const interval = setInterval(() => {
      data.rerun(); // Keep old data while refreshing
    }, 5000);

    return () => clearInterval(interval);
  });

  return () => (
    <div>
      {data.isRunning && <span>⟳ Updating...</span>}
      {data.result && <pre>{JSON.stringify(data.result, null, 2)}</pre>}
    </div>
  );
}
```

### Debounced Search

Wait for user to stop typing before searching:

```tsx
function SearchPosts() {
  const state = createState({ query: "" });

  const search = createTask((query: string) =>
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json() as Promise<Post[]>)
  );

  let debounceTimeout: number;

  createEffect(() => {
    const query = state.query.trim();

    // Clear previous timeout
    clearTimeout(debounceTimeout);

    if (query.length === 0) {
      return;
    }

    // Debounce search by 300ms
    debounceTimeout = setTimeout(() => {
      search.run(query);
    }, 300);
  });

  return () => (
    <div>
      <input
        type="search"
        placeholder="Search posts..."
        value={state.query}
        onInput={(e) => (state.query = e.target.value)}
      />

      {search.isRunning && <p>Searching...</p>}

      {search.result && (
        <ul>
          {search.result.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      )}

      {search.error && <p>Error: {search.error}</p>}
    </div>
  );
}
```

### Dependent Queries

Chain tasks that depend on each other:

```tsx
function UserPosts(props: { userId: number }) {
  const user = createTask(() =>
    fetch(`/api/users/${props.userId}`).then((r) => r.json() as Promise<User>)
  );

  const posts = createTask((userId: number) =>
    fetch(`/api/users/${userId}/posts`).then((r) => r.json() as Promise<Post[]>)
  );

  // Fetch posts after user loads
  createEffect(() => {
    if (user.result) {
      posts.run(user.result.id);
    }
  });

  return () => (
    <div>
      {user.isRunning && <p>Loading user...</p>}

      {user.result && (
        <>
          <h1>{user.result.name}'s Posts</h1>

          {posts.isRunning && <p>Loading posts...</p>}

          {posts.result && (
            <ul>
              {posts.result.map((post) => (
                <li key={post.id}>{post.title}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
```

### Parallel Requests

Run multiple tasks simultaneously:

```tsx
function Dashboard() {
  const user = createTask(() =>
    fetch("/api/user").then((r) => r.json() as Promise<User>)
  );

  const stats = createTask(() =>
    fetch("/api/stats").then((r) => r.json() as Promise<Stats>)
  );

  const notifications = createTask(() =>
    fetch("/api/notifications").then((r) => r.json() as Promise<Notification[]>)
  );

  const allLoaded =
    user.result !== null &&
    stats.result !== null &&
    notifications.result !== null;

  const anyLoading = user.isRunning || stats.isRunning || notifications.isRunning;

  return () => (
    <div>
      <h1>Dashboard</h1>

      {anyLoading && <p>Loading...</p>}

      {allLoaded && (
        <>
          <section>
            <h2>Welcome, {user.result.name}!</h2>
          </section>

          <section>
            <h2>Stats</h2>
            <p>Views: {stats.result.views}</p>
            <p>Posts: {stats.result.posts}</p>
          </section>

          <section>
            <h2>Notifications ({notifications.result.length})</h2>
            <ul>
              {notifications.result.map((n) => (
                <li key={n.id}>{n.message}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

### Automatic Cancellation

Previous executions are automatically cancelled when a new one starts:

```tsx
function SearchWithCancel() {
  const state = createState({ query: "" });

  const search = createTask((query: string) =>
    // This request will be cancelled if a new search starts
    fetch(`/api/search?q=${query}`).then((r) => r.json())
  );

  createEffect(() => {
    if (state.query.length > 0) {
      search.run(state.query);
    }
  });

  return () => (
    <div>
      <input
        value={state.query}
        onInput={(e) => (state.query = e.target.value)}
      />
      {/* Only shows results from the latest search */}
      {search.result && <pre>{JSON.stringify(search.result)}</pre>}
    </div>
  );
}
```

## Features

- **Automatic cancellation** - Previous executions are cancelled when a new one starts
- **Flexible control** - Use `run()` to clear old data or `rerun()` to keep it during loading
- **Type-safe** - Full TypeScript inference for parameters and results
- **Auto-run support** - Tasks without parameters run automatically on creation
- **Low-level primitive** - Build any async pattern on top (queries, mutations, polling, etc.)
- **Reactive state** - All task properties are reactive and tracked automatically

## Building Higher-Level Patterns

`createTask` is intentionally low-level. Build your own abstractions on top:

```tsx
// Custom query hook
function createQuery<T>(fetcher: () => Promise<T>) {
  const task = createTask(fetcher);

  return createView(task, {
    refetch: () => task.rerun(),
    invalidate: () => task.run(),
  });
}

// Custom mutation hook
function createMutation<T, P>(
  mutator: (params: P) => Promise<T>,
  options?: { onSuccess?: (result: T) => void }
) {
  const task = createTask(mutator);

  return createView(task, {
    mutate: async (params: P) => {
      const result = await task.run(params);
      options?.onSuccess?.(result);
      return result;
    },
  });
}

// Usage
function MyComponent() {
  const user = createQuery(() => fetch("/api/user").then((r) => r.json()));

  const updateUser = createMutation(
    (data: UserUpdate) =>
      fetch("/api/user", {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    {
      onSuccess: () => user.refetch(),
    }
  );

  return () => (
    <div>
      {user.result && <p>{user.result.name}</p>}
      <button onClick={() => updateUser.mutate({ name: "New Name" })}>
        Update
      </button>
    </div>
  );
}
```

## TypeScript Support

`createTask` is fully typed with automatic inference:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
}

interface CreatePostData {
  title: string;
  body: string;
}

// Auto-run task
const user = createTask(() =>
  fetch("/api/user").then((r) => r.json() as Promise<User>)
);
// user.result is inferred as User | null

// Task with parameters
const posts = createTask((page: number) =>
  fetch(`/api/posts?page=${page}`).then((r) => r.json() as Promise<Post[]>)
);
// posts.params is inferred as number | null
// posts.result is inferred as Post[] | null

// Mutation task
const create = createTask((data: CreatePostData) =>
  fetch("/api/posts", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.json() as Promise<Post>)
);
// create.params is inferred as CreatePostData | null
// create.result is inferred as Post | null
```

## Notes

::: warning Important
- Tasks without parameters run automatically on creation
- Tasks with parameters must be called explicitly via `run()` or `rerun()`
- Previous task executions are automatically cancelled when a new one starts
- **Do not destructure** task objects - breaks reactivity (see core concepts)
- Error messages are automatically converted to strings
- Only call `createTask` during component setup phase
:::

::: tip Best Practice
Use `run()` when you want to clear stale data (e.g., refreshing with a new query), and `rerun()` when you want to keep displaying old data while loading new data (e.g., polling, background refresh).
:::

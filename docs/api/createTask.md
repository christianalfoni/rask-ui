# createTask()

A low-level reactive primitive for managing any async operation. `createTask` provides the foundation for building data fetching, mutations and any other async pattern you need. Higher abstractions like queries, mutations etc. can be built on top of this.

```tsx
// Task without parameters
createTask<T>(task: () => Promise<T>): Task<T, never>

// Task with parameters
createTask<P, T>(task: (params: P) => Promise<T>): Task<T, P>
```

## Type

The `Task` type is exported and can be used for type annotations:

```tsx
import { Task } from "rask-ui";

// Task that returns a string, no parameters
const myTask: Task<string>;

// Task that returns a string, accepts string parameters
const myTask: Task<string, string>;
```

## Parameters

- `task: () => Promise<T>` - Async function without parameters
- `task: (params: P) => Promise<T>` - Async function with parameters

## Returns

Task object with reactive state and methods:

**State Properties:**

- `isRunning: boolean` - True while task is executing
- `result: T | null` - Result of successful execution (null if not yet run, running, or error)
- `error: string | null` - Error message from failed execution (null if successful or running)
- `params: P | null` - Current parameters while running (null when idle)

**Methods:**

- `run(params?: P): Promise<T>` - Execute the task, clearing previous result
- `rerun(params?: P): Promise<T>` - Re-execute the task, keeping previous result until new one arrives

## Basic Example

```tsx
import { createTask } from "rask-ui";

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const fetchUser = createTask(() =>
    fetch("/api/user").then((r) => r.json() as User)
  );

  fetchUser.run();

  return () => {
    if (fetchUser.isRunning) {
      return <div>Loading user...</div>;
    }

    if (fetchUser.error) {
      return <div>Error: {user.error}</div>;
    }

    return (
      <div>
        <h1>{fetchUser.result.name}</h1>
        <p>{fetchUser.result.email}</p>
        <button onClick={() => fetchUser.rerun()}>Refresh</button>
      </div>
    );
  };
}
```

## With Parameters

```tsx
interface Post {
  id: number;
  title: string;
  body: string;
}

function PostsList() {
  const state = createState({ page: 1 });
  const fetchPosts = createTask((page: number) =>
    fetch(`/api/posts?page=${page}&limit=10`).then(
      (r) => r.json() as Promise<Post[]>
    )
  );

  fetchPosts.run();

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
        <button onClick={() => state.page--} disabled={state.page === 1}>
          Previous
        </button>
        <button onClick={() => state.page++}>Next</button>
      </div>
    </div>
  );
}
```

## Mutations

```tsx
interface CreatePostData {
  title: string;
  body: string;
}

function CreatePost() {
  const state = createState({ title: "", body: "" });

  const createPost = createTask((data: CreatePostData) =>
    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => {
      if (!r.ok) throw new Error("Failed to create post");
      return r.json();
    })
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await createPost.run({ title: state.title, body: state.body });
    state.title = "";
    state.body = "";
  };

  return () => (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={state.title}
        onInput={(e) => (state.title = e.target.value)}
      />
      <textarea
        value={state.body}
        onInput={(e) => (state.body = e.target.value)}
      />
      <button type="submit" disabled={createPost.isRunning}>
        {createPost.isRunning ? "Creating..." : "Create"}
      </button>
      {createPost.error && <p>Error: {createPost.error}</p>}
    </form>
  );
}
```

## Features

- **Automatic cancellation** - Previous executions are cancelled when a new one starts
- **Flexible control** - Use `run()` to clear old data or `rerun()` to keep it during loading
- **Type-safe** - Full TypeScript inference for parameters and results
- **Low-level primitive** - Build any async pattern on top (queries, mutations, polling, etc.)
- **Reactive state** - All task properties are reactive and tracked automatically

## Notes

::: warning Important

- Previous task executions are automatically cancelled when a new one starts
- **Do not destructure** task objects - breaks reactivity
- Error messages are automatically converted to strings
- Only call `createTask` during component setup phase
  :::

::: tip Best Practice
Use `run()` when you want to clear stale data (e.g., refreshing with a new query), and `rerun()` when you want to keep displaying old data while loading new data (e.g., polling, background refresh).
:::

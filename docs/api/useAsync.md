# useAsync()

A reactive hook for managing asynchronous data fetching. `useAsync` automatically observes reactive dependencies, fetches data when they change, and cancels previous requests when new ones start.

```tsx
const [state, refresh] = useAsync((signal) => {
  // async operation
});
```

## Basic Example

```tsx
import { useAsync, useState } from "rask-ui";

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const userId = useState({ id: 1 });

  const [user, refresh] = useAsync(async (signal) => {
    const response = await fetch(`/api/users/${userId.id}`, { signal });
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json() as Promise<User>;
  });

  return () => {
    if (user.error) {
      return (
        <div>
          <p>Error: {user.error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      );
    }

    if (user.isLoading) {
      return <p>Loading...</p>;
    }

    return (
      <div>
        <h1>{user.value.name}</h1>
        <p>{user.value.email}</p>
        <button onClick={() => userId.id++}>Next User</button>
        <button onClick={refresh}>Refresh</button>
      </div>
    );
  };
}
```

## Automatic Dependency Tracking

`useAsync` observes reactive state accessed during execution and automatically refetches when dependencies change:

```tsx
import { useAsync, useState } from "rask-ui";

function SearchResults() {
  const state = useState({ query: "", filter: "all" });

  // Automatically refetches when state.query or state.filter change
  const [results, refresh] = useAsync(async (signal) => {
    if (!state.query) return [];

    const response = await fetch(
      `/api/search?q=${state.query}&filter=${state.filter}`,
      { signal }
    );
    return response.json();
  });

  return () => (
    <div>
      <input
        value={state.query}
        onInput={(e) => (state.query = e.target.value)}
        placeholder="Search..."
      />
      <select value={state.filter} onChange={(e) => (state.filter = e.target.value)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>

      {results.error && <p>Error: {results.error.message}</p>}
      {results.isLoading && <p>Loading...</p>}
      <ul>
        {results.value?.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Loading and Refreshing States

The state distinguishes between initial loading and refreshing existing data. Use `isRefreshing` to show loading indicators while preserving the current data:

```tsx
function DataView() {
  const state = useState({ endpoint: "/api/data" });

  const [data, refresh] = useAsync(async (signal) => {
    const response = await fetch(state.endpoint, { signal });
    return response.json();
  });

  return () => (
    <div>
      {data.error && <p>Error: {data.error.message}</p>}
      {data.isLoading && <p>Loading initial data...</p>}
      {data.isRefreshing && <p>Refreshing data...</p>}

      {data.value && (
        <div>
          <pre>{JSON.stringify(data.value, null, 2)}</pre>
          <button onClick={refresh} disabled={data.isLoading}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
```

## Error Handling: Hard Errors vs Soft Errors

Distinguish between "hard errors" (initial load failure) and "soft errors" (refresh failure while data is still available):

```tsx
function RobustDataView() {
  const [data, refresh] = useAsync(async (signal) => {
    const response = await fetch("/api/data", { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });

  return () => {
    // Hard error: Initial load failed, no data available
    if (data.error && data.isLoading) {
      return (
        <div>
          <h2>Failed to load data</h2>
          <p>{data.error.message}</p>
          <button onClick={refresh}>Try Again</button>
        </div>
      );
    }

    // Soft error: Refresh failed, but we still have stale data
    if (data.error && data.isRefreshing) {
      return (
        <div>
          <div className="warning-banner">
            <strong>Out of sync:</strong> {data.error.message}
            <button onClick={refresh}>Retry</button>
          </div>
          {/* Show stale data with visual indication */}
          <div className="stale-content">
            <pre>{JSON.stringify(data.value, null, 2)}</pre>
          </div>
        </div>
      );
    }

    if (data.isLoading) return <p>Loading...</p>;

    // Show refresh indicator with existing content
    return (
      <div>
        {data.isRefreshing && (
          <div className="refresh-indicator">Updating...</div>
        )}
        <pre>{JSON.stringify(data.value, null, 2)}</pre>
        <button onClick={refresh}>Refresh</button>
      </div>
    );
  };
}
```

::: tip Hard vs Soft Errors
- **Hard Error** (`error && isLoading`): Initial fetch failed, no data to display - show error UI
- **Soft Error** (`error && isRefreshing`): Refresh failed but previous data still valid - show stale data with warning
:::

## Error Handling

Errors are captured and can be displayed or handled:

```tsx
function RobustDataFetcher() {
  const [data, refresh] = useAsync(async (signal) => {
    const response = await fetch("/api/data", { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });

  return () => {
    if (data.error) {
      return (
        <div>
          <h2>Failed to load data</h2>
          <p>{data.error.message}</p>
          <button onClick={refresh}>Try Again</button>
        </div>
      );
    }

    if (data.isLoading) return <p>Loading...</p>;

    return (
      <div>
        <div>{data.value.content}</div>
        <button onClick={refresh}>Refresh</button>
      </div>
    );
  };
}
```

## Using the Signal Parameter

The `AbortSignal` parameter automatically cancels in-flight requests when new fetches start or when dependencies change:

```tsx
function UserSearch() {
  const state = useState({ searchTerm: "" });

  const [users, refresh] = useAsync(async (signal) => {
    if (!state.searchTerm) return [];

    // Signal automatically cancels this request if searchTerm changes again
    const response = await fetch(`/api/users/search?q=${state.searchTerm}`, {
      signal,
    });
    return response.json();
  });

  return () => (
    <div>
      <input
        value={state.searchTerm}
        onInput={(e) => (state.searchTerm = e.target.value)}
        placeholder="Search users..."
      />
      {users.error && <p>Error: {users.error.message}</p>}
      {users.isLoading && <p>Searching...</p>}
      <ul>
        {users.value?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Multi-Step Operations with Cancellation

Check the signal status between steps in complex operations:

```tsx
function ComplexDataFetch() {
  const [result, refresh] = useAsync(async (signal) => {
    const step1 = await fetch("/api/step1").then((r) => r.json());

    // Check if operation was cancelled after first step
    if (signal.aborted) return null;

    const step2 = await fetch(`/api/step2/${step1.id}`).then((r) => r.json());

    if (signal.aborted) return null;

    const step3 = await fetch(`/api/step3/${step2.id}`).then((r) => r.json());

    return step3;
  });

  return () => <div>{result.value && <pre>{JSON.stringify(result.value)}</pre>}</div>;
}
```

## State Type

```tsx
type AsyncState<T> =
  | {
      error: Error;
      isLoading: true;
      isRefreshing: false;
      value: null;
    }
  | {
      error: Error;
      isLoading: false;
      isRefreshing: true;
      value: T;
    }
  | {
      error: null;
      isLoading: true;
      isRefreshing: false;
      value: null;
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: true;
      value: T;
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: false;
      value: T;
    };
```

## Refresh Function Promise

The `refresh` function returns a promise that resolves when the value has been updated. This is useful when you need to wait for the refresh to complete before performing additional operations:

```tsx
function DataManager() {
  const [data, refresh] = useAsync(async (signal) => {
    const response = await fetch("/api/data", { signal });
    return response.json();
  });

  const handleRefreshAndSave = async () => {
    // Wait for refresh to complete
    await refresh();

    // Now data.value contains the updated value
    console.log("Updated data:", data.value);

    // Perform additional operations with the fresh data
    localStorage.setItem("cachedData", JSON.stringify(data.value));
  };

  return () => (
    <div>
      {data.error && <p>Error: {data.error.message}</p>}
      {data.isLoading && <p>Loading...</p>}
      {data.value && <pre>{JSON.stringify(data.value, null, 2)}</pre>}
      <button onClick={handleRefreshAndSave}>Refresh and Save</button>
    </div>
  );
}
```

::: tip Multiple Concurrent Refreshes
If multiple `refresh()` calls are made concurrently, each promise will resolve when the value actually updates, not just when that particular request completes. This ensures consistency when multiple parts of your application trigger refreshes simultaneously.
:::

## Features

- **Automatic observation** - Tracks reactive dependencies and refetches when they change
- **Automatic cancellation** - Previous fetches are cancelled when new ones start
- **Type-safe** - Full TypeScript inference for results
- **Signal support** - AbortSignal provided for request cancellation
- **Loading states** - Distinguishes between initial loading and refreshing
- **Error handling** - Captures and exposes errors for UI handling
- **Reactive state** - All properties are reactive and tracked automatically
- **Promise-based refresh** - Refresh function returns a promise that resolves when value updates

## Notes

::: warning Important

- Previous fetches are automatically cancelled when dependencies change or refresh is called
- **Do not destructure** state objects - breaks reactivity
- Runs immediately on component setup
- Only call `useAsync` during component setup phase
  :::

## Related

- [useAction](/api/useAction) - Handle async operations with queuing
- [useSuspend](/api/useSuspend) - Suspend until multiple async values resolve
- [useState](/api/useState) - Reactive state management
- [useEffect](/api/useEffect) - Side effects

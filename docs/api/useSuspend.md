# useSuspend()

A reactive hook for coordinating multiple values (both synchronous and asynchronous) to update together. Use `useSuspend` when you need to ensure all values update simultaneously, preventing partial renders during data changes.

```tsx
const state = useSuspend({
  key1: () => asyncState1,
  key2: () => asyncState2,
});
```

## Basic Example

```tsx
import { useSuspend, useAsync, useState } from "rask-ui";

interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
}

function UserProfile() {
  const userId = useState({ id: 1 });

  const [user] = useAsync(async (signal) => {
    const response = await fetch(`/api/users/${userId.id}`, { signal });
    return response.json() as Promise<User>;
  });

  const [posts] = useAsync(async (signal) => {
    const response = await fetch(`/api/users/${userId.id}/posts`, { signal });
    return response.json() as Promise<Post[]>;
  });

  const suspended = useSuspend({
    user: () => user,
    posts: () => posts,
  });

  return () => {
    if (suspended.error) {
      return <p>Error: {suspended.error.message}</p>;
    }

    if (suspended.isLoading) {
      return <p>Loading user and posts...</p>;
    }

    return (
      <div>
        <h1>{suspended.values.user.name}</h1>
        <h2>Posts</h2>
        <ul>
          {suspended.values.posts.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      </div>
    );
  };
}
```

## Refreshing State

The `isRefreshing` state indicates when data is being refreshed but previous values are still available:

```tsx
import { useSuspend, useAsync, useState } from "rask-ui";

function Dashboard() {
  const filters = useState({ region: "us", period: "today" });

  const [users] = useAsync(async (signal) => {
    const response = await fetch(
      `/api/users?region=${filters.region}&period=${filters.period}`,
      { signal }
    );
    return response.json();
  });

  const [sales] = useAsync(async (signal) => {
    const response = await fetch(
      `/api/sales?region=${filters.region}&period=${filters.period}`,
      { signal }
    );
    return response.json();
  });

  const data = useSuspend({
    users: () => users,
    sales: () => sales,
  });

  return () => {
    if (data.error) {
      return <p>Error: {data.error.message}</p>;
    }

    if (data.isLoading) {
      return <p>Loading dashboard...</p>;
    }

    return (
      <div>
        {data.isRefreshing && <div className="loading-indicator">Updating...</div>}

        <select
          value={filters.region}
          onChange={(e) => (filters.region = e.target.value)}
        >
          <option value="us">US</option>
          <option value="eu">EU</option>
          <option value="asia">Asia</option>
        </select>

        <h2>Users: {data.values.users.count}</h2>
        <h2>Sales: ${data.values.sales.total}</h2>
      </div>
    );
  };
}
```

## Coordinating Sync and Async Values

`useSuspend` coordinates both async states and synchronous values so they all update together. When async values change, the component suspends until all async values resolve, then updates everything simultaneously including any synchronous values:

```tsx
import { useSuspend, useAsync, useState } from "rask-ui";

function ProductPage() {
  const productId = useState({ id: 1 });
  const localSettings = useState({ currency: "USD" });

  const [product] = useAsync(async (signal) => {
    const response = await fetch(`/api/products/${productId.id}`, { signal });
    return response.json();
  });

  const [reviews] = useAsync(async (signal) => {
    const response = await fetch(`/api/products/${productId.id}/reviews`, {
      signal,
    });
    return response.json();
  });

  // Coordinate async states with synchronous values
  // When productId changes, all values update together - no partial renders
  const data = useSuspend({
    product: () => product,
    reviews: () => reviews,
    settings: () => localSettings, // Syncs with async updates
  });

  return () => {
    if (data.error) {
      return <p>Error loading product</p>;
    }

    if (data.isLoading) {
      return <p>Loading product...</p>;
    }

    return (
      <div>
        <h1>{data.values.product.name}</h1>
        <p>
          Price: {data.values.settings.currency} {data.values.product.price}
        </p>

        {/* Change productId - component suspends until both async values resolve */}
        <button onClick={() => productId.id++}>Next Product</button>

        {/* Change currency - updates immediately with current product data */}
        <select
          value={data.values.settings.currency}
          onChange={(e) => (localSettings.currency = e.target.value)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>

        <div>
          <h2>Reviews ({data.values.reviews.length})</h2>
          {data.values.reviews.map((review) => (
            <div key={review.id}>{review.text}</div>
          ))}
        </div>
      </div>
    );
  };
}
```

::: tip Synchronized Updates
When `productId` changes, both `product` and `reviews` async states refetch. The component enters `isRefreshing` state and shows the previous data until **both** async operations complete. Then all values (including `settings`) update together in a single render, preventing inconsistent UI states.
:::

## Coordinating Multiple Data Sources

```tsx
import { useSuspend, useAsync } from "rask-ui";

function AnalyticsDashboard() {
  const [metrics] = useAsync(async (signal) => {
    const response = await fetch("/api/metrics", { signal });
    return response.json();
  });

  const [events] = useAsync(async (signal) => {
    const response = await fetch("/api/events", { signal });
    return response.json();
  });

  const [users] = useAsync(async (signal) => {
    const response = await fetch("/api/users/stats", { signal });
    return response.json();
  });

  const dashboard = useSuspend({
    metrics: () => metrics,
    events: () => events,
    users: () => users,
  });

  return () => {
    if (dashboard.error) {
      return (
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Failed to load: {dashboard.error.message}</p>
        </div>
      );
    }

    if (dashboard.isLoading) {
      return (
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Loading all data sources...</p>
        </div>
      );
    }

    return (
      <div>
        <h1>Analytics Dashboard</h1>
        {dashboard.isRefreshing && <span>Refreshing...</span>}

        <div className="metrics">
          <h2>Metrics</h2>
          <div>Views: {dashboard.values.metrics.views}</div>
          <div>Clicks: {dashboard.values.metrics.clicks}</div>
        </div>

        <div className="events">
          <h2>Recent Events</h2>
          <ul>
            {dashboard.values.events.map((event) => (
              <li key={event.id}>{event.name}</li>
            ))}
          </ul>
        </div>

        <div className="users">
          <h2>User Stats</h2>
          <div>Active: {dashboard.values.users.active}</div>
          <div>Total: {dashboard.values.users.total}</div>
        </div>
      </div>
    );
  };
}
```

## State Type

```tsx
type SuspendState<T extends Record<string, () => any>> =
  | {
      error: Error;
      isLoading: true;
      isRefreshing: false;
      values: { [K in keyof T]: /* resolved value or null */ };
    }
  | {
      error: Error;
      isLoading: false;
      isRefreshing: true;
      values: { [K in keyof T]: /* resolved non-null value */ };
    }
  | {
      error: null;
      isLoading: true;
      isRefreshing: false;
      values: { [K in keyof T]: /* resolved value or null */ };
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: true;
      values: { [K in keyof T]: /* resolved non-null value */ };
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: false;
      values: { [K in keyof T]: /* resolved non-null value */ };
    };
```

## Features

- **Synchronized updates** - All values (sync and async) update together atomically
- **Coordinated loading** - Wait for all async values to resolve before showing content
- **Prevents partial renders** - No flickering or inconsistent states during updates
- **Unified error handling** - Single error state for all async operations
- **Refreshing state** - Distinguishes between initial load and refresh
- **Type-safe values** - Full TypeScript inference for all values
- **Mixed sources** - Seamlessly combines async states and synchronous values
- **Reactive tracking** - Automatically tracks all state changes
- **Automatic cleanup** - Cleaned up when component unmounts

## Notes

::: warning Important

- All async values must resolve before `isLoading` becomes false
- If any async value has an error, the error is surfaced in the suspend state
- Values are accessed through the `values` object
- **Do not destructure** state objects - breaks reactivity
- Only call `useSuspend` during component setup phase
  :::

## Related

- [useAsync](/api/useAsync) - Fetch async values with observation
- [useAction](/api/useAction) - Handle async operations with queuing
- [useState](/api/useState) - Reactive state management
- [useEffect](/api/useEffect) - Side effects

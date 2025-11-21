# createRouter

Creates a reactive router for client-side navigation with full TypeScript support.

```tsx
const router = createRouter(routes, options?)
```

## Basic Usage

```tsx
import { useRouter } from "rask-ui";

const routes = {
  home: "/",
  about: "/about",
  user: "/users/:id",
  post: "/posts/:id",
} as const;

function App() {
  const router = useRouter(routes);

  return () => {
    if (router.route?.name === "home") {
      return <Home />;
    }

    if (router.route?.name === "user") {
      return <User id={router.route.params.id} />;
    }

    if (router.route?.name === "post") {
      return <Post id={router.route.params.id} />;
    }

    return <NotFound />;
  };
}
```

## Parameters

### config

Route configuration object mapping route names to path patterns.

```tsx
const routes = {
  home: "/",
  users: "/users",
  user: "/users/:id",
  userPosts: "/users/:userId/posts/:postId",
} as const;
```

Use `:param` syntax for dynamic segments. Parameters are automatically extracted and type-checked.

### options

Optional configuration object:

- `base?: string` - Base path for all routes (e.g., `/app`)

```tsx
const router = useRouter(routes, { base: "/app" });
```

## Return Value

Returns a router object with reactive properties and navigation methods.

### Properties

#### route

Current active route with `name` and `params` properties. Reactive - accessing it tracks dependencies.

```tsx
if (router.route?.name === "user") {
  const userId = router.route.params.id; // Type-safe!
}
```

#### queries

Current URL query parameters as an object. Reactive - accessing it tracks dependencies.

```tsx
const searchTerm = router.queries.q || "";
const page = parseInt(router.queries.page || "1");
```

### Methods

#### push(name, params?, query?)

Navigate to a route by name, adding a new history entry.

```tsx
// Navigate to home
router.push("home");

// Navigate with params
router.push("user", { id: "123" });

// Navigate with query
router.push("home", {}, { tab: "recent" });
```

#### replace(name, params?, query?)

Navigate to a route without adding a history entry.

```tsx
router.replace("home");
router.replace("user", { id: "456" });
```

#### setQuery(query)

Update query parameters without changing the route.

```tsx
router.setQuery({ page: "2", filter: "active" });
```

#### url(name, params?, query?)

Generate a URL string for a route without navigating.

```tsx
const userUrl = router.url("user", { id: "123" });
// "/users/123"

const searchUrl = router.url("home", {}, { q: "search" });
// "/?q=search"
```

## Features

### Reactive Integration

The router integrates with RASK's reactivity system. Route changes automatically trigger re-renders.

```tsx
function UserProfile() {
  const router = useRouter(routes);
  const state = useState({ user: null });

  // Effect runs when route changes
  useEffect(() => {
    if (router.route?.name === "user") {
      fetch(`/api/users/${router.route.params.id}`)
        .then((r) => r.json())
        .then((data) => (state.user = data));
    }
  });

  return () => <div>{state.user && <h1>{state.user.name}</h1>}</div>;
}
```

### Type Safety

Routes are fully type-safe with TypeScript inference.

```tsx
const routes = {
  user: "/users/:id",
  post: "/posts/:postId/:commentId",
} as const;

const router = Router(routes);

// ✅ Type-safe
router.push("user", { id: "123" });

// ❌ Type error - missing required params
router.push("post", { postId: "1" });

// ✅ Type-safe params access
if (router.route?.name === "post") {
  const postId = router.route.params.postId; // string
  const commentId = router.route.params.commentId; // string
}
```

### Query Parameters

Built-in support for query string management.

```tsx
function SearchPage() {
  const router = useRouter(routes);

  return () => (
    <div>
      <p>Search: {router.queries.q || "none"}</p>
      <input
        value={router.queries.q || ""}
        onInput={(e) => router.setQuery({ q: e.target.value })}
      />
      <p>Page: {router.queries.page || "1"}</p>
    </div>
  );
}
```

### Context Pattern

Share router across components using context.

```tsx
import { useRouter, createContext } from "rask-ui";

const routes = {
  home: "/",
  about: "/about",
  user: "/users/:id",
} as const;

const RouterContext = createContext<Router<typeof routes>>();

function App() {
  const router = useRouter(routes);
  const inject = useInjectContext(RouterContext);
  inject(router);

  return () => <Content />;
}

function Navigation() {
  const router = useContext(RouterContext);

  return () => (
    <nav>
      <button onClick={() => router.push("home")}>Home</button>
      <button onClick={() => router.push("about")}>About</button>
      <button onClick={() => router.push("user", { id: "123" })}>
        User 123
      </button>
    </nav>
  );
}
```

## Advanced Patterns

### Nested Routes

Handle nested routes using path patterns:

```tsx
const routes = {
  settings: "/settings",
  settingsProfile: "/settings/profile",
  settingsNotifications: "/settings/notifications",
} as const;

function Settings() {
  const router = useRouter(routes);

  return () => (
    <div>
      <nav>
        <button onClick={() => router.push("settingsProfile")}>Profile</button>
        <button onClick={() => router.push("settingsNotifications")}>
          Notifications
        </button>
      </nav>

      {router.route?.name === "settingsProfile" && <ProfileSettings />}
      {router.route?.name === "settingsNotifications" && (
        <NotificationSettings />
      )}
    </div>
  );
}
```

### Route Guards

Implement route guards using effects:

```tsx
function ProtectedApp() {
  const router = useRouter(routes);
  const auth = useState({ isAuthenticated: false });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (router.route?.name !== "login" && !auth.isAuthenticated) {
      router.replace("login");
    }
  });

  return () => <div>{/* App content */}</div>;
}
```

### Data Loading

Load data based on route parameters:

```tsx
function Posts() {
  const router = useRouter(routes);

  const [postsState, fetchPosts] = useAsync((page: string, signal) =>
    fetch(`/api/posts?page=${page}`, { signal }).then((r) => r.json())
  );

  useEffect(() => {
    const page = router.queries.page || "1";
    fetchPosts(page);
  });

  return () => (
    <div>
      {postsState.isPending && <p>Loading...</p>}
      {postsState.value?.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
      <button onClick={() => router.setQuery({ page: "2" })}>Next Page</button>
    </div>
  );
}
```

## Notes

- Built on [typed-client-router](https://github.com/christianalfoni/typed-client-router)
- Uses the browser's History API
- Automatically cleaned up when component unmounts
- Route matching is case-sensitive
- Query parameters are always strings
- Reactive properties (`route`, `queries`) automatically track dependencies
- Navigation methods (`push`, `replace`) are not reactive

## Related

- [createContext](/api/createContext) - Share router across components
- [useEffect](/api/useEffect) - React to route changes
- [useAsync](/api/useAsync) - Load data based on routes

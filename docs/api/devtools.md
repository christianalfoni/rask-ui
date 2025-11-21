# Developer Tools

Functions for building devtools and debugging reactive applications.

## inspect()

Enables inspection of reactive state, computed values, and actions for building devtools. This API is **development-only** and has zero overhead in production builds.

```tsx
inspect(root: any, callback: (event: InspectEvent) => void): void
```

### Parameters

- `root: any` - The reactive object to inspect (state, view, computed, etc.)
- `callback: (event: InspectEvent) => void` - Callback receiving inspection events

### Event Types

The callback receives events of three types:

```tsx
type InspectEvent =
  | {
      type: "mutation";
      path: string[];      // Property path, e.g., ["user", "name"]
      value: any;          // New value
    }
  | {
      type: "action";
      path: string[];      // Function name path, e.g., ["increment"]
      params: any[];       // Function parameters
    }
  | {
      type: "computed";
      path: string[];      // Computed property path
      isDirty: boolean;    // true when invalidated, false when recomputed
      value: any;          // Current or recomputed value
    };
```

### Basic Example

```tsx
import { inspect, useState, useDerived, useView } from "rask-ui";

function Counter() {
  const state = useState({ count: 0, name: "Counter" });

  const computed = useDerived({
    double: () => state.count * 2,
  });

  const actions = {
    increment: () => state.count++,
    decrement: () => state.count--,
    reset: () => state.count = 0,
  };

  const view = useView(state, computed, actions);

  // Enable inspection
  inspect(view, (event) => {
    console.log('Event:', event.type, 'Path:', event.path);

    switch (event.type) {
      case "mutation":
        console.log('New value:', event.value);
        break;
      case "action":
        console.log('Called with params:', event.params);
        break;
      case "computed":
        console.log('Dirty:', event.isDirty, 'Value:', event.value);
        break;
    }
  });

  return () => (
    <div>
      <h1>{view.name}: {view.count}</h1>
      <p>Double: {view.double}</p>
      <button onClick={view.increment}>+</button>
      <button onClick={view.decrement}>-</button>
      <button onClick={view.reset}>Reset</button>
    </div>
  );
}
```

### Event Flow Example

When the user clicks the increment button, you'll receive events like:

```tsx
// 1. Action called
{
  type: "action",
  path: ["increment"],
  params: []
}

// 2. State mutated
{
  type: "mutation",
  path: ["count"],
  value: 1
}

// 3. Computed becomes dirty
{
  type: "computed",
  path: ["double"],
  isDirty: true,
  value: 0  // Previous value
}

// 4. Computed recomputed (when accessed during render)
{
  type: "computed",
  path: ["double"],
  isDirty: false,
  value: 2  // New value
}
```

## Nested Views (State Trees)

The inspector tracks **nested property paths** automatically. You can compose deeply nested views to create a state tree, and the inspector will report the full path to any mutation.

### Nested View Example

```tsx
function App() {
  // Create nested state structure
  const userState = useState({
    profile: {
      name: "Alice",
      email: "alice@example.com",
    },
    preferences: {
      theme: "dark",
      notifications: true,
    },
  });

  const cartState = useState({
    items: [],
    total: 0,
  });

  const uiState = useState({
    sidebarOpen: false,
    currentPage: "home",
  });

  // Compose into a state tree
  const appState = useView({
    user: useView(userState),
    cart: useView(cartState),
    ui: useView(uiState),
  });

  // Inspect the entire state tree
  inspect(appState, (event) => {
    console.log(event);
  });

  // When you do: appState.user.profile.name = "Bob"
  // You receive:
  // {
  //   type: "mutation",
  //   path: ["user", "profile", "name"],
  //   value: "Bob"
  // }

  // When you do: appState.cart.items.push({id: 1, name: "Product"})
  // You receive:
  // {
  //   type: "mutation",
  //   path: ["cart", "items"],
  //   value: [{id: 1, name: "Product"}]
  // }

  return () => (
    <div>
      <h1>Welcome, {appState.user.profile.name}!</h1>
      <p>Theme: {appState.user.preferences.theme}</p>
      <p>Cart items: {appState.cart.items.length}</p>
    </div>
  );
}
```

### Deep Nesting Benefits

- **Organized state**: Structure your app state hierarchically
- **Full path tracking**: Always know exactly what changed and where
- **Modular composition**: Build state trees from smaller pieces
- **DevTools integration**: Visualize the entire state tree structure

## Serialization with JSON.stringify()

Views and state objects can be **serialized to JSON** using `JSON.stringify()`. This is useful for:
- Sending initial state to devtools
- Persisting state to localStorage
- Logging state snapshots
- Time-travel debugging

### JSON Serialization Example

```tsx
function App() {
  const state = useState({
    user: {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
    },
    todos: [
      { id: 1, text: "Learn RASK", done: false },
      { id: 2, text: "Build app", done: true },
    ],
    settings: {
      theme: "dark",
      notifications: true,
    },
  });

  const computed = useDerived({
    completedCount: () => state.todos.filter((t) => t.done).length,
    totalCount: () => state.todos.length,
  });

  const view = useView(state, computed);

  // Serialize to JSON - extracts all plain values
  const snapshot = JSON.stringify(view);

  console.log(snapshot);
  // Output:
  // {
  //   "user": {
  //     "id": 1,
  //     "name": "Alice",
  //     "email": "alice@example.com"
  //   },
  //   "todos": [
  //     { "id": 1, "text": "Learn RASK", "done": false },
  //     { "id": 2, "text": "Build app", "done": true }
  //   ],
  //   "settings": {
  //     "theme": "dark",
  //     "notifications": true
  //   },
  //   "completedCount": 1,
  //   "totalCount": 2
  // }

  // Send to devtools
  inspect(view, (event) => {
    if (event.type === "mutation") {
      // Send full snapshot with each mutation
      window.postMessage({
        type: "RASK_STATE_UPDATE",
        event,
        snapshot: JSON.parse(JSON.stringify(view)),
      }, "*");
    }
  });

  return () => <div>{/* Your app */}</div>;
}
```

### Serialization Features

- **Plain values only**: Functions and symbols are omitted (as per JSON spec)
- **Deep serialization**: Nested objects and arrays are fully serialized
- **Computed values included**: Computed properties are evaluated and included
- **Circular references safe**: Standard JSON.stringify behavior applies

### Use Cases

#### 1. Initial State Payload

Send initial state to devtools when connecting:

```tsx
function App() {
  const appState = createAppState();

  if (import.meta.env.DEV) {
    // Send initial state to devtools
    window.postMessage({
      type: "RASK_DEVTOOLS_INIT",
      initialState: JSON.parse(JSON.stringify(appState)),
    }, "*");

    // Track changes
    inspect(appState, (event) => {
      window.postMessage({
        type: "RASK_DEVTOOLS_EVENT",
        event,
      }, "*");
    });
  }

  return () => <div>{/* Your app */}</div>;
}
```

#### 2. State Persistence

Save and restore state from localStorage:

```tsx
function App() {
  const state = useState({
    user: null,
    settings: { theme: "light" },
  });

  // Load from localStorage on mount
  useMountEffect(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore state
      Object.assign(state, parsed);
    }
  });

  // Save to localStorage on changes
  inspect(state, () => {
    const snapshot = JSON.stringify(state);
    localStorage.setItem("appState", snapshot);
  });

  return () => <div>{/* Your app */}</div>;
}
```

#### 3. Time-Travel Debugging

Record state snapshots for replay:

```tsx
function createTimeTravel(rootState) {
  const history = [];
  let currentIndex = -1;

  inspect(rootState, (event) => {
    if (event.type === "mutation") {
      // Save snapshot after each mutation
      const snapshot = JSON.parse(JSON.stringify(rootState));
      history.push({
        event,
        snapshot,
        timestamp: Date.now(),
      });
      currentIndex = history.length - 1;
    }
  });

  const goToSnapshot = (index) => {
    if (index >= 0 && index < history.length) {
      const snapshot = history[index].snapshot;
      Object.assign(rootState, snapshot);
      currentIndex = index;
    }
  };

  return {
    history,
    goToSnapshot,
    canUndo: () => currentIndex > 0,
    canRedo: () => currentIndex < history.length - 1,
    undo: () => goToSnapshot(currentIndex - 1),
    redo: () => goToSnapshot(currentIndex + 1),
  };
}
```

#### 4. State Diffing

Compare state snapshots to see what changed:

```tsx
function App() {
  const state = useState({ count: 0, name: "App" });
  let previousSnapshot = JSON.parse(JSON.stringify(state));

  inspect(state, (event) => {
    if (event.type === "mutation") {
      const currentSnapshot = JSON.parse(JSON.stringify(state));

      // Find differences
      const diff = findDifferences(previousSnapshot, currentSnapshot);
      console.log("State diff:", diff);

      previousSnapshot = currentSnapshot;
    }
  });

  return () => <div>{/* Your app */}</div>;
}

function findDifferences(prev, curr, path = []) {
  const diffs = [];

  for (const key in curr) {
    const prevVal = prev?.[key];
    const currVal = curr[key];

    if (prevVal !== currVal) {
      if (typeof currVal === "object" && currVal !== null) {
        diffs.push(...findDifferences(prevVal, currVal, [...path, key]));
      } else {
        diffs.push({
          path: [...path, key],
          from: prevVal,
          to: currVal,
        });
      }
    }
  }

  return diffs;
}
```

## Production Builds

The inspector has **zero overhead in production**. It uses Vite's `import.meta.env.DEV` constant, which is replaced at build time:

- **Development**: `import.meta.env.DEV` → `true` (inspector active)
- **Production**: `import.meta.env.DEV` → `false` (inspector removed by tree-shaking)

This means:
- No runtime checks in production code
- No function wrapping overhead
- No symbol property lookups
- No inspector-related code in the bundle
- Zero performance impact

```tsx
// In development
inspect(view, console.log); // ✅ Works, logs all events

// In production build
inspect(view, console.log); // No-op, completely removed from bundle
```

### Verifying Production Removal

You can verify the inspector is removed by checking your production bundle - search for `INSPECT_MARKER` or `inspect` and you'll find they're completely absent.

## Use Cases

### 1. Browser DevTools Extension

Build a browser extension that visualizes state changes:

```tsx
function App() {
  const store = createApplicationStore();

  if (import.meta.env.DEV) {
    inspect(store, (event) => {
      // Send to browser extension via postMessage
      window.postMessage({
        type: 'RASK_DEVTOOLS',
        event,
        timestamp: Date.now(),
      }, '*');
    });
  }

  return () => <div>{/* Your app */}</div>;
}
```

### 2. Time-Travel Debugging

Record state changes and replay them:

```tsx
function createTimeTravelDebugger(initialState) {
  const history = [];
  let currentIndex = -1;

  const record = (event) => {
    if (event.type === "mutation") {
      history.push({
        path: event.path,
        value: event.value,
        timestamp: Date.now(),
      });
      currentIndex = history.length - 1;
    }
  };

  const travelTo = (index) => {
    // Apply all mutations up to index
    // (Implementation depends on your state structure)
  };

  return { record, travelTo, history };
}

function App() {
  const state = useState({ count: 0 });
  const debugger = createTimeTravelDebugger(state);

  inspect(state, debugger.record);

  return () => (
    <div>
      <h1>Count: {state.count}</h1>
      <button onClick={() => state.count++}>+</button>
      {/* Time travel controls */}
    </div>
  );
}
```

### 3. Action Logging

Log all user actions for debugging or analytics:

```tsx
function App() {
  const actions = {
    login: (username) => {/* ... */},
    logout: () => {/* ... */},
    navigate: (path) => {/* ... */},
  };

  const view = useView(actions);

  inspect(view, (event) => {
    if (event.type === "action") {
      console.log(`[Action] ${event.path.join('.')}`, event.params);

      // Send to analytics
      analytics.track(event.path.join('.'), {
        params: event.params,
        timestamp: Date.now(),
      });
    }
  });

  return () => <div>{/* Your app */}</div>;
}
```

### 4. State Change Notifications

Show toast notifications for important state changes:

```tsx
function App() {
  const state = useState({
    user: null,
    notifications: [],
  });

  inspect(state, (event) => {
    if (event.type === "mutation" && event.path[0] === "user") {
      if (event.value) {
        showToast(`Welcome, ${event.value.name}!`);
      } else {
        showToast("You've been logged out");
      }
    }
  });

  return () => <div>{/* Your app */}</div>;
}
```

### 5. Performance Monitoring

Track computed value recalculations:

```tsx
function App() {
  const computed = useDerived({
    expensiveCalculation: () => {/* expensive work */},
  });

  const stats = { recalculations: 0, lastRecalc: null };

  inspect(computed, (event) => {
    if (event.type === "computed" && !event.isDirty) {
      stats.recalculations++;
      stats.lastRecalc = Date.now();

      if (stats.recalculations > 100) {
        console.warn('Computed recalculated too many times!');
      }
    }
  });

  return () => <div>{/* Your app */}</div>;
}
```

## Advanced Patterns

### Conditional Inspection

Only enable inspection in development or for specific users:

```tsx
function App() {
  const state = useState({ count: 0 });

  // Only in development
  if (import.meta.env.DEV) {
    inspect(state, console.log);
  }

  // Or for debug mode
  if (localStorage.getItem('debugMode') === 'true') {
    inspect(state, (event) => {
      // Enhanced debugging
    });
  }

  return () => <div>{/* Your app */}</div>;
}
```

### Multiple Inspectors

You can attach multiple inspectors to the same object:

```tsx
function App() {
  const state = useState({ count: 0 });

  // Logger
  inspect(state, (event) => {
    console.log('[Logger]', event);
  });

  // Debugger
  inspect(state, (event) => {
    if (event.type === "mutation") {
      debugger.recordMutation(event);
    }
  });

  // Analytics
  inspect(state, (event) => {
    analytics.track(event);
  });

  return () => <div>{/* Your app */}</div>;
}
```

### Selective Inspection

Inspect specific parts of your application:

```tsx
function App() {
  const userState = useState({ name: '', email: '' });
  const cartState = useState({ items: [] });
  const uiState = useState({ theme: 'light' });

  // Only inspect user and cart, not UI state
  inspect(userState, logToDevtools);
  inspect(cartState, logToDevtools);

  return () => <div>{/* Your app */}</div>;
}
```

## Notes

::: warning Important
- `inspect()` should be called during component setup phase
- The callback is synchronous - avoid heavy computations
- Inspectors are automatically cleaned up when components unmount
- Multiple inspectors can be attached to the same object
- Production builds have zero overhead due to tree-shaking
:::

::: tip Best Practice
Wrap inspector setup in `if (import.meta.env.DEV)` to make your intention explicit, even though the code will be removed in production anyway.
:::

## Integration with Existing Tools

### Redux DevTools Extension

While RASK doesn't use Redux, you can integrate with the Redux DevTools Extension:

```tsx
function App() {
  const state = useState({ count: 0 });

  if (import.meta.env.DEV && window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect();

    inspect(state, (event) => {
      if (event.type === "mutation") {
        devtools.send(
          { type: `SET_${event.path.join('_').toUpperCase()}` },
          getCurrentState(state)
        );
      }
    });
  }

  return () => <div>{/* Your app */}</div>;
}
```

### Custom Chrome Extension

Create a custom Chrome extension that listens for RASK events:

```tsx
// In your app
function App() {
  const store = createStore();

  if (import.meta.env.DEV) {
    inspect(store, (event) => {
      window.postMessage({
        source: 'rask-app',
        payload: event,
      }, '*');
    });
  }

  return () => <div>{/* Your app */}</div>;
}

// In your extension's content script
window.addEventListener('message', (event) => {
  if (event.data.source === 'rask-app') {
    // Forward to devtools panel
    chrome.runtime.sendMessage({
      type: 'RASK_EVENT',
      event: event.data.payload,
    });
  }
});
```

## Type Definitions

```tsx
// Main function
function inspect(
  root: any,
  callback: InspectorCallback
): void;

// Callback type
type InspectorCallback = (event: InspectEvent) => void;

// Event types
type InspectEvent =
  | MutationEvent
  | ActionEvent
  | ComputedEvent;

interface MutationEvent {
  type: "mutation";
  path: string[];
  value: any;
}

interface ActionEvent {
  type: "action";
  path: string[];
  params: any[];
}

interface ComputedEvent {
  type: "computed";
  path: string[];
  isDirty: boolean;
  value: any;
}
```

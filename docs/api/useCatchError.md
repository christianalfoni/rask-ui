# useCatchError()

A reactive hook for catching errors from child components during render. Use `useCatchError` as a hook-based alternative to the `ErrorBoundary` component for handling errors in a more flexible way.

```tsx
const state = useCatchError();
```

## Basic Example

```tsx
import { useCatchError } from "rask-ui";

function ErrorContainer() {
  const errorState = useCatchError();

  return () => {
    if (errorState.error) {
      return (
        <div>
          <h1>Something went wrong</h1>
          <pre>{String(errorState.error)}</pre>
        </div>
      );
    }

    return <MyComponent />;
  };
}

function MyComponent() {
  const state = useState({ count: 0 });

  return () => {
    if (state.count > 5) {
      throw new Error("Count too high!");
    }

    return <button onClick={() => state.count++}>{state.count}</button>;
  };
}
```

## With Recovery

```tsx
import { useCatchError, useState } from "rask-ui";

function ResilientComponent() {
  const errorState = useCatchError();
  const state = useState({ safeMode: false });

  return () => {
    if (errorState.error) {
      return (
        <div>
          <h2>Error occurred</h2>
          <pre>{String(errorState.error)}</pre>
          <button onClick={() => (state.safeMode = true)}>
            Switch to safe mode
          </button>
        </div>
      );
    }

    if (state.safeMode) {
      return <SafeComponent />;
    }

    return <RiskyComponent />;
  };
}
```

## Logging Errors

```tsx
import { useCatchError, useEffect } from "rask-ui";

function ErrorLogger() {
  const errorState = useCatchError();

  useEffect(() => {
    if (errorState.error) {
      // Log to analytics service
      console.error("Component error:", errorState.error);
      // You could also send to an error tracking service
      // trackError(errorState.error);
    }
  });

  return () => {
    if (errorState.error) {
      return (
        <div>
          <h2>An error occurred</h2>
          <p>The error has been logged and our team has been notified.</p>
        </div>
      );
    }

    return <App />;
  };
}
```

## Nested Error Handling

Use multiple `useCatchError` hooks for granular error handling in different parts of your app:

```tsx
import { useCatchError } from "rask-ui";

function App() {
  const globalError = useCatchError();

  return () => {
    if (globalError.error) {
      return <GlobalError error={globalError.error} />;
    }

    return (
      <div>
        <Header />
        <Sidebar />
        <MainContent />
      </div>
    );
  };
}

function Sidebar() {
  const sidebarError = useCatchError();

  return () => {
    if (sidebarError.error) {
      return <SidebarError error={sidebarError.error} />;
    }

    return <SidebarContent />;
  };
}

function MainContent() {
  const contentError = useCatchError();

  return () => {
    if (contentError.error) {
      return <ContentError error={contentError.error} />;
    }

    return <Content />;
  };
}
```

## Clearing Errors

```tsx
import { useCatchError, useState } from "rask-ui";

function ErrorBoundaryWithReset() {
  const errorState = useCatchError();
  const state = useState({ key: 0 });

  return () => {
    if (errorState.error) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <pre>{String(errorState.error)}</pre>
          <button
            onClick={() => {
              errorState.error = null; // Clear the error
              state.key++; // Force remount of child component
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return <MyComponent key={state.key} />;
  };
}
```

## Comparison with ErrorBoundary

`useCatchError` and `ErrorBoundary` serve the same purpose but with different APIs:

**ErrorBoundary Component:**

```tsx
function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h1>Error</h1>
          <p>{String(err)}</p>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

**useCatchError Hook:**

```tsx
function App() {
  const errorState = useCatchError();

  return () => {
    if (errorState.error) {
      return (
        <div>
          <h1>Error</h1>
          <p>{String(errorState.error)}</p>
        </div>
      );
    }

    return <MyComponent />;
  };
}
```

The hook approach provides more flexibility for:

- Accessing other state alongside error state
- Using effects to respond to errors
- Programmatically clearing or manipulating error state
- Conditional rendering based on multiple factors

## State Type

```tsx
type ErrorState = {
  error: unknown;
};
```

## Features

- **Error catching** - Catches errors during render phase from child components
- **Reactive state** - Error state is reactive and updates automatically
- **Flexible handling** - Use standard component logic to handle errors
- **Nestable** - Multiple error boundaries can be nested for granular control
- **Clearable** - Error state can be programmatically cleared
- **Effect integration** - Can be used with `useEffect` for side effects

## Notes

::: warning Important

- Only catches errors during the render phase of child components
- Errors bubble up to the nearest parent with `useCatchError`
- **Do not destructure** state objects - breaks reactivity
- Only call `useCatchError` during component setup phase
- The error can be any value thrown by child components
  :::

## Related

- [useState](/api/useState) - Reactive state management
- [useEffect](/api/useEffect) - Side effects

# ErrorBoundary

Component that catches errors from child components during render.

```tsx
<ErrorBoundary error={(error) => <div />}>{children}</ErrorBoundary>
```

## Example

```tsx
import { ErrorBoundary } from "rask-ui";

function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{String(err)}</pre>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Catching Component Errors

```tsx
function MyComponent() {
  const state = useState({ count: 0 });

  return () => {
    if (state.count > 5) {
      throw new Error("Count too high!");
    }

    return <button onClick={() => state.count++}>{state.count}</button>;
  };
}

function App() {
  return () => (
    <ErrorBoundary
      error={(err) => (
        <div>
          <h2>Error in component</h2>
          <p>{String(err)}</p>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Features

- Catches errors during render phase
- Errors bubble up to nearest ErrorBoundary
- Can be nested for granular error handling
- Receives the error object

## Nested Error Boundaries

Use multiple error boundaries for different parts of your app:

```tsx
function App() {
  return () => (
    <ErrorBoundary error={(err) => <GlobalError error={err} />}>
      <Header />

      <ErrorBoundary error={(err) => <SidebarError error={err} />}>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary error={(err) => <ContentError error={err} />}>
        <Content />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

## With Recovery

```tsx
function App() {
  const state = useState({ hasError: false });

  return () => {
    if (state.hasError) {
      return <SafeComponent />;
    }

    return (
      <ErrorBoundary
        error={(err) => (
          <div>
            <h1>Error occurred</h1>
            <pre>{String(err)}</pre>
            <button onClick={() => (state.hasError = true)}>
              Switch to safe mode
            </button>
          </div>
        )}
      >
        <RiskyComponent />
      </ErrorBoundary>
    );
  };
}
```

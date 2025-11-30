# Why RASK?

RASK is built on a simple idea: **what if React had embraced reactive state management from the very beginning?**
Hooks opened a powerful era of composition — but the core model of immutable updates, dependency arrays and frequent re-renders makes large-scale state management difficult.

RASK takes the reactive state model proven by libraries like MobX and Solid, and integrates it directly with a reconciler-driven rendering model — instead of integrating state into the reconciler itself. The result is familiar React composition with a different mental model: state updates trigger reactions, and reactions trigger rendering — automatically.

## A Different Path

React doubled down on immutable updates, effects, dependency arrays, and increasingly server-focused patterns.

RASK chooses a different path: state is mutable, reactive and intuitive, and rendering happens when it needs to happen — not because you manually wired dependencies together.

No dependency arrays.
No stale closures.
No useMemo / useCallback for protection.
Just state → reaction → render.

## Hooks Composition — Without the Pain

RASK keeps the hook composition workflow developers love, but in a reactive environment where the mental overhead is drastically reduced:

```tsx
function useCounter() {
  const state = useState({ count: 0 });

  return state;
}

function MyApp() {
  // Setup scope — runs once
  const counter = useCounter();

  // Render scope — runs reactively
  return () => (
    <h1 onClick={() => counter.count++}>Count is {counter.count}</h1>
  );
}
```

You still structure logic with hooks, still isolate concerns, and still build progressive abstractions.
The difference: no more thinking about dependency arrays, closure traps or invalidated values.

## Scale With Context

One of the biggest advantages of reactive state is how applications scale.

In traditional React, contexts that grow large can become performance hazards, because any change tends to re-render all consumers — which triggers memoization workarounds and architectural compromises.

**With RASK**:

- Context value size doesn’t matter
- Components only re-render when the specific state they read changes
- You can keep scaling your mental model instead of fighting your tools
- No need to reach for a secondary state management library — the same reactive primitives work just as well locally in a component as they do globally across the entire app

This enables project-wide state management without switching paradigms — no separate global state library required.

## Design Principles

RASK is built on a few clear principles:

- **Reactive state is the default**.
  State should update directly and intuitively — no immutability gymnastics.
- **Rendering is reconciler-driven**. The reconciler handles UI expression and component composition — reactive state decides when rendering happens.
- **Runtime only**. No build-time transforms. No magic compilation. Code runs as written.
- **Hooks define ownership**. State belongs to the component that created it, simplifying structure and cleanup.

## Where RASK Fits Best

RASK is designed for single-page applications with complex, evolving client-side state — dashboards, editors, productivity tools, admin panels, content systems, multiplayer UIs and anything where the front-end is the system.

If your application depends on rich client-side interaction and long-lived state, RASK provides a mental model that stays simple as your app grows.

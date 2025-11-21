# Why RASK?

Modern UI frameworks force you to choose between simple state management and powerful UI expression. **RASK gives you both.**

## The Problem with Current Frameworks

**React** excels at UI composition by allowing you to use "just the language", but creates mental strain with complex state management:

- Understanding closure captures and stale state
- Managing dependency arrays in hooks
- Dealing with re-render cascades
- Optimizing with `useMemo`, `useCallback`, and `memo`

**Solid** and other template based frameworks offers simple reactivity but compromises on UI expression:

- Compiler magic that transforms how your code executes
- Special components and/or syntax for dynamic UIs (`<Show>`, `<For>`)
- Different access patterns (`count()` vs `state.count`) and special rules

## The RASK Solution

```tsx
function MyApp() {
  const state = useState({ count: 0 });

  return () => <h1 onClick={() => state.count++}>Count is {state.count}</h1>;
}
```

RASK gives you:

- **Simple state management** - Observable state with direct mutations
- **Full reconciler power** - Express UIs naturally with the language
- **No compiler magic** - Plain JavaScript/TypeScript
- **Fine-grained reactivity** - Only what changes re-renders
- **Automatic batching** - Optimal performance without thinking

## Philosophy

RASK is built on the belief that:

1. **State management should be simple** - Observable primitives are intuitive
2. **UI expression should be powerful** - Use the full language, not special components
3. **No magic** - Code should run as written, no hidden transformations
4. **Performance matters** - But fast enough is good enough, we do not want to hurt DX

## What Does "RASK" Mean?

The name comes from Norwegian meaning "fast" - which captures the essence of this library: **fast to write, fast to understand, and fast to run.**

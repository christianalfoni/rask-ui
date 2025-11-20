# API Reference

## Reactive Hooks

These are component-bound reactive primitives, similar to React hooks but reactive:

- [**useState**](/api/useState) - Create reactive state bound to the component
- [**useEffect**](/api/useEffect) - Create a reactive effect bound to the component
- [**useComputed**](/api/useComputed) - Create computed properties bound to the component
- [**useAsync**](/api/useAsync) - Manage async operations bound to the component
- [**useView**](/api/useView) - Merge objects while maintaining reactivity
- [**useRouter**](/api/useRouter) - Access router state and navigation

## Context

- [**createContext**](/api/createContext) - Create a context for sharing values
- [**useContext**](/api/createContext#useContext) - Access context values in a component

## Other APIs

- [**Components**](/api/components) - Stateful and stateless components
- [**render**](/api/render) - Mount a component to the DOM
- [**useRef**](/api/useRef) - Create a reference to a DOM element
- [**useMountEffect**](/api/useMountEffect) - Run effect after mount
- [**useCleanup**](/api/useCleanup) - Register cleanup function
- [**ErrorBoundary**](/api/ErrorBoundary) - Catch and handle errors
- [**inspect**](/api/inspect) - Inspect reactive state changes

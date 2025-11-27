/**
 * Creates a context by wrapping a hook function that will be used as a context identifier.
 *
 * @warning **Do not destructure context values!** The returned value may be a reactive
 * object, and destructuring breaks reactivity.
 *
 * @example
 * // Create a context hook
 * const useTheme = createContext(() => {
 *   return useState({ color: "blue" });
 * });
 *
 * // Provider component
 * function App() {
 *   const theme = useInjectContext(useTheme);
 *   // theme is now available to all children
 *   return () => <Child />;
 * }
 *
 * // Consumer component
 * function Child() {
 *   const theme = useContext(useTheme);
 *   return () => <div style={{ color: theme.color }}>Text</div>;
 * }
 *
 * @param hook - A function that will be used as the context identifier
 * @returns The same hook function, to be used with useContext() and useInjectContext()
 */

import { getCurrentComponent } from "./component";

export function createContext<T, P extends any[]>(hook: (...params: P) => T) {
  return hook;
}

export function useContext<T, P extends any[]>(hook: (...params: P) => T): T {
  let currentComponent = getCurrentComponent();

  if (!currentComponent) {
    throw new Error("Only use useContext in component setup");
  }

  if (typeof (currentComponent.context as any).getContext !== "function") {
    throw new Error("There is no parent context");
  }

  const contextValue = (currentComponent.context as any).getContext(hook);

  if (!contextValue) {
    throw new Error("There is a parent context, but not the one you are using");
  }

  return contextValue;
}

export function useInjectContext<T, P extends any[]>(
  hook: (...params: P) => T,
  ...params: P
) {
  const currentComponent = getCurrentComponent();

  if (!currentComponent) {
    throw new Error("Only use useInjectContext in component setup");
  }

  const value = hook(...params);

  currentComponent.contexts.set(hook, value);

  return value;
}

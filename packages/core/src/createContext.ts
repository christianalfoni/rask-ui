/**
 * Creates a context that provides two methods: `use()` to consume context values and
 * `inject()` to provide context values to child components.
 *
 * @warning **Do not destructure context values!** The returned value may be a reactive
 * object, and destructuring breaks reactivity.
 *
 * @example
 * // Create a context
 * const ThemeContext = createContext(() => {
 *   return useState({ color: "blue" });
 * });
 *
 * // Provider component
 * function App() {
 *   const theme = ThemeContext.inject();
 *   // theme is now available to all children
 *   return () => <Child />;
 * }
 *
 * // Consumer component
 * function Child() {
 *   const theme = ThemeContext.use();
 *   return () => <div style={{ color: theme.color }}>Text</div>;
 * }
 *
 * @param hook - A function that will be used as the context identifier
 * @returns An object with `use()` and `inject()` methods
 */

import { getCurrentComponent } from "./component";

export function createContext<T, P extends any[]>(hook: (...params: P) => T) {
  return {
    /**
     * Consumes the context value from the nearest parent component that called `inject()`.
     * Must be called during component setup.
     *
     * @returns The context value provided by the nearest parent
     * @throws Error if called outside component setup, if no parent context exists, or if the specific context was not provided
     */
    use(): T {
      let currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("Only use useContext in component setup");
      }

      if (typeof (currentComponent.context as any).getContext !== "function") {
        throw new Error("There is no parent context");
      }

      const contextValue = (currentComponent.context as any).getContext(hook);

      if (!contextValue) {
        throw new Error(
          "There is a parent context, but not the one you are using"
        );
      }

      return contextValue;
    },
    /**
     * Injects a context value by calling the hook function and making it available to all child components.
     * Must be called during component setup.
     *
     * @param params - Parameters to pass to the hook function
     * @returns The context value created by the hook
     * @throws Error if called outside component setup
     */
    inject(...params: P): T {
      const currentComponent = getCurrentComponent();

      if (!currentComponent) {
        throw new Error("Only use useInjectContext in component setup");
      }

      const value = hook(...params);

      currentComponent.contexts.set(hook, value);

      return value;
    },
  };
}

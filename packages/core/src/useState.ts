import { observable } from "mobx";

export function assignState<T extends object>(state: T, newState: T) {
  return Object.assign(state, newState);
}

/**
 * Creates a reactive state object that tracks property access and notifies observers on changes.
 *
 * @warning **Do not destructure the returned reactive object!** Destructuring breaks reactivity
 * because it extracts plain values instead of maintaining proxy access. This is the same rule
 * as Solid.js signals.
 *
 * @example
 * // ❌ Bad - destructuring loses reactivity
 * function Component(props) {
 *   const state = useState({ count: 0, name: "foo" });
 *   const { count, name } = state; // Don't do this!
 *   return () => <div>{count} {name}</div>; // Won't update!
 * }
 *
 * // ✅ Good - access properties directly in render
 * function Component(props) {
 *   const state = useState({ count: 0, name: "foo" });
 *   return () => <div>{state.count} {state.name}</div>; // Reactive!
 * }
 *
 * @param state - The initial state object to make reactive
 * @returns A reactive proxy of the state object
 */
export function useState<T extends object>(state: T): T {
  return observable(state);
}

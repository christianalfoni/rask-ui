import { getCurrentComponent } from "./component";
import { INSPECT_MARKER, INSPECTOR_ENABLED, InspectorRef } from "./inspect";
import { getCurrentObserver, Signal } from "./observation";

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
  if (getCurrentComponent()?.isRendering) {
    throw new Error(
      "useState cannot be called during render. Call it in component setup or globally."
    );
  }
  return getProxy(state, {}) as any;
}

const proxyCache = new WeakMap<any, any>();
export const PROXY_MARKER = Symbol("isProxy");

function getProxy(value: object, notifyInspectorRef: InspectorRef) {
  // Check if already a proxy to avoid double-wrapping
  if (PROXY_MARKER in value) {
    return value;
  }

  if (proxyCache.has(value)) {
    return proxyCache.get(value);
  }

  const signals: Record<string, Signal> = {};

  const proxy = new Proxy(value, {
    has(target, key) {
      // Support the "in" operator check for PROXY_MARKER
      if (key === PROXY_MARKER) {
        return true;
      }
      if (INSPECTOR_ENABLED && key === INSPECT_MARKER) {
        return true;
      }
      return Reflect.has(target, key);
    },
    get(target, key) {
      // Mark this as a proxy to prevent double-wrapping
      if (key === PROXY_MARKER) {
        return true;
      }

      if (INSPECTOR_ENABLED && key === INSPECT_MARKER) {
        return !notifyInspectorRef.current;
      }

      const value = Reflect.get(target, key);

      if (typeof key === "symbol" || typeof value === "function") {
        return value;
      }

      const observer = getCurrentObserver();

      if (observer) {
        const signal = (signals[key] = signals[key] || new Signal());

        observer.subscribeSignal(signal);
      }

      if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        return getProxy(
          value,
          INSPECTOR_ENABLED && notifyInspectorRef.current
            ? {
                current: {
                  notify: notifyInspectorRef.current.notify,
                  path: notifyInspectorRef.current.path.concat(key),
                },
              }
            : notifyInspectorRef
        );
      }

      return value;
    },
    set(target, key, newValue) {
      if (INSPECTOR_ENABLED && key === INSPECT_MARKER) {
        Object.defineProperty(notifyInspectorRef, "current", {
          get() {
            return newValue.current;
          },
        });

        return Reflect.set(target, key, newValue);
      }

      if (typeof key === "symbol") {
        return Reflect.set(target, key, newValue);
      }

      const oldValue = Reflect.get(target, key);

      const setResult = Reflect.set(target, key, newValue);
      // We only notify if actual change, though array length actually updates under the hood
      if (newValue !== oldValue || (Array.isArray(value) && key === "length")) {
        const signal = signals[key];
        signal?.notify();
      }

      if (INSPECTOR_ENABLED) {
        notifyInspectorRef.current?.notify({
          type: "mutation",
          path: notifyInspectorRef.current.path,
          value: newValue,
        });
      }

      return setResult;
    },
    deleteProperty(target, key) {
      if (typeof key === "symbol") {
        return Reflect.deleteProperty(target, key);
      }

      const signal = signals[key];

      signal?.notify();

      delete signals[key];

      return Reflect.deleteProperty(target, key);
    },
  });

  proxyCache.set(value, proxy);

  return proxy;
}

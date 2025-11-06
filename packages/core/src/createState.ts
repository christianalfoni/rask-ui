import { getCurrentObserver, Signal } from "./observation";

export function createState<T extends object>(state: T): T {
  return getProxy(state) as any;
}

const proxyCache = new WeakMap<any, any>();

function getProxy(value: object) {
  if (proxyCache.has(value)) {
    return proxyCache.get(value);
  }

  const signals: Record<string, Signal> = {};

  const proxy = new Proxy(value, {
    get(target, key) {
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
        return getProxy(value);
      }

      return value;
    },
    set(target, key, newValue) {
      if (typeof key === "symbol") {
        return Reflect.set(target, key, newValue);
      }

      const oldValue = Reflect.get(target, key);

      // We only notify if actual change, though array length actually updates under the hood
      if (newValue !== oldValue || (Array.isArray(value) && key === "length")) {
        const signal = signals[key];
        signal?.notify();
      }

      return Reflect.set(target, key, newValue);
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

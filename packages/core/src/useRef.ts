import { RefObject } from "inferno";
import { getCurrentObserver, Signal } from "./observation";

export function useRef<T>(): RefObject<T> {
  let value: T | null = null;
  const signal = new Signal();
  return {
    get current() {
      const currentObserver = getCurrentObserver();
      currentObserver?.subscribeSignal(signal);
      return value;
    },
    set current(newValue) {
      signal.notify();
      value = newValue;
    },
  };
}

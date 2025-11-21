import { RefObject } from "inferno";
import { getCurrentObserver, Signal } from "./observation";
import { getCurrentComponent } from "./component";

export function useRef<T>(): RefObject<T> {
  let value: T | null = null;
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useRef in component setup");
  }

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

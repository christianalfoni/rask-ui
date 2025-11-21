import { syncBatch } from "./batch";
import { getCurrentComponent, useCleanup } from "./component";
import { INSPECT_MARKER, INSPECTOR_ENABLED, InspectorRef } from "./inspect";
import { getCurrentObserver, Observer, Signal } from "./observation";

export type Derived<T extends Record<string, () => any>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export function useDerived<T extends Record<string, () => any>>(
  computed: T
): Derived<T> {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useDerived in component setup");
  }

  const proxy = {};
  let notifyInspectorRef: InspectorRef = {};

  for (const prop in computed) {
    let isDirty = true;
    let value: any;
    const signal = new Signal();
    const computedObserver = new Observer(() => {
      isDirty = true;
      signal.notify();

      if (INSPECTOR_ENABLED) {
        notifyInspectorRef.current?.notify({
          type: "computed",
          path: notifyInspectorRef.current!.path.concat(prop),
          isDirty: true,
          value,
        });
      }
    });

    useCleanup(() => computedObserver.dispose());

    Object.defineProperty(proxy, prop, {
      enumerable: true,
      configurable: true,
      get() {
        const currentObserver = getCurrentObserver();

        if (currentObserver) {
          currentObserver.subscribeSignal(signal);
        }

        if (isDirty) {
          const stopObserving = computedObserver.observe();

          value = computed[prop]();
          stopObserving();
          isDirty = false;

          if (INSPECTOR_ENABLED) {
            notifyInspectorRef.current?.notify({
              type: "computed",
              path: notifyInspectorRef.current!.path.concat(prop),
              isDirty: false,
              value,
            });
          }
          return value;
        }

        return value;
      },
    });
  }

  if (INSPECTOR_ENABLED) {
    Object.defineProperty(proxy, INSPECT_MARKER, {
      enumerable: false,
      configurable: false,
      get() {
        return !notifyInspectorRef.current;
      },
      set: (value) => {
        Object.defineProperty(notifyInspectorRef, "current", {
          get() {
            return value.current;
          },
        });
      },
    });
  }

  return proxy as any;
}

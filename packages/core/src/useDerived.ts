import { getCurrentComponent } from "./component";
import { computed } from "mobx";

export type Derived<T extends Record<string, () => any>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export function useDerived<T extends Record<string, () => any>>(
  computedDefs: T
): Derived<T> {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useDerived in component setup");
  }

  const derived = {};

  for (const key in computedDefs) {
    const computedValue = computed(computedDefs[key]);
    Object.defineProperty(derived, key, {
      get() {
        return computedValue.get();
      },
      enumerable: true,
    });
  }

  return derived as any;
}

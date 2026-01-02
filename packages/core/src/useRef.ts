import { RefObject } from "inferno";
import { getCurrentComponent } from "./component";
import { observable } from "mobx";

export type Ref<T> = RefObject<T>;

export function assignRef<T>(ref: RefObject<T>, refValue: T) {
  (ref as any).current = refValue;
}

export function useRef<T>(): RefObject<T> {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useRef in component setup");
  }

  const observableValue = observable.box(null);

  return {
    get current() {
      return observableValue.get();
    },
    set current(newValue) {
      observableValue.set(newValue);
    },
  };
}

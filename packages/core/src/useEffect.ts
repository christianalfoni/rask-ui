import { useCleanup, getCurrentComponent } from "./component";
import { autorun } from "./scheduler";

export function useEffect(cb: () => void | (() => void)) {
  const component = getCurrentComponent();
  if (!component || component.isRendering) {
    throw new Error("Only use useEffect in component setup");
  }

  let disposer: (() => void) | void;

  const autorunDisposer = autorun(() => {
    disposer?.();
    disposer = cb();
  });

  useCleanup(autorunDisposer);
}

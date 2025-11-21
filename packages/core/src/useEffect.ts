import { syncBatch } from "./batch";
import { useCleanup, getCurrentComponent } from "./component";
import { Observer } from "./observation";

export function useEffect(cb: () => void | (() => void)) {
  const component = getCurrentComponent();
  if (!component || component.isRendering) {
    throw new Error("Only use useEffect in component setup");
  }

  let disposer: (() => void) | void;
  const observer = new Observer(() => {
    syncBatch(runEffect);
  });
  const runEffect = () => {
    try {
      disposer?.();
    } catch (error) {
      console.error("Error in effect dispose function:", error);
    }
    const stopObserving = observer.observe();
    disposer = cb();
    stopObserving();
  };

  useCleanup(() => {
    observer.dispose();
    disposer?.();
  });

  runEffect();
}

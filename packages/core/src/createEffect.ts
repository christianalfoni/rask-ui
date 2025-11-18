import { syncBatch } from "./batch";
import { getCurrentComponent, createCleanup } from "./component";
import { Observer } from "./observation";

export function createEffect(cb: () => void | (() => void)) {
  let currentComponent;
  try {
    currentComponent = getCurrentComponent();
  } catch {
    currentComponent = undefined;
  }
  let disposer: (() => void) | void;
  const observer = new Observer(() => {
    console.log("FIRED");
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

  if (currentComponent) {
    createCleanup(() => {
      observer.dispose();
      disposer?.();
    });
  }

  runEffect();
}

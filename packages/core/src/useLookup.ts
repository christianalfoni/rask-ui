import { useCleanup } from "./component";
import { Observer } from "./observation";
import { useState } from "./useState";

export function useLookup<T extends object, U extends keyof T>(
  getArray: () => T[],
  key: U
) {
  const state = useState({
    lookup: {},
  });

  function updateMap() {
    const disposeObserve = observer.observe();
    state.lookup = getArray().reduce((aggr, item) => {
      (aggr as any)[item[key]] = item;

      return aggr;
    }, {});
    disposeObserve();
  }

  const observer = new Observer(updateMap, false);

  updateMap();

  useCleanup(() => observer.dispose());

  return (key: T[U]): T | undefined => {
    return (state.lookup as any)[key];
  };
}

import { useCleanup } from "./component";
import { autorun } from "./scheduler";
import { useState } from "./useState";

export function useLookup<T extends object, U extends keyof T>(
  getArray: () => T[],
  key: U
) {
  const state = useState(new Map());

  function updateMap() {
    state.clear();
    getArray().forEach((item) => {
      state.set(item[key], item);
    });
  }

  const dispose = autorun(updateMap);

  useCleanup(dispose);

  return (key: T[U]): T | undefined => {
    return (state as any).get(key);
  };
}

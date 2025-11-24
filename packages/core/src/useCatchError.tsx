import { useState } from "./useState";
import { createContext, useInjectContext } from "./createContext";
import { getCurrentComponent } from "./component";

export const CatchErrorContext = createContext<(error: unknown) => void>();

export function useCatchError() {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use the useCatchError hook in setup");
  }

  const inject = useInjectContext(CatchErrorContext);
  const state = useState<{ error: unknown }>({
    error: null,
  });

  inject((error) => (state.error = error));

  return state;
}

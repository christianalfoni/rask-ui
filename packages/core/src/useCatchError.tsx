import { useState } from "./useState";
import { createContext, useInjectContext } from "./createContext";
import { getCurrentComponent } from "./component";

export const CatchErrorContext = createContext((state: { error: unknown }) => {
  return (error: unknown) => (state.error = error);
});

export function useCatchError() {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use the useCatchError hook in setup");
  }
  const state = useState<{ error: unknown }>({
    error: null,
  });

  useInjectContext(CatchErrorContext, state);

  return state;
}

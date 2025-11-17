export { render } from "./render";
export {
  createCleanup,
  createMountEffect,
  RaskStatefulComponent,
  RaskStatelessComponent,
} from "./component";
export { createContext } from "./createContext";

export { createState, assignState } from "./createState";
export { createTask } from "./createTask";
export { ErrorBoundary } from "./error";
export { createRef } from "inferno";
export { createView } from "./createView";
export { createEffect } from "./createEffect";
export { createComputed } from "./createComputed";
export { syncBatch } from "./batch";
export { inspect } from "./inspect";

// Re-export Inferno JSX runtime functions so users don't need to install Inferno directly
export {
  createVNode,
  createComponentVNode,
  createFragment,
  createTextVNode,
  normalizeProps,
  Component,
} from "inferno";

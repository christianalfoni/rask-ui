import { useCleanup, getCurrentComponent } from "./component";
import { assignState, useState } from "./useState";

export type AsyncState<P, T, I = null> =
  | {
      isPending: false;
      params: null;
      value: I;
      error: null;
    }
  | {
      isPending: true;
      value: T | I;
      params: P;
      error: null;
    }
  | {
      isPending: false;
      params: null;
      value: T;
      error: null;
    }
  | {
      isPending: false;
      params: null;
      value: T | I;
      error: string;
    };

export type Async<A, B = never, I = null> = [B] extends [never]
  ? [AsyncState<null, A, I>, () => void]
  : [AsyncState<A, B, I>, (params: A) => void];

export function useAsync<T>(
  initialValue: T,
  fn: (params: undefined, signal: AbortSignal) => Promise<T>
): Async<T, never, T>;
export function useAsync<P, T>(
  initialValue: T,
  fn: (params: P, signal: AbortSignal) => Promise<T>
): Async<P, T, T>;
export function useAsync<T>(
  fn: (params: undefined, signal: AbortSignal) => Promise<T>
): Async<T>;
export function useAsync<P, T>(
  fn: (params: P, signal: AbortSignal) => Promise<T>
): Async<P, T>;
export function useAsync<P, T, I = null>(
  ...args:
    | [fn: (params: P | undefined, signal: AbortSignal) => Promise<T>]
    | [
        initial: T,
        fn: (params: P | undefined, signal: AbortSignal) => Promise<T>
      ]
) {
  const currentComponent = getCurrentComponent();
  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useTask in component setup");
  }

  const value: any = args.length === 2 ? args[0] : null;
  const fn = args.length === 2 ? args[1] : args[0];

  const state = useState<AsyncState<P, T, I>>({
    isPending: false,
    value,
    error: null,
    params: null,
  });

  let currentAbortController: AbortController | undefined;

  const fetch = (params?: P) => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());
    const promise = fn(params, abortController.signal);

    promise
      .then((result) => {
        if (abortController.signal.aborted) {
          return;
        }

        assignState(state, {
          isPending: false,
          value: result,
          error: null,
          params: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }
        assignState(state, {
          isPending: false,
          value: state.value,
          error: String(error),
          params: null,
        });
      });

    return promise;
  };

  useCleanup(() => currentAbortController?.abort());

  return [
    {
      get isPending() {
        return state.isPending;
      },
      get value() {
        return state.value;
      },
      get error() {
        return state.error;
      },
      get params() {
        return state.params;
      },
    },
    (params?: P) => {
      fetch(params);
      assignState(state, {
        isPending: true,
        value: state.value,
        error: null,
        params: (params || null) as any,
      });
    },
  ];
}

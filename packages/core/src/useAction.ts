import { assignState, useState } from "./useState";

export type ActionState<T, P> =
  | {
      isPending: false;
      params: null;
      result: null;
      error: null;
    }
  | {
      isPending: true;
      params: P;
      result: null;
      error: null;
    }
  | {
      isPending: false;
      params: P;
      result: T;
      error: null;
    }
  | {
      isPending: false;
      params: P;
      result: null;
      error: Error;
    };

export type Action<T, P = null> = [
  ActionState<T, P>,
  [P] extends [null] ? () => void : (params: P) => void
];

export function useAction<T, P = null>(
  fn: [P] extends [null] ? () => Promise<T> : (params: P) => Promise<T>
): Action<T, P> {
  const state = useState<ActionState<T, P>>({
    isPending: false,
    error: null,
    params: null,
    result: null,
  });

  let abortController: AbortController | undefined;

  const run = (params?: P) => {
    params = (params || null) as P;

    abortController?.abort();

    const currentAbortController = (abortController = new AbortController());

    assignState(state, {
      isPending: true,
      error: null,
      params,
      result: null,
    });

    fn(params)
      .then((result) => {
        if (currentAbortController.signal.aborted) {
          return;
        }
        assignState(state, {
          isPending: false,
          error: null,
          params,
          result,
        });
      })
      .catch((error) => {
        if (currentAbortController.signal.aborted) {
          return;
        }
        assignState(state, {
          isPending: false,
          error,
          params,
          result: null,
        });
      });
  };

  return [state, run];
}

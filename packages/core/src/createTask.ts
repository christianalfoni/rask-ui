import { assignState, createState } from "./createState";

export type Task<P, T> =
  | {
      isRunning: false;
      params: null;
      result: null;
      error: null;
    }
  | {
      isRunning: true;
      result: T | null;
      params: P;
      error: null;
    }
  | {
      isRunning: false;
      params: null;
      result: T;
      error: null;
    }
  | {
      isRunning: false;
      params: null;
      result: null;
      error: string;
    };

export function createTask<T>(task: () => Promise<T>): Task<T, never> & {
  run(): Promise<T>;
  rerun(): Promise<T>;
};
export function createTask<P, T>(
  task: (params: P) => Promise<T>
): Task<T, P> & {
  run(params: P): Promise<T>;
  rerun(params: P): Promise<T>;
};
export function createTask<P, T>(task: (params?: P) => Promise<T>) {
  const state = createState<Task<P, T>>({
    isRunning: false,
    result: null,
    error: null,
    params: null,
  });

  let currentAbortController: AbortController | undefined;

  const fetch = (params?: P) => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());
    const promise = task(params);

    promise
      .then((result) => {
        if (abortController.signal.aborted) {
          return;
        }

        assignState(state, {
          isRunning: false,
          result,
          error: null,
          params: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }
        assignState(state, {
          isRunning: false,
          result: null,
          error: String(error),
          params: null,
        });
      });

    return promise;
  };

  return {
    get isRunning() {
      return state.isRunning;
    },
    get result() {
      return state.result;
    },
    get error() {
      return state.error;
    },
    get params() {
      return state.params;
    },
    run(params?: P) {
      const promise = fetch(params);
      assignState(state, {
        isRunning: true,
        result: null,
        error: null,
        params: (params || null) as any,
      });
      return promise;
    },
    rerun(params?: P) {
      const promise = fetch(params);
      assignState(state, {
        isRunning: true,
        result: state.result,
        error: null,
        params: (params || null) as any,
      });
      return promise;
    },
  };
}

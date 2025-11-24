import { syncBatch } from "./batch";
import { useCleanup, getCurrentComponent } from "./component";
import { Observer } from "./observation";
import { assignState, useState } from "./useState";

export type AsyncState<T> =
  | {
      error: Error;
      isLoading: true;
      isRefreshing: false;
      value: null;
    }
  | {
      error: Error;
      isLoading: false;
      isRefreshing: true;
      value: T;
    }
  | {
      error: null;
      isLoading: true;
      isRefreshing: false;
      value: null;
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: true;
      value: T;
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: false;
      value: T;
    };

export type Async<T extends NonNullable<any>> = [
  AsyncState<T>,
  () => Promise<void>
];

export function isAsync(value: unknown) {
  if (value === null || typeof value !== "object") {
    return false;
  }

  return Boolean(
    "isLoading" in value &&
      "isRefreshing" in value &&
      "error" in value &&
      "value" in value
  );
}

export function useAsync<T extends NonNullable<any>>(
  fn: (signal?: AbortSignal) => Promise<T>
) {
  const currentComponent = getCurrentComponent();

  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useAsync in component setup");
  }

  const state = useState<AsyncState<T>>({
    isLoading: true,
    isRefreshing: false,
    value: null,
    error: null,
  });

  const refreshResolvers: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  let currentAbortController: AbortController | undefined;

  const refresh = () => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());
    const stopObserving = observer.observe();
    const promise = fn(abortController.signal);
    stopObserving();

    promise
      .then((result) => {
        if (abortController.signal.aborted) {
          return;
        }

        syncBatch(() => {
          assignState(state, {
            isLoading: false,
            isRefreshing: false,
            value: result,
            error: null,
          } as any);
        });

        refreshResolvers.forEach((resolver) => resolver.resolve());
        refreshResolvers.length = 0;
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        syncBatch(() => {
          assignState(state, {
            isLoading: state.isLoading,
            isRefreshing: state.isRefreshing,
            value: state.value as any,
            error,
          } as any);
        });

        refreshResolvers.forEach((resolver) => resolver.reject(error));
        refreshResolvers.length = 0;
      });

    return promise;
  };

  const observer = new Observer(() => {
    syncBatch(() => {
      if (state.isLoading) {
        refresh();
      } else if (state.error && state.value === null) {
        assignState(state, {
          isLoading: true,
          isRefreshing: false,
          value: state.value as any,
          error: null,
        } as any);
        refresh();
      } else {
        assignState(state, {
          isLoading: false,
          isRefreshing: true,
          value: state.value as any,
          error: null,
        });
        refresh();
      }
    });
  });

  useCleanup(() => {
    currentAbortController?.abort();
    observer.dispose();
  });

  refresh();

  return [
    state,
    async () => {
      if (state.isLoading && !state.error) {
        return;
      }

      syncBatch(() => {
        if (state.error && state.value === null) {
          assignState(state, {
            isLoading: true,
            isRefreshing: false,
            value: state.value as any,
            error: null,
          } as any);
        } else {
          assignState(state, {
            isLoading: false,
            isRefreshing: true,
            value: state.value as any,
            error: null,
          });
        }
      });

      let resolve!: () => void;
      let reject!: (error: Error) => void;
      const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      refreshResolvers.push({ resolve, reject });

      refresh();

      return promise;
    },
  ] as Async<T>;
}

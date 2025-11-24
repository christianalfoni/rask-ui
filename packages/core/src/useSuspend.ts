import { AsyncState, isAsync } from "./useAsync";
import { useEffect } from "./useEffect";
import { assignState, useState } from "./useState";

type SuspendState<T extends Record<string, () => any>> =
  | {
      error: Error;
      isLoading: true;
      isRefreshing: false;
      values: {
        [K in keyof T]: ReturnType<T[K]> extends AsyncState<any>
          ? ReturnType<T[K]>["value"]
          : ReturnType<T[K]>;
      };
    }
  | {
      error: Error;
      isLoading: false;
      isRefreshing: true;
      values: {
        [K in keyof T]: ReturnType<T[K]> extends AsyncState<any>
          ? NonNullable<ReturnType<T[K]>["value"]>
          : ReturnType<T[K]>;
      };
    }
  | {
      error: null;
      isLoading: true;
      isRefreshing: false;
      values: {
        [K in keyof T]: ReturnType<T[K]> extends AsyncState<any>
          ? ReturnType<T[K]>["value"]
          : ReturnType<T[K]>;
      };
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: true;
      values: {
        [K in keyof T]: ReturnType<T[K]> extends AsyncState<any>
          ? NonNullable<ReturnType<T[K]>["value"]>
          : ReturnType<T[K]>;
      };
    }
  | {
      error: null;
      isLoading: false;
      isRefreshing: false;
      values: {
        [K in keyof T]: ReturnType<T[K]> extends AsyncState<any>
          ? NonNullable<ReturnType<T[K]>["value"]>
          : ReturnType<T[K]>;
      };
    };

export function useSuspend<T extends Record<string, any>>(asyncs: T) {
  const state = useState<SuspendState<T>>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    values: Object.keys(asyncs).reduce((aggr, key) => {
      let value = asyncs[key]();

      if (isAsync(value)) {
        value = value.value;
      }

      aggr[key] = value;

      return aggr;
    }, {} as any),
  });

  useEffect(() => {
    let isLoading = false;
    let isRefreshing = false;
    let error: Error | undefined;
    const values: any = {};
    for (const key in asyncs) {
      let value = asyncs[key]();

      if (!isAsync(value)) {
        values[key] = value;
        continue;
      }

      values[key] = value.value;

      if (value.isLoading) {
        isLoading = true;
      } else if (value.isRefreshing) {
        isRefreshing = true;
      }

      if (value.error) {
        error = value.error;
      }
    }

    state.isLoading = isLoading;
    state.isRefreshing = isLoading ? false : isRefreshing;
    state.error = error || null;

    if (!state.isLoading && !state.isRefreshing && !error) {
      assignState(state.values, values);
    }
  });

  return state;
}

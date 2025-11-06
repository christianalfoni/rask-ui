import { createState } from "./createState";

type QueryState<T> =
  | {
      isPending: true;
      data: T | null;
      error: null;
    }
  | {
      isPending: false;
      data: T;
      error: null;
    }
  | {
      isPending: false;
      data: null;
      error: string;
    };

export type Query<T> = QueryState<T> & {
  fetch(force?: boolean): void;
};

export function createQuery<T>(fetcher: () => Promise<T>): Query<T> {
  const state = createState<QueryState<T>>({
    isPending: true,
    data: null,
    error: null,
  });
  const assign = (newState: QueryState<T>) => {
    Object.assign(state, newState);
  };

  let currentAbortController: AbortController | undefined;

  const fetch = () => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());

    fetcher()
      .then((data) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data,
          error: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data: null,
          error: String(error),
        });
      });
  };

  fetch();

  return {
    get isPending() {
      return state.isPending;
    },
    get data() {
      return state.data;
    },
    get error() {
      return state.error;
    },
    fetch(force) {
      assign({
        isPending: true,
        data: force ? null : state.data,
        error: null,
      });
      fetch();
    },
  } as Query<T>;
}

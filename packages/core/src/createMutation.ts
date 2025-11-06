import { createState } from "./createState";

type MutationState<T> =
  | {
      isPending: true;
      params: T;
      error: null;
    }
  | {
      isPending: false;
      params: null;
      error: null;
    }
  | {
      isPending: false;
      params: null;
      error: string;
    };

export type Mutation<T> = MutationState<T> & {
  mutate(): void;
  mutate(params: T): void;
};

export function createMutation<T>(
  mutator: (params: T) => Promise<T>
): Mutation<T> {
  const state = createState<MutationState<T>>({
    isPending: false,
    params: null,
    error: null,
  });
  const assign = (newState: MutationState<T>) => {
    Object.assign(state, newState);
  };

  let currentAbortController: AbortController | undefined;

  return {
    get isPending() {
      return state.isPending;
    },
    get params() {
      return state.params;
    },
    get error() {
      return state.error;
    },
    mutate(params: T) {
      currentAbortController?.abort();

      const abortController = (currentAbortController = new AbortController());

      assign({
        isPending: true,
        params,
        error: null,
      });

      mutator(params)
        .then(() => {
          if (abortController.signal.aborted) {
            return;
          }

          assign({
            isPending: false,
            params: null,
            error: null,
          });
        })
        .catch((error) => {
          if (abortController.signal.aborted) {
            return;
          }

          assign({
            isPending: false,
            params: null,
            error: String(error),
          });
        });
    },
  } as Mutation<T>;
}

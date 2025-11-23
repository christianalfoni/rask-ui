import { useState } from "./useState";

export type PendingAction<P> = {
  params: P;
  error: string | null;
  retry(): void;
  cancel(): void;
};

export type ActionState<P> = {
  isPending: boolean;
  actions: PendingAction<P>[];
};

export type Action<P = null> = [
  ActionState<P>,
  [P] extends [null] ? () => void : (params: P) => void
];

export function useAction<P = null>(
  fn: [P] extends [null] ? () => Promise<void> : (params: P) => Promise<void>
): Action<P> {
  const state = useState<ActionState<P>>({
    isPending: false,
    actions: [],
  });

  const processQueue = () => {
    const next = state.actions.find((action) => !action.error);

    if (!next) {
      state.isPending = false;
      return;
    }

    state.isPending = true;

    fn(next.params)
      .then(() => {
        state.actions.shift();
        processQueue();
      })
      .catch((error) => {
        next.error = String(error);
        processQueue();
      });
  };

  const run = (params?: P) => {
    params = (params || null) as P;

    let actionProxy!: PendingAction<P>;
    const index =
      state.actions.push({
        params,
        error: null,
        retry() {
          state.actions.splice(state.actions.indexOf(actionProxy), 1);
          run(params);
        },
        cancel() {
          state.actions.splice(state.actions.indexOf(actionProxy), 1);
          processQueue();
        },
      }) - 1;
    actionProxy = state.actions[index];

    processQueue();
  };

  return [state, run];
}

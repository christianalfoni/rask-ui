import { useState } from "./useState";

export type QueuedAction<P> = {
  params: P;
  error: Error | null;
  retry(): void;
  cancel(): void;
};

export type ActionState<P> = {
  isPending: boolean;
  queue: QueuedAction<P>[];
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
    queue: [],
  });

  const processQueue = () => {
    const next = state.queue[0];

    if (!next) {
      state.isPending = false;
      return;
    }

    state.isPending = true;

    fn(next.params)
      .then(() => {
        state.queue.shift();
        processQueue();
      })
      .catch((error) => {
        next.error = error;
      });
  };

  const run = (params?: P) => {
    params = (params || null) as P;

    let actionProxy!: QueuedAction<P>;
    const index =
      state.queue.push({
        params,
        error: null,
        retry() {
          processQueue();
        },
        cancel() {
          state.queue.splice(state.queue.indexOf(actionProxy), 1);
          processQueue();
        },
      }) - 1;
    actionProxy = state.queue[index];

    if (index === 0) {
      processQueue();
    }
  };

  return [state, run];
}

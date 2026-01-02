import {
  configure,
  transaction as mobxTransaction,
  autorun as mobxAutorun,
} from "mobx";

let isSync = false;

export function transaction(cb: () => void) {
  isSync = true;
  mobxTransaction(() => {
    cb();
  });
}

export function autorun(cb: () => void) {
  isSync = true;
  const disposer = mobxAutorun(() => {
    cb();
  });

  return disposer;
}

let hasQueuedFlush = false;

configure({
  enforceActions: "never",
  reactionScheduler: (f) => {
    if (isSync) {
      f(); // Flush immediately at the end the transaction
      hasQueuedFlush = false;
      isSync = false;
    } else if (!hasQueuedFlush) {
      hasQueuedFlush = true;
      queueMicrotask(() => {
        isSync = true;
        f();
        hasQueuedFlush = false;
      }); // Defer "loose" user changes
    }
  },
});

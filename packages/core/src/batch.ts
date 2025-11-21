export type QueuedCallback = (() => void) & { __queued: boolean };

const asyncQueue: Array<QueuedCallback> = [];
const syncQueueStack: Array<Array<QueuedCallback>> = [];

let inInteractive = 0;
let asyncScheduled = false;

function scheduleAsyncFlush() {
  if (asyncScheduled) return;
  asyncScheduled = true;
  queueMicrotask(flushAsyncQueue);
}

function flushAsyncQueue() {
  asyncScheduled = false;

  if (!asyncQueue.length) return;

  // Note: we intentionally DO NOT snapshot.
  // If callbacks queue more async work, it gets picked up
  // in this same loop because length grows.
  for (let i = 0; i < asyncQueue.length; i++) {
    const cb = asyncQueue[i];
    asyncQueue[i] = undefined as any;
    cb();
    cb.__queued = false;
  }
  asyncQueue.length = 0;
}

export function queue(cb: QueuedCallback) {
  if (cb.__queued) return;

  cb.__queued = true;

  // If we're in a sync batch, push to the current sync queue
  if (syncQueueStack.length) {
    syncQueueStack[syncQueueStack.length - 1].push(cb);
    return;
  }

  // Otherwise, push to async queue
  asyncQueue.push(cb);
  if (!inInteractive) {
    scheduleAsyncFlush();
  }
}

export function syncBatch(cb: () => void) {
  // Create a new queue for this sync batch
  const queue: Array<QueuedCallback> = [];
  syncQueueStack.push(queue);

  try {
    cb();
  } catch (e) {
    // Pop the queue even on error, but don't flush
    syncQueueStack.pop();
    throw e;
  }

  // CASCADING SYNCHRONOUS UPDATES
  // ------------------------------
  // Keep flushing the queue in a loop while it has work. This is critical for handling
  // cascading reactive updates where one observer's notification triggers another.
  //
  // Example cascade: state → derived → component
  //   1. User updates state in a syncBatch
  //   2. Derived observer is notified and queued
  //   3. Derived observer runs, marks derived as dirty
  //   4. Derived's signal notifies component observers
  //   5. Component observers are added to the SAME queue (because it's still on the stack)
  //   6. Loop continues, flushing component observers
  //
  // By keeping the queue on the stack during the flush loop, all synchronous cascades
  // are captured in the same batch. This ensures:
  //   - No updates escape to the async queue
  //   - Components render with fully updated derived values
  //   - Deduplication works across the entire cascade (same observer can't be queued twice)
  //
  // The loop terminates when all cascades have settled (queue is empty).
  while (queue.length > 0) {
    for (let i = 0; i < queue.length; i++) {
      const cb = queue[i];
      queue[i] = undefined as any;
      cb();
      cb.__queued = false;
    }
    queue.length = 0;
  }

  // Pop the queue after everything is flushed
  syncQueueStack.pop();
}

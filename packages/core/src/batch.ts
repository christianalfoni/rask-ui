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

function flushSyncQueue(queue: Array<QueuedCallback>) {
  if (!queue.length) return;

  // No snapshot, just iterate.
  // New callbacks queued via nested syncBatch will create
  // their own queue on the stack and flush independently.
  for (let i = 0; i < queue.length; i++) {
    const cb = queue[i];
    queue[i] = undefined as any;
    cb();
    cb.__queued = false;
  }
  queue.length = 0;
}

export function queue(cb: QueuedCallback) {
  // Optional: uncomment this if you want deduping:
  // if (cb.__queued) return;

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

  // Pop the queue and flush it
  syncQueueStack.pop();
  flushSyncQueue(queue);
}

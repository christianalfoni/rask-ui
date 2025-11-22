/**
 * ---------------------------------------------------------------------------
 *  OBSERVER–SIGNAL SYSTEM (OPTIMIZED / LOW MEMORY / ZERO PENDING ARRAYS)
 * ---------------------------------------------------------------------------
 *
 *  STRATEGY OVERVIEW
 *  -----------------
 *  Instead of storing subscriber callbacks and disposer closures,
 *  we model the connection between an Observer and a Signal using a
 *  lightweight Subscription node.
 *
 *  Each Subscription is owned *by both sides*:
 *    - Signal keeps a doubly-linked list of all Subscriptions.
 *    - Observer keeps a doubly-linked list of all Subscriptions it has made.
 *
 *  This gives several important advantages:
 *
 *  ✔ NO per-subscription closures (disposers)
 *  ✔ NO Set allocations in Signal or Observer
 *  ✔ NO Array copies during notify()
 *  ✔ Unsubscribing while iterating is safe (linked-list + cached "next")
 *  ✔ New subscriptions inside notify() DO NOT fire in the same notify pass
 *    (using an epoch barrier)
 *  ✔ Observer.clearSignals() is O(n) with real O(1) unlink
 *  ✔ Memory overhead is extremely small (one node with 4 pointers)
 *
 *  NOTIFY BARRIER
 *  --------------
 *  A global integer `epoch` increments for each notify().
 *  New subscriptions created during notify() store `createdAtEpoch = epoch+1`.
 *  During traversal, we only fire subscriptions where:
 *
 *        sub.createdAtEpoch <= epoch
 *
 *  This guarantees consistency and prevents "late" subscribers from firing too early.
 *
 * ---------------------------------------------------------------------------
 */

import { queue, QueuedCallback } from "./batch";

// GLOBAL OBSERVER STACK (for dependency tracking)
const observerStack: Observer[] = [];
let stackTop = -1;

// Get the active observer during a render/compute
export function getCurrentObserver() {
  return stackTop >= 0 ? observerStack[stackTop] : undefined;
}

/**
 * A lightweight link connecting ONE observer ↔ ONE signal.
 * Stored in a linked list on both sides.
 */
class Subscription {
  signal: Signal;
  observer: Observer;

  // Linked list pointers within the signal
  prevInSignal: Subscription | null = null;
  nextInSignal: Subscription | null = null;

  // Linked list pointers within the observer
  prevInObserver: Subscription | null = null;
  nextInObserver: Subscription | null = null;

  // Whether this subscription is active
  active = true;

  // Used for the notify barrier
  createdAtEpoch: number;

  constructor(signal: Signal, observer: Observer, epoch: number) {
    this.signal = signal;
    this.observer = observer;
    this.createdAtEpoch = epoch;
  }
}

/**
 * SIGNAL — Notifies subscribed observers.
 */
export class Signal {
  private head: Subscription | null = null;
  private tail: Subscription | null = null;

  // Incremented for every notify() call
  private epoch = 0;

  /** INTERNAL: Create a subscription from observer → signal. */
  _subscribe(observer: Observer): Subscription {
    const sub = new Subscription(this, observer, this.epoch + 1);

    // Attach to signal's linked list
    if (this.tail) {
      this.tail.nextInSignal = sub;
      sub.prevInSignal = this.tail;
      this.tail = sub;
    } else {
      this.head = this.tail = sub;
    }

    return sub;
  }

  /** INTERNAL: Unlink a subscription from this signal. */
  _unsubscribe(sub: Subscription) {
    if (!sub.active) return;
    sub.active = false;

    const { prevInSignal, nextInSignal } = sub;

    if (prevInSignal) prevInSignal.nextInSignal = nextInSignal;
    else this.head = nextInSignal;

    if (nextInSignal) nextInSignal.prevInSignal = prevInSignal;
    else this.tail = prevInSignal;

    sub.prevInSignal = sub.nextInSignal = null;
  }

  /** Notify all observers.
   *  Safe even if observers unsubscribe themselves or subscribe new ones mid-run.
   */
  notify() {
    if (!this.head) return;

    const barrier = ++this.epoch; // new subs won't fire now
    let sub: Subscription | null = this.head;

    while (sub) {
      const next: Subscription | null = sub.nextInSignal; // cache next → safe if sub unlinks itself

      if (sub.active && sub.createdAtEpoch <= barrier) {
        sub.observer._notify();
      }

      sub = next;
    }
  }
}

/**
 * OBSERVER — Reacts to signal changes.
 * Typically wraps a computation or component.
 */
export class Observer {
  isDisposed = false;

  // Doubly-linked list of all subscriptions from this observer
  private subsHead: Subscription | null = null;
  private subsTail: Subscription | null = null;

  // Only ONE notify callback closure per observer
  private readonly onNotify: () => void;

  constructor(onNotify: () => void, shouldQueue = true) {
    const onNotifyQueued = onNotify as unknown as QueuedCallback;
    onNotifyQueued.__queued = false;

    if (shouldQueue) {
      this.onNotify = () => {
        if (onNotifyQueued.__queued) return;
        queue(onNotify as QueuedCallback);
      };
    } else {
      this.onNotify = onNotify;
    }
  }

  /** Called from Signal.notify() */
  _notify() {
    if (!this.isDisposed) {
      this.onNotify();
    }
  }

  /** Subscribe this observer to a signal */
  subscribeSignal(signal: Signal) {
    if (this.isDisposed) return;

    const sub = signal._subscribe(this);

    // Add to observer's linked list
    if (this.subsTail) {
      this.subsTail.nextInObserver = sub;
      sub.prevInObserver = this.subsTail;
      this.subsTail = sub;
    } else {
      this.subsHead = this.subsTail = sub;
    }
  }

  /** Remove all signal subscriptions (fast + safe) */
  private clearSignals() {
    let sub = this.subsHead;
    this.subsHead = this.subsTail = null;

    while (sub) {
      const next = sub.nextInObserver;

      // Unlink from the signal
      sub.signal._unsubscribe(sub);

      // Clean up observer-side pointers
      sub.prevInObserver = sub.nextInObserver = null;

      sub = next;
    }
  }

  /** Begin dependency collection */
  observe() {
    this.clearSignals();
    observerStack[++stackTop] = this;

    // Return a disposer for this observation frame
    return () => {
      stackTop--;
    };
  }

  /** Dispose the observer completely */
  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clearSignals();
  }
}

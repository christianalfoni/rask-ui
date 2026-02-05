import { render as infernoRender } from "inferno";
import { transaction } from "./scheduler";

/**
 * Renders a component with automatic event batching.
 * Temporarily patches document.addEventListener to wrap
 * Inferno's delegated event listeners with syncBatch.
 */
export function render(...params: Parameters<typeof infernoRender>) {
  if (!params[1]) {
    throw new Error("You need a target container");
  }

  /**
   * Temporarily patches document.addEventListener during render to capture
   * and wrap Inferno's delegated event listeners with syncBatch
   */
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  const wrappedListeners = new WeakMap<any, any>();

  // Inferno's delegated events
  const INFERNO_EVENTS = [
    "click",
    "dblclick",
    "focusin",
    "focusout",
    "keydown",
    "keypress",
    "keyup",
    "mousedown",
    "mousemove",
    "mouseup",
    "touchend",
    "touchmove",
    "touchstart",
    "change",
    "input",
    "submit",
  ];

  // Temporarily replace addEventListener
  EventTarget.prototype.addEventListener = function (
    this: any,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    // Only wrap Inferno's delegated event listeners
    if (INFERNO_EVENTS.includes(type) && typeof listener === "function") {
      const wrappedListener = function (this: any, event: Event) {
        transaction(() => {
          listener.call(this, event);
        });
      };

      wrappedListeners.set(listener, wrappedListener);

      return originalAddEventListener.call(
        this,
        type,
        wrappedListener,
        options,
      );
    }

    // @ts-ignore
    return originalAddEventListener.call(this, type, listener, options);
  } as any;

  EventTarget.prototype.removeEventListener = function (
    this: any,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (
      INFERNO_EVENTS.includes(type) &&
      typeof listener === "function" &&
      wrappedListeners.has(listener)
    ) {
      const wrappedListener = wrappedListeners.get(listener);

      wrappedListeners.delete(listener);

      // @ts-ignore
      return originalRemoveEventListener.call(
        this,
        type,
        wrappedListener,
        options,
      );
    }

    // @ts-ignore
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  return infernoRender(...params);
}

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
  const originalAddEventListener = document.addEventListener.bind(document);
  const patchedEvents = new Set<string>();

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
  document.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    // Only wrap Inferno's delegated event listeners
    if (
      INFERNO_EVENTS.includes(type) &&
      typeof listener === "function" &&
      !patchedEvents.has(type)
    ) {
      patchedEvents.add(type);

      const wrappedListener = function (this: any, event: Event) {
        transaction(() => {
          listener.call(this, event);
        });
      };

      return originalAddEventListener(type, wrappedListener, options);
    }

    // @ts-ignore
    return originalAddEventListener(type, listener, options);
  } as any;

  try {
    // Call render - Inferno will synchronously attach its listeners
    return infernoRender(...params);
  } finally {
    // Restore original addEventListener
    document.addEventListener = originalAddEventListener;
  }
}

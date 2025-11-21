import { describe, it, expect, vi } from "vitest";
import { useRef } from "../useRef";
import { useEffect } from "../useEffect";
import { render } from "../";

describe("useRef", () => {
  it("should create a ref object with current property", () => {
    function Component() {
      const ref = useRef<HTMLDivElement>();
      expect(ref).toHaveProperty("current");
      return () => <div />;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    document.body.removeChild(container);
  });

  it("should allow setting and getting ref values", () => {
    function Component() {
      const ref = useRef<HTMLDivElement>();
      ref.current = document.createElement("div");
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      return () => <div />;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    document.body.removeChild(container);
  });

  it("should have initial value of null", () => {
    function Component() {
      const ref = useRef<HTMLDivElement>();
      expect(ref.current).toBe(null);
      return () => <div />;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    document.body.removeChild(container);
  });

  it("should allow ref to be assigned to DOM elements", () => {
    let capturedRef: any;

    function Component() {
      const ref = useRef<HTMLDivElement>();
      capturedRef = ref;
      return () => <div ref={ref}>Content</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    // After render, the ref should be assigned to the div element
    expect(capturedRef.current).toBeInstanceOf(HTMLDivElement);
    expect(capturedRef.current.textContent).toBe("Content");

    document.body.removeChild(container);
  });

  it("should trigger useEffect when ref is assigned to an element", async () => {
    const effectCallback = vi.fn();

    function Component() {
      const ref = useRef<HTMLDivElement>();

      useEffect(() => {
        // Reading ref.current subscribes the effect to the signal
        const element = ref.current;
        effectCallback(element);
      });

      return () => <div ref={ref}>Content</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    // Wait for microtask queue to process signal notifications
    await new Promise((resolve) => queueMicrotask(resolve));

    // Effect should run twice:
    // 1. Initially when effect is created (ref.current is null)
    // 2. After the element is mounted and assigned to ref.current
    expect(effectCallback).toHaveBeenCalledTimes(2);
    expect(effectCallback).toHaveBeenNthCalledWith(1, null);
    expect(effectCallback).toHaveBeenNthCalledWith(
      2,
      expect.any(HTMLDivElement)
    );

    document.body.removeChild(container);
  });

  it("should re-run effect when ref value changes", async () => {
    const effectCallback = vi.fn();
    let updateRef: ((el: HTMLDivElement | null) => void) | undefined;

    function Component() {
      const ref = useRef<HTMLDivElement>();

      useEffect(() => {
        // Reading ref.current subscribes the effect to changes
        const element = ref.current;
        effectCallback(element);
      });

      updateRef = (el: HTMLDivElement | null) => {
        ref.current = el;
      };

      return () => <div>Content</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Initial effect run
    expect(effectCallback).toHaveBeenCalledTimes(1);
    expect(effectCallback).toHaveBeenNthCalledWith(1, null);

    effectCallback.mockClear();

    // Manually set the ref to an element
    const testEl = document.createElement("div");
    updateRef?.(testEl);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Effect should run again with the new element
    expect(effectCallback).toHaveBeenCalledTimes(1);
    expect(effectCallback).toHaveBeenCalledWith(testEl);

    effectCallback.mockClear();

    // Change ref to null
    updateRef?.(null);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Effect should run again with null
    expect(effectCallback).toHaveBeenCalledTimes(1);
    expect(effectCallback).toHaveBeenCalledWith(null);

    document.body.removeChild(container);
  });

  it("should work with multiple refs in the same effect", async () => {
    const effectCallback = vi.fn();

    function Component() {
      const ref1 = useRef<HTMLDivElement>();
      const ref2 = useRef<HTMLSpanElement>();

      useEffect(() => {
        // Reading both refs subscribes to both signals
        effectCallback({
          ref1: ref1.current,
          ref2: ref2.current,
        });
      });

      return () => (
        <div>
          <div ref={ref1}>Div</div>
          <span ref={ref2}>Span</span>
        </div>
      );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    await new Promise((resolve) => queueMicrotask(resolve));

    // Effect should be called:
    // 1. Initially (both refs null)
    // 2. When ref1 is assigned
    // 3. When ref2 is assigned
    expect(effectCallback.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Last call should have both refs assigned
    const lastCall = effectCallback.mock.calls[effectCallback.mock.calls.length - 1][0];
    expect(lastCall.ref1).toBeInstanceOf(HTMLDivElement);
    expect(lastCall.ref2).toBeInstanceOf(HTMLSpanElement);

    document.body.removeChild(container);
  });

  it("should only notify when value is set, not when read", async () => {
    const effectCallback = vi.fn();
    let readRef: (() => void) | undefined;

    function Component() {
      const ref = useRef<HTMLDivElement>();

      useEffect(() => {
        const element = ref.current;
        effectCallback(element);
      });

      readRef = () => {
        // Just reading should not trigger a notification
        const _ = ref.current;
      };

      return () => <div>Content</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    await new Promise((resolve) => queueMicrotask(resolve));

    const initialCallCount = effectCallback.mock.calls.length;

    // Reading the ref should not cause effect to re-run
    readRef?.();
    readRef?.();
    readRef?.();

    await new Promise((resolve) => queueMicrotask(resolve));

    expect(effectCallback).toHaveBeenCalledTimes(initialCallCount);

    document.body.removeChild(container);
  });

  it("should work with callback refs", () => {
    const refCallback = vi.fn();

    function Component() {
      return () => <div ref={refCallback}>Content</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Component />, container);

    // Callback ref should be called with the element
    expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    expect(refCallback.mock.calls[0][0].textContent).toBe("Content");

    document.body.removeChild(container);
  });
});

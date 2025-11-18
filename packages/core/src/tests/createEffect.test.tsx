import { describe, it, expect, vi } from "vitest";
import { createEffect } from "../createEffect";
import { createState } from "../createState";
import { render } from "../index";

describe("createEffect", () => {
  it("should run immediately on creation", () => {
    const effectFn = vi.fn();

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);
  });

  it("should track reactive dependencies", async () => {
    const state = createState({ count: 0 });
    const effectFn = vi.fn(() => {
      state.count; // Access to track
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it("should re-run when dependencies change", async () => {
    const state = createState({ count: 0 });
    const results: number[] = [];

    createEffect(() => {
      results.push(state.count);
    });

    expect(results).toEqual([0]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([0, 1]);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([0, 1, 2]);
  });

  it("should run on microtask, not synchronously", () => {
    const state = createState({ count: 0 });
    const results: number[] = [];

    createEffect(() => {
      results.push(state.count);
    });

    expect(results).toEqual([0]); // Initial run is synchronous

    state.count = 1;

    // Should not have run yet (microtask not flushed)
    expect(results).toEqual([0]);
  });

  it("should handle multiple effects on same state", async () => {
    const state = createState({ count: 0 });
    const results1: number[] = [];
    const results2: number[] = [];

    createEffect(() => {
      results1.push(state.count);
    });

    createEffect(() => {
      results2.push(state.count * 2);
    });

    expect(results1).toEqual([0]);
    expect(results2).toEqual([0]);

    state.count = 5;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results1).toEqual([0, 5]);
    expect(results2).toEqual([0, 10]);
  });

  it("should only track dependencies accessed during execution", async () => {
    const state = createState({ a: 1, b: 2 });
    const effectFn = vi.fn(() => {
      state.a; // Only track 'a'
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    // Change 'b' (not tracked)
    state.b = 100;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectFn).toHaveBeenCalledTimes(1); // Should not re-run

    // Change 'a' (tracked)
    state.a = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectFn).toHaveBeenCalledTimes(2); // Should re-run
  });

  it("should re-track dependencies on each run", async () => {
    const state = createState({ useA: true, a: 1, b: 2 });
    const effectFn = vi.fn(() => {
      if (state.useA) {
        state.a;
      } else {
        state.b;
      }
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    // Change 'a' (currently tracked)
    state.a = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(2);

    // Change 'b' (not tracked)
    state.b = 20;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(2); // No change

    // Switch to using 'b'
    state.useA = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(3);

    // Change 'a' (no longer tracked)
    state.a = 100;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(3); // No change

    // Change 'b' (now tracked)
    state.b = 200;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(4);
  });

  it("should handle effects that modify state", async () => {
    const state = createState({ input: 1, output: 0 });

    createEffect(() => {
      state.output = state.input * 2;
    });

    expect(state.output).toBe(2);

    state.input = 5;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.output).toBe(10);
  });

  it("should handle nested state access", async () => {
    const state = createState({
      user: {
        profile: {
          name: "Alice",
        },
      },
    });
    const results: string[] = [];

    createEffect(() => {
      results.push(state.user.profile.name);
    });

    expect(results).toEqual(["Alice"]);

    state.user.profile.name = "Bob";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual(["Alice", "Bob"]);
  });

  it("should handle array access", async () => {
    const state = createState({ items: [1, 2, 3] });
    const results: number[] = [];

    createEffect(() => {
      results.push(state.items.length);
    });

    expect(results).toEqual([3]);

    state.items.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([3, 4]);

    state.items.pop();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([3, 4, 3]);
  });

  it("should handle effects accessing array elements", async () => {
    const state = createState({ items: [1, 2, 3] });
    const results: number[] = [];

    createEffect(() => {
      const sum = state.items.reduce((acc, val) => acc + val, 0);
      results.push(sum);
    });

    expect(results).toEqual([6]);

    state.items.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([6, 10]);

    state.items[0] = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([6, 10, 19]);
  });

  it("should batch multiple state changes before re-running", async () => {
    const state = createState({ a: 1, b: 2 });
    const effectFn = vi.fn(() => {
      state.a;
      state.b;
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    // Multiple changes in same turn
    state.a = 10;
    state.b = 20;
    state.a = 15;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should only run once for all changes
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it("should handle effects with no dependencies", async () => {
    let runCount = 0;

    createEffect(() => {
      runCount++;
      // No reactive state accessed
    });

    expect(runCount).toBe(1);

    // Wait to ensure it doesn't run again
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(runCount).toBe(1);
  });

  it("should handle effects that conditionally access state", async () => {
    const state = createState({ enabled: true, value: 5 });
    const effectFn = vi.fn(() => {
      if (state.enabled) {
        state.value;
      }
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    // Change value (tracked because enabled is true)
    state.value = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(2);

    // Disable
    state.enabled = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(3);

    // Change value (not tracked because enabled is false)
    state.value = 20;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(effectFn).toHaveBeenCalledTimes(3); // No change
  });

  it("should handle complex dependency graphs", async () => {
    const state = createState({
      multiplier: 2,
      values: [1, 2, 3],
    });
    const results: number[] = [];

    createEffect(() => {
      const sum = state.values.reduce((acc, val) => acc + val, 0);
      results.push(sum * state.multiplier);
    });

    expect(results).toEqual([12]); // (1+2+3) * 2

    state.multiplier = 3;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(results).toEqual([12, 18]); // (1+2+3) * 3

    state.values.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(results).toEqual([12, 18, 30]); // (1+2+3+4) * 3
  });

  it("should handle effects that run other synchronous code", async () => {
    const state = createState({ count: 0 });
    const sideEffects: string[] = [];

    createEffect(() => {
      sideEffects.push("effect-start");
      const value = state.count;
      sideEffects.push(`value-${value}`);
      sideEffects.push("effect-end");
    });

    expect(sideEffects).toEqual(["effect-start", "value-0", "effect-end"]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sideEffects).toEqual([
      "effect-start",
      "value-0",
      "effect-end",
      "effect-start",
      "value-1",
      "effect-end",
    ]);
  });

  it("should handle rapid state changes", async () => {
    const state = createState({ count: 0 });
    const effectFn = vi.fn(() => {
      state.count;
    });

    createEffect(effectFn);

    expect(effectFn).toHaveBeenCalledTimes(1);

    // Rapid changes
    for (let i = 1; i <= 10; i++) {
      state.count = i;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should batch all changes into one effect run
    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it("should access latest state values when effect runs", async () => {
    const state = createState({ count: 0 });
    const results: number[] = [];

    createEffect(() => {
      results.push(state.count);
    });

    state.count = 1;
    state.count = 2;
    state.count = 3;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should see latest value when effect runs
    expect(results).toEqual([0, 3]);
  });

  it("should call dispose function before re-executing", async () => {
    const state = createState({ count: 0 });
    const disposeCalls: number[] = [];
    const effectCalls: number[] = [];

    createEffect(() => {
      effectCalls.push(state.count);

      return () => {
        // Dispose sees the current state at the time it's called
        disposeCalls.push(state.count);
      };
    });

    expect(effectCalls).toEqual([0]);
    expect(disposeCalls).toEqual([]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Dispose is called after state change, before effect re-runs
    expect(disposeCalls).toEqual([1]);
    expect(effectCalls).toEqual([0, 1]);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(disposeCalls).toEqual([1, 2]);
    expect(effectCalls).toEqual([0, 1, 2]);
  });

  it("should handle dispose function with cleanup logic", async () => {
    const state = createState({ url: "/api/data" });
    const subscriptions: string[] = [];

    createEffect(() => {
      const currentUrl = state.url;
      subscriptions.push(`subscribe:${currentUrl}`);

      return () => {
        subscriptions.push(`unsubscribe:${currentUrl}`);
      };
    });

    expect(subscriptions).toEqual(["subscribe:/api/data"]);

    state.url = "/api/users";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(subscriptions).toEqual([
      "subscribe:/api/data",
      "unsubscribe:/api/data",
      "subscribe:/api/users",
    ]);

    state.url = "/api/posts";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(subscriptions).toEqual([
      "subscribe:/api/data",
      "unsubscribe:/api/data",
      "subscribe:/api/users",
      "unsubscribe:/api/users",
      "subscribe:/api/posts",
    ]);
  });

  it("should handle effects without dispose function", async () => {
    const state = createState({ count: 0 });
    const effectCalls: number[] = [];

    createEffect(() => {
      effectCalls.push(state.count);
      // No dispose function returned
    });

    expect(effectCalls).toEqual([0]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectCalls).toEqual([0, 1]);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectCalls).toEqual([0, 1, 2]);
  });

  it("should handle dispose function that throws error", async () => {
    const state = createState({ count: 0 });
    const effectCalls: number[] = [];
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    createEffect(() => {
      effectCalls.push(state.count);

      return () => {
        throw new Error("Dispose error");
      };
    });

    expect(effectCalls).toEqual([0]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Effect should still have run despite dispose throwing
    expect(effectCalls).toEqual([0, 1]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error in effect dispose function:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should call dispose with latest closure values", async () => {
    const state = createState({ count: 0 });
    const disposeValues: number[] = [];

    createEffect(() => {
      const capturedCount = state.count;

      return () => {
        disposeValues.push(capturedCount);
      };
    });

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disposeValues).toEqual([0]);

    state.count = 5;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disposeValues).toEqual([0, 1]);

    state.count = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disposeValues).toEqual([0, 1, 5]);
  });

  it("should handle rapid state changes with dispose", async () => {
    const state = createState({ count: 0 });
    const effectFn = vi.fn(() => {
      state.count;
    });
    const disposeFn = vi.fn();

    createEffect(() => {
      effectFn();
      return disposeFn;
    });

    expect(effectFn).toHaveBeenCalledTimes(1);
    expect(disposeFn).toHaveBeenCalledTimes(0);

    // Rapid changes should batch
    state.count = 1;
    state.count = 2;
    state.count = 3;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Effect and dispose should each be called once more
    expect(effectFn).toHaveBeenCalledTimes(2);
    expect(disposeFn).toHaveBeenCalledTimes(1);
  });

  it("should run effects synchronously before render when props change", async () => {
    const renderLog: string[] = [];

    function Child(props: { value: number }) {
      const state = createState({ internalValue: 0 });

      createEffect(() => {
        // Update internal state based on prop
        state.internalValue = props.value * 2;
      });

      return () => {
        renderLog.push(`render:${state.internalValue}`);
        return <div class="child-component">{state.internalValue}</div>;
      };
    }

    function Parent() {
      const state = createState({ count: 1 });

      return () => {
        renderLog.push(`parent-render:${state.count}`);
        return (
          <div>
            <Child value={state.count} />
            <button
              onClick={() => {
                state.count = 2;
              }}
            >
              Increment
            </button>
          </div>
        );
      };
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Initial render: parent renders, then child renders with effect-updated state
    expect(renderLog).toEqual(["parent-render:1", "render:2"]);

    const childDiv = container.querySelector(
      ".child-component"
    ) as HTMLDivElement;
    expect(childDiv?.textContent).toBe("2");

    // Clear log and trigger update
    renderLog.length = 0;

    const button = container.querySelector("button")!;
    button.click();

    await new Promise((resolve) => setTimeout(resolve, 10));

    // After prop update: parent renders, child's effect runs synchronously updating state,
    // then child renders once with the updated state
    expect(renderLog).toEqual(["parent-render:2", "render:4"]);

    expect(childDiv?.textContent).toBe("4");

    document.body.removeChild(container);
  });
});

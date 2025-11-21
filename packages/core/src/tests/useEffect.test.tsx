import { describe, it, expect, vi } from "vitest";
import { useEffect } from "../useEffect";
import { useState } from "../useState";
import { render } from "../index";

describe("useEffect", () => {
  it("should run immediately on creation", () => {
    const effectFn = vi.fn();

    function Component() {
      useEffect(effectFn);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(effectFn).toHaveBeenCalledTimes(1);
  });

  it("should track reactive dependencies", async () => {
    const effectFn = vi.fn();
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });
      useEffect(() => {
        effectFn();
        state.count; // Access to track
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(effectFn).toHaveBeenCalledTimes(1);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectFn).toHaveBeenCalledTimes(2);
  });

  it("should re-run when dependencies change", async () => {
    const results: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });
      useEffect(() => {
        results.push(state.count);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual([0]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([0, 1]);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([0, 1, 2]);
  });

  it("should run on microtask, not synchronously", () => {
    const results: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });
      useEffect(() => {
        results.push(state.count);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual([0]); // Initial run is synchronous

    state.count = 1;

    // Should not have run yet (microtask not flushed)
    expect(results).toEqual([0]);
  });

  it("should handle multiple effects on same state", async () => {
    const results1: number[] = [];
    const results2: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });
      useEffect(() => {
        results1.push(state.count);
      });

      useEffect(() => {
        results2.push(state.count * 2);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results1).toEqual([0]);
    expect(results2).toEqual([0]);

    state.count = 5;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results1).toEqual([0, 5]);
    expect(results2).toEqual([0, 10]);
  });

  it("should only track dependencies accessed during execution", async () => {
    const effectFn = vi.fn();
    let state!: { a: number; b: number };

    function Component() {
      state = useState({ a: 1, b: 2 });
      useEffect(() => {
        effectFn();
        state.a; // Only track 'a'
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const effectFn = vi.fn();
    let state!: { useA: boolean; a: number; b: number };

    function Component() {
      state = useState({ useA: true, a: 1, b: 2 });
      useEffect(() => {
        effectFn();
        if (state.useA) {
          state.a;
        } else {
          state.b;
        }
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    let state!: { input: number; output: number };

    function Component() {
      state = useState({ input: 1, output: 0 });

      useEffect(() => {
        state.output = state.input * 2;
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(state.output).toBe(2);

    state.input = 5;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state.output).toBe(10);
  });

  it("should handle nested state access", async () => {
    const results: string[] = [];
    let state!: {
      user: {
        profile: {
          name: string;
        };
      };
    };

    function Component() {
      state = useState({
        user: {
          profile: {
            name: "Alice",
          },
        },
      });

      useEffect(() => {
        results.push(state.user.profile.name);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual(["Alice"]);

    state.user.profile.name = "Bob";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual(["Alice", "Bob"]);
  });

  it("should handle array access", async () => {
    const results: number[] = [];
    let state!: { items: number[] };

    function Component() {
      state = useState({ items: [1, 2, 3] });

      useEffect(() => {
        results.push(state.items.length);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual([3]);

    state.items.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([3, 4]);

    state.items.pop();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([3, 4, 3]);
  });

  it("should handle effects accessing array elements", async () => {
    const results: number[] = [];
    let state!: { items: number[] };

    function Component() {
      state = useState({ items: [1, 2, 3] });

      useEffect(() => {
        const sum = state.items.reduce((acc, val) => acc + val, 0);
        results.push(sum);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual([6]);

    state.items.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([6, 10]);

    state.items[0] = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(results).toEqual([6, 10, 19]);
  });

  it("should batch multiple state changes before re-running", async () => {
    const effectFn = vi.fn();
    let state!: { a: number; b: number };

    function Component() {
      state = useState({ a: 1, b: 2 });
      useEffect(() => {
        effectFn();
        state.a;
        state.b;
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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

    function Component() {
      useEffect(() => {
        runCount++;
        // No reactive state accessed
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(runCount).toBe(1);

    // Wait to ensure it doesn't run again
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(runCount).toBe(1);
  });

  it("should handle effects that conditionally access state", async () => {
    const effectFn = vi.fn();
    let state!: { enabled: boolean; value: number };

    function Component() {
      state = useState({ enabled: true, value: 5 });
      useEffect(() => {
        effectFn();
        if (state.enabled) {
          state.value;
        }
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const results: number[] = [];
    let state!: { multiplier: number; values: number[] };

    function Component() {
      state = useState({
        multiplier: 2,
        values: [1, 2, 3],
      });

      useEffect(() => {
        const sum = state.values.reduce((acc, val) => acc + val, 0);
        results.push(sum * state.multiplier);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(results).toEqual([12]); // (1+2+3) * 2

    state.multiplier = 3;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(results).toEqual([12, 18]); // (1+2+3) * 3

    state.values.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(results).toEqual([12, 18, 30]); // (1+2+3+4) * 3
  });

  it("should handle effects that run other synchronous code", async () => {
    const sideEffects: string[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        sideEffects.push("effect-start");
        const value = state.count;
        sideEffects.push(`value-${value}`);
        sideEffects.push("effect-end");
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const effectFn = vi.fn();
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });
      useEffect(() => {
        effectFn();
        state.count;
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const results: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        results.push(state.count);
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    state.count = 1;
    state.count = 2;
    state.count = 3;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should see latest value when effect runs
    expect(results).toEqual([0, 3]);
  });

  it("should call dispose function before re-executing", async () => {
    const disposeCalls: number[] = [];
    const effectCalls: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        effectCalls.push(state.count);

        return () => {
          // Dispose sees the current state at the time it's called
          disposeCalls.push(state.count);
        };
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const subscriptions: string[] = [];
    let state!: { url: string };

    function Component() {
      state = useState({ url: "/api/data" });

      useEffect(() => {
        const currentUrl = state.url;
        subscriptions.push(`subscribe:${currentUrl}`);

        return () => {
          subscriptions.push(`unsubscribe:${currentUrl}`);
        };
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const effectCalls: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        effectCalls.push(state.count);
        // No dispose function returned
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(effectCalls).toEqual([0]);

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectCalls).toEqual([0, 1]);

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(effectCalls).toEqual([0, 1, 2]);
  });

  it("should handle dispose function that throws error", async () => {
    const effectCalls: number[] = [];
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        effectCalls.push(state.count);

        return () => {
          throw new Error("Dispose error");
        };
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const disposeValues: number[] = [];
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        const capturedCount = state.count;

        return () => {
          disposeValues.push(capturedCount);
        };
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
    const effectFn = vi.fn();
    const disposeFn = vi.fn();
    let state!: { count: number };

    function Component() {
      state = useState({ count: 0 });

      useEffect(() => {
        effectFn();
        state.count;
        return disposeFn;
      });
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

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
      const state = useState({ internalValue: 0 });

      useEffect(() => {
        // Update internal state based on prop
        state.internalValue = props.value * 2;
      });

      return () => {
        renderLog.push(`render:${state.internalValue}`);
        return <div class="child-component">{state.internalValue}</div>;
      };
    }

    function Parent() {
      const state = useState({ count: 1 });

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

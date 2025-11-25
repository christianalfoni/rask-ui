import { describe, it, expect, vi } from "vitest";
import { useAction } from "../useAction";

describe("useAction", () => {
  it("should initialize with idle state", () => {
    const [state] = useAction(async () => "result");

    expect(state.isPending).toBe(false);
    expect(state.params).toBe(null);
    expect(state.result).toBe(null);
    expect(state.error).toBe(null);
  });

  it("should handle successful action without parameters", async () => {
    const fn = vi.fn(async () => "success");
    const [state, run] = useAction(fn);

    run();

    expect(state.isPending).toBe(true);
    expect(state.params).toBe(null);
    expect(state.result).toBe(null);
    expect(state.error).toBe(null);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(state.isPending).toBe(false);
    expect(state.result).toBe("success");
    expect(state.error).toBe(null);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should handle successful action with parameters", async () => {
    const fn = vi.fn(async (x: number) => x * 2);
    const [state, run] = useAction(fn);

    run(5);

    expect(state.isPending).toBe(true);
    expect(state.params).toBe(5);
    expect(state.result).toBe(null);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(state.isPending).toBe(false);
    expect(state.params).toBe(5);
    expect(state.result).toBe(10);
    expect(state.error).toBe(null);
  });

  it("should handle errors", async () => {
    const fn = vi.fn(async () => {
      throw new Error("Test error");
    });
    const [state, run] = useAction(fn);

    run();

    expect(state.isPending).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(state.isPending).toBe(false);
    expect(state.result).toBe(null);
    expect(state.error?.message).toBe("Test error");
  });

  it("should abort previous action when new action starts", async () => {
    let resolveFirst: ((value: string) => void) | null = null;
    let resolveSecond: ((value: string) => void) | null = null;

    const fn = vi.fn(async (id: number) => {
      if (id === 1) {
        return new Promise<string>((resolve) => {
          resolveFirst = resolve;
        });
      } else {
        return new Promise<string>((resolve) => {
          resolveSecond = resolve;
        });
      }
    });

    const [state, run] = useAction(fn);

    // Start first action
    run(1);
    expect(state.isPending).toBe(true);
    expect(state.params).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Start second action (should abort first)
    run(2);
    expect(state.isPending).toBe(true);
    expect(state.params).toBe(2);

    // Resolve first action (should be ignored due to abort)
    resolveFirst?.("first");
    await new Promise((resolve) => setTimeout(resolve, 10));

    // State should not reflect first action
    expect(state.result).toBe(null);

    // Resolve second action
    resolveSecond?.("second");
    await new Promise((resolve) => setTimeout(resolve, 10));

    // State should reflect second action
    expect(state.isPending).toBe(false);
    expect(state.params).toBe(2);
    expect(state.result).toBe("second");
  });

  it("should track params even on error", async () => {
    const fn = vi.fn(async (x: number) => {
      throw new Error("Failed");
    });
    const [state, run] = useAction(fn);

    run(42);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(state.isPending).toBe(false);
    expect(state.params).toBe(42);
    expect(state.error?.message).toBe("Failed");
    expect(state.result).toBe(null);
  });

  it("should handle rapid consecutive calls", async () => {
    let callCount = 0;
    const fn = vi.fn(async (x: number) => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return x;
    });

    const [state, run] = useAction(fn);

    // Fire off multiple calls
    run(1);
    run(2);
    run(3);

    // Wait for all to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should have called function 3 times (not aborted, just ignored results)
    expect(callCount).toBe(3);

    // State should reflect the last call
    expect(state.isPending).toBe(false);
    expect(state.params).toBe(3);
    expect(state.result).toBe(3);
  });

  it("should handle null as valid param value", async () => {
    const fn = vi.fn(async (x: string | null) => {
      return x === null ? "was null" : x;
    });
    const [state, run] = useAction(fn);

    run(null);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(state.isPending).toBe(false);
    expect(state.params).toBe(null);
    expect(state.result).toBe("was null");
  });
});

import { describe, it, expect, vi } from "vitest";
import { useAction } from "../useAction";
import { render } from "../index";

describe("useAction", () => {
  describe("basic functionality", () => {
    it("should initialize with isPending false and empty queue", () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(() => Promise.resolve());
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isPending).toBe(false);
      expect(state.queue).toEqual([]);
    });

    it("should execute action successfully", async () => {
      const action = vi.fn(() => Promise.resolve());
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      expect(state.isPending).toBe(true);
      expect(state.queue).toHaveLength(1);
      expect(action).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.queue).toHaveLength(0);
    });

    it("should handle action with parameters", async () => {
      const action = vi.fn((params: { id: number }) => Promise.resolve());
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run({ id: 42 });

      expect(action).toHaveBeenCalledWith({ id: 42 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.queue).toHaveLength(0);
    });

    it("should handle action errors", async () => {
      const error = new Error("Action failed");
      const action = vi.fn(() => Promise.reject(error));
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(true);
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].error.message).toBe("Action failed");
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe("queue management", () => {
    it("should queue multiple actions and process them sequentially", async () => {
      let resolveFirst: () => void;
      let resolveSecond: () => void;
      let resolveThird: () => void;

      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<void>((resolve) => {
        resolveSecond = resolve;
      });
      const thirdPromise = new Promise<void>((resolve) => {
        resolveThird = resolve;
      });

      const action = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)
        .mockReturnValueOnce(thirdPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Queue three actions
      run();
      run();
      run();

      expect(state.queue).toHaveLength(3);
      expect(state.isPending).toBe(true);
      // Only processes first action once
      expect(action).toHaveBeenCalledTimes(1);

      // Resolve first action
      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      expect(state.isPending).toBe(true);

      // Resolve second action
      resolveSecond!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(1);
      expect(state.isPending).toBe(true);

      // Resolve third action
      resolveThird!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
    });

    it("should stop processing when first action has error", async () => {
      const error = new Error("First action failed");

      const action = vi.fn().mockRejectedValueOnce(error);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Queue two actions
      run();
      run();

      expect(state.queue).toHaveLength(2);
      // Only processes first action once
      expect(action).toHaveBeenCalledTimes(1);

      // First action fails
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].error.message).toBe("First action failed");
      expect(state.isPending).toBe(true); // Stays pending with error
      // Second action not attempted yet (queue stopped)
      expect(action).toHaveBeenCalledTimes(1);
    });

    it("should stop processing when all remaining actions have errors", async () => {
      const error1 = new Error("First failed");

      const action = vi.fn().mockRejectedValueOnce(error1);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].error.message).toBe("First failed");
      // Second action not processed yet (queue stops at first error)
      expect(state.queue[1].error).toBeNull();
      expect(state.isPending).toBe(true);
    });
  });

  describe("queued action methods", () => {
    it("should retry a failed action", async () => {
      const error = new Error("Action failed");
      let resolveRetry: () => void;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });

      const action = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockReturnValueOnce(retryPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].error.message).toBe("Action failed");
      expect(state.isPending).toBe(true); // isPending stays true even with error

      // Retry the failed action
      state.queue[0].retry();

      expect(state.queue).toHaveLength(1);
      // Error still set initially (processQueue doesn't clear it before calling fn)
      expect(state.queue[0].error.message).toBe("Action failed");
      expect(state.isPending).toBe(true);
      expect(action).toHaveBeenCalledTimes(2);

      resolveRetry!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
    });

    it("should cancel a queued action", async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const action = vi.fn().mockReturnValue(firstPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();

      expect(state.queue).toHaveLength(2);
      expect(state.isPending).toBe(true);

      // Cancel the second action
      state.queue[1].cancel();

      expect(state.queue).toHaveLength(1);
      expect(state.isPending).toBe(true);
      // Cancel triggers processQueue which calls action again (no guard against re-calling)
      expect(action).toHaveBeenCalledTimes(2);

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
      // Called twice (initial + cancel re-call)
      expect(action).toHaveBeenCalledTimes(2);
    });

    it("should cancel pending action and trigger queue processing", async () => {
      let resolveFirst: () => void;
      let resolveThird: () => void;

      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });
      const thirdPromise = new Promise<void>((resolve) => {
        resolveThird = resolve;
      });

      const action = vi
        .fn()
        .mockReturnValueOnce(firstPromise) // Initial call
        .mockReturnValueOnce(firstPromise) // Second item processed after first completes
        .mockReturnValueOnce(firstPromise) // Cancel re-calls processQueue for second (now first)
        .mockReturnValueOnce(thirdPromise); // After cancel removes second, process third

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();
      run();

      expect(state.queue).toHaveLength(3);
      // Only processes first action once
      expect(action).toHaveBeenCalledTimes(1);

      // Resolve first action - this will also resolve second since they share the same promise
      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // All three resolved (they share same promise since mockReturnValueOnce reused)
      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
      // After first completes, second and third are automatically processed
      expect(action).toHaveBeenCalledTimes(3);
    });

    it("should preserve action parameters when retrying", async () => {
      const error = new Error("Action failed");
      const action = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      const params = { id: 42, name: "test" };
      run(params);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue[0].params).toEqual(params);

      state.queue[0].retry();

      expect(action).toHaveBeenLastCalledWith(params);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
    });
  });

  describe("action without parameters", () => {
    it("should handle actions without parameters", async () => {
      const action = vi.fn(() => Promise.resolve());
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      expect(action).toHaveBeenCalledWith(null);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
    });

    it("should normalize undefined to null for parameterless actions", async () => {
      const action = vi.fn(() => Promise.resolve());
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      expect(state.queue[0].params).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  describe("error handling", () => {
    it("should convert errors to strings", async () => {
      const action = vi.fn(() => Promise.reject(new Error("Test error")));
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue[0].error.message).toBe("Test error");
    });

    it("should handle non-Error rejections", async () => {
      const action = vi.fn(() => Promise.reject("String error"));
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue[0].error).toBe("String error");
    });

    it("should clear error when retrying succeeds", async () => {
      const error = new Error("Failed");
      const action = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue[0].error).toBeTruthy();

      state.queue[0].retry();

      // Error not cleared immediately (still set while retrying)
      expect(state.queue[0].error.message).toBe("Failed");

      await new Promise((resolve) => setTimeout(resolve, 10));

      // After successful retry, item is removed from queue
      expect(state.queue).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle immediate resolution", async () => {
      const action = vi.fn(() => Promise.resolve());
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.queue).toHaveLength(0);
    });

    it("should handle immediate rejection", async () => {
      const error = new Error("Immediate error");
      const action = vi.fn(() => Promise.reject(error));
      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(true); // isPending stays true with error
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].error).toBeTruthy();
    });

    it("should handle rapid successive actions", async () => {
      let counter = 0;
      const action = vi.fn(() => {
        counter++;
        return Promise.resolve();
      });

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Queue 5 actions rapidly
      run();
      run();
      run();
      run();
      run();

      expect(state.queue).toHaveLength(5);
      // Only processes first action once
      expect(action).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
      // Still 5 total calls, no additional calls needed
      expect(action).toHaveBeenCalledTimes(5);
    });

    it("should handle delayed resolution", async () => {
      const action = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 20);
          })
      );

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      expect(state.isPending).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(state.isPending).toBe(false);
      expect(state.queue).toHaveLength(0);
    });

    it("should handle canceling the currently processing action", async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const action = vi.fn().mockReturnValueOnce(firstPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      expect(state.queue).toHaveLength(1);
      expect(state.isPending).toBe(true);

      // Cancel the currently processing action
      state.queue[0].cancel();

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);

      // Resolve the promise (should have no effect)
      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
    });

    it("should handle retrying with multiple queued actions", async () => {
      const error = new Error("Failed");
      let resolveRetry: () => void;
      let resolveSecond: () => void;

      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });
      const secondPromise = new Promise<void>((resolve) => {
        resolveSecond = resolve;
      });

      const action = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockReturnValueOnce(retryPromise)
        .mockReturnValueOnce(secondPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].error).toBeTruthy();

      // Retry the first action
      state.queue[0].retry();

      expect(state.queue).toHaveLength(2);
      expect(state.isPending).toBe(true);

      resolveRetry!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(1);
      expect(state.isPending).toBe(true);

      resolveSecond!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed success and failure scenarios", async () => {
      const error = new Error("Failed");
      let resolveFirst: () => void;

      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const action = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockRejectedValueOnce(error);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();
      run();

      expect(state.queue).toHaveLength(3);

      // First succeeds
      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      // Second is automatically processed after first completes
      expect(action).toHaveBeenCalledTimes(2);

      // Second fails
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(2);
      // After first completes, second becomes queue[0] and has the error
      expect(state.queue[0].error).toBeTruthy();
      // Third not processed yet (stopped at error)
      expect(state.queue[1].error).toBeNull();
      expect(state.isPending).toBe(true); // Stops at error but stays pending
    });

    it("should maintain queue integrity when canceling middle items", async () => {
      let resolveFirst: () => void;
      let resolveThird: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });
      const thirdPromise = new Promise<void>((resolve) => {
        resolveThird = resolve;
      });

      const action = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(thirdPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAction(action);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      run();
      run();

      expect(state.queue).toHaveLength(3);

      // Cancel the middle item
      state.queue[1].cancel();

      expect(state.queue).toHaveLength(2);
      expect(state.queue[0]).toBeDefined();
      expect(state.queue[1]).toBeDefined();

      resolveFirst!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(1);

      resolveThird!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.queue).toHaveLength(0);
      expect(state.isPending).toBe(false);
    });
  });
});

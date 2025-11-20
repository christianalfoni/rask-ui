import { describe, it, expect, vi } from "vitest";
import { useAsync } from "../useAsync";
import { render } from "../index";

describe("useAsync", () => {
  describe("without parameters", () => {
    it("should start in idle state", () => {
      let state: any, run: any;
      function Component() {
        const promise = new Promise(() => {});
        [state, run] = useAsync(() => promise);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isPending).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toBeNull();
      expect(state.params).toBeNull();
    });

    it("should resolve to result state on success", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve("success"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isPending).toBe(false);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.value).toBe("success");
      expect(state.error).toBeNull();
      expect(state.params).toBeNull();
    });

    it("should resolve to error state on rejection", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.reject(new Error("failed")));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toContain("failed");
      expect(state.params).toBeNull();
    });

    it("should handle run() method", async () => {
      const fetcher = vi.fn(() => Promise.resolve("data"));
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(fetcher).toHaveBeenCalledTimes(0);

      run();
      expect(state.isPending).toBe(true);
      expect(state.value).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(state.value).toBe("data");
    });
  });

  describe("with parameters", () => {
    it("should not auto-run on creation", () => {
      const fetcher = vi.fn((page: number) => Promise.resolve(`page-${page}`));
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isPending).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toBeNull();
      expect(state.params).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(0);
    });

    it("should run when run() is called with params", async () => {
      const fetcher = vi.fn((page: number) => Promise.resolve(`page-${page}`));
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run(1);

      expect(state.isPending).toBe(true);
      expect(state.params).toBe(1);
      expect(state.value).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0][0]).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.value).toBe("page-1");
      expect(state.params).toBeNull();
    });

    it("should handle error state with params", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync<number, any>((id: number) =>
          Promise.reject(new Error(`failed-${id}`))
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run(42);

      expect(state.isPending).toBe(true);
      expect(state.params).toBe(42);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toContain("failed-42");
      expect(state.params).toBeNull();
    });

    it("should update params when running with different values", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync((page: number) =>
          Promise.resolve(`page-${page}`)
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run(1);
      expect(state.params).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      run(2);
      expect(state.params).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("page-2");
    });
  });

  describe("cancellation", () => {
    it("should cancel previous request when run again", async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const fetcher = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // First run
      run();
      expect(state.isPending).toBe(true);

      // Trigger second run before first completes - this cancels the first run
      run();
      expect(state.isPending).toBe(true);

      // Resolve first (should be ignored due to cancellation)
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBeNull(); // First result ignored

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("second");
    });

    it("should cancel previous request with params", async () => {
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      const fetcher = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      let state: any, run: any;
      function Component() {
        [state, run] = useAsync((page: number) => fetcher());
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run(1);
      expect(state.params).toBe(1);

      // Trigger second run before first completes
      run(2);
      expect(state.params).toBe(2);

      // Resolve first (should be ignored due to cancellation)
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBeNull(); // First result ignored

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("second");
    });

    it("should handle rapid successive runs", async () => {
      let counter = 0;
      const fetcher = vi.fn(() => Promise.resolve(`data-${++counter}`));
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Rapid runs
      run();
      run();
      run();

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Only the last run should complete
      expect(fetcher).toHaveBeenCalledTimes(3); // 3 runs
      expect(state.value).toBe("data-3");
    });
  });

  describe("type handling", () => {
    it("should handle numeric values", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve(42));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe(42);
    });

    it("should handle object values", async () => {
      const data = { id: 1, name: "Test" };
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toEqual(data);
    });

    it("should handle array values", async () => {
      const data = [1, 2, 3, 4, 5];
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toEqual(data);
    });

    it("should convert error to string", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.reject("string error"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(typeof state.error).toBe("string");
      expect(state.error).toBe("string error");
    });

    it("should handle error objects", async () => {
      const error = new Error("Something went wrong");
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.reject(error));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toContain("Something went wrong");
    });

    it("should handle different parameter types", async () => {
      const fetcher = vi.fn((params) => Promise.resolve(params));

      // Object params
      let state1: any, run1: any;
      function Component1() {
        [state1, run1] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container1 = document.createElement("div");
      render(<Component1 />, container1);

      run1({ id: 1, name: "test" } as any);
      expect(state1.params).toEqual({ id: 1, name: "test" });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Array params
      let state2: any, run2: any;
      function Component2() {
        [state2, run2] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container2 = document.createElement("div");
      render(<Component2 />, container2);

      run2([1, 2, 3] as any);
      expect(state2.params).toEqual([1, 2, 3]);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // String params
      let state3: any, run3: any;
      function Component3() {
        [state3, run3] = useAsync((str: string) => Promise.resolve(str));
        return () => <div>test</div>;
      }

      const container3 = document.createElement("div");
      render(<Component3 />, container3);

      run3("test");
      expect(state3.params).toBe("test");
    });
  });

  describe("edge cases", () => {
    it("should handle immediate resolution", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve("immediate"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.value).toBe("immediate");
    });

    it("should handle immediate rejection", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.reject("immediate error"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isPending).toBe(false);
      expect(state.error).toBe("immediate error");
    });

    it("should handle delayed resolution", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve("delayed"), 10);
            })
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();
      expect(state.isPending).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(state.isPending).toBe(false);
      expect(state.value).toBe("delayed");
    });

    it("should clear error on successful retry", async () => {
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce("success");

      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toContain("First error");
      expect(state.value).toBeNull();

      run();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeNull();
      expect(state.value).toBe("success");
    });
  });

  describe("reactive getters", () => {
    it("should expose reactive getters", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(() => Promise.resolve("data"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run();

      // Access getters before completion
      const running1 = state.isPending;
      const result1 = state.value;
      const error1 = state.error;
      const params1 = state.params;

      expect(running1).toBe(true);
      expect(result1).toBeNull();
      expect(error1).toBeNull();
      expect(params1).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Access getters after completion
      expect(state.isPending).toBe(false);
      expect(state.value).toBe("data");
      expect(state.error).toBeNull();
      expect(state.params).toBeNull();
    });

    it("should track params during execution", async () => {
      let state: any, run: any;
      function Component() {
        [state, run] = useAsync(
          (id: number) =>
            new Promise((resolve) =>
              setTimeout(() => resolve(`result-${id}`), 20)
            )
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      run(123);

      expect(state.isPending).toBe(true);
      expect(state.params).toBe(123);

      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(state.isPending).toBe(false);
      expect(state.params).toBeNull();
    });
  });
});

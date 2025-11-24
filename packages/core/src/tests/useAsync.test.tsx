import { describe, it, expect, vi } from "vitest";
import { useAsync, isAsync } from "../useAsync";
import { render } from "../index";

describe("useAsync", () => {
  describe("basic functionality", () => {
    it("should auto-run on mount and start in loading state", () => {
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => new Promise(() => {}));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toBeNull();
    });

    it("should resolve to success state", async () => {
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.resolve("success"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBe("success");
      expect(state.error).toBeNull();
    });

    it("should resolve to error state on rejection", async () => {
      let state: any, refresh: any;
      const error = new Error("failed");
      function Component() {
        [state, refresh] = useAsync(() => Promise.reject(error));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBeNull();
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("failed");
    });

    it("should auto-run the async function on mount", async () => {
      const fetcher = vi.fn(() => Promise.resolve("data"));
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("data");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("refresh functionality", () => {
    it("should set isRefreshing when refresh is called with existing value", async () => {
      let state: any, refresh: any;
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

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);

      // Resolve first load
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBe("first");

      // Refresh
      refresh();

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(true);
      expect(state.value).toBe("first");

      // Resolve refresh
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBe("second");
    });

    it("should set isLoading when refresh is called after error", async () => {
      let state: any, refresh: any;
      const error = new Error("failed");
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("failed");
      expect(state.value).toBeNull();

      // Refresh after error
      refresh();

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBe("success");
      expect(state.error).toBeNull();
    });

    it("should not trigger refresh if already loading", async () => {
      let state: any, refresh: any;
      const fetcher = vi.fn(() => new Promise(() => {}));

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Try to refresh while loading
      await refresh();

      // Should not trigger another call
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should return a promise from refresh that resolves on success", async () => {
      let state: any, refresh: any;
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const fetcher = vi.fn(() => promise);

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Wait for initial load
      resolvePromise!("initial");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create new promise for refresh
      let resolveRefresh: (value: string) => void;
      const refreshPromise = new Promise<string>((resolve) => {
        resolveRefresh = resolve;
      });
      fetcher.mockReturnValueOnce(refreshPromise);

      let refreshResolved = false;
      refresh().then(() => {
        refreshResolved = true;
      });

      expect(refreshResolved).toBe(false);

      resolveRefresh!("refreshed");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(refreshResolved).toBe(true);
      expect(state.value).toBe("refreshed");
    });

    it("should return a promise from refresh that rejects on error", async () => {
      let state: any, refresh: any;
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const fetcher = vi.fn(() => promise);

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Wait for initial load
      resolvePromise!("initial");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create new promise for refresh that rejects
      const error = new Error("refresh failed");
      fetcher.mockRejectedValueOnce(error);

      let refreshRejected = false;
      refresh().catch(() => {
        refreshRejected = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(refreshRejected).toBe(true);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("refresh failed");
    });
  });

  describe("cancellation with AbortSignal", () => {
    it("should pass AbortSignal to the async function", async () => {
      let receivedSignal: AbortSignal | undefined;
      const fetcher = vi.fn((signal?: AbortSignal) => {
        receivedSignal = signal;
        return Promise.resolve("data");
      });

      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(receivedSignal).toBeInstanceOf(AbortSignal);
    });

    it("should abort previous request when refresh is called", async () => {
      let firstSignal: AbortSignal | undefined;
      let secondSignal: AbortSignal | undefined;
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
        .mockImplementationOnce((signal?: AbortSignal) => {
          firstSignal = signal;
          return firstPromise;
        })
        .mockImplementationOnce((signal?: AbortSignal) => {
          secondSignal = signal;
          return secondPromise;
        });

      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(firstSignal?.aborted).toBe(false);

      // Resolve first to get to refreshable state
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Trigger refresh - should abort first signal
      refresh();

      expect(firstSignal?.aborted).toBe(true);
      expect(secondSignal?.aborted).toBe(false);

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("second");
    });

    it("should ignore aborted request results", async () => {
      let state: any, refresh: any;
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

      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve first to get to refreshable state
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Trigger refresh (aborts previous)
      refresh();

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only second result should be in state
      expect(state.value).toBe("second");
    });
  });

  describe("type handling", () => {
    it("should handle numeric values", async () => {
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.resolve(42));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe(42);
    });

    it("should handle object values", async () => {
      const data = { id: 1, name: "Test" };
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toEqual(data);
    });

    it("should handle array values", async () => {
      const data = [1, 2, 3, 4, 5];
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.resolve(data));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toEqual(data);
    });

    it("should preserve Error objects", async () => {
      const error = new Error("Something went wrong");
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.reject(error));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("Something went wrong");
    });
  });

  describe("edge cases", () => {
    it("should handle immediate resolution", async () => {
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.resolve("immediate"));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.value).toBe("immediate");
    });

    it("should handle immediate rejection", async () => {
      const error = new Error("immediate error");
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(() => Promise.reject(error));
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("immediate error");
    });

    it("should handle delayed resolution", async () => {
      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve("delayed"), 20);
            })
        );
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(state.isLoading).toBe(false);
      expect(state.value).toBe("delayed");
    });

    it("should clear error on successful retry", async () => {
      const error = new Error("First error");
      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("First error");
      expect(state.value).toBeNull();

      refresh();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeNull();
      expect(state.value).toBe("success");
    });

    it("should handle rapid successive refreshes", async () => {
      let counter = 0;
      let resolvers: Array<(value: string) => void> = [];
      const fetcher = vi.fn(() => {
        const currentCount = ++counter;
        return new Promise<string>((resolve) => {
          resolvers.push(() => resolve(`data-${currentCount}`));
        });
      });

      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve initial load
      resolvers[0]();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.value).toBe("data-1");

      // Rapid refreshes
      refresh();
      refresh();
      refresh();

      // Resolve in order
      resolvers[1]();
      await new Promise((resolve) => setTimeout(resolve, 10));
      resolvers[2]();
      await new Promise((resolve) => setTimeout(resolve, 10));
      resolvers[3]();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only the last result should be in state due to abortion
      expect(state.value).toBe("data-4");
    });
  });

  describe("cleanup", () => {
    it("should abort request when component unmounts", async () => {
      let signal: AbortSignal | undefined;
      const fetcher = vi.fn((s?: AbortSignal) => {
        signal = s;
        return new Promise(() => {});
      });

      let state: any, refresh: any;
      function Component() {
        [state, refresh] = useAsync(fetcher);
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(signal?.aborted).toBe(false);

      // Unmount
      render(null, container);

      expect(signal?.aborted).toBe(true);
    });
  });

  describe("isAsync helper", () => {
    it("should identify async state objects", () => {
      expect(
        isAsync({
          isLoading: true,
          isRefreshing: false,
          value: null,
          error: null,
        })
      ).toBe(true);

      expect(
        isAsync({
          isLoading: false,
          isRefreshing: true,
          value: "data",
          error: null,
        })
      ).toBe(true);
    });

    it("should reject non-async objects", () => {
      expect(isAsync(null)).toBe(false);
      expect(isAsync(undefined)).toBe(false);
      expect(isAsync({})).toBe(false);
      expect(isAsync({ isLoading: true })).toBe(false);
      expect(isAsync({ value: "test" })).toBe(false);
    });
  });
});

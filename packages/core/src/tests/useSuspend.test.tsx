import { describe, it, expect, vi } from "vitest";
import { useSuspend } from "../useSuspend";
import { useAsync } from "../useAsync";
import { render } from "../index";

describe("useSuspend", () => {
  describe("basic functionality", () => {
    it("should initialize with isLoading true when any async is loading", () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => new Promise(() => {}));
        state = useSuspend({
          data: () => async1,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.values.data).toBeNull();
    });

    it("should resolve to success state when all asyncs resolve", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("value1"));
        const [async2] = useAsync(() => Promise.resolve("value2"));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.values.data1).toBe("value1");
      expect(state.values.data2).toBe("value2");
    });

    it("should set error when any async fails", async () => {
      const error = new Error("failed");
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("success"));
        const [async2] = useAsync(() => Promise.reject(error));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("failed");
    });

    it("should handle mixed async and non-async values", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("async-value"));
        state = useSuspend({
          asyncData: () => async1,
          syncData: () => "sync-value",
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(state.values.syncData).toBe("sync-value");
      expect(state.values.asyncData).toBeNull();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.values.asyncData).toBe("async-value");
      expect(state.values.syncData).toBe("sync-value");
    });
  });

  describe("loading and refreshing states", () => {
    it("should set isLoading true when any async is loading", async () => {
      let state: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      function Component() {
        const [async1] = useAsync(() => firstPromise);
        const [async2] = useAsync(() => secondPromise);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);

      // Resolve first
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Still loading because second is not resolved
      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");
    });

    it("should set isRefreshing true when any async is refreshing", async () => {
      let state: any, refresh2: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      let resolveRefresh: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
      const refreshPromise = new Promise<string>((resolve) => {
        resolveRefresh = resolve;
      });

      const fetcher1 = vi.fn().mockReturnValueOnce(firstPromise);
      const fetcher2 = vi
        .fn()
        .mockReturnValueOnce(secondPromise)
        .mockReturnValueOnce(refreshPromise);

      function Component() {
        const [async1] = useAsync(fetcher1);
        const [async2, refresh2Fn] = useAsync(fetcher2);
        refresh2 = refresh2Fn;
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve initial loads
      resolveFirst!("first");
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);

      // Refresh one async
      refresh2();

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(true);
      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");

      // Resolve refresh
      resolveRefresh!("refreshed");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data2).toBe("refreshed");
    });

    it("should prioritize isLoading over isRefreshing", async () => {
      let state: any, refresh: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      let resolveRefresh: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
      const refreshPromise = new Promise<string>((resolve) => {
        resolveRefresh = resolve;
      });

      const fetcher1 = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(refreshPromise);
      const fetcher2 = vi.fn().mockReturnValueOnce(secondPromise);

      function Component() {
        const [async1, refreshFn] = useAsync(fetcher1);
        refresh = refreshFn;
        const [async2] = useAsync(fetcher2);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve first async
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true); // Second is still loading
      expect(state.isRefreshing).toBe(false);

      // Start refresh on first while second is still loading
      refresh();

      // isLoading should be true, isRefreshing should be false (loading takes priority)
      expect(state.isLoading).toBe(true);
      expect(state.isRefreshing).toBe(false);

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now first is refreshing and second is done
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(true);

      // Resolve refresh
      resolveRefresh!("refreshed");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data1).toBe("refreshed");
      expect(state.values.data2).toBe("second");
    });
  });

  describe("error handling", () => {
    it("should report error from first failing async", async () => {
      const error1 = new Error("error1");
      const error2 = new Error("error2");
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.reject(error1));
        const [async2] = useAsync(() => Promise.reject(error2));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);

      // The error should be one of them (depends on iteration order)
      expect([error1.message, error2.message]).toContain(state.error.message);
    });

    it("should clear error when all asyncs succeed after retry", async () => {
      const error = new Error("failed");
      let state: any, refresh2: any;

      const fetcher1 = vi
        .fn()
        .mockResolvedValueOnce("value1")
        .mockResolvedValueOnce("value1-refreshed");
      const fetcher2 = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("value2");

      function Component() {
        const [async1] = useAsync(fetcher1);
        const [async2, refresh2Fn] = useAsync(fetcher2);
        refresh2 = refresh2Fn;
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("failed");
      expect(state.isLoading).toBe(true);

      // Retry the failed async
      refresh2();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data1).toBe("value1");
      expect(state.values.data2).toBe("value2");
    });

    it("should maintain error state when refreshing", async () => {
      const error = new Error("failed");
      let state: any, refresh1: any;

      const fetcher1 = vi
        .fn()
        .mockResolvedValueOnce("value1")
        .mockResolvedValueOnce("value1-refreshed");
      const fetcher2 = vi.fn().mockRejectedValueOnce(error);

      function Component() {
        const [async1, refresh1Fn] = useAsync(fetcher1);
        refresh1 = refresh1Fn;
        const [async2] = useAsync(fetcher2);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);

      // Refresh a successful async while another has an error
      refresh1();

      expect(state.error).toBeInstanceOf(Error);
      expect(state.isLoading).toBe(true); // Error keeps it loading
      expect(state.isRefreshing).toBe(false);
    });
  });

  describe("values update behavior", () => {
    it("should not update values while loading", async () => {
      let state: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      function Component() {
        const [async1] = useAsync(() => firstPromise);
        const [async2] = useAsync(() => secondPromise);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      const initialValues = state.values;

      // Resolve first
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Values should not update yet (second is still loading)
      expect(state.values).toBe(initialValues);
      expect(state.values.data1).toBeNull();

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now values should update
      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");
    });

    it("should not update values while refreshing", async () => {
      let state: any, refresh: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      let resolveRefresh: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
      const refreshPromise = new Promise<string>((resolve) => {
        resolveRefresh = resolve;
      });

      const fetcher1 = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(refreshPromise);
      const fetcher2 = vi.fn().mockReturnValueOnce(secondPromise);

      function Component() {
        const [async1, refreshFn] = useAsync(fetcher1);
        refresh = refreshFn;
        const [async2] = useAsync(fetcher2);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve initial loads
      resolveFirst!("first");
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");

      // Start refresh
      refresh();

      const valuesBeforeRefresh = state.values;

      // Values should not change during refresh
      expect(state.values).toBe(valuesBeforeRefresh);
      expect(state.values.data1).toBe("first");

      // Resolve refresh
      resolveRefresh!("refreshed");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now values should update
      expect(state.values.data1).toBe("refreshed");
      expect(state.values.data2).toBe("second");
    });

    it("should not update values when there is an error", async () => {
      const error = new Error("failed");
      let state: any;

      function Component() {
        const [async1] = useAsync(() => Promise.resolve("success"));
        const [async2] = useAsync(() => Promise.reject(error));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      const initialValues = state.values;

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Values should not update because there's an error
      expect(state.values).toBe(initialValues);
      expect(state.error).toBeInstanceOf(Error);
    });

    it("should update values only when all conditions are met", async () => {
      let state: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });

      function Component() {
        const [async1] = useAsync(() => firstPromise);
        const [async2] = useAsync(() => secondPromise);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve first
      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Values not updated yet (second still loading)
      expect(state.values.data1).toBe(null);
      expect(state.values.data2).toBe(null);

      // Resolve second
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Values should now be updated

      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");
    });
  });

  describe("edge cases", () => {
    it("should handle empty async object", () => {
      let state: any;
      function Component() {
        state = useSuspend({});
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.values).toEqual({});
    });

    it("should handle only sync values", () => {
      let state: any;
      function Component() {
        state = useSuspend({
          value1: () => "sync1",
          value2: () => "sync2",
          value3: () => 42,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
      expect(state.values.value1).toBe("sync1");
      expect(state.values.value2).toBe("sync2");
      expect(state.values.value3).toBe(42);
    });

    it("should handle single async value", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("value"));
        state = useSuspend({
          data: () => async1,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.values.data).toBe("value");
    });

    it("should handle many async values", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("value1"));
        const [async2] = useAsync(() => Promise.resolve("value2"));
        const [async3] = useAsync(() => Promise.resolve("value3"));
        const [async4] = useAsync(() => Promise.resolve("value4"));
        const [async5] = useAsync(() => Promise.resolve("value5"));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
          data3: () => async3,
          data4: () => async4,
          data5: () => async5,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.values.data1).toBe("value1");
      expect(state.values.data2).toBe("value2");
      expect(state.values.data3).toBe("value3");
      expect(state.values.data4).toBe("value4");
      expect(state.values.data5).toBe("value5");
    });

    it("should handle immediate resolution", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve("immediate"));
        state = useSuspend({
          data: () => async1,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.values.data).toBe("immediate");
    });

    it("should handle immediate rejection", async () => {
      const error = new Error("immediate error");
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.reject(error));
        state = useSuspend({
          data: () => async1,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeInstanceOf(Error);
      expect(state.error.message).toBe("immediate error");
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple refresh operations", async () => {
      let state: any, refresh1: any, refresh2: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      let resolveRefresh1: (value: string) => void;
      let resolveRefresh2: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
      const refreshPromise1 = new Promise<string>((resolve) => {
        resolveRefresh1 = resolve;
      });
      const refreshPromise2 = new Promise<string>((resolve) => {
        resolveRefresh2 = resolve;
      });

      const fetcher1 = vi
        .fn()
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(refreshPromise1);
      const fetcher2 = vi
        .fn()
        .mockReturnValueOnce(secondPromise)
        .mockReturnValueOnce(refreshPromise2);

      function Component() {
        const [async1, refresh1Fn] = useAsync(fetcher1);
        refresh1 = refresh1Fn;
        const [async2, refresh2Fn] = useAsync(fetcher2);
        refresh2 = refresh2Fn;
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      // Resolve initial loads
      resolveFirst!("first");
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");

      // Start both refreshes
      refresh1();
      refresh2();

      expect(state.isRefreshing).toBe(true);
      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");

      // Resolve first refresh
      resolveRefresh1!("refreshed1");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Still refreshing because second is not done
      expect(state.isRefreshing).toBe(true);
      expect(state.values.data1).toBe("first"); // Not updated yet

      // Resolve second refresh
      resolveRefresh2!("refreshed2");
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now all done
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data1).toBe("refreshed1");
      expect(state.values.data2).toBe("refreshed2");
    });

    it("should handle transition from error to success", async () => {
      const error = new Error("failed");
      let state: any, refresh: any;

      const fetcher = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce("success");

      function Component() {
        const [async1, refreshFn] = useAsync(fetcher);
        refresh = refreshFn;
        const [async2] = useAsync(() => Promise.resolve("value2"));
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeInstanceOf(Error);
      expect(state.isLoading).toBe(true);

      // Refresh the failed async
      refresh();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.values.data1).toBe("success");
      expect(state.values.data2).toBe("value2");
    });

    it("should handle alternating async resolutions", async () => {
      let state: any;
      let resolveFirst: (value: string) => void;
      let resolveSecond: (value: string) => void;
      let resolveThird: (value: string) => void;

      const firstPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve;
      });
      const thirdPromise = new Promise<string>((resolve) => {
        resolveThird = resolve;
      });

      function Component() {
        const [async1] = useAsync(() => firstPromise);
        const [async2] = useAsync(() => secondPromise);
        const [async3] = useAsync(() => thirdPromise);
        state = useSuspend({
          data1: () => async1,
          data2: () => async2,
          data3: () => async3,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      expect(state.isLoading).toBe(true);

      // Resolve in non-sequential order
      resolveSecond!("second");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true); // Still loading

      resolveThird!("third");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(true); // Still loading

      resolveFirst!("first");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.isLoading).toBe(false);
      expect(state.values.data1).toBe("first");
      expect(state.values.data2).toBe("second");
      expect(state.values.data3).toBe("third");
    });
  });

  describe("type handling", () => {
    it("should handle different value types", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve(42));
        const [async2] = useAsync(() =>
          Promise.resolve({ id: 1, name: "test" })
        );
        const [async3] = useAsync(() => Promise.resolve([1, 2, 3]));
        const [async4] = useAsync(() => Promise.resolve(true));
        state = useSuspend({
          number: () => async1,
          object: () => async2,
          array: () => async3,
          boolean: () => async4,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.values.number).toBe(42);
      expect(state.values.object).toEqual({ id: 1, name: "test" });
      expect(state.values.array).toEqual([1, 2, 3]);
      expect(state.values.boolean).toBe(true);
    });

    it("should handle null and undefined values", async () => {
      let state: any;
      function Component() {
        const [async1] = useAsync(() => Promise.resolve(null));
        const [async2] = useAsync(() => Promise.resolve(undefined));
        state = useSuspend({
          nullValue: () => async1,
          undefinedValue: () => async2,
        });
        return () => <div>test</div>;
      }

      const container = document.createElement("div");
      render(<Component />, container);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(state.values.nullValue).toBeNull();
      expect(state.values.undefinedValue).toBeUndefined();
    });
  });
});

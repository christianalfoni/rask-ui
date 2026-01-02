import { describe, it, expect, vi } from "vitest";
import { useDerived, Derived } from "../useDerived";
import { useState } from "../useState";
import { render } from "../index";
import { reaction, Reaction } from "mobx";

describe("useDerived", () => {
  it("should compute values lazily", () => {
    const computeFn = vi.fn();
    let computed!: { doubled: number };

    function Component() {
      const state = useState({ count: 5 });
      computeFn.mockImplementation(() => state.count * 2);

      computed = useDerived({
        doubled: computeFn,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    // Should not compute until accessed
    expect(computeFn).not.toHaveBeenCalled();

    const result = computed.doubled;

    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(result).toBe(10);
  });

  it("should cache computed values", () => {
    const computeFn = vi.fn();
    let computed!: { doubled: number };

    function Component() {
      const state = useState({ count: 5 });
      computeFn.mockImplementation(() => state.count * 2);

      computed = useDerived({
        doubled: computeFn,
      });

      return () => <div>test {computed.doubled}</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    // Access multiple times
    computed.doubled;
    computed.doubled;
    computed.doubled;

    // Should only compute once due to caching
    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  it("should invalidate cache when dependencies change", async () => {
    const computeFn = vi.fn();
    let state!: { count: number };
    let computed!: { doubled: number };

    function Component() {
      state = useState({ count: 5 });
      computeFn.mockImplementation(() => state.count * 2);

      computed = useDerived({
        doubled: computeFn,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.doubled).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Change dependency
    state.count = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should recompute on next access
    expect(computed.doubled).toBe(20);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

  it("should handle multiple computed properties", async () => {
    let state!: { width: number; height: number };
    let computed!: { area: number; perimeter: number };

    function Component() {
      state = useState({ width: 10, height: 5 });

      computed = useDerived({
        area: () => state.width * state.height,
        perimeter: () => 2 * (state.width + state.height),
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.area).toBe(50);
    expect(computed.perimeter).toBe(30);

    state.width = 20;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.area).toBe(100);
    expect(computed.perimeter).toBe(50);
  });

  it("should support computed properties depending on other computed properties", async () => {
    let state!: { count: number };
    let computed!: { doubled: number; quadrupled: number };

    function Component() {
      state = useState({ count: 5 });

      computed = useDerived({
        doubled: () => state.count * 2,
        quadrupled: () => computed.doubled * 2,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.doubled).toBe(10);
    expect(computed.quadrupled).toBe(20);

    state.count = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.doubled).toBe(20);
    expect(computed.quadrupled).toBe(40);
  });

  it("should be reactive when observed", async () => {
    let state!: { count: number };
    let computed!: { doubled: number };

    function Component() {
      state = useState({ count: 5 });
      computed = useDerived({
        doubled: () => state.count * 2,
      });

      return () => <div>test {computed.doubled}</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    let observedValue: number | null = null;
    const disposeReaction = reaction(
      () => computed.doubled,
      () => {
        observedValue = computed.doubled;
      },
      { fireImmediately: true }
    );

    expect(observedValue).toBe(null);

    // Change state
    state.count = 10;

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(observedValue).toBe(20);

    disposeReaction();
  });

  it("should only recompute when actual dependencies change", () => {
    const computeFn = vi.fn();
    let state!: { a: number; b: number };
    let computed!: { result: number };

    function Component() {
      state = useState({ a: 1, b: 2 });
      computeFn.mockImplementation(() => state.a * 2);

      computed = useDerived({
        result: computeFn,
      });

      return () => <div>test {computed.result}</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.result).toBe(2);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Change unrelated property
    state.b = 100;

    // Should still return cached value
    expect(computed.result).toBe(2);
    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  it("should handle complex dependency chains", async () => {
    let state!: { items: number[]; multiplier: number };
    let computed!: {
      total: number;
      multipliedTotal: number;
      average: number;
    };

    function Component() {
      state = useState({
        items: [1, 2, 3, 4, 5],
        multiplier: 2,
      });

      computed = useDerived({
        total: () => state.items.reduce((sum, item) => sum + item, 0),
        multipliedTotal: () => computed.total * state.multiplier,
        average: () => computed.total / state.items.length,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.total).toBe(15);
    expect(computed.multipliedTotal).toBe(30);
    expect(computed.average).toBe(3);

    state.items.push(6);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.total).toBe(21);
    expect(computed.multipliedTotal).toBe(42);
    expect(computed.average).toBe(3.5);

    state.multiplier = 3;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.multipliedTotal).toBe(63);
  });

  it("should handle array operations", async () => {
    let state!: { items: number[] };
    let computed!: { sum: number; count: number };

    function Component() {
      state = useState({ items: [1, 2, 3] });

      computed = useDerived({
        sum: () => state.items.reduce((sum, item) => sum + item, 0),
        count: () => state.items.length,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.sum).toBe(6);
    expect(computed.count).toBe(3);

    state.items.push(4);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.sum).toBe(10);
    expect(computed.count).toBe(4);

    state.items.pop();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.sum).toBe(6);
    expect(computed.count).toBe(3);
  });

  it("should handle deeply nested state", async () => {
    let state!: { user: { profile: { name: string; age: number } } };
    let computed!: { displayName: string };

    function Component() {
      state = useState({
        user: {
          profile: {
            name: "Alice",
            age: 30,
          },
        },
      });

      computed = useDerived({
        displayName: () =>
          `${state.user.profile.name} (${state.user.profile.age})`,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.displayName).toBe("Alice (30)");

    state.user.profile.name = "Bob";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.displayName).toBe("Bob (30)");

    state.user.profile.age = 25;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(computed.displayName).toBe("Bob (25)");
  });

  it("should not recompute unnecessarily with nested computed", async () => {
    const innerFn = vi.fn();
    const outerFn = vi.fn();
    let state!: { count: number };
    let computed!: { inner: number; outer: number };

    function Component() {
      state = useState({ count: 5 });
      innerFn.mockImplementation(() => state.count * 2);
      outerFn.mockImplementation(() => computed.inner + 10);

      computed = useDerived({
        inner: innerFn,
        outer: outerFn,
      });

      return () => (
        <div>
          test {computed.inner} {computed.outer}
        </div>
      );
    }

    const container = document.createElement("div");
    render(<Component />, container);

    // Access outer (should compute both)
    expect(computed.outer).toBe(20);
    expect(innerFn).toHaveBeenCalledTimes(1);
    expect(outerFn).toHaveBeenCalledTimes(1);

    // Access outer again (should use cache)
    expect(computed.outer).toBe(20);
    expect(innerFn).toHaveBeenCalledTimes(1);
    expect(outerFn).toHaveBeenCalledTimes(1);

    // Change state
    state.count = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Access outer (should recompute both)
    expect(computed.outer).toBe(30);
    expect(innerFn).toHaveBeenCalledTimes(2);
    expect(outerFn).toHaveBeenCalledTimes(2);
  });

  it("should handle conditional dependencies", async () => {
    const computeFn = vi.fn();
    let state!: { useA: boolean; a: number; b: number };
    let computed!: { value: number };

    function Component() {
      state = useState({ useA: true, a: 10, b: 20 });
      computeFn.mockImplementation(() => (state.useA ? state.a : state.b));

      computed = useDerived({
        value: computeFn,
      });

      return () => <div>test {computed.value}</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(computed.value).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Change b (not currently tracked)
    state.b = 30;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(computed.value).toBe(10); // Should not recompute
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Change a (currently tracked)
    state.a = 15;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(computed.value).toBe(15); // Should recompute
    expect(computeFn).toHaveBeenCalledTimes(2);

    // Switch to using b
    state.useA = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(computed.value).toBe(30); // Should recompute and now track b
    expect(computeFn).toHaveBeenCalledTimes(3);

    // Change a (no longer tracked)
    state.a = 100;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(computed.value).toBe(30); // Should not recompute
    expect(computeFn).toHaveBeenCalledTimes(3);

    // Change b (now tracked)
    state.b = 40;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(computed.value).toBe(40); // Should recompute
    expect(computeFn).toHaveBeenCalledTimes(4);
  });

  it("should return consistent values during same synchronous execution", () => {
    let state!: { count: number };
    let computed!: { doubled: number };

    function Component() {
      state = useState({ count: 5 });

      computed = useDerived({
        doubled: () => state.count * 2,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    const first = computed.doubled;
    const second = computed.doubled;
    const third = computed.doubled;

    expect(first).toBe(10);
    expect(second).toBe(10);
    expect(third).toBe(10);
  });

  it("should handle empty computed object", () => {
    let computed!: {};

    function Component() {
      computed = useDerived({});

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(Object.keys(computed).length).toBe(0);
  });

  it("should properly track changes in computed used by observers", async () => {
    let state!: { x: number; y: number };
    let computed!: { sum: number };

    function Component() {
      state = useState({ x: 1, y: 2 });
      computed = useDerived({
        sum: () => state.x + state.y,
      });

      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    const results: number[] = [];
    const disposeReaction = reaction(
      () => computed.sum,
      () => {
        results.push(computed.sum);
      },
      {
        fireImmediately: true,
      }
    );

    state.x = 10;
    await new Promise((resolve) => setTimeout(resolve, 0));

    state.y = 20;
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(results).toEqual([12, 30]);

    disposeReaction;
  });

  it("should recompute when parent props change", async () => {
    let parentState!: { filter: string };
    let childComputed!: { currentFilter: string };
    let computeFn = vi.fn();
    let renderCount = 0;

    function Child(props: { filter: string }) {
      computeFn.mockImplementation(() => props.filter || "all");

      childComputed = useDerived({
        currentFilter: computeFn,
      });

      return () => {
        renderCount++;
        return <div>{childComputed.currentFilter}</div>;
      };
    }

    function Parent() {
      parentState = useState({ filter: "active" });

      return () => <Child filter={parentState.filter} />;
    }

    const container = document.createElement("div");
    render(<Parent />, container);

    // Initial render
    expect(renderCount).toBe(1);
    expect(childComputed.currentFilter).toBe("active");
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Change parent prop
    parentState.filter = "completed";
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should recompute with new prop value and child should only render once
    expect(renderCount).toBe(2);
    expect(childComputed.currentFilter).toBe("completed");
    expect(computeFn).toHaveBeenCalledTimes(2);

    // Change again
    parentState.filter = "all";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renderCount).toBe(3);
    expect(childComputed.currentFilter).toBe("all");
    expect(computeFn).toHaveBeenCalledTimes(3);
  });
});

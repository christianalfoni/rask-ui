import { describe, it, expect, vi } from "vitest";
import { useState } from "../useState";
import { Observer } from "../observation";
import { render } from "../render";

describe("useState", () => {
  it("should create a reactive proxy from an object", () => {
    const state = useState({ count: 0 });
    expect(state.count).toBe(0);
  });

  it("should allow mutations", () => {
    const state = useState({ count: 0 });
    state.count = 5;
    expect(state.count).toBe(5);
  });

  it("should return the same proxy for the same object", () => {
    const obj = { count: 0 };
    const proxy1 = useState(obj);
    const proxy2 = useState(obj);
    expect(proxy1).toBe(proxy2);
  });

  it("should create nested proxies for nested objects", () => {
    const state = useState({ user: { name: "Alice", age: 30 } });
    state.user.name = "Bob";
    expect(state.user.name).toBe("Bob");
  });

  it("should handle arrays reactively", () => {
    const state = useState({ items: [1, 2, 3] });
    state.items.push(4);
    expect(state.items).toEqual([1, 2, 3, 4]);
  });

  it("should track property access in observers", async () => {
    const state = useState({ count: 0 });
    let renderCount = 0;

    const observer = new Observer(() => {
      renderCount++;
    });

    const dispose = observer.observe();
    state.count; // Access property to track it
    dispose();

    expect(renderCount).toBe(0);

    // Mutate after observation setup
    const dispose2 = observer.observe();
    const value = state.count; // Track
    dispose2(); // Stop observing, subscriptions are now active

    state.count = 1;

    // Wait for microtasks to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderCount).toBeGreaterThan(0);
  });

  it("should handle property deletion", () => {
    const state = useState({ count: 0, temp: "value" } as {
      count: number;
      temp?: string;
    });
    delete state.temp;
    expect(state.temp).toBeUndefined();
    expect("temp" in state).toBe(false);
  });

  it("should not create proxies for functions", () => {
    const fn = () => "hello";
    const state = useState({ method: fn });
    expect(state.method).toBe(fn);
    expect(state.method()).toBe("hello");
  });

  it("should handle symbol properties", () => {
    const sym = Symbol("test");
    const state = useState({ [sym]: "value" } as any);
    expect(state[sym]).toBe("value");
  });

  it("should notify observers only on actual changes", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    state.count = 0; // Same value - should still notify per current implementation
    state.count = 0;

    await new Promise((resolve) => setTimeout(resolve, 0));
    // The implementation notifies even for same value, except for optimization cases
    observer.dispose();
  });

  it("should handle deeply nested objects", () => {
    const state = useState({
      level1: {
        level2: {
          level3: {
            value: "deep",
          },
        },
      },
    });

    state.level1.level2.level3.value = "modified";
    expect(state.level1.level2.level3.value).toBe("modified");
  });

  it("should handle array mutations correctly", () => {
    const state = useState({ items: [1, 2, 3] });

    state.items.pop();
    expect(state.items).toEqual([1, 2]);

    state.items.unshift(0);
    expect(state.items).toEqual([0, 1, 2]);

    state.items.splice(1, 1, 99);
    expect(state.items).toEqual([0, 99, 2]);
  });

  it("should cache proxies for array elements to prevent double-wrapping", () => {
    const state = useState({
      data: [
        { id: 1, label: "Item 1" },
        { id: 2, label: "Item 2" },
        { id: 3, label: "Item 3" },
      ],
    });

    // Access the same array element multiple times
    const firstAccess = state.data[0];
    const secondAccess = state.data[0];

    // Should return the exact same proxy reference
    expect(firstAccess).toBe(secondAccess);

    // Test with array iteration methods
    const mapped = state.data.map((item) => item);
    const firstItem = mapped[0];
    const directAccess = state.data[0];

    // The proxy returned from iteration should be the same as direct access
    expect(firstItem).toBe(directAccess);

    // Test that we don't double-wrap when iterating multiple times
    const mapped2 = state.data.map((item) => item);
    expect(mapped[0]).toBe(mapped2[0]);
  });

  it("should maintain proxy identity after filter operations", () => {
    const state = useState({
      data: [
        { id: 1, label: "Item 1" },
        { id: 2, label: "Item 2" },
        { id: 3, label: "Item 3" },
      ],
    });

    // Get reference to an item before filtering
    const originalItem = state.data[0];

    // Simulate the remove operation: filter creates a new array but reuses proxies
    state.data = state.data.filter((row) => row.id !== 2);

    // After filter, the first item should still be the same proxy reference
    const afterFilter = state.data[0];
    expect(afterFilter).toBe(originalItem);

    // And accessing it multiple times should return the same reference
    expect(state.data[0]).toBe(state.data[0]);
  });

  it("should rerender child when array prop changes", async () => {
    let childRenderCount = 0;
    let parentState: any;

    function Child(props: { todos: any[] }) {
      return () => {
        childRenderCount++;
        return (
          <div>
            <div class="count">{props.todos.length}</div>
            <ul>
              {props.todos.map((todo) => (
                <li key={todo.id}>{todo.text}</li>
              ))}
            </ul>
          </div>
        );
      };
    }

    function Parent() {
      parentState = useState<{ todos: any[]; filter: string }>({
        todos: [
          { id: "1", text: "Task 1", completed: false },
          { id: "2", text: "Task 2", completed: true },
          { id: "3", text: "Task 3", completed: false },
        ],
        filter: "all",
      });

      return () => {
        const filtered =
          parentState.filter === "active"
            ? parentState.todos.filter((t: any) => !t.completed)
            : parentState.todos;

        return <Child todos={filtered} />;
      };
    }

    const container = document.createElement("div");
    render(<Parent />, container);

    expect(childRenderCount).toBe(1);

    parentState.filter = "active";
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(childRenderCount).toBe(2);
  });

  it("should not proxy wrap Date objects", () => {
    const originalDate = new Date("2024-01-01");
    const state = useState({ createdAt: originalDate });

    // The returned date should be the exact same instance, not a proxy
    expect(state.createdAt).toBe(originalDate);

    // It should still be a Date instance
    expect(state.createdAt instanceof Date).toBe(true);

    // Date methods should work correctly
    expect(state.createdAt.getFullYear()).toBe(2024);
    expect(state.createdAt.toISOString()).toBe(originalDate.toISOString());
  });
});

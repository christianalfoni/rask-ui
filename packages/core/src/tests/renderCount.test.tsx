import { describe, it, expect } from "vitest";
import { useState } from "../useState";
import { render } from "../";

describe("Child render count test", () => {
  it("should track how many times Child renders when count changes", async () => {
    let childRenderCount = 0;
    let state!: { count: 0 };
    function Child(props: { state: any; count: number }) {
      return () => {
        childRenderCount++;
        return (
          <div>
            State count: {props.state.count}, Props count: {props.count}
          </div>
        );
      };
    }

    function MyComp() {
      state = useState({
        count: 0,
      });

      return () => (
        <div>
          <Child state={state} count={state.count} />
        </div>
      );
    }

    const container = document.createElement("div");
    render(<MyComp />, container);

    // Initial render
    expect(childRenderCount).toBe(1);
    expect(container.textContent).toBe("State count: 0, Props count: 0");

    // Simulate click to increment count
    state.count++;
    await new Promise((resolve) => setTimeout(resolve, 10));

    // After first increment
    expect(childRenderCount).toBe(2);
    expect(container.textContent).toBe("State count: 1, Props count: 1");

    state.count++;

    await new Promise((resolve) => setTimeout(resolve, 10));

    // After second increment
    expect(childRenderCount).toBe(3);
    expect(container.textContent).toBe("State count: 2, Props count: 2");
  });

  it("should show Child renders only once when only state prop changes", async () => {
    let childRenderCount = 0;
    let state!: { count: 0 };

    function Child(props: { state: any }) {
      childRenderCount++;
      return () => <div>State count: {props.state.count}</div>;
    }

    function MyComp() {
      state = useState({
        count: 0,
      });

      return () => (
        <div>
          <Child state={state} />
        </div>
      );
    }

    const container = document.createElement("div");
    render(<MyComp />, container);

    // Initial render
    expect(childRenderCount).toBe(1);
    expect(container.textContent).toBe("State count: 0");

    // Simulate click to increment count
    state.count++;

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Child shouldn't re-render because state object reference didn't change
    expect(childRenderCount).toBe(1);
    expect(container.textContent).toBe("State count: 1");
  });

  it("should show Child renders when primitive prop changes", async () => {
    let childRenderCount = 0;
    let state!: { count: 0 };

    function Child(props: { count: number }) {
      return () => {
        childRenderCount++;
        return <div>Props count: {props.count}</div>;
      };
    }

    function MyComp() {
      state = useState({
        count: 0,
      });

      return () => (
        <div>
          <Child count={state.count} />
        </div>
      );
    }

    const container = document.createElement("div");
    render(<MyComp />, container);

    // Initial render
    expect(childRenderCount).toBe(1);
    expect(container.textContent).toBe("Props count: 0");

    // Simulate click to increment count
    state.count++;

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Child re-renders because count prop changed
    expect(childRenderCount).toBe(2);
    expect(container.textContent).toBe("Props count: 1");

    // Another click
    state.count++;

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(childRenderCount).toBe(3);
    expect(container.textContent).toBe("Props count: 2");
  });
});

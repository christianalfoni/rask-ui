import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("Component Counter", () => {
  it("should render a simple counter", () => {
    const container = document.createElement("div");

    const MyComponent = () => {
      const state = createState({ count: 0 });

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe("Counter 0");
  });

  it("should update counter text when state changes", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children[0].textContent).toBe("Counter 0");

    // Update the counter
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    expect(container.children[0].textContent).toBe("Counter 1");
  });

  it("should handle multiple counter increments", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () => jsx("h1", { children: `Counter ${state.count}` });
    };

    render(jsx(MyComponent, {}), container);

    // Multiple increments
    stateFn!.count++;
    stateFn!.count++;
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    expect(container.children[0].textContent).toBe("Counter 3");
  });

  it("should handle counter with click handler", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("h1", {
          children: `Counter ${state.count}`,
          onClick: () => state.count++,
        });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children[0].textContent).toBe("Counter 0");

    // Simulate state change (like a click would do)
    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    expect(container.children[0].textContent).toBe("Counter 1");
  });

  it("should handle counter in a div wrapper", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("div", {
          children: jsx("h1", { children: `Counter ${state.count}` }),
        });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count++;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    expect(container.children[0].querySelector("h1")?.textContent).toBe(
      "Counter 1"
    );
  });

  it("should handle template literal with interpolated count", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("h1", {
          children: `Hello World (${state.count})`,
        });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count = 5;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    expect(container.children[0].textContent).toBe("Hello World (5)");
  });

  it("should handle counter with nested elements", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;

      return () =>
        jsx("div", {
          children: [
            jsx("h1", { children: "Title" }),
            jsx("p", { children: `Count: ${state.count}` }),
          ],
        });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count = 42;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Validate the container
    const div = container.children[0];
    expect(div.querySelector("h1")?.textContent).toBe("Title");
    expect(div.querySelector("p")?.textContent).toBe("Count: 42");
  });
});

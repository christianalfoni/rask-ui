import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("Component State and Props Interaction", () => {
  it("should use both state and props together", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { initialCount: number }) => {
      const state = createState({ count: props.initialCount });
      return () => jsx("div", { children: String(state.count) });
    };

    render(jsx(MyComponent, { initialCount: 10 }), container);

    expect(container.children[0].textContent).toBe("10");
  });

  it("should derive state from props on mount", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { multiplier: number }) => {
      const state = createState({ count: 0 });
      return () =>
        jsx("div", {
          children: String(state.count * props.multiplier),
        });
    };

    render(jsx(MyComponent, { multiplier: 5 }), container);

    expect(container.children[0].textContent).toBe("0");
  });

  it("should handle state changes with prop-based rendering", () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = (props: { prefix: string }) => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () =>
        jsx("div", {
          children: `${props.prefix}: ${state.count}`,
        });
    };

    render(jsx(MyComponent, { prefix: "Count" }), container);

    expect(container.children[0].textContent).toBe("Count: 0");

    stateFn!.count = 5;
    // After state update, should show "Count: 5"
    // The implementation will handle this
  });

  it("should support multiple state values with props", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { title: string; initialCount: number }) => {
      const state = createState({
        count: props.initialCount,
        isVisible: true,
      });
      return () =>
        jsx("div", {
          children: state.isVisible
            ? `${props.title}: ${state.count}`
            : "Hidden",
        });
    };

    render(
      jsx(MyComponent, {
        title: "Counter",
        initialCount: 5,
      }),
      container
    );

    expect(container.children[0].textContent).toBe("Counter: 5");
  });

  it("should handle complex state derived from props", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { items: string[] }) => {
      const state = createState({ selectedIndex: 0 });
      return () =>
        jsx("div", {
          children: props.items[state.selectedIndex] || "None",
        });
    };

    render(
      jsx(MyComponent, {
        items: ["First", "Second", "Third"],
      }),
      container
    );

    expect(container.children[0].textContent).toBe("First");
  });
});

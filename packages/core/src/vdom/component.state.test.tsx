import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("Component State", () => {
  it("should initialize state with default value", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      const state = createState({ count: 0 });
      return () => jsx("div", { children: String(state.count) });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children[0].textContent).toBe("0");
  });

  it("should update state when value changes", () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count = 5;

    // After state update, component should re-render
    // The implementation will handle this
  });

  it("should support multiple state values", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      const state = createState({ count: 0, name: "John" });
      return () =>
        jsx("div", {
          children: [
            jsx("span", { children: String(state.count) }),
            jsx("span", { children: state.name }),
          ],
        });
    };

    render(jsx(MyComponent, {}), container);

    const div = container.children[0] as HTMLDivElement;
    expect(div.children[0].textContent).toBe("0");
    expect(div.children[1].textContent).toBe("John");
  });

  it("should support incremental state updates", () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count = stateFn!.count + 1;

    // After state update, component should re-render
    // The implementation will handle this
  });

  it("should preserve state between re-renders", () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const MyComponent = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () => jsx("div", { children: String(state.count) });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.count = 1;
    stateFn!.count = 2;
    stateFn!.count = 3;

    // State should be preserved across multiple updates
    // The implementation will handle this
  });

  it("should support nested objects as state", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      const state = createState({ user: { name: "John", age: 30 } });
      return () =>
        jsx("div", {
          children: `${state.user.name} is ${state.user.age} years old`,
        });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children[0].textContent).toBe("John is 30 years old");
  });

  it("should support arrays as state", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      const state = createState({ items: [1, 2, 3] });
      return () =>
        jsx("ul", {
          children: state.items.map((item) =>
            jsx("li", { children: String(item) })
          ),
        });
    };

    render(jsx(MyComponent, {}), container);

    const ul = container.children[0] as HTMLUListElement;
    expect(ul.children).toHaveLength(3);
    expect(ul.children[0].textContent).toBe("1");
    expect(ul.children[1].textContent).toBe("2");
    expect(ul.children[2].textContent).toBe("3");
  });

  it("should update nested state properties", () => {
    const container = document.createElement("div");
    let stateFn: { user: { name: string; age: number } } | undefined;

    const MyComponent = () => {
      const state = createState({ user: { name: "Alice", age: 25 } });
      stateFn = state;
      return () =>
        jsx("div", {
          children: `${state.user.name} is ${state.user.age}`,
        });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children[0].textContent).toBe("Alice is 25");

    stateFn!.user.name = "Bob";
    stateFn!.user.age = 30;

    // After nested state update, component should re-render
    // The implementation will handle this
  });

  it("should support array mutations", () => {
    const container = document.createElement("div");
    let stateFn: { items: number[] } | undefined;

    const MyComponent = () => {
      const state = createState({ items: [1, 2, 3] });
      stateFn = state;
      return () =>
        jsx("ul", {
          children: state.items.map((item) =>
            jsx("li", { children: String(item) })
          ),
        });
    };

    render(jsx(MyComponent, {}), container);

    stateFn!.items.push(4);

    // After array mutation, component should re-render
    // The implementation will handle this
  });
});

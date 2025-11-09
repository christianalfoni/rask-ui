import { describe, it, expect, vi } from "vitest";
import { jsx, render } from "./index";

describe("VDOM Mount", () => {
  it("should render a single element to the DOM", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create a vnode using jsx
    const vnode = jsx("div", { id: "test" });

    // Render the vnode to the container
    render(vnode, container);

    // Assert that the element was created and appended
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("DIV");
  });

  it("should render an element with multiple children", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create child vnodes
    const child1 = jsx("span", { id: "child1" });
    const child2 = jsx("span", { id: "child2" });
    const child3 = jsx("div", { id: "child3" });

    // Create parent vnode with children
    const parentVNode = jsx("div", {
      id: "parent",
      children: [child1, child2, child3],
    });

    // Render the parent vnode
    render(parentVNode, container);

    // Verify parent was rendered
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("DIV");

    // Verify children were rendered
    const parent = container.children[0];
    expect(parent.children.length).toBe(3);
    expect(parent.children[0].tagName).toBe("SPAN");
    expect(parent.children[1].tagName).toBe("SPAN");
    expect(parent.children[2].tagName).toBe("DIV");
  });

  it("should render element with data and aria attributes", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with data and aria attributes
    const vnode = jsx("div", {
      "data-testid": "test-component",
      "data-value": "123",
      "aria-label": "Test element",
      "aria-hidden": "true",
    });

    // Render the vnode
    render(vnode, container);

    // Verify attributes were set
    const div = container.children[0] as HTMLElement;
    expect(div.getAttribute("data-testid")).toBe("test-component");
    expect(div.getAttribute("data-value")).toBe("123");
    expect(div.getAttribute("aria-label")).toBe("Test element");
    expect(div.getAttribute("aria-hidden")).toBe("true");
  });

  it("should render element with properties", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with properties
    const vnode = jsx("div", {
      className: "test-class",
      textContent: "Hello World",
    });

    // Render the vnode
    render(vnode, container);

    // Verify properties were set
    const div = container.children[0] as HTMLElement;
    expect(div.className).toBe("test-class");
    expect(div.textContent).toBe("Hello World");
  });

  it("should render element with event listener", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create mock click handler
    const handleClick = vi.fn();

    // Create vnode with event listener
    const vnode = jsx("button", {
      onClick: handleClick,
    });

    // Render the vnode
    render(vnode, container);

    // Get the button element
    const button = container.children[0] as HTMLButtonElement;

    // Trigger click event
    button.click();

    // Verify event handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

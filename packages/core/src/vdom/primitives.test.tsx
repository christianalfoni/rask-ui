import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";

describe("VDOM Primitives", () => {
  it("should render element with string child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with string child
    const vnode = jsx("div", {
      children: "Hello World",
    });

    // Render the vnode
    render(vnode, container);

    // Verify string was rendered as text content
    const div = container.children[0] as HTMLElement;
    expect(div.textContent).toBe("Hello World");
    expect(div.childNodes.length).toBe(1);
    expect(div.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });

  it("should render element with number child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with number child
    const vnode = jsx("span", {
      children: 42,
    });

    // Render the vnode
    render(vnode, container);

    // Verify number was rendered as text content
    const span = container.children[0] as HTMLElement;
    expect(span.textContent).toBe("42");
    expect(span.childNodes.length).toBe(1);
    expect(span.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });

  it("should render element with null child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with null child
    const vnode = jsx("div", {
      children: null,
    });

    // Render the vnode
    render(vnode, container);

    // Verify null renders as empty
    const div = container.children[0] as HTMLElement;
    expect(div.childNodes.length).toBe(0);
  });

  it("should render element with undefined child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with undefined child
    const vnode = jsx("div", {
      children: undefined,
    });

    // Render the vnode
    render(vnode, container);

    // Verify undefined renders as empty
    const div = container.children[0] as HTMLElement;
    expect(div.childNodes.length).toBe(0);
  });

  it("should render element with mixed children including primitives", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with mixed children
    const vnode = jsx("div", {
      children: [
        "Text before",
        jsx("span", { textContent: "middle" }),
        "Text after",
        42,
        null,
        jsx("div", { textContent: "end" }),
      ],
    });

    // Render the vnode
    render(vnode, container);

    // Verify mixed children were rendered correctly
    const div = container.children[0] as HTMLElement;
    // Should have: text node, span, text node, text node (42), div
    // null should be skipped
    expect(div.childNodes.length).toBe(5);
    expect(div.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(div.childNodes[0].textContent).toBe("Text before");
    expect((div.childNodes[1] as HTMLElement).tagName).toBe("SPAN");
    expect(div.childNodes[2].textContent).toBe("Text after");
    expect(div.childNodes[3].textContent).toBe("42");
    expect((div.childNodes[4] as HTMLElement).tagName).toBe("DIV");
  });

  it("should render element with boolean children", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with boolean children
    const vnode = jsx("div", {
      children: [true, false, "visible"],
    });

    // Render the vnode
    render(vnode, container);

    // Verify booleans render as empty (like React)
    const div = container.children[0] as HTMLElement;
    // Should only have the text node "visible", booleans should be skipped
    expect(div.childNodes.length).toBe(1);
    expect(div.childNodes[0].textContent).toBe("visible");
  });

  it("should render element with zero as child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with zero as child (should render, not be treated as falsy)
    const vnode = jsx("div", {
      children: 0,
    });

    // Render the vnode
    render(vnode, container);

    // Verify zero is rendered
    const div = container.children[0] as HTMLElement;
    expect(div.textContent).toBe("0");
    expect(div.childNodes.length).toBe(1);
  });

  it("should render element with empty string as child", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create vnode with empty string as child
    const vnode = jsx("div", {
      children: "",
    });

    // Render the vnode
    render(vnode, container);

    // Verify empty string renders as empty text node
    const div = container.children[0] as HTMLElement;
    expect(div.textContent).toBe("");
    expect(div.childNodes.length).toBe(1);
    expect(div.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
  });
});

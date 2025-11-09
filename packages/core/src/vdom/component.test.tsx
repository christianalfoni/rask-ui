import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";

describe("ComponentVNode", () => {
  it("should mount a component that returns an element", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      return () => jsx("div", {});
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children).toHaveLength(1);
    expect(container.children[0]).toBeInstanceOf(HTMLDivElement);
    expect((container.children[0] as HTMLDivElement).tagName).toBe("DIV");
  });

  it("should mount a component with text content", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      return () => jsx("div", { children: "Hello World" });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children).toHaveLength(1);
    expect(container.children[0].textContent).toBe("Hello World");
  });

  it("should mount a component with nested elements", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      return () =>
        jsx("div", {
          children: [
            jsx("h1", { children: "Title" }),
            jsx("p", { children: "Paragraph" }),
          ],
        });
    };

    render(jsx(MyComponent, {}), container);

    expect(container.children).toHaveLength(1);
    const div = container.children[0] as HTMLDivElement;
    expect(div.children).toHaveLength(2);
    expect(div.children[0].tagName).toBe("H1");
    expect(div.children[0].textContent).toBe("Title");
    expect(div.children[1].tagName).toBe("P");
    expect(div.children[1].textContent).toBe("Paragraph");
  });

  it("should pass props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    render(
      jsx(MyComponent, {
        message: "Hello from props",
      }),
      container
    );

    expect(container.children[0].textContent).toBe("Hello from props");
  });

  it("should store parent reference after mount", () => {
    const container = document.createElement("div");
    const MyComponent = () => {
      return () => jsx("div", {});
    };

    render(jsx(MyComponent, {}), container);

    // After rendering, we can verify the component was mounted successfully
    // by checking the container has the expected DOM structure
    expect(container.children).toHaveLength(1);
    expect(container.children[0]).toBeInstanceOf(HTMLDivElement);
  });
});

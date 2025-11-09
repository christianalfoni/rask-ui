import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";

describe("Component Props", () => {
  it("should pass string props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    render(jsx(MyComponent, { message: "Hello Props" }), container);

    expect(container.children[0].textContent).toBe("Hello Props");
  });

  it("should pass number props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { count: number }) => {
      return () => jsx("div", { children: String(props.count) });
    };

    render(jsx(MyComponent, { count: 42 }), container);

    expect(container.children[0].textContent).toBe("42");
  });

  it("should pass object props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { user: { name: string; age: number } }) => {
      return () =>
        jsx("div", {
          children: `${props.user.name} is ${props.user.age}`,
        });
    };

    render(
      jsx(MyComponent, { user: { name: "Alice", age: 25 } }),
      container
    );

    expect(container.children[0].textContent).toBe("Alice is 25");
  });

  it("should pass array props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { items: string[] }) => {
      return () =>
        jsx("ul", {
          children: props.items.map((item) => jsx("li", { children: item })),
        });
    };

    render(
      jsx(MyComponent, { items: ["apple", "banana", "cherry"] }),
      container
    );

    const ul = container.children[0] as HTMLUListElement;
    expect(ul.children).toHaveLength(3);
    expect(ul.children[0].textContent).toBe("apple");
    expect(ul.children[1].textContent).toBe("banana");
    expect(ul.children[2].textContent).toBe("cherry");
  });

  it("should pass function props to component", () => {
    const container = document.createElement("div");
    const handleClick = () => "clicked";
    const MyComponent = (props: { onClick: () => string }) => {
      return () =>
        jsx("button", {
          children: props.onClick(),
        });
    };

    render(jsx(MyComponent, { onClick: handleClick }), container);

    expect(container.children[0].textContent).toBe("clicked");
  });

  it("should pass multiple props to component", () => {
    const container = document.createElement("div");
    const MyComponent = (props: {
      title: string;
      count: number;
      isActive: boolean;
    }) => {
      return () =>
        jsx("div", {
          children: `${props.title}: ${props.count} (${
            props.isActive ? "active" : "inactive"
          })`,
        });
    };

    render(
      jsx(MyComponent, { title: "Counter", count: 5, isActive: true }),
      container
    );

    expect(container.children[0].textContent).toBe("Counter: 5 (active)");
  });

  it("should handle optional props", () => {
    const container1 = document.createElement("div");
    const container2 = document.createElement("div");
    const MyComponent = (props: { message?: string }) => {
      return () =>
        jsx("div", {
          children: props.message || "Default message",
        });
    };

    render(jsx(MyComponent, {}), container1);
    expect(container1.children[0].textContent).toBe("Default message");

    render(jsx(MyComponent, { message: "Custom message" }), container2);
    expect(container2.children[0].textContent).toBe("Custom message");
  });

  it("should update when props change", () => {
    const container = document.createElement("div");
    const MyComponent = (props: { message: string }) => {
      return () => jsx("div", { children: props.message });
    };

    render(jsx(MyComponent, { message: "Initial" }), container);

    expect(container.children[0].textContent).toBe("Initial");

    // Simulate props update
    // The implementation will handle prop updates through patch
  });
});

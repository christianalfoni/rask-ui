import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("Class Property Support", () => {
  it("should map string class to className", () => {
    const container = document.createElement("div");

    render(jsx("div", { class: "test-class" }), container);

    const div = container.querySelector("div");
    expect(div?.className).toBe("test-class");
  });

  it("should handle multiple classes as string", () => {
    const container = document.createElement("div");

    render(jsx("div", { class: "class-1 class-2 class-3" }), container);

    const div = container.querySelector("div");
    expect(div?.className).toBe("class-1 class-2 class-3");
  });

  it("should handle object notation with true values", () => {
    const container = document.createElement("div");

    render(
      jsx("div", {
        class: {
          "active": true,
          "visible": true,
          "hidden": false,
        },
      }),
      container
    );

    const div = container.querySelector("div");
    expect(div?.classList.contains("active")).toBe(true);
    expect(div?.classList.contains("visible")).toBe(true);
    expect(div?.classList.contains("hidden")).toBe(false);
  });

  it("should handle mixed object notation", () => {
    const container = document.createElement("div");

    render(
      jsx("div", {
        class: {
          "class-1": true,
          "class-2": false,
          "class-3": true,
          "class-4": false,
        },
      }),
      container
    );

    const div = container.querySelector("div");
    expect(div?.className).toBe("class-1 class-3");
  });

  it("should handle empty object notation", () => {
    const container = document.createElement("div");

    render(jsx("div", { class: {} }), container);

    const div = container.querySelector("div");
    expect(div?.className).toBe("");
  });

  it("should handle all false object notation", () => {
    const container = document.createElement("div");

    render(
      jsx("div", {
        class: {
          "class-1": false,
          "class-2": false,
        },
      }),
      container
    );

    const div = container.querySelector("div");
    expect(div?.className).toBe("");
  });

  it("should update classes when object notation changes", async () => {
    const container = document.createElement("div");
    let stateFn: { isActive: boolean; isVisible: boolean } | undefined;

    const App = () => {
      const state = createState({ isActive: true, isVisible: false });
      stateFn = state;

      return () =>
        jsx("div", {
          class: {
            active: state.isActive,
            visible: state.isVisible,
          },
        });
    };

    render(jsx(App, {}), container);

    const div = container.querySelector("div");
    expect(div?.classList.contains("active")).toBe(true);
    expect(div?.classList.contains("visible")).toBe(false);

    stateFn!.isActive = false;
    stateFn!.isVisible = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(div?.classList.contains("active")).toBe(false);
    expect(div?.classList.contains("visible")).toBe(true);
  });

  it("should handle hyphenated class names in object notation", () => {
    const container = document.createElement("div");

    render(
      jsx("div", {
        class: {
          "my-custom-class": true,
          "another-class-name": true,
          "disabled-class": false,
        },
      }),
      container
    );

    const div = container.querySelector("div");
    expect(div?.classList.contains("my-custom-class")).toBe(true);
    expect(div?.classList.contains("another-class-name")).toBe(true);
    expect(div?.classList.contains("disabled-class")).toBe(false);
  });

  it("should prefer class over className when both provided", () => {
    const container = document.createElement("div");

    render(jsx("div", { class: "from-class", className: "from-className" }), container);

    const div = container.querySelector("div");
    // class should take precedence
    expect(div?.className).toBe("from-class");
  });

  it("should work with nested components", () => {
    const container = document.createElement("div");

    const Child = () => {
      return () => jsx("span", { class: "child-class" });
    };

    const Parent = () => {
      return () =>
        jsx("div", {
          class: "parent-class",
          children: jsx(Child, {}),
        });
    };

    render(jsx(Parent, {}), container);

    const parentDiv = container.querySelector("div");
    const childSpan = container.querySelector("span");

    expect(parentDiv?.className).toBe("parent-class");
    expect(childSpan?.className).toBe("child-class");
  });

  it("should handle undefined and null class values", () => {
    const container = document.createElement("div");

    render(jsx("div", { class: undefined }), container);

    const div = container.querySelector("div");
    expect(div?.className).toBe("");
  });

  it("should handle dynamic string class updates", async () => {
    const container = document.createElement("div");
    let stateFn: { className: string } | undefined;

    const App = () => {
      const state = createState({ className: "initial" });
      stateFn = state;

      return () => jsx("div", { class: state.className });
    };

    render(jsx(App, {}), container);

    const div = container.querySelector("div");
    expect(div?.className).toBe("initial");

    stateFn!.className = "updated";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(div?.className).toBe("updated");
  });
});

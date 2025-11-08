import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";
import { Fragment } from "./FragmentVNode";

describe("VDOM Fragments", () => {
  describe("Mounting", () => {
    it("should mount a simple fragment with multiple children", () => {
      const container = document.createElement("div");

      const vnode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["First"] }),
          jsx("span", { children: ["Second"] }),
          jsx("span", { children: ["Third"] }),
        ],
      });

      render(vnode, container);

      expect(container.children.length).toBe(3);
      expect(container.children[0].tagName).toBe("SPAN");
      expect(container.children[0].textContent).toBe("First");
      expect(container.children[1].tagName).toBe("SPAN");
      expect(container.children[1].textContent).toBe("Second");
      expect(container.children[2].tagName).toBe("SPAN");
      expect(container.children[2].textContent).toBe("Third");
    });

    it("should mount fragment inside an element", () => {
      const container = document.createElement("div");

      const vnode = jsx("div", {
        className: "wrapper",
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["A"] }),
              jsx("span", { children: ["B"] }),
            ],
          }),
        ],
      });

      render(vnode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.className).toBe("wrapper");
      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("A");
      expect(wrapper.children[1].textContent).toBe("B");
    });

    it("should mount nested fragments", () => {
      const container = document.createElement("div");

      const vnode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["Before"] }),
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["Nested 1"] }),
              jsx("span", { children: ["Nested 2"] }),
            ],
          }),
          jsx("span", { children: ["After"] }),
        ],
      });

      render(vnode, container);

      expect(container.children.length).toBe(4);
      expect(container.children[0].textContent).toBe("Before");
      expect(container.children[1].textContent).toBe("Nested 1");
      expect(container.children[2].textContent).toBe("Nested 2");
      expect(container.children[3].textContent).toBe("After");
    });

    it("should mount deeply nested fragments", () => {
      const container = document.createElement("div");

      const vnode = jsx(Fragment, {
        children: [
          jsx(Fragment, {
            children: [
              jsx(Fragment, {
                children: [
                  jsx("span", { children: ["Deep 1"] }),
                  jsx("span", { children: ["Deep 2"] }),
                ],
              }),
              jsx("span", { children: ["Middle"] }),
            ],
          }),
          jsx("span", { children: ["Outer"] }),
        ],
      });

      render(vnode, container);

      expect(container.children.length).toBe(4);
      expect(container.children[0].textContent).toBe("Deep 1");
      expect(container.children[1].textContent).toBe("Deep 2");
      expect(container.children[2].textContent).toBe("Middle");
      expect(container.children[3].textContent).toBe("Outer");
    });

    it("should mount fragment with mixed element types", () => {
      const container = document.createElement("div");

      const vnode = jsx(Fragment, {
        children: [
          jsx("div", { children: ["Div"] }),
          jsx("span", { children: ["Span"] }),
          jsx("button", { children: ["Button"] }),
        ],
      });

      render(vnode, container);

      expect(container.children.length).toBe(3);
      expect(container.children[0].tagName).toBe("DIV");
      expect(container.children[1].tagName).toBe("SPAN");
      expect(container.children[2].tagName).toBe("BUTTON");
    });
  });

  describe("Patching", () => {
    it("should patch fragment by adding children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [jsx("span", { children: ["First"] })],
      });

      render(oldVNode, container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("First");

      const newVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["First"] }),
          jsx("span", { children: ["Second"] }),
          jsx("span", { children: ["Third"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe("First");
      expect(container.children[1].textContent).toBe("Second");
      expect(container.children[2].textContent).toBe("Third");
    });

    it("should patch fragment by removing children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["First"] }),
          jsx("span", { children: ["Second"] }),
          jsx("span", { children: ["Third"] }),
        ],
      });

      render(oldVNode, container);

      expect(container.children.length).toBe(3);

      const newVNode = jsx(Fragment, {
        children: [jsx("span", { children: ["First"] })],
      });

      newVNode.patch(oldVNode);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("First");
    });

    it("should patch fragment by replacing children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["Old 1"] }),
          jsx("span", { children: ["Old 2"] }),
        ],
      });

      render(oldVNode, container);

      const newVNode = jsx(Fragment, {
        children: [
          jsx("div", { children: ["New 1"] }),
          jsx("div", { children: ["New 2"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(container.children.length).toBe(2);
      expect(container.children[0].tagName).toBe("DIV");
      expect(container.children[0].textContent).toBe("New 1");
      expect(container.children[1].tagName).toBe("DIV");
      expect(container.children[1].textContent).toBe("New 2");
    });

    it("should patch fragment inside an element", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["A"] }),
              jsx("span", { children: ["B"] }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      const newVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["A"] }),
              jsx("span", { children: ["B"] }),
              jsx("span", { children: ["C"] }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(3);
      expect(wrapper.children[0].textContent).toBe("A");
      expect(wrapper.children[1].textContent).toBe("B");
      expect(wrapper.children[2].textContent).toBe("C");
    });

    it("should patch nested fragments", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["Outer"] }),
          jsx(Fragment, {
            children: [jsx("span", { children: ["Inner 1"] })],
          }),
        ],
      });

      render(oldVNode, container);

      expect(container.children.length).toBe(2);

      const newVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["Outer"] }),
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["Inner 1"] }),
              jsx("span", { children: ["Inner 2"] }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe("Outer");
      expect(container.children[1].textContent).toBe("Inner 1");
      expect(container.children[2].textContent).toBe("Inner 2");
    });

    it("should patch by replacing element with fragment", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [jsx("span", { children: ["Single"] })],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);

      const newVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["First"] }),
              jsx("span", { children: ["Second"] }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("First");
      expect(wrapper.children[1].textContent).toBe("Second");
    });

    it("should patch by replacing fragment with element", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["First"] }),
              jsx("span", { children: ["Second"] }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      const newVNode = jsx("div", {
        children: [jsx("span", { children: ["Single"] })],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");
    });

    it("should patch deeply nested fragments", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [
          jsx(Fragment, {
            children: [
              jsx(Fragment, {
                children: [jsx("span", { children: ["Deep"] })],
              }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("Deep");

      const newVNode = jsx(Fragment, {
        children: [
          jsx(Fragment, {
            children: [
              jsx(Fragment, {
                children: [
                  jsx("span", { children: ["Deep 1"] }),
                  jsx("span", { children: ["Deep 2"] }),
                ],
              }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe("Deep 1");
      expect(container.children[1].textContent).toBe("Deep 2");
    });

    it("should patch fragment with keys", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["A"] }, "a"),
          jsx("span", { children: ["B"] }, "b"),
          jsx("span", { children: ["C"] }, "c"),
        ],
      });

      render(oldVNode, container);

      const initialChildren = Array.from(container.children);
      const itemA = initialChildren[0];
      const itemB = initialChildren[1];
      const itemC = initialChildren[2];

      const newVNode = jsx(Fragment, {
        children: [
          jsx("span", { children: ["C"] }, "c"),
          jsx("span", { children: ["A"] }, "a"),
          jsx("span", { children: ["B"] }, "b"),
        ],
      });

      newVNode.patch(oldVNode);

      const newChildren = Array.from(container.children);

      // Elements should be reordered, not recreated
      expect(newChildren[0]).toBe(itemC);
      expect(newChildren[1]).toBe(itemA);
      expect(newChildren[2]).toBe(itemB);
    });

    it("should patch complex nested structure with fragments", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("header", { children: ["Header"] }),
          jsx(Fragment, {
            children: [
              jsx("section", { children: ["Section 1"] }),
              jsx("section", { children: ["Section 2"] }),
            ],
          }),
          jsx("footer", { children: ["Footer"] }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(4);

      const newVNode = jsx("div", {
        children: [
          jsx("header", { children: ["Header"] }),
          jsx(Fragment, {
            children: [
              jsx("section", { children: ["Section 1"] }),
              jsx(Fragment, {
                children: [
                  jsx("aside", { children: ["Aside 1"] }),
                  jsx("aside", { children: ["Aside 2"] }),
                ],
              }),
              jsx("section", { children: ["Section 2"] }),
            ],
          }),
          jsx("footer", { children: ["Footer"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(6);
      expect(wrapper.children[0].tagName).toBe("HEADER");
      expect(wrapper.children[1].tagName).toBe("SECTION");
      expect(wrapper.children[1].textContent).toBe("Section 1");
      expect(wrapper.children[2].tagName).toBe("ASIDE");
      expect(wrapper.children[2].textContent).toBe("Aside 1");
      expect(wrapper.children[3].tagName).toBe("ASIDE");
      expect(wrapper.children[3].textContent).toBe("Aside 2");
      expect(wrapper.children[4].tagName).toBe("SECTION");
      expect(wrapper.children[4].textContent).toBe("Section 2");
      expect(wrapper.children[5].tagName).toBe("FOOTER");
    });

    it("should patch fragment removing all children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["A"] }),
              jsx("span", { children: ["B"] }),
              jsx("span", { children: ["C"] }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(3);

      const newVNode = jsx("div", {
        children: [jsx(Fragment, { children: [] })],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(0);
    });

    it("should patch multiple sequential fragment changes", () => {
      const container = document.createElement("div");

      let currentVNode = jsx(Fragment, {
        children: [jsx("span", { children: ["One"] })],
      });

      render(currentVNode, container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("One");

      // Patch 1: Add element
      const patch1 = jsx(Fragment, {
        children: [
          jsx("span", { children: ["One"] }),
          jsx("span", { children: ["Two"] }),
        ],
      });

      patch1.patch(currentVNode);
      expect(container.children.length).toBe(2);
      expect(container.children[1].textContent).toBe("Two");

      // Patch 2: Add another element
      const patch2 = jsx(Fragment, {
        children: [
          jsx("span", { children: ["One"] }),
          jsx("span", { children: ["Two"] }),
          jsx("span", { children: ["Three"] }),
        ],
      });

      patch2.patch(patch1);
      expect(container.children.length).toBe(3);
      expect(container.children[2].textContent).toBe("Three");

      // Patch 3: Remove middle element
      const patch3 = jsx(Fragment, {
        children: [
          jsx("span", { children: ["One"] }),
          jsx("span", { children: ["Three"] }),
        ],
      });

      patch3.patch(patch2);
      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe("One");
      expect(container.children[1].textContent).toBe("Three");
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { jsx, render } from "./index";
import { Fragment } from "./FragmentVNode";

describe("VDOM Edge Cases", () => {
  describe("Text Node Patching", () => {
    it("should patch element to text node", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [jsx("span", { children: ["Element"] })],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].tagName).toBe("SPAN");

      const newVNode = jsx("div", {
        children: ["Text"],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(1);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.textContent).toBe("Text");
    });

    it("should patch text node to element", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: ["Text"],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);

      const newVNode = jsx("div", {
        children: [jsx("span", { children: ["Element"] })],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].tagName).toBe("SPAN");
    });

    it("should patch text node with different text", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: ["Old Text"],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.textContent).toBe("Old Text");

      const newVNode = jsx("div", {
        children: ["New Text"],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.textContent).toBe("New Text");
      expect(wrapper.childNodes.length).toBe(1);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    });

    it("should patch multiple text nodes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: ["First", "Second"],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(2);

      const newVNode = jsx("div", {
        children: ["Updated", "Text", "Nodes"],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].textContent).toBe("Updated");
      expect(wrapper.childNodes[1].textContent).toBe("Text");
      expect(wrapper.childNodes[2].textContent).toBe("Nodes");
    });
  });

  describe("Mixed Content Patching", () => {
    it("should patch mixed elements and text nodes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: ["Text", jsx("span", { children: ["Span"] }), "More text"],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(3);

      const newVNode = jsx("div", {
        children: [
          jsx("div", { children: ["Div"] }),
          "Middle",
          jsx("button", { children: ["Button"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(3);
      expect((wrapper.childNodes[0] as HTMLElement).tagName).toBe("DIV");
      expect(wrapper.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[1].textContent).toBe("Middle");
      expect((wrapper.childNodes[2] as HTMLElement).tagName).toBe("BUTTON");
    });

    it("should patch from all text to all elements", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: ["One", "Two", "Three"],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["A"] }),
          jsx("span", { children: ["B"] }),
          jsx("span", { children: ["C"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(3);
      expect(wrapper.children[0].tagName).toBe("SPAN");
      expect(wrapper.children[1].tagName).toBe("SPAN");
      expect(wrapper.children[2].tagName).toBe("SPAN");
    });

    it("should patch from all elements to all text", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("span", { children: ["A"] }),
          jsx("span", { children: ["B"] }),
          jsx("span", { children: ["C"] }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(3);

      const newVNode = jsx("div", {
        children: ["One", "Two", "Three"],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(wrapper.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
    });
  });

  describe("Fragment Edge Cases", () => {
    it("should patch fragment with text nodes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [jsx("span", { children: ["Element"] })],
      });

      render(oldVNode, container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe("SPAN");

      const newVNode = jsx(Fragment, {
        children: ["Text 1", "Text 2"],
      });

      newVNode.patch(oldVNode);

      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].textContent).toBe("Text 1");
      expect(container.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[1].textContent).toBe("Text 2");
    });

    it("should patch fragment with mixed content", () => {
      const container = document.createElement("div");

      const oldVNode = jsx(Fragment, {
        children: [jsx("span", { children: ["A"] })],
      });

      render(oldVNode, container);

      const newVNode = jsx(Fragment, {
        children: ["Text", jsx("div", { children: ["Element"] }), "More text"],
      });

      newVNode.patch(oldVNode);

      expect(container.childNodes.length).toBe(3);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].textContent).toBe("Text");
      expect((container.childNodes[1] as HTMLElement).tagName).toBe("DIV");
      expect(container.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[2].textContent).toBe("More text");
    });

    it("should patch empty fragment to non-empty", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [jsx(Fragment, { children: [] })],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(0);

      const newVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["A"] }),
              jsx("span", { children: ["B"] }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("A");
      expect(wrapper.children[1].textContent).toBe("B");
    });

    it("should patch non-empty fragment to empty", () => {
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
        children: [jsx(Fragment, { children: [] })],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(0);
    });
  });

  describe("Property Edge Cases", () => {
    it("should patch null attribute to string", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        "data-value": null,
      });

      render(oldVNode, container);

      const div = container.children[0] as HTMLElement;
      expect(div.getAttribute("data-value")).toBeNull();

      const newVNode = jsx("div", {
        "data-value": "test",
      });

      newVNode.patch(oldVNode);

      expect(div.getAttribute("data-value")).toBe("test");
    });

    it("should patch string attribute to null", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        "data-value": "test",
      });

      render(oldVNode, container);

      const div = container.children[0] as HTMLElement;
      expect(div.getAttribute("data-value")).toBe("test");

      const newVNode = jsx("div", {
        "data-value": null,
      });

      newVNode.patch(oldVNode);

      expect(div.getAttribute("data-value")).toBeNull();
    });

    it("should remove event listener when patching to null", () => {
      const container = document.createElement("div");

      const oldHandler = vi.fn();

      const oldVNode = jsx("button", {
        onClick: oldHandler,
      });

      render(oldVNode, container);

      const button = container.children[0] as HTMLButtonElement;
      button.click();
      expect(oldHandler).toHaveBeenCalledTimes(1);

      const newVNode = jsx("button", {
        onClick: null,
      });

      newVNode.patch(oldVNode);

      button.click();
      // Should still be 1, not 2
      expect(oldHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle className changes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        className: "old-class",
      });

      render(oldVNode, container);

      const div = container.children[0] as HTMLElement;
      expect(div.className).toBe("old-class");

      const newVNode = jsx("div", {
        className: "new-class another-class",
      });

      newVNode.patch(oldVNode);

      expect(div.className).toBe("new-class another-class");
    });

    it("should handle style object changes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        style: { color: "red", fontSize: "16px" },
      });

      render(oldVNode, container);

      const div = container.children[0] as HTMLElement;
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");

      const newVNode = jsx("div", {
        style: { color: "blue", fontWeight: "bold" },
      });

      newVNode.patch(oldVNode);

      expect(div.style.color).toBe("blue");
      expect(div.style.fontWeight).toBe("bold");
      // fontSize should be removed or remain - depends on your implementation
    });
  });

  describe("Keys Edge Cases", () => {
    it("should handle keys with mixed text and elements", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          "Text",
          jsx("span", { children: ["A"] }, "a"),
          jsx("span", { children: ["B"] }, "b"),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      const initialSpanA = wrapper.children[0];
      const initialSpanB = wrapper.children[1];

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["B"] }, "b"),
          "Text",
          jsx("span", { children: ["A"] }, "a"),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(3);
      expect(wrapper.children[0]).toBe(initialSpanB);
      expect(wrapper.children[1]).toBe(initialSpanA);
    });

    it("should handle duplicate keys gracefully", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("span", { children: ["A"] }, "key"),
          jsx("span", { children: ["B"] }, "key"), // duplicate key
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["C"] }, "key"),
          jsx("span", { children: ["D"] }, "other"),
        ],
      });

      newVNode.patch(oldVNode);

      // Should handle this without crashing
      expect(wrapper.children.length).toBe(2);
    });

    it("should handle numeric keys", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("span", { children: ["0"] }, "0"),
          jsx("span", { children: ["1"] }, "1"),
          jsx("span", { children: ["2"] }, "2"),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      const initialChildren = Array.from(wrapper.children);

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["2"] }, "2"),
          jsx("span", { children: ["0"] }, "0"),
          jsx("span", { children: ["1"] }, "1"),
        ],
      });

      newVNode.patch(oldVNode);

      const newChildren = Array.from(wrapper.children);
      expect(newChildren[0]).toBe(initialChildren[2]);
      expect(newChildren[1]).toBe(initialChildren[0]);
      expect(newChildren[2]).toBe(initialChildren[1]);
    });
  });

  describe("Empty and Null Cases", () => {
    it("should patch from children to no children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("span", { children: ["A"] }),
          jsx("span", { children: ["B"] }),
        ],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      const newVNode = jsx("div", {});

      newVNode.patch(oldVNode);

      expect(wrapper.childNodes.length).toBe(0);
    });

    it("should patch from no children to children", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {});

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.childNodes.length).toBe(0);

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["A"] }),
          jsx("span", { children: ["B"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(2);
    });

    it("should handle null and undefined in children array", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [null, jsx("span", { children: ["A"] }), undefined],
      });

      render(oldVNode, container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("A");

      const newVNode = jsx("div", {
        children: [
          jsx("span", { children: ["B"] }),
          null,
          jsx("span", { children: ["C"] }),
        ],
      });

      newVNode.patch(oldVNode);

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("B");
      expect(wrapper.children[1].textContent).toBe("C");
    });
  });

  describe("Deeply Nested Patching", () => {
    it("should patch deeply nested structure with tag changes", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx("section", {
            children: [
              jsx("article", {
                children: [
                  jsx("p", {
                    children: [jsx("span", { children: ["Deep text"] })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      const newVNode = jsx("div", {
        children: [
          jsx("section", {
            children: [
              jsx("article", {
                children: [
                  jsx("div", {
                    children: [jsx("strong", { children: ["Updated text"] })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      const wrapper = container.children[0] as HTMLElement;
      const section = wrapper.children[0];
      const article = section.children[0];
      const div = article.children[0];
      expect(div.tagName).toBe("DIV");
      expect(div.children[0].tagName).toBe("STRONG");
      expect(div.children[0].textContent).toBe("Updated text");
    });

    it("should patch with alternating fragments and elements", () => {
      const container = document.createElement("div");

      const oldVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", {
                children: [
                  jsx(Fragment, {
                    children: [jsx("em", { children: ["Nested"] })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      render(oldVNode, container);

      const newVNode = jsx("div", {
        children: [
          jsx(Fragment, {
            children: [
              jsx("span", {
                children: [
                  jsx(Fragment, {
                    children: [
                      jsx("em", { children: ["Updated"] }),
                      jsx("strong", { children: ["Added"] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      newVNode.patch(oldVNode);

      const wrapper = container.children[0] as HTMLElement;
      const span = wrapper.children[0];
      expect(span.children.length).toBe(2);
      expect(span.children[0].tagName).toBe("EM");
      expect(span.children[0].textContent).toBe("Updated");
      expect(span.children[1].tagName).toBe("STRONG");
      expect(span.children[1].textContent).toBe("Added");
    });
  });

  describe("Same Node Patching", () => {
    it("should handle patching node with itself", () => {
      const container = document.createElement("div");

      const vnode = jsx("div", {
        children: [jsx("span", { children: ["Text"] })],
      });

      render(vnode, container);

      const wrapper = container.children[0] as HTMLElement;
      const initialContent = wrapper.innerHTML;

      // Patch with itself - should be a no-op
      vnode.patch(vnode);

      expect(wrapper.innerHTML).toBe(initialContent);
    });
  });
});

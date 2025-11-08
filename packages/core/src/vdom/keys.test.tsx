import { describe, it, expect } from "vitest";
import { jsx, render } from "./index";

describe("VDOM Keys", () => {
  it("should preserve elements when reordering with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with keys
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }, "b"),
        jsx("li", { children: "Item C" }, "c"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references to the original DOM elements
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    expect(itemA.textContent).toBe("Item A");
    expect(itemB.textContent).toBe("Item B");
    expect(itemC.textContent).toBe("Item C");

    // Create new list with items reordered (C, A, B)
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item C" }, "c"),
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }, "b"),
      ],
    });

    // Patch to reorder
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    // Verify elements were reordered, not recreated
    // The DOM elements should be the same instances, just moved
    expect(newChildren[0]).toBe(itemC); // C is now first
    expect(newChildren[1]).toBe(itemA); // A is now second
    expect(newChildren[2]).toBe(itemB); // B is now third

    expect(newChildren[0].textContent).toBe("Item C");
    expect(newChildren[1].textContent).toBe("Item A");
    expect(newChildren[2].textContent).toBe("Item B");
  });

  it("should not preserve elements when reordering without keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list WITHOUT keys
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }),
        jsx("li", { children: "Item B" }),
        jsx("li", { children: "Item C" }),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references to the original DOM elements
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    // Create new list with items reordered (C, A, B)
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item C" }),
        jsx("li", { children: "Item A" }),
        jsx("li", { children: "Item B" }),
      ],
    });

    // Patch to reorder
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    // Without keys, the DOM elements are reused in place and just updated
    // So the DOM nodes remain the same, but their content is changed
    expect(newChildren[0]).toBe(itemA); // Same DOM node, but content changed to "Item C"
    expect(newChildren[1]).toBe(itemB); // Same DOM node, but content changed to "Item A"
    expect(newChildren[2]).toBe(itemC); // Same DOM node, but content changed to "Item B"

    expect(newChildren[0].textContent).toBe("Item C");
    expect(newChildren[1].textContent).toBe("Item A");
    expect(newChildren[2].textContent).toBe("Item B");
  });

  it("should preserve element state when reordering with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with input elements that have keys
    const oldVNode = jsx("div", {
      children: [
        jsx("input", { value: "First" }, "first"),
        jsx("input", { value: "Second" }, "second"),
        jsx("input", { value: "Third" }, "third"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const div = container.children[0] as HTMLElement;
    const initialInputs = Array.from(div.children) as HTMLInputElement[];

    // User "types" in the inputs (simulating user interaction)
    initialInputs[0].value = "Modified First";
    initialInputs[1].value = "Modified Second";
    initialInputs[2].value = "Modified Third";

    // Store references
    const input1 = initialInputs[0];
    const input2 = initialInputs[1];
    const input3 = initialInputs[2];

    // Create new list with inputs reordered (third, first, second)
    const newVNode = jsx("div", {
      children: [
        jsx("input", { value: "Third" }, "third"),
        jsx("input", { value: "First" }, "first"),
        jsx("input", { value: "Second" }, "second"),
      ],
    });

    // Patch to reorder
    newVNode.patch(oldVNode);

    const newInputs = Array.from(div.children) as HTMLInputElement[];

    // Verify elements were moved (not recreated) so user modifications are preserved
    expect(newInputs[0]).toBe(input3);
    expect(newInputs[1]).toBe(input1);
    expect(newInputs[2]).toBe(input2);

    // The user's modifications should be preserved because the DOM elements were moved
    expect(newInputs[0].value).toBe("Modified Third");
    expect(newInputs[1].value).toBe("Modified First");
    expect(newInputs[2].value).toBe("Modified Second");
  });

  it("should handle adding new items with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with keys
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }, "b"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(2);

    // Store references
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];

    // Add a new item in the middle
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item C" }, "c"), // New item
        jsx("li", { children: "Item B" }, "b"),
      ],
    });

    // Patch to add new item
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // Original elements should be preserved
    expect(newChildren[0]).toBe(itemA);
    expect(newChildren[2]).toBe(itemB);

    // New element in the middle
    expect(newChildren[1]).not.toBe(itemA);
    expect(newChildren[1]).not.toBe(itemB);
    expect(newChildren[1].textContent).toBe("Item C");
  });

  it("should handle removing items with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with keys
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }, "b"),
        jsx("li", { children: "Item C" }, "c"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // Store references
    const itemA = initialChildren[0];
    const itemC = initialChildren[2];

    // Remove the middle item
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item C" }, "c"),
      ],
    });

    // Patch to remove middle item
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(2);

    // Remaining elements should be preserved
    expect(newChildren[0]).toBe(itemA);
    expect(newChildren[1]).toBe(itemC);
  });

  it("should handle replacing all items with different keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with keys
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }, "b"),
        jsx("li", { children: "Item C" }, "c"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    // Store references
    const itemA = initialChildren[0];
    const itemB = initialChildren[1];
    const itemC = initialChildren[2];

    // Replace all items with new keys
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item X" }, "x"),
        jsx("li", { children: "Item Y" }, "y"),
        jsx("li", { children: "Item Z" }, "z"),
      ],
    });

    // Patch to replace all
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(3);

    // All elements should be new instances
    expect(newChildren[0]).not.toBe(itemA);
    expect(newChildren[1]).not.toBe(itemB);
    expect(newChildren[2]).not.toBe(itemC);

    expect(newChildren[0].textContent).toBe("Item X");
    expect(newChildren[1].textContent).toBe("Item Y");
    expect(newChildren[2].textContent).toBe("Item Z");
  });

  it("should handle complex reordering scenario with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list: [A, B, C, D, E]
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "A" }, "a"),
        jsx("li", { children: "B" }, "b"),
        jsx("li", { children: "C" }, "c"),
        jsx("li", { children: "D" }, "d"),
        jsx("li", { children: "E" }, "e"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;
    const initialChildren = Array.from(ul.children);

    const [itemA, itemB, itemC, itemD, itemE] = initialChildren;

    // Complex reorder: remove C, add F, reorder to [E, A, F, D, B]
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "E" }, "e"),
        jsx("li", { children: "A" }, "a"),
        jsx("li", { children: "F" }, "f"), // New item
        jsx("li", { children: "D" }, "d"),
        jsx("li", { children: "B" }, "b"),
        // C is removed
      ],
    });

    // Patch to apply complex changes
    newVNode.patch(oldVNode);

    const newChildren = Array.from(ul.children);

    expect(ul.children.length).toBe(5);

    // Verify preserved elements are in correct positions
    expect(newChildren[0]).toBe(itemE);
    expect(newChildren[1]).toBe(itemA);
    expect(newChildren[3]).toBe(itemD);
    expect(newChildren[4]).toBe(itemB);

    // F is new
    expect(newChildren[2]).not.toBe(itemA);
    expect(newChildren[2]).not.toBe(itemB);
    expect(newChildren[2]).not.toBe(itemC);
    expect(newChildren[2]).not.toBe(itemD);
    expect(newChildren[2]).not.toBe(itemE);
    expect(newChildren[2].textContent).toBe("F");

    // C should not be in the list
    expect(newChildren.includes(itemC)).toBe(false);
  });

  it("should handle nested elements with keys", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial nested structure with keys
    const oldVNode = jsx("div", {
      children: [
        jsx(
          "section",
          {
            children: [
              jsx("h2", { children: "Section 1" }),
              jsx("p", { children: "Content 1" }),
            ],
          },
          "section1"
        ),
        jsx(
          "section",
          {
            children: [
              jsx("h2", { children: "Section 2" }),
              jsx("p", { children: "Content 2" }),
            ],
          },
          "section2"
        ),
      ],
    });

    // Render the initial structure
    render(oldVNode, container);

    const div = container.children[0] as HTMLElement;
    const initialSections = Array.from(div.children);

    const section1 = initialSections[0];
    const section2 = initialSections[1];

    // Reorder sections
    const newVNode = jsx("div", {
      children: [
        jsx(
          "section",
          {
            children: [
              jsx("h2", { children: "Section 2" }),
              jsx("p", { children: "Content 2" }),
            ],
          },
          "section2"
        ),
        jsx(
          "section",
          {
            children: [
              jsx("h2", { children: "Section 1" }),
              jsx("p", { children: "Content 1" }),
            ],
          },
          "section1"
        ),
      ],
    });

    // Patch to reorder
    newVNode.patch(oldVNode);

    const newSections = Array.from(div.children);

    // Verify sections were moved, not recreated
    expect(newSections[0]).toBe(section2);
    expect(newSections[1]).toBe(section1);

    expect(newSections[0].children[0].textContent).toBe("Section 2");
    expect(newSections[1].children[0].textContent).toBe("Section 1");
  });

  it("should handle mixed keys and non-keyed elements", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial list with some keyed and some non-keyed
    const oldVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item A" }, "a"),
        jsx("li", { children: "Item B" }), // No key
        jsx("li", { children: "Item C" }, "c"),
      ],
    });

    // Render the initial list
    render(oldVNode, container);

    const ul = container.children[0] as HTMLElement;

    expect(ul.children.length).toBe(3);
    expect(ul.children[0].textContent).toBe("Item A");
    expect(ul.children[1].textContent).toBe("Item B");
    expect(ul.children[2].textContent).toBe("Item C");

    // Reorder with mixed keys
    const newVNode = jsx("ul", {
      children: [
        jsx("li", { children: "Item C" }, "c"),
        jsx("li", { children: "Item B Modified" }), // No key, content changed
        jsx("li", { children: "Item A" }, "a"),
      ],
    });

    // Patch to reorder
    newVNode.patch(oldVNode);

    expect(ul.children.length).toBe(3);
    expect(ul.children[0].textContent).toBe("Item C");
    expect(ul.children[1].textContent).toBe("Item B Modified");
    expect(ul.children[2].textContent).toBe("Item A");
  });
});

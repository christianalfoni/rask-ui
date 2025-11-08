import { describe, it, expect, vi } from "vitest";
import { jsx, render } from "./index";

describe("VDOM Patch", () => {
  it("should patch a div element with a span element", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode (div)
    const divVNode = jsx("div", { id: "initial" });

    // Render the initial vnode
    render(divVNode, container);

    // Verify initial render
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("DIV");

    // Create new vnode (span)
    const spanVNode = jsx("span", { id: "patched" });

    // Patch: new node takes over from old node
    spanVNode.patch(divVNode);

    // Verify the element was replaced
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("SPAN");
  });

  it("should patch element by adding children", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode without children
    const oldVNode = jsx("div", { id: "parent" });

    // Render the initial vnode
    render(oldVNode, container);

    // Verify initial state (no children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(0);

    // Create new vnode with children
    const child1 = jsx("span", { id: "child1" });
    const child2 = jsx("div", { id: "child2" });
    const newVNode = jsx("div", {
      id: "parent",
      children: [child1, child2],
    });

    // Patch to add children
    newVNode.patch(oldVNode);

    // Verify children were added
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("SPAN");
    expect(parent.children[1].tagName).toBe("DIV");
  });

  it("should patch element by removing children", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode with children
    const child1 = jsx("span", { id: "child1" });
    const child2 = jsx("div", { id: "child2" });
    const child3 = jsx("span", { id: "child3" });
    const oldVNode = jsx("div", {
      id: "parent",
      children: [child1, child2, child3],
    });

    // Render the initial vnode
    render(oldVNode, container);

    // Verify initial state (3 children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(3);

    // Create new vnode without children
    const newVNode = jsx("div", { id: "parent" });

    // Patch to remove children
    newVNode.patch(oldVNode);

    // Verify children were removed
    expect(parent.children.length).toBe(0);
  });

  it("should patch element by changing child types", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode with span children
    const oldChild1 = jsx("span", { id: "child1" });
    const oldChild2 = jsx("span", { id: "child2" });
    const oldVNode = jsx("div", {
      id: "parent",
      children: [oldChild1, oldChild2],
    });

    // Render the initial vnode
    render(oldVNode, container);

    // Verify initial state (2 span children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("SPAN");
    expect(parent.children[1].tagName).toBe("SPAN");

    // Create new vnode with different child types
    const newChild1 = jsx("div", { id: "child1" });
    const newChild2 = jsx("button", { id: "child2" });
    const newVNode = jsx("div", {
      id: "parent",
      children: [newChild1, newChild2],
    });

    // Patch to change child types
    newVNode.patch(oldVNode);

    // Verify children types were changed
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("DIV");
    expect(parent.children[1].tagName).toBe("BUTTON");
  });

  it("should patch element by adding data/aria attributes", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode without attributes
    const oldVNode = jsx("div", {});

    // Render the initial vnode
    render(oldVNode, container);

    const div = container.children[0] as HTMLElement;

    // Verify no attributes initially
    expect(div.getAttribute("data-testid")).toBeNull();
    expect(div.getAttribute("aria-label")).toBeNull();

    // Create new vnode with data/aria attributes
    const newVNode = jsx("div", {
      "data-testid": "test-component",
      "aria-label": "Test element",
    });

    // Patch to add attributes
    newVNode.patch(oldVNode);

    // Verify attributes were added
    expect(div.getAttribute("data-testid")).toBe("test-component");
    expect(div.getAttribute("aria-label")).toBe("Test element");
  });

  it("should patch element by removing data/aria attributes", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode with data/aria attributes
    const oldVNode = jsx("div", {
      "data-testid": "test-component",
      "data-value": "123",
      "aria-label": "Test element",
    });

    // Render the initial vnode
    render(oldVNode, container);

    const div = container.children[0] as HTMLElement;

    // Verify attributes exist
    expect(div.getAttribute("data-testid")).toBe("test-component");
    expect(div.getAttribute("data-value")).toBe("123");
    expect(div.getAttribute("aria-label")).toBe("Test element");

    // Create new vnode without attributes
    const newVNode = jsx("div", {});

    // Patch to remove attributes
    newVNode.patch(oldVNode);

    // Verify attributes were removed
    expect(div.getAttribute("data-testid")).toBeNull();
    expect(div.getAttribute("data-value")).toBeNull();
    expect(div.getAttribute("aria-label")).toBeNull();
  });

  it("should patch element by updating data/aria attributes", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial vnode with data/aria attributes
    const oldVNode = jsx("div", {
      "data-testid": "old-id",
      "data-value": "old-value",
      "aria-label": "Old label",
    });

    // Render the initial vnode
    render(oldVNode, container);

    const div = container.children[0] as HTMLElement;

    // Verify initial attributes
    expect(div.getAttribute("data-testid")).toBe("old-id");
    expect(div.getAttribute("data-value")).toBe("old-value");
    expect(div.getAttribute("aria-label")).toBe("Old label");

    // Create new vnode with updated data/aria attributes
    const newVNode = jsx("div", {
      "data-testid": "new-id",
      "data-value": "new-value",
      "aria-label": "New label",
    });

    // Patch to update attributes
    newVNode.patch(oldVNode);

    // Verify attributes were updated
    expect(div.getAttribute("data-testid")).toBe("new-id");
    expect(div.getAttribute("data-value")).toBe("new-value");
    expect(div.getAttribute("aria-label")).toBe("New label");
  });

  it("should patch element by updating event listeners", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create mock click handlers
    const oldHandler = vi.fn();
    const newHandler = vi.fn();

    // Create initial vnode with event listener
    const oldVNode = jsx("button", {
      onClick: oldHandler,
    });

    // Render the initial vnode
    render(oldVNode, container);

    const button = container.children[0] as HTMLButtonElement;

    // Trigger click to verify old handler works
    button.click();
    expect(oldHandler).toHaveBeenCalledTimes(1);
    expect(newHandler).toHaveBeenCalledTimes(0);

    // Create new vnode with different event listener
    const newVNode = jsx("button", {
      onClick: newHandler,
    });

    // Patch to update event listener
    newVNode.patch(oldVNode);

    // Trigger click again
    button.click();

    // Verify old handler was not called again and new handler was called
    expect(oldHandler).toHaveBeenCalledTimes(1);
    expect(newHandler).toHaveBeenCalledTimes(1);
  });

  it("should patch complex nested UI structure", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial complex structure
    const header = jsx("header", {
      className: "header",
      children: [
        jsx("h1", { children: ["Title"] }),
        jsx("nav", {
          children: [
            jsx("a", { href: "#home", children: ["Home"] }),
            jsx("a", { href: "#about", children: ["About"] }),
          ],
        }),
      ],
    });

    const content = jsx("main", {
      className: "content",
      children: [
        jsx("p", { children: ["Paragraph 1"] }),
        jsx("p", { children: ["Paragraph 2"] }),
      ],
    });

    const oldVNode = jsx("div", {
      className: "app",
      children: [header, content],
    });

    // Render the initial structure
    render(oldVNode, container);

    const app = container.children[0] as HTMLElement;

    // Verify initial structure
    expect(app.children.length).toBe(2);
    expect(app.children[0].tagName).toBe("HEADER");
    expect(app.children[1].tagName).toBe("MAIN");

    const initialHeader = app.children[0];
    expect(initialHeader.children.length).toBe(2);
    expect(initialHeader.children[0].textContent).toBe("Title");

    const initialNav = initialHeader.children[1];
    expect(initialNav.children.length).toBe(2);

    const initialMain = app.children[1];
    expect(initialMain.children.length).toBe(2);

    // Create new complex structure with changes
    const newHeader = jsx("header", {
      className: "header-updated",
      children: [
        jsx("h1", { children: ["New Title"] }),
        jsx("nav", {
          children: [
            jsx("a", { href: "#home", children: ["Home"] }),
            jsx("a", { href: "#about", children: ["About"] }),
            jsx("a", { href: "#contact", children: ["Contact"] }), // Added new link
          ],
        }),
      ],
    });

    const newContent = jsx("main", {
      className: "content",
      children: [
        jsx("p", { children: ["Updated Paragraph 1"] }),
        jsx("div", { children: ["New div element"] }), // Changed from p to div
        jsx("p", { children: ["Paragraph 3"] }), // Added new paragraph
      ],
    });

    const newVNode = jsx("div", {
      className: "app-updated",
      children: [newHeader, newContent],
    });

    // Patch the structure
    newVNode.patch(oldVNode);

    // Verify patched structure
    expect(app.className).toBe("app-updated");
    expect(app.children.length).toBe(2);

    const patchedHeader = app.children[0];
    expect(patchedHeader.className).toBe("header-updated");
    expect(patchedHeader.children[0].textContent).toBe("New Title");

    const patchedNav = patchedHeader.children[1];
    expect(patchedNav.children.length).toBe(3);
    expect(patchedNav.children[2].textContent).toBe("Contact");

    const patchedMain = app.children[1];
    expect(patchedMain.children.length).toBe(3);
    expect(patchedMain.children[0].textContent).toBe("Updated Paragraph 1");
    expect(patchedMain.children[1].tagName).toBe("DIV");
    expect(patchedMain.children[2].textContent).toBe("Paragraph 3");
  });

  it("should patch nested elements independently", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial nested structure
    const sidebar = jsx("aside", {
      className: "sidebar",
      children: [
        jsx("div", { className: "widget", children: ["Widget 1"] }),
        jsx("div", { className: "widget", children: ["Widget 2"] }),
      ],
    });

    const content = jsx("main", {
      children: [
        jsx("article", {
          children: [
            jsx("h2", { children: ["Article Title"] }),
            jsx("p", { children: ["Article content"] }),
          ],
        }),
      ],
    });

    const oldVNode = jsx("div", {
      className: "layout",
      children: [sidebar, content],
    });

    // Render the initial structure
    render(oldVNode, container);

    const layout = container.children[0] as HTMLElement;
    const initialSidebar = layout.children[0] as HTMLElement;
    const initialMain = layout.children[1] as HTMLElement;

    // First patch: Update only the sidebar
    const newSidebar = jsx("aside", {
      className: "sidebar-updated",
      children: [
        jsx("div", { className: "widget", children: ["Widget 1 Updated"] }),
        jsx("div", { className: "widget", children: ["Widget 2"] }),
        jsx("div", { className: "widget", children: ["Widget 3"] }),
      ],
    });

    const firstPatchVNode = jsx("div", {
      className: "layout",
      children: [newSidebar, content],
    });

    firstPatchVNode.patch(oldVNode);

    // Verify only sidebar changed
    expect(initialSidebar.className).toBe("sidebar-updated");
    expect(initialSidebar.children.length).toBe(3);
    expect(initialSidebar.children[0].textContent).toBe("Widget 1 Updated");
    expect(initialSidebar.children[2].textContent).toBe("Widget 3");

    // Main content should be unchanged
    const article = initialMain.children[0];
    expect(article.children[0].textContent).toBe("Article Title");
    expect(article.children[1].textContent).toBe("Article content");

    // Second patch: Update only the content
    const newContent = jsx("main", {
      children: [
        jsx("article", {
          children: [
            jsx("h2", { children: ["Updated Article Title"] }),
            jsx("p", { children: ["Updated article content"] }),
            jsx("footer", { children: ["Article footer"] }),
          ],
        }),
      ],
    });

    const secondPatchVNode = jsx("div", {
      className: "layout",
      children: [newSidebar, newContent],
    });

    secondPatchVNode.patch(firstPatchVNode);

    // Sidebar should remain from first patch
    expect(initialSidebar.className).toBe("sidebar-updated");
    expect(initialSidebar.children.length).toBe(3);

    // Main content should now be updated
    const updatedArticle = initialMain.children[0];
    expect(updatedArticle.children.length).toBe(3);
    expect(updatedArticle.children[0].textContent).toBe(
      "Updated Article Title"
    );
    expect(updatedArticle.children[1].textContent).toBe(
      "Updated article content"
    );
    expect(updatedArticle.children[2].tagName).toBe("FOOTER");
  });

  it("should handle multiple sequential patches", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial structure
    let currentVNode = jsx("div", {
      className: "counter",
      children: [
        jsx("span", { children: ["Count: 0"] }),
        jsx("button", { children: ["Increment"] }),
      ],
    });

    // Render the initial structure
    render(currentVNode, container);

    const counterDiv = container.children[0] as HTMLElement;

    // Verify initial state
    expect(counterDiv.children[0].textContent).toBe("Count: 0");

    // Patch 1: Update count to 1
    const patch1 = jsx("div", {
      className: "counter",
      children: [
        jsx("span", { children: ["Count: 1"] }),
        jsx("button", { children: ["Increment"] }),
      ],
    });

    patch1.patch(currentVNode);
    expect(counterDiv.children[0].textContent).toBe("Count: 1");

    // Patch 2: Update count to 2
    const patch2 = jsx("div", {
      className: "counter",
      children: [
        jsx("span", { children: ["Count: 2"] }),
        jsx("button", { children: ["Increment"] }),
      ],
    });

    patch2.patch(patch1);
    expect(counterDiv.children[0].textContent).toBe("Count: 2");

    // Patch 3: Update count to 3 and change button text
    const patch3 = jsx("div", {
      className: "counter",
      children: [
        jsx("span", { children: ["Count: 3"] }),
        jsx("button", { children: ["Reset"] }),
      ],
    });

    patch3.patch(patch2);
    expect(counterDiv.children[0].textContent).toBe("Count: 3");
    expect(counterDiv.children[1].textContent).toBe("Reset");

    // Patch 4: Reset to 0 and add a new element
    const patch4 = jsx("div", {
      className: "counter",
      children: [
        jsx("span", { children: ["Count: 0"] }),
        jsx("button", { children: ["Increment"] }),
        jsx("small", { children: ["Click to increment"] }),
      ],
    });

    patch4.patch(patch3);

    expect(counterDiv.children.length).toBe(3);
    expect(counterDiv.children[0].textContent).toBe("Count: 0");
    expect(counterDiv.children[2].tagName).toBe("SMALL");
  });

  it("should patch deeply nested child independently", () => {
    // Create a container element
    const container = document.createElement("div");

    // Create initial deeply nested structure
    const oldVNode = jsx("div", {
      className: "root",
      children: [
        jsx("div", {
          className: "level-1",
          children: [
            jsx("div", {
              className: "level-2",
              children: [
                jsx("div", {
                  className: "level-3",
                  children: [
                    jsx("span", { children: ["Deep content"], id: "target" }),
                  ],
                }),
                jsx("div", { children: ["Sibling at level-3"] }),
              ],
            }),
            jsx("div", { children: ["Sibling at level-2"] }),
          ],
        }),
        jsx("div", { children: ["Sibling at level-1"] }),
      ],
    });

    // Render the initial structure
    render(oldVNode, container);

    const root = container.children[0] as HTMLElement;

    // Navigate to the deep element
    const level1 = root.children[0] as HTMLElement;
    const level2 = level1.children[0] as HTMLElement;
    const level3 = level2.children[0] as HTMLElement;
    const targetSpan = level3.children[0] as HTMLElement;

    // Verify initial state
    expect(targetSpan.textContent).toBe("Deep content");
    expect(targetSpan.id).toBe("target");

    // Patch only the deeply nested element
    const newVNode = jsx("div", {
      className: "root",
      children: [
        jsx("div", {
          className: "level-1",
          children: [
            jsx("div", {
              className: "level-2",
              children: [
                jsx("div", {
                  className: "level-3",
                  children: [
                    jsx("span", {
                      children: ["Updated deep content"],
                      id: "target-updated",
                    }),
                  ],
                }),
                jsx("div", { children: ["Sibling at level-3"] }),
              ],
            }),
            jsx("div", { children: ["Sibling at level-2"] }),
          ],
        }),
        jsx("div", { children: ["Sibling at level-1"] }),
      ],
    });

    newVNode.patch(oldVNode);

    // Verify the deep element was updated
    expect(targetSpan.textContent).toBe("Updated deep content");
    expect(targetSpan.id).toBe("target-updated");

    // Verify siblings remained unchanged
    expect(level2.children[1].textContent).toBe("Sibling at level-3");
    expect(level1.children[1].textContent).toBe("Sibling at level-2");
    expect(root.children[1].textContent).toBe("Sibling at level-1");
  });
});

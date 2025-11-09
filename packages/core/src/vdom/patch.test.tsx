import { describe, it, expect, vi } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";

describe("VDOM Patch", () => {
  it("should patch a div element with a span element", async () => {
    const container = document.createElement("div");
    let stateFn: { useSpan: boolean } | undefined;

    const App = () => {
      const state = createState({ useSpan: false });
      stateFn = state;
      return () =>
        state.useSpan
          ? jsx("span", { id: "patched" })
          : jsx("div", { id: "initial" });
    };

    render(jsx(App, {}), container);

    // Verify initial render
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("DIV");

    // Trigger patch by changing state
    stateFn!.useSpan = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the element was replaced
    expect(container.children.length).toBe(1);
    expect(container.children[0].tagName).toBe("SPAN");
  });

  it("should patch element by adding children", async () => {
    const container = document.createElement("div");
    let stateFn: { hasChildren: boolean } | undefined;

    const App = () => {
      const state = createState({ hasChildren: false });
      stateFn = state;
      return () =>
        state.hasChildren
          ? jsx("div", {
              id: "parent",
              children: [
                jsx("span", { id: "child1" }),
                jsx("div", { id: "child2" }),
              ],
            })
          : jsx("div", { id: "parent" });
    };

    render(jsx(App, {}), container);

    // Verify initial state (no children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(0);

    // Trigger patch to add children
    stateFn!.hasChildren = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify children were added
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("SPAN");
    expect(parent.children[1].tagName).toBe("DIV");
  });

  it("should patch element by removing children", async () => {
    const container = document.createElement("div");
    let stateFn: { hasChildren: boolean } | undefined;

    const App = () => {
      const state = createState({ hasChildren: true });
      stateFn = state;
      return () =>
        state.hasChildren
          ? jsx("div", {
              id: "parent",
              children: [
                jsx("span", { id: "child1" }),
                jsx("div", { id: "child2" }),
                jsx("span", { id: "child3" }),
              ],
            })
          : jsx("div", { id: "parent" });
    };

    render(jsx(App, {}), container);

    // Verify initial state (3 children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(3);

    // Trigger patch to remove children
    stateFn!.hasChildren = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify children were removed
    expect(parent.children.length).toBe(0);
  });

  it("should patch element by changing child types", async () => {
    const container = document.createElement("div");
    let stateFn: { version: number } | undefined;

    const App = () => {
      const state = createState({ version: 1 });
      stateFn = state;
      return () =>
        state.version === 1
          ? jsx("div", {
              id: "parent",
              children: [
                jsx("span", { id: "child1" }),
                jsx("span", { id: "child2" }),
              ],
            })
          : jsx("div", {
              id: "parent",
              children: [
                jsx("div", { id: "child1" }),
                jsx("button", { id: "child2" }),
              ],
            });
    };

    render(jsx(App, {}), container);

    // Verify initial state (2 span children)
    const parent = container.children[0] as HTMLElement;
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("SPAN");
    expect(parent.children[1].tagName).toBe("SPAN");

    // Trigger patch to change child types
    stateFn!.version = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify children types were changed
    expect(parent.children.length).toBe(2);
    expect(parent.children[0].tagName).toBe("DIV");
    expect(parent.children[1].tagName).toBe("BUTTON");
  });

  it("should patch element by adding data/aria attributes", async () => {
    const container = document.createElement("div");
    let stateFn: { hasAttributes: boolean } | undefined;

    const App = () => {
      const state = createState({ hasAttributes: false });
      stateFn = state;
      return () =>
        state.hasAttributes
          ? jsx("div", {
              "data-testid": "test-component",
              "aria-label": "Test element",
            })
          : jsx("div", {});
    };

    render(jsx(App, {}), container);

    const div = container.children[0] as HTMLElement;

    // Verify no attributes initially
    expect(div.getAttribute("data-testid")).toBeNull();
    expect(div.getAttribute("aria-label")).toBeNull();

    // Trigger patch to add attributes
    stateFn!.hasAttributes = true;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify attributes were added
    expect(div.getAttribute("data-testid")).toBe("test-component");
    expect(div.getAttribute("aria-label")).toBe("Test element");
  });

  it("should patch element by removing data/aria attributes", async () => {
    const container = document.createElement("div");
    let stateFn: { hasAttributes: boolean } | undefined;

    const App = () => {
      const state = createState({ hasAttributes: true });
      stateFn = state;
      return () =>
        state.hasAttributes
          ? jsx("div", {
              "data-testid": "test-component",
              "data-value": "123",
              "aria-label": "Test element",
            })
          : jsx("div", {});
    };

    render(jsx(App, {}), container);

    const div = container.children[0] as HTMLElement;

    // Verify attributes exist
    expect(div.getAttribute("data-testid")).toBe("test-component");
    expect(div.getAttribute("data-value")).toBe("123");
    expect(div.getAttribute("aria-label")).toBe("Test element");

    // Trigger patch to remove attributes
    stateFn!.hasAttributes = false;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify attributes were removed
    expect(div.getAttribute("data-testid")).toBeNull();
    expect(div.getAttribute("data-value")).toBeNull();
    expect(div.getAttribute("aria-label")).toBeNull();
  });

  it("should patch element by updating data/aria attributes", async () => {
    const container = document.createElement("div");
    let stateFn: { version: number } | undefined;

    const App = () => {
      const state = createState({ version: 1 });
      stateFn = state;
      return () =>
        state.version === 1
          ? jsx("div", {
              "data-testid": "old-id",
              "data-value": "old-value",
              "aria-label": "Old label",
            })
          : jsx("div", {
              "data-testid": "new-id",
              "data-value": "new-value",
              "aria-label": "New label",
            });
    };

    render(jsx(App, {}), container);

    const div = container.children[0] as HTMLElement;

    // Verify initial attributes
    expect(div.getAttribute("data-testid")).toBe("old-id");
    expect(div.getAttribute("data-value")).toBe("old-value");
    expect(div.getAttribute("aria-label")).toBe("Old label");

    // Trigger patch to update attributes
    stateFn!.version = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify attributes were updated
    expect(div.getAttribute("data-testid")).toBe("new-id");
    expect(div.getAttribute("data-value")).toBe("new-value");
    expect(div.getAttribute("aria-label")).toBe("New label");
  });

  it("should patch element by updating event listeners", async () => {
    const container = document.createElement("div");
    let stateFn: { version: number } | undefined;

    const oldHandler = vi.fn();
    const newHandler = vi.fn();

    const App = () => {
      const state = createState({ version: 1 });
      stateFn = state;
      return () =>
        jsx("button", {
          onClick: state.version === 1 ? oldHandler : newHandler,
        });
    };

    render(jsx(App, {}), container);

    const button = container.children[0] as HTMLButtonElement;

    // Trigger click to verify old handler works
    button.click();
    expect(oldHandler).toHaveBeenCalledTimes(1);
    expect(newHandler).toHaveBeenCalledTimes(0);

    // Trigger patch to update event listener
    stateFn!.version = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Trigger click again
    button.click();

    // Verify old handler was not called again and new handler was called
    expect(oldHandler).toHaveBeenCalledTimes(1);
    expect(newHandler).toHaveBeenCalledTimes(1);
  });

  it("should patch complex nested UI structure", async () => {
    const container = document.createElement("div");
    let stateFn: { version: number } | undefined;

    const App = () => {
      const state = createState({ version: 1 });
      stateFn = state;
      return () =>
        state.version === 1
          ? jsx("div", {
              className: "app",
              children: [
                jsx("header", {
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
                }),
                jsx("main", {
                  className: "content",
                  children: [
                    jsx("p", { children: ["Paragraph 1"] }),
                    jsx("p", { children: ["Paragraph 2"] }),
                  ],
                }),
              ],
            })
          : jsx("div", {
              className: "app-updated",
              children: [
                jsx("header", {
                  className: "header-updated",
                  children: [
                    jsx("h1", { children: ["New Title"] }),
                    jsx("nav", {
                      children: [
                        jsx("a", { href: "#home", children: ["Home"] }),
                        jsx("a", { href: "#about", children: ["About"] }),
                        jsx("a", { href: "#contact", children: ["Contact"] }),
                      ],
                    }),
                  ],
                }),
                jsx("main", {
                  className: "content",
                  children: [
                    jsx("p", { children: ["Updated Paragraph 1"] }),
                    jsx("div", { children: ["New div element"] }),
                    jsx("p", { children: ["Paragraph 3"] }),
                  ],
                }),
              ],
            });
    };

    render(jsx(App, {}), container);

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

    // Trigger patch
    stateFn!.version = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

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

  it("should patch nested elements independently", async () => {
    const container = document.createElement("div");
    let stateFn: { sidebarVersion: number; contentVersion: number } | undefined;

    const App = () => {
      const state = createState({ sidebarVersion: 1, contentVersion: 1 });
      stateFn = state;
      return () =>
        jsx("div", {
          className: "layout",
          children: [
            state.sidebarVersion === 1
              ? jsx("aside", {
                  className: "sidebar",
                  children: [
                    jsx("div", { className: "widget", children: ["Widget 1"] }),
                    jsx("div", { className: "widget", children: ["Widget 2"] }),
                  ],
                })
              : jsx("aside", {
                  className: "sidebar-updated",
                  children: [
                    jsx("div", {
                      className: "widget",
                      children: ["Widget 1 Updated"],
                    }),
                    jsx("div", { className: "widget", children: ["Widget 2"] }),
                    jsx("div", { className: "widget", children: ["Widget 3"] }),
                  ],
                }),
            state.contentVersion === 1
              ? jsx("main", {
                  children: [
                    jsx("article", {
                      children: [
                        jsx("h2", { children: ["Article Title"] }),
                        jsx("p", { children: ["Article content"] }),
                      ],
                    }),
                  ],
                })
              : jsx("main", {
                  children: [
                    jsx("article", {
                      children: [
                        jsx("h2", { children: ["Updated Article Title"] }),
                        jsx("p", { children: ["Updated article content"] }),
                        jsx("footer", { children: ["Article footer"] }),
                      ],
                    }),
                  ],
                }),
          ],
        });
    };

    render(jsx(App, {}), container);

    const layout = container.children[0] as HTMLElement;
    const initialSidebar = layout.children[0] as HTMLElement;
    const initialMain = layout.children[1] as HTMLElement;

    // First patch: Update only the sidebar
    stateFn!.sidebarVersion = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

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
    stateFn!.contentVersion = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

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

  it("should handle multiple sequential patches", async () => {
    const container = document.createElement("div");
    let stateFn: { count: number } | undefined;

    const App = () => {
      const state = createState({ count: 0 });
      stateFn = state;
      return () =>
        jsx("div", {
          className: "counter",
          children: [
            jsx("span", { children: [`Count: ${state.count}`] }),
            jsx("button", {
              children: [state.count < 3 ? "Increment" : "Reset"],
            }),
          ],
        });
    };

    render(jsx(App, {}), container);

    const counterDiv = container.children[0] as HTMLElement;

    // Verify initial state
    expect(counterDiv.children[0].textContent).toBe("Count: 0");

    // Patch 1: Update count to 1
    stateFn!.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(counterDiv.children[0].textContent).toBe("Count: 1");

    // Patch 2: Update count to 2
    stateFn!.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(counterDiv.children[0].textContent).toBe("Count: 2");

    // Patch 3: Update count to 3 and change button text
    stateFn!.count = 3;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(counterDiv.children[0].textContent).toBe("Count: 3");
    expect(counterDiv.children[1].textContent).toBe("Reset");

    // Patch 4: Reset to 0 and add a new element
    stateFn!.count = 0;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(counterDiv.children[0].textContent).toBe("Count: 0");
    expect(counterDiv.children[1].textContent).toBe("Increment");
  });

  it("should patch deeply nested child independently", async () => {
    const container = document.createElement("div");
    let stateFn: { version: number } | undefined;

    const App = () => {
      const state = createState({ version: 1 });
      stateFn = state;
      return () =>
        jsx("div", {
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
                          children: [
                            state.version === 1
                              ? "Deep content"
                              : "Updated deep content",
                          ],
                          id: state.version === 1 ? "target" : "target-updated",
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
    };

    render(jsx(App, {}), container);

    const root = container.children[0] as HTMLElement;

    // Navigate to the deep element
    const level1 = root.children[0] as HTMLElement;
    const level2 = level1.children[0] as HTMLElement;
    const level3 = level2.children[0] as HTMLElement;
    const targetSpan = level3.children[0] as HTMLElement;

    // Verify initial state
    expect(targetSpan.textContent).toBe("Deep content");
    expect(targetSpan.id).toBe("target");

    // Trigger patch
    stateFn!.version = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the deep element was updated
    expect(targetSpan.textContent).toBe("Updated deep content");
    expect(targetSpan.id).toBe("target-updated");

    // Verify siblings remained unchanged
    expect(level2.children[1].textContent).toBe("Sibling at level-3");
    expect(level1.children[1].textContent).toBe("Sibling at level-2");
    expect(root.children[1].textContent).toBe("Sibling at level-1");
  });
});

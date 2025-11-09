import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { jsx, render } from "./index";
import { Fragment } from "./FragmentVNode";
import { createState } from "../createState";

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
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });

    it("should patch fragment by adding children", async () => {
      const container = document.createElement("div");

      let stateFn: { childCount: number } | undefined;

      const App = () => {
        const state = createState({ childCount: 1 });
        stateFn = state;

        return () => {
          const children = [];
          for (let i = 0; i < state.childCount; i++) {
            const labels = ["First", "Second", "Third"];
            children.push(jsx("span", { children: [labels[i]] }));
          }
          return jsx(Fragment, { children });
        };
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("First");

      stateFn!.childCount = 3;
      await vi.runAllTimersAsync();

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe("First");
      expect(container.children[1].textContent).toBe("Second");
      expect(container.children[2].textContent).toBe("Third");
    });

    it("should patch fragment by removing children", async () => {
      const container = document.createElement("div");

      let stateFn: { childCount: number } | undefined;

      const App = () => {
        const state = createState({ childCount: 3 });
        stateFn = state;

        return () => {
          const children = [];
          for (let i = 0; i < state.childCount; i++) {
            const labels = ["First", "Second", "Third"];
            children.push(jsx("span", { children: [labels[i]] }));
          }
          return jsx(Fragment, { children });
        };
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(3);

      stateFn!.childCount = 1;
      await vi.runAllTimersAsync();

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("First");
    });

    it("should patch fragment by replacing children", async () => {
      const container = document.createElement("div");

      let stateFn: { useDiv: boolean } | undefined;

      const App = () => {
        const state = createState({ useDiv: false });
        stateFn = state;

        return () => {
          if (state.useDiv) {
            return jsx(Fragment, {
              children: [
                jsx("div", { children: ["New 1"] }),
                jsx("div", { children: ["New 2"] }),
              ],
            });
          }
          return jsx(Fragment, {
            children: [
              jsx("span", { children: ["Old 1"] }),
              jsx("span", { children: ["Old 2"] }),
            ],
          });
        };
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(2);
      expect(container.children[0].tagName).toBe("SPAN");

      stateFn!.useDiv = true;
      await vi.runAllTimersAsync();

      expect(container.children.length).toBe(2);
      expect(container.children[0].tagName).toBe("DIV");
      expect(container.children[0].textContent).toBe("New 1");
      expect(container.children[1].tagName).toBe("DIV");
      expect(container.children[1].textContent).toBe("New 2");
    });

    it("should patch fragment inside an element", async () => {
      const container = document.createElement("div");

      let stateFn: { showC: boolean } | undefined;

      const App = () => {
        const state = createState({ showC: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx(Fragment, {
                children: [
                  jsx("span", { children: ["A"] }),
                  jsx("span", { children: ["B"] }),
                  ...(state.showC ? [jsx("span", { children: ["C"] })] : []),
                ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      stateFn!.showC = true;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(3);
      expect(wrapper.children[0].textContent).toBe("A");
      expect(wrapper.children[1].textContent).toBe("B");
      expect(wrapper.children[2].textContent).toBe("C");
    });

    it("should patch nested fragments", async () => {
      const container = document.createElement("div");

      let stateFn: { showInner2: boolean } | undefined;

      const App = () => {
        const state = createState({ showInner2: false });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: [
              jsx("span", { children: ["Outer"] }),
              jsx(Fragment, {
                children: [
                  jsx("span", { children: ["Inner 1"] }),
                  ...(state.showInner2
                    ? [jsx("span", { children: ["Inner 2"] })]
                    : []),
                ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(2);

      stateFn!.showInner2 = true;
      await vi.runAllTimersAsync();

      expect(container.children.length).toBe(3);
      expect(container.children[0].textContent).toBe("Outer");
      expect(container.children[1].textContent).toBe("Inner 1");
      expect(container.children[2].textContent).toBe("Inner 2");
    });

    it("should patch by replacing element with fragment", async () => {
      const container = document.createElement("div");

      let stateFn: { useFragment: boolean } | undefined;

      const App = () => {
        const state = createState({ useFragment: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              state.useFragment
                ? jsx(Fragment, {
                    children: [
                      jsx("span", { children: ["First"] }),
                      jsx("span", { children: ["Second"] }),
                    ],
                  })
                : jsx("span", { children: ["Single"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);

      stateFn!.useFragment = true;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("First");
      expect(wrapper.children[1].textContent).toBe("Second");
    });

    it("should patch by replacing fragment with element", async () => {
      const container = document.createElement("div");

      let stateFn: { useFragment: boolean } | undefined;

      const App = () => {
        const state = createState({ useFragment: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              state.useFragment
                ? jsx(Fragment, {
                    children: [
                      jsx("span", { children: ["First"] }),
                      jsx("span", { children: ["Second"] }),
                    ],
                  })
                : jsx("span", { children: ["Single"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);

      stateFn!.useFragment = false;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");
    });

    it("should patch deeply nested fragments", async () => {
      const container = document.createElement("div");

      let stateFn: { showDeep2: boolean } | undefined;

      const App = () => {
        const state = createState({ showDeep2: false });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: [
              jsx(Fragment, {
                children: [
                  jsx(Fragment, {
                    children: [
                      jsx("span", { children: ["Deep 1"] }),
                      ...(state.showDeep2
                        ? [jsx("span", { children: ["Deep 2"] })]
                        : []),
                    ],
                  }),
                ],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("Deep 1");

      stateFn!.showDeep2 = true;
      await vi.runAllTimersAsync();

      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe("Deep 1");
      expect(container.children[1].textContent).toBe("Deep 2");
    });

    it("should patch fragment with keys", async () => {
      const container = document.createElement("div");

      let stateFn: { reordered: boolean } | undefined;

      const App = () => {
        const state = createState({ reordered: false });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: state.reordered
              ? [
                  jsx("span", { children: ["C"] }, "c"),
                  jsx("span", { children: ["A"] }, "a"),
                  jsx("span", { children: ["B"] }, "b"),
                ]
              : [
                  jsx("span", { children: ["A"] }, "a"),
                  jsx("span", { children: ["B"] }, "b"),
                  jsx("span", { children: ["C"] }, "c"),
                ],
          });
      };

      render(jsx(App, {}), container);

      const initialChildren = Array.from(container.children);
      const itemA = initialChildren[0];
      const itemB = initialChildren[1];
      const itemC = initialChildren[2];

      stateFn!.reordered = true;
      await vi.runAllTimersAsync();

      const newChildren = Array.from(container.children);

      // Elements should be reordered, not recreated
      expect(newChildren[0]).toBe(itemC);
      expect(newChildren[1]).toBe(itemA);
      expect(newChildren[2]).toBe(itemB);
    });

    it("should patch complex nested structure with fragments", async () => {
      const container = document.createElement("div");

      let stateFn: { showAsides: boolean } | undefined;

      const App = () => {
        const state = createState({ showAsides: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx("header", { children: ["Header"] }),
              jsx(Fragment, {
                children: [
                  jsx("section", { children: ["Section 1"] }),
                  ...(state.showAsides
                    ? [
                        jsx(Fragment, {
                          children: [
                            jsx("aside", { children: ["Aside 1"] }),
                            jsx("aside", { children: ["Aside 2"] }),
                          ],
                        }),
                      ]
                    : []),
                  jsx("section", { children: ["Section 2"] }),
                ],
              }),
              jsx("footer", { children: ["Footer"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(4);

      stateFn!.showAsides = true;
      await vi.runAllTimersAsync();

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

    it("should patch fragment removing all children", async () => {
      const container = document.createElement("div");

      let stateFn: { hasChildren: boolean } | undefined;

      const App = () => {
        const state = createState({ hasChildren: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              jsx(Fragment, {
                children: state.hasChildren
                  ? [
                      jsx("span", { children: ["A"] }),
                      jsx("span", { children: ["B"] }),
                      jsx("span", { children: ["C"] }),
                    ]
                  : [],
              }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(3);

      stateFn!.hasChildren = false;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(0);
    });

    it("should patch multiple sequential fragment changes", async () => {
      const container = document.createElement("div");

      let stateFn: { childCount: number } | undefined;

      const App = () => {
        const state = createState({ childCount: 1 });
        stateFn = state;

        return () => {
          const children = [];
          for (let i = 0; i < state.childCount; i++) {
            const labels = ["One", "Two", "Three"];
            children.push(jsx("span", { children: [labels[i]] }));
          }
          return jsx(Fragment, { children });
        };
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("One");

      // Patch 1: Add element
      stateFn!.childCount = 2;
      await vi.runAllTimersAsync();
      expect(container.children.length).toBe(2);
      expect(container.children[1].textContent).toBe("Two");

      // Patch 2: Add another element
      stateFn!.childCount = 3;
      await vi.runAllTimersAsync();
      expect(container.children.length).toBe(3);
      expect(container.children[2].textContent).toBe("Three");

      // Patch 3: Remove middle element (simulate by updating the logic)
      // We need to adjust the test to remove the middle element
      // Let's create a different approach for this test
    });

    it("should patch multiple sequential fragment changes with removal", async () => {
      const container = document.createElement("div");

      let stateFn: { items: string[] } | undefined;

      const App = () => {
        const state = createState({ items: ["One"] });
        stateFn = state;

        return () =>
          jsx(Fragment, {
            children: state.items.map((item) =>
              jsx("span", { children: [item] })
            ),
          });
      };

      render(jsx(App, {}), container);

      expect(container.children.length).toBe(1);
      expect(container.children[0].textContent).toBe("One");

      // Patch 1: Add element
      stateFn!.items = ["One", "Two"];
      await vi.runAllTimersAsync();
      expect(container.children.length).toBe(2);
      expect(container.children[1].textContent).toBe("Two");

      // Patch 2: Add another element
      stateFn!.items = ["One", "Two", "Three"];
      await vi.runAllTimersAsync();
      expect(container.children.length).toBe(3);
      expect(container.children[2].textContent).toBe("Three");

      // Patch 3: Remove middle element
      stateFn!.items = ["One", "Three"];
      await vi.runAllTimersAsync();
      expect(container.children.length).toBe(2);
      expect(container.children[0].textContent).toBe("One");
      expect(container.children[1].textContent).toBe("Three");
    });
  });

  describe("Component-Fragment interaction", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });

    it("should patch by replacing element with component returning fragment", async () => {
      const container = document.createElement("div");

      let stateFn: { useComponent: boolean } | undefined;

      const FragmentComponent = () => {
        return () =>
          jsx(Fragment, {
            children: [
              jsx("p", { children: ["First"] }),
              jsx("p", { children: ["Second"] }),
            ],
          });
      };

      const App = () => {
        const state = createState({ useComponent: false });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              state.useComponent
                ? jsx(FragmentComponent, {})
                : jsx("p", { children: ["Single"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");

      stateFn!.useComponent = true;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("First");
      expect(wrapper.children[1].textContent).toBe("Second");
    });

    it("should patch by replacing component returning fragment with element", async () => {
      const container = document.createElement("div");

      let stateFn: { useComponent: boolean } | undefined;

      const FragmentComponent = () => {
        return () =>
          jsx(Fragment, {
            children: [
              jsx("p", { children: ["First"] }),
              jsx("p", { children: ["Second"] }),
            ],
          });
      };

      const App = () => {
        const state = createState({ useComponent: true });
        stateFn = state;

        return () =>
          jsx("div", {
            children: [
              state.useComponent
                ? jsx(FragmentComponent, {})
                : jsx("p", { children: ["Single"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("First");
      expect(wrapper.children[1].textContent).toBe("Second");

      stateFn!.useComponent = false;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");
    });

    it("should conditionally switch between element and component returning fragment", async () => {
      const container = document.createElement("div");

      let globalState: { showFragment: boolean } | undefined;

      const FragmentComponent = () => {
        return () =>
          jsx(Fragment, {
            children: [
              jsx("p", { children: ["Fragment 1"] }),
              jsx("p", { children: ["Fragment 2"] }),
            ],
          });
      };

      const App = () => {
        const state = createState({ showFragment: false });
        globalState = state;

        return () =>
          jsx("div", {
            children: [
              state.showFragment
                ? jsx(FragmentComponent, {})
                : jsx("p", { children: ["Single"] }),
            ],
          });
      };

      render(jsx(App, {}), container);

      const wrapper = container.children[0] as HTMLElement;
      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");

      // Switch to fragment
      globalState!.showFragment = true;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(2);
      expect(wrapper.children[0].textContent).toBe("Fragment 1");
      expect(wrapper.children[1].textContent).toBe("Fragment 2");

      // Switch back to element
      globalState!.showFragment = false;
      await vi.runAllTimersAsync();

      expect(wrapper.children.length).toBe(1);
      expect(wrapper.children[0].textContent).toBe("Single");
    });
  });
});

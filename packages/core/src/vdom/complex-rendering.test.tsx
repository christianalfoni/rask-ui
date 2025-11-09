import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { jsx, render } from "./index";
import { createState } from "../createState";
import { Fragment } from "./FragmentVNode";

describe("Complex Rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should handle deeply nested elements, fragments and components", () => {
    const NestedComponent = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx("span", { children: "Nested" }),
            jsx("strong", { children: "Component" }),
          ],
        });
    };

    const MiddleComponent = () => {
      return () =>
        jsx("div", {
          class: "middle",
          children: [
            jsx("p", { children: "Fragment in middle" }),
            jsx(NestedComponent, {}),
            jsx("ul", {
              children: [
                jsx("li", { children: "Item 1" }),
                jsx("li", { children: "Item 2" }),
              ],
            }),
          ],
        });
    };

    const App = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx("header", {
              children: [
                jsx("h1", { children: "Header" }),
                jsx(MiddleComponent, {}),
              ],
            }),
            jsx("main", {
              children: jsx("section", {
                children: jsx("div", { children: jsx(NestedComponent, {}) }),
              }),
            }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    expect(container.querySelector("header h1")?.textContent).toBe("Header");
    expect(container.querySelector(".middle p")?.textContent).toBe(
      "Fragment in middle"
    );
    expect(container.querySelector(".middle span")?.textContent).toBe("Nested");
    expect(container.querySelector(".middle strong")?.textContent).toBe(
      "Component"
    );
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(container.querySelector("main span")?.textContent).toBe("Nested");
    expect(container.querySelector("main strong")?.textContent).toBe(
      "Component"
    );
  });

  it("should handle multiple fragments and components at same level", () => {
    const Component1 = () => () => jsx("span", { children: "C1" });
    const Component2 = () => () => jsx("span", { children: "C2" });
    const Component3 = () => () => jsx("span", { children: "C3" });

    const App = () => {
      return () =>
        jsx("div", {
          children: [
            jsx(Component1, {}),
            jsx("strong", { children: "Between" }),
            jsx(Component2, {}),
            jsx("em", { children: "Middle" }),
            jsx(Component3, {}),
            jsx("i", { children: "End" }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(3);
    expect(spans[0].textContent).toBe("C1");
    expect(spans[1].textContent).toBe("C2");
    expect(spans[2].textContent).toBe("C3");
    expect(container.querySelector("strong")?.textContent).toBe("Between");
    expect(container.querySelector("em")?.textContent).toBe("Middle");
    expect(container.querySelector("i")?.textContent).toBe("End");
  });

  it("should update multiple nested components when state changes", async () => {
    let globalCount: { value: number } | undefined;

    const Counter = () => {
      return () =>
        jsx("span", { class: "counter", children: globalCount!.value });
    };

    const DoubleCounter = () => {
      return () =>
        jsx("span", { class: "double", children: globalCount!.value * 2 });
    };

    const NestedCounters = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx(Counter, {}),
            jsx("div", {
              children: [jsx(DoubleCounter, {}), jsx(Counter, {})],
            }),
          ],
        });
    };

    const App = () => {
      const state = createState({ value: 0 });
      globalCount = state;

      return () =>
        jsx("div", {
          children: [
            jsx(NestedCounters, {}),
            jsx("section", {
              children: [
                jsx(DoubleCounter, {}),
                jsx(Counter, {}),
                jsx(NestedCounters, {}),
              ],
            }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    // Initial state: count = 0
    let counters = container.querySelectorAll(".counter");
    let doubles = container.querySelectorAll(".double");

    expect(counters.length).toBe(5);
    expect(doubles.length).toBe(3);

    counters.forEach((counter) => {
      expect(counter.textContent).toBe("0");
    });
    doubles.forEach((double) => {
      expect(double.textContent).toBe("0");
    });

    // Update state to 5
    globalCount!.value = 5;
    await vi.runAllTimersAsync();

    counters = container.querySelectorAll(".counter");
    doubles = container.querySelectorAll(".double");

    counters.forEach((counter) => {
      expect(counter.textContent).toBe("5");
    });
    doubles.forEach((double) => {
      expect(double.textContent).toBe("10");
    });

    // Update state to 10
    globalCount!.value = 10;
    await vi.runAllTimersAsync();

    counters = container.querySelectorAll(".counter");
    doubles = container.querySelectorAll(".double");

    counters.forEach((counter) => {
      expect(counter.textContent).toBe("10");
    });
    doubles.forEach((double) => {
      expect(double.textContent).toBe("20");
    });
  });

  it("should handle components that change their return structure based on state", async () => {
    let globalState: { mode: "list" | "grid" | "table" } | undefined;

    const DynamicComponent = () => {
      return () => {
        const currentMode = globalState!.mode;

        if (currentMode === "list") {
          return jsx("ul", {
            class: "list",
            children: [
              jsx("li", { children: "Item 1" }),
              jsx("li", { children: "Item 2" }),
              jsx("li", { children: "Item 3" }),
            ],
          });
        }

        if (currentMode === "grid") {
          return jsx("div", {
            class: "grid",
            children: [
              jsx("div", { class: "card", children: "Card 1" }),
              jsx("div", { class: "card", children: "Card 2" }),
              jsx("div", { class: "card", children: "Card 3" }),
            ],
          });
        }

        return jsx("table", {
          class: "table",
          children: jsx("tbody", {
            children: jsx("tr", {
              children: [
                jsx("td", { children: "Cell 1" }),
                jsx("td", { children: "Cell 2" }),
                jsx("td", { children: "Cell 3" }),
              ],
            }),
          }),
        });
      };
    };

    const NestedDynamic = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx("h2", { children: `Mode: ${globalState!.mode}` }),
            jsx(DynamicComponent, {}),
          ],
        });
    };

    const App = () => {
      const state = createState<{ mode: "list" | "grid" | "table" }>({
        mode: "list",
      });
      globalState = state;

      return () =>
        jsx("div", {
          children: [
            jsx(NestedDynamic, {}),
            jsx("footer", {
              children: jsx(DynamicComponent, {}),
            }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    // Initial state: list mode
    expect(container.querySelector("h2")?.textContent).toBe("Mode: list");
    expect(container.querySelectorAll(".list").length).toBe(2);
    expect(container.querySelectorAll("li").length).toBe(6);
    expect(container.querySelector(".grid")).toBeNull();
    expect(container.querySelector(".table")).toBeNull();

    // Switch to grid mode
    globalState!.mode = "grid";
    await vi.runAllTimersAsync();

    expect(container.querySelector("h2")?.textContent).toBe("Mode: grid");
    expect(container.querySelectorAll(".grid").length).toBe(2);
    expect(container.querySelectorAll(".card").length).toBe(6);
    expect(container.querySelector(".list")).toBeNull();
    expect(container.querySelector(".table")).toBeNull();

    // Switch to table mode
    globalState!.mode = "table";
    await vi.runAllTimersAsync();
    return;

    expect(container.querySelector("h2")?.textContent).toBe("Mode: table");
    expect(container.querySelectorAll(".table").length).toBe(2);
    expect(container.querySelectorAll("td").length).toBe(6);
    expect(container.querySelector(".list")).toBeNull();
    expect(container.querySelector(".grid")).toBeNull();

    // Switch back to list
    globalState!.mode = "list";
    await vi.runAllTimersAsync();

    expect(container.querySelector("h2")?.textContent).toBe("Mode: list");
    expect(container.querySelectorAll(".list").length).toBe(2);
    expect(container.querySelectorAll("li").length).toBe(6);
  });

  it("should handle deeply nested state changes with fragments", async () => {
    let globalUser: { name: string; age: number; role: string } | undefined;

    const UserName = () => {
      return () => jsx("span", { class: "name", children: globalUser!.name });
    };

    const UserAge = () => {
      return () => jsx("span", { class: "age", children: globalUser!.age });
    };

    const UserRole = () => {
      return () => jsx("span", { class: "role", children: globalUser!.role });
    };

    const UserInfo = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx(UserName, {}),
            jsx("div", {
              class: "details",
              children: [jsx(UserAge, {}), jsx(UserRole, {})],
            }),
          ],
        });
    };

    const UserCard = () => {
      return () =>
        jsx("div", {
          class: "card",
          children: [
            jsx("h3", { children: "User Profile" }),
            jsx(UserInfo, {}),
            jsx("footer", { children: ["Role: ", jsx(UserRole, {})] }),
          ],
        });
    };

    const App = () => {
      const state = createState({ name: "John", age: 30, role: "admin" });
      globalUser = state;

      return () =>
        jsx(Fragment, {
          children: [
            jsx(UserCard, {}),
            jsx("aside", {
              children: [
                jsx(UserName, {}),
                " is ",
                jsx(UserAge, {}),
                " years old",
              ],
            }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    expect(container.querySelector(".name")?.textContent).toBe("John");
    expect(container.querySelectorAll(".age")[0].textContent).toBe("30");
    expect(container.querySelectorAll(".role").length).toBe(2);
    expect(container.querySelector("aside")?.textContent).toBe(
      "John is 30 years old"
    );

    // Update user
    globalUser!.name = "Jane";
    globalUser!.age = 25;
    globalUser!.role = "user";
    await vi.runAllTimersAsync();

    expect(container.querySelector(".name")?.textContent).toBe("Jane");
    expect(container.querySelectorAll(".age")[0].textContent).toBe("25");
    const roles = container.querySelectorAll(".role");
    roles.forEach((role) => {
      expect(role.textContent).toBe("user");
    });
    expect(container.querySelector("aside")?.textContent).toBe(
      "Jane is 25 years old"
    );

    // Update user again
    globalUser!.name = "Bob";
    globalUser!.age = 40;
    globalUser!.role = "moderator";
    await vi.runAllTimersAsync();

    expect(container.querySelector(".name")?.textContent).toBe("Bob");
    expect(container.querySelectorAll(".age")[0].textContent).toBe("40");
    const newRoles = container.querySelectorAll(".role");
    newRoles.forEach((role) => {
      expect(role.textContent).toBe("moderator");
    });
    expect(container.querySelector("aside")?.textContent).toBe(
      "Bob is 40 years old"
    );
  });

  it("should handle mixed nested updates with conditional rendering", async () => {
    let globalState: { showDetails: boolean; count: number } | undefined;

    const Details = () => {
      return () =>
        jsx(Fragment, {
          children: [
            jsx("p", { children: `Count: ${globalState!.count}` }),
            jsx("p", { children: `Double: ${globalState!.count * 2}` }),
          ],
        });
    };

    const Card = () => {
      return () =>
        jsx("div", {
          class: "card",
          children: [
            jsx("h4", { children: `Card ${globalState!.count}` }),
            globalState!.showDetails
              ? jsx(Details, {})
              : jsx("p", { children: "No details" }),
          ],
        });
    };

    const App = () => {
      const state = createState({ showDetails: false, count: 0 });
      globalState = state;

      return () =>
        jsx(Fragment, {
          children: [
            jsx(Card, {}),
            jsx("div", {
              children: [
                jsx(Card, {}),
                jsx("span", { children: `Total: ${state.count}` }),
              ],
            }),
          ],
        });
    };

    const container = document.createElement("div");
    render(jsx(App, {}), container);

    // Initial state
    expect(container.querySelectorAll(".card h4")[0].textContent).toBe(
      "Card 0"
    );
    expect(container.querySelectorAll(".card h4")[1].textContent).toBe(
      "Card 0"
    );
    expect(container.querySelectorAll("p").length).toBe(2);
    expect(container.querySelectorAll("p")[0].textContent).toBe("No details");
    expect(container.querySelector("span")?.textContent).toBe("Total: 0");

    // Show details
    globalState!.showDetails = true;
    await vi.runAllTimersAsync();

    expect(container.querySelectorAll("p").length).toBe(4);
    expect(container.querySelectorAll("p")[0].textContent).toBe("Count: 0");
    expect(container.querySelectorAll("p")[1].textContent).toBe("Double: 0");

    // Increment count
    globalState!.count = 5;
    await vi.runAllTimersAsync();

    expect(container.querySelectorAll(".card h4")[0].textContent).toBe(
      "Card 5"
    );
    expect(container.querySelectorAll(".card h4")[1].textContent).toBe(
      "Card 5"
    );
    expect(container.querySelectorAll("p")[0].textContent).toBe("Count: 5");
    expect(container.querySelectorAll("p")[1].textContent).toBe("Double: 10");
    expect(container.querySelector("span")?.textContent).toBe("Total: 5");

    // Hide details and increment
    globalState!.showDetails = false;
    globalState!.count = 10;
    await vi.runAllTimersAsync();

    expect(container.querySelectorAll(".card h4")[0].textContent).toBe(
      "Card 10"
    );
    expect(container.querySelectorAll("p").length).toBe(2);
    expect(container.querySelectorAll("p")[0].textContent).toBe("No details");
    expect(container.querySelector("span")?.textContent).toBe("Total: 10");
  });
});

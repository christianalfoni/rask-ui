import { describe, it, expect } from "vitest";
import { createContext } from "../createContext";
import { render } from "../";

describe("createContext", () => {
  it("should create a context with use and inject methods", () => {
    const MyContext = createContext(() => ({ value: "test" }));
    expect(typeof MyContext.use).toBe("function");
    expect(typeof MyContext.inject).toBe("function");
  });

  it("should allow setting and getting context values", () => {
    const ThemeContext = createContext(() => ({ theme: "dark" }));

    function Parent() {
      ThemeContext.inject();
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.use();
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark");

    document.body.removeChild(container);
  });

  it("should traverse parent components to find context", () => {
    const ThemeContext = createContext(() => ({ theme: "light" }));

    function GrandParent() {
      ThemeContext.inject();
      return () => <Parent />;
    }

    function Parent() {
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.use();
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<GrandParent />, container);

    expect(container.textContent).toContain("light");

    document.body.removeChild(container);
  });

  it("should throw error when context is not found", () => {
    const ThemeContext = createContext(() => ({ theme: "dark" }));

    function Child() {
      expect(() => {
        ThemeContext.use();
      }).toThrow("There is no parent context");
      return () => <div>Child</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Child />, container);

    document.body.removeChild(container);
  });

  it("should throw error when setting context outside component", () => {
    const ThemeContext = createContext(() => ({ theme: "dark" }));

    expect(() => {
      ThemeContext.inject();
    }).toThrow("Only use useInjectContext in component setup");
  });

  it("should throw error when getting context outside component", () => {
    const ThemeContext = createContext(() => ({ theme: "dark" }));

    expect(() => {
      ThemeContext.use();
    }).toThrow("Only use useContext in component setup");
  });

  it("should allow overriding context in nested components", () => {
    const ThemeContext = createContext((theme: string) => ({ theme }));

    function GrandParent() {
      ThemeContext.inject("light");
      return () => (
        <div>
          <Parent />
          <ChildOfGrandParent />
        </div>
      );
    }

    function Parent() {
      ThemeContext.inject("dark");
      return () => <ChildOfParent />;
    }

    function ChildOfParent() {
      const theme = ThemeContext.use();
      return () => <div class="child-of-parent">{theme.theme}</div>;
    }

    function ChildOfGrandParent() {
      const theme = ThemeContext.use();
      return () => <div class="child-of-grandparent">{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<GrandParent />, container);

    const childOfParent = document.querySelector(".child-of-parent");
    const childOfGrandParent = document.querySelector(".child-of-grandparent");

    expect(childOfParent?.textContent).toBe("dark");
    expect(childOfGrandParent?.textContent).toBe("light");

    document.body.removeChild(container);
  });

  it("should support multiple different contexts", () => {
    const ThemeContext = createContext(() => ({ theme: "dark" }));
    const UserContext = createContext(() => ({ name: "Alice" }));

    function Parent() {
      ThemeContext.inject();
      UserContext.inject();
      return () => <Child />;
    }

    function Child() {
      const theme = ThemeContext.use();
      const user = UserContext.use();
      return () => <div>{`${theme.theme} - ${user.name}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark - Alice");

    document.body.removeChild(container);
  });

  it("should handle context values of different types", () => {
    const NumberContext = createContext(() => 42);
    const ArrayContext = createContext(() => ["a", "b", "c"]);

    function Parent() {
      NumberContext.inject();
      ArrayContext.inject();
      return () => <Child />;
    }

    function Child() {
      const num = NumberContext.use();
      const arr = ArrayContext.use();
      return () => <div>{`${num} - ${arr.join(",")}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("42 - a,b,c");

    document.body.removeChild(container);
  });
});

import { describe, it, expect } from "vitest";
import { createContext, useContext, useInjectContext } from "../createContext";
import { render } from "../";

describe("createContext", () => {
  it("should create a context symbol", () => {
    const context = createContext<{ value: string }>();
    expect(typeof context).toBe("symbol");
  });

  it("should allow setting and getting context values", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Parent() {
      const inject = useInjectContext(ThemeContext);
      inject({ theme: "dark" });
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(ThemeContext);
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark");

    document.body.removeChild(container);
  });

  it("should traverse parent components to find context", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      const inject = useInjectContext(ThemeContext);
      inject({ theme: "light" });
      return () => <Parent />;
    }

    function Parent() {
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(ThemeContext);
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<GrandParent />, container);

    expect(container.textContent).toContain("light");

    document.body.removeChild(container);
  });

  it("should throw error when context is not found", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function Child() {
      expect(() => {
        useContext(ThemeContext);
      }).toThrow("There is no parent context");
      return () => <div>Child</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Child />, container);

    document.body.removeChild(container);
  });

  it("should throw error when setting context outside component", () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      const inject = useInjectContext(ThemeContext);
      inject({ theme: "dark" });
    }).toThrow("Only use useInjectContext in component setup");
  });

  it("should throw error when getting context outside component", () => {
    const ThemeContext = createContext<{ theme: string }>();

    expect(() => {
      useContext(ThemeContext);
    }).toThrow("Only use useContext in component setup");
  });

  it("should allow overriding context in nested components", () => {
    const ThemeContext = createContext<{ theme: string }>();

    function GrandParent() {
      const inject = useInjectContext(ThemeContext);
      inject({ theme: "light" });
      return () => (
        <div>
          <Parent />
          <ChildOfGrandParent />
        </div>
      );
    }

    function Parent() {
      const inject = useInjectContext(ThemeContext);
      inject({ theme: "dark" });
      return () => <ChildOfParent />;
    }

    function ChildOfParent() {
      const theme = useContext(ThemeContext);
      return () => <div class="child-of-parent">{theme.theme}</div>;
    }

    function ChildOfGrandParent() {
      const theme = useContext(ThemeContext);
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
    const ThemeContext = createContext<{ theme: string }>();
    const UserContext = createContext<{ name: string }>();

    function Parent() {
      const injectTheme = useInjectContext(ThemeContext);
      const injectUser = useInjectContext(UserContext);
      injectTheme({ theme: "dark" });
      injectUser({ name: "Alice" });
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(ThemeContext);
      const user = useContext(UserContext);
      return () => <div>{`${theme.theme} - ${user.name}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark - Alice");

    document.body.removeChild(container);
  });

  it("should handle context values of different types", () => {
    const NumberContext = createContext<number>();
    const ArrayContext = createContext<string[]>();

    function Parent() {
      const injectNumber = useInjectContext(NumberContext);
      const injectArray = useInjectContext(ArrayContext);
      injectNumber(42);
      injectArray(["a", "b", "c"]);
      return () => <Child />;
    }

    function Child() {
      const num = useContext(NumberContext);
      const arr = useContext(ArrayContext);
      return () => <div>{`${num} - ${arr.join(",")}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("42 - a,b,c");

    document.body.removeChild(container);
  });
});

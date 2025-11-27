import { describe, it, expect } from "vitest";
import { createContext, useContext, useInjectContext } from "../createContext";
import { render } from "../";

describe("createContext", () => {
  it("should create a context hook", () => {
    const useMyContext = createContext(() => ({ value: "test" }));
    expect(typeof useMyContext).toBe("function");
  });

  it("should allow setting and getting context values", () => {
    const useTheme = createContext(() => ({ theme: "dark" }));

    function Parent() {
      useInjectContext(useTheme);
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(useTheme);
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark");

    document.body.removeChild(container);
  });

  it("should traverse parent components to find context", () => {
    const useTheme = createContext(() => ({ theme: "light" }));

    function GrandParent() {
      useInjectContext(useTheme);
      return () => <Parent />;
    }

    function Parent() {
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(useTheme);
      return () => <div>{theme.theme}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<GrandParent />, container);

    expect(container.textContent).toContain("light");

    document.body.removeChild(container);
  });

  it("should throw error when context is not found", () => {
    const useTheme = createContext(() => ({ theme: "dark" }));

    function Child() {
      expect(() => {
        useContext(useTheme);
      }).toThrow("There is no parent context");
      return () => <div>Child</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Child />, container);

    document.body.removeChild(container);
  });

  it("should throw error when setting context outside component", () => {
    const useTheme = createContext(() => ({ theme: "dark" }));

    expect(() => {
      useInjectContext(useTheme);
    }).toThrow("Only use useInjectContext in component setup");
  });

  it("should throw error when getting context outside component", () => {
    const useTheme = createContext(() => ({ theme: "dark" }));

    expect(() => {
      useContext(useTheme);
    }).toThrow("Only use useContext in component setup");
  });

  it("should allow overriding context in nested components", () => {
    const useTheme = createContext((theme: string) => ({ theme }));

    function GrandParent() {
      useInjectContext(useTheme, "light");
      return () => (
        <div>
          <Parent />
          <ChildOfGrandParent />
        </div>
      );
    }

    function Parent() {
      useInjectContext(useTheme, "dark");
      return () => <ChildOfParent />;
    }

    function ChildOfParent() {
      const theme = useContext(useTheme);
      return () => <div class="child-of-parent">{theme.theme}</div>;
    }

    function ChildOfGrandParent() {
      const theme = useContext(useTheme);
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
    const useTheme = createContext(() => ({ theme: "dark" }));
    const useUser = createContext(() => ({ name: "Alice" }));

    function Parent() {
      useInjectContext(useTheme);
      useInjectContext(useUser);
      return () => <Child />;
    }

    function Child() {
      const theme = useContext(useTheme);
      const user = useContext(useUser);
      return () => <div>{`${theme.theme} - ${user.name}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("dark - Alice");

    document.body.removeChild(container);
  });

  it("should handle context values of different types", () => {
    const useNumber = createContext(() => 42);
    const useArray = createContext(() => ["a", "b", "c"]);

    function Parent() {
      useInjectContext(useNumber);
      useInjectContext(useArray);
      return () => <Child />;
    }

    function Child() {
      const num = useContext(useNumber);
      const arr = useContext(useArray);
      return () => <div>{`${num} - ${arr.join(",")}`}</div>;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<Parent />, container);

    expect(container.textContent).toContain("42 - a,b,c");

    document.body.removeChild(container);
  });
});

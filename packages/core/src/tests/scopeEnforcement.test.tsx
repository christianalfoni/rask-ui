import { describe, it, expect } from "vitest";
import { useState } from "../useState";
import { useEffect } from "../useEffect";
import { useDerived } from "../useDerived";
import { render } from "../index";

describe("Scope Enforcement", () => {
  describe("useState", () => {
    it("should allow useState in global scope", () => {
      expect(() => {
        const state = useState({ count: 0 });
      }).not.toThrow();
    });

    it("should allow useState in component setup", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => <div>{state.count}</div>;
      }

      const container = document.createElement("div");
      expect(() => {
        render(<Component />, container);
      }).not.toThrow();
    });

    it("should throw when useState is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - useState in render scope
          expect(() => {
            useState({ nested: 1 });
          }).toThrow("useState cannot be called during render");
          return <div>{state.count}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });
  });

  describe("useEffect", () => {
    it("should throw when useEffect is called outside component setup", () => {
      expect(() => {
        useEffect(() => {
          // Effect logic
        });
      }).toThrow("Only use useEffect in component setup");
    });

    it("should allow useEffect in component setup", () => {
      function Component() {
        const state = useState({ count: 0 });
        let effectRan = false;

        useEffect(() => {
          effectRan = true;
          state.count;
        });

        expect(effectRan).toBe(true);

        return () => <div>{state.count}</div>;
      }

      const container = document.createElement("div");
      expect(() => {
        render(<Component />, container);
      }).not.toThrow();
    });

    it("should throw when useEffect is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - useEffect in render scope
          expect(() => {
            useEffect(() => {
              state.count;
            });
          }).toThrow("Only use useEffect in component setup");
          return <div>{state.count}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });
  });

  describe("useDerived", () => {
    it("should throw when useDerived is called outside component setup", () => {
      expect(() => {
        useDerived({
          doubled: () => 2 * 2,
        });
      }).toThrow("Only use useDerived in component setup");
    });

    it("should allow useDerived in component setup", () => {
      function Component() {
        const state = useState({ count: 5 });
        const computed = useDerived({
          doubled: () => state.count * 2,
        });

        return () => <div>{computed.doubled}</div>;
      }

      const container = document.createElement("div");
      expect(() => {
        render(<Component />, container);
      }).not.toThrow();
    });

    it("should throw when useDerived is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - useDerived in render scope
          expect(() => {
            useDerived({
              doubled: () => state.count * 2,
            });
          }).toThrow("Only use useDerived in component setup");
          return <div>{state.count}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });
  });

  describe("Mixed scenarios", () => {
    it("should allow all reactive primitives in setup but not in render", () => {
      function Component() {
        // All of these should work in setup
        const state = useState({ count: 0 });
        const computed = useDerived({
          doubled: () => state.count * 2,
        });
        useEffect(() => {
          state.count;
        });

        return () => {
          // None of these should work in render
          expect(() => useState({ bad: 1 })).toThrow();
          expect(() => useEffect(() => {})).toThrow();
          expect(() => useDerived({ bad: () => 1 })).toThrow();

          return <div>{computed.doubled}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });

    it("should properly enforce scope in nested renders", () => {
      function Child() {
        const childState = useState({ value: "child" });
        return () => <div>{childState.value}</div>;
      }

      function Parent() {
        const parentState = useState({ value: "parent" });
        return () => {
          // This should fail in render
          expect(() => useState({ bad: 1 })).toThrow();
          return (
            <div>
              {parentState.value}
              <Child />
            </div>
          );
        };
      }

      const container = document.createElement("div");
      render(<Parent />, container);
    });
  });
});

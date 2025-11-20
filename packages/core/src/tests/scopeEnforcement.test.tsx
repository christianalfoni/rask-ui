import { describe, it, expect } from "vitest";
import { useState } from "../useState";
import { useEffect } from "../useEffect";
import { useComputed } from "../useComputed";
import { render } from "../index";

describe("Scope Enforcement", () => {
  describe("createState", () => {
    it("should allow createState in global scope", () => {
      expect(() => {
        const state = useState({ count: 0 });
      }).not.toThrow();
    });

    it("should allow createState in component setup", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => <div>{state.count}</div>;
      }

      const container = document.createElement("div");
      expect(() => {
        render(<Component />, container);
      }).not.toThrow();
    });

    it("should throw when createState is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - createState in render scope
          expect(() => {
            useState({ nested: 1 });
          }).toThrow("createState cannot be called during render");
          return <div>{state.count}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });
  });

  describe("createEffect", () => {
    it("should throw when createEffect is called outside component setup", () => {
      expect(() => {
        useEffect(() => {
          // Effect logic
        });
      }).toThrow("Only use createEffect in component setup");
    });

    it("should allow createEffect in component setup", () => {
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

    it("should throw when createEffect is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - createEffect in render scope
          expect(() => {
            useEffect(() => {
              state.count;
            });
          }).toThrow("Only use createEffect in component setup");
          return <div>{state.count}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });
  });

  describe("createComputed", () => {
    it("should throw when createComputed is called outside component setup", () => {
      expect(() => {
        useComputed({
          doubled: () => 2 * 2,
        });
      }).toThrow("Only use createCleanup in component setup");
    });

    it("should allow createComputed in component setup", () => {
      function Component() {
        const state = useState({ count: 5 });
        const computed = useComputed({
          doubled: () => state.count * 2,
        });

        return () => <div>{computed.doubled}</div>;
      }

      const container = document.createElement("div");
      expect(() => {
        render(<Component />, container);
      }).not.toThrow();
    });

    it("should throw when createComputed is called during render", () => {
      function Component() {
        const state = useState({ count: 0 });
        return () => {
          // This should throw - createComputed in render scope
          expect(() => {
            useComputed({
              doubled: () => state.count * 2,
            });
          }).toThrow("Only use createCleanup in component setup");
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
        const computed = useComputed({
          doubled: () => state.count * 2,
        });
        useEffect(() => {
          state.count;
        });

        return () => {
          // None of these should work in render
          expect(() => useState({ bad: 1 })).toThrow();
          expect(() => useEffect(() => {})).toThrow();
          expect(() => useComputed({ bad: () => 1 })).toThrow();

          return <div>{computed.doubled}</div>;
        };
      }

      const container = document.createElement("div");
      render(<Component />, container);
    });

    it("should allow createState globally but not others", () => {
      // This should work - createState in global scope
      const globalState = useState({ value: 42 });

      // These should fail - createEffect and createComputed require component setup
      expect(() => {
        useEffect(() => {
          globalState.value;
        });
      }).toThrow("Only use createEffect in component setup");

      expect(() => {
        useComputed({
          doubled: () => globalState.value * 2,
        });
      }).toThrow("Only use createCleanup in component setup");
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

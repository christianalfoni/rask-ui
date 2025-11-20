import { describe, it, expect } from "vitest";
import { useView } from "../useView";
import { useState } from "../useState";
import { Observer } from "../observation";
import { render } from "../";

describe("createView", () => {
  it("should merge two plain objects", () => {
    let view: any;

    function Component() {
      const a = { x: 1, y: 2 };
      const b = { z: 3 };
      view = useView(a, b);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);
    expect(view.y).toBe(2);
    expect(view.z).toBe(3);
  });

  it("should allow later arguments to override earlier ones", () => {
    let view: any;

    function Component() {
      const a = { x: 1, y: 2 };
      const b = { y: 3, z: 4 };
      view = useView(a, b);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);
    expect(view.y).toBe(3); // b.y overrides a.y
    expect(view.z).toBe(4);
  });

  it("should maintain reactivity with reactive objects", async () => {
    let view: any;
    let state: any;

    function Component() {
      state = useState({ count: 0 });
      view = useView(state);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    let renderCount = 0;
    let lastValue = 0;

    const observer = new Observer(() => {
      renderCount++;
    });

    const dispose = observer.observe();
    lastValue = view.count; // Track the property
    dispose();

    expect(renderCount).toBe(0);

    state.count = 5;

    // Wait for microtask to process notification
    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(renderCount).toBe(1);
        lastValue = view.count;
        expect(lastValue).toBe(5);
        resolve(undefined);
      });
    });
  });

  it("should merge reactive and plain objects while maintaining reactivity", () => {
    let view: any;
    let state: any;

    function Component() {
      state = useState({ count: 0 });
      const helpers = {
        increment() {
          state.count++;
        },
        decrement() {
          state.count--;
        },
      };
      view = useView(state, helpers);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.count).toBe(0);
    expect(typeof view.increment).toBe("function");
    expect(typeof view.decrement).toBe("function");

    view.increment();
    expect(view.count).toBe(1);

    view.decrement();
    expect(view.count).toBe(0);
  });

  it("should merge multiple reactive objects", () => {
    let view: any;
    let state1: any;
    let state2: any;
    let state3: any;

    function Component() {
      state1 = useState({ count: 0 });
      state2 = useState({ name: "Alice" });
      state3 = useState({ age: 25 });
      view = useView(state1, state2, state3);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.count).toBe(0);
    expect(view.name).toBe("Alice");
    expect(view.age).toBe(25);

    state1.count = 10;
    state2.name = "Bob";
    state3.age = 30;

    expect(view.count).toBe(10);
    expect(view.name).toBe("Bob");
    expect(view.age).toBe(30);
  });

  it("should reflect changes in source objects", () => {
    let view: any;
    let source: any;

    function Component() {
      source = { x: 1 };
      view = useView(source);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);

    source.x = 2;
    expect(view.x).toBe(2);
  });

  it("should handle property override order correctly", () => {
    let view: any;

    function Component() {
      const a = { x: 1, y: 2, z: 3 };
      const b = { y: 20 };
      const c = { z: 30 };
      view = useView(a, b, c);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1); // From a
    expect(view.y).toBe(20); // From b (overrides a)
    expect(view.z).toBe(30); // From c (overrides a)
  });

  it("should only include enumerable properties", () => {
    let view: any;

    function Component() {
      const obj = { x: 1 };
      Object.defineProperty(obj, "hidden", {
        value: 42,
        enumerable: false,
      });
      view = useView(obj);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);
    expect((view as any).hidden).toBeUndefined();
  });

  it("should handle symbol keys", () => {
    let view: any;
    let sym: symbol;

    function Component() {
      sym = Symbol("test");
      const obj = { x: 1, [sym]: "symbol value" };
      view = useView(obj);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);
    expect((view as any)[sym]).toBe("symbol value");
  });

  it("should track dependencies for each property independently", async () => {
    let view: any;
    let state: any;

    function Component() {
      state = useState({ count: 0, name: "Alice" });
      view = useView(state);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    let countRenderCount = 0;
    let nameRenderCount = 0;

    // Observer that only accesses count
    const countObserver = new Observer(() => {
      countRenderCount++;
    });

    const dispose1 = countObserver.observe();
    view.count; // Track count
    dispose1();

    expect(countRenderCount).toBe(0);

    // Change count - should trigger
    state.count = 1;

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(countRenderCount).toBe(1);
        resolve(undefined);
      });
    });

    // Change name - should NOT trigger (not tracked)
    state.name = "Bob";

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(countRenderCount).toBe(1); // Still 1
        resolve(undefined);
      });
    });

    // Now track name with a different observer
    const nameObserver = new Observer(() => {
      nameRenderCount++;
    });

    const dispose2 = nameObserver.observe();
    view.name; // Track name
    dispose2();

    expect(nameRenderCount).toBe(0);

    // Change name - should trigger name observer
    state.name = "Charlie";

    await new Promise((resolve) => {
      queueMicrotask(() => {
        expect(nameRenderCount).toBe(1);
        resolve(undefined);
      });
    });
  });

  it("should return the same value type as source", () => {
    let view: any;

    function Component() {
      const obj = { nums: [1, 2, 3], nested: { x: 1 } };
      view = useView(obj);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(Array.isArray(view.nums)).toBe(true);
    expect(view.nums).toEqual([1, 2, 3]);
    expect(typeof view.nested).toBe("object");
    expect(view.nested.x).toBe(1);
  });

  it("should handle empty merge", () => {
    let view: any;

    function Component() {
      view = useView({});
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(Object.keys(view).length).toBe(0);
  });

  it("should merge single object", () => {
    let view: any;

    function Component() {
      const obj = { x: 1, y: 2 };
      view = useView(obj);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.x).toBe(1);
    expect(view.y).toBe(2);
  });

  it("should maintain function context", () => {
    let view: any;
    let state: any;

    function Component() {
      state = useState({ count: 0 });
      const methods = {
        increment() {
          state.count++;
        },
      };
      view = useView(state, methods);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.count).toBe(0);
    view.increment();
    expect(view.count).toBe(1);
    expect(state.count).toBe(1);
  });

  it("should work with reactive state and computed-like patterns", () => {
    let view: any;
    let state: any;

    function Component() {
      state = useState({ firstName: "John", lastName: "Doe" });
      const computed = {
        get fullName() {
          return `${state.firstName} ${state.lastName}`;
        },
      };
      view = useView(state, computed);
      return () => <div>test</div>;
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(view.firstName).toBe("John");
    expect(view.lastName).toBe("Doe");
    expect(view.fullName).toBe("John Doe");

    state.firstName = "Jane";
    expect(view.fullName).toBe("Jane Doe");
  });
});

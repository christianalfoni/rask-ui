import { describe, it, expect } from "vitest";
import { useLookup } from "../useLookup";
import { useState } from "../useState";
import { render } from "../render";

describe("useLookup", () => {
  it("should create a lookup function from array", () => {
    let lookupResult1: any;
    let lookupResult2: any;
    let lookupResult3: any;

    function Component() {
      const state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        lookupResult1 = lookup(1);
        lookupResult2 = lookup(2);
        lookupResult3 = lookup(3);
        return <div>test</div>;
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(lookupResult1).toEqual({ id: 1, name: "Alice" });
    expect(lookupResult2).toEqual({ id: 2, name: "Bob" });
    expect(lookupResult3).toBeUndefined();
  });

  it("should update lookup when useState array is mutated via push", async () => {
    let lookupResult: any;
    let state!: { items: Array<{ id: number; name: string }> };

    function Component() {
      state = useState({ items: [{ id: 1, name: "Alice" }] });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        lookupResult = lookup(2);
        return (
          <div>
            {lookup(1)?.name} - {lookup(2)?.name}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(lookupResult).toBeUndefined();
    expect(container.textContent).toBe("Alice - ");

    // Mutate the array by pushing
    state.items.push({ id: 2, name: "Bob" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(lookupResult).toEqual({ id: 2, name: "Bob" });
    expect(container.textContent).toBe("Alice - Bob");
  });

  it("should update lookup when useState array is mutated via pop", async () => {
    let state!: {
      items: Array<{ id: number; name: string }>;
    };

    function Component() {
      state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return (
          <div>
            {lookup(1)?.name} - {lookup(2)?.name}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("Alice - Bob");

    // Mutate the array by popping
    state.items.pop();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe("Alice - ");
  });

  it("should update lookup when useState array is mutated via splice", async () => {
    let state!: {
      items: Array<{ id: number; name: string }>;
    };

    function Component() {
      state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" },
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return (
          <div>
            {lookup(1)?.name} - {lookup(2)?.name} - {lookup(3)?.name}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("Alice - Bob - Charlie");

    // Remove Bob via splice
    state.items.splice(1, 1);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe("Alice -  - Charlie");
  });

  it("should update lookup when useState array is mutated via unshift", async () => {
    let state!: { items: Array<{ id: number; name: string }> };

    function Component() {
      state = useState({ items: [{ id: 2, name: "Bob" }] });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return (
          <div>
            {lookup(1)?.name} - {lookup(2)?.name}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe(" - Bob");

    // Add item at beginning
    state.items.unshift({ id: 1, name: "Alice" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe("Alice - Bob");
  });

  it("should update lookup when array reference is replaced", async () => {
    let state!: {
      items: Array<{ id: number; name: string }>;
    };

    function Component() {
      state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return (
          <div>
            {lookup(1)?.name} - {lookup(3)?.name} - {lookup(4)?.name}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("Alice -  - ");

    // Replace the entire array
    state.items = [
      { id: 3, name: "Charlie" },
      { id: 4, name: "Diana" },
    ];
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe(" - Charlie - Diana");
  });

  it("should handle mutations when items are modified", async () => {
    let state!: {
      items: Array<{ id: number; name: string }>;
    };

    function Component() {
      state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return <div>{lookup(1)?.name}</div>;
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("Alice");

    // Modify Alice's name (this doesn't change the lookup key)
    state.items[0].name = "Alicia";
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The lookup should still find the same object, now with modified name
    expect(container.textContent).toBe("Alicia");
  });

  it("should work with string keys", async () => {
    let state!: {
      users: Array<{ username: string; email: string }>;
    };

    function Component() {
      state = useState({
        users: [
          { username: "alice", email: "alice@example.com" },
          { username: "bob", email: "bob@example.com" },
        ],
      });
      const lookup = useLookup(() => state.users, "username");

      return () => {
        return (
          <div>
            {lookup("alice")?.email} - {lookup("charlie")?.email}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("alice@example.com - ");

    // Add new user
    state.users.push({ username: "charlie", email: "charlie@example.com" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe(
      "alice@example.com - charlie@example.com"
    );
  });

  it("should handle array with duplicate keys (last one wins)", () => {
    let lookupResult: any;

    function Component() {
      const state = useState({
        items: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 1, name: "Alice2" }, // Duplicate id
        ],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        lookupResult = lookup(1);
        return <div>{lookup(1)?.name}</div>;
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    // Last item with id=1 should win
    expect(lookupResult).toEqual({ id: 1, name: "Alice2" });
    expect(container.textContent).toBe("Alice2");
  });

  it("should handle empty array", async () => {
    let state!: { items: Array<{ id: number; name: string }> };

    function Component() {
      state = useState({ items: [] as Array<{ id: number; name: string }> });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return <div>{lookup(1)?.name || "empty"}</div>;
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("empty");

    // Add item to empty array
    state.items.push({ id: 1, name: "Alice" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe("Alice");
  });

  it("should handle multiple array mutations in sequence", async () => {
    let state!: {
      items: Array<{ id: number; name: string }>;
    };

    function Component() {
      state = useState({
        items: [{ id: 1, name: "Alice" }],
      });
      const lookup = useLookup(() => state.items, "id");

      return () => {
        return (
          <div>
            {state.items.map((item) => lookup(item.id)?.name).join(", ")}
          </div>
        );
      };
    }

    const container = document.createElement("div");
    render(<Component />, container);

    expect(container.textContent).toBe("Alice");

    // Multiple mutations
    state.items.push({ id: 2, name: "Bob" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toBe("Alice, Bob");

    state.items.push({ id: 3, name: "Charlie" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toBe("Alice, Bob, Charlie");

    state.items.shift();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toBe("Bob, Charlie");

    state.items[0].name = "Robert";
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toBe("Robert, Charlie");
  });

  it("should handle lookup in nested component", async () => {
    let parentState!: {
      items: Array<{ id: number; name: string }>;
    };

    function Child(props: { items: Array<{ id: number; name: string }> }) {
      const lookup = useLookup(() => props.items, "id");

      return () => {
        console.log("Render Child");
        return <div>{lookup(2)?.name || "not found"}</div>;
      };
    }

    function Parent() {
      parentState = useState({
        items: [{ id: 1, name: "Alice" }],
      });

      return () => {
        return <Child items={parentState.items} />;
      };
    }

    const container = document.createElement("div");
    render(<Parent />, container);

    expect(container.textContent).toBe("not found");

    parentState.items.push({ id: 2, name: "Bob" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent).toBe("Bob");
  });
});

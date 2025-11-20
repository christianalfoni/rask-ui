import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { syncBatch } from "../batch";
import { useState } from "../useState";
import { Observer } from "../observation";

describe("syncBatch", () => {
  it("should batch multiple state changes into a single notification", () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track count
    state.name; // Track name
    dispose();

    // Make multiple changes in a batch
    syncBatch(() => {
      state.count = 1;
      state.name = "Bob";
      state.count = 2;
    });

    // Should only notify once despite multiple changes, and synchronously
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(2);
    expect(state.name).toBe("Bob");

    observer.dispose();
  });

  it("should handle nested batches correctly", () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    syncBatch(() => {
      state.count = 1;
      syncBatch(() => {
        state.count = 2;
      });
      state.count = 3;
    });

    // Should still only notify once for nested batches
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(3);

    observer.dispose();
  });

  it("should handle multiple observers with syncBatch", () => {
    const state = useState({ count: 0 });
    let notifyCount1 = 0;
    let notifyCount2 = 0;

    const observer1 = new Observer(() => {
      notifyCount1++;
    });
    const observer2 = new Observer(() => {
      notifyCount2++;
    });

    const dispose1 = observer1.observe();
    state.count; // Track in observer1
    dispose1();

    const dispose2 = observer2.observe();
    state.count; // Track in observer2
    dispose2();

    syncBatch(() => {
      state.count = 1;
      state.count = 2;
      state.count = 3;
    });

    // Both observers should be notified exactly once
    expect(notifyCount1).toBe(1);
    expect(notifyCount2).toBe(1);

    observer1.dispose();
    observer2.dispose();
  });

  it("should maintain correct state values after syncBatch", () => {
    const state = useState({
      count: 0,
      name: "Alice",
      items: [1, 2, 3],
    });

    syncBatch(() => {
      state.count = 10;
      state.name = "Bob";
      state.items.push(4);
      state.items[0] = 100;
    });

    expect(state.count).toBe(10);
    expect(state.name).toBe("Bob");
    expect(state.items).toEqual([100, 2, 3, 4]);
  });

  it("should not flush if exception thrown within syncBatch", () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    try {
      syncBatch(() => {
        state.count = 1;
        throw new Error("Test error");
      });
    } catch (e) {
      // Expected error
    }

    // Should NOT have flushed since the batch was interrupted
    expect(notifyCount).toBe(0);
    // But state change still occurred
    expect(state.count).toBe(1);

    observer.dispose();
  });

  it("should deduplicate notifications for the same observer", () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    state.name; // Track
    dispose();

    syncBatch(() => {
      state.count = 1; // Triggers observer
      state.name = "Bob"; // Triggers same observer again
      state.count = 2; // Triggers observer yet again
    });

    // Should deduplicate and only notify once
    expect(notifyCount).toBe(1);

    observer.dispose();
  });
});

describe("queue (async batching)", () => {
  it("should queue updates and flush on microtask", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count; // Track
    dispose();

    // Make changes that will be queued
    state.count = 1;
    state.count = 2;
    state.count = 3;

    // Not yet notified (queued)
    expect(notifyCount).toBe(0);

    // Wait for microtask flush
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should have notified once after flush
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(3);

    observer.dispose();
  });

  it("should batch multiple async updates into one notification", async () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count;
    state.name;
    dispose();

    state.count = 1;
    state.name = "Bob";
    state.count = 2;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should batch all updates into single notification
    expect(notifyCount).toBe(1);

    observer.dispose();
  });

  it("should handle separate async batches", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count;
    dispose();

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterFirst = notifyCount;

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterSecond = notifyCount;

    expect(afterFirst).toBe(1);
    expect(afterSecond).toBe(2);

    observer.dispose();
  });
});

describe("syncBatch with nested async updates", () => {
  it("should handle syncBatch inside async context", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count;
    dispose();

    // Async update
    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(notifyCount).toBe(1);

    // Sync batch after async
    syncBatch(() => {
      state.count = 2;
      state.count = 3;
    });
    expect(notifyCount).toBe(2); // +1 from sync batch

    observer.dispose();
  });

  it("should handle async updates inside syncBatch callback", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const observer = new Observer(() => {
      notifyCount++;
    });

    const dispose = observer.observe();
    state.count;
    dispose();

    syncBatch(() => {
      state.count = 1;

      // Trigger an async update from within syncBatch
      setTimeout(() => {
        state.count = 2;
      }, 0);
    });

    // Sync batch should flush immediately
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(1);

    // Wait for async update
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(notifyCount).toBe(2);
    expect(state.count).toBe(2);

    observer.dispose();
  });
});

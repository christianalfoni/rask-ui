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

describe("syncBatch with cascading updates", () => {
  it("should handle cascading observer notifications within the same batch", () => {
    const state = useState({ count: 0 });
    const derived = useState({ doubled: 0 });
    let stateNotifyCount = 0;
    let derivedNotifyCount = 0;
    let componentNotifyCount = 0;

    // Observer 1: Watches state, updates derived (simulates useDerived)
    const derivedObserver = new Observer(() => {
      stateNotifyCount++;
      // When state changes, update derived synchronously
      derived.doubled = state.count * 2;
    });

    const dispose1 = derivedObserver.observe();
    state.count; // Track state
    dispose1();

    // Observer 2: Watches derived (simulates component)
    const componentObserver = new Observer(() => {
      derivedNotifyCount++;
    });

    const dispose2 = componentObserver.observe();
    derived.doubled; // Track derived
    dispose2();

    // Observer 3: Also watches derived (another component)
    const component2Observer = new Observer(() => {
      componentNotifyCount++;
    });

    const dispose3 = component2Observer.observe();
    derived.doubled; // Track derived
    dispose3();

    // Make a change in a batch
    syncBatch(() => {
      state.count = 5;
    });

    // All observers should have been notified exactly once
    expect(stateNotifyCount).toBe(1);
    expect(derivedNotifyCount).toBe(1);
    expect(componentNotifyCount).toBe(1);
    expect(state.count).toBe(5);
    expect(derived.doubled).toBe(10);

    derivedObserver.dispose();
    componentObserver.dispose();
    component2Observer.dispose();
  });

  it("should handle multi-level cascading updates", () => {
    const state = useState({ value: 0 });
    const derived1 = useState({ level1: 0 });
    const derived2 = useState({ level2: 0 });
    const derived3 = useState({ level3: 0 });
    const notifyCounts = [0, 0, 0, 0];

    // Level 1: state -> derived1
    const observer1 = new Observer(() => {
      notifyCounts[0]++;
      derived1.level1 = state.value + 1;
    });
    const dispose1 = observer1.observe();
    state.value;
    dispose1();

    // Level 2: derived1 -> derived2
    const observer2 = new Observer(() => {
      notifyCounts[1]++;
      derived2.level2 = derived1.level1 + 1;
    });
    const dispose2 = observer2.observe();
    derived1.level1;
    dispose2();

    // Level 3: derived2 -> derived3
    const observer3 = new Observer(() => {
      notifyCounts[2]++;
      derived3.level3 = derived2.level2 + 1;
    });
    const dispose3 = observer3.observe();
    derived2.level2;
    dispose3();

    // Final observer: watches derived3
    const observer4 = new Observer(() => {
      notifyCounts[3]++;
    });
    const dispose4 = observer4.observe();
    derived3.level3;
    dispose4();

    // Update state in a batch
    syncBatch(() => {
      state.value = 10;
    });

    // All levels should have cascaded and each observer notified exactly once
    expect(notifyCounts).toEqual([1, 1, 1, 1]);
    expect(state.value).toBe(10);
    expect(derived1.level1).toBe(11);
    expect(derived2.level2).toBe(12);
    expect(derived3.level3).toBe(13);

    observer1.dispose();
    observer2.dispose();
    observer3.dispose();
    observer4.dispose();
  });

  it("should handle diamond dependency pattern", () => {
    // Diamond: state -> [derived1, derived2] -> derived3
    const state = useState({ value: 0 });
    const derived1 = useState({ path1: 0 });
    const derived2 = useState({ path2: 0 });
    const derived3 = useState({ combined: 0 });
    let derived3NotifyCount = 0;

    // State -> derived1
    const obs1 = new Observer(() => {
      derived1.path1 = state.value * 2;
    });
    const d1 = obs1.observe();
    state.value;
    d1();

    // State -> derived2
    const obs2 = new Observer(() => {
      derived2.path2 = state.value * 3;
    });
    const d2 = obs2.observe();
    state.value;
    d2();

    // [derived1, derived2] -> derived3
    const obs3 = new Observer(() => {
      derived3.combined = derived1.path1 + derived2.path2;
    });
    const d3 = obs3.observe();
    derived1.path1;
    derived2.path2;
    d3();

    // Watch derived3
    const obs4 = new Observer(() => {
      derived3NotifyCount++;
    });
    const d4 = obs4.observe();
    derived3.combined;
    d4();

    syncBatch(() => {
      state.value = 5;
    });

    // derived3 should only be notified once despite two paths updating
    expect(derived3NotifyCount).toBe(1);
    expect(derived1.path1).toBe(10);
    expect(derived2.path2).toBe(15);
    expect(derived3.combined).toBe(25);

    obs1.dispose();
    obs2.dispose();
    obs3.dispose();
    obs4.dispose();
  });

  it("should not create infinite loops with circular dependencies", () => {
    const state1 = useState({ value: 0 });
    const state2 = useState({ value: 0 });
    let notify1Count = 0;
    let notify2Count = 0;

    // Observer 1: watches state1, updates state2
    const obs1 = new Observer(() => {
      notify1Count++;
      if (notify1Count > 10) {
        throw new Error("Infinite loop detected");
      }
      // Only update if different to break the cycle
      if (state2.value !== state1.value + 1) {
        state2.value = state1.value + 1;
      }
    });
    const d1 = obs1.observe();
    state1.value;
    d1();

    // Observer 2: watches state2, updates state1
    const obs2 = new Observer(() => {
      notify2Count++;
      if (notify2Count > 10) {
        throw new Error("Infinite loop detected");
      }
      // Only update if different to break the cycle
      if (state1.value !== state2.value - 1) {
        state1.value = state2.value - 1;
      }
    });
    const d2 = obs2.observe();
    state2.value;
    d2();

    syncBatch(() => {
      state1.value = 5;
    });

    // Should stabilize without infinite loop
    expect(notify1Count).toBeLessThan(10);
    expect(notify2Count).toBeLessThan(10);
    expect(state1.value).toBe(5);
    expect(state2.value).toBe(6);

    obs1.dispose();
    obs2.dispose();
  });
});

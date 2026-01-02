import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { useState } from "../useState";
import { autorun, transaction } from "../scheduler";
import { Reaction, reaction } from "mobx";

describe("transaction", () => {
  it("should batch multiple state changes into a single notification", () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count; // Track count
      state.name; // Track name
    });

    // Make multiple changes in a batch
    transaction(() => {
      state.count = 1;
      state.name = "Bob";
      state.count = 2;
    });

    // Should only notify once despite multiple changes, and synchronously
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(2);
    expect(state.name).toBe("Bob");

    reaction.dispose();
  });

  it("should handle nested batches correctly", () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count; // Track
    });

    transaction(() => {
      state.count = 1;
      transaction(() => {
        state.count = 2;
      });
      state.count = 3;
    });

    // Should still only notify once for nested batches
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(3);

    reaction.dispose();
  });

  it("should handle multiple observers with syncBatch", () => {
    const state = useState({ count: 0 });
    let notifyCount1 = 0;
    let notifyCount2 = 0;

    const reaction1 = new Reaction("TestReaction1", () => {
      notifyCount1++;
    });
    const reaction2 = new Reaction("TestReaction2", () => {
      notifyCount2++;
    });

    reaction1.track(() => {
      state.count; // Track in observer1
    });

    reaction2.track(() => {
      state.count; // Track in observer2
    });

    transaction(() => {
      state.count = 1;
      state.count = 2;
      state.count = 3;
    });

    // Both observers should be notified exactly once
    expect(notifyCount1).toBe(1);
    expect(notifyCount2).toBe(1);

    reaction1.dispose();
    reaction2.dispose();
  });

  it("should maintain correct state values after transaction", () => {
    const state = useState({
      count: 0,
      name: "Alice",
      items: [1, 2, 3],
    });

    transaction(() => {
      state.count = 10;
      state.name = "Bob";
      state.items.push(4);
      state.items[0] = 100;
    });

    expect(state.count).toBe(10);
    expect(state.name).toBe("Bob");
    expect(state.items).toEqual([100, 2, 3, 4]);
  });

  it("should deduplicate notifications for the same observer", () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count; // Track
      state.name; // Track
    });

    transaction(() => {
      state.count = 1; // Triggers observer
      state.name = "Bob"; // Triggers same observer again
      state.count = 2; // Triggers observer yet again
    });

    // Should deduplicate and only notify once
    expect(notifyCount).toBe(1);

    reaction.dispose();
  });
});

describe("queue (async batching)", () => {
  it("should queue updates and flush on microtask", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count; // Track
    });

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

    reaction.dispose();
  });

  it("should batch multiple async updates into one notification", async () => {
    const state = useState({ count: 0, name: "Alice" });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count;
      state.name;
    });

    state.count = 1;
    state.name = "Bob";
    state.count = 2;

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Should batch all updates into single notification
    expect(notifyCount).toBe(1);

    reaction.dispose();
  });

  it("should handle separate async batches", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;

      reaction.track(() => {
        state.count;
      });
    });

    reaction.track(() => {
      state.count;
    });

    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterFirst = notifyCount;

    state.count = 2;
    await new Promise((resolve) => setTimeout(resolve, 0));
    const afterSecond = notifyCount;

    expect(afterFirst).toBe(1);
    expect(afterSecond).toBe(2);

    reaction.dispose();
  });
});

describe("transaction with nested async updates", () => {
  it("should handle transaction inside async context", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count;
    });

    // Async update
    state.count = 1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(notifyCount).toBe(1);

    reaction.track(() => {
      state.count;
    });

    // Sync batch after async
    transaction(() => {
      state.count = 2;
      state.count = 3;
    });
    expect(notifyCount).toBe(2); // +1 from sync batch

    reaction.dispose();
  });

  it("should handle async updates inside transaction callback", async () => {
    const state = useState({ count: 0 });
    let notifyCount = 0;

    const reaction = new Reaction("TestReaction", () => {
      notifyCount++;
    });

    reaction.track(() => {
      state.count;
    });

    transaction(() => {
      state.count = 1;

      // Trigger an async update from within transaction
      setTimeout(() => {
        state.count = 2;
      }, 0);
    });

    // Sync batch should flush immediately
    expect(notifyCount).toBe(1);
    expect(state.count).toBe(1);

    reaction.track(() => {
      state.count;
    });

    // Wait for async update
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(notifyCount).toBe(2);
    expect(state.count).toBe(2);

    reaction.dispose();
  });
});

describe("transaction with cascading updates", () => {
  it("should handle cascading observer notifications within the same batch", () => {
    const state = useState({ count: 0 });
    const derived = useState({ doubled: 0 });
    let stateNotifyCount = 0;
    let derivedNotifyCount = 0;
    let componentNotifyCount = 0;

    // Observer 1: Watches state, updates derived (simulates useDerived)
    const derivedReaction = new Reaction("DerivedReaction", () => {
      stateNotifyCount++;
      // When state changes, update derived synchronously
      derived.doubled = state.count * 2;
    });

    derivedReaction.track(() => {
      state.count; // Track state
    });

    // Observer 2: Watches derived (simulates component)
    const componentReaction = new Reaction("ComponentReaction", () => {
      derivedNotifyCount++;
    });

    componentReaction.track(() => {
      derived.doubled; // Track derived
    });

    // Observer 3: Also watches derived (another component)
    const component2Reaction = new Reaction("Component2Reaction", () => {
      componentNotifyCount++;
    });

    component2Reaction.track(() => {
      derived.doubled; // Track derived
    });

    // Make a change in a batch
    transaction(() => {
      state.count = 5;
    });

    // All observers should have been notified exactly once
    expect(stateNotifyCount).toBe(1);
    expect(derivedNotifyCount).toBe(1);
    expect(componentNotifyCount).toBe(1);
    expect(state.count).toBe(5);
    expect(derived.doubled).toBe(10);

    derivedReaction.dispose();
    componentReaction.dispose();
    component2Reaction.dispose();
  });

  it("should handle multi-level cascading updates", () => {
    const state = useState({ value: 0 });
    const derived1 = useState({ level1: 0 });
    const derived2 = useState({ level2: 0 });
    const derived3 = useState({ level3: 0 });
    const notifyCounts = [0, 0, 0, 0];

    // Level 1: state -> derived1
    const reaction1 = new Reaction("Reaction1", () => {
      notifyCounts[0]++;
      derived1.level1 = state.value + 1;
    });
    reaction1.track(() => {
      state.value;
    });

    // Level 2: derived1 -> derived2
    const reaction2 = new Reaction("Reaction2", () => {
      notifyCounts[1]++;
      derived2.level2 = derived1.level1 + 1;
    });
    reaction2.track(() => {
      derived1.level1;
    });

    // Level 3: derived2 -> derived3
    const reaction3 = new Reaction("Reaction3", () => {
      notifyCounts[2]++;
      derived3.level3 = derived2.level2 + 1;
    });
    reaction3.track(() => {
      derived2.level2;
    });

    // Final observer: watches derived3
    const reaction4 = new Reaction("Reaction4", () => {
      notifyCounts[3]++;
    });
    reaction4.track(() => {
      derived3.level3;
    });

    // Update state in a batch
    transaction(() => {
      state.value = 10;
    });

    // All levels should have cascaded and each observer notified exactly once
    expect(notifyCounts).toEqual([1, 1, 1, 1]);
    expect(state.value).toBe(10);
    expect(derived1.level1).toBe(11);
    expect(derived2.level2).toBe(12);
    expect(derived3.level3).toBe(13);

    reaction1.dispose();
    reaction2.dispose();
    reaction3.dispose();
    reaction4.dispose();
  });

  it("should handle diamond dependency pattern", () => {
    // Diamond: state -> [derived1, derived2] -> derived3
    const state = useState({ value: 0 });
    const derived1 = useState({ path1: 0 });
    const derived2 = useState({ path2: 0 });
    const derived3 = useState({ combined: 0 });
    let derived3NotifyCount = 0;

    // State -> derived1
    const reaction1 = new Reaction("Reaction1", () => {
      derived1.path1 = state.value * 2;
    });
    reaction1.track(() => {
      state.value;
    });

    // State -> derived2
    const reaction2 = new Reaction("Reaction2", () => {
      derived2.path2 = state.value * 3;
    });
    reaction2.track(() => {
      state.value;
    });

    // [derived1, derived2] -> derived3
    const reaction3 = new Reaction("Reaction3", () => {
      derived3.combined = derived1.path1 + derived2.path2;
    });
    reaction3.track(() => {
      derived1.path1;
      derived2.path2;
    });

    // Watch derived3
    const reaction4 = new Reaction("Reaction4", () => {
      derived3NotifyCount++;
    });
    reaction4.track(() => {
      derived3.combined;
    });

    transaction(() => {
      state.value = 5;
    });

    // derived3 should only be notified once despite two paths updating
    expect(derived3NotifyCount).toBe(1);
    expect(derived1.path1).toBe(10);
    expect(derived2.path2).toBe(15);
    expect(derived3.combined).toBe(25);

    reaction1.dispose();
    reaction2.dispose();
    reaction3.dispose();
    reaction4.dispose();
  });

  it("should not create infinite loops with circular dependencies", () => {
    const state1 = useState({ value: 0 });
    const state2 = useState({ value: 0 });
    let notify1Count = 0;
    let notify2Count = 0;

    // Observer 1: watches state1, updates state2
    const reaction1 = new Reaction("Reaction1", () => {
      notify1Count++;
      if (notify1Count > 10) {
        throw new Error("Infinite loop detected");
      }
      // Only update if different to break the cycle
      if (state2.value !== state1.value + 1) {
        state2.value = state1.value + 1;
      }
    });
    reaction1.track(() => {
      state1.value;
    });

    // Observer 2: watches state2, updates state1
    const reaction2 = new Reaction("Reaction2", () => {
      notify2Count++;
      if (notify2Count > 10) {
        throw new Error("Infinite loop detected");
      }
      // Only update if different to break the cycle
      if (state1.value !== state2.value - 1) {
        state1.value = state2.value - 1;
      }
    });
    reaction2.track(() => {
      state2.value;
    });

    transaction(() => {
      state1.value = 5;
    });

    // Should stabilize without infinite loop
    expect(notify1Count).toBeLessThan(10);
    expect(notify2Count).toBeLessThan(10);
    expect(state1.value).toBe(5);
    expect(state2.value).toBe(6);

    reaction1.dispose();
    reaction2.dispose();
  });
});

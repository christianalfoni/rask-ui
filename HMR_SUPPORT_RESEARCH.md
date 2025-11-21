# HMR Support Research for Rask UI

**Date:** January 2025
**Status:** Investigation Complete - Not Implemented

## Executive Summary

Inferno's HMR currently **only works for CSS files**. JavaScript changes require a full page refresh. RaskComponent's architecture would require significant modifications to support HMR, as the setup function is cached and never re-executed after the initial render.

---

## Inferno HMR Status

### Current State
- **CSS HMR:** ✅ Works
- **JavaScript HMR:** ❌ Requires full page refresh
- **Native Support:** Inferno doesn't provide native HMR for component code

### Historical Context
- GitHub issue discussion (infernojs/inferno#761) mentions HMR works "webpack native way not React way"
- Development work on `inferno-hot-reload` tool was mentioned but no recent updates found
- No evidence of complete implementation as of 2025

---

## RaskComponent Architecture Analysis

### Component Lifecycle

**Location:** `packages/core/src/component.ts`

```typescript
export class RaskComponent<P extends Props<any>> extends Component<P> {
  declare setup: RaskFunctionComponent<P>;
  private renderFn?: () => VNode;
  private reactiveProps?: Props<any>;
  private observer = new Observer(() => {
    this.forceUpdate();
  });
  private isRendering = false;
  effects: Array<{ isDirty: boolean; run: () => void }> = [];
  contexts = new Map();
  onMounts: Array<() => void> = [];
  onCleanups: Array<() => void> = [];
}
```

**Key Characteristics:**
- Extends Inferno's Component class (class-based lifecycle)
- Each instance has its own `observer` for reactive dependency tracking
- Setup function and render function stored separately
- Arrays of mount/cleanup callbacks maintained per instance

### Setup Phase (First Render Only)

```typescript
render() {
  if (!this.renderFn) {  // ⚠️ ONLY RUNS ONCE - THIS IS THE PROBLEM
    this.reactiveProps = this.createReactiveProps();
    currentComponent = this;
    try {
      this.renderFn = this.setup(this.reactiveProps as any);  // SETUP RUNS HERE
      if (typeof this.renderFn !== "function") {
        throw new Error("Component must return a render function");
      }
    } catch (error) {
      // error handling
    }
    currentComponent = undefined;
  }
  // ... render happens with cached renderFn
}
```

**Critical Issue:** The `renderFn` is cached forever. Once set, setup never runs again.

### Lifecycle Hooks

**Mount:**
```typescript
componentDidMount(): void {
  this.onMounts.forEach((cb) => cb());
}
```

**Cleanup:**
```typescript
componentWillUnmount(): void {
  this.onCleanups.forEach((cb) => cb());
}
```

**Problem:** These hooks don't trigger on HMR module reload.

### Reactive Props System

```typescript
private createReactiveProps() {
  const reactiveProps = {} as any;
  const signals = new Map<string, Signal>();

  for (const prop in this.props) {
    // Skip functions, children, key, ref
    if (typeof value === "function" || prop === "children" || ...) {
      reactiveProps[prop] = value;
      continue;
    }

    // Objects/arrays are already reactive if they're proxies
    if (typeof value === "object" && value !== null) {
      reactiveProps[prop] = value;
      continue;
    }

    // Only create reactive getters for primitives
    Object.defineProperty(reactiveProps, prop, {
      get() {
        if (!self.isRendering) {
          const observer = getCurrentObserver();
          if (observer) {
            let signal = signals.get(prop);
            if (!signal) {
              signal = new Signal();
              signals.set(prop, signal);
            }
            observer.subscribeSignal(signal);
          }
        }
        return self.props[prop];
      },
    });
  }
  return reactiveProps;
}
```

**Problem:** Signals map is tied to the component instance and never refreshed on HMR.

---

## Reactive System Architecture

**Location:** `packages/core/src/observation.ts`

### Signal Class (Doubly-Linked List)

```typescript
export class Signal {
  private head: Subscription | null = null;
  private tail: Subscription | null = null;
  private epoch = 0;

  _subscribe(observer: Observer): Subscription {
    const sub = new Subscription(this, observer, this.epoch + 1);
    // Add to doubly-linked list
  }

  notify() {
    if (!this.head) return;
    const barrier = ++this.epoch;
    let sub = this.head;
    while (sub) {
      const next = sub.nextInSignal;
      if (sub.active && sub.createdAtEpoch <= barrier) {
        sub.observer._notify();
      }
      sub = next;
    }
  }
}
```

### Observer Class

```typescript
export class Observer {
  isDisposed = false;
  private subsHead: Subscription | null = null;
  private subsTail: Subscription | null = null;

  observe() {
    this.clearSignals();  // Clear old subscriptions
    observerStack[++stackTop] = this;
    return () => {
      stackTop--;  // Dispose callback
    };
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.clearSignals();  // Unlink all subscriptions
  }
}
```

**Optimization Benefits:**
- No per-subscription closures (memory efficient)
- No Set allocations
- No Array copies during notify()
- Safe unsubscription while iterating
- Epoch barrier prevents notify-loops

**HMR Problem:** Old observers remain active with stale subscriptions after module reload.

---

## What Breaks with HMR

### 1. New Setup Logic Never Executes

```typescript
// Original code
export function App() {
  const state = useState({ count: 0 });
  return () => <div>{state.count}</div>;
}

// After editing and HMR reload
export function App() {
  const state = useState({ count: 0 });
  const doubled = useDerived(() => state.count * 2);  // ❌ NEW - NEVER RUNS!
  return () => <div>{doubled}</div>;  // ❌ THIS NEVER SHOWS!
}
```

**Reason:** Old component instance keeps cached `renderFn`, new setup function never executes.

### 2. Cleanup Callbacks Don't Fire

- `componentWillUnmount()` is NOT called on module reload
- Old observers and signal subscriptions remain active
- `onCleanups` callbacks never fire
- New setup callbacks never register

### 3. Memory & Resource Leaks

- Old observers keep signal subscriptions alive
- Event listeners from `createMountEffect` never cleanup
- Timers, intervals, fetch requests never abort
- Doubly-linked lists maintain stale references

### 4. Effect Duplication

```typescript
useEffect(() => {
  console.log("Effect running");  // Runs twice - old + new instance
});
```

Old effect observer remains active while new effect in reloaded code creates another observer.

### 5. Props Reactivity Issues

Reloaded component keeps OLD signals map. New component definition doesn't see new prop changes properly.

### 6. State Disconnection

Component instances become completely disconnected from the latest code definition.

---

## Current Vite Configuration

### Demo Vite Config
**Location:** `packages/demo/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import raskPlugin from "rask-ui/plugin";

export default defineConfig({
  plugins: [tailwindcss(), raskPlugin()],
  server: {
    port: 3000,
  },
});
```

### Template Vite Config
**Location:** `packages/create-rask-ui/templates/typescript/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import raskPlugin from "rask-ui/plugin";

export default defineConfig({
  plugins: [raskPlugin()],
});
```

**Current Status:** No explicit HMR configuration. Vite uses default settings.

---

## What Would Be Required for HMR Support

### 1. Component-Level HMR Handling

**Modifications to `packages/core/src/component.ts`:**

```typescript
export class RaskComponent<P extends Props<any>> extends Component<P> {
  // ... existing fields ...

  // NEW: HMR support
  _hmrReset(newSetup: RaskFunctionComponent<P>) {
    // 1. Run cleanup callbacks
    this.onCleanups.forEach((cb) => cb());

    // 2. Dispose observer
    this.observer.dispose();

    // 3. Clear cached state
    this.renderFn = undefined;
    this.reactiveProps = undefined;
    this.effects = [];
    this.contexts.clear();
    this.onMounts = [];
    this.onCleanups = [];

    // 4. Create new observer
    this.observer = new Observer(() => {
      this.forceUpdate();
    });

    // 5. Update setup function
    this.setup = newSetup;

    // 6. Force re-render (will re-run setup)
    this.forceUpdate();
  }
}
```

### 2. Vite Plugin Integration

**Modifications to `packages/core/src/plugin.ts`:**

```typescript
export function raskPlugin(options?: RaskPluginOptions): Plugin {
  return {
    name: 'vite-plugin-rask',

    async transform(code: string, id: string) {
      // ... existing transform ...

      // Inject HMR handling for component files
      if (/\.[tj]sx$/.test(id) && transformComponents) {
        const hmrCode = `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (typeof __RASK_HMR_UPDATE__ !== 'undefined') {
      __RASK_HMR_UPDATE__(newModule);
    }
  });
}
        `;

        result.code += hmrCode;
      }

      return result;
    }
  };
}
```

### 3. Render-Level Infrastructure

**Modifications to `packages/core/src/render.ts`:**

```typescript
// Global registry for HMR
const componentRegistry = new Map<string, Set<RaskComponent<any>>>();

// Global HMR update handler
declare global {
  var __RASK_HMR_UPDATE__: (newModule: any) => void;
}

globalThis.__RASK_HMR_UPDATE__ = (newModule) => {
  // Find all instances of components from this module
  // Trigger _hmrReset on each instance
  // Handle component tree updates
};

// Track component instances during mount
function trackComponentForHMR(component: RaskComponent<any>, moduleId: string) {
  if (!componentRegistry.has(moduleId)) {
    componentRegistry.set(moduleId, new Set());
  }
  componentRegistry.get(moduleId)!.add(component);
}
```

### 4. Handle Reactive System Disposal

**Already Implemented:** `packages/core/src/observation.ts`

The observer disposal mechanism is already solid:
```typescript
dispose() {
  if (this.isDisposed) return;
  this.isDisposed = true;
  this.clearSignals();  // Properly unlinks all subscriptions
}
```

Just needs to be called during HMR reset.

---

## Implementation Complexity Assessment

### Complexity Level: **Medium to High**

### Pros (Things Working in Our Favor)
✅ Reactive system has proper cleanup mechanisms
✅ Observer disposal is well-implemented
✅ Component lifecycle hooks exist
✅ Clean separation between setup and render
✅ Batching system is solid

### Cons (Challenges)
❌ Inferno doesn't natively support JS HMR
❌ Need custom force-remount logic
❌ State preservation across reloads is non-trivial
❌ Testing edge cases (nested components, contexts, effects) extensive
❌ Potential conflicts with Inferno's internal update mechanisms
❌ Module-to-component mapping complexity
❌ Handling component tree updates (parent/child relationships)

---

## Alternatives to Full HMR

### 1. Fast Refresh with Full Reload
- Keep current behavior
- Optimize page reload speed
- Focus on fast build times

### 2. CSS-Only HMR
- Already works out of the box
- Good for styling iteration
- Most common use case in practice

### 3. State Preservation Across Reloads
```typescript
if (import.meta.hot) {
  import.meta.hot.data.state = state;

  if (import.meta.hot.data.state) {
    // Restore state after reload
  }
}
```
- Use Vite's `import.meta.hot.data`
- Preserve critical state manually
- Simpler than full HMR

### 4. Development Mode Helpers
- Better error messages
- Component inspector
- State debugging tools
- Performance profiler

---

## Recommendation

### Skip HMR Implementation (For Now)

**Reasons:**
1. Inferno doesn't natively support JS HMR - we'd be fighting the framework
2. Architecture requires significant rework
3. High complexity vs. benefit ratio
4. Framework is in early development - other features more critical
5. Full page reload is acceptable for initial development

### If Users Request It Later

Start with a **proof-of-concept** that:
1. Handles only simple function components (no effects, no context)
2. Tests the basic reset mechanism
3. Validates the approach before full implementation

### Focus Priorities Instead On:
1. Core reactive primitives stability
2. Documentation and examples
3. Performance optimization
4. Testing infrastructure
5. Developer experience improvements (error messages, debugging)

---

## Test Case Examples (If Implementing)

### Basic Component Update
```typescript
// Before HMR
function Counter() {
  const state = useState({ count: 0 });
  return () => <button onClick={() => state.count++}>{state.count}</button>;
}

// After HMR (add text)
function Counter() {
  const state = useState({ count: 0 });
  return () => <button onClick={() => state.count++}>Count: {state.count}</button>;
}
// Expected: Button text updates without losing count value
```

### Effect Cleanup
```typescript
function Timer() {
  useEffect(() => {
    const interval = setInterval(() => console.log("tick"), 1000);
    useCleanup(() => clearInterval(interval));
  });
  return () => <div>Timer Running</div>;
}
// After HMR: Old interval should clear, new interval should start
```

### Nested Components
```typescript
function Parent() {
  return () => <Child />;
}

function Child() {
  const state = useState({ value: "child" });
  return () => <div>{state.value}</div>;
}
// After HMR on Child: Parent should update to show new Child version
```

---

## References

- **GitHub Issue:** [infernojs/inferno#761](https://github.com/infernojs/inferno/issues/761) - Hot module replacement discussion
- **Vite HMR API:** https://vite.dev/guide/api-hmr
- **Component Code:** `packages/core/src/component.ts`
- **Observer System:** `packages/core/src/observation.ts`
- **Render Entry:** `packages/core/src/render.ts`
- **Plugin:** `packages/core/src/plugin.ts`

---

## Conclusion

HMR support for Rask UI is **technically feasible** but requires:
- Significant architectural changes
- Custom Inferno integration
- Extensive testing
- Ongoing maintenance

The **cost-benefit analysis** suggests focusing on other features unless HMR becomes a critical pain point reported by users. The current full-reload approach is acceptable for early-stage development.

If implementing later, start with a minimal proof-of-concept to validate the approach before committing to full implementation.

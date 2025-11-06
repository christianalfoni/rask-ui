# RASK

A lightweight reactive component library built on [Snabbdom](https://github.com/snabbdom/snabbdom) with MobX-inspired reactivity.

## Component and Element Lifecycle

### Overview

RASK uses a **host-based architecture** where each component creates a host DOM element (`<component>` tag with `display: contents`) and manages its own virtual DOM independently. Components track their direct children for efficient cleanup detection.

### Component Lifecycle Phases

#### 1. Component Creation

```tsx
function MyComponent(props) {
  // Setup Phase - runs ONCE per component instance
  const state = createState({ count: 0 });
  const ref = createRef();

  onMount(() => console.log('Mounted!'));
  onCleanup(() => console.log('Cleaning up!'));

  // Return render function
  return () => <div ref={ref}>{state.count}</div>;
}
```

**What happens:**
- `createComponentInstance()` creates a new component instance
- Component function executes (setup phase)
- `createState()` creates reactive state
- `onMount()` and `onCleanup()` register lifecycle callbacks
- Render function is stored on the instance
- Instance is wrapped with an observer for reactivity

#### 2. Initial Render

```
render(<MyComponent />, container)
  ↓
jsxToVNode() - Convert JSX to VNode
  ↓
renderComponent() - Create component instance
  ↓
observer(() => { /* render function */ })
  ↓
Initial render (hostElement = null)
  ↓
Store child VNodes for host element creation
  ↓
Create host <component> VNode with children
  ↓
patch() - Superfine creates DOM
  ↓
setupComponentInstances() - Walk VNode tree
  ↓
Set instance.hostElement from vnode.node
  ↓
Store instance on element.__componentInstance
  ↓
Find parent component via DOM traversal
  ↓
Add to parent.children Set
  ↓
Run onMount() callbacks
```

**Key steps:**
1. **JSX to VNode**: JSX is converted to Superfine VNodes
2. **Component Instance Creation**: Each component gets a unique instance
3. **Observer Setup**: Render function is wrapped to track state dependencies
4. **Initial Render**: Observer runs but hostElement is null, so child VNodes are stored
5. **Host Element Creation**: A `<component>` VNode is created with the children
6. **Superfine Patch**: Superfine creates actual DOM elements
7. **Instance Setup**: VNode tree is walked to set `hostElement` from `vnode.node`
8. **Parent-Child Tracking**: Each instance finds its parent and registers as a child
9. **Mount Callbacks**: `onMount()` callbacks run after DOM is ready

#### 3. State Changes and Re-renders

```
state.count++ (or props change)
  ↓
Observer notified (reactive dependency)
  ↓
observer() callback executes
  ↓
Render function executes
  ↓
jsx() - Convert new JSX to VNodes
  ↓
patch(hostNode, newVNode)
  ↓
Snabbdom updates DOM
```

**Key steps:**
1. **State Change**: Setting a state property notifies observers
2. **Observer Execution**: The component's observer callback runs
3. **Re-render**: Render function executes, accessing state (tracks dependencies)
4. **JSX to VNode**: New JSX is converted to VNodes
5. **Patch**: Snabbdom updates the host element's children

#### 4. Component Cleanup

**Cleanup happens in two scenarios:**

##### A. Parent Re-renders and Removes Child

```
Parent re-renders
  ↓
patch(parentHost, newVNode)
  ↓
Snabbdom removes child <component> from DOM
  ↓
Destroy hook called
  ↓
Run cleanupCallbacks
```

**Key steps:**
1. **Detection**: Snabbdom's destroy hook is called when element is removed
2. **Callbacks**: `onCleanup()` callbacks execute (clear timers, subscriptions, etc.)

### Element Lifecycle (Regular DOM Elements)

Regular DOM elements (div, span, etc.) follow Snabbdom's patching lifecycle:

```
JSX: <div>Hello</div>
  ↓
jsx() creates VNode
  ↓
patch() creates or updates DOM
  ↓
vnode.elm contains DOM element
```

**Key points:**
- Regular elements don't create component instances
- They're managed entirely by Snabbdom's patch algorithm
- No special cleanup needed (browser handles DOM removal)

### Parent-Child Relationship Tracking

Components track their parent via the component stack during initialization:

```
componentStack.unshift(instance)
const render = component(instance.reactiveProps)
```

**Key points:**
- Parent-child relationships tracked through component stack
- Used for context propagation
- Cleanup handled by Snabbdom's destroy hooks

### Complete Lifecycle Example

```tsx
function Counter() {
  // SETUP PHASE (once)
  const state = createState({ count: 0 });

  onMount(() => {
    console.log('Counter mounted');
  });

  onCleanup(() => {
    console.log('Counter cleaning up');
  });

  // RENDER PHASE (every update)
  return () => (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
    </div>
  );
}

// Mount
render(<Counter />, document.getElementById('app'));
// Logs: "Counter mounted"

// User clicks button
// → state.count++ triggers observer
// → Render function executes
// → DOM updates via patch()

// Component removed (parent re-renders without it)
// → Snabbdom destroy hook called
// → Logs: "Counter cleaning up"
```

## Key Architectural Decisions

### 1. Host-Based Architecture
- Each component has a host `<component>` element (display: contents)
- Components render independently to their own host
- No parent-child instance relationships for rendering
- Isolation enables fine-grained updates

### 2. Lifecycle Management
- Snabbdom hooks manage component lifecycle
- Insert hook runs onMount callbacks
- Destroy hook runs onCleanup callbacks
- Parent-child tracking for context propagation

### 3. Observer Pattern for Reactivity
- Render functions wrapped with observer
- Automatically tracks state/props access
- Re-renders only when observed properties change
- No manual subscriptions needed

### 4. Context Traversal
- Context walks component tree via parent references
- Set during component initialization
- Natural hierarchical lookup
- Works with host element architecture

### 5. Hook-Based Cleanup
- Cleanup callbacks run via Snabbdom destroy hooks
- Synchronous and predictable
- No manual tracking required
- Integrated with virtual DOM lifecycle

### 6. Thunk-Based Components

Components use Snabbdom's thunk feature for optimization:

```tsx
const thunkNode = thunk("component", props.key, component, [props, children]);
```

**How it works:**
- Components wrapped as thunks with custom hooks
- Init hook: Creates component instance and runs setup
- Prepatch hook: Updates reactive props before render
- Postpatch hook: Syncs props after patch
- Insert hook: Runs onMount callbacks
- Destroy hook: Runs onCleanup callbacks

**Benefits:**
- Leverages Snabbdom's thunk optimization
- Props changes trigger reactive updates
- Lifecycle hooks integrated with virtual DOM
- Efficient component reconciliation

## API Reference

See main [README](../../README.md) for full API details:
- `createState(initialState)` - Create reactive state
- `onMount(callback)` - Register mount callback
- `onCleanup(callback)` - Register cleanup callback
- `createContext()` - Create context for data sharing
- `createAsync(promise)` - Handle async operations
- `createQuery(fetcher)` - Create query with refetch
- `createMutation(mutator)` - Create mutation handler
- `ErrorBoundary` - Error boundary component
- `render(jsx, container)` - Mount component to DOM

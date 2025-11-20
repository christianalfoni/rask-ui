# Observer Specification

## Overview

The observer system provides a uniform way to observe changes to reactive primitives (createState, createComputed, createView, createAsync, createQuery, createMutation) for debugging, devtools, and logging purposes.

## Core Concepts

### 1. Symbol Protocol

All reactive primitives implement a common symbol-based protocol for registration:

```typescript
const OBSERVE_SYMBOL = Symbol.for('snabbdom-components.observe')
```

Each reactive object exposes this symbol as a method:
```typescript
interface Observable {
  [OBSERVE_SYMBOL](listener: EventListener, path: string[]): void
}
```

### 2. Observer API

```typescript
function observe(
  target: Observable,
  listener: (event: ObserverEvent) => void
): () => void

type ObserverEvent = {
  path: string[]
  type: string
  // Additional properties depend on event type
}
```

The `observe` function:
- Accepts any reactive primitive that implements the protocol
- Registers a listener that receives all events from the target and its nested primitives
- Returns an unsubscribe function to stop observing
- Events are emitted synchronously when changes occur

### 3. Event Format

All events share a common base structure:

```typescript
interface BaseEvent {
  path: string[]  // Path to the primitive that emitted the event
  type: string    // Event type identifier
  timestamp: number // When the event occurred
}
```

### 4. Event Bubbling

When nested reactive primitives emit events:
1. The child primitive emits an event with its local path (e.g., `[]` for root)
2. Each parent intercepts the event and prepends its own path segment
3. The event bubbles to the top-level observer with the full path

Example:
```typescript
const view = useView({
  nested: useState({ count: 0 })
})

observe(view, (event) => {
  // When nested.count changes:
  // event.path = ["nested", "count"]
  console.log(event)
})
```

## Event Types by Primitive

### createState Events

```typescript
interface StateSetEvent extends BaseEvent {
  type: 'state.set'
  key: string | symbol
  value: any
  oldValue: any
}

interface StateDeleteEvent extends BaseEvent {
  type: 'state.delete'
  key: string | symbol
  oldValue: any
}
```

Emitted when:
- `state.set`: A property is set or updated (including array mutations)
- `state.delete`: A property is deleted

### createComputed Events

```typescript
interface ComputedDirtyEvent extends BaseEvent {
  type: 'computed.dirty'
  key: string
}

interface ComputedRecalculateEvent extends BaseEvent {
  type: 'computed.recalculate'
  key: string
  value: any
  previousValue: any
}
```

Emitted when:
- `computed.dirty`: A dependency changed, marking the computed as dirty
- `computed.recalculate`: The computed value is accessed while dirty and recalculated

### createView Events

```typescript
interface ViewActionEvent extends BaseEvent {
  type: 'view.action'
  key: string
  args: any[]
  result?: any
}
```

Emitted when:
- `view.action`: A wrapped function (action) is called
- Also forwards events from nested reactive primitives

### createAsync Events

```typescript
interface AsyncResolveEvent extends BaseEvent {
  type: 'async.resolve'
  value: any
}

interface AsyncRejectEvent extends BaseEvent {
  type: 'async.reject'
  error: any
}
```

Emitted when:
- `async.resolve`: The async operation resolves successfully
- `async.reject`: The async operation rejects with an error

### createQuery Events

```typescript
interface QueryFetchEvent extends BaseEvent {
  type: 'query.fetch'
  args: any[]
}

interface QueryResolveEvent extends BaseEvent {
  type: 'query.resolve'
  value: any
}

interface QueryRejectEvent extends BaseEvent {
  type: 'query.reject'
  error: any
}
```

Emitted when:
- `query.fetch`: A fetch is initiated
- `query.resolve`: The query resolves successfully
- `query.reject`: The query rejects with an error

### createMutation Events

```typescript
interface MutationMutateEvent extends BaseEvent {
  type: 'mutation.mutate'
  args: any[]
}

interface MutationResolveEvent extends BaseEvent {
  type: 'mutation.resolve'
  value: any
}

interface MutationRejectEvent extends BaseEvent {
  type: 'mutation.reject'
  error: any
}
```

Emitted when:
- `mutation.mutate`: A mutation is initiated
- `mutation.resolve`: The mutation resolves successfully
- `mutation.reject`: The mutation rejects with an error

## Implementation Requirements

### For Primitive Authors

Each reactive primitive must:

1. Implement the `[OBSERVE_SYMBOL]` method
2. Store registered listeners
3. Emit events synchronously when state changes
4. When a nested reactive primitive is detected:
   - Register itself as a listener on the nested primitive
   - Prepend its own path segment when forwarding events

Example implementation pattern:

```typescript
function useState(initialState) {
  const listeners = new Set()

  const proxy = new Proxy(initialState, {
    set(target, key, value) {
      const oldValue = target[key]
      target[key] = value

      // Emit event to all listeners
      const event = {
        path: [],
        type: 'state.set',
        timestamp: Date.now(),
        key,
        value,
        oldValue
      }

      for (const listener of listeners) {
        listener(event)
      }

      // If value is observable, register as listener
      if (value && typeof value === 'object' && OBSERVE_SYMBOL in value) {
        value[OBSERVE_SYMBOL]((childEvent) => {
          // Bubble up with updated path
          for (const listener of listeners) {
            listener({
              ...childEvent,
              path: [key, ...childEvent.path]
            })
          }
        }, [key])
      }

      return true
    }
  })

  proxy[OBSERVE_SYMBOL] = (listener, basePath = []) => {
    listeners.add(listener)
  }

  return proxy
}
```

### For Observer Consumers

Consumers using `observe()` should:

1. Handle all event types they care about
2. Implement their own batching/debouncing if needed
3. Call the returned unsubscribe function when done
4. Not mutate event objects (they may be reused)

## Usage Examples

### Basic Observation

```typescript
const state = useState({ count: 0 })

const unsubscribe = observe(state, (event) => {
  console.log('Event:', event.type, 'at path:', event.path)
})

state.count++ // Logs: Event: state.set at path: ["count"]

unsubscribe()
```

### Nested Observation

```typescript
const view = useView({
  user: useState({ name: 'Alice' }),
  counter: useState({ count: 0 }),
  increment() {
    this.counter.count++
  }
})

observe(view, (event) => {
  switch (event.type) {
    case 'state.set':
      console.log(`State changed at ${event.path.join('.')}: ${event.value}`)
      break
    case 'view.action':
      console.log(`Action called: ${event.key}`)
      break
  }
})

view.user.name = 'Bob' // Logs: State changed at user.name: Bob
view.increment()       // Logs: Action called: increment
                       // Logs: State changed at counter.count: 1
```

### Devtools Integration

```typescript
const eventLog = []

function createDevtools(rootView) {
  const unsubscribe = observe(rootView, (event) => {
    eventLog.push(event)

    // Send to devtools UI
    postMessage({
      type: 'SNABBDOM_COMPONENTS_EVENT',
      event
    })
  })

  return {
    getEvents: () => eventLog,
    clear: () => eventLog.length = 0,
    disconnect: unsubscribe
  }
}
```

## Performance Considerations

1. **Listener Storage**: Use `Set` for efficient add/remove operations
2. **Event Objects**: Can be reused/pooled if needed (consumers shouldn't mutate)
3. **Deep Paths**: Path arrays are created on bubble, consider pooling for hot paths
4. **Synchronous Emission**: Events fire immediately, consumers should batch if needed
5. **Weak References**: Consider `WeakMap` for listener storage to avoid memory leaks

## Future Considerations

- **Event Filtering**: Add optional filter parameter to `observe()`
- **Async Events**: Queue or batch events across microtasks
- **Time Travel**: Include event sequence numbers for debugging
- **Sampling**: Option to sample high-frequency events
- **Source Information**: Include stack traces or source locations in development mode

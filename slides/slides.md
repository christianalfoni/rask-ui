---
theme: default
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
title: Reactive state - Reconciling UI
mdc: true
---

<style>
table {
  border-collapse: collapse !important;
  border: none !important;
}
table th, table, tr, td {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}
table thead th {
  border-bottom: none !important;
}
</style>

<img src="/logo.png" alt="Logo" class="mx-auto mb-8 w-32 h-32" />

# Reactive state - Reconciling UI

**Two mental models merging**

---

# Good Old React - < 16.7

```tsx {all}
class CounterState extends Component {
  state = {
    count: 0,
  };
  // componentDidMount() {}
  // componentWillUnmount() {}
  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };
  render() {
    return <Counter count={this.count} increment={this.increment} />;
  }
}

function Counter({ count, increment }) {
  return (
    <div>
      <h1>Count is: {count}</h1>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

---

# Reconciling state and UI

```tsx {all}
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);

  return (
    <div>
      <h1>Count is: {count}</h1>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

|                               |                       |
| ----------------------------- | --------------------- |
| ✅ Single functional paradgim | ❌ Stale closures     |
| ✅ State Composition          | ❌ Dependency arrays  |
|                               | ❌ No lifecycle hooks |
|                               | ❌ Bandaid hooks      |

---

# Reactive state and UI

```tsx {all}
function Counter() {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(count() + 1);

  // onMount
  // onCleanup

  return (
    <div>
      <h1>Count is: {count()}</h1>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

|                               |                                              |
| ----------------------------- | -------------------------------------------- |
| ✅ Single functional paradgim | ❌ Reactive UIs are magical                  |
| ✅ State Composition          | ❌ Special reactive components instead of JS |
| ✅ Explicit lifecycle         | ❌ Unexpected runtime behavior               |
| ✅ Insanely performant        |                                              |

---

# Reactive state with reconciling UI

```tsx {all}
function Counter() {
  const state = useState({ count: 0 });
  const increment = () => state.count++;

  // createMountEffect
  // createCleanup

  return () => (
    <div>
      <h1>Count is: {state.count}</h1>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

|                               |                                         |
| ----------------------------- | --------------------------------------- |
| ✅ Single functional paradgim | ❌ Can not destructure reactive objects |
| ✅ State Composition          |                                         |
| ✅ Explicit lifecycle         |                                         |
| ✅ Insanely performant        |                                         |

---

# Stateful VS Stateless

```tsx {all}
function CounterState() {
  // Setup phase
  const state = useState({ count: 0 });
  const increment = () => state.count++;

  return () => {
    // Render phase (reconciliation)
    return <Counter count={state.count} increment={increment} />;
  };
}

function Counter(props) {
  // Render phase (reconciliation)
  return (
    <div>
      <h1>Count is: {props.count}</h1>
      <button onClick={props.increment}>Increment</button>
    </div>
  );
}
```

<br />
<h4>🔥 Inferno JS for reconciliation</h4>

---

# Primitives

```tsx {all}
const MyContext = createContext();

function CounterState() {
  MyContext.inject({});
  const context = MyContext.get();

  const state = useState({});
  const computed = useComputed({});
  const view = useView(state, computed);
  const async = createAsync(promise);
  const query = createQuery(() => fetchSomething());
  const mutation = createMutation(() => changeSomething());
  const ref = createRef();

  useEffect(() => {});
  useMountEffect(() => {});
  useCleanup(() => {});

  return () => <div />;
}
```

---

# Composition

```tsx {all}
function createCounter() {
  const state = useState({ count: 0 });
  const computed = useComputed({
    double: () => state.count * 2,
  });
  const increment = () => state.count++;

  return useView(state, computed, { increment });
}

export const CounterContext = createContext();

function App() {
  const counter = createCounter();

  CounterContext.inject(counter);

  return () => <div />;
}
```

---

<img src="/logo.png" alt="Logo" class="mx-auto mb-8 w-32 h-32" />

<div text-align="center">
<h1> RASK</h1>

**https://rask-ui.io**

<div class="mx-auto max-w-md">

```sh
npm create rask-ui
```

</div>

</div>

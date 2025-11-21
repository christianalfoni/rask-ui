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
css: unocss
---

<style src="./styles.css"></style>

<img src="/logo.png" alt="Logo" class="mx-auto mb-8 w-48 h-48" />

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
| <span class="text-green-600">Single functional paradigm</span> | <span class="text-red-600">Stale closures</span>     |
| <span class="text-green-600">State Composition</span>          | <span class="text-red-600">Dependency arrays</span>  |
|                               | <span class="text-red-600">No lifecycle hooks</span> |
|                               | <span class="text-red-600">Bandaid hooks</span>      |

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
| <span class="text-green-600">Single functional paradigm</span> | <span class="text-red-600">Reactive UIs are magical</span>                  |
| <span class="text-green-600">State Composition</span>          | <span class="text-red-600">Special reactive components instead of JS</span> |
| <span class="text-green-600">Explicit lifecycle</span>         | <span class="text-red-600">Unexpected runtime behavior</span>               |
| <span class="text-green-600">Insanely performant</span>        |                                              |

---

# Reactive state with reconciling UI

```tsx {all}
function Counter() {
  const state = useState({ count: 0 });
  const increment = () => state.count++;

  // useMountEffect
  // useCleanup

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
| <span class="text-green-600">Single functional paradigm</span> | <span class="text-red-600">Can not destructure reactive objects</span> |
| <span class="text-green-600">State Composition</span>          |                                         |
| <span class="text-green-600">Explicit lifecycle</span>         |                                         |
| <span class="text-green-600">Insanely performant</span>        |                                         |

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
<h4>Powered by Inferno JS for reconciliation</h4>

---

# Primitives

```tsx {all}
const MyContext = createContext();

function Component() {
  // Context
  const inject = useInjectContext(MyContext);
  inject(value);
  const context = useContext(MyContext);

  // Reactivity
  const state = useState({});
  const computed = useComputed({});
  const view = useView(state, computed);
  const [asyncState, run] = useAsync(async (params, signal) => {});
  const ref = useRef();

  // Lifecycle
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

  const inject = useInjectContext(CounterContext);
  inject(counter);

  return () => <div />;
}
```

---

<img src="/logo.png" alt="Logo" class="mx-auto mb-8 w-48 h-48" />

<div text-align="center">
<h1> RASK</h1>

**https://rask-ui.io**

<div class="mx-auto max-w-md">

```sh
npm create rask-ui
```

</div>

</div>

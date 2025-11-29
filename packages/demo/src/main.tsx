import { render, useCatchError, useState } from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

function Child(props: { count: number }) {
  return <div>COUNT!!! {props.count}</div>;
}

function Test() {
  const state = useState({
    count: 0,
  });
  return () => (
    <div>
      <h1 onClick={() => state.count++}>Hello World {state.count}</h1>
      <Child count={state.count} />
    </div>
  );
}

render(<Test />, document.querySelector("#app")!);

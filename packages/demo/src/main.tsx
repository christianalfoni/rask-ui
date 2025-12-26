import { render, useCatchError, useEffect, useState } from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

function Child(props: { count: number }) {
  useEffect(() => {
    return () => console.log("Cleanup Child");
  });
  return () => <div>COUNT!!! {props.count}</div>;
}

function Child2(props: { count: number }) {
  useEffect(() => {
    return () => console.log("Cleanup Child2");
  });
  return () => <div>COUNT!!! {props.count * 2}</div>;
}

function Test() {
  const state = useState({
    count: 0,
  });
  return () => (
    <div>
      <h1 onClick={() => state.count++}>Hello World {state.count}</h1>
      {state.count % 2 ? (
        <Child count={state.count} />
      ) : (
        <Child2 count={state.count} />
      )}
    </div>
  );
}

render(<Test />, document.querySelector("#app")!);

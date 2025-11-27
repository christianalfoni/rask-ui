import { render, useCatchError } from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

function Child(props: { foo: string; bar: string }) {
  return <div>{JSON.stringify({ ...props })}</div>;
}

function Test() {
  const globalError = useCatchError();
  return () => {
    if (globalError.error) {
      return <h1>NOOOOO, {String(globalError.error)}</h1>;
    }
    return (
      <div>
        <h1>Hello world</h1>
        if
        <Child foo="bar" bar="baz" />
      </div>
    );
  };
}

render(<Test />, document.querySelector("#app")!);

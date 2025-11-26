import { render } from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

function Test() {
  return <h1 onClick={myHandler}>Hello world</h1>;

  function myHandler(event: Rask.MouseEvent) {}
}

render(<Test />, document.querySelector("#app")!);

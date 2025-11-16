import { createState, createView, inspect, render } from "rask-ui";

import "./style.css";

function Test() {
  const state = createState({
    count: 0,
    mip: {
      mop: "map",
    },
  });

  function test() {
    state.count++;
    state.mip.mop += "!";
  }

  const view = createView({
    map: state,
    test,
  });

  const rootView = createView({
    view,
  });

  inspect(rootView, console.log);

  return () => <h1 onClick={view.test}>Count {rootView.view.map.count}</h1>;
}

render(<Test />, document.querySelector("#app")!);

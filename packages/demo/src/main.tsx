import {
  createContext,
  createEffect,
  createRouter,
  createTask,
  render,
  type Router,
} from "rask-ui";

import "./style.css";
import { TodoApp } from "./components/TodoApp";

const routes = {
  main: "/",
  issues: "/issues",
  issue: "/issues/:issue",
} as const;

const RouterContext = createContext<Router<typeof routes>>();

function Issues(props: { issue?: string }) {
  const issueTask = createTask(
    (issue: string) =>
      new Promise<string>((resolve) =>
        setTimeout(() => resolve(`Issue text for ${issue}`), 1000)
      )
  );

  createEffect(() => {
    if (props.issue) {
      console.log("Running task", props.issue);
      issueTask.run(props.issue);
    }
  });

  return () => (
    <div>
      <h4>Issues</h4>
      {props.issue ? (
        <div>
          {props.issue}: {issueTask.isRunning ? "Loading..." : issueTask.result}
        </div>
      ) : null}
    </div>
  );
}

function Test() {
  const router = createRouter(routes);

  RouterContext.inject(router);

  setTimeout(() => {
    router.push("issue", {
      issue: "654",
    });
  }, 3000);

  return () => {
    if (router.route?.name === "main") {
      return <h4>Main</h4>;
    }

    if (router.route?.name === "issues") {
      return <Issues />;
    }

    if (router.route?.name === "issue") {
      return <Issues issue={router.route.params.issue} />;
    }

    return <h4>Not found</h4>;
  };
}

render(<Test />, document.querySelector("#app")!);

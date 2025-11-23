import {
  useAsync,
  useCleanup,
  useDerived,
  useState,
  useSuspend,
} from "rask-ui";

function delay<T>(value: T) {
  return new Promise<T>((resolve) => setTimeout(resolve, 1000, value));
}

export function Example1() {
  const state = useState({
    count: 0,
  });
  const [doubled] = useAsync(() => delay(state.count * 2));
  const derived = useDerived({
    quad: () =>
      doubled.value ? { ...doubled, value: doubled.value * 2 } : doubled,
  });
  const suspended = useSuspend({
    count: () => state.count,
    quad: () => derived.quad,
  });

  return () => (
    <div>
      {suspended.isLoading ? (
        "Loading..."
      ) : (
        <p style={{ opacity: suspended.isRefreshing ? "0.5" : "1" }}>
          {suspended.values.count} - {suspended.values.quad}
        </p>
      )}

      <button onClick={() => state.count++}>Click</button>
    </div>
  );
}

export function Example2() {
  const state = useState({
    count: 0,
  });
  const [phrase, refreshPhrase] = useAsync(() => getPhrase(state.count));

  const suspended = useSuspend({
    count: () => state.count,
    phrase: () => phrase,
  });

  return () => {
    return (
      <div>
        <button onClick={() => state.count++}>
          Clicks: {suspended.values.count}
        </button>
        <div>{renderPhrase()}</div>
      </div>
    );
  };

  function renderPhrase() {
    if (suspended.error) {
      return (
        <div>
          {String(phrase.error)}{" "}
          <p>{suspended.isLoading ? "Initial load" : "update"}</p>
          <button onClick={refreshPhrase}>
            Try again ({suspended.values.count})
          </button>
        </div>
      );
    }

    if (suspended.isLoading) {
      return "Loading phrase...";
    }

    return suspended.values.phrase;
  }

  async function getPhrase(count: number) {
    await delay(1000);

    if (Math.random() < 0.5) {
      throw new Error("Oh man - " + count);
    }

    return "This is awesome - " + count;
  }
}

export function Example3() {
  const state = useState({
    page: "Uno" as "Uno" | "Dos" | "Tres",
    count: 0,
  });
  const [content, refresh] = useAsync(() => getPage(state.page));

  const interval = setInterval(() => state.count++, 1000);

  useCleanup(() => clearInterval(interval));

  const suspended = useSuspend({
    page: () => state.page,
    content: () => content,
  });

  return () => {
    return (
      <div>
        <div>
          <button
            style={{
              "font-weight":
                suspended.values.page === "Uno" ? "bold" : undefined,
            }}
            onClick={() => (state.page = "Uno")}
          >
            Uno
          </button>
          <button
            style={{
              "font-weight":
                suspended.values.page === "Dos" ? "bold" : undefined,
            }}
            onClick={() => (state.page = "Dos")}
          >
            Dos
          </button>
          <button
            style={{
              "font-weight":
                suspended.values.page === "Tres" ? "bold" : undefined,
            }}
            onClick={() => (state.page = "Tres")}
          >
            Tres
          </button>
        </div>
        <h4>Count is {state.count}</h4>
        <div>
          {suspended.isLoading ? "Loading..." : suspended.values.content}
        </div>
      </div>
    );
  };

  async function getPage(page: string) {
    await delay(1000);

    return "This content is for page: " + page;
  }
}

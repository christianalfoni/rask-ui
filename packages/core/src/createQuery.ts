import { createState } from "./createState";

type QueryState<T> =
  | {
      isPending: true;
      data: T | null;
      error: null;
    }
  | {
      isPending: false;
      data: T;
      error: null;
    }
  | {
      isPending: false;
      data: null;
      error: string;
    };

export type Query<T> = QueryState<T> & {
  fetch(force?: boolean): void;
};

export function createQuery<T>(fetcher: () => Promise<T>): Query<T> {
  const state = createState<QueryState<T>>({
    isPending: true,
    data: null,
    error: null,
  });
  const assign = (newState: QueryState<T>) => {
    Object.assign(state, newState);
  };

  let currentAbortController: AbortController | undefined;

  const fetch = () => {
    currentAbortController?.abort();

    const abortController = (currentAbortController = new AbortController());

    fetcher()
      .then((data) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data,
          error: null,
        });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        assign({
          isPending: false,
          data: null,
          error: String(error),
        });
      });
  };

  fetch();

  return {
    get isPending() {
      return state.isPending;
    },
    get data() {
      return state.data;
    },
    get error() {
      return state.error;
    },
    fetch(force) {
      assign({
        isPending: true,
        data: force ? null : state.data,
        error: null,
      });
      fetch();
    },
  } as Query<T>;
}

/*
import { observable, transaction } from "mobx";

type BlockingPromise<T> = {
  promise: Promise<T>;
  resolve: (value: Promise<T>) => void;
};

type IdleInternalState<T> = {
  current: "IDLE";
  blockingPromise: BlockingPromise<T>;
};

type ActiveInternalState = {
  current: "ACTIVE";
  abortController: AbortController;
};

type InternalState<T> = ActiveInternalState | IdleInternalState<T>;

export type QueryState<T> =
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: null;
      isRevalidating: false;
      isFetching: true;
    }
  | {
      promise: SuspensePromise<T>;
      error: Error;
      value: null;
      isRevalidating: false;
      isFetching: false;
    }
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: T;
      isRevalidating: false;
      isFetching: false;
    }
  | {
      promise: SuspensePromise<T>;
      error: null;
      value: T;
      isRevalidating: true;
      isFetching: false;
    };

// We need to use a blocking promise for the initial fetch, as we can
// not change the state during render. It will be resolved when the
// query is accessed during IDLE
function createBlockingPromise<T>() {
  let resolve!: (value: Promise<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return {
    promise,
    resolve,
  };
}

function executeQuery<T>(query: Query<T>) {
  if (query[INTERNAL].internalState.current !== "IDLE") {
    query[INTERNAL].internalState.abortController.abort();
  }

  const abortController = new AbortController();

  query.isRevalidating = true;

  const observablePromise = createObservablePromise<T>(
    query[INTERNAL].fetcher(),
    abortController,
    (promise) => {
      if (promise.status === "fulfilled") {
        const value = promise.value;
        transaction(() => {
          Object.assign(query, {
            error: null,
            isFetching: false,
            promise,
            value,
            isRevalidating: false,
          });
        });
      } else {
        transaction(() => {
          Object.assign(query, {
            error: promise.reason,
            isFetching: false,
            promise,
            isRevalidating: false,
            value: null,
          });
        });
      }
    }
  );

  query[INTERNAL].internalState = {
    current: "ACTIVE",
    abortController,
  };

  return observablePromise;
}

const INTERNAL = Symbol("internal");

export class Query<T> {
  private [INTERNAL]: {
    fetcher: () => Promise<T>;
    subscriptionCount: number;
    internalState: InternalState<T>;
    lazy: boolean;
  };

  private state: QueryState<T>;

  constructor(fetcher: () => Promise<T>, lazy = false) {
    const blockingPromise = createBlockingPromise<T>();
    const initialInternalState: IdleInternalState<T> = {
      current: "IDLE",
      blockingPromise,
    };

    this[INTERNAL] = {
      fetcher,
      subscriptionCount: 0,
      lazy,
      internalState: initialInternalState,
    };
    this.state = observable({
      error: null,
      value: null,
      isRevalidating: false,
      isFetching: true,
      // We set a pending blocking promise as we can not set state during render
      promise: createPendingPromise(blockingPromise.promise),
    });

    // If not lazy, execute immediately
    if (!lazy) {
      initialInternalState.blockingPromise.resolve(executeQuery(this));
    }
  }

  get error() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.error;
  }
  set error(newValue) {
    this.state.error = newValue;
  }
  get value() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.value;
  }
  set value(newValue) {
    this.state.value = newValue;
  }
  get isFetching() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.isFetching;
  }
  set isFetching(newValue) {
    this.state.isFetching = newValue;
  }
  get isRevalidating() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.isRevalidating;
  }
  set isRevalidating(newValue) {
    this.state.isRevalidating = newValue;
  }
  get promise() {
    if (
      this[INTERNAL].lazy &&
      this[INTERNAL].internalState.current !== "ACTIVE"
    ) {
      this[INTERNAL].internalState.blockingPromise.resolve(executeQuery(this));
    }

    return this.state.promise;
  }
  set promise(newValue) {
    this.state.promise = newValue;
  }
  fetch() {
    const promise = executeQuery(this);

    transaction(() => {
      Object.assign(this, {
        isFetching: true,
        isRevalidating: false,
        promise,
        value: null,
        error: null,
      });
    });

    return promise;
  }
  subscribe() {
    this[INTERNAL].subscriptionCount++;

    return () => {
      this[INTERNAL].subscriptionCount--;

      if (
        this[INTERNAL].subscriptionCount === 0 &&
        this[INTERNAL].internalState.current !== "IDLE"
      ) {
        this[INTERNAL].internalState.abortController.abort();
        this[INTERNAL].internalState = {
          current: "IDLE",
          blockingPromise: createBlockingPromise(),
        };

        Object.assign(this, {
          error: null,
          isFetching: true,
          promise: createPendingPromise(
            this[INTERNAL].internalState.blockingPromise.promise
          ),
          value: null,
          isRevalidating: false,
        });
      }
    };
  }

  revalidate(): Promise<T> {
    if (this[INTERNAL].internalState.current !== "ACTIVE") {
      const promise = executeQuery(this);

      this[INTERNAL].internalState.blockingPromise.resolve(promise);

      return this.promise;
    }

    return executeQuery(this);
  }
}

export function query<T>(
  fetcher: () => Promise<T>,
  options?: { lazy?: boolean }
) {
  return new Query(fetcher, options?.lazy) as Query<T> & QueryState<T>;
}

*/

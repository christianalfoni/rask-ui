import {
  createComponentVNode,
  VNode,
  Component,
  Props,
  InfernoNode,
} from "inferno";
import { VNodeFlags } from "inferno-vnode-flags";
import { getCurrentObserver, Observer, Signal } from "./observation";
import { syncBatch } from "./batch";
import { CatchErrorContext } from "./useCatchError";

export type RaskStatelessFunctionComponent<P extends Props<any>> =
  | (() => VNode)
  | ((props: P) => VNode);

export class RaskStatelessComponent extends Component {
  declare renderFn: RaskStatelessFunctionComponent<any>;
  private isNotified = false;
  private isReconciling = false;
  observer = new Observer(() => {
    if (this.isReconciling) {
      this.isNotified = true;
      return;
    }
    this.forceUpdate();
  });
  propsSignals: Record<string, Signal> = {};
  private reactiveProps!: Props<any>;

  shouldComponentUpdate(): boolean {
    const shouldRender = this.isNotified;
    this.isNotified = false;
    this.isReconciling = false;
    return shouldRender;
  }
  componentWillMount(): void {
    this.reactiveProps = createReactiveProps(this);
  }
  componentWillReceiveProps(nextProps: any): void {
    this.isReconciling = true;
    const prevProps = this.props;
    this.props = nextProps;
    syncBatch(() => {
      for (const prop in this.propsSignals!) {
        if ((prevProps as any)[prop] === (nextProps as any)[prop]) {
          continue;
        }

        // This just triggers the signal
        this.propsSignals[prop].notify();
      }
    });
  }
  render() {
    const stopObserving = this.observer.observe();
    let result: any = null;

    try {
      result = this.renderFn(this.reactiveProps);
    } catch (error) {
      const notifyError = CatchErrorContext.use();

      if (typeof notifyError !== "function") {
        throw error;
      }

      notifyError(error);
    } finally {
      stopObserving();
    }

    return result;
  }
}

let currentComponent: RaskStatefulComponent<any> | undefined;

export function getCurrentComponent() {
  return currentComponent;
}

export function useMountEffect(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use useMountEffect in component setup");
  }

  currentComponent.onMounts.push(cb);
}

export function useCleanup(cb: () => void) {
  if (!currentComponent || currentComponent.isRendering) {
    throw new Error("Only use useCleanup in component setup");
  }

  currentComponent.onCleanups.push(cb);
}

export type RaskStatefulFunctionComponent<P extends Props<any>> =
  | (() => () => VNode)
  | ((props: P) => () => VNode);

export class RaskStatefulComponent<P extends Props<any>> extends Component<P> {
  declare setup: RaskStatefulFunctionComponent<P>;
  private renderFn?: () => VNode;
  propsSignals: Record<string, Signal> = {};
  private reactiveProps!: Props<any>;

  // RECONCILIATION FLAGS
  // --------------------
  // These flags coordinate observer notifications with Inferno's reconciliation lifecycle
  // to prevent double-rendering while ensuring effects can update state synchronously.
  //
  // isReconciling: Set to true during componentWillReceiveProps. When true, the observer
  //   will NOT call forceUpdate() immediately, avoiding a render while Inferno is already
  //   in the middle of updating this component (which would cause a double-render).
  //
  // isNotified: Tracks whether the observer was notified during reconciliation. If true,
  //   it means reactive prop updates or effects have modified state, and the component
  //   should render to reflect those changes.
  //
  // Flow example (props change triggers effect that updates state):
  //   1. componentWillReceiveProps → isReconciling = true
  //   2. Prop updates in syncBatch → reactive prop signals notify
  //   3. Observer fires → sees isReconciling → sets isNotified = true, skips forceUpdate()
  //   4. shouldComponentUpdate → checks isNotified → returns true
  //   5. Component renders once with all updates (props + effect state changes)
  //
  // This ensures components render synchronously with fully updated state, without
  // calling forceUpdate() at the wrong time during Inferno's reconciliation.
  private isNotified = false;
  private isReconciling = false;

  observer = new Observer(() => {
    if (this.isReconciling) {
      this.isNotified = true;
      return;
    }

    this.forceUpdate();
  });
  // Flag to prevent props from tracking in render scope (We use props reconciliation)
  isRendering = false;
  effects: Array<{ isDirty: boolean; run: () => void }> = [];
  contexts = new Map();
  getChildContext() {
    const parentGetContext =
      this.context.getContext ||
      (() => {
        throw new Error("No context available");
      });

    return {
      ...this.context,
      getContext: (context: any) => {
        return this.contexts.get(context) || parentGetContext(context);
      },
    };
  }
  onMounts: Array<() => void> = [];
  onCleanups: Array<() => void> = [];

  componentDidMount(): void {
    this.onMounts.forEach((cb) => cb());
  }
  componentWillUnmount(): void {
    this.onCleanups.forEach((cb) => cb());
  }

  componentWillReceiveProps(
    nextProps: Readonly<{ children?: InfernoNode } & P>
  ): void {
    this.isReconciling = true;
    const prevProps = this.props;
    this.props = nextProps;
    syncBatch(() => {
      for (const prop in this.propsSignals!) {
        if ((prevProps as any)[prop] === (nextProps as any)[prop]) {
          continue;
        }

        this.propsSignals[prop].notify();
      }
    });
  }
  shouldComponentUpdate(): boolean {
    const shouldRender = this.isNotified;
    this.isNotified = false;
    this.isReconciling = false;
    return shouldRender;
  }
  render() {
    currentComponent = this;
    if (!this.renderFn) {
      this.reactiveProps = createReactiveProps(this);
      try {
        this.renderFn = this.setup(this.reactiveProps as any);

        if (typeof this.renderFn !== "function") {
          throw new Error("Component must return a render function");
        }
      } catch (error) {
        if (typeof this.context.notifyError !== "function") {
          throw error;
        }

        this.context.notifyError(error);

        return null;
      }
    }

    const stopObserving = this.observer.observe();
    let result: any = null;

    try {
      this.isRendering = true;
      result = this.renderFn();
      this.isRendering = false;
    } catch (error) {
      const notifyError = CatchErrorContext.use();

      if (typeof notifyError !== "function") {
        throw error;
      }

      notifyError(error);
    } finally {
      stopObserving();
      currentComponent = undefined;
    }

    return result;
  }
}

export function createComponent(props: Props<any>, key?: string) {
  return createComponentVNode(
    VNodeFlags.ComponentClass,
    RaskStatefulComponent,
    props as any,
    key
  );
}

function createReactiveProps(
  comp: RaskStatefulComponent<any> | RaskStatelessComponent
) {
  const props = new Proxy(
    {},
    {
      ownKeys() {
        return Object.getOwnPropertyNames(comp.props);
      },
      getOwnPropertyDescriptor(_, prop: string) {
        return {
          configurable: true,
          enumerable: true,
          value: comp.props[prop],
          writable: false,
        };
      },
      get(_, prop: string) {
        // Skip known non-reactive props
        if (prop === "key" || prop === "ref") {
          return;
        }

        const observer = getCurrentObserver();

        if (observer) {
          // Lazy create signal only when accessed in reactive context
          let signal = comp.propsSignals[prop];
          if (!signal) {
            signal = new Signal();
            comp.propsSignals[prop] = signal;
          }
          observer.subscribeSignal(signal);
        }

        return comp.props[prop];
      },
    }
  );

  return props;
}

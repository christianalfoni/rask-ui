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
import { PROXY_MARKER } from "./useState";

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
  private reactiveProps!: Props<any>;

  shouldComponentUpdate(): boolean {
    const shouldRender = this.isNotified;
    this.isNotified = false;
    this.isReconciling = false;
    return shouldRender;
  }
  componentWillReceiveProps(nextProps: any): void {
    this.isReconciling = true;
    syncBatch(() => {
      for (const prop in nextProps) {
        if ((this.props as any)[prop] === (nextProps as any)[prop]) {
          continue;
        }

        // @ts-ignore
        this.reactiveProps[prop] = nextProps[prop];
      }
    });
    this.props = nextProps;
  }
  render() {
    if (!this.reactiveProps) {
      this.reactiveProps = createReactiveProps(this);
    }

    const stopObserving = this.observer.observe();
    const result = this.renderFn(this.props);

    stopObserving();
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
  private reactiveProps?: Props<any>;
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
    const parentGetContext = this.context.getContext;

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
    syncBatch(() => {
      for (const prop in nextProps) {
        if ((this.props as any)[prop] === (nextProps as any)[prop]) {
          continue;
        }

        // @ts-ignore
        this.reactiveProps[prop] = nextProps[prop];
      }
    });
    this.props = nextProps;
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
      if (typeof this.context.notifyError !== "function") {
        throw error;
      }

      this.context.notifyError(error);
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
  const reactiveProps = {} as any;
  const signals = new Map<string, Signal>();

  for (const prop in comp.props) {
    const value = (comp.props as any)[prop];

    // Skip known non-reactive props
    if (prop === "key" || prop === "ref") {
      reactiveProps[prop] = value;
      continue;
    }

    // Skip objects/arrays - they're already reactive if they're proxies
    // No need to wrap them in additional signals
    if (typeof value === "object" && value !== null && PROXY_MARKER in value) {
      reactiveProps[prop] = value;
      continue;
    }

    // Only create reactive getters for primitives
    Object.defineProperty(reactiveProps, prop, {
      enumerable: true,
      get() {
        const observer = getCurrentObserver();

        if (observer) {
          // Lazy create signal only when accessed in reactive context
          let signal = signals.get(prop);
          if (!signal) {
            signal = new Signal();
            signals.set(prop, signal);
          }
          observer.subscribeSignal(signal);
        }

        return comp.props[prop];
      },
      set(value) {
        (comp.props as any)[prop] = value;
        // Only notify if signal was created (i.e., prop was accessed reactively)
        const signal = signals.get(prop);

        if (signal) {
          signal.notify();
        }
      },
    });
  }

  return reactiveProps;
}

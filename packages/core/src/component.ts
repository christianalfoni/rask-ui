import { Component, PropsWithChildren, ReactNode } from "react";
import { getCurrentObserver, Observer, Signal } from "./observation";

let currentComponent: RaskComponent<any> | undefined;

export function getCurrentComponent() {
  if (!currentComponent) {
    throw new Error("No current component");
  }

  return currentComponent;
}

export function onMount(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use onCleanup in component setup");
  }

  currentComponent.onMounts.push(cb);
}

export function onCleanup(cb: () => void) {
  if (!currentComponent) {
    throw new Error("Only use onCleanup in component setup");
  }

  currentComponent.onCleanups.push(cb);
}

export type RaskFunctionComponent<P extends PropsWithChildren<any>> =
  | (() => () => ReactNode)
  | ((props: P) => () => ReactNode);

export class RaskComponent<P extends PropsWithChildren<any>> extends Component<
  P & { __component?: RaskFunctionComponent<P> }
> {
  setup?: RaskFunctionComponent<P>;
  private renderFn?: () => ReactNode;
  private reactiveProps?: PropsWithChildren<any>;
  private observer = new Observer(() => {
    this.forceUpdate();
  });
  private isRendering = false;
  onMounts: Array<() => void> = [];
  onCleanups: Array<() => void> = [];
  private createReactiveProps() {
    const reactiveProps = {} as any;
    const self = this;
    for (const prop in this.props) {
      const signal = new Signal();
      // @ts-ignore
      let reactiveValue = this.props[prop];
      Object.defineProperty(reactiveProps, prop, {
        get() {
          if (!self.isRendering) {
            const observer = getCurrentObserver();

            if (observer) {
              observer.subscribeSignal(signal);
            }
          }

          // @ts-ignore
          return self.props[prop];
        },
        set(value) {
          if (reactiveValue !== value) {
            reactiveValue = value;
            signal.notify();
          }
        },
      });
    }

    return reactiveProps;
  }

  componentDidMount(): void {
    this.onMounts.forEach((cb) => cb());
  }
  componentWillUnmount(): void {
    this.onCleanups.forEach((cb) => cb());
  }
  componentDidUpdate() {
    for (const prop in this.props) {
      if (prop === "__component" || prop === "children") {
        continue;
      }

      // @ts-ignore
      this.reactiveProps[prop] = this.props[prop];
    }
  }
  shouldComponentUpdate(nextProps: PropsWithChildren<any>): boolean {
    // Shallow comparison of props, excluding internal props
    for (const prop in nextProps) {
      if (prop === "__component") {
        continue;
      }

      // @ts-ignore
      if (this.props[prop] !== nextProps[prop]) {
        return true;
      }
    }

    return false;
  }
  render() {
    if (!this.renderFn) {
      this.reactiveProps = this.createReactiveProps();
      currentComponent = this;
      // Support both setup property (for extended classes) and __component prop (for JSX runtime)
      const componentFn = this.setup || this.props.__component;

      if (!componentFn) {
        throw new Error(
          "Component must have either a setup property or __component prop"
        );
      }

      this.renderFn = componentFn.call(this, this.reactiveProps as any);

      if (typeof this.renderFn !== "function") {
        throw new Error("Component must return a render function");
      }
      currentComponent = undefined;
    }

    const stopObserving = this.observer.observe();
    let result: any = null;

    this.isRendering = true;
    result = this.renderFn();
    this.isRendering = false;
    stopObserving();

    return result;
  }
}

import { VNode, Component, Props, InfernoNode } from "inferno";
import { CatchErrorContext } from "./useCatchError";
import { IObservableValue, Reaction, observable } from "mobx";
import { transaction } from "./scheduler";
import { assignState } from "./useState";

let currentComponent: RaskComponent<any> | undefined;

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

export type RaskStatelessFunctionComponent<P extends Props<any>> =
  | (() => VNode)
  | ((props: P) => VNode);

export type RaskStatefulFunctionComponent<P extends Props<any>> =
  | (() => () => VNode)
  | ((props: P) => () => VNode);

export class RaskComponent<P extends Props<any>> extends Component<P> {
  declare renderFn: RaskStatelessFunctionComponent<P>;
  propsSignals: Record<string, IObservableValue<any>> = {};
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
  private hasChangedComponent = true;
  private createReaction() {
    return new Reaction("ComponentRender", () => {
      if (this.isReconciling) {
        this.isNotified = true;
        return;
      }

      this.forceUpdate();
    });
  }
  private reaction: Reaction = this.createReaction();
  // Flag to prevent props from tracking in render scope (We use props reconciliation)
  isRendering = false;
  effects: Array<{ isDirty: boolean; run: () => void }> = [];
  contexts = new Map();
  getContext(context: unknown) {
    const parentGetContext =
      this.context.getContext ||
      (() => {
        throw new Error("No context available");
      });

    return this.contexts.get(context) || parentGetContext(context);
  }
  getChildContext() {
    return {
      ...this.context,
      getContext: this.getContext.bind(this),
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
    this.hasChangedComponent =
      (nextProps as any).__component !== (this.props as any).__component;
    transaction(() => {
      assignState(this.reactiveProps, nextProps);
    });
  }
  shouldComponentUpdate(): boolean {
    const shouldRender = this.isNotified || this.hasChangedComponent;
    this.isNotified = false;
    this.isReconciling = false;
    return shouldRender;
  }
  render() {
    currentComponent = this;

    try {
      if (this.hasChangedComponent) {
        this.hasChangedComponent = false;
        this.componentWillUnmount();
        this.reactiveProps = observable(this.props);

        const component = (this.props as any).__component;
        const renderFn = component(this.reactiveProps as any);

        if (typeof renderFn === "function") {
          this.renderFn = renderFn;
        } else {
          this.renderFn = component;
        }
      }

      let result: any = null;

      this.isRendering = true;

      this.reaction.track(() => {
        try {
          result = this.renderFn(this.reactiveProps as any);
        } catch (error) {
          try {
            const notifyError = CatchErrorContext.use();

            if (typeof notifyError !== "function") {
              throw error;
            }

            notifyError(error);

            return null;
          } catch {
            throw error;
          }
        }
      });
      this.isRendering = false;

      return result;
    } catch (error) {
      try {
        const notifyError = CatchErrorContext.use();

        if (typeof notifyError !== "function") {
          throw error;
        }

        notifyError(error);

        return null;
      } catch {
        throw error;
      }
    } finally {
      currentComponent = undefined;
    }
  }
}

import { AbstractVNode } from "./AbstractVNode";
import { VNode } from "./types";
import { ComponentInstance } from "./ComponentVNode";

// Global reference to the currently executing root
// Safe because JS is single-threaded - only one render executes at a time
export let currentRoot: RootVNode | undefined;

export class RootVNode extends AbstractVNode {
  children: VNode[];
  componentStack: ComponentInstance[] = [];
  private lifecycleQueue = {
    toMount: [] as Array<() => void>,
    toUnmount: [] as Array<() => void>,
  };

  constructor(rootNode: VNode, container: HTMLElement) {
    super();
    this.elm = container;
    this.children = [rootNode];
  }

  queueMount(cb: () => void) {
    this.lifecycleQueue.toMount.push(cb);
  }

  queueUnmount(cb: () => void) {
    this.lifecycleQueue.toUnmount.push(cb);
  }

  flushLifecycle() {
    this.lifecycleQueue.toUnmount.forEach((cb) => cb());
    this.lifecycleQueue.toUnmount = [];
    this.lifecycleQueue.toMount.forEach((cb) => cb());
    this.lifecycleQueue.toMount = [];
  }

  pushComponent(instance: ComponentInstance) {
    this.componentStack.unshift(instance);
  }

  popComponent() {
    this.componentStack.shift();
  }

  setAsCurrent() {
    currentRoot = this;
  }

  clearCurrent() {
    if (currentRoot === this) {
      currentRoot = undefined;
    }
  }

  mount(): Node | Node[] {
    return this.children.map((childNode) => childNode.mount(this)).flat();
  }
  patch(): void {}
  rerender(): void {
    const childrenElms = this.children
      .map((child) => child.getElements())
      .flat();

    (this.elm as HTMLElement).replaceChildren(...childrenElms);

    this.flushLifecycle();
  }
  unmount(): void {}
}

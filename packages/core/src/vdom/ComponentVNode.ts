import { AbstractVNode } from "./AbstractVNode";
import { ElementVNode } from "./ElementVNode";
import { FragmentVNode } from "./FragmentVNode";
import { Component, Props, VNode } from "./types";

export class ComponentVNode extends AbstractVNode {
  component: Component;
  props: Props;
  children: VNode[];
  constructor(
    component: Component,
    props: Props,
    children: VNode[],
    key?: string
  ) {
    super();
    this.component = component;
    this.props = props;
    this.children = children;
  }
  updateChildren(prevNode: VNode, nextNode: VNode): void {
    this.children.splice(this.children.indexOf(prevNode), 1, nextNode);
    this.parent?.updateChildren(this, this);
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    return this.children.map((child) => child.mount(this)).flat();
  }
  patch(prevNode: VNode) {
    if (prevNode instanceof ElementVNode) {
      // Mount this
      // Unmount prev
      // Replace
    } else if (prevNode instanceof FragmentVNode) {
      // Mount this node
      // Unmount old
      // Replace unmounted with mounted
    } else if (prevNode instanceof ComponentVNode) {
      // Should replace?
      // If so: Mount new
      // If so: Unmount old
    }
  }
  unmount() {
    this.children.map((child) => child.unmount());
  }
}

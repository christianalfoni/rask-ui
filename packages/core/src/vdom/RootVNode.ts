import { AbstractVNode } from "./AbstractVNode";
import { VNode } from "./types";

export class RootVNode extends AbstractVNode {
  children: VNode[];
  constructor(rootNode: VNode, container: HTMLElement) {
    super();
    this.elm = container;
    this.children = [rootNode];
  }
  mount(): Node | Node[] {
    return this.children.map((childNode) => childNode.mount(this)).flat();
  }
  patch(): void {}
  updateChildren(prevNode: VNode, newNode: VNode): void {
    this.children.splice(this.children.indexOf(prevNode), 1, newNode);

    const childrenElms = this.children
      .map((child) => child.getElements())
      .flat();

    (this.elm as HTMLElement).replaceChildren(...childrenElms);
  }
  unmount(): void {}
}

import { AbstractVNode } from "./AbstractVNode";
import { ComponentVNode } from "./ComponentVNode";
import { ElementVNode } from "./ElementVNode";
import { TextVNode } from "./TextVNode";
import { VNode } from "./types";

export const Fragment = Symbol("Fragment");

export class FragmentVNode extends AbstractVNode {
  children: VNode[];
  key?: string;
  elm = document.createDocumentFragment();

  constructor(children: VNode[], key?: string) {
    super();
    this.children = children;
    this.key = key;
  }
  mount(parent?: VNode): Node[] {
    this.parent = parent;

    return this.children.map((child) => child.mount(this)).flat();
  }
  updateChildren(prevNode: VNode, nextNode: VNode): void {
    this.children.splice(this.children.indexOf(prevNode), 1, nextNode);
    this.parent?.updateChildren(this, this);
  }
  patch(prevNode: VNode, isRootPatch: boolean = true) {
    this.parent = prevNode.parent;

    const newChildrenElms = this.patchChildren(prevNode.children);

    newChildrenElms.forEach((elm) => this.elm.appendChild(elm));

    if (isRootPatch) {
      this.parent?.updateChildren(prevNode, this);
    }

    // Normally we would do the DOM operations here, as we have the element to apply
    // the changes to. But now we need to go up the tree to figure out where to put
    // the elements. Question is how would a parent know where to put them? I
    // think we would need like a this.replaceElementsInParent(els), which would pass
    // the elements and its own child reference up the tree so it can be reaplced
  }
  unmount() {
    delete this.parent;
    this.elm.textContent = "";
  }
}

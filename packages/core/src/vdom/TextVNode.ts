import { AbstractVNode } from "./AbstractVNode";
import { VNode } from "./types";

export class TextVNode extends AbstractVNode {
  text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  mount(parent?: VNode): Node {
    this.parent = parent;

    const textNode = document.createTextNode(this.text);

    this.elm = textNode;

    return textNode;
  }
  patch(prevNode: VNode, isRootPatch: boolean = true) {
    this.parent = prevNode.parent;

    if (prevNode instanceof TextVNode) {
      this.elm = prevNode.elm;
      this.elm!.textContent = this.text;
      prevNode.unmount();
    } else {
      this.elm = this.mount(this.parent);
      prevNode.unmount();
    }
  }
  updateChildren(prevNode: VNode, newNode: VNode): void {}
  unmount() {
    delete this.elm;
    delete this.parent;
  }
}

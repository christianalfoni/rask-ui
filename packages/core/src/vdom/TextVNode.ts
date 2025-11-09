import { AbstractVNode } from "./AbstractVNode";
import { RootVNode } from "./RootVNode";
import { VNode } from "./types";

export class TextVNode extends AbstractVNode {
  text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  mount(parent?: VNode): Node {
    this.parent = parent;

    if (parent instanceof RootVNode) {
      this.root = parent;
    } else {
      this.root = parent?.root;
    }

    const textNode = document.createTextNode(this.text);

    this.elm = textNode;

    return textNode;
  }
  patch(newNode: TextVNode) {
    this.text = newNode.text;
    this.elm!.textContent = this.text;
  }
  rerender(): void {}
  unmount() {
    this.root?.queueUnmount(() => {
      delete this.elm;
      delete this.parent;
    });
  }
}

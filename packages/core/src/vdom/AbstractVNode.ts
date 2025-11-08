import { elementsToFragment, removeElementRange } from "./dom-utils";
import { VNode } from "./types";

export abstract class AbstractVNode {
  key?: string;
  parent?: VNode;
  elm?: Node;
  children?: VNode[];
  abstract mount(parent?: VNode): Node | Node[];
  abstract patch(oldNode: VNode, isRootPatch?: boolean): void;
  abstract unmount(): void;
  abstract updateChildren(prevNode: VNode, newNode: VNode): void;
  protected getHTMLElement() {
    if (!this.elm || !(this.elm instanceof HTMLElement)) {
      throw new Error("This VNode does not have an HTMLElement");
    }

    return this.elm;
  }
  /**
   * A VNode can represent multiple elements (fragment of component)
   */
  getElements(): Node[] {
    if (this.elm) {
      return [this.elm];
    }

    if (!this.children) {
      throw new Error("This VNode has no element or children");
    }

    return this.children.map((child) => child.getElements()).flat();
  }
  getParentElement(): HTMLElement {
    let parent = this.parent;
    let thisElm = this.elm;

    // This VNode might not have an element, but relies
    // on a parent for it. So we make sure that we get
    // the actual parent of the element related to this VNode
    while (parent) {
      if (parent.elm instanceof HTMLElement && thisElm) {
        // This will always be an HTMLElement as text nodes has no children
        return parent.elm as HTMLElement;
      } else if (parent.elm) {
        thisElm = parent.elm;
      }

      parent = parent.parent;
    }

    throw new Error("There is no parent element for this VNode");
  }
  patchChildren(prevChildren?: VNode[]): Node[] {
    let newChildren = this.children;

    if (newChildren === undefined && prevChildren === undefined) {
      return [];
    }

    // When there are only new children, we just mount them
    if (newChildren && prevChildren === undefined) {
      return newChildren.map((child) => child.mount(this as any)).flat();
    }

    // If we want to remove all children, we just unmount the previous ones
    if (newChildren === undefined && prevChildren) {
      prevChildren.forEach((child) => child.unmount());
      return [];
    }

    newChildren = newChildren as VNode[];
    prevChildren = prevChildren as VNode[];

    const oldKeys: Record<string, VNode> = {};

    prevChildren.forEach((prevChild, index) => {
      oldKeys[prevChild.key || index] = prevChild;
    });

    // Okay, so this does not seem to properly handle mount when in between children are created
    newChildren.forEach((newChild, index) => {
      const key = newChild.key || index;

      const prevChild = oldKeys[key];

      if (!prevChild) {
        newChild.mount(this as any);
        return;
      }

      newChild.patch(prevChild, false);

      delete oldKeys[key];
    });

    for (const key in oldKeys) {
      oldKeys[key].unmount();
    }

    return newChildren.map((child) => child.getElements()).flat();
  }
}

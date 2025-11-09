import { Component, ComponentVNode } from "./ComponentVNode";
import { elementsToFragment } from "./dom-utils";
import { ElementVNode } from "./ElementVNode";
import { Fragment, FragmentVNode } from "./FragmentVNode";
import { RootVNode } from "./RootVNode";
import { Props, VNode } from "./types";
import { normalizeChildren } from "./utils";

export function jsx(
  type: string | typeof Fragment | Component<any>,
  props?: Props,
  key?: string
) {
  const { children, ...normalizedProps } = props || {};
  const normalizedChildren =
    children === undefined ? [] : normalizeChildren(children);

  if (typeof type === "string") {
    return new ElementVNode(type, normalizedProps, normalizedChildren, key);
  }

  if (type === Fragment) {
    return new FragmentVNode(normalizedChildren, key);
  }

  return new ComponentVNode(type, normalizedProps, normalizedChildren, key);
}
export const jsxs = jsx;
export const jsxDEV = jsx;

export function render(vnode: VNode, container: HTMLElement) {
  const rootNode = new RootVNode(vnode, container);
  const elms = rootNode.mount();
  container.appendChild(elementsToFragment(elms));
  rootNode.flushLifecycle();
  return rootNode;
}

export {
  createVNode,
  createFragment,
  createTextVNode,
  normalizeProps,
  Component,
} from "inferno";

import {
  Component,
  createComponentVNode as infernoCreateComponentVnode,
  VNode,
} from "inferno";
import { VNodeFlags } from "inferno-vnode-flags";
import { RaskComponent } from "./component";

export function createComponentVNode(
  _: any,
  component: any,
  props: any = {},
  key: any,
  ref: any
): VNode {
  props.__component = component;
  return infernoCreateComponentVnode(
    VNodeFlags.ComponentClass,
    RaskComponent,
    props,
    key,
    ref
  );
}

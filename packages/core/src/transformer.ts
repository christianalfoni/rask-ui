export {
  createVNode,
  createFragment,
  createTextVNode,
  normalizeProps,
  Component,
} from "inferno";

import {
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
    // Since RaskComponent is generic for all components we need to differentiate changing out the component, which
    // we do simply by using the name as a key. There is not chance two different components has the same name,
    // but is not the same component in the same component tree position
    key || component.name,
    ref
  );
}

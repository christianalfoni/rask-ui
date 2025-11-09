import { ComponentVNode } from "./ComponentVNode";
import { ElementVNode } from "./ElementVNode";
import { FragmentVNode } from "./FragmentVNode";
import { RootVNode } from "./RootVNode";
import { TextVNode } from "./TextVNode";

export type VNode =
  | ElementVNode
  | FragmentVNode
  | ComponentVNode
  | TextVNode
  | RootVNode;

export type Props = Record<string, unknown>;

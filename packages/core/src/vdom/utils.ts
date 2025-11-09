import { ComponentVNode } from "./ComponentVNode";
import { TextVNode } from "./TextVNode";
import { VNode } from "./types";

export function diffObjectKeys(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  onChange: (key: string, value: any, oldValue: any) => void
) {
  // Added or changed
  for (const key in newObj) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (oldVal !== newVal) {
      onChange(key, newVal, oldVal);
    }
  }

  // Removed
  for (const key in oldObj) {
    if (!(key in newObj)) {
      onChange(key, null, oldObj[key]);
    }
  }
}

export function normalizeChildren(input: any): any[] {
  const out: any[] = [];
  if (input == null || typeof input === "boolean") return out;

  // Fast path for single primitive or vnode
  if (typeof input === "string" || typeof input === "number") {
    out.push(new TextVNode(String(input)));
    return out;
  }
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (c == null || typeof c === "boolean") continue;
      if (Array.isArray(c)) {
        // Flatten nested arrays directly
        const nested = normalizeChildren(c);
        for (let j = 0; j < nested.length; j++) out.push(nested[j]);
      } else if (typeof c === "string" || typeof c === "number") {
        out.push(new TextVNode(String(c)));
      } else {
        out.push(c);
      }
    }
    return out;
  }

  // Otherwise assume already a VNode
  out.push(input);
  return out;
}

export function findComponentVNode(vnode?: VNode): ComponentVNode | void {
  if (!vnode) {
    return;
  }

  while (vnode && !(vnode instanceof ComponentVNode)) {
    if (!vnode.parent) {
      return;
    }

    vnode = vnode.parent;
  }

  return vnode;
}

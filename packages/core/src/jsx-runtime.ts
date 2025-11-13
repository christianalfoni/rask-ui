// JSX runtime implementation
import {
  Component,
  createComponentVNode,
  createVNode,
  createFragment,
  Fragment,
} from "inferno";
import { VNodeFlags, ChildFlags } from "inferno-vnode-flags";
import type { JSXInternal } from "./jsx";
import { createComponent } from "./component";
import { ErrorBoundary } from "./error";
export { Fragment };

// Cache for detecting SVG elements
const svgElements = new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "ellipse",
  "polygon",
  "polyline",
  "g",
  "text",
  "tspan",
  "defs",
  "use",
  "clipPath",
  "mask",
]);

export function jsx(
  type: string,
  props: JSXInternal.HTMLAttributes &
    JSXInternal.SVGAttributes &
    Record<string, any>,
  key?: string
): any;
export function jsx<P>(
  type: ((props: P) => any) | (new () => Component),
  props: P & { children?: any },
  key?: string
): any;
export function jsx(type: any, props: any, key?: any): any {
  // Handle Fragment specially
  if (type === Fragment) {
    const children = props?.children;
    const propsKey = props?.key !== undefined ? props.key : key;

    // Determine ChildFlags for Fragment children
    let childFlags = ChildFlags.HasInvalidChildren;
    if (children !== undefined && children !== null) {
      if (Array.isArray(children)) {
        if (children.length === 0) {
          childFlags = ChildFlags.HasInvalidChildren;
        } else {
          // Check if array contains any primitives
          let hasOnlyVNodes = true;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (
              child == null ||
              typeof child === "string" ||
              typeof child === "number" ||
              typeof child === "boolean"
            ) {
              hasOnlyVNodes = false;
              break;
            }
          }
          childFlags = hasOnlyVNodes
            ? ChildFlags.HasNonKeyedChildren
            : ChildFlags.UnknownChildren;
        }
      } else {
        childFlags = ChildFlags.HasVNodeChildren;
      }
    }

    return createFragment(children, childFlags, propsKey);
  }

  if (typeof type === "string") {
    const children = props.children;
    const propsKey = props.key !== undefined ? props.key : key;

    // Avoid creating new objects - extract only what we need
    let cleanProps: any = null;
    let className = null;
    let ref = null;

    if (props) {
      // Fast path: check if we have any props besides children/key
      const propKeys = Object.keys(props);
      if (propKeys.length > 0) {
        for (let i = 0; i < propKeys.length; i++) {
          const propKey = propKeys[i];
          if (propKey === "children" || propKey === "key") {
            continue;
          }
          if (propKey === "className" || propKey === "class") {
            className = props[propKey];
          } else if (propKey === "ref") {
            ref = props[propKey];
          } else {
            if (!cleanProps) cleanProps = {};
            cleanProps[propKey] = props[propKey];
          }
        }
      }
    }

    // Determine VNodeFlags based on element type
    const flags = svgElements.has(type)
      ? VNodeFlags.SvgElement
      : VNodeFlags.HtmlElement;

    // Determine ChildFlags for optimization
    let childFlags = ChildFlags.HasInvalidChildren;
    if (children !== undefined && children !== null) {
      if (Array.isArray(children)) {
        if (children.length === 0) {
          childFlags = ChildFlags.HasInvalidChildren;
        } else {
          // Check if array contains any primitives that need normalization
          let hasOnlyVNodes = true;
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (
              child == null ||
              typeof child === "string" ||
              typeof child === "number" ||
              typeof child === "boolean"
            ) {
              hasOnlyVNodes = false;
              break;
            }
          }
          // If array contains primitives, use UnknownChildren to let Inferno normalize
          childFlags = hasOnlyVNodes
            ? ChildFlags.HasNonKeyedChildren
            : ChildFlags.UnknownChildren;
        }
      } else if (typeof children === "string" || typeof children === "number") {
        childFlags = ChildFlags.HasTextChildren;
      } else {
        childFlags = ChildFlags.HasVNodeChildren;
      }
    }

    // Use createVNode directly - much faster than createElement
    return createVNode(
      flags,
      type,
      className,
      children,
      childFlags,
      cleanProps,
      propsKey,
      ref
    );
  }

  if (type === ErrorBoundary) {
    return createComponentVNode(
      VNodeFlags.Component,
      ErrorBoundary,
      props,
      key
    );
  }

  // For custom components, add __component to existing props object
  // Only create new object if we need to add __component
  if (props && props.__component === type) {
    return createComponent(props, key);
  }

  const componentProps: any = { __component: type };
  if (props) {
    for (const k in props) {
      componentProps[k] = props[k];
    }
  }

  return createComponent(componentProps, key);
}

export function jsxs(
  type: string,
  props: JSXInternal.HTMLAttributes &
    JSXInternal.SVGAttributes &
    Record<string, any>,
  key?: string
): any;
export function jsxs<P>(
  type: (props: P) => any,
  props: P & { children?: any[] },
  key?: string
): any;
export function jsxs(type: any, props: any, key?: any): any {
  return jsx(type, props, key);
}

// Export the JSXInternal namespace renamed as JSX for TypeScript
export type { JSXInternal as JSX } from "./jsx";

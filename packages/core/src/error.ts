import { getCurrentComponent } from "./vdom/ComponentVNode";

export function ErrorBoundary(props: {
  error: (error: unknown) => ChildNode | ChildNode[];
  children: any;
}) {
  const component = getCurrentComponent();

  return () => {
    if (component.error) {
      return props.error(component.error);
    }

    // Fix parent relationship: children vnodes were created with wrong parent,
    // we need to update them to point to this ErrorBoundary component
    const children = Array.isArray(props.children)
      ? props.children
      : [props.children];
    children.forEach((child: any) => {
      if (child?.data?.parentComponent) {
        child.data.parentComponent = component;
      }
    });

    return props.children;
  };
}

import { getCurrentComponent } from "./component";

export function ErrorBoundary(props: {
  error: (error: unknown) => ChildNode | ChildNode[];
  children: any;
}) {
  const component = getCurrentComponent();
  return () => {
    return component.error ? props.error(component.error) : props.children;
  };
}

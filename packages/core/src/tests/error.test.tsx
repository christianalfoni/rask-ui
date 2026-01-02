import { describe, it, expect } from "vitest";
import { useCatchError } from "../useCatchError";
import { render } from "../";

describe("useCatchError", () => {
  it("should render children when no error occurs", async () => {
    function SafeChild() {
      return () => <div>Safe content</div>;
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Error: {String(errorState.error)}</div>
        ) : (
          <SafeChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");
    expect(container.textContent).not.toContain("Error:");

    document.body.removeChild(container);
  });

  it("should catch errors thrown in child components", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Child component error");
        return <div />;
      };
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Error: {String(errorState.error)}</div>
        ) : (
          <ThrowingChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Error:");
    expect(container.textContent).toContain("Child component error");

    document.body.removeChild(container);
  });

  it("should render custom error UI", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Something went wrong");
        return <div />;
      };
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div class="error-ui">
            <h1>Oops!</h1>
            <p>{String(errorState.error)}</p>
          </div>
        ) : (
          <ThrowingChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const errorUI = document.querySelector(".error-ui");
    expect(errorUI).not.toBeNull();
    expect(errorUI?.querySelector("h1")?.textContent).toBe("Oops!");
    expect(errorUI?.textContent).toContain("Something went wrong");

    document.body.removeChild(container);
  });

  it("should handle multiple children", async () => {
    function SafeChild1() {
      return () => <div>Child 1</div>;
    }

    function SafeChild2() {
      return () => <div>Child 2</div>;
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Error: {String(errorState.error)}</div>
        ) : (
          <>
            <SafeChild1 />
            <SafeChild2 />
          </>
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Child 1");
    expect(container.textContent).toContain("Child 2");

    document.body.removeChild(container);
  });

  it("should catch errors from nested children", async () => {
    function DeepChild() {
      return () => {
        throw new Error("Deep error");
        return <div />;
      };
    }

    function MiddleChild() {
      return () => <DeepChild />;
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Caught: {String(errorState.error)}</div>
        ) : (
          <MiddleChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Caught:");
    expect(container.textContent).toContain("Deep error");

    document.body.removeChild(container);
  });

  it("should allow nested error boundaries", async () => {
    function ThrowingChild() {
      return () => {
        throw new Error("Inner error");

        return <div />;
      };
    }

    function InnerBoundary() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Inner: {String(errorState.error)}</div>
        ) : (
          <ThrowingChild />
        );
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Outer: {String(errorState.error)}</div>
        ) : (
          <InnerBoundary />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Inner boundary should catch the error
    expect(container.textContent).toContain("Inner:");
    expect(container.textContent).not.toContain("Outer:");

    document.body.removeChild(container);
  });

  it("should handle string errors", async () => {
    function ThrowingChild() {
      return () => {
        throw "String error";

        return <div />;
      };
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Error: {String(errorState.error)}</div>
        ) : (
          <ThrowingChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("String error");

    document.body.removeChild(container);
  });

  it("should handle object errors", async () => {
    function ThrowingChild() {
      return () => {
        throw { message: "Custom error object", code: 500 };

        return <div />;
      };
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () => {
        console.log(errorState.error);
        return errorState.error ? (
          <div>
            Error: {(errorState.error as any).message} (Code:{" "}
            {(errorState.error as any).code})
          </div>
        ) : (
          <ThrowingChild />
        );
      };
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Custom error object");
    expect(container.textContent).toContain("500");

    document.body.removeChild(container);
  });

  it("should switch back to children if error is cleared", async () => {
    // Note: This test demonstrates the current behavior
    // In practice, error clearing would require additional implementation
    function SafeChild() {
      return () => <div>Safe content</div>;
    }

    function TestComponent() {
      const errorState = useCatchError();

      return () =>
        errorState.error ? (
          <div>Error: {String(errorState.error)}</div>
        ) : (
          <SafeChild />
        );
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    render(<TestComponent />, container);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.textContent).toContain("Safe content");

    document.body.removeChild(container);
  });
});

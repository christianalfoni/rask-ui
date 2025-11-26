// Global Rask namespace for event types
import type {
  ClipboardEvent as InfernoClipboardEvent,
  ChangeEvent as InfernoChangeEvent,
  DragEvent as InfernoDragEvent,
  FocusEvent as InfernoFocusEvent,
  FormEvent as InfernoFormEvent,
  InfernoMouseEvent,
  InfernoAnimationEvent,
  InfernoKeyboardEvent,
  InfernoPointerEvent,
  InfernoTouchEvent,
  InfernoWheelEvent,
  InfernoTransitionEvent,
  CompositionEvent as InfernoCompositionEvent,
  Inferno,
} from "inferno";

declare global {
  namespace Rask {
    // Event types without "Inferno" prefix
    export type MouseEvent<T = Element> = InfernoMouseEvent<T>;
    export type AnimationEvent<T = Element> = InfernoAnimationEvent<T>;
    export type KeyboardEvent<T = Element> = InfernoKeyboardEvent<T>;
    export type PointerEvent<T = Element> = InfernoPointerEvent<T>;
    export type TouchEvent<T = Element> = InfernoTouchEvent<T>;
    export type WheelEvent<T = Element> = InfernoWheelEvent<T>;
    export type TransitionEvent<T = Element> = InfernoTransitionEvent<T>;
    export type ClipboardEvent<T = Element> = InfernoClipboardEvent<T>;
    export type ChangeEvent<T = Element> = InfernoChangeEvent<T>;
    export type DragEvent<T = Element> = InfernoDragEvent<T>;
    export type FocusEvent<T = Element> = InfernoFocusEvent<T>;
    export type FormEvent<T = Element> = InfernoFormEvent<T>;
    export type CompositionEvent<T = Element> = InfernoCompositionEvent<T>;
    export type ElementProps<T extends keyof JSX.IntrinsicElements> = Omit<
      JSX.IntrinsicElements[T],
      keyof Inferno.Attributes
    >;
  }
}

// This export is needed to make this file a module
export {};

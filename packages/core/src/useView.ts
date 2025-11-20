import { getCurrentComponent } from "./component";
import { INSPECT_MARKER, INSPECTOR_ENABLED, InspectorRef } from "./inspect";

type Simplify<T> = T extends any ? { [K in keyof T]: T[K] } : never;

type UndefinedKeys<T> = {
  [K in keyof T]-?: [T[K]] extends [undefined] ? K : never;
}[keyof T];

type MergeTwo<A extends object, B extends object> = A extends any
  ? Simplify<Omit<A, keyof B> & Omit<B, UndefinedKeys<B>>>
  : never;

type MergeMany<T extends readonly object[]> = T extends [
  infer H extends object,
  ...infer R extends object[]
]
  ? MergeManyAcc<H, R>
  : {};

type MergeManyAcc<Acc extends object, Rest extends object[]> = Rest extends [
  infer H extends object,
  ...infer R extends object[]
]
  ? MergeManyAcc<MergeTwo<Acc, H>, R>
  : Acc;

/**
 * Creates a view that merges multiple objects (reactive or not) into a single
 * object while maintaining reactivity through getters. Properties from later
 * arguments override earlier ones.
 *
 * ⚠️ Do not destructure the returned view object; always read properties
 * directly from the view to preserve reactivity.
 */
export function useView<A extends object>(a: A): A;
export function useView<A extends object, B extends object>(
  a: A,
  b: B
): MergeTwo<A, B>;
export function useView<T extends readonly object[]>(...args: T): MergeMany<T>;
export function useView(...args: readonly object[]): any {
  if (!getCurrentComponent()) {
    throw new Error("Only use createView in component setup");
  }

  const result: any = {};
  const seen = new Set<PropertyKey>();
  let notifyInspectorRef: InspectorRef = {};

  for (let i = args.length - 1; i >= 0; i--) {
    const src = args[i] as any;
    if (!src) continue;

    if (INSPECTOR_ENABLED && src[INSPECT_MARKER]) {
      src[INSPECT_MARKER] = notifyInspectorRef;
    }

    // Mimic Object.assign: only enumerable own property keys
    for (const key of Reflect.ownKeys(src)) {
      if (seen.has(key)) continue;

      const desc = Object.getOwnPropertyDescriptor(src, key as any);
      if (!desc || !desc.enumerable) continue;

      Object.defineProperty(result, key, {
        enumerable: true,
        configurable: true,
        get: () => {
          const value = src[key as any];

          if (!INSPECTOR_ENABLED || !notifyInspectorRef.current) {
            return value;
          }

          // Propagate inspector marker into nested observables
          if (value?.[INSPECT_MARKER]) {
            value[INSPECT_MARKER] = {
              current: {
                notify: notifyInspectorRef.current.notify,
                path: notifyInspectorRef.current.path.concat(key as any),
              },
            };
          } else if (typeof value === "function") {
            // Wrap actions to notify inspector
            return (...params: any[]) => {
              notifyInspectorRef.current!.notify({
                type: "action",
                path: notifyInspectorRef.current!.path.concat(key as any),
                params,
              });
              return value(...params);
            };
          }

          return value;
        },
      });

      seen.add(key);
    }
  }

  if (INSPECTOR_ENABLED) {
    Object.defineProperty(result, INSPECT_MARKER, {
      enumerable: false,
      configurable: false,
      get() {
        return !notifyInspectorRef.current;
      },
      set: (value: InspectorRef) => {
        Object.defineProperty(notifyInspectorRef, "current", {
          configurable: true,
          get() {
            return value.current;
          },
        });
      },
    });
  }

  // The overload signatures expose a precise type; this is the shared impl.
  return result;
}

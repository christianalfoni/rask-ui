import {
  createRouter as internalCreateRouter,
  RoutesConfig,
  TRouter,
  TRoutes,
} from "typed-client-router";
import { useCleanup, getCurrentComponent } from "./component";
import { observable } from "mobx";

export type Router<T extends RoutesConfig> = Omit<
  TRouter<T>,
  "current" | "listen" | "pathname"
> & {
  route?: TRoutes<T>;
};

export function useRouter<const T extends RoutesConfig>(
  config: T,
  options?: {
    base?: string;
  }
): Router<T> {
  if (!getCurrentComponent()) {
    throw new Error("Only use useRouter in component setup");
  }

  const router = internalCreateRouter(config, options);
  const route = observable.box(router.current);

  useCleanup(router.listen((newRoute) => route.set(newRoute)));

  return {
    get route() {
      return route.get();
    },
    get queries() {
      return router.queries;
    },
    setQuery: router.setQuery,
    push: router.push,
    replace: router.replace,
    url: router.url,
  };
}

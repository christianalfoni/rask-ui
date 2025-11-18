import {
  createRouter as internalCreateRouter,
  RoutesConfig,
  TRouter,
  TRoutes,
} from "typed-client-router";
import { getCurrentObserver, Signal } from "./observation";
import { createCleanup } from "./component";

export type Router<T extends RoutesConfig> = Omit<
  TRouter<T>,
  "current" | "listen" | "pathname"
> & {
  route?: TRoutes<T>;
};

export function createRouter<const T extends RoutesConfig>(
  config: T,
  options?: {
    base?: string;
  }
): Router<T> {
  const router = internalCreateRouter(config, options);
  const signal = new Signal();

  createCleanup(router.listen(() => signal.notify()));

  return {
    get route() {
      const observer = getCurrentObserver();

      if (observer) {
        observer.subscribeSignal(signal);
      }

      return router.current;
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

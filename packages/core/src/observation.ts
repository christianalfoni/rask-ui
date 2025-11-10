const observerStack: Observer[] = [];

export function getCurrentObserver() {
  return observerStack[0];
}

export class Signal {
  private subscribers = new Set<() => void>();
  subscribe(cb: () => void) {
    this.subscribers.add(cb);

    return () => {
      this.subscribers.delete(cb);
    };
  }
  notify() {
    this.subscribers.forEach((cb) => cb());
  }
}

export class Observer {
  isDisposed = false;
  private signalDisposers = new Set<() => void>();
  private clearSignals() {
    this.signalDisposers.forEach((dispose) => dispose());
    this.signalDisposers.clear();
  }
  private onNotify: () => void;
  constructor(onNotify: () => void) {
    this.onNotify = onNotify;
  }
  subscribeSignal(signal: Signal) {
    this.signalDisposers.add(signal.subscribe(this.onNotify));
  }
  observe() {
    this.clearSignals();
    observerStack.unshift(this);
    return () => {
      observerStack.shift();
    };
  }
  dispose() {
    this.clearSignals();
    this.isDisposed = true;
  }
}

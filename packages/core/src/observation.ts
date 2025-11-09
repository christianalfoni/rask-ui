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
  private _isDisposed = false;
  private signalDisposers = new Set<() => void>();
  private clearSignals() {
    this.signalDisposers.forEach((dispose) => dispose());
    this.signalDisposers.clear();
  }
  private onNotify: () => void;
  private isQueued = false;
  constructor(onNotify: () => void) {
    this.onNotify = () => {
      if (this.isQueued) {
        return;
      }

      queueMicrotask(() => {
        this.isQueued = false;

        if (this._isDisposed) {
          return;
        }

        onNotify();
      });

      this.isQueued = true;
    };
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
    this._isDisposed = true;
  }
}

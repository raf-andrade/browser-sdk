export interface Subscription {
  unsubscribe: () => void
}

export class Observable<T> {
  private observers: Array<(data: T) => void> = []

  subscribe(callback: (data: T) => void): Subscription {
    this.observers.push(callback)
    return {
      unsubscribe: () => {
        this.unsubscribe(callback)
      },
    }
  }

  unsubscribe(callback: (data: T) => void) {
    this.observers = this.observers.filter((other) => callback !== other)
  }

  hasObservers() {
    return this.observers.length !== 0
  }

  notify(data: T) {
    this.observers.forEach((observer) => observer(data))
  }
}

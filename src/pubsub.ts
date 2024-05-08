export class PubSub {
  private subscribers: { [key: string]: Array<Function> } = {};

  subscribe(event: string, callback: Function) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  unsubscribe(event: string, callback: Function) {
    if (this.subscribers[event]) {
      this.subscribers[event] = this.subscribers[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  publish(event: string, data?: any) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => {
        callback(data);
      });
    }
  }
}
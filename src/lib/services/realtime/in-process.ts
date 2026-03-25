import type { RealtimeProvider, RealtimeEvent, EventHandler } from "./types";

export class InProcessProvider implements RealtimeProvider {
  private listeners = new Map<string, Set<EventHandler>>();

  subscribe(userId: string, handler: EventHandler): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(handler);

    return () => {
      this.listeners.get(userId)?.delete(handler);
      if (this.listeners.get(userId)?.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  emit(event: RealtimeEvent) {
    const handlers = this.listeners.get(event.userId);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch {
          // isolate handler failures
        }
      }
    }
  }

  async shutdown() {
    this.listeners.clear();
  }
}

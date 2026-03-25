import type { RealtimeProvider, RealtimeEvent, EventHandler } from "./types";

// Redis pub/sub provider for multi-instance deployments
// Requires REDIS_URL environment variable
export class RedisRealtimeProvider implements RealtimeProvider {
  private localListeners = new Map<string, Set<EventHandler>>();
  private publisher: RedisLikeClient | null = null;
  private subscriber: RedisLikeClient | null = null;
  private channel = "sla:realtime";

  async init() {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL not configured");

    // Dynamic import to avoid requiring ioredis when not used
    try {
      // @ts-expect-error -- ioredis is optional, installed only when REDIS_URL is configured
      const ioredis = await import("ioredis");
      const Redis = ioredis.default || ioredis;
      this.publisher = new Redis(url) as unknown as RedisLikeClient;
      this.subscriber = new Redis(url) as unknown as RedisLikeClient;

      this.subscriber.subscribe(this.channel);
      this.subscriber.on("message", (_: string, message: string) => {
        try {
          const event: RealtimeEvent = JSON.parse(message);
          const handlers = this.localListeners.get(event.userId);
          if (handlers) {
            for (const handler of handlers) {
              try { handler(event); } catch { /* isolate */ }
            }
          }
        } catch { /* ignore malformed */ }
      });

      console.log("[REALTIME] Redis pub/sub connected");
    } catch (err) {
      console.error("[REALTIME] Redis connection failed:", err);
      throw err;
    }
  }

  subscribe(userId: string, handler: EventHandler): () => void {
    if (!this.localListeners.has(userId)) {
      this.localListeners.set(userId, new Set());
    }
    this.localListeners.get(userId)!.add(handler);

    return () => {
      this.localListeners.get(userId)?.delete(handler);
      if (this.localListeners.get(userId)?.size === 0) {
        this.localListeners.delete(userId);
      }
    };
  }

  emit(event: RealtimeEvent) {
    if (this.publisher) {
      this.publisher.publish(this.channel, JSON.stringify(event));
    }
  }

  async shutdown() {
    this.localListeners.clear();
    await this.subscriber?.quit();
    await this.publisher?.quit();
  }
}

// Minimal interface to avoid full ioredis type dependency
interface RedisLikeClient {
  subscribe(channel: string): void;
  publish(channel: string, message: string): void;
  on(event: string, cb: (...args: string[]) => void): void;
  quit(): Promise<void>;
}

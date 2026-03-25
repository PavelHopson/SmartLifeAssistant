import type { RealtimeProvider, RealtimeEvent } from "./types";
import { InProcessProvider } from "./in-process";

export type { RealtimeEvent, RealtimeProvider } from "./types";

let provider: RealtimeProvider | null = null;
let initPromise: Promise<void> | null = null;

async function initProvider(): Promise<RealtimeProvider> {
  if (provider) return provider;

  const useRedis = process.env.REDIS_URL && process.env.REALTIME_PROVIDER === "redis";

  if (useRedis) {
    try {
      const { RedisRealtimeProvider } = await import("./redis-provider");
      const redis = new RedisRealtimeProvider();
      await redis.init();
      provider = redis;
      console.log("[REALTIME] Using Redis provider");
      return provider;
    } catch (err) {
      console.warn("[REALTIME] Redis init failed, falling back to in-process:", err);
    }
  }

  provider = new InProcessProvider();
  console.log("[REALTIME] Using in-process provider");
  return provider;
}

export function getRealtimeProvider(): Promise<RealtimeProvider> {
  if (!initPromise) {
    initPromise = initProvider().then(() => {});
  }
  return initPromise.then(() => provider!);
}

// Convenience: emit without awaiting provider init (fire-and-forget)
export function emitRealtimeEvent(
  userId: string,
  type: RealtimeEvent["type"],
  data: Record<string, unknown> = {}
) {
  getRealtimeProvider().then((p) => {
    p.emit({ type, userId, data });
  }).catch(() => {
    // Graceful: realtime is non-critical
  });
}

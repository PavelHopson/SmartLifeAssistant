import { getCurrentUserId } from "@/lib/auth-utils";
import { getRealtimeProvider } from "@/lib/services/realtime";
import type { RealtimeEvent } from "@/lib/services/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  const provider = await getRealtimeProvider();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = provider.subscribe(userId, (event: RealtimeEvent) => {
        const data = JSON.stringify({ type: event.type, ...event.data });
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Stream closed
        }
      });

      keepaliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          if (keepaliveTimer) clearInterval(keepaliveTimer);
        }
      }, 30_000);
    },
    cancel() {
      unsubscribe?.();
      if (keepaliveTimer) clearInterval(keepaliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

"use client";

import { useEffect, useRef, useCallback } from "react";

interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export function useRealtime(onEvent: (event: RealtimeEvent) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    const es = new EventSource("/api/realtime/stream");
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEventRef.current(data);
      } catch {
        // Ignore parse errors (keepalives etc.)
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connect]);
}

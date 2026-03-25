export interface RealtimeEvent {
  type:
    | "notification_count_changed"
    | "onboarding_progress_changed"
    | "action_status_changed"
    | "task_status_changed"
    | "widget_state_changed";
  userId: string;
  data: Record<string, unknown>;
}

export type EventHandler = (event: RealtimeEvent) => void;

export interface RealtimeProvider {
  subscribe(userId: string, handler: EventHandler): () => void;
  emit(event: RealtimeEvent): void;
  shutdown(): Promise<void>;
}

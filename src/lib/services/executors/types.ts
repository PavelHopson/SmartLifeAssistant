export interface ExecutionContext {
  actionId: string;
  userId: string;
  kind: string;
  title: string;
  sourceType: string | null;
  sourceId: string | null;
  payload: unknown;
}

export interface ExecutionResult {
  status: "done" | "failed" | "requires_manual_step";
  message?: string;
  errorMessage?: string;
  requiresManualStep?: boolean;
  manualStepLabel?: string;
  manualStepUrl?: string;
  estimatedTime?: string;
  retryable?: boolean;
  resultPayload?: Record<string, unknown>;
}

export interface ActionExecutor {
  kind: string;
  execute(ctx: ExecutionContext): Promise<ExecutionResult>;
}

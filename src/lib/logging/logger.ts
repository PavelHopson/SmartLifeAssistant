// Structured logging utility — consistent format, no secret leakage

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

const REDACT_KEYS = new Set([
  "access_token", "accessToken", "refresh_token", "refreshToken",
  "password", "secret", "apiKey", "api_key", "token",
  "CRON_SECRET", "AUTH_SECRET", "RESEND_API_KEY", "ANTHROPIC_API_KEY",
]);

function redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (REDACT_KEYS.has(key)) {
      result[key] = value ? "[REDACTED]" : null;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
  if (entry.data && Object.keys(entry.data).length > 0) {
    return `${base} ${JSON.stringify(redactSensitive(entry.data))}`;
  }
  if (entry.error) {
    return `${base} error=${entry.error}`;
  }
  return base;
}

export function createLogger(module: string) {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error) => {
    const entry: LogEntry = {
      level,
      module,
      message,
      data,
      error: error?.message,
      timestamp: new Date().toISOString(),
    };

    const formatted = formatEntry(entry);

    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "debug":
        if (process.env.NODE_ENV !== "production") console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  };

  return {
    info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
    error: (msg: string, data?: Record<string, unknown>, err?: Error) => log("error", msg, data, err),
    debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
  };
}

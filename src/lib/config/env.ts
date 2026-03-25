// Centralized, typed environment configuration with validation

interface EnvConfig {
  // Database (required)
  databaseUrl: string;

  // Auth
  authSecret: string;
  googleClientId: string | null;
  googleClientSecret: string | null;
  nextauthUrl: string;

  // TrueLayer
  truelayerClientId: string | null;
  truelayerClientSecret: string | null;
  truelayerRedirectUri: string;
  truelayerSandbox: boolean;

  // Email
  resendApiKey: string | null;
  emailFrom: string;

  // LLM
  anthropicApiKey: string | null;

  // Realtime
  redisUrl: string | null;
  realtimeProvider: "redis" | "in-process";

  // Operations
  cronSecret: string | null;
  nodeEnv: string;
}

let _config: EnvConfig | null = null;
let _warnings: string[] = [];

export function getConfig(): EnvConfig {
  if (_config) return _config;

  _warnings = [];

  const databaseUrl = requireEnv("DATABASE_URL");

  const config: EnvConfig = {
    databaseUrl,

    authSecret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret",
    googleClientId: optionalEnv("GOOGLE_CLIENT_ID"),
    googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET"),
    nextauthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",

    truelayerClientId: optionalEnv("TRUELAYER_CLIENT_ID"),
    truelayerClientSecret: optionalEnv("TRUELAYER_CLIENT_SECRET"),
    truelayerRedirectUri: process.env.TRUELAYER_REDIRECT_URI || "http://localhost:3000/api/truelayer/callback",
    truelayerSandbox: process.env.TRUELAYER_SANDBOX !== "false",

    resendApiKey: optionalEnv("RESEND_API_KEY"),
    emailFrom: process.env.EMAIL_FROM || "Smart Life <noreply@smartlife.app>",

    anthropicApiKey: optionalEnv("ANTHROPIC_API_KEY"),

    redisUrl: optionalEnv("REDIS_URL"),
    realtimeProvider: process.env.REALTIME_PROVIDER === "redis" && process.env.REDIS_URL ? "redis" : "in-process",

    cronSecret: optionalEnv("CRON_SECRET"),
    nodeEnv: process.env.NODE_ENV || "development",
  };

  // Production warnings
  if (config.nodeEnv === "production") {
    if (!config.cronSecret) _warnings.push("CRON_SECRET not set — cron endpoint unprotected");
    if (!config.googleClientId) _warnings.push("GOOGLE_CLIENT_ID not set — auth in demo mode");
    if (!config.resendApiKey) _warnings.push("RESEND_API_KEY not set — emails go to console only");
    if (!config.truelayerClientId) _warnings.push("TRUELAYER_CLIENT_ID not set — bank connection disabled");
    if (config.authSecret === "dev-secret") _warnings.push("AUTH_SECRET is default dev value — change for production");
  }

  _config = config;
  return config;
}

export function getConfigWarnings(): string[] {
  getConfig(); // ensure initialized
  return _warnings;
}

export function getConfigStatus(): Record<string, { configured: boolean; mode?: string }> {
  const c = getConfig();
  return {
    database: { configured: true },
    auth: { configured: !!c.googleClientId, mode: c.googleClientId ? "google" : "demo" },
    truelayer: { configured: !!c.truelayerClientId, mode: c.truelayerSandbox ? "sandbox" : "production" },
    email: { configured: !!c.resendApiKey, mode: c.resendApiKey ? "resend" : "dev-console" },
    llm: { configured: !!c.anthropicApiKey, mode: c.anthropicApiKey ? "anthropic" : "passthrough" },
    realtime: { configured: true, mode: c.realtimeProvider },
    cron: { configured: !!c.cronSecret, mode: c.cronSecret ? "protected" : "open" },
    redis: { configured: !!c.redisUrl },
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function optionalEnv(key: string): string | null {
  return process.env[key] || null;
}

/**
 * Structured JSON logger for server-side code (API routes, background work).
 *
 * Emits one JSON object per line to stdout (info/debug) or stderr
 * (warn/error), which is standard for containerized deployments and
 * parseable by log aggregators. The minimum level is controlled by
 * `LOG_LEVEL` (debug | info | warn | error), defaulting to `info`.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function isLogLevel(value: string | undefined): value is LogLevel {
  return value === "debug" || value === "info" || value === "warn" || value === "error";
}

function getThreshold(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  return isLogLevel(raw) ? raw : "info";
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const threshold = getThreshold();
  if (LEVEL_ORDER[level] < LEVEL_ORDER[threshold]) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "warn" || level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

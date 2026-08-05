/**
 * Structured JSON logger for TarshishDEX server-side code.
 *
 * Emits log lines as JSON to stdout so they can be ingested by log
 * aggregators (CloudWatch, Datadog, etc.). In development the output is
 * pretty-printed for readability.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  reqId?: string;
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (): LogLevel => {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env === "debug") return "debug";
  if (env === "warn") return "warn";
  if (env === "error") return "error";
  return "info";
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel()];
}

let globalReqId: string | undefined;

/** Set a request-scoped ID so every log line in that request is traceable. */
export function setRequestId(id: string | undefined): void {
  globalReqId = id;
}

function emit(level: LogLevel, msg: string, extra?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(globalReqId ? { reqId: globalReqId } : {}),
    ...extra,
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : JSON.stringify(entry, null, 2);

  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => emit("debug", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => emit("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => emit("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => emit("error", msg, extra),
};

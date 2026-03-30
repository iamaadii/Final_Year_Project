type LogContext = {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
};

type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, context: LogContext, message: string) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: context.requestId || null,
    userId: context.userId || null,
    tenantId: context.tenantId || null,
    ...context,
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const log = {
  info(context: LogContext, message: string) {
    write("info", context, message);
  },
  warn(context: LogContext, message: string) {
    write("warn", context, message);
  },
  error(context: LogContext, message: string) {
    write("error", context, message);
  },
};

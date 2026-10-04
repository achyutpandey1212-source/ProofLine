type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

const formatLog = (level: LogLevel, message: string, meta?: LogMeta): string => {
  const timestamp = new Date().toISOString();
  const metaString = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
};

export const logger = {
  debug: (message: string, meta?: LogMeta): void => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, meta));
    }
  },
  info: (message: string, meta?: LogMeta): void => {
    console.info(formatLog("info", message, meta));
  },
  warn: (message: string, meta?: LogMeta): void => {
    console.warn(formatLog("warn", message, meta));
  },
  error: (message: string, meta?: LogMeta): void => {
    console.error(formatLog("error", message, meta));
  },
};

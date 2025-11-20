type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function emit(entry: LogEntry) {
  const formatted = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  if (entry.level === 'error') {
    console.error(formatted, entry.context || {});
  } else if (entry.level === 'warn') {
    console.warn(formatted, entry.context || {});
  } else {
    console.log(formatted, entry.context || {});
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  emit({ level, message, context, timestamp: new Date().toISOString() });
}

export const logger: Record<LogLevel, (message: string, context?: Record<string, unknown>) => void> = {
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
};

export type { LogEntry, LogLevel };
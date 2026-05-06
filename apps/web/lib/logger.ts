type LogContext = Record<string, unknown> | Error | undefined

const formatArgs = (message: string, context?: LogContext) => {
  if (!context) {
    return [message] as const
  }
  if (context instanceof Error) {
    return [message, { message: context.message, stack: context.stack }] as const
  }
  return [message, context] as const
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.info(...formatArgs(message, context))
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(...formatArgs(message, context))
  },
  error: (message: string, context?: LogContext) => {
    console.error(...formatArgs(message, context))
  },
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...formatArgs(message, context))
    }
  },
}

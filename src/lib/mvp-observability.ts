import { randomUUID } from 'crypto'

type LogContext = {
    action: string
    requestId?: string
    userId?: string | null
    extra?: Record<string, unknown>
}

function normalizeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    return {
        name: 'UnknownError',
        message: String(error),
        stack: undefined,
    }
}

export function createRequestId() {
    try {
        return randomUUID()
    } catch {
        return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    }
}

export function logActionError(context: LogContext, error: unknown) {
    const normalized = normalizeError(error)
    const prefix = `[MVP][${context.action}] req=${context.requestId || 'n/a'} user=${context.userId || 'anon'}`

    console.error(prefix, {
        message: normalized.message,
        name: normalized.name,
        stack: normalized.stack,
        ...(context.extra || {}),
    })
}

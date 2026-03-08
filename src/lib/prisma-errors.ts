/**
 * Prisma error detection helpers for anti-fragile handling.
 * @see .specify/specs/prisma-p6009-response-size-fix/spec.md
 */

/**
 * Detect Prisma P6009 (ResponseSizeLimitExceeded).
 * Occurs when query response exceeds 5MB (Prisma Accelerate default).
 */
export function isPrismaP6009(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; meta?: unknown; message?: string }
  if (e.code === 'P6009') return true
  if (e.code === 'P5000' && typeof e.meta === 'object' && e.meta !== null) {
    const meta = e.meta as { code?: string }
    if (meta.code === 'P6009') return true
  }
  if (typeof e.message === 'string' && e.message.includes('P6009')) return true
  return false
}

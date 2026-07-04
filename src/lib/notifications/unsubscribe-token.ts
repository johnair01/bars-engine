import { createHmac, timingSafeEqual } from 'crypto'
import { absoluteUrl } from '@/lib/email/urls'
import type { UnsubscribeScope } from './types'

const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000 // 1 year

function secret(): string {
  const fromEnv = process.env.NOTIFICATION_UNSUBSCRIBE_SECRET
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NOTIFICATION_UNSUBSCRIBE_SECRET is not set')
  }
  return 'dev-only-notification-unsubscribe-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function signUnsubscribeToken(
  playerId: string,
  scope: UnsubscribeScope,
  exp: number = Date.now() + TOKEN_TTL_MS,
): string {
  const payload = `${playerId}|${scope}|${exp}`
  return `${payload}|${sign(payload)}`
}

export function verifyUnsubscribeToken(
  token: string | null | undefined,
  now: number = Date.now(),
): { playerId: string; scope: UnsubscribeScope } | null {
  if (!token) return null
  const parts = token.split('|')
  if (parts.length !== 4) return null
  const [playerId, scope, expStr, providedSig] = parts
  if (!playerId || !scope || !expStr || !providedSig) return null

  const validScopes: UnsubscribeScope[] = ['all', 'daily_reminder', 'campaign_invite']
  if (!validScopes.includes(scope as UnsubscribeScope)) return null

  const payload = `${playerId}|${scope}|${expStr}`
  const expectedSig = sign(payload)
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < now) return null

  return { playerId, scope: scope as UnsubscribeScope }
}

export function unsubscribeUrl(playerId: string, scope: UnsubscribeScope): string {
  const token = signUnsubscribeToken(playerId, scope)
  return absoluteUrl(`/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`)
}

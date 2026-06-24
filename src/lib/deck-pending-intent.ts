/**
 * Pending deck-card intent (signed, no DB).
 *
 * When a logged-out visitor taps "Send to BARS", we cannot create a BAR yet —
 * there is no account to own it. Instead we sign the *intent* (which card, which
 * reading) into a short-lived token, stash it in an httpOnly cookie, and send the
 * visitor to signup. On successful account creation the intent is verified and
 * materialized into the new player's account — nothing is lost.
 *
 * The token is self-validating (HMAC over `cardId|subject|iat`), so even if the
 * cookie were tampered with we reject it. Card *text* is never trusted from the
 * client — only the card id travels, and the seed is rebuilt server-side from
 * `assembleDeck()`.
 *
 * @see src/actions/send-deck-card-to-bars.ts (caller)
 * @see .specify/specs/mga-deck-vault-onboarding/spec.md (slice 1)
 */

import { createHmac, timingSafeEqual } from 'crypto'
import type { SeedSubject } from '@/lib/allyship-deck/seed'

export const PENDING_DECK_COOKIE = 'bars_deck_pending'

/** Token lifetime — long enough to read a card, sign up, and confirm email-free signup. */
export const PENDING_DECK_TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface PendingDeckIntent {
  cardId: string
  subject: SeedSubject
}

/**
 * Secret used to sign the pending intent. Configured via `DECK_PENDING_SECRET`
 * in production; falls back to a fixed dev constant so the loop works locally
 * without extra setup. Document the var in docs/ENV_AND_VERCEL.md.
 */
function secret(): string {
  const fromEnv = process.env.DECK_PENDING_SECRET
  if (fromEnv) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    // Don't silently sign with a public constant in prod — fail loud.
    throw new Error('DECK_PENDING_SECRET is not set')
  }
  return 'dev-only-deck-pending-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Sign a pending intent into a compact, self-validating token. */
export function signPendingIntent(intent: PendingDeckIntent, iat: number = Date.now()): string {
  // subject is constrained ('self' | 'campaign'); cardId has no '|' in practice,
  // but base64url-encode it defensively so the delimiter stays unambiguous.
  const cardId = Buffer.from(intent.cardId, 'utf8').toString('base64url')
  const payload = `${cardId}|${intent.subject}|${iat}`
  return `${payload}|${sign(payload)}`
}

/**
 * Verify and decode a pending-intent token. Returns the intent if the signature
 * is valid and the token is within TTL; otherwise null (tampered/expired/garbage).
 */
export function verifyPendingIntent(token: string | undefined | null, now: number = Date.now()): PendingDeckIntent | null {
  if (!token) return null
  const parts = token.split('|')
  if (parts.length !== 4) return null
  const [cardIdB64, subject, iatStr, providedSig] = parts

  const payload = `${cardIdB64}|${subject}|${iatStr}`
  const expectedSig = sign(payload)

  // Constant-time compare; lengths must match for timingSafeEqual.
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const iat = Number(iatStr)
  if (!Number.isFinite(iat) || now - iat > PENDING_DECK_TTL_MS || iat > now) return null

  if (subject !== 'self' && subject !== 'campaign') return null

  let cardId: string
  try {
    cardId = Buffer.from(cardIdB64, 'base64url').toString('utf8')
  } catch {
    return null
  }
  if (!cardId) return null

  return { cardId, subject }
}

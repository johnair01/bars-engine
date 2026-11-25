/**
 * The test-only sign-in link (Wendell, 2026-11-25: "test only link").
 *
 * A link is `<payload>.<signature>`: the payload names a test account, a five-minute expiry and a fingerprint of the
 * account's current password hash; the signature is an HMAC over it with the Admin API token. Using the link rotates
 * the password hash, so the fingerprint no longer matches and the same link cannot be used twice. It only ever works
 * for `wa-test-<hex>@test.invalid` accounts (isTestAccountEmail), and only a holder of the token can make one.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { isTestAccountEmail } from './test-accounts'

export const SIGNIN_TTL_MS = 5 * 60 * 1000

type Payload = { email: string; fp: string; exp: number }

export function hashFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

export function makeSignInToken(email: string, passwordHash: string, secret: string, now = Date.now()): string {
  const payload: Payload = { email, fp: hashFingerprint(passwordHash), exp: now + SIGNIN_TTL_MS }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body, secret)}`
}

export type SignInCheck =
  | { ok: true; email: string }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' | 'not-a-test-account' | 'already-used' }

/** Checks the token against the account's current hash. `currentHash` is null when the account is gone. */
export function checkSignInToken(
  token: string,
  secret: string,
  currentHash: (email: string) => string | null,
  now = Date.now(),
): SignInCheck {
  const [body, signature] = token.split('.')
  if (!body || !signature) return { ok: false, reason: 'malformed' }
  const expected = Buffer.from(sign(body, secret))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'bad-signature' }
  let payload: Payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (typeof payload.email !== 'string' || typeof payload.fp !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, reason: 'malformed' }
  }
  if (now > payload.exp) return { ok: false, reason: 'expired' }
  if (!isTestAccountEmail(payload.email)) return { ok: false, reason: 'not-a-test-account' }
  const hash = currentHash(payload.email)
  if (hash === null || hashFingerprint(hash) !== payload.fp) return { ok: false, reason: 'already-used' }
  return { ok: true, email: payload.email }
}

/** Only a path on this site: starts with one slash, never `//host` or a scheme. */
export function safeReturnPath(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value
  return '/'
}

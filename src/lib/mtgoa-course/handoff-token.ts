import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * The accountless sender-control capability.
 *
 * A Day 10 sender gets one link that reaches their own submission and nothing
 * else. It is the whole mechanism behind the promise that anybody — anonymous
 * senders included — can withdraw, so it has to work without an account.
 *
 * Only the SHA-256 hash is stored. The raw token exists in the response that
 * mints it and in whatever the sender saves; a database read cannot reconstruct
 * anyone's link. The token carries no submission id, so a leaked hash reveals
 * nothing about which handoff it belongs to either.
 *
 * 32 random bytes is the entropy of a good session id, which is the right bar:
 * guessing one is the only way in.
 */

const TOKEN_BYTES = 32

export function mintHandoffToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  return { token, hash: hashHandoffToken(token) }
}

export function hashHandoffToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Compare two hashes without leaking timing.
 *
 * The lookup itself is by unique index on the hash, so this guards the places
 * that compare a second time rather than the primary read.
 */
export function handoffTokenMatches(candidateHash: string, storedHash: string): boolean {
  const a = Buffer.from(candidateHash, 'utf8')
  const b = Buffer.from(storedHash, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Reject anything that cannot be one of our tokens before it reaches the database. */
export function looksLikeHandoffToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{40,60}$/.test(value)
}

export function handoffLinkPath(token: string): string {
  return `/my-handoff/${token}`
}

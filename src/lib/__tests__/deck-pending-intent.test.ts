import assert from 'node:assert'
import {
  signPendingIntent,
  verifyPendingIntent,
  PENDING_DECK_TTL_MS,
} from '../deck-pending-intent'

const now = 1_700_000_000_000

// round-trips a valid intent
const token = signPendingIntent({ cardId: 'OPEN-GR-SHAMAN', subject: 'self' }, now)
const decoded = verifyPendingIntent(token, now)
assert.ok(decoded, 'valid token verifies')
assert.strictEqual(decoded.cardId, 'OPEN-GR-SHAMAN')
assert.strictEqual(decoded.subject, 'self')

// campaign reading round-trips too
const camp = signPendingIntent({ cardId: 'OPEN-GR-SHAMAN', subject: 'campaign' }, now)
assert.strictEqual(verifyPendingIntent(camp, now)?.subject, 'campaign')

// expired token is rejected
assert.strictEqual(
  verifyPendingIntent(token, now + PENDING_DECK_TTL_MS + 1),
  null,
  'token past TTL is rejected',
)

// future-issued token (clock skew / forgery) is rejected
assert.strictEqual(verifyPendingIntent(token, now - 1000), null, 'future iat is rejected')

// tampered signature is rejected
const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa')
assert.strictEqual(verifyPendingIntent(tampered, now), null, 'tampered signature is rejected')

// tampered cardId (re-sign attempt without secret) is rejected
const parts = token.split('|')
const forgedCard = Buffer.from('EVIL-CARD', 'utf8').toString('base64url')
const forged = [forgedCard, parts[1], parts[2], parts[3]].join('|')
assert.strictEqual(verifyPendingIntent(forged, now), null, 'swapped cardId breaks the signature')

// garbage / empty inputs are rejected, never throw
assert.strictEqual(verifyPendingIntent('', now), null)
assert.strictEqual(verifyPendingIntent(undefined, now), null)
assert.strictEqual(verifyPendingIntent('a|b|c', now), null)

console.log('✓ deck-pending-intent tests passed')

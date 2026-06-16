import assert from 'node:assert'
import { wallForSku, parseGumroadPriceCents } from '../barn-credit'
import { LAUNCH_OFFERS } from '../offers'

// Every launch SKU feeds the pre-sale (commerce) wall.
for (const offer of LAUNCH_OFFERS) {
  assert.strictEqual(wallForSku(offer.key), 'presale', `${offer.key} → presale`)
}
assert.strictEqual(wallForSku('unknown-sku'), 'presale', 'unknown sku → presale (default)')

// Gumroad `price` is integer cents.
assert.strictEqual(parseGumroadPriceCents('1500'), 1500, '"1500" → 1500c')
assert.strictEqual(parseGumroadPriceCents('599'), 599, '"599" → 599c')

// Defensive: tolerate a dollar-formatted value.
assert.strictEqual(parseGumroadPriceCents('15.00'), 1500, '"15.00" → 1500c')
assert.strictEqual(parseGumroadPriceCents('14.99'), 1499, '"14.99" → 1499c')

// Absent / zero / malformed → null (caller skips crediting).
assert.strictEqual(parseGumroadPriceCents(null), null, 'null → null')
assert.strictEqual(parseGumroadPriceCents(undefined), null, 'undefined → null')
assert.strictEqual(parseGumroadPriceCents(''), null, 'empty → null')
assert.strictEqual(parseGumroadPriceCents('0'), null, 'zero → null')
assert.strictEqual(parseGumroadPriceCents('-100'), null, 'negative → null')
assert.strictEqual(parseGumroadPriceCents('free'), null, 'non-numeric → null')

console.log('✓ launch barn-credit (wallForSku + parseGumroadPriceCents) tests passed')

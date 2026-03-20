/**
 * Run: npx tsx src/lib/__tests__/npc321-merge-excerpt.test.ts
 */

import {
  NPC321_MERGE_CHARGE_EXCERPT_MAX,
  truncateChargeExcerpt,
} from '../npc321-inner-work-merge'

function assert(c: boolean, m: string) {
  if (!c) throw new Error(`Assertion failed: ${m}`)
}

function main() {
  assert(truncateChargeExcerpt('') === null, 'empty')
  assert(truncateChargeExcerpt('  ') === null, 'spaces')
  assert(truncateChargeExcerpt('hello') === 'hello', 'short')
  const long = 'a'.repeat(NPC321_MERGE_CHARGE_EXCERPT_MAX + 50)
  const out = truncateChargeExcerpt(long)
  assert(out !== null && out.endsWith('…'), 'trunc')
  const truncated = out!
  assert(truncated.length === NPC321_MERGE_CHARGE_EXCERPT_MAX, 'trunc length')
  console.log('npc321-merge-excerpt tests: ok')
}

main()

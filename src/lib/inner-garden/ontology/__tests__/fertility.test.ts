/**
 * Fertility (action economy, Pressure 1) tests.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/fertility.test.ts
 */
import assert from 'node:assert'
import {
  applyFertilityAction,
  crowding,
  growthMultiplier,
  isOvercrowded,
  suggestTending,
  type FieldFertility,
} from '../fertility'

const field = (over: Partial<FieldFertility> = {}): FieldFertility => ({
  capacity: 6,
  activeSeeds: 3,
  fertility: 80,
  ...over,
})

// === 1. Overcrowding drains fertility faster ==================================
{
  const crowded = field({ activeSeeds: 12, fertility: 80 }) // crowding 2
  const healthy = field({ activeSeeds: 6, fertility: 80 }) // crowding 1
  assert.ok(isOvercrowded(crowded) && !isOvercrowded(healthy), 'crowding classified correctly')
  const afterCrowded = applyFertilityAction(crowded, 'tick')
  const afterHealthy = applyFertilityAction(healthy, 'tick')
  assert.ok(
    80 - afterCrowded.fertility > 80 - afterHealthy.fertility,
    'the overcrowded field loses more fertility in one tick',
  )
  console.log('  ✓ 1. overcrowding drains fertility faster')
}

// === 2. Compost regenerates ≥ harvest; both free capacity =====================
{
  const f = field({ activeSeeds: 5, fertility: 50 })
  const composted = applyFertilityAction(f, 'compost')
  const harvested = applyFertilityAction(f, 'harvest')
  assert.ok(composted.fertility >= harvested.fertility, 'compost restores at least as much as harvest')
  assert.strictEqual(composted.activeSeeds, 4, 'compost frees a slot')
  assert.strictEqual(harvested.activeSeeds, 4, 'harvest frees a slot')
  console.log('  ✓ 2. compost regenerates ≥ harvest; both free capacity')
}

// === 3. Access is NEVER gated — barren soil still grows and composts ===========
{
  assert.ok(growthMultiplier(0) > 0, 'growth multiplier is > 0 even at fertility 0')
  const barren = field({ fertility: 0, activeSeeds: 4 })
  const after = applyFertilityAction(barren, 'compost')
  assert.ok(after.activeSeeds === 3 && after.fertility > 0, 'compost still applies at fertility 0')
  console.log('  ✓ 3. low fertility gates quality, never access')
}

// === 4. Tending is suggested when overcrowded/barren; null when healthy ========
{
  const s = suggestTending(field({ activeSeeds: 9, capacity: 6 }))
  assert.ok(s && s.compostSuggested >= 3 && /compost/i.test(s.reason), 'overcrowded → compost suggestion')
  assert.strictEqual(suggestTending(field({ activeSeeds: 3, fertility: 80 })), null, 'healthy field → no nudge')
  assert.ok(suggestTending(field({ activeSeeds: 3, fertility: 10 })), 'barren field → nudge even if not crowded')
  console.log('  ✓ 4. tending suggested only when overcrowded/barren')
}

// === 5. Clamping & determinism ================================================
{
  const nearZero = applyFertilityAction(field({ fertility: 2 }), 'plant')
  assert.ok(nearZero.fertility >= 0, 'fertility floors at 0')
  const full = applyFertilityAction(field({ fertility: 96 }), 'compost')
  assert.ok(full.fertility <= 100, 'fertility caps at 100')
  const emptyHarvest = applyFertilityAction(field({ activeSeeds: 0 }), 'harvest')
  assert.strictEqual(emptyHarvest.activeSeeds, 0, 'activeSeeds never negative')
  const a = applyFertilityAction(field(), 'tick')
  const b = applyFertilityAction(field(), 'tick')
  assert.deepStrictEqual(a, b, 'deterministic')
  console.log('  ✓ 5. clamped to [0,100] / ≥0; deterministic')
}

console.log('inner-garden/ontology (fertility): all tests passed ✓')

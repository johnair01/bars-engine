/**
 * Growth Stage Utility — Tests
 * Run with: npx tsx src/lib/campaign-hub/__tests__/growth-stage.test.ts
 */

import {
  getGrowthStage,
  getGrowthStagesForFace,
  getGrowthProgress,
  waterLevelForStage,
  GM_FACE_GROWTH_THRESHOLDS,
  GROWTH_STAGE_BASE,
} from '@/lib/campaign-hub/growth-stage'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { GrowthStageName } from '@/lib/campaign-hub/growth-stage'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failed++
    console.error(`  ✗ FAIL: ${message}`)
  } else {
    passed++
  }
}

function assertEq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    failed++
    console.error(`  ✗ FAIL: ${message}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`)
  } else {
    passed++
  }
}

function approxEq(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) <= epsilon
}

// ─── Regent (equal 25/50/75) — canonical baseline for stage boundary tests ───

console.log('\n[regent thresholds — 25/50/75]')
{
  const face: GameMasterFace = 'regent'

  assertEq(getGrowthStage(0, face).name, 'sprout', 'water=0 → sprout')
  assertEq(getGrowthStage(0, face).minWater, 0, 'sprout minWater=0')
  assertEq(getGrowthStage(0, face).maxWater, 24, 'sprout maxWater=24')

  assertEq(getGrowthStage(24, face).name, 'sprout', 'water=24 → still sprout')

  assertEq(getGrowthStage(25, face).name, 'sapling', 'water=25 → sapling (exact threshold)')
  assertEq(getGrowthStage(25, face).minWater, 25, 'sapling minWater=25')
  assertEq(getGrowthStage(25, face).maxWater, 49, 'sapling maxWater=49')

  assertEq(getGrowthStage(49, face).name, 'sapling', 'water=49 → still sapling')

  assertEq(getGrowthStage(50, face).name, 'plant', 'water=50 → plant (exact threshold)')
  assertEq(getGrowthStage(50, face).minWater, 50, 'plant minWater=50')
  assertEq(getGrowthStage(50, face).maxWater, 74, 'plant maxWater=74')

  assertEq(getGrowthStage(74, face).name, 'plant', 'water=74 → still plant')

  assertEq(getGrowthStage(75, face).name, 'tree', 'water=75 → tree (exact threshold)')
  assertEq(getGrowthStage(75, face).minWater, 75, 'tree minWater=75')
  assertEq(getGrowthStage(75, face).maxWater, 100, 'tree maxWater=100')

  assertEq(getGrowthStage(100, face).name, 'tree', 'water=100 → tree')
}

// ─── All six faces — stage boundary correctness ───────────────────────────────

console.log('\n[all six faces — boundary correctness]')
{
  const allFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

  for (const face of allFaces) {
    const t = GM_FACE_GROWTH_THRESHOLDS[face]

    assertEq(getGrowthStage(t.sapling - 1, face).name, 'sprout',  `${face}: just below sapling → sprout`)
    assertEq(getGrowthStage(t.sapling,     face).name, 'sapling', `${face}: at sapling threshold → sapling`)
    assertEq(getGrowthStage(t.plant - 1,   face).name, 'sapling', `${face}: just below plant → sapling`)
    assertEq(getGrowthStage(t.plant,       face).name, 'plant',   `${face}: at plant threshold → plant`)
    assertEq(getGrowthStage(t.tree - 1,    face).name, 'plant',   `${face}: just below tree → plant`)
    assertEq(getGrowthStage(t.tree,        face).name, 'tree',    `${face}: at tree threshold → tree`)
  }
}

// ─── Metadata shape ───────────────────────────────────────────────────────────

console.log('\n[metadata shape]')
{
  const s = getGrowthStage(50, 'sage')
  assert(typeof s.name === 'string',       'name is string')
  assert(typeof s.label === 'string',      'label is string')
  assert(typeof s.iconKey === 'string',    'iconKey is string')
  assert(typeof s.colorToken === 'string', 'colorToken is string')
  assert(typeof s.minWater === 'number',   'minWater is number')
  assert(typeof s.maxWater === 'number',   'maxWater is number')

  // Labels should be Title-cased
  const stageNames: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']
  for (const name of stageNames) {
    assertEq(
      GROWTH_STAGE_BASE[name].label,
      name.charAt(0).toUpperCase() + name.slice(1),
      `${name} label is title-cased`
    )
  }

  // iconKeys — all start with 'growth-' and are distinct
  const icons = stageNames.map((n) => GROWTH_STAGE_BASE[n].iconKey)
  assert(new Set(icons).size === 4, 'all four iconKeys are unique')
  for (const icon of icons) {
    assert(icon.startsWith('growth-'), `iconKey '${icon}' starts with 'growth-'`)
  }

  // colorTokens — all valid Wuxing element keys
  const validTokens = new Set(['fire', 'water', 'wood', 'metal', 'earth'])
  for (const name of stageNames) {
    assert(validTokens.has(GROWTH_STAGE_BASE[name].colorToken), `${name} colorToken is valid ElementKey`)
  }

  // Growth stages follow Water→Wood→Earth→Fire Wuxing sequence
  assertEq(GROWTH_STAGE_BASE.sprout.colorToken,  'water', 'sprout = water element')
  assertEq(GROWTH_STAGE_BASE.sapling.colorToken, 'wood',  'sapling = wood element')
  assertEq(GROWTH_STAGE_BASE.plant.colorToken,   'earth', 'plant = earth element')
  assertEq(GROWTH_STAGE_BASE.tree.colorToken,    'fire',  'tree = fire element')
}

// ─── Input clamping ───────────────────────────────────────────────────────────

console.log('\n[input clamping]')
{
  assertEq(getGrowthStage(-10, 'regent').name,  'sprout', 'negative water → sprout (clamped to 0)')
  assertEq(getGrowthStage(150, 'regent').name,  'tree',   'water > 100 → tree (clamped to 100)')
  // Rounding: 24.6 rounds to 25 → sapling; 24.4 rounds to 24 → sprout
  assertEq(getGrowthStage(24.6, 'regent').name, 'sapling', '24.6 rounds to 25 → sapling')
  assertEq(getGrowthStage(24.4, 'regent').name, 'sprout',  '24.4 rounds to 24 → sprout')
}

// ─── getGrowthStagesForFace ───────────────────────────────────────────────────

console.log('\n[getGrowthStagesForFace]')
{
  const allFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

  for (const face of allFaces) {
    const stages = getGrowthStagesForFace(face)
    assertEq(stages.length, 4, `${face}: returns exactly four stages`)

    const names = stages.map((s) => s.name)
    assertEq(names[0], 'sprout',  `${face}: first stage is sprout`)
    assertEq(names[1], 'sapling', `${face}: second stage is sapling`)
    assertEq(names[2], 'plant',   `${face}: third stage is plant`)
    assertEq(names[3], 'tree',    `${face}: fourth stage is tree`)

    // Ranges are contiguous (no gaps or overlaps)
    assertEq(stages[0].minWater, 0,   `${face}: sprout starts at 0`)
    assertEq(stages[3].maxWater, 100, `${face}: tree ends at 100`)
    for (let i = 0; i < stages.length - 1; i++) {
      assertEq(
        stages[i].maxWater + 1,
        stages[i + 1].minWater,
        `${face}: stage ${i} and ${i + 1} are contiguous`
      )
    }
  }
}

// ─── getGrowthProgress ────────────────────────────────────────────────────────

console.log('\n[getGrowthProgress]')
{
  // regent sapling: 25..49
  assert(approxEq(getGrowthProgress(25, 'regent'), 0),   'progress=0 at stage min (water=25, regent sapling)')
  assert(approxEq(getGrowthProgress(49, 'regent'), 1),   'progress=1 at stage max (water=49, regent sapling)')
  assert(approxEq(getGrowthProgress(37, 'regent'), 0.5, 0.1), 'progress≈0.5 at midpoint (water=37)')

  // All values in [0, 1]
  for (let w = 0; w <= 100; w += 5) {
    const p = getGrowthProgress(w, 'sage')
    assert(p >= 0 && p <= 1, `progress in [0,1] at water=${w} for sage`)
  }
}

// ─── waterLevelForStage ───────────────────────────────────────────────────────

console.log('\n[waterLevelForStage]')
{
  const allFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of allFaces) {
    assertEq(waterLevelForStage('sprout', face), 0, `${face}: sprout requires 0 water`)
  }

  assertEq(waterLevelForStage('sapling', 'regent'), 25, 'regent sapling threshold = 25')
  assertEq(waterLevelForStage('plant',   'regent'), 50, 'regent plant threshold = 50')
  assertEq(waterLevelForStage('tree',    'regent'), 75, 'regent tree threshold = 75')

  // challenger < shaman for all non-sprout stages (aggressive vs slow)
  const stageNames: GrowthStageName[] = ['sapling', 'plant', 'tree']
  for (const stage of stageNames) {
    assert(
      waterLevelForStage(stage, 'challenger') < waterLevelForStage(stage, 'shaman'),
      `challenger threshold < shaman threshold for ${stage} (aggressive vs ritual)`
    )
  }
}

// ─── Threshold invariants ─────────────────────────────────────────────────────

console.log('\n[threshold structural invariants]')
{
  const allFaces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of allFaces) {
    const t = GM_FACE_GROWTH_THRESHOLDS[face]
    assert(t.sapling >= 1,          `${face}: sapling threshold ≥ 1 (at least 1 sprout unit)`)
    assert(t.plant > t.sapling,     `${face}: plant > sapling (strictly ascending)`)
    assert(t.tree > t.plant,        `${face}: tree > plant (strictly ascending)`)
    assert(t.tree <= 100,           `${face}: tree threshold ≤ 100`)
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`)
if (failed === 0) {
  console.log(`✓ All ${passed} assertions passed — growth-stage: OK`)
} else {
  console.error(`✗ ${failed} failed, ${passed} passed`)
  process.exit(1)
}

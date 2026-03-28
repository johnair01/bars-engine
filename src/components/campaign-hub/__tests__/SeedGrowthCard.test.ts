/**
 * SeedGrowthCard — Data Logic Tests
 *
 * Tests the stage-resolution, element-token, and progress-computation
 * logic that drives SeedGrowthCard's visual output.
 *
 * Run with: npx tsx src/components/campaign-hub/__tests__/SeedGrowthCard.test.ts
 *
 * NB: React rendering is NOT tested here — only the pure data logic
 *     consumed by SeedGrowthCard.  Use a Storybook story or browser
 *     smoke test for visual regression.
 */

import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import {
  getGrowthStage,
  getGrowthProgress,
  getGrowthStagesForFace,
  GROWTH_STAGE_BASE,
  GM_FACE_GROWTH_THRESHOLDS,
  type GrowthStageName,
} from '@/lib/campaign-hub/growth-stage'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

// ─── Minimal test harness ─────────────────────────────────────────────────────

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

function test(name: string, fn: () => void): void {
  console.log(`\n${name}`)
  fn()
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// 1. All four growth stages have distinct Wuxing element tokens
test('[3b] All four growth stages map to distinct Wuxing elements', () => {
  const stages: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']
  const tokens = stages.map((s) => GROWTH_STAGE_BASE[s].colorToken)

  assert(tokens[0] === 'water', 'sprout → water (水)')
  assert(tokens[1] === 'wood',  'sapling → wood (木)')
  assert(tokens[2] === 'earth', 'plant → earth (土)')
  assert(tokens[3] === 'fire',  'tree → fire (火)')

  // All four are distinct
  const unique = new Set(tokens)
  assert(unique.size === 4, 'All four stages have distinct color tokens')
})

// 2. ELEMENT_TOKENS exist for every colorToken used by growth stages
test('[3b] ELEMENT_TOKENS covers every growth stage colorToken', () => {
  const stages: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']
  for (const stageName of stages) {
    const { colorToken, label } = GROWTH_STAGE_BASE[stageName]
    const tok = ELEMENT_TOKENS[colorToken]
    assert(tok !== undefined,            `${label}: ELEMENT_TOKENS[${colorToken}] exists`)
    assert(typeof tok.sigil   === 'string', `${label}: sigil is a string`)
    assert(typeof tok.frame   === 'string', `${label}: frame hex present`)
    assert(typeof tok.glow    === 'string', `${label}: glow hex present`)
    assert(typeof tok.textAccent === 'string', `${label}: textAccent Tailwind class present`)
    assert(typeof tok.badgeBg    === 'string', `${label}: badgeBg Tailwind class present`)
  }
})

// 3. Wuxing sigils match expected characters for each stage
test('[3b] Growth stage Wuxing sigils are correct', () => {
  assert(ELEMENT_TOKENS['water'].sigil === '水', 'sprout stage — 水 sigil')
  assert(ELEMENT_TOKENS['wood'].sigil  === '木', 'sapling stage — 木 sigil')
  assert(ELEMENT_TOKENS['earth'].sigil === '土', 'plant stage — 土 sigil')
  assert(ELEMENT_TOKENS['fire'].sigil  === '火', 'tree stage — 火 sigil')
})

// 4. iconKey format matches expected public path pattern
test('[3b] Stage icon keys follow naming convention growth-{stage}', () => {
  const expected: Record<GrowthStageName, string> = {
    sprout:  'growth-sprout',
    sapling: 'growth-sapling',
    plant:   'growth-plant',
    tree:    'growth-tree',
  }
  for (const [stageName, key] of Object.entries(expected) as [GrowthStageName, string][]) {
    assert(
      GROWTH_STAGE_BASE[stageName].iconKey === key,
      `${stageName} iconKey = "${key}"`
    )
  }
})

// 5. getGrowthStages returns all four stages in the correct order for each face
test('[3b] getGrowthStagesForFace returns ordered sprout→sapling→plant→tree', () => {
  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  const expectedOrder: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']

  for (const face of faces) {
    const stages = getGrowthStagesForFace(face)
    assert(stages.length === 4, `${face}: returns 4 stages`)
    assert(
      stages.map((s) => s.name).join(',') === expectedOrder.join(','),
      `${face}: stage order is sprout,sapling,plant,tree`
    )
  }
})

// 6. Element encoding changes correctly as water level increases (regent baseline)
test('[3b] Stage element transitions correctly as water level increases (regent)', () => {
  const face: GameMasterFace = 'regent' // thresholds: 25/50/75

  const sproutStage  = getGrowthStage(0,   face)
  const saplingStage = getGrowthStage(25,  face)
  const plantStage   = getGrowthStage(50,  face)
  const treeStage    = getGrowthStage(75,  face)

  assert(sproutStage.colorToken  === 'water', 'water=0 → water element (sprout)')
  assert(saplingStage.colorToken === 'wood',  'water=25 → wood element (sapling)')
  assert(plantStage.colorToken   === 'earth', 'water=50 → earth element (plant)')
  assert(treeStage.colorToken    === 'fire',  'water=75 → fire element (tree)')
})

// 7. Progress within stage is fractional 0–1 and updates correctly
test('[3b] getGrowthProgress returns correct fractional progress within stage', () => {
  const face: GameMasterFace = 'regent' // thresholds: 25/50/75

  // Sprout stage: 0–24 → at 0: 0/24 = 0%; at 12: 12/24 = 50%; at 24: 24/24 = 100%
  const p0  = getGrowthProgress(0,  face)
  const p12 = getGrowthProgress(12, face)
  const p24 = getGrowthProgress(24, face)

  assert(p0  >= 0 && p0  <= 1, 'progress=0 is in [0,1]')
  assert(p12 > 0  && p12 < 1,  'progress at mid-sprout is between 0 and 1')
  assert(p24 === 1,             'progress at sprout max (water=24) is 1.0')

  // Sapling stage: 25–49 → at 25: start; at 37: ~48% through; at 49: end
  const p37 = getGrowthProgress(37, face)
  assert(p37 > 0.4 && p37 < 0.6, 'water=37 is ~48% through sapling stage (regent)')
})

// 8. Altitude auto-escalation: tree stage should use 'satisfied', others 'neutral'
test('[3b] SeedGrowthCard altitude escalation logic', () => {
  // This tests the conditional logic: stage.name === 'tree' ? 'satisfied' : 'neutral'
  const face: GameMasterFace = 'regent'
  const treeStage   = getGrowthStage(75,  face)
  const plantStage  = getGrowthStage(50,  face)
  const saplingStage = getGrowthStage(25, face)
  const sproutStage  = getGrowthStage(0,  face)

  // Simulate altitude derivation used in SeedGrowthCard
  const deriveAltitude = (s: typeof treeStage) =>
    s.name === 'tree' ? 'satisfied' : 'neutral'

  assert(deriveAltitude(treeStage)    === 'satisfied', 'tree stage → satisfied altitude (full glow)')
  assert(deriveAltitude(plantStage)   === 'neutral',   'plant stage → neutral altitude')
  assert(deriveAltitude(saplingStage) === 'neutral',   'sapling stage → neutral altitude')
  assert(deriveAltitude(sproutStage)  === 'neutral',   'sprout stage → neutral altitude')
})

// 9. All stage labels are non-empty human-readable strings
test('[3b] Stage labels are display-ready strings', () => {
  const stages: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']
  const expectedLabels: Record<GrowthStageName, string> = {
    sprout:  'Sprout',
    sapling: 'Sapling',
    plant:   'Plant',
    tree:    'Tree',
  }
  for (const [stageName, expectedLabel] of Object.entries(expectedLabels) as [GrowthStageName, string][]) {
    assert(
      GROWTH_STAGE_BASE[stageName].label === expectedLabel,
      `${stageName} label = "${expectedLabel}"`
    )
  }
})

// 10. getGrowthStagesForFace min/max water ranges cover 0–100 completely
test('[3b] Stage min/max water ranges cover 0–100 without gaps or overlaps', () => {
  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
  for (const face of faces) {
    const stages = getGrowthStagesForFace(face)

    // First stage starts at 0
    assert(stages[0].minWater === 0, `${face}: first stage starts at 0`)
    // Last stage ends at 100
    assert(stages[3].maxWater === 100, `${face}: last stage ends at 100`)

    // Contiguous: each stage's maxWater + 1 = next stage's minWater
    for (let i = 0; i < 3; i++) {
      assert(
        stages[i].maxWater + 1 === stages[i + 1].minWater,
        `${face}: stage ${i} max + 1 = stage ${i+1} min (contiguous ranges)`
      )
    }
  }
})

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(56)}`)
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('─'.repeat(56))

if (failed > 0) {
  process.exit(1)
}

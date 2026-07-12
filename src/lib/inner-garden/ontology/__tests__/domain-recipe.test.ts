/**
 * Domain-recipe + progression-scale ontology tests.
 * Run: npx tsx src/lib/inner-garden/ontology/__tests__/domain-recipe.test.ts
 */
import assert from 'node:assert'
import {
  DOMAIN_KEYSTONE,
  MOVE_FRUIT,
  describeCampaignRecipe,
} from '../domain-recipe'
import { CAMPAIGN_STAGES, PROGRESSION_SCALES, QUEST_BEATS } from '../progression-scales'
import type { AllyshipDomain } from '@/lib/kotter'

const DOMAINS: AllyshipDomain[] = [
  'RAISE_AWARENESS',
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'DIRECT_ACTION',
]

// === 1. Keystone fruit is consistent with move→fruit =========================
{
  for (const d of DOMAINS) {
    const k = DOMAIN_KEYSTONE[d]
    const expected = k.nativeMoves.map(m => MOVE_FRUIT[m])
    assert.deepStrictEqual(k.keystoneFruit, expected, `${d}: keystoneFruit = fruit of native moves`)
  }
  console.log('  ✓ 1. keystone fruit derives from native moves')
}

// === 2. The game answers the headline question for Raise Awareness ===========
{
  const r = describeCampaignRecipe('RAISE_AWARENESS')
  assert.strictEqual(r.stages.length, 8, 'a campaign has 8 Kotter stages')
  assert.strictEqual(r.stages[0]!.action, 'People need to know', 'RA stage 1 = urgency action')
  assert.strictEqual(r.successAnchor, 'Embedded in culture', 'RA success = embedded in culture')
  assert.deepStrictEqual(r.keystone.keystoneFruit, ['awareness'], 'RA keystone fruit = awareness')
  assert.ok(r.answer.includes('Raise Awareness') && r.answer.includes('awareness'), 'answer names domain + keystone fruit')
  assert.ok(r.answer.includes('Embedded in culture'), 'answer names the success anchor')
  console.log('  ✓ 2. Raise Awareness recipe answers the headline question')
  console.log(`      → ${r.answer}`)
}

// === 3. Every domain yields a complete, distinct recipe ======================
{
  const anchors = new Set<string>()
  for (const d of DOMAINS) {
    const r = describeCampaignRecipe(d)
    assert.strictEqual(r.stages.length, 8, `${d}: 8 stages`)
    assert.ok(r.stages.every(s => s.action.length > 0), `${d}: every stage has an action`)
    assert.ok(r.keystone.outerDeliverable.length > 0, `${d}: has an outer deliverable`)
    anchors.add(r.successAnchor)
  }
  assert.strictEqual(anchors.size, 4, 'each domain has a distinct success anchor')
  console.log('  ✓ 3. all four domains yield complete, distinct recipes')
}

// === 4. The progression fractal is well-formed ===============================
{
  assert.strictEqual(QUEST_BEATS.length, 6, 'quest = Epiphany Bridge, 6 beats')
  assert.strictEqual(CAMPAIGN_STAGES.length, 8, 'campaign = Kotter, 8 stages')
  assert.strictEqual(PROGRESSION_SCALES.quest.commitmentBeat, 'transcendence', 'quest commitment = transcendence')
  assert.strictEqual(PROGRESSION_SCALES.campaign.commitmentBeat, 'wins', 'campaign commitment = wins')
  assert.ok(
    (QUEST_BEATS as readonly string[]).includes('transcendence') &&
      (CAMPAIGN_STAGES as readonly string[]).includes('wins'),
    'commitment beats exist in their arcs',
  )
  console.log('  ✓ 4. progression fractal (move → quest[6] → campaign[8]) well-formed')
}

console.log('inner-garden/ontology: all tests passed ✓')

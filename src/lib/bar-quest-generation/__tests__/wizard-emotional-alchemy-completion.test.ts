/**
 * QuestWizard completionEffects.emotionalAlchemy shape + grammar sanity.
 * Run: npx tsx src/lib/bar-quest-generation/__tests__/wizard-emotional-alchemy-completion.test.ts
 */

import { resolveMoveForContext } from '@/lib/quest-grammar'
import { buildWizardEmotionalAlchemyCompletionPayload } from '../emotional-alchemy'
import type { EmotionalAlchemyResult } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function testBuildWizardPayloadShape() {
  const ea: EmotionalAlchemyResult = {
    status: 'resolved',
    moveId: 'water_wood',
    moveName: 'Test Move',
    prompt: 'Narrative line',
    completionReflection: 'Reflect…',
  }
  const p = buildWizardEmotionalAlchemyCompletionPayload(ea, 'growUp')
  assert(p.source === 'quest_wizard', 'source')
  assert(p.chosenMoveType === 'growUp', 'chosenMoveType')
  assert(p.moveId === 'water_wood', 'moveId')
  assert(p.status === 'resolved', 'status')
  console.log('✓ testBuildWizardPayloadShape')
}

function testResolveMoveForDomain() {
  const m = resolveMoveForContext({
    allyshipDomain: 'GATHERING_RESOURCES',
    campaignPhase: 1,
  })
  assert(m != null && m.id.length > 0, 'domain maps to canonical move')
  console.log('✓ testResolveMoveForDomain')
}

function main() {
  testBuildWizardPayloadShape()
  testResolveMoveForDomain()
  console.log('\nAll wizard-emotional-alchemy-completion tests passed.')
}

main()

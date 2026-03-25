import { buildRaiseUrgencyQuestPayload } from '@/lib/campaign-deck-quests'
import type { DeckCardMaterialSpec, DeckIntakeV1 } from '@/lib/admin-campaign-deck-intake'

const spec: DeckCardMaterialSpec = {
  hexagramId: 3,
  theme: 'Test portal',
  domain: 'GATHERING_RESOURCES',
}

const baseIntake: DeckIntakeV1 = {
  v: 1,
  campaignIntent: 'GATHERING_RESOURCES',
  urgencyTone: 'soft',
  includeDonationSpoke: false,
}

function run() {
  const withoutMove = buildRaiseUrgencyQuestPayload('test-campaign', spec, {
    ...baseIntake,
    appliedAt: '2026-01-01T00:00:00.000Z',
  })
  const fx0 = JSON.parse(withoutMove.completionEffects) as Record<string, unknown>
  if (fx0.moveId != null) {
    throw new Error('expected no moveId without gmFaceMoveId')
  }

  const withMove = buildRaiseUrgencyQuestPayload('test-campaign', spec, {
    ...baseIntake,
    gmFaceMoveId: 'K1_sage',
    appliedAt: '2026-01-01T00:00:00.000Z',
  })
  const fx1 = JSON.parse(withMove.completionEffects) as Record<string, unknown>
  if (fx1.moveId !== 'K1_sage') {
    throw new Error(`expected moveId K1_sage, got ${String(fx1.moveId)}`)
  }
  if (fx1.deckIntakeGmFaceMoveId !== 'K1_sage') {
    throw new Error('expected deckIntakeGmFaceMoveId')
  }
  if (!withMove.title.includes('Name the story')) {
    throw new Error('expected sage stage-1 move title fragment in composed title')
  }

  console.log('campaign-deck-quests: ok')
}

run()

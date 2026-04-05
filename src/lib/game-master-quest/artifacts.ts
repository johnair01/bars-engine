import type { BarAnalysis, GameMasterFaceKey, QuestDto } from '@/lib/bar-forge/types'
import type { GmWaveMove } from '@/lib/game-master-quest/wave-move'
import type { GmArtifact } from '@/lib/game-master-quest/types'

const FACE_VOICE: Record<
  GameMasterFaceKey,
  { hook: string; domain: GmArtifact['domain']; risk: GmArtifact['riskLevel'] }
> = {
  shaman: { hook: 'Threshold and belonging — name what wants to be witnessed.', domain: 'internal', risk: 'medium' },
  challenger: { hook: 'Edge and proof — one brave move that tests the BAR.', domain: 'relational', risk: 'high' },
  regent: { hook: 'Order and role — who holds what, and by what rule?', domain: 'systemic', risk: 'low' },
  architect: { hook: 'Blueprint — structure the next build step; cut scope.', domain: 'systemic', risk: 'medium' },
  diplomat: { hook: 'Weave — consent, care, and the field between people.', domain: 'relational', risk: 'low' },
  sage: { hook: 'Integration — hold the paradox; choose what to carry forward.', domain: 'internal', risk: 'low' },
}

function clip(s: string, n: number): string {
  const t = s.trim()
  if (t.length <= n) return t
  return `${t.slice(0, n - 1)}…`
}

/** Prize granted when the linked quest is completed. */
export function buildQuestCompletionPrize(
  quest: QuestDto,
  presentingFace: GameMasterFaceKey,
  chargeLine: string
): GmArtifact {
  return {
    type: 'quest_completion_prize',
    title: `Prize: ${quest.title}`,
    description: clip(quest.description, 600),
    instructions: [
      'Take the quest in play until its completion condition is met.',
      'When finished, this artifact is yours — storable and shareable per campaign rules.',
    ],
    charge: chargeLine || 'Earned by completing the quest.',
    questId: quest.id,
    sourceFace: presentingFace,
    domain: 'relational',
    riskLevel: 'low',
  }
}

function contextHint(context?: {
  nationKey?: string
  archetypeKey?: string
  campaignRef?: string
}): string {
  const parts: string[] = []
  if (context?.campaignRef) parts.push(`campaign:${context.campaignRef}`)
  if (context?.nationKey) parts.push(`nation:${context.nationKey}`)
  if (context?.archetypeKey) parts.push(`archetype:${context.archetypeKey}`)
  return parts.length ? ` (${parts.join(', ')})` : ''
}

/** Clean Up — refine tension into a storable move. */
export function buildCleanUpArtifact(
  bar: string,
  analysis: BarAnalysis,
  face: GameMasterFaceKey,
  context?: { nationKey?: string; archetypeKey?: string; campaignRef?: string }
): GmArtifact {
  const v = FACE_VOICE[face]
  return {
    type: 'gm_clean_up_draft',
    title: `Clean Up — ${face}`,
    description: `${v.hook} BAR: ${clip(bar, 280)}${contextHint(context)}`,
    instructions: [
      `Stay in ${analysis.wavePhase} energy for this pass.`,
      'Write one sentence that sharpens the belief side and one that sharpens the result side.',
      'Name one thing you will stop doing to reduce noise this week.',
    ],
    charge: clip(bar, 120),
    riskLevel: v.risk,
    domain: v.domain,
    sourceFace: face,
  }
}

/** Wake Up — reveal pattern without collapsing to advice. */
export function buildWakeArtifact(
  bar: string,
  analysis: BarAnalysis,
  face: GameMasterFaceKey,
  context?: { nationKey?: string; archetypeKey?: string; campaignRef?: string }
): GmArtifact {
  const v = FACE_VOICE[face]
  return {
    type: 'gm_wake_up_draft',
    title: `Wake Up — ${face}`,
    description: `Surface the pattern behind the tension — not a fix, a sight-line. ${clip(bar, 220)}${contextHint(context)}`,
    instructions: [
      `Tag this BAR with wave ${analysis.wavePhase} and type ${analysis.type}.`,
      'List two polarities you already named; add one you might be avoiding.',
      'One sentence: what would become visible if the collective named this out loud?',
    ],
    charge: clip(bar, 120),
    riskLevel: v.risk,
    domain: v.domain,
    sourceFace: face,
  }
}

export function buildStubArtifact(face: GameMasterFaceKey, move: GmWaveMove): GmArtifact {
  return {
    type: 'gm_move_stub',
    title: `${move} — ${face}`,
    description:
      'Scaffolding only — Grow Up / Show Up will attach structures, deployment, and encounter hooks in a later phase.',
    instructions: ['Hold the line; no in-world prize is granted from this stub alone.'],
    charge: 'Neutral — pending implementation.',
    riskLevel: 'low',
    domain: 'internal',
    sourceFace: face,
  }
}

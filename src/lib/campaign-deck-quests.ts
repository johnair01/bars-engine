/**
 * Deterministic "Raise the urgency" quest payloads for campaign deck cards (Kotter stage 1).
 * @see .specify/specs/world-map-campaign-deck-portals/
 */

import type { DeckCardMaterialSpec, DeckIntakeV1 } from '@/lib/admin-campaign-deck-intake'

export const OWNER_GOAL_LINE_MAX_LEN = 280

export interface RaiseUrgencyQuestPayload {
  title: string
  description: string
  kotterStage: number
  campaignGoal: string
  /** JSON string for provenance / tooling */
  completionEffects: string
}

function clampOwnerLine(line: string | undefined | null): string | null {
  if (line == null || typeof line !== 'string') return null
  const t = line.trim()
  if (!t) return null
  return t.length > OWNER_GOAL_LINE_MAX_LEN ? t.slice(0, OWNER_GOAL_LINE_MAX_LEN) : t
}

/**
 * Build quest title + description from deck card spec + intake (template-only, reproducible).
 */
export function buildRaiseUrgencyQuestPayload(
  campaignRef: string,
  spec: DeckCardMaterialSpec,
  intake: DeckIntakeV1,
): RaiseUrgencyQuestPayload {
  const ownerLine = clampOwnerLine(intake.ownerGoalLine)
  const campaignGoal = 'Raise the urgency — Kotter stage 1'

  const title =
    spec.hexagramId >= 1 && spec.hexagramId <= 8
      ? `Urgency · H${spec.hexagramId} · ${spec.theme.slice(0, 80)}${spec.theme.length > 80 ? '…' : ''}`
      : `Urgency · ${spec.theme.slice(0, 90)}${spec.theme.length > 90 ? '…' : ''}`

  const domainLine = spec.domain
    ? `This spoke is aligned with **${spec.domain.replace(/_/g, ' ')}**.`
    : 'This spoke supports the campaign’s shared direction.'

  const ownerBlock = ownerLine
    ? `\n\n**Campaign owner line:** ${ownerLine}`
    : ''

  const description = [
    `**${campaignGoal}**`,
    '',
    `Portal theme: ${spec.theme}`,
    domainLine,
    '',
    'Take one honest step that makes the need real for you or your people — name the gap, surface the cost of waiting, or invite someone else into the truth of the moment.',
    ownerBlock,
  ]
    .filter(Boolean)
    .join('\n')

  const completionEffects = JSON.stringify({
    campaignDeckWizard: true,
    campaignRef,
    hexagramId: spec.hexagramId,
    intakeVersion: intake.v,
    generatedAt: intake.appliedAt ?? null,
  })

  return {
    title: title.slice(0, 200),
    description,
    kotterStage: 1,
    campaignGoal,
    completionEffects,
  }
}

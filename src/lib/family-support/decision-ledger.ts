/**
 * The check-out view: what each person in the room has proposed. Decisions are visible to every
 * room participant (spec: Visibility model), so this reads only what the room already shares.
 */
import { DECISION_TITLES, type DecisionOption } from './decision-review'

export type SavedDecision = {
  id: string
  participantId: string
  fundingOption: string
  amountCents: number
  terms: string | null
  status: string
  createdAt: string
  participant: { displayName: string | null }
}

export const decisionTitle = (fundingOption: string) =>
  DECISION_TITLES[fundingOption as DecisionOption] ?? fundingOption

const newestFirst = (a: SavedDecision, b: SavedDecision) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

/** One entry per person: their most recent proposal, newest person first. */
export function latestPerParticipant(decisions: readonly SavedDecision[]): SavedDecision[] {
  const seen = new Set<string>()
  const latest: SavedDecision[] = []
  for (const decision of [...decisions].sort(newestFirst)) {
    if (seen.has(decision.participantId)) continue
    seen.add(decision.participantId)
    latest.push(decision)
  }
  return latest
}

/** A person's proposals before their latest one, newest first. */
export function earlierProposals(decisions: readonly SavedDecision[], participantId: string): SavedDecision[] {
  return [...decisions].filter((d) => d.participantId === participantId).sort(newestFirst).slice(1)
}

export type Agreement = 'none' | 'single' | 'match' | 'differ'

/** Whether the latest proposals from everyone in the room are the same. Amounts are never summed. */
export function agreement(latest: readonly SavedDecision[]): Agreement {
  if (latest.length === 0) return 'none'
  if (latest.length === 1) return 'single'
  const [first, ...rest] = latest
  return rest.every((d) => d.fundingOption === first.fundingOption && d.amountCents === first.amountCents) ? 'match' : 'differ'
}

export function proposerName(decision: SavedDecision, viewerId: string): string {
  if (decision.participantId === viewerId) return 'You'
  return decision.participant.displayName?.trim() || 'Someone in the room'
}

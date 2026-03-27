/**
 * select-prompts — deterministically picks 9 BingoCardSquares from a corpus.
 *
 * Selection rules (in priority order):
 *  1. Filter corpus prompts by event compatibility (eventTypes match)
 *  2. Guarantee coverage: at least 1 multiplier, 1 anchor, 1 newcomer, 1 stretch
 *  3. Fill remaining slots ranked by move-type relevance to the event
 *  4. If corpus has < 9 eligible prompts, pad with generic fallbacks
 *
 * Pure function: no DB, no side effects.
 */
import type {
  BingoCardSquare,
  CommunityCharacterCorpus,
  CommunityType,
  PromptTemplate,
} from './types'
import { PROMPT_TEMPLATES } from './prompt-templates'

// Generic fallback prompts used when corpus is sparse (e.g. first event before quest)
const FALLBACK_PROMPT_IDS = [
  'multiplier-early-yes',
  'anchor-welcomer',
  'newcomer-adjacent',
  'bridge-different-network',
  'wildcard-unexpected-fit',
  'stretch-reconnection',
  'multiplier-connector',
  'newcomer-curious',
  'anchor-history-keeper',
]

const FALLBACK_PROMPTS: PromptTemplate[] = FALLBACK_PROMPT_IDS.flatMap((id) => {
  const t = PROMPT_TEMPLATES.find((p) => p.id === id)
  return t ? [t] : []
})

export interface EventContext {
  eventType: string          // from EventArtifact.eventType
  targetMoves: string[]      // from EventArtifact.targetMoves (JSON array)
}

const REQUIRED_COMMUNITY_TYPES: CommunityType[] = ['multiplier', 'anchor', 'newcomer', 'stretch']

/**
 * Score a prompt against the event context.
 * Higher = better fit.
 */
function scorePrompt(prompt: PromptTemplate, ctx: EventContext): number {
  let score = 0
  // Event type match
  if (prompt.eventTypes.includes('any') || prompt.eventTypes.includes(ctx.eventType as never)) {
    score += 2
  }
  // Move type match
  for (const move of ctx.targetMoves) {
    if (prompt.moveTypes.includes(move as never)) score += 1
  }
  return score
}

function toSquare(prompt: PromptTemplate): BingoCardSquare {
  return {
    promptId: prompt.id,
    text: prompt.text,
    communityType: prompt.communityType,
    relationalRole: prompt.relationalRole,
    stretchLevel: prompt.stretchLevel,
    assignedName: null,
    inviteNote: null,
    inviteSentAt: null,
    completedAt: null,
  }
}

export function selectBingoPrompts(
  corpus: CommunityCharacterCorpus | null,
  eventCtx: EventContext,
  count = 9,
): BingoCardSquare[] {
  const pool: PromptTemplate[] = corpus ? [...corpus.prompts] : []
  const fallbackPool = FALLBACK_PROMPTS.filter((f) => !pool.find((p) => p.id === f.id))

  // Score and sort
  const scored = [...pool, ...fallbackPool].map((p) => ({
    prompt: p,
    score: scorePrompt(p, eventCtx),
  }))
  scored.sort((a, b) => b.score - a.score)

  const selected: PromptTemplate[] = []
  const usedIds = new Set<string>()

  function pickNext(filter?: (p: PromptTemplate) => boolean): boolean {
    for (const { prompt } of scored) {
      if (usedIds.has(prompt.id)) continue
      if (filter && !filter(prompt)) continue
      selected.push(prompt)
      usedIds.add(prompt.id)
      return true
    }
    return false
  }

  // Phase 1: guarantee one of each required community type
  for (const ct of REQUIRED_COMMUNITY_TYPES) {
    if (selected.length >= count) break
    pickNext((p) => p.communityType === ct)
  }

  // Phase 2: fill remaining by score
  while (selected.length < count) {
    if (!pickNext()) break
  }

  return selected.map(toSquare)
}

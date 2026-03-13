/**
 * Creation Quest Bootstrap — Extract Creation Intent
 *
 * Rules-based extraction from unpacking answers.
 * Returns CreationIntent with confidence for downstream routing.
 * Derived heuristics: questModel (personal/communal), moveType from alignedAction.
 * See .specify/specs/creation-quest-bootstrap/spec.md
 */

import type { CreationIntent, QuestModel } from './types'

function hasUnpackingShape(answers: Record<string, unknown>): boolean {
  return (
    typeof answers.q1 === 'string' &&
    typeof answers.q3 === 'string' &&
    typeof answers.q5 === 'string' &&
    (typeof answers.q2 === 'string' || Array.isArray(answers.q2)) &&
    (typeof answers.q4 === 'string' || Array.isArray(answers.q4)) &&
    (typeof answers.q6 === 'string' || Array.isArray(answers.q6))
  )
}

function toText(value: unknown): string {
  if (value == null) return ''
  return Array.isArray(value) ? value.map(String).join(' ') : String(value)
}

/** Derive questModel from keywords. Communal = Kotter (8 stages); Personal = Epiphany Bridge (6 beats). */
function deriveQuestModel(combined: string): QuestModel {
  if (/\bcoalition|campaign|fundraiser|urgency|anchor|vision|communicate|obstacles|build\s*on\b/i.test(combined)) {
    return 'communal'
  }
  return 'personal'
}

/** Derive moveType from alignedAction when it matches a move. */
function deriveMoveType(alignedAction: string): CreationIntent['moveType'] {
  const lower = alignedAction.toLowerCase()
  if (/\bwake\s*up\b/.test(lower)) return 'wakeUp'
  if (/\bclean\s*up\b/.test(lower)) return 'cleanUp'
  if (/\bgrow\s*up\b/.test(lower)) return 'growUp'
  if (/\bshow\s*up\b/.test(lower)) return 'showUp'
  return undefined
}

/**
 * Extract creation intent from unpacking answers or generic input.
 * Rules-based: when unpacking shape is present, derive creationType from q1 + alignedAction.
 * Returns confidence 0–1; >= threshold triggers rules path in generateCreationQuest.
 */
export function extractCreationIntent(answers: Record<string, unknown>): CreationIntent {
  if (hasUnpackingShape(answers)) {
    const q1 = String(answers.q1 ?? '')
    const alignedAction = String((answers as { alignedAction?: string }).alignedAction ?? '')
    const q5 = String(answers.q5 ?? '')
    const combined = `${q1} ${alignedAction} ${q5}`.toLowerCase()

    // Heuristic: detect creation type from keywords
    let creationType = 'onboarding_quest'
    let domain: string | undefined
    if (/\bonboard|onboarding|campaign|residency|bruised\s*banana/i.test(combined)) {
      creationType = 'onboarding_quest'
      domain = 'GATHERING_RESOURCES'
    } else if (/\bbar|quest|creation|create|321|shadow/i.test(combined)) {
      creationType = 'creation_quest'
    }

    // Derived: questModel and moveType
    const questModel = deriveQuestModel(combined)
    const moveType = deriveMoveType(alignedAction)

    // Confidence: higher when we have full unpacking + alignedAction
    const hasAligned = alignedAction.length > 0
    const hasQ1 = q1.length > 10
    const confidence = hasUnpackingShape(answers) ? (hasAligned && hasQ1 ? 0.85 : 0.6) : 0.5

    return {
      creationType,
      domain,
      targetState: toText(answers.q2),
      constraints: Array.isArray(answers.q6) ? answers.q6.map(String) : answers.q6 != null ? [String(answers.q6)] : undefined,
      confidence,
      questModel,
      moveType,
    }
  }

  // Generic fallback
  const q1 = String(answers.q1 ?? answers.experience ?? '')
  return {
    creationType: 'creation_quest',
    confidence: q1.length > 10 ? 0.5 : 0.3,
  }
}

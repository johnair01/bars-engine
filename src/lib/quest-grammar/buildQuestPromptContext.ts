/**
 * Build structured prompt context for Quest Grammar AI generation.
 * Assembles emotional signature, element, archetype, lens, expected moves,
 * player POV, and Voice Style Guide into a consumable block.
 *
 * Phase 5b: Prompt context builder per quest-grammar-ux-flow spec.
 * CE: Choice privileging when targetNationId/targetPlaybookId present.
 */

import { db } from '@/lib/db'
import { compileQuest } from './compileQuest'
import { channelToElement } from './elements'
import { getPlaybookPrimaryWave } from './playbook-wave'
import { buildChoicePrivilegingContext } from './choice-privileging-context'
import type { ElementKey } from './elements'
import type {
  QuestCompileInput,
  QuestPacket,
  EmotionalAlchemySignature,
} from './types'

/** Optional player-facing unpacking (Phase 5b2) */
export interface PlayerPOV {
  p1?: string
  p2?: string
  p3?: string
  p4?: string
  p5?: string
  p6?: string
}

/** Extended input for prompt context (optional fields) */
export interface BuildQuestPromptContextInput extends QuestCompileInput {
  /** Player POV — what does the player want? (optional) */
  playerPOV?: PlayerPOV
  /** Expected moves the completer must take (milestones) */
  expectedMoves?: string[]
  /** CE: Target nation for choice privileging (nation element) */
  targetNationId?: string
  /** CE: Target playbook for choice privileging (primary WAVE) */
  targetPlaybookId?: string
}

/** Compact Voice Style Guide summary for AI prompts */
const VOICE_STYLE_GUIDE = `
Voice Style Guide (Librarian Campaign):
- Core: Presence first. Mechanics second. Initiation rituals, not explanations.
- Tone: Mischievous but warm (70%), slightly dangerous/amused (30%).
- Never: Corporate, therapeutic, apologetic, desperate, over-explanatory.
- Always: Confident, direct, respectful of intelligence, economical with words.
- Rhythm: Short declarative sentences. Let silence land.
- Avoid: "Hold space", "safe container", "trauma-informed". Prefer: Charge, fuel, forge, ledger, seed, crystallize.
- Anti-drift: Would the founder say this out loud? Is it inviting, not justifying?
`

function toText(value: string | string[]): string {
  return Array.isArray(value) ? (value as string[]).join(', ') : (value ?? '')
}

/**
 * Assemble structured prompt context for AI consumption.
 * Uses compileQuest to derive emotional signature when packet not provided.
 * CE: Fetches nation.element and playbook primary WAVE when targetNationId/targetPlaybookId present.
 */
export async function buildQuestPromptContext(
  input: BuildQuestPromptContextInput,
  packet?: QuestPacket
): Promise<string> {
  const pkt = packet ?? compileQuest(input)
  const {
    unpackingAnswers,
    alignedAction,
    segment,
    targetArchetypeIds,
    developmentalLens,
    playerPOV,
    expectedMoves,
    targetNationId,
    targetPlaybookId,
  } = input

  const sig: EmotionalAlchemySignature = pkt.signature
  const element = channelToElement(sig.primaryChannel)
  const fromState = sig.dissatisfiedLabels[0] ?? 'stuck'
  const toState = sig.satisfiedLabels[0] ?? 'free'

  const sections: string[] = []

  // Creator unpacking
  sections.push(`## Creator Unpacking
- Q1 (experience): ${unpackingAnswers.q1}
- Q2 (satisfaction): ${toText(unpackingAnswers.q2)}
- Q3 (current life): ${unpackingAnswers.q3}
- Q4 (dissatisfaction): ${toText(unpackingAnswers.q4)}
- Q5 (emotional truth): ${unpackingAnswers.q5}
- Q6 (reservations): ${toText(unpackingAnswers.q6)}${unpackingAnswers.q6Context ? ` — Context: ${unpackingAnswers.q6Context}` : ''}
- Aligned action: ${alignedAction}
- Segment: ${segment}`)

  // Player POV (optional)
  if (playerPOV && Object.values(playerPOV).some(Boolean)) {
    sections.push(`## Player POV (what the player wants)
- P1: ${playerPOV.p1 ?? '—'}
- P2: ${playerPOV.p2 ?? '—'}
- P3: ${playerPOV.p3 ?? '—'}
- P4: ${playerPOV.p4 ?? '—'}
- P5: ${playerPOV.p5 ?? '—'}
- P6: ${playerPOV.p6 ?? '—'}`)
  }

  // Emotional signature
  sections.push(`## Emotional Signature
- Primary channel: ${sig.primaryChannel}
- Element: ${element}
- Move type: ${sig.moveType ?? '—'}
- From state: ${fromState} → To state: ${toState}
- Satisfied labels: ${sig.satisfiedLabels.join(', ')}
- Dissatisfied labels: ${sig.dissatisfiedLabels.join(', ')}
- Shadow voices: ${sig.shadowVoices.join(', ')}
- Movement per node: ${sig.movementPerNode.join(', ')}`)

  // Tailoring
  if (targetArchetypeIds?.length || developmentalLens) {
    sections.push(`## Tailoring
${targetArchetypeIds?.length ? `- Target archetype(s): [IDs: ${targetArchetypeIds.join(', ')}]` : ''}
${developmentalLens ? `- Developmental lens: ${developmentalLens} — Shaman=mythic/ritual, Challenger=action/edge, Regent=structure/order, Architect=strategy/blueprint, Diplomat=care/relational, Sage=integration/whole` : ''}`)
  }

  // CE: Choice privileging (nation element + playbook WAVE)
  if (targetNationId || targetPlaybookId) {
    let nationElement: ElementKey = 'earth'
    const playbookWave = targetPlaybookId
      ? await getPlaybookPrimaryWave(targetPlaybookId)
      : 'showUp'
    if (targetNationId) {
      const nation = await db.nation.findUnique({
        where: { id: targetNationId },
        select: { element: true },
      })
      if (nation?.element && ['metal', 'water', 'wood', 'fire', 'earth'].includes(nation.element)) {
        nationElement = nation.element as ElementKey
      }
    }
    sections.push(buildChoicePrivilegingContext(nationElement, playbookWave))
  }

  // Expected moves (milestones)
  if (expectedMoves?.length) {
    sections.push(`## Expected Moves (completer milestones)
${expectedMoves.map((m) => `- ${m}`).join('\n')}`)
  }

  sections.push(`## Voice Style Guide
${VOICE_STYLE_GUIDE.trim()}`)

  return sections.join('\n\n')
}

/**
 * Return structured object for programmatic use (e.g. JSON for AI).
 * Sync version; does not include choice privileging (use buildQuestPromptContext for full context).
 */
export function buildQuestPromptContextObject(
  input: BuildQuestPromptContextInput,
  packet?: QuestPacket
): Record<string, unknown> {
  const pkt = packet ?? compileQuest(input)
  const sig = pkt.signature
  const element = channelToElement(sig.primaryChannel)

  return {
    creatorUnpacking: {
      q1: input.unpackingAnswers.q1,
      q2: input.unpackingAnswers.q2,
      q3: input.unpackingAnswers.q3,
      q4: input.unpackingAnswers.q4,
      q5: input.unpackingAnswers.q5,
      q6: input.unpackingAnswers.q6,
      q6Context: input.unpackingAnswers.q6Context ?? null,
      alignedAction: input.alignedAction,
      segment: input.segment,
    },
    playerPOV: input.playerPOV ?? null,
    emotionalSignature: {
      primaryChannel: sig.primaryChannel,
      element,
      moveType: sig.moveType,
      satisfiedLabels: sig.satisfiedLabels,
      dissatisfiedLabels: sig.dissatisfiedLabels,
      shadowVoices: sig.shadowVoices,
      movementPerNode: sig.movementPerNode,
    },
    tailoring: {
      targetArchetypeIds: input.targetArchetypeIds ?? [],
      developmentalLens: input.developmentalLens ?? null,
    },
    expectedMoves: input.expectedMoves ?? [],
  }
}

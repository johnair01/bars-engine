/**
 * Build structured prompt context for Quest Grammar AI generation.
 * Assembles emotional signature, element, archetype, lens, expected moves,
 * player POV, and Voice Style Guide into a consumable block.
 *
 * Phase 5b: Prompt context builder per quest-grammar-ux-flow spec.
 * CE: Choice privileging when targetNationId/targetArchetypeId present.
 */

import { db } from '@/lib/db'
import { compileQuest } from './compileQuestCore'
import { channelToElement } from './elements'
import { getArchetypePrimaryWave } from './archetype-wave'
import { buildChoicePrivilegingContext } from './choice-privileging-context'
import { getMovesForLens } from './lens-moves'
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

/** Gameboard context for campaign-aligned generation (DB: hexagram + campaign throughput) */
export interface GameboardContext {
  parentTitle: string
  parentDescription: string
  period: number
  /** Campaign goal (e.g. "Bruised Banana Residency—people showing up") */
  campaignGoal?: string
  /** Stage action from Domain×Kotter (e.g. "We need resources") — not Kotter stage name */
  stageAction?: string
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
  /** Gameboard context — parent quest theme, period (for campaign-aligned generation) */
  gameboardContext?: GameboardContext
  /** Admin feedback from a previous generation — incorporated into regeneration prompts */
  adminFeedback?: string
  /** Include Bruised Banana onboarding draft structure as reference (corpus/template) */
  includeOnboardingFlowReference?: boolean
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
 * CE: Fetches nation.element and archetype primary WAVE when targetNationId/targetArchetypeId present.
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
    targetArchetypeId,
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

  // I Ching context (optional) — oracle layer for tone, imagery, emotional arc
  if (input.ichingContext) {
    const ic = input.ichingContext
    const campaignParts: string[] = []
    if (ic.kotterStage != null && ic.kotterStageName) campaignParts.push(`Stage ${ic.kotterStage}: ${ic.kotterStageName}`)
    if (ic.nationName) campaignParts.push(`Nation: ${ic.nationName}`)
    if (ic.activeFace) campaignParts.push(`Lens: ${ic.activeFace}`)
    sections.push(`## I Ching Context
- Hexagram: #${ic.hexagramId} ${ic.hexagramName} — ${ic.hexagramTone}
- Meaning: ${ic.hexagramText}
- Structure: ${ic.upperTrigram} over ${ic.lowerTrigram}
${campaignParts.length ? `- Campaign: ${campaignParts.join('. ')}` : ''}

Use this I Ching reading to inform tone, imagery, and emotional arc. Align with campaign context when present.`)
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
    const lensMoves = developmentalLens ? getMovesForLens(developmentalLens) : []
    sections.push(`## Tailoring
${targetArchetypeIds?.length ? `- Target archetype(s): [IDs: ${targetArchetypeIds.join(', ')}]` : ''}
${developmentalLens ? `- Developmental lens: ${developmentalLens} — Shaman=mythic/ritual, Challenger=action/edge, Regent=structure/order, Architect=strategy/blueprint, Diplomat=care/relational, Sage=integration/whole` : ''}
${lensMoves.length ? `- Lens moves to privilege: ${lensMoves.map((m) => m.name).join(', ')}` : ''}`)
  }

  // CE: Choice privileging (nation element + playbook WAVE)
  if (targetNationId || targetArchetypeId) {
    let nationElement: ElementKey = 'earth'
    const archetypeWave = targetArchetypeId
      ? await getArchetypePrimaryWave(targetArchetypeId)
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
    sections.push(buildChoicePrivilegingContext(nationElement, archetypeWave))
  }

  // Expected moves (milestones)
  if (expectedMoves?.length) {
    sections.push(`## Expected Moves (completer milestones)
${expectedMoves.map((m) => `- ${m}`).join('\n')}`)
  }

  // Gameboard context (campaign-aligned generation, DB: throughput-oriented)
  if (input.gameboardContext) {
    const gb = input.gameboardContext
    const campaignGoal = gb.campaignGoal ?? 'people showing up in the campaign'
    const stageAction = gb.stageAction ?? gb.parentTitle
    sections.push(`## Gameboard Context (campaign throughput)
- Parent quest: ${gb.parentTitle}
- Parent description: ${gb.parentDescription}
- Period: ${gb.period}
- Stage action: ${stageAction}
- Campaign goal: ${campaignGoal}

**Generative question:** How does [${stageAction}] directly tie to people showing up in [${campaignGoal}]?

Generate a concrete, actionable quest title and description. Use the hexagram for tone and imagery when present. **Do NOT use Kotter stage names in the title** (e.g. avoid "Rally the Urgency"; use derived actions like "Name what's at stake for one person who could show up").`)
  }

  // Onboarding flow reference (Bruised Banana draft — corpus/template)
  if (input.includeOnboardingFlowReference) {
    sections.push(`## Onboarding Flow Reference (Bruised Banana draft)
Structure: introduction → emotional-alchemy choice (aligned/curious/skeptical) → identity (nation → archetype → developmental lens → intended impact) → BAR_capture → completion → handoff.
- Emotional-alchemy branches affect downstream copy and quest conditioning.
- Developmental lens maps to Game Master face (practical→architect, collaborate→diplomat, system→sage, protect→regent, emergence→shaman, capacity→challenger).
- Nations: Argyra, Pyrakanth, Lamenth, Meridia, Virelune. Archetypes (allyship superpowers): connector, storyteller, strategist, alchemist, escape_artist, disruptor.
- Intended impact: gather_resources, skillful_organizing, raise_awareness, direct_action.
Use this structure to inform onboarding quest generation when applicable.`)
  }

  sections.push(`## Yellow Brick Road (narrative frame)
The quest is a stretch of Yellow Brick Road between where the player is (${fromState}) and where they want to be (${toState}). Each blocker metabolized becomes a brick. The act of alchemy — converting dissatisfaction into movement — generates the fuel. The player can never go the wrong way; wherever the road leads is where they want to go. Speed comes from metabolizing blockers, not from skipping them.`)

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

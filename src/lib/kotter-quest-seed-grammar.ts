/**
 * Kotter × hexagram × emotional alchemy × GM face — deterministic quest/BAR seed grammar.
 * Composes player-facing title/description from slots (no LLM). Use for campaign deck,
 * portal spokes, and seed generation before any optional AI polish.
 *
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { getHexagramStructure, type Trigram } from '@/lib/iching-struct'
import { getStageAction, KOTTER_STAGES, type AllyshipDomain } from '@/lib/kotter'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

export type EmotionalAlchemyStance = 'aligned' | 'curious' | 'skeptical'

/** Slots filled by {@link composeKotterQuestSeedBar}. */
export interface KotterQuestSeedSlots {
  kotterStage: number
  kotterName: string
  stageHeadline: string
  hexagramId: number
  trigramUpper: Trigram
  trigramLower: Trigram
  trigramEssence: string
  domain: AllyshipDomain
  microBeat: string
  evidencePrompt: string
  stanceLine: string | null
  faceLine: string | null
  portalTheme: string | null
  ownerGoalLine: string | null
}

export interface ComposeKotterQuestSeedInput {
  campaignRef: string
  kotterStage: number
  allyshipDomain: AllyshipDomain
  hexagramId: number
  /** Onboarding / charge branch; omit for campaign-neutral copy. */
  emotionalAlchemyTag?: EmotionalAlchemyStance | null
  /** Changing-line / spoke lens; omit if unknown. */
  gameMasterFace?: GameMasterFace | null
  ownerGoalLine?: string | null
  /** Deck card theme or portal flavor line. */
  portalTheme?: string | null
}

export interface KotterQuestSeedBarPayload {
  title: string
  description: string
  kotterStage: number
  campaignGoal: string
  /** Set on CustomBar when non-null (matches gameboard emotional alchemy filter). */
  emotionalAlchemyTag: string | null
  /** Optional stamp for CYOA / spoke provenance. */
  gameMasterFace: string | null
  completionEffects: string
}

const TRIGRAM_ESSENCE: Record<Trigram, string> = {
  Heaven: 'initiative and clarity',
  Earth: 'receptivity and ground',
  Thunder: 'arousal and first movement',
  Water: 'depth, risk, and flow through difficulty',
  Mountain: 'stillness and boundary',
  Wind: 'gentle penetration and persistence',
  Fire: 'clarity and illumination',
  Lake: 'joy, exchange, and open expression',
}

/** Observable beat per Kotter stage — grammatical “what to do” for BAR/quest seeds. */
const STAGE_MICRO_BEAT: Record<number, string> = {
  1: 'Name one concrete gap between how things are and what the campaign needs. Say it out loud to yourself or one trusted person—or write it in one honest sentence.',
  2: 'Identify one person or role who could share the load. Reach out with a specific, small ask (not a vague “help us”).',
  3: 'Describe the future you’re organizing toward in 3–5 sentences, as if someone new just arrived—no jargon, no slogans.',
  4: 'Craft one message (voice note, paragraph, or slide) that explains **why now** to a single audience you choose.',
  5: 'Name the biggest obstacle in the way—not as a judgment, as a fact. Then choose the smallest step that loosens it.',
  6: 'Document one win that already happened (even small). Who made it possible? What can you repeat?',
  7: 'Pick one thing that worked and design how it happens again this week—with one new person included.',
  8: 'Anchor the change: name one habit, role, or ritual that will keep this alive after the spike of energy fades.',
}

const STAGE_EVIDENCE: Record<number, string> = {
  1: 'Evidence: your written gap, a sent message, or a timestamped note of the conversation.',
  2: 'Evidence: outbound invite or scheduled conversation.',
  3: 'Evidence: shared doc, voice memo, or pasted vision text.',
  4: 'Evidence: draft sent, post scheduled, or rehearsal notes.',
  5: 'Evidence: named obstacle + one logged action toward it.',
  6: 'Evidence: short win log with at least one name or link.',
  7: 'Evidence: repeat plan with date + owner.',
  8: 'Evidence: named anchor (habit/role/ritual) and first occurrence date.',
}

const STANCE_LINES: Record<EmotionalAlchemyStance, string> = {
  aligned:
    '**Stance — you feel the pull:** Trust what you already know is true enough to act. Your job is to make it legible to others, not to re-litigate it alone.',
  curious:
    '**Stance — you’re exploring:** Treat this as an experiment. You don’t need certainty—capture one honest observation or question you’re willing to test.',
  skeptical:
    '**Stance — doubt is data:** Name one real risk or reservation. Then choose the smallest step that still respects it—movement without false certainty.',
}

/** Quest-sized GM lens lines (shorter than portal CYOA templates). */
const FACE_QUEST_MICRO: Record<GameMasterFace, string> = {
  shaman:
    '**Lens — threshold:** Let something unnamed surface; follow curiosity more than strategy for this one beat.',
  challenger:
    '**Lens — edge:** Take one stance that costs something—a clear preference, a boundary, or a visible commitment.',
  regent:
    '**Lens — ground:** Map who is affected and what “good enough order” looks like before you optimize.',
  architect:
    '**Lens — structure:** Turn feeling into one diagram, list, or constraint the group can actually use.',
  diplomat:
    '**Lens — weave:** Name who isn’t in the room yet; one bridge-building gesture counts.',
  sage:
    '**Lens — pattern:** Step back one zoom level—what story are you inside, and what becomes possible if you name it?',
}

const CAMPAIGN_GOAL_BY_STAGE: Record<number, string> = {
  1: 'Raise the urgency',
  2: 'Form the guiding coalition',
  3: 'Shape the vision',
  4: 'Communicate the vision',
  5: 'Empower action & remove obstacles',
  6: 'Generate short-term wins',
  7: 'Consolidate gains & produce more change',
  8: 'Anchor new approaches in culture',
}

function clampStage(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)))
}

function trigramPairEssence(upper: Trigram, lower: Trigram): string {
  return `${TRIGRAM_ESSENCE[upper]} meeting ${TRIGRAM_ESSENCE[lower]}`
}

/**
 * Expose filled slots for tests, UI previews, or prompt assembly.
 */
export function fillKotterQuestSeedSlots(input: ComposeKotterQuestSeedInput): KotterQuestSeedSlots {
  const stage = clampStage(input.kotterStage)
  const domain = input.allyshipDomain
  const hexagramId = Math.max(1, Math.min(64, Math.round(input.hexagramId)))
  const structure = getHexagramStructure(hexagramId)
  const kotterName = KOTTER_STAGES[stage as keyof typeof KOTTER_STAGES].name
  const stageHeadline = getStageAction(stage, domain)

  const stanceLine =
    input.emotionalAlchemyTag != null ? STANCE_LINES[input.emotionalAlchemyTag] : null
  const faceLine = input.gameMasterFace != null ? FACE_QUEST_MICRO[input.gameMasterFace] : null

  const owner =
    input.ownerGoalLine?.trim() && input.ownerGoalLine.trim().length > 0
      ? input.ownerGoalLine.trim().slice(0, 280)
      : null
  const portal =
    input.portalTheme?.trim() && input.portalTheme.trim().length > 0
      ? input.portalTheme.trim().slice(0, 200)
      : null

  return {
    kotterStage: stage,
    kotterName,
    stageHeadline,
    hexagramId,
    trigramUpper: structure.upper,
    trigramLower: structure.lower,
    trigramEssence: trigramPairEssence(structure.upper, structure.lower),
    domain,
    microBeat: STAGE_MICRO_BEAT[stage] ?? STAGE_MICRO_BEAT[1]!,
    evidencePrompt: STAGE_EVIDENCE[stage] ?? STAGE_EVIDENCE[1]!,
    stanceLine,
    faceLine,
    portalTheme: portal,
    ownerGoalLine: owner,
  }
}

/**
 * Compose a full BAR/quest title + description + metadata for DB write.
 */
export function composeKotterQuestSeedBar(
  input: ComposeKotterQuestSeedInput,
): KotterQuestSeedBarPayload {
  const s = fillKotterQuestSeedSlots(input)
  const campaignGoal = `${s.kotterName} — ${CAMPAIGN_GOAL_BY_STAGE[s.kotterStage] ?? 'Campaign beat'}`

  const title = `${s.kotterName} · H${s.hexagramId} · ${s.stageHeadline}`.slice(0, 200)

  const parts: string[] = [
    `**${campaignGoal}**`,
    '',
    `**Campaign ref:** \`${input.campaignRef}\``,
    `**Domain beat:** ${s.stageHeadline}`,
    '',
    `**Hexagram ${s.hexagramId}** (${s.trigramUpper} over ${s.trigramLower}): ${s.trigramEssence}.`,
  ]

  if (s.portalTheme) {
    parts.push('', `**Portal theme:** ${s.portalTheme}`)
  }

  if (s.stanceLine) {
    parts.push('', s.stanceLine)
  }

  if (s.faceLine) {
    parts.push('', s.faceLine)
  }

  parts.push(
    '',
    s.microBeat,
    '',
    `**Success looks like:** ${s.evidencePrompt}`,
  )

  if (s.ownerGoalLine) {
    parts.push('', `**Campaign owner line:** ${s.ownerGoalLine}`)
  }

  const description = parts.join('\n')

  const completionEffects = JSON.stringify({
    grammar: 'kotter-seed-v1',
    campaignRef: input.campaignRef,
    kotterStage: s.kotterStage,
    hexagramId: s.hexagramId,
    allyshipDomain: s.domain,
    emotionalAlchemyTag: input.emotionalAlchemyTag ?? null,
    gameMasterFace: input.gameMasterFace ?? null,
  })

  return {
    title,
    description,
    kotterStage: s.kotterStage,
    campaignGoal,
    emotionalAlchemyTag: input.emotionalAlchemyTag ?? null,
    gameMasterFace: input.gameMasterFace ?? null,
    completionEffects,
  }
}

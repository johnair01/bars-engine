export type { GmFaceStageMove, GmFaceStageMoveId } from '@/lib/gm-face-stage-moves'
export {
  getGmFaceStageMoveById,
  getGmFaceStageMovesForStage,
} from '@/lib/gm-face-stage-moves'

/**
 * Kotter × hexagram × emotional alchemy × GM face — deterministic quest/BAR seed grammar.
 * Composes player-facing title/description from slots (no LLM). Use for campaign deck,
 * portal spokes, and seed generation before any optional AI polish.
 *
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { getHexagramStructure, type Trigram } from '@/lib/iching-struct'
import {
  resolveGmFaceStageMoveForComposition,
  type GmFaceStageMove,
} from '@/lib/gm-face-stage-moves'
import { getStageAction, KOTTER_STAGES, type AllyshipDomain } from '@/lib/kotter'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'

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
  /** Set when {@link ComposeKotterQuestSeedInput.gmFaceMoveId} resolves for this stage. */
  faceMove: GmFaceStageMove | null
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
  /**
   * Optional GM face × stage move (`K{n}_{face}`). When set and matching `kotterStage`,
   * title segment, micro-beat, evidence, and default `gameMasterFace` come from the move.
   */
  gmFaceMoveId?: string | null
  /**
   * Optional **reading / voice** face (spec §A). When it differs from the structural face
   * (`gameMasterFace` or move face), description appends a second lens block; `gameMasterFace`
   * on the BAR stays **structural** only.
   */
  readingFace?: GameMasterFace | null
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

/**
 * Stage-1 **play-speak** domain headlines (Phase C). Neutral fallback for title + domain beat
 * when no `gmFaceMoveId`; warmer than `getStageAction(1, domain)` deficit phrasing.
 */
const STAGE_1_PLAY_HEADLINE: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'Name what’s running out or thin',
  SKILLFUL_ORGANIZING: 'Name the missing piece of the system',
  RAISE_AWARENESS: 'Say what people still don’t see',
  DIRECT_ACTION: 'Name the smallest honest next move',
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
  const rawStageHeadline = getStageAction(stage, domain)
  const stageHeadline =
    stage === 1 ? STAGE_1_PLAY_HEADLINE[domain] ?? rawStageHeadline : rawStageHeadline

  const faceMove = resolveGmFaceStageMoveForComposition(stage, input.gmFaceMoveId) ?? null
  const microBeat = faceMove?.action ?? STAGE_MICRO_BEAT[stage] ?? STAGE_MICRO_BEAT[1]!
  const evidencePrompt = faceMove?.evidence ?? STAGE_EVIDENCE[stage] ?? STAGE_EVIDENCE[1]!

  const effectiveFace: GameMasterFace | null = input.gameMasterFace ?? faceMove?.face ?? null

  const stanceLine =
    input.emotionalAlchemyTag != null ? STANCE_LINES[input.emotionalAlchemyTag] : null
  const faceLine = effectiveFace != null ? FACE_QUEST_MICRO[effectiveFace] : null

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
    microBeat,
    evidencePrompt,
    stanceLine,
    faceLine,
    portalTheme: portal,
    ownerGoalLine: owner,
    faceMove,
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

  const titleSegment = s.faceMove != null ? s.faceMove.title : s.stageHeadline
  const title = `${s.kotterName} · H${s.hexagramId} · ${titleSegment}`.slice(0, 200)

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

  const structuralFace: GameMasterFace | null = input.gameMasterFace ?? s.faceMove?.face ?? null
  const readingFace = input.readingFace ?? null
  if (readingFace && readingFace !== structuralFace) {
    const label = FACE_META[readingFace].label
    parts.push('', `**Read as ${label}:**`, '', FACE_QUEST_MICRO[readingFace])
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

  const effectiveFace = input.gameMasterFace ?? s.faceMove?.face ?? null

  const completionEffects = JSON.stringify({
    grammar: 'kotter-seed-v1',
    campaignRef: input.campaignRef,
    kotterStage: s.kotterStage,
    hexagramId: s.hexagramId,
    allyshipDomain: s.domain,
    emotionalAlchemyTag: input.emotionalAlchemyTag ?? null,
    gameMasterFace: effectiveFace,
    readingFace: input.readingFace ?? null,
    moveId: s.faceMove?.id ?? null,
  })

  return {
    title,
    description,
    kotterStage: s.kotterStage,
    campaignGoal,
    emotionalAlchemyTag: input.emotionalAlchemyTag ?? null,
    gameMasterFace: effectiveFace,
    completionEffects,
  }
}

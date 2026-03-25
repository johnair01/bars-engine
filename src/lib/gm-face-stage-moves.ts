/**
 * GM face × Kotter stage moves (6 faces × 8 stages). Canonical copy: KQSG spec §C.
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md
 */

import { GAME_MASTER_FACES, type GameMasterFace } from '@/lib/quest-grammar/types'

export interface GmFaceStageMove {
  id: string
  kotterStage: number
  face: GameMasterFace
  title: string
  action: string
  evidence: string
}

function m(
  stage: number,
  face: GameMasterFace,
  title: string,
  action: string,
  evidence: string,
): GmFaceStageMove {
  return { id: `K${stage}_${face}`, kotterStage: stage, face, title, action, evidence }
}

/** All 48 moves; stable order: stage 1..8, faces in {@link GAME_MASTER_FACES} order. */
export const GM_FACE_STAGE_MOVES: readonly GmFaceStageMove[] = [
  m(1, 'shaman', 'Surface the unnamed cost', 'Write or speak one sentence: what is draining or unsaid that the campaign cannot pretend away?', 'Timestamped note or BAR body with that sentence'),
  m(1, 'regent', 'Bound one shortage', 'Name **one** concrete shortage, **one** time window (e.g. this week), **one** owner who acknowledges it', 'Text names all three'),
  m(1, 'challenger', 'Name the cost of silence', 'Who loses if nobody says this out loud? One sentence + one named or role-level “who”', 'Sentence + who'),
  m(1, 'architect', 'Diagram the gap', 'One list, sketch, or bullet flow: current state → what’s missing → first crack', 'Image or pasted list'),
  m(1, 'diplomat', 'One trusted witness', 'Tell **one** specific person the truth of the moment; log who (initials ok) and date', 'Log line'),
  m(1, 'sage', 'Name the story we’re in', 'Before recruiting anyone: what narrative are we already inside? Two sentences max', 'Two sentences in BAR/quest reply'),

  m(2, 'shaman', 'Who feels the same heat?', 'Name one person or role who is already emotionally “in it” with you', 'Name + one line why'),
  m(2, 'regent', 'Formalize one ask', 'One written ask: role, time box, deliverable', 'Pasted ask'),
  m(2, 'challenger', 'Challenge vague help', 'Convert “help us” into one measurable micro-commitment from someone', 'Quote + commitment'),
  m(2, 'architect', 'RACI stub', 'One row: Responsible / Accountable / Consulted / Informed for **one** work stream', 'Table or list'),
  m(2, 'diplomat', 'Bridge two silos', 'Name two groups; one gesture that connects them this week', 'Two names + gesture'),
  m(2, 'sage', 'Why we need more than me', 'One paragraph: why coalition, why now', 'Paragraph'),

  m(3, 'shaman', 'Felt picture of done', 'Describe the future in **sensory** terms (not slogans), 3–5 sentences', 'Text'),
  m(3, 'regent', 'Success criteria', 'Three bullet “we will know we’re there when…”', 'Three bullets'),
  m(3, 'challenger', 'What we refuse', 'One line: what outcome is **not** acceptable', 'One line'),
  m(3, 'architect', 'Vision → milestone ladder', 'Ordered list: 3 milestones, smallest first', 'Ordered list'),
  m(3, 'diplomat', 'Newcomer paragraph', 'Same vision as if explaining to someone who arrived today', 'Paragraph'),
  m(3, 'sage', 'Story arc', 'Beginning / turn / where we’re headed—in one short arc', 'Short text'),

  m(4, 'shaman', 'Emotional hook', 'One sentence: why **this** message now', 'Sentence'),
  m(4, 'regent', 'One audience, one channel', 'Name audience + single channel for this beat', 'Two fields'),
  m(4, 'challenger', 'Why now, why you', 'Challenge yourself: why should **they** care this week?', 'Short answer'),
  m(4, 'architect', 'Message architecture', 'Headline + 3 bullets + one CTA', 'Structured text'),
  m(4, 'diplomat', 'Tone check', 'Read aloud once; one line: how it lands for the least aligned listener', 'Note'),
  m(4, 'sage', 'Through-line', 'One sentence linking vision → this message', 'Sentence'),

  m(5, 'shaman', 'Obstacle as feeling', 'Name the obstacle **as experience**, then restate as fact', 'Two lines'),
  m(5, 'regent', 'Owner of the blocker', 'Who owns removing or escalating this? Name them', 'Name'),
  m(5, 'challenger', 'Smallest wedge', 'What’s the tiniest action that proves the obstacle can move?', 'Action + date'),
  m(5, 'architect', 'Dependency map', 'What must be true before X? 3 nodes max', 'Mini map text'),
  m(5, 'diplomat', 'Who needs to hear the block', 'One stakeholder to inform so we’re not heroing alone', 'Name'),
  m(5, 'sage', 'Pattern', 'Is this obstacle recurring? One line pattern name', 'Line'),

  m(6, 'shaman', 'Felt win', 'What did it **feel** like when it landed?', 'Sentence'),
  m(6, 'regent', 'Win on record', 'Date, owner, metric or observable', 'Log'),
  m(6, 'challenger', 'So what next', 'What does this win **demand** we do next?', 'Line'),
  m(6, 'architect', 'Repeat playbook', 'Steps to reproduce in one numbered list', 'List'),
  m(6, 'diplomat', 'Thank in public', 'One public or group thank-you naming names', 'Link or paste'),
  m(6, 'sage', 'Meaning', 'One sentence: what this win **means** for the story', 'Sentence'),

  m(7, 'shaman', 'New energy', 'Who is newly drawn in after the win?', 'Name'),
  m(7, 'regent', 'Scale decision', 'What do we **not** scale yet (guardrail)?', 'Line'),
  m(7, 'challenger', 'Next edge', 'What’s the next honest stretch?', 'Line'),
  m(7, 'architect', 'Systemize one piece', 'One thing we’ll repeat on a schedule', 'What + cadence'),
  m(7, 'diplomat', 'Invite one more', 'One new person into the next beat', 'Name'),
  m(7, 'sage', 'Chapter title', 'Name this phase of the campaign in 5 words max', '≤5 words'),

  m(8, 'shaman', 'Ritual', 'One recurring ritual that holds meaning', 'What + when'),
  m(8, 'regent', 'Owner of the long haul', 'Role + name for sustained ownership', 'RACI line'),
  m(8, 'challenger', 'What we won’t slip on', 'One non-negotiable', 'Line'),
  m(8, 'architect', 'Check-in cadence', 'When we review this: calendar rule', 'Rule'),
  m(8, 'diplomat', 'Culture line', 'One sentence newcomers hear about how we work', 'Sentence'),
  m(8, 'sage', 'Legacy', 'One sentence: what remains when energy dips', 'Sentence'),
] as const

const BY_ID: ReadonlyMap<string, GmFaceStageMove> = new Map(GM_FACE_STAGE_MOVES.map((move) => [move.id, move]))

export type GmFaceStageMoveId = (typeof GM_FACE_STAGE_MOVES)[number]['id']

export function getGmFaceStageMoveById(id: string): GmFaceStageMove | undefined {
  return BY_ID.get(id)
}

/** Moves for one Kotter stage (1–8), in canonical face order. */
export function getGmFaceStageMovesForStage(stage: number): readonly GmFaceStageMove[] {
  const s = Math.max(1, Math.min(8, Math.round(stage)))
  return GAME_MASTER_FACES.map((face) => BY_ID.get(`K${s}_${face}`)).filter(
    (x): x is GmFaceStageMove => x != null,
  )
}

/**
 * Returns the move if `id` exists and matches `kotterStage` (after clamping to 1–8).
 * Otherwise undefined (caller should fall back to generic stage micro-beat).
 */
export function resolveGmFaceStageMoveForComposition(
  kotterStage: number,
  gmFaceMoveId: string | null | undefined,
): GmFaceStageMove | undefined {
  if (gmFaceMoveId == null || String(gmFaceMoveId).trim() === '') return undefined
  const stage = Math.max(1, Math.min(8, Math.round(kotterStage)))
  const move = getGmFaceStageMoveById(String(gmFaceMoveId).trim())
  if (!move || move.kotterStage !== stage) return undefined
  return move
}

/** Dev/test helper: throws if registry is incomplete or inconsistent. */
export function assertGmFaceStageMoveRegistry(): void {
  if (GM_FACE_STAGE_MOVES.length !== 48) {
    throw new Error(`GM_FACE_STAGE_MOVES: expected 48 entries, got ${GM_FACE_STAGE_MOVES.length}`)
  }
  const ids = new Set<string>()
  const perStage = new Map<number, Set<GameMasterFace>>()
  for (const move of GM_FACE_STAGE_MOVES) {
    if (ids.has(move.id)) throw new Error(`Duplicate move id: ${move.id}`)
    ids.add(move.id)
    if (move.id !== `K${move.kotterStage}_${move.face}`) {
      throw new Error(`Move id mismatch: ${move.id} vs K${move.kotterStage}_${move.face}`)
    }
    let faces = perStage.get(move.kotterStage)
    if (!faces) {
      faces = new Set()
      perStage.set(move.kotterStage, faces)
    }
    faces.add(move.face)
  }
  for (let st = 1; st <= 8; st++) {
    const faces = perStage.get(st)
    if (!faces || faces.size !== 6) {
      throw new Error(`Stage ${st}: expected 6 faces, got ${faces?.size ?? 0}`)
    }
    for (const f of GAME_MASTER_FACES) {
      if (!faces.has(f)) throw new Error(`Stage ${st}: missing face ${f}`)
    }
  }
}

assertGmFaceStageMoveRegistry()

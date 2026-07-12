/**
 * Inner Garden — Progression Scales (the fractal).
 *
 * BARS metabolizes a charge with the SAME grammar at three nested scales; only the
 * beat-count differs. This module names the fractal so the game can reason about
 * "what stage is this quest / campaign in" uniformly.
 *
 *   Move     (atomic)   — one WAVE move            → one fruit
 *   Quest    (personal) — Epiphany Bridge, 6 beats → a keystone artifact
 *   Campaign (communal) — Kotter, 8 stages         → an anchored change
 *
 * Beat values mirror `EpiphanyBeatType` / `KotterBeatType` in
 * `@/lib/quest-grammar/types.ts` (which says: "Personal = Epiphany Bridge (6 beats);
 * Communal = Kotter (8 stages)"). The commitment beat aligns across scales:
 * Epiphany `transcendence` ↔ Kotter `wins` (the ActionType / "do the thing" moment).
 *
 * Design doc: docs/handoffs/2026-07-12-inner-garden-progression-fractal.md
 */

/** Quest arc — Russell-style Epiphany Bridge (personal transformation), N=6. */
export const QUEST_BEATS = [
  'orientation',
  'rising_engagement',
  'tension',
  'integration',
  'transcendence', // ← commitment / the move is played
  'consequence',
] as const
export type QuestBeat = (typeof QUEST_BEATS)[number]

/** Campaign arc — Kotter change model (communal), N=8. */
export const CAMPAIGN_STAGES = [
  'urgency',
  'coalition',
  'vision',
  'communicate',
  'obstacles',
  'wins', // ← commitment / the win is shipped
  'build_on',
  'anchor',
] as const
export type CampaignStage = (typeof CAMPAIGN_STAGES)[number]

export type ProgressionScale = 'move' | 'quest' | 'campaign'

export interface ScaleDescriptor {
  scale: ProgressionScale
  arc: string
  beatCount: number
  /** The commitment beat — where a move is actually played / a win shipped. */
  commitmentBeat: string | null
}

export const PROGRESSION_SCALES: Record<ProgressionScale, ScaleDescriptor> = {
  move: { scale: 'move', arc: 'WAVE move', beatCount: 1, commitmentBeat: null },
  quest: { scale: 'quest', arc: 'Epiphany Bridge', beatCount: QUEST_BEATS.length, commitmentBeat: 'transcendence' },
  campaign: { scale: 'campaign', arc: 'Kotter', beatCount: CAMPAIGN_STAGES.length, commitmentBeat: 'wins' },
}

/**
 * Superpowers — canonical types (Mobility Quest Superpower Campaign, Phase 1).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 *       .specify/specs/superpower-quiz-design/spec.md
 *
 * Seven superpowers = six canonical (Drive Strategy Guides + superpower-move-
 * extensions) + Coach (addendum; see superpower-quiz-design/coach-strategy-guide.md).
 * A superpower is a TRANSLATION LAYER carrying both a domain emphasis (WHERE it
 * works) and, per enactment, an ORIENTATION (internal/external = inner/outer
 * MoveAspect). Deterministic data — no AI.
 */
import type { MoveAspect } from '../quest-grammar/types'
import type { AllyshipDomain, Channel } from '../allyship-deck/types'

export type Superpower =
  | 'connector'
  | 'storyteller'
  | 'strategist'
  | 'disruptor'
  | 'alchemist'
  | 'escape_artist'
  | 'coach'

/** Display/iteration order. */
export const SUPERPOWERS: readonly Superpower[] = [
  'connector',
  'storyteller',
  'strategist',
  'disruptor',
  'alchemist',
  'escape_artist',
  'coach',
] as const

/**
 * The addendum's internal/external polarity. Maps 1:1 onto the existing
 * MoveAspect (inner/outer) from quest-grammar — one source of truth.
 */
export type SuperpowerOrientation = 'internal' | 'external'

/** Bridge: internal→inner, external→outer (inner-outer-allyship-moves). */
export function orientationToMoveAspect(o: SuperpowerOrientation): MoveAspect {
  return o === 'internal' ? 'inner' : 'outer'
}

/**
 * Static profile per superpower, mined from the Strategy Guides
 * (superpower-quiz-design/item-bank.md). `domains` = WHERE it naturally works;
 * `channel` = its element; orientation is NOT stored here (per-enactment).
 */
export interface SuperpowerDef {
  key: Superpower
  label: string
  /** Element channel (emotion arc noted in `emotionArc`). */
  channel: Channel
  emotionArc: string
  domains: AllyshipDomain[]
  /** Overuse shadow (leaks into internal-orientation prompts). */
  overuseShadow: string
  /** Avoidance shadow. */
  avoidanceShadow: string
}

export const SUPERPOWER_DEFS: Record<Superpower, SuperpowerDef> = {
  connector: {
    key: 'connector',
    label: 'Connector',
    channel: 'earth',
    emotionArc: 'Neutrality→Peace (Earth) + Sadness→Poignance (Water)',
    domains: ['RAISE_AWARENESS', 'GATHERING_RESOURCES'],
    overuseShadow: 'over-mediates, responsible for everyone’s bonds, absorbs all emotions',
    avoidanceShadow: 'withholds introductions — "people should figure it out"',
  },
  storyteller: {
    key: 'storyteller',
    label: 'Storyteller',
    channel: 'fire',
    emotionArc: 'Anger→Triumph (Fire) + Sadness→Poignance (Water)',
    domains: ['RAISE_AWARENESS'],
    overuseShadow: 'the Manipulator — distorts/dramatizes for engagement',
    avoidanceShadow: 'the Lost Author — won’t claim a voice, lets others own the story',
  },
  strategist: {
    key: 'strategist',
    label: 'Strategist',
    channel: 'metal',
    emotionArc: 'Fear→Clarity/Precision (Metal)',
    domains: ['SKILLFUL_ORGANIZING'],
    overuseShadow: 'analysis paralysis, over-control, people-as-chess-pieces',
    avoidanceShadow: 'won’t act without a perfect plan',
  },
  disruptor: {
    key: 'disruptor',
    label: 'Disruptor',
    channel: 'fire',
    emotionArc: 'Anger→Triumph (Fire)',
    domains: ['DIRECT_ACTION'],
    overuseShadow: 'the Chaos Bringer — burns everything, fights to fight',
    avoidanceShadow: 'the Caged Rebel — bitter, waits for permission, inert',
  },
  alchemist: {
    key: 'alchemist',
    label: 'Alchemist',
    channel: 'water',
    emotionArc: 'all elements; Sadness→Poignance→Joy (master of alchemy)',
    domains: ['DIRECT_ACTION'],
    overuseShadow: 'Emotional Overload — absorbs too much, burns out',
    avoidanceShadow: 'the Detached Observer — intellectualizes, stays distant',
  },
  escape_artist: {
    key: 'escape_artist',
    label: 'Escape Artist',
    channel: 'water',
    emotionArc: 'Sadness→Poignance (Water) + Fear→Excitement (Metal)',
    domains: ['DIRECT_ACTION'],
    overuseShadow: 'the Martyr — stays too long out of guilt',
    avoidanceShadow: 'the Ghost — bolts at first friction',
  },
  coach: {
    key: 'coach',
    label: 'Coach',
    channel: 'fire',
    emotionArc: 'Frustration→Triumph (Fire) — softened Disruptor; integrator',
    domains: ['GATHERING_RESOURCES'],
    overuseShadow: 'the Taskmaster — drags instead of calls up; creates dependence',
    avoidanceShadow: 'the Empty Cheerleader — only affirms, never nudges',
  },
}

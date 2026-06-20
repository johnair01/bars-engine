/**
 * Superpower result descriptions + framing (superpower-quiz-design Phase 2, FR5/FR6).
 * Source: .specify/specs/superpower-quiz-design/item-bank.md (Result copy).
 *
 * Research-grounded (RESEARCH_quiz-construction.md §4): falsifiable + behavioral,
 * EACH carries its shadow (favorability NOT equalized), no two-sided hedges, no
 * authority/AI cosplay. Result is a lens, not a verdict; taker is the authority.
 */
import type { Superpower } from '../types'
import { SUPERPOWERS } from '../types'
import type { QuizResult } from './types'

export interface SuperpowerDescription {
  superpower: Superpower
  /** The gift, stated behaviorally. */
  gift: string
  /** The real shadow (overuse / avoidance) — included on purpose. */
  shadow: string
  /** What it looks like at its best. */
  atBest: string
}

export const SUPERPOWER_DESCRIPTIONS: Record<Superpower, SuperpowerDescription> = {
  connector: {
    superpower: 'connector',
    gift: 'You see the invisible threads between people before anyone names them — the right introduction at the right moment. Your work is often invisible precisely because it works.',
    shadow: 'You over-mediate, take responsibility for everyone’s bonds, and burn out absorbing feelings that aren’t yours.',
    atBest: 'Grounded enough to connect the right people, not everyone.',
  },
  storyteller: {
    superpower: 'storyteller',
    gift: 'You shape meaning — you can move people from rage to triumph and grief to purpose by reframing the story they’re trapped inside.',
    shadow: 'The Manipulator who bends the truth for engagement — or the Lost Author who won’t claim a voice and lets others own the narrative.',
    atBest: 'You reveal; you don’t control.',
  },
  strategist: {
    superpower: 'strategist',
    gift: 'You see the whole board and the move three steps out — you find the leverage and build the plan that holds.',
    shadow: 'Analysis paralysis, gripping too tight, treating people as chess pieces — or refusing to act until the plan is "perfect."',
    atBest: 'Foresight in service of people, not control.',
  },
  disruptor: {
    superpower: 'disruptor',
    gift: 'You feel the fire when something’s broken and you’re willing to name it — you make space by breaking what no longer works.',
    shadow: 'The Chaos Bringer who burns everything (and every ally) — or the Caged Rebel, bitter and waiting for permission.',
    atBest: 'Precise, not reckless; you clear the way for something better.',
  },
  alchemist: {
    superpower: 'alchemist',
    gift: 'You don’t just feel emotion — you move it, turning grief into meaning and rage into momentum, in yourself and in a room.',
    shadow: 'Emotional Overload (a sponge that cracks) — or the Detached Observer who analyzes feelings from the shore.',
    atBest: 'You swim — present without drowning.',
  },
  escape_artist: {
    superpower: 'escape_artist',
    gift: 'You see the cage before the walls close in, and you know leaving can be a skill, not a failure.',
    shadow: 'The Martyr who stays too long out of guilt — or the Ghost who bolts at the first discomfort and never belongs anywhere.',
    atBest: 'You leave well, and help others see their own open door.',
  },
  coach: {
    superpower: 'coach',
    gift: 'You help people remember their own power by helping them abandon the level they’ve outgrown — and the story that keeps them there. The softened Disruptor: frustration at wasted potential, re-aimed into someone’s Triumph.',
    shadow: 'The Taskmaster who drags instead of calls up (and breeds dependence) — or the Empty Cheerleader who only affirms and never delivers the honest nudge.',
    atBest: 'You hand power back; they climb, and they credit themselves.',
  },
}

/** Shown with every result — the anti-Barnum, lens-not-verdict frame (FR6). */
export const RESULT_FRAMING =
  'This is a lens, not a verdict — computed from 12 questions, a snapshot of a ' +
  'current pattern, not a fixed identity. You’re the authority on you. Your top ' +
  'two are below with how close they are. Does the top one fit? If not, the ' +
  'second is right there. No type is better than another, and none of this ' +
  'labels, limits, or scores you.'

export interface ResultCopy {
  primary: SuperpowerDescription
  secondary: SuperpowerDescription
  /** Margin as a percentage (0–100), rounded — the "how close" band. */
  marginPct: number
  confident: boolean
  /** Honest "not quite you?" nudge toward the runner-up. */
  tryAdjacent: string
  framing: string
}

/** Compose the human-facing copy for a scored result (deterministic). */
export function composeResultCopy(result: QuizResult): ResultCopy {
  const primary = SUPERPOWER_DESCRIPTIONS[result.primary]
  const secondary = SUPERPOWER_DESCRIPTIONS[result.secondary]
  return {
    primary,
    secondary,
    marginPct: Math.round(result.margin * 100),
    confident: result.confident,
    tryAdjacent: `Not quite you? Your secondary is ${secondary.superpower} — try it on.`,
    framing: RESULT_FRAMING,
  }
}

/** Guard: every superpower has a description (used by tests). */
export function allSuperpowersDescribed(): boolean {
  return SUPERPOWERS.every((s) => Boolean(SUPERPOWER_DESCRIPTIONS[s]))
}

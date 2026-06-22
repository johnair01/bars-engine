/**
 * Superpower result descriptions + framing (superpower-quiz-design Phase 2, FR5/FR6).
 * Source: .specify/specs/superpower-quiz-design/item-bank.md (Result copy).
 *
 * Research-grounded (RESEARCH_quiz-construction.md §4): falsifiable + behavioral,
 * EACH carries its shadow (favorability NOT equalized), no two-sided hedges, no
 * authority/AI cosplay. Result is a lens, not a verdict; taker is the authority.
 */
import type { Superpower } from '../types'
import { SUPERPOWERS, SUPERPOWER_DEFS } from '../types'
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
    gift: 'You see the invisible threads between people before anyone else does — and you pull the right one at the right moment. Half your best work looks, from the outside, like nothing happened at all.',
    shadow: "Left unchecked, you take on everyone's relationships as your job, mediate fights that were never yours, and quietly burn out as the sponge for the whole room.",
    atBest: 'Grounded enough to connect the right people — not everyone — and to let a bond you started grow without you.',
  },
  storyteller: {
    superpower: 'storyteller',
    gift: "You shape what things mean. You can carry a room from rage to triumph, or grief to purpose, by re-telling the story they're trapped inside.",
    shadow: 'Two ways it curdles: the Manipulator who bends the truth to land the hit, or the Lost Author who never picks up the pen and lets worse storytellers win.',
    atBest: "You reveal — you don't spin. The story serves the cause, not your ego.",
  },
  strategist: {
    superpower: 'strategist',
    gift: 'You see the whole board three moves out, and you find the lever nobody noticed. The crises you quietly prevent look, infuriatingly, like crises that were never real.',
    shadow: 'Pushed too far you grip — overplanning into paralysis, moving people like pieces — or you refuse to act until the plan is flawless, which it never is.',
    atBest: 'Foresight in service of people, not control.',
  },
  disruptor: {
    superpower: 'disruptor',
    gift: "You feel the fire when something's broken, and you're willing to say so out loud. You make room by breaking what's quietly rotting.",
    shadow: 'Unrefined, it is the Chaos Bringer who torches every bridge (and every ally) — or the Caged Rebel, bitter and waiting for a permission that never comes.',
    atBest: 'Precise, not reckless — you clear the ground so something better can be built.',
  },
  alchemist: {
    superpower: 'alchemist',
    gift: "You don't just feel emotion — you move it. Grief into meaning, rage into momentum, in yourself and in a whole room.",
    shadow: 'It tips into Emotional Overload — the sponge that finally cracks — or the Detached Observer, narrating feelings from a safe, useless distance.',
    atBest: 'You swim: fully in the water, and not drowning.',
  },
  escape_artist: {
    superpower: 'escape_artist',
    gift: 'You see the cage before the door clicks shut, and you know that leaving — cleanly, on time — is a skill, not a failure.',
    shadow: 'Two failure modes: the Martyr who stays years too long out of guilt, or the Ghost who bolts at the first friction and never belongs anywhere.',
    atBest: 'You leave well — and you help others spot their own open door.',
  },
  coach: {
    superpower: 'coach',
    gift: "You hand people back the power they forgot they had — by helping them abandon the level they've outgrown, and the story keeping them there. The Disruptor's fire, softened and aimed at a person's excuse.",
    shadow: 'It sours into the Taskmaster who drags instead of calls up (and breeds dependence), or the Empty Cheerleader who only ever claps and never says the hard, true thing.',
    atBest: 'You give the power back; they make the climb, and they credit themselves.',
  },
}

/** Shown with every result — the anti-Barnum, lens-not-verdict frame (FR6). */
export const RESULT_FRAMING =
  'A reading, not a sentence. We tallied twelve quick choices into a pattern — a ' +
  'lens for your next move, not a cage you live in. You are the final authority on ' +
  'you: if the top one does not fit, the second is right there. No superpower ' +
  'outranks another, and nothing here labels, limits, or scores you.'

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
    tryAdjacent: `Not quite you? Your second wind is the ${SUPERPOWER_DEFS[result.secondary].label}. Try it on.`,
    framing: RESULT_FRAMING,
  }
}

/** Guard: every superpower has a description (used by tests). */
export function allSuperpowersDescribed(): boolean {
  return SUPERPOWERS.every((s) => Boolean(SUPERPOWER_DESCRIPTIONS[s]))
}

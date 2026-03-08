/**
 * Canonical Kernel for Random Unpacking
 *
 * Satisfaction/dissatisfaction derived from emotional alchemy moves.
 * Element → channel states per .agent/context/emotional-alchemy-interfaces.md §5.
 *
 * See: .specify/specs/random-unpacking-canonical-kernel/spec.md
 */

import type { ElementKey } from './elements'
import type { PersonalMoveType } from './types'
import type { CanonicalMove } from './move-engine'
import { EXPERIENCE_OPTIONS } from './unpacking-constants'

/** Element → dissatisfied/satisfied labels. Derived from emotional-alchemy-interfaces.md §5. */
export const ELEMENT_CHANNEL_STATES: Record<
  ElementKey,
  { dissatisfiedLabels: string[]; satisfiedLabels: string[] }
> = {
  metal: {
    dissatisfiedLabels: ['anxious', 'scared', 'worried'],
    satisfiedLabels: ['excited', 'relieved'],
  },
  water: {
    dissatisfiedLabels: ['sad', 'disappointed', 'isolated'],
    satisfiedLabels: ['poignant', 'fulfilled'],
  },
  wood: {
    dissatisfiedLabels: ['numb', 'overwhelmed'],
    satisfiedLabels: ['energized', 'triumphant', 'blissful'],
  },
  fire: {
    dissatisfiedLabels: ['frustrated'],
    satisfiedLabels: ['triumphant'],
  },
  earth: {
    dissatisfiedLabels: ['boredom', 'apathy'],
    satisfiedLabels: ['peaceful'],
  },
}

/** Element → allyship domains (WHERE). Per emotional-alchemy-interfaces.md §4. */
const ELEMENT_TO_DOMAINS: Record<ElementKey, string[]> = {
  metal: ['Raise Awareness', 'Skillful Organizing'],
  fire: ['Raise Awareness', 'Direct Action'],
  water: ['Gather Resource', 'Raise Awareness'],
  wood: ['Gather Resource', 'Skillful Organizing', 'Direct Action'],
  earth: ['Gather Resource', 'Skillful Organizing'],
}

/** WAVE stage → primary domain. */
const WAVE_TO_DOMAIN: Record<PersonalMoveType, string> = {
  wakeUp: 'Raise Awareness',
  cleanUp: 'Skillful Organizing',
  growUp: 'Gather Resource',
  showUp: 'Direct Action',
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/**
 * Get dissatisfied and satisfied labels for a canonical move.
 * Transcend: use element for both from and to.
 * Translate: use fromElement → dissatisfied, toElement → satisfied.
 * Returns 2 labels from each array (pickN-style).
 */
export function getLabelsForMove(move: CanonicalMove): {
  dissatisfiedLabels: string[]
  satisfiedLabels: string[]
} {
  let fromElement: ElementKey
  let toElement: ElementKey

  if (move.category === 'Transcend' && move.element) {
    fromElement = move.element
    toElement = move.element
  } else if (move.fromElement && move.toElement) {
    fromElement = move.fromElement
    toElement = move.toElement
  } else {
    fromElement = 'earth'
    toElement = 'earth'
  }

  const fromStates = ELEMENT_CHANNEL_STATES[fromElement]
  const toStates = ELEMENT_CHANNEL_STATES[toElement]

  return {
    dissatisfiedLabels: pickN(fromStates.dissatisfiedLabels, 2),
    satisfiedLabels: pickN(toStates.satisfiedLabels, 2),
  }
}

/**
 * Pick experience (Q1) for a player based on nation element and playbook WAVE.
 * Intersects domains when both present; fallback to random from EXPERIENCE_OPTIONS.
 */
export function pickExperienceForPlayer(
  nationElement?: ElementKey,
  playbookWave?: PersonalMoveType
): string {
  if (nationElement && playbookWave) {
    const nationDomains = ELEMENT_TO_DOMAINS[nationElement]
    const waveDomain = WAVE_TO_DOMAIN[playbookWave]
    const intersection = nationDomains.filter((d) => d === waveDomain)
    if (intersection.length > 0) {
      return intersection[0]!
    }
  }
  if (nationElement) {
    const domains = ELEMENT_TO_DOMAINS[nationElement]
    return domains[Math.floor(Math.random() * domains.length)]!
  }
  if (playbookWave) {
    return WAVE_TO_DOMAIN[playbookWave]
  }
  return EXPERIENCE_OPTIONS[Math.floor(Math.random() * EXPERIENCE_OPTIONS.length)]!
}

/**
 * 5 Elements + Emotional Channel Mapping
 *
 * Canonical mapping for Emotional Alchemy. Used by move engine and compileQuest.
 * Aligns with src/lib/game/nations.ts ElementKey.
 *
 * See: .agent/context/emotional-alchemy-ontology.md
 */

import type { EmotionalChannel } from './types'

export type ElementKey = 'metal' | 'water' | 'wood' | 'fire' | 'earth'

export interface ElementDef {
  key: ElementKey
  channel: EmotionalChannel
  lesson: string
}

export const ELEMENTS: Record<ElementKey, ElementDef> = {
  metal: {
    key: 'metal',
    channel: 'Fear',
    lesson: 'Risk or opportunity detected. Excitement = Fear interpreted as opportunity.',
  },
  water: {
    key: 'water',
    channel: 'Sadness',
    lesson: "Something I care about is distant or misaligned.",
  },
  wood: {
    key: 'wood',
    channel: 'Joy',
    lesson: 'Vitality detected.',
  },
  fire: {
    key: 'fire',
    channel: 'Anger',
    lesson: 'Obstacle present OR boundary violated.',
  },
  earth: {
    key: 'earth',
    channel: 'Neutrality',
    lesson: 'Whole-system perspective / detachment.',
  },
}

export const ELEMENT_KEYS: ElementKey[] = ['metal', 'water', 'wood', 'fire', 'earth']

/** Channel → element (first match) */
export function channelToElement(channel: EmotionalChannel): ElementKey {
  const found = ELEMENT_KEYS.find((k) => ELEMENTS[k].channel === channel)
  return found ?? 'earth'
}

/** Element → channel */
export function elementToChannel(element: ElementKey): EmotionalChannel {
  return ELEMENTS[element].channel
}

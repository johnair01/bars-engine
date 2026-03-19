/**
 * Archetype Starter Deck — The Subtle Influence (Wind trigram)
 * Agency pattern: gradual change, persistent shaping, system influence
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:subtle-influence',
  label: 'The Subtle Influence',
  category: 'archetype',
  cardSeed: [
    {
      title: 'What Is Slowly Shifting?',
      bodyText:
        'You tend to notice gradual movement that others miss. What has been changing — slowly, incrementally, almost invisibly — in your community or situation? Name the trend before it becomes obvious.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Is Your Influence Already Operating?',
      bodyText:
        'The Subtle Influence often does not realize how much is already moving because of them. Where have you already shaped something — a conversation, a habit, a relationship — without direct action? Name it.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When Did Subtle Become Invisible?',
      bodyText:
        'Your influence can sometimes be so gradual that you become invisible — even to yourself. When did you last make your contribution legible? Who does not know what you have done? Name the invisibility gap.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Manipulation Pattern',
      bodyText:
        'The Subtle Influence\'s shadow is shaping outcomes indirectly when directness would be more honest. Where are you influencing a situation instead of simply stating what you want? Name it without judgment.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Small Nudge That Compounds',
      bodyText:
        'What single small action, taken consistently over time, would shift the system you are trying to change? Not the grand intervention — the persistent nudge. Design it. Commit to doing it for one week.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Plant the Seed',
      bodyText:
        'What idea, question, or frame do you put into conversation now — not someday, today? Name who specifically. Name what you are planting. Send it. The Subtle Influence\'s power is in the planting, not the imagining of the planting.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Shape the Conditions',
      bodyText:
        'What conditions — in a conversation, a meeting, a relationship — could you shift before the main event? Arrive early, set the room differently, send the message that reframes. Log what you changed and what it made possible.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Make the Influence Legible',
      bodyText:
        'Name what you have been doing — the patient, persistent shaping — and make it visible to at least one person. Not to claim credit, but to make the method itself available to the community. Write the BAR. Share it. Log who you made it visible to and what they now understand.',
      faceKey: null,
      archetypeKey: 'subtle-influence',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

/**
 * Archetype Starter Deck — The Bold Heart (Heaven trigram)
 * Agency pattern: initiative, creative leadership, courageous beginning
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:bold-heart',
  label: 'The Bold Heart',
  category: 'archetype',
  cardSeed: [
    {
      title: 'Where Did You Hesitate?',
      bodyText:
        'Your first instinct is usually right. Where have you been second-guessing an impulse that was actually sound? Name the hesitation. Look at what it cost you to pause.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Name What You Are Ready to Begin',
      bodyText:
        'Something wants to start. Not someday — now, or close to now. What are you actually ready to begin, if readiness means "willing to begin imperfectly"? Name it plainly.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Fear of Beginning',
      bodyText:
        'What are you afraid will happen if you start this? The Bold Heart\'s shadow is false starts and overwhelm. Name the specific fear underneath the stall. It is almost never what it looks like on the surface.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Who Did You Leave Behind?',
      bodyText:
        'Bold Hearts move fast and sometimes leave people behind. Who has not kept up with your pace — not because they are slow, but because you did not bring them with you? Name one. Consider what bridging looks like.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Courageous Frame',
      bodyText:
        'How would you frame this situation if you were operating from your most courageous self? Not the anxious framing, not the cautious framing — the one that sees what is possible and orients toward it.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Bold Move Are Others Afraid to Propose?',
      bodyText:
        'You can often see the move that others are too cautious to name. What is the bold action that the situation is actually calling for, that no one has said aloud yet? Say it here first.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Take the First Step',
      bodyText:
        'You have been thinking about starting. Stop thinking. Take the first step — the actual, physical, irreversible first step. Then log it. The log is the evidence you moved.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Lead by Going First',
      bodyText:
        'The Bold Heart leads by example, not instruction. Do the thing you want others to do — openly, visibly, as an invitation. Share a BAR of your action. Let it call others forward.',
      faceKey: null,
      archetypeKey: 'bold-heart',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

/**
 * Archetype Starter Deck — The Decisive Storm (Thunder trigram)
 * Agency pattern: sudden action, pattern disruption, breakthrough
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:decisive-storm',
  label: 'The Decisive Storm',
  category: 'archetype',
  cardSeed: [
    {
      title: 'What Has Been Waiting to Move?',
      bodyText:
        'You have a sense for when something is ready to break open. What situation in your life or community is coiled, ready, on the verge of shift? Name what you can feel building. Do not act yet — just name the charge.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Is the Pattern That Needs Breaking?',
      bodyText:
        'Patterns do not break themselves. What is the repeated loop — in a conversation, a relationship, a system — that has been cycling without resolution? Name it. See it clearly. The Decisive Storm sees the pattern before striking it.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Decision You Have Been Deferring',
      bodyText:
        'What decision are you holding but not making? The Decisive Storm\'s shadow is sometimes striking everywhere except the one place that matters. Name what is actually at stake — not what you have been telling yourself, but the real cost of not deciding.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When the Storm Passed Through Without Warning',
      bodyText:
        'Your decisiveness sometimes arrives before others are ready for it. Who was left disoriented, unheard, or run over by a decision you made? Name what happened. Name what it cost them.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'One Clean Cut',
      bodyText:
        'What is the single most clarifying decision you will make today — the one that resolves the most ambiguity? Not a series of moves. One decision. The Decisive Storm\'s power is in the specificity of the strike, not its frequency.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Break the Stuck Pattern',
      bodyText:
        'What is the specific cut that would break this pattern? Not a planned intervention — the one decisive move. Name it. Name the exact moment you will make it. Commit.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Strike Now',
      bodyText:
        'Stop planning and move. The Decisive Storm\'s action is the action itself — not the deliberation. Take the step you have been circling. Make the call. Send the message. Log what you did and what it unleashed.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Bring the Breakthrough to the Group',
      bodyText:
        'You have moved, decided, broken the pattern. Now make it available. Share what happened with the community — not as a report, but as an invitation. Your breakthrough is a signal that movement is possible. Write the BAR. Share it. Log how the group received it and what moved when they did.',
      faceKey: null,
      archetypeKey: 'decisive-storm',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

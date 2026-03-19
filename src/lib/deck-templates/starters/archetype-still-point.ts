/**
 * Archetype Starter Deck — The Still Point (Mountain trigram)
 * Agency pattern: stillness, boundaries, stability
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:still-point',
  label: 'The Still Point',
  category: 'archetype',
  cardSeed: [
    {
      title: 'What Becomes Visible When You Stop?',
      bodyText:
        'Pause for two minutes before answering this card. Just stop. Now: what did you notice that was already present before you looked? Capture what stillness showed you.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Are You Being Pulled?',
      bodyText:
        'What is demanding your movement, your reaction, your immediate response? Name the pull. The Still Point\'s gift is seeing the pull clearly before deciding whether to follow it.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Boundary You Have Not Named',
      bodyText:
        'What boundary exists in you that you have not made explicit to the people around you? Not a rule — a real limit of what you can hold, offer, or sustain. Name it. Write the exact words you would use to say it.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When Stillness Became Withdrawal',
      bodyText:
        'The Still Point\'s shadow is using stillness to disappear rather than to see clearly. Has your pause become an absence? Has your non-reactivity become unavailability? Name it honestly.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Hold the Space',
      bodyText:
        'What situation in your community needs someone to simply hold the space — not fix, not advise, not redirect, just remain present? Name the situation. Name what you will not do. Commit to showing up without agenda.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Stability Others Build On',
      bodyText:
        'Who in your life is using your consistency as a foundation for their own risk-taking? You may not have noticed. Your steadiness is what they push off from. Name who. Then design the condition under which your stability can sustain itself — the one thing you need to keep being the foundation. Commit to it.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Say No',
      bodyText:
        'What request, demand, or pull have you been resisting internally but not yet externally? Say no to it — clearly, without over-explaining. Log the no and what it opened up.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Be the Anchor',
      bodyText:
        'Show up to the destabilizing situation — and name the one thing that needs to be said. Not a fix. Not an instruction. The one true thing that the moment needs spoken. Say it. Log what you said and what holding steady made possible.',
      faceKey: null,
      archetypeKey: 'still-point',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

/**
 * Onboarding Starter Deck — 8 cards covering the full Charge → BAR → Action loop.
 * No archetype or nation keys. Works for any player at any stage.
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-9)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const onboardingDeck: DeckTemplate = {
  key: 'onboarding',
  label: 'Starting Deck',
  category: 'onboarding',
  cardSeed: [
    // Wake Up × 2
    {
      title: 'Name What Is Alive',
      bodyText:
        'What is alive in you right now — not what should be alive, not what you wish were alive. What is actually present? Capture your charge and let it be what it is.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'See the Pattern',
      bodyText:
        'What has been happening repeatedly? Not the event — the pattern underneath the events. Name it in one sentence. Write it as a BAR.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },

    // Clean Up × 2
    {
      title: 'Name What Is in the Way',
      bodyText:
        'What is the actual obstacle — not the symptom, not the story around it, the thing itself? Name it plainly. If something in you is stuck, the Emotional First Aid Kit is waiting.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Belief Running This',
      bodyText:
        'Underneath the obstacle, there is a belief. What does a part of you believe that is making this hard? Name the belief. You do not have to agree with it — just name it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },

    // Grow Up × 2
    {
      title: 'The Perspective You Do Not Have Yet',
      bodyText:
        'What would you see if you were one level up from where you are standing? What does this situation look like from the perspective you have not taken? Write what you find. Now use this perspective. What one decision or action does it reveal that you have been avoiding? Commit to it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Find the Person Who Has Done This',
      bodyText:
        'Who has already done the thing this situation is asking of you? Find one person — in your community, in a book, in your memory — who has crossed this threshold. Then contact them if you can — not to report, but to learn directly. Log what you learn from them.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },

    // Show Up × 2
    {
      title: 'Do the Thing',
      bodyText:
        'You know what needs to happen. Do it — the smallest honest version of it. Then come back and log what you did. The log is the card being played.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Send the BAR',
      bodyText:
        'What did you just do? Create a BAR from this action and send it to someone who needs to see it — not to report, but to signal. Your action is a message. Let it travel. Log who you sent it to and what you signaled by sending it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(onboardingDeck)
export default onboardingDeck

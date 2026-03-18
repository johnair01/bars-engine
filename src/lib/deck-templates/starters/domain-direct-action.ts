/**
 * Domain Starter Deck — Direct Action
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-11)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'domain:direct_action',
  label: 'Direct Action',
  category: 'domain',
  cardSeed: [
    {
      title: 'What Is the Actual Situation?',
      bodyText:
        'Before you act, see clearly. What is actually happening — not your interpretation of it, not the story about it, the situation itself? Name it in the plainest language you have.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'The Smallest Honest Action',
      bodyText:
        'What is the smallest action that would be honest and real in this situation? Not the grand gesture — the next smallest true thing. Name it. Make sure it is actually the smallest one.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'What Is Stopping You?',
      bodyText:
        'You know what to do. What is actually in the way of doing it right now? Name the obstacle without softening it. Is it external, internal, or both?',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'The Fear Underneath',
      bodyText:
        'What are you afraid will happen if you take this action? Name it directly. Fear named is fear that can be worked with. Fear unnamed runs the plan instead.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'Who Acts With You?',
      bodyText:
        'Direct action is rarely solo. Who needs to be with you in this? Not who should be — who actually can be, right now? Name one person and consider how to bring them in.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'The Action With a Longer Time Horizon',
      bodyText:
        'What action, taken now, makes the next five actions easier? You are not just solving this moment — you are building the capacity to act. What is the move that compounds?',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'Do It Now',
      bodyText:
        'This is not a planning card. Take the action — the one you have been sitting with — right now or in the next hour. Log what you did. The log is the evidence the action happened.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'self' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
    {
      title: 'Make It Visible',
      bodyText:
        'What did you do? Make it visible to at least one other person — post a BAR, send a message, share the result. Visibility is not vanity. It makes action real in the shared field.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'DIRECT_ACTION',
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

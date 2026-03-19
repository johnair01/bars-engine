/**
 * Nation Starter Deck — Meridia (Earth element)
 * Cultural register: grounded, receptive, nourishing, centering
 * Moves shaped by the logic of earth: holding, receiving, sustaining, returning to center
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'nation:meridia',
  label: 'Meridia — The Nation of Living Earth',
  category: 'nation',
  cardSeed: [
    {
      title: 'What Are You Currently Holding?',
      bodyText:
        'Earth holds everything — the weight, the weight of others, the unresolved, the long-term. Before you can move, you need to know what you are carrying. Name everything you are currently holding. Not what you chose to carry — what has gradually settled into you, the way soil accumulates over time. Name what you have become the floor of.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Who Is Receiving Nourishment from You?',
      bodyText:
        'Earth nourishes. What is growing because of the ground you provide? Name who or what is receiving sustenance from your consistency, your care, your quiet labor. Meridia sees what is alive because of what is beneath it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Has Compacted Under Too Much Weight?',
      bodyText:
        'Over time, earth under sustained pressure becomes too dense for growth. What part of you — your energy, your capacity, your sense of possibility — has been compacted by too much load? Name it. Meridia recovers by acknowledging the compression before trying to loosen it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Return to Center',
      bodyText:
        'Earth returns to level not through effort but through nature — given time and no new weight, it settles. Where have you been destabilized? Name what knocked you off. Then stop trying to return. Name what level looks like from here — not how to get there, just what it is.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Prepare the Ground',
      bodyText:
        'Before things grow, the soil must be prepared — cleared, turned, made receptive. What conversation, space, or relationship needs preparation before the real work can happen? Name what needs to be cleared. Begin the preparation. Log it. Name who else is part of this preparation. Contact them before you begin.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Sustain What Is Growing',
      bodyText:
        'Something in your community needs consistent, unglamorous tending to reach maturity. Name it. Name the specific act of sustaining — the check-in, the resource, the protected time — that it needs from you right now. Provide it. Log what you gave.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Be the Ground',
      bodyText:
        'Show up to a situation where people are unsteady or things are chaotic — and simply be the stable presence. Do not fix, do not redirect, do not explain. Hold the ground. Log what your steadiness made possible for others.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Name What the Ground Has Grown',
      bodyText:
        'Earth\'s gift is invisible — it works below what is seen. Name what has grown because of the ground you have been providing: the relationship, the project, the person. Make the invisible work visible. Write the BAR. Share it. Log who now knows what your ground has grown.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'meridia',
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

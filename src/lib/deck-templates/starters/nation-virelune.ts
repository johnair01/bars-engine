/**
 * Nation Starter Deck — Virelune (Wood element)
 * Cultural register: emergent, organic, growth-oriented, patient upward pressure
 * Moves shaped by the logic of wood: sprouting, reaching, growing through constraint
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'nation:virelune',
  label: 'Virelune — The Nation of Living Wood',
  category: 'nation',
  cardSeed: [
    {
      title: 'What Is Emerging?',
      bodyText:
        'Wood moves upward even when the soil is hard. What is beginning to emerge in your life or community — tender, early, not yet established, but genuinely alive? Name the sprout before it becomes a tree. Virelune sees what is becoming.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Are Your Roots?',
      bodyText:
        'Where is the unseen part of you already reaching — toward water, toward nutrients, toward what you have not consciously identified yet? You do not decide this; you observe it. Name what your root system is already moving toward before the surface knows it needs it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Has Overgrown Its Container?',
      bodyText:
        'Wood that grows too fast without tending becomes tangled. What in your current work or commitments has outgrown its container — expanded beyond what the structure can hold? Name what needs pruning or transplanting.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Growth You Skipped',
      bodyText:
        'Trees grow in rings. What stage of growth did you rush past — in a relationship, a skill, a project — that is now creating instability in the larger structure? Name what you skipped. Name what is unstable in the larger structure because of it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Bend and Keep Growing',
      bodyText:
        'Wood bends in the wind rather than breaking. What constraint, obstacle, or opposition are you currently pushing directly against? Name an approach that bends around the obstacle while maintaining your direction. Design the adaptive path.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Plant What Will Outlast You',
      bodyText:
        'What seed could you plant now that will provide shade and shelter long after you have moved on? Not the fast-growing thing — the slow, deep thing. Design a contribution whose benefit compounds over time. Name it. Commit to a planting date.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Reach Toward the Light',
      bodyText:
        'Name the direction your growth has already chosen, even before you consciously named it. You do not decide this — you observe it. Then take one step in that direction. Log what you moved toward and what you noticed about the choosing.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Offer the Canopy',
      bodyText:
        'Mature trees provide shelter. What have you grown into that can now shelter others — a skill, a resource, a capacity, a hard-won understanding? Make it available. Virelune\'s gift is not hoarding growth but extending it. Write the BAR. Share it where it will shelter someone. Log what you offered and who is now under the canopy.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'virelune',
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

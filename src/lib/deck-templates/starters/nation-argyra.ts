/**
 * Nation Starter Deck — Argyra (Metal element)
 * Cultural register: crystalline, precise, refined, discerning
 * Moves shaped by the logic of refinement, distillation, and clarity through reduction
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'nation:argyra',
  label: 'Argyra — The Nation of Refined Metal',
  category: 'nation',
  cardSeed: [
    {
      title: 'What Can Be Distilled?',
      bodyText:
        'Metal refines through pressure and heat. What experience, conversation, or period of struggle are you ready to distill into its essential meaning? Strip away the story. Name the ore. What is the pure thing that remains?',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Does Precision Live in Your Work?',
      bodyText:
        'Argyra moves through exactness. Where in your current situation would greater precision — a clearer boundary, a more precise ask, a more exact naming — make the most difference? Name the point of leverage.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Needs to Be Released to Become Pure?',
      bodyText:
        'Refining removes what does not belong. What commitment, relationship, role, or habit are you carrying that dilutes rather than strengthens you? Name it. Discernment is not cruelty — it is the discipline of Metal.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Grief the Metal Carries',
      bodyText:
        'Metal holds grief — the ache of what could have been, what was lost, what was not recognized. What loss are you holding that has not yet been acknowledged? Name it without resolution. The acknowledgment itself is the movement.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Refine the Standard',
      bodyText:
        'What standard of quality — in your work, your relationships, your community — do you want to hold more precisely? Name it in specific terms, not general ideals. Write the standard as if someone else could use it to evaluate the work.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Cut What Does Not Belong',
      bodyText:
        'What element — in a plan, a relationship, a process — does not belong in the refined version? Name it and begin the work of removing it. Log the first cut.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Name It Exactly',
      bodyText:
        'Say the precise thing. Not approximately, not with hedges and qualifications that soften the edge into vagueness. Name what is true with the specificity of cut metal. Say it to someone — say it where it needs to land. Log the exact statement you made and the effect of that precision.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Offer the Refined Form',
      bodyText:
        'You have worked something into a form worthy of sharing — a distilled insight, a clear framework, a precise naming of something the community has been circling. Offer it. Write the BAR. The gift of Argyra is making the refined thing available. Log who received it and what the precision made possible.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'argyra',
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

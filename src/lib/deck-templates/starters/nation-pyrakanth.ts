/**
 * Nation Starter Deck — Pyrakanth (Fire element)
 * Cultural register: volcanic, passionate, transformative, illuminating
 * Moves shaped by the logic of fire: warmth, clarity, consumption, transformation
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'nation:pyrakanth',
  label: 'Pyrakanth — The Nation of Living Fire',
  category: 'nation',
  cardSeed: [
    {
      title: 'What Is Burning in You Right Now?',
      bodyText:
        'Fire is not managed — it is fed or it goes out. What in you is currently alive, urgent, passionate, or on the verge of ignition? Name the heat. Do not qualify it. The first move of Pyrakanth is recognizing where the fire already lives.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Illuminates Everything Else?',
      bodyText:
        'Fire reveals through heat, not just light. What does the intensity of this moment force into view — not just illuminate, but make undeniable? What cannot stay hidden when the fire is burning? Name what the heat has revealed that careful attention alone would have missed.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Did the Fire Consume That Was Not Fuel?',
      bodyText:
        'Pyrakanth burns hot and does not always discriminate. What did your passion, urgency, or conviction consume that was not meant to be burned — a relationship, a resource, an opportunity? Name it. Fire learns by accounting for what it consumed.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Is Your Fire Being Smothered?',
      bodyText:
        'Something is reducing your fire — a dynamic, a relationship, a structure that does not allow the heat you carry. Name what is smothering you.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Feed the Right Fire',
      bodyText:
        'Not every fire deserves your fuel. Which initiative, relationship, or vision in your community most needs your heat and light right now? Commit your energy to it specifically, not generally. When you give it, log what it kindled.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Transform, Do Not Just Burn',
      bodyText:
        'Fire transforms matter into energy and ash. What needs to be transformed — not just demolished — in your situation? Fire applied with intention changes form while preserving substance. What are you transforming, and what is the new form?',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Bring the Heat',
      bodyText:
        'What situation in your community is cold, stuck, or going through the motions? Show up with genuine passion — not performance, not facilitated energy, but the real fire you carry. Log what you brought and how the temperature changed.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Light the Way for Others',
      bodyText:
        'The gift of Pyrakanth is not only heat but illumination. Share something — a realization, a vision, an honest naming — that lights up the path for others in your community. Write the BAR. Make the fire available. Do not keep the light to yourself. Share it where it will reach someone who needs it. Log what you lit.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'pyrakanth',
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

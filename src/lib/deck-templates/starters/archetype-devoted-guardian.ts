/**
 * Archetype Starter Deck — The Devoted Guardian (Earth trigram)
 * Agency pattern: support, stewardship, stability creation
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:devoted-guardian',
  label: 'The Devoted Guardian',
  category: 'archetype',
  cardSeed: [
    {
      title: 'Who Are You Protecting?',
      bodyText:
        'Who have you been holding without being asked — not because they called for help, but because you quietly positioned yourself between them and harm? Name who. Name how long you have been holding this position.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Needs Tending Right Now?',
      bodyText:
        'Something in your community is in need of care that it is not currently receiving. You can sense it. Name it specifically — not the general problem, the specific gap in tending. What needs attention today?',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Are You Holding That Is Not Yours to Hold?',
      bodyText:
        'The Devoted Guardian often holds too much for too long. What burden, responsibility, or emotional weight are you carrying that belongs to someone else — or to the community as a whole? Name it.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When Devotion Became Depletion',
      bodyText:
        'Where are you giving from a place of emptiness rather than fullness? The Guardian\'s shadow is caregiving as self-erasure. Name one area where your devotion is outrunning your capacity to sustain it.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Build the Infrastructure of Care',
      bodyText:
        'What structure — a routine, a resource, a ritual — would make caring for this person or community more sustainable over time? You cannot guardian indefinitely without infrastructure. Design one piece of it. Name who is involved. Name when you will begin. Commit to it for one month.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Who Guards the Guardian?',
      bodyText:
        'Who is holding the space for you? Who do you go to when you are the one who needs support? If the answer is no one, that is the gap. Name who could fill it. Name the specific ask you would make. Commit to making it.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Act of Care',
      bodyText:
        'Do the specific act of care that needs doing. Not a general tending — the precise thing. The act is for a specific person. Name them. Then log it. The Devoted Guardian\'s power is in the specificity of the care, not its scale.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Model the Receiving',
      bodyText:
        'Let yourself be cared for — visibly. Accept help, ask for support, receive what is offered without deflecting. Log what it felt like and what it made possible in the relationship or community.',
      faceKey: null,
      archetypeKey: 'devoted-guardian',
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

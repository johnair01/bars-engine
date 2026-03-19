/**
 * Archetype Starter Deck — The Truth Seer (Fire trigram)
 * Agency pattern: illumination, clarity, truth revelation
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:truth-seer',
  label: 'The Truth Seer',
  category: 'archetype',
  cardSeed: [
    {
      title: 'What Are You Seeing That Others Are Not?',
      bodyText:
        'You often perceive what is actually happening before the group catches up. What is the truth you are currently holding that has not yet been spoken into the room? Name it here first.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Is the Actual Situation?',
      bodyText:
        'Strip away what others have placed on top of this situation — the spin, the accommodation, the agreed-upon story. What does it look like when you see it with your own eyes? Name what the unmediated truth reveals that the shared narrative was covering.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Truth You Are Softening',
      bodyText:
        'What truth are you making more palatable — hedging, qualifying, burying in context — when it needs to land clearly? Name the unedited version. Write the unedited version. Then sit with what it would cost to say it.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When Clarity Became a Weapon',
      bodyText:
        'Has your truth-telling ever landed as cruelty rather than illumination? The Truth Seer\'s shadow is precision without care. Name a time this happened. What would compassionate clarity have looked like instead?',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Question That Illuminates',
      bodyText:
        'What single question, asked at the right moment, would bring the most clarity to this situation? Not the answer — the question. Write it. Name the moment and the audience you will ask it in. Commit to asking it.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Truth in Their Language',
      bodyText:
        'You see the truth clearly. But can you translate it into a form that lands for the person who needs to hear it? Rewrite the truth using their frames, their vocabulary, their concerns as the entry point. Commit to delivering it to them in this form.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Speak the Truth',
      bodyText:
        'Say the thing you have been seeing. Write it as a BAR — clearly, directly, without softening or over-qualifying. Share it with one person who needs to hear it. Log the moment of speaking.',
      faceKey: null,
      archetypeKey: 'truth-seer',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Name What the Room Cannot Name',
      bodyText:
        'In a group, conversation, or situation — name the thing everyone is sensing but no one has said. Do it with care and precision. Log what you said and what shifted when you said it.',
      faceKey: null,
      archetypeKey: 'truth-seer',
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

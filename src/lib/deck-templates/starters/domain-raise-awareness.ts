/**
 * Domain Starter Deck — Raise Awareness
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-12)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'domain:raise_awareness',
  label: 'Raise Awareness',
  category: 'domain',
  cardSeed: [
    {
      title: 'What Are People Not Seeing?',
      bodyText:
        'What is visible to you that is not yet visible to the people who need to see it? Name the gap between what you know and what the field knows. That gap is where awareness work begins.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'Who Needs to Know This?',
      bodyText:
        'Who is the specific person or group that needs to receive what you know? Not everyone — the right ones. Name them. Understanding who needs to hear changes everything about how to speak.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'The Story That Is Not Being Told',
      bodyText:
        'What story is missing from the current conversation? Whose experience, whose data, whose perspective is absent? Name it. The missing story is often the most important one.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'Why Is This Hard to Say?',
      bodyText:
        'What makes this particular truth difficult to voice in this particular context? Is it the audience, the stakes, the form? Name the friction. Friction named can be navigated.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'Find the Language That Lands',
      bodyText:
        'How do the people who need to hear this already think and speak? What metaphors, frames, or entry points are native to them? Write the message in their language, not yours.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'The Amplifier',
      bodyText:
        'Who is already trusted by the people who need to hear this? You may not be the right messenger — but you might know who is. Name the amplifier. Name one thing you could give them — a briefing, a resource, an introduction — to make them effective. Send it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'Say the Thing',
      bodyText:
        'Create a BAR that says what needs to be said, clearly and without softening. Share it with the person or group who needs to see it. Log the share. The saying is the card being played.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
    {
      title: 'Share the Link',
      bodyText:
        'Find one piece of content — an article, a story, a video, a resource — that illuminates what you are trying to make visible. Share it with one person who needs it. Log what you shared and why.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'RAISE_AWARENESS',
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

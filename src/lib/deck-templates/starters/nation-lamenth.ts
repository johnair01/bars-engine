/**
 * Nation Starter Deck — Lamenth (Water element)
 * Cultural register: tidal, deep, adaptive, relentless
 * Moves shaped by the logic of water: flow, depth, persistence, finding the way through
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'nation:lamenth',
  label: 'Lamenth — The Nation of Deep Waters',
  category: 'nation',
  cardSeed: [
    {
      title: 'What Is the Current Running Underneath?',
      bodyText:
        'Water always has a current — a direction that is not visible on the surface. What is the underlying movement in your situation right now? Not the visible activity, the actual force driving things. Name the current beneath the surface.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Where Is the Way Through?',
      bodyText:
        'Water does not push — it finds what opens. What in your situation would yield if you stopped pushing against it? Name the gap that force has been missing. Name the path that opens when you move with the terrain rather than against it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Have You Pooled in Stagnation?',
      bodyText:
        'Water that does not move becomes stagnant. What situation, commitment, or emotional state has been still for too long — pooling, going flat, losing oxygen? Name it. Lamenth knows the difference between patient depth and stuck water.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Depth You Have Been Avoiding',
      bodyText:
        'Lamenth does not fear depth — but sometimes you do. What has been too deep to look at directly? What lies below the surface that you have been managing from a safe distance? Name what is down there.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Persistent Pressure',
      bodyText:
        'What would change if you applied consistent, patient pressure over time — not a flood, but a steady current? Water shapes stone this way. Name the stone. Name the pressure you will apply. Commit to a specific duration. Log the first application.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Go Deeper, Not Wider',
      bodyText:
        'Where are you skimming the surface of something that deserves your depth? Choose one thing — one relationship, one practice, one inquiry — and go deeper into it rather than adding breadth. Name what you are diving into and what you are releasing to do it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Flow Around the Obstacle',
      bodyText:
        'What are you currently forcing your way through that would yield to a different approach — a side channel, a longer route, a redirection of energy? Name the obstacle and design the flow. Then begin moving. Log the new path.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Share What the Depth Showed You',
      bodyText:
        'You have been somewhere others have not — in a difficult passage, a long negotiation, an experience of descent and return. Name what you saw in the depth and make it available. The gift of Lamenth is returning with what was found below. Write the BAR. Share it where it is needed. Log who received it and what they now have that they did not before.',
      faceKey: null,
      archetypeKey: null,
      nationKey: 'lamenth',
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

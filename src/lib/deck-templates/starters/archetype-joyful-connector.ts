/**
 * Archetype Starter Deck — The Joyful Connector (Lake trigram)
 * Agency pattern: joy, connection, shared experience, delight
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:joyful-connector',
  label: 'The Joyful Connector',
  category: 'archetype',
  cardSeed: [
    {
      title: 'Who Lights Up When You Are Around?',
      bodyText:
        'You have a specific effect on certain people — something loosens, something opens, something becomes possible in your presence. Name one person for whom this is true right now. What becomes available to them when you show up as yourself?',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Is Actually Joyful Right Now?',
      bodyText:
        'Not in general — in this moment, in this situation. What is genuinely good, fun, alive, or delightful? The Joyful Connector does not perform joy; they find the real thread of it that already exists. Name it.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'When Connection Became Performance',
      bodyText:
        'Is the joy you are bringing real, or are you performing it because the group needs it? Not a memory from the past — in the current situation. Name the most recent moment when you were offering brightness you did not feel. What were you protecting the group from by performing it?',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Who Have You Missed?',
      bodyText:
        'Your gift is connection, which means your shadow is the relationship that quietly went quiet while you were performing brightness for everyone else. Name one. What got in the way of authentic contact?',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Map the Connection Gap',
      bodyText:
        'Who in your community is isolated — present but not connected, included but not seen? Name one person who is at the edge of belonging. Design one specific thing you could do to bring them more fully in. Name it. Commit to doing it this week.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Design the Shared Experience',
      bodyText:
        'What gathering, ritual, or shared moment could you create that would strengthen the bonds in your community? Not an event — a specific experience that generates genuine connection. Design it. Name who you would invite. Begin planning.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Bridge Two Worlds',
      bodyText:
        'You know people in different circles who would benefit from knowing each other. Make the introduction now. Write the message. Send it. Log who you connected and what you believe becomes possible between them.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Reach Out',
      bodyText:
        'Contact someone in your community who you have been thinking about but have not reached out to. Not a mass message — a direct, personal message. Say something real. Log that you did it and what happened.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Celebrate What Is Working',
      bodyText:
        'Name something in your community that is genuinely good right now — a person, a moment, a development. Celebrate it publicly. Not as cheerleading — as testimony. Write a BAR about something real that is moving. Share it where others can see. Log what you celebrated and who saw it.',
      faceKey: null,
      archetypeKey: 'joyful-connector',
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

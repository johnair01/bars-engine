/**
 * Domain Starter Deck — Gathering Resources
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-10)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'domain:gathering_resources',
  label: 'Gathering Resources',
  category: 'domain',
  cardSeed: [
    {
      title: 'What Do You Actually Need?',
      bodyText:
        'Not what you think you should need, not what you are embarrassed to need — what do you actually need to move this forward? Name the resource. Be specific.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'Map Your Assets',
      bodyText:
        'What do you already have that you are not fully using? Skills, relationships, time, access. Make the list. The resource you are looking for might already be in your possession.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'The Ask You Have Been Avoiding',
      bodyText:
        'What resource do you need that requires asking someone for it? Name the ask. Name why you have been avoiding it. Then consider: what is the cost of not asking?',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'Scarcity or Reality?',
      bodyText:
        'Is the resource genuinely scarce, or does it feel scarce? What is the difference between the actual constraint and the story about the constraint? Write what you find.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'Who Has What You Need?',
      bodyText:
        'Who in your community has the resource, skill, or access you need? You do not need to know them well. You need to know they have it. Name them. Consider what you could offer in return.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'The Ecosystem of Support',
      bodyText:
        'What would it look like if gathering resources was a practice of reciprocity, not extraction? Who do you resource? Who resources you? Draw the map. Find where it is thin.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'Make the Ask',
      bodyText:
        'Make the resource ask you have been sitting with. Send the message, schedule the call, submit the application. Log what you asked for and to whom. The ask is the card being played.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
    {
      title: 'Share What You Found',
      bodyText:
        'What resource did you gather that someone else in your community also needs? Share it — a link, an introduction, an offer. Create a BAR from the share. Pass it along.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'GATHERING_RESOURCES',
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

/**
 * Domain Starter Deck — Skillful Organizing
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-13)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'domain:skillful_organizing',
  label: 'Skillful Organizing',
  category: 'domain',
  cardSeed: [
    {
      title: 'Who Is Already Moving?',
      bodyText:
        'Before you organize anyone, see who is already moving. Who in this situation has energy, momentum, or concern? You are not creating motion — you are coordinating what already wants to move.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'Name the Shared Stake',
      bodyText:
        'What does everyone involved care about — not what you want them to care about, what they actually care about? Find the common ground beneath the different positions. Name it specifically.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'The Coordination Failure',
      bodyText:
        'Where is the effort going sideways — not because people are bad but because the coordination is broken? Name the specific place where good people with good intentions are working against each other.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'The Decision That Was Never Made',
      bodyText:
        'What decision has been avoided, delayed, or assumed without being made explicit? Name it. Unresolved decisions create drag on every action that follows. Bring it into the open.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'Who Needs to Be in the Room?',
      bodyText:
        'What decision or action is being held up because the right people are not in conversation? Name who is missing. Consider what it would take to get them present — not just informed, present.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'The Structure That Liberates',
      bodyText:
        'What structure — a meeting rhythm, a clear role, a shared document, a decision protocol — would free people to move instead of waiting? Design it. The best structures are invisible when they work.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'Convene the People',
      bodyText:
        'Organize the conversation, meeting, or coordination moment that needs to happen. Send the invite, make the call, hold the space. Log who came, what was decided, what moved. The organizing is the card.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
    {
      title: 'Close the Loop',
      bodyText:
        'What coordination effort is dangling — something that happened but no one knows happened? Close the loop. Send the update, record the decision, confirm the next step. Log that you did it.',
      faceKey: null,
      archetypeKey: null,
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'community' },
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

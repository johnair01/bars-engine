/**
 * Archetype Starter Deck — The Danger Walker (Water trigram)
 * Agency pattern: risk navigation, adaptation, depth exploration
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-23)
 */

import { registerTemplate } from '@/lib/deck-templates'
import type { DeckTemplate } from '@/lib/deck-templates'

const deck: DeckTemplate = {
  key: 'archetype:danger-walker',
  label: 'The Danger Walker',
  category: 'archetype',
  cardSeed: [
    {
      title: 'What Is the Actual Risk?',
      bodyText:
        'You can feel when something is risky. But what is the specific risk — named precisely, not inflated, not minimized? Name it clearly. The Danger Walker does not avoid risk; they see it accurately.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'charge_generate', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Does the Depth Say?',
      bodyText:
        'You have access to layers of this situation that others do not. What do you see when you go below the surface? What is the current underneath? Capture what the depth is showing you.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'wake_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 1, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Risk You Are Avoiding',
      bodyText:
        'The Danger Walker\'s shadow is sometimes avoiding the specific risk that matters most. Which risk are you dancing around? What are you navigating that you should be walking directly toward?',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Did the Last Crossing Cost?',
      bodyText:
        'Risk navigation leaves marks. What did you carry through the last dangerous passage that you are still carrying? Name what needs to be set down before you enter the next one.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'clean_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'The Controlled Risk',
      bodyText:
        'What small, contained risk could you take right now that would reveal information you need? Not the full leap — the scout move. Design a risk with a limited downside. Take it. See what it shows you.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 3, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'What Adapts Here?',
      bodyText:
        'The situation has changed. What does your approach need to release in order to fit the new terrain? Adaptation is not surrender — it is precision. What needs to shift in how you are moving?',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'grow_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 2, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Walk the Edge',
      bodyText:
        'Take the risk you have been holding. Not recklessly — with full attention, with awareness of the terrain. Log what happened when you took the step. The Danger Walker\'s power is in the crossing, not the planning.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'show_up',
      playCost: 2,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'self' },
      allyshipDomain: null,
      faceMoveType: null,
    },
    {
      title: 'Bring Someone Through',
      bodyText:
        'You have navigated a passage that someone else is afraid of. Guide someone through it — not by removing the risk, but by walking alongside them. Log the crossing you facilitated.',
      faceKey: null,
      archetypeKey: 'danger-walker',
      nationKey: null,
      moveType: 'show_up',
      playCost: 1,
      playEffect: { type: 'bar_create', magnitude: 4, target: 'community' },
      allyshipDomain: null,
      faceMoveType: null,
    },
  ],
}

registerTemplate(deck)
export default deck

/**
 * Canonical BAR deck prompt patterns per suit (domain).
 * 4 suits × 13 ranks = 52 cards.
 * Spec: BAR System v1
 */

import type { AllyshipDomainKey } from '@/lib/allyship-domains'

const SUITS: AllyshipDomainKey[] = [
  'GATHERING_RESOURCES',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
  'SKILLFUL_ORGANIZING',
]

const PROMPTS_BY_SUIT: Record<AllyshipDomainKey, { title: string; text: string }[]> = {
  GATHERING_RESOURCES: [
    { title: 'Shuffle the Deck', text: 'Reshuffle your discard pile into your deck. Draw anew.' },
    { title: 'Identify One Resource Need', text: 'What does the campaign need most right now? Name one concrete resource.' },
    { title: 'Map Your Donors', text: 'Who might contribute? List three people or groups who could support.' },
    { title: 'Request a Tool', text: 'What tool or space would unblock you? Ask for it.' },
    { title: 'Find a Partner', text: 'Identify one potential partner. Reach out.' },
    { title: 'Share the Need', text: 'Tell one person what the campaign needs. Be specific.' },
    { title: 'Offer Your Resource', text: 'What can you contribute? Time, skill, connection, or funds?' },
    { title: 'Build a Support List', text: 'List five people who might support. Rank by likelihood.' },
    { title: 'Create a Resource Ask', text: 'Draft one clear ask. Who, what, when, why.' },
    { title: 'Follow Up on a Pledge', text: 'Reach out to someone who said they would help.' },
    { title: 'Thank a Contributor', text: 'Acknowledge one person who has given. Be specific.' },
    { title: 'Scale the Ask', text: 'How could this need be met at 2x? 10x?' },
    { title: 'Sustainable Funding', text: 'What would make this resource flow sustainable?' },
  ],
  RAISE_AWARENESS: [
    { title: 'Shuffle the Deck', text: 'Reshuffle your discard pile into your deck. Draw anew.' },
    { title: 'Share the Story', text: 'Tell the story behind your work. One paragraph.' },
    { title: 'Invite One Person', text: 'Who needs to know? Invite them in.' },
    { title: 'Create a Testimony', text: 'Capture one person\'s experience. Quote them.' },
    { title: 'Post One Update', text: 'Share one campaign update. Where and to whom?' },
    { title: 'Educate Your Audience', text: 'What does your audience need to learn? Teach one thing.' },
    { title: 'Amplify a Voice', text: 'Share someone else\'s story. Credit them.' },
    { title: 'Build the Narrative', text: 'What is the campaign narrative? Write one sentence.' },
    { title: 'Reach a New Cohort', text: 'Who hasn\'t heard? Name one group.' },
    { title: 'Create Invitation Copy', text: 'Draft one invitation. Who, what, why, when.' },
    { title: 'Respond to a Question', text: 'Answer one question about the campaign. Publicly.' },
    { title: 'Tell the Origin', text: 'Share how this started. The why.' },
    { title: 'Embed in Culture', text: 'How does this become part of how people talk?' },
  ],
  DIRECT_ACTION: [
    { title: 'Shuffle the Deck', text: 'Reshuffle your discard pile into your deck. Draw anew.' },
    { title: 'Do One Task', text: 'Pick one task. Complete it today.' },
    { title: 'Host a Micro-Event', text: 'Plan one small gathering. When, where, who.' },
    { title: 'Reach Out to One', text: 'Contact one person. What do you need from them?' },
    { title: 'Run an Experiment', text: 'Try one thing. Learn from it.' },
    { title: 'Intervene Now', text: 'What needs doing right now? Do it.' },
    { title: 'Coordinate Action', text: 'Get two people aligned. What\'s the next step?' },
    { title: 'Complete a Pending', text: 'Finish one thing you started.' },
    { title: 'Show Up Somewhere', text: 'Be present. Where and when?' },
    { title: 'Take the First Step', text: 'What\'s blocking you? Take one step past it.' },
    { title: 'Celebrate a Win', text: 'Acknowledge one completion. How?' },
    { title: 'Scale the Action', text: 'How could this action be 2x? 10x?' },
    { title: "You're a Player", text: 'What does it mean that you\'re in this? Own it.' },
  ],
  SKILLFUL_ORGANIZING: [
    { title: 'Shuffle the Deck', text: 'Reshuffle your discard pile into your deck. Draw anew.' },
    { title: 'Map the Process', text: 'Draw one process. What are the steps?' },
    { title: 'Assign a Role', text: 'Who does what? Clarify one role.' },
    { title: 'Design a System', text: 'What system would help? Sketch it.' },
    { title: 'Improve Communication', text: 'Where does communication break down? Fix one gap.' },
    { title: 'Plan the Next Phase', text: 'What\'s the next 2 weeks? Write it down.' },
    { title: 'Governance Check', text: 'Who decides what? Clarify one decision.' },
    { title: 'Staff for Capacity', text: 'What capacity is missing? Name it.' },
    { title: 'Document One Thing', text: 'What needs to be written down? Do it.' },
    { title: 'Align Two People', text: 'Get two people on the same page. How?' },
    { title: 'Iterate a Process', text: 'Improve one existing process. What changes?' },
    { title: 'Scale the System', text: 'How does this work at 2x? 10x?' },
    { title: 'Sustainable Practices', text: 'What would make this sustainable?' },
  ],
}

export function getCanonicalPrompts(): Array<{
  suit: AllyshipDomainKey
  rank: number
  promptTitle: string
  promptText: string
  shufflePower: boolean
}> {
  const result: Array<{
    suit: AllyshipDomainKey
    rank: number
    promptTitle: string
    promptText: string
    shufflePower: boolean
  }> = []
  for (const suit of SUITS) {
    const prompts = PROMPTS_BY_SUIT[suit]
    for (let rank = 1; rank <= 13; rank++) {
      const p = prompts[rank - 1]
      result.push({
        suit,
        rank,
        promptTitle: p.title,
        promptText: p.text,
        shufflePower: rank === 1, // First card of each suit has shuffle power
      })
    }
  }
  return result
}

/** 52 canonical + 12 extension cards (ranks 14–16 × 4 suits) for FRIENDSHIP_64 decks. */
export function getFriendship64Prompts(): Array<{
  suit: AllyshipDomainKey
  rank: number
  promptTitle: string
  promptText: string
  shufflePower: boolean
}> {
  const base = getCanonicalPrompts()
  const extra: typeof base = []
  for (const suit of SUITS) {
    for (let r = 14; r <= 16; r++) {
      extra.push({
        suit,
        rank: r,
        promptTitle: 'Go deeper',
        promptText: 'Extend this thread: what wants to emerge next in this domain?',
        shufflePower: false,
      })
    }
  }
  return [...base, ...extra]
}

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { OpenUpActionKey } from './events'

export const OPEN_UP_WEATHER = ['tight', 'hot', 'heavy', 'foggy', 'bright', 'numb', 'not sure / skip'] as const

export const OPEN_UP_EMOTIONS = [
  { key: 'triumph', label: 'triumph', hint: 'it landed for me — I want to raise the flag', kind: 'satisfied' },
  { key: 'dread', label: 'dread', hint: 'bracing for how it lands', kind: 'dissatisfied' },
  { key: 'poignance', label: 'poignance', hint: 'tender — this touches something real', kind: 'satisfied' },
  { key: 'boiling', label: 'boiling', hint: 'resenting that this falls on me', kind: 'dissatisfied' },
  { key: 'grounded', label: 'grounded', hint: 'a wide, steady yes', kind: 'satisfied' },
  { key: 'numb', label: 'numb', hint: 'flat — going through the motions', kind: 'dissatisfied' },
  { key: 'fierce_clarity', label: 'fierce clarity', hint: 'focused fire — someone needs this', kind: 'satisfied' },
  { key: 'heaviness', label: 'heaviness', hint: 'sinking — it feels like too much', kind: 'dissatisfied' },
  { key: 'nervous_excitement', label: 'nervous excitement', hint: 'risky — and I feel awake in it', kind: 'satisfied' },
  { key: 'forced_cheer', label: 'forced cheer', hint: 'performing more excitement than I feel', kind: 'dissatisfied' },
] as const

export const OPEN_UP_BELIEFS = [
  { key: 'enough', voice: '“Who am I to recommend a book on allyship?”', belief: 'I’m not good enough', question: 'What’s the one true sentence you’d say about this book?', reframe: 'Honesty is the ask, not credentials. One true sentence is a complete recommendation.' },
  { key: 'worthy', voice: '“Why would anyone act on my recommendation?”', belief: 'I’m not worthy', question: 'Who is worthy of this book? Can you put it in front of them?', reframe: 'Worthiness was never yours to prove — it is theirs to receive.' },
  { key: 'ready', voice: '“I should finish it — or reread it — before I share it.”', belief: 'I’m not ready', question: 'What has the book already given you? Share that.', reframe: 'Readiness was never the ask. What already landed is already shareable.' },
  { key: 'belong', voice: '“This conversation isn’t mine to start.”', belief: 'I don’t belong', question: 'Who is one person you already belong with? Start there.', reframe: 'You do not need standing with a community to hand a book to a friend.' },
  { key: 'insignificant', voice: '“My share won’t matter to anyone.”', belief: 'I’m insignificant', question: 'One hand-off is how books travel. Who is your one?', reframe: 'Books move node to node. Significance is downstream of the hand-off.' },
  { key: 'capable', voice: '“I’ll explain it badly and put them off.”', belief: 'I’m not capable', question: 'The book explains itself. Can you just hand it over?', reframe: 'You do the handing; the book does the explaining.' },
] as const

export type OpenUpPractice = MoveCard

/** The real Open Up suit: four domains × six operations. */
export const OPEN_UP_PRACTICES: OpenUpPractice[] = assembleDeck('open-up-check').cards.filter(
  (card): card is MoveCard => card.kind === 'move' && card.move === 'open_up',
)

export const OPEN_UP_CARD_IDS = new Set(OPEN_UP_PRACTICES.map((card) => card.id))

export const BOOK_ACTIONS: Array<{ key: OpenUpActionKey; label: string; detail: string }> = [
  { key: 'send_personal_note', label: 'Send one personal note', detail: 'One person. No performance required.' },
  { key: 'share_publicly', label: 'Make a public share', detail: 'Use the draft, then make it sound like you.' },
  { key: 'come_back', label: 'Come back to this', detail: 'A real pause is still a choice.' },
  { key: 'not_my_ask', label: 'This is not my ask', detail: 'Do not turn someone else’s request into a test of your goodness.' },
]

export const GENERIC_ACTIONS: Array<{ key: OpenUpActionKey; label: string; detail: string }> = [
  { key: 'take_personal_step', label: 'Take one small step', detail: 'Choose a step your actual capacity can support.' },
  { key: 'share_publicly', label: 'Share the practice', detail: 'Invite someone into the check without exporting your private answers.' },
  { key: 'come_back', label: 'Come back to this', detail: 'A real pause is still a choice.' },
  { key: 'not_my_ask', label: 'This is not my ask', detail: 'You are allowed to put a game down.' },
]

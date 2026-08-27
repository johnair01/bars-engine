/**
 * MTGOA Week 2 — Skillful Organizing, Days 6–10 (pure).
 *
 * Round 1's five days were each authored separately, so each got its own
 * component. Week 2 is uniform by design — the spec gives every day the same
 * shape: a native practice, private prompts, a three-card hand from that move's
 * six Skillful Organizing cards, and a receipt. So the days are data here and
 * one component renders them. That is also what makes rounds 3–6 tractable.
 *
 * Day 6 is the exception. It runs the Wake Up unpacking in its own component
 * (`DaySixWakeUpCheck`), so the page short-circuits before `WeekTwoPractice`
 * and only Day 6's `title` still reaches a reader, through the course index and
 * its social card. The rest of Day 6 below is kept in the authored voice of the
 * shipped day so the record matches what Day 6 actually asks.
 *
 * Authority: MTGOA_WEEK_2_SKILLFUL_ORGANIZING_DAYS_6_TO_10_DRAFT_2026-08-21.md
 * and MTGOA_COURSE_WEEK_2_AND_ORGANIZATION_SURFACES_SPEC_2026-08-21.md.
 *
 * Privacy invariant: nothing composed here leaves the browser. Day 10's artifact
 * is assembled from the reader's own text for them to copy, and is never sent.
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { MtgoaCourseMove } from './course-days'

export type RoundTwoPrompt = { key: string; label: string; placeholder: string }

export type RoundTwoDay = {
  day: number
  move: MtgoaCourseMove
  slug: string
  /** The move's Week 2 title, e.g. "Let the structure be felt". */
  title: string
  coreQuestion: string
  /** The named practice this day runs. Week 2's days each have one. */
  practice: { name: string; body: string }
  entry: string
  /** Private prompts, all optional, all client-only. */
  prompts: RoundTwoPrompt[]
  /** Per-card translation: what this Game Master asks of *this* day. */
  cardPrompts: Record<string, string>
  drawTitle: string
  drawBody: string
  receipt: { eyebrow: string; title: string; body: string; stem?: string }
  /** What this day must not turn into. Kept as copy, not just a note to us. */
  doNot: string
}

/** Week 2's domain. Every day draws from its move's six `*-SO-*` cards. */
export const ROUND_TWO_DOMAIN = 'SKILLFUL_ORGANIZING' as const

export const ROUND_TWO_PROMISE =
  'Allyship should not have to live in the leftover corners of your life. Week 2 is about the structures that make the next useful handoff easier.'

/**
 * The two lanes, shown without pretending they are the same commitment. A reader
 * who only ever wants to make one personal recommendation has already completed
 * a valid Week 1 game; Week 2 is not a graduation requirement.
 */
export type RoundTwoLane = 'personal' | 'local_team'

export const ROUND_TWO_LANES: ReadonlyArray<{ key: RoundTwoLane; label: string; body: string; artifact: string }> = [
  {
    key: 'personal',
    label: 'My allyship life',
    body: 'A repeatable practice that keeps allyship out of the leftover corners of your week.',
    artifact: 'Allyship Rhythm',
  },
  {
    key: 'local_team',
    label: 'A local book team',
    body: 'A voluntary, locally rooted group helping the book reach people who may benefit. Working alone is a real version of this — "Owner: me" is a valid answer.',
    artifact: 'Book Campaign Handoff',
  },
]

export const ROUND_TWO_DAYS: readonly RoundTwoDay[] = [
  {
    day: 6,
    move: 'wake_up',
    slug: 'wake-up',
    title: 'The Six Questions',
    coreQuestion: 'What experience do you want to create through the Book Launch?',
    practice: {
      name: 'The Wake Up Unpacking',
      body: 'Six questions that turn a general willingness into a sentence specific enough to act on.',
    },
    entry:
      'Someone is asking you to help launch a book. Before you answer, name what you would want out of it — and what it would take to get there.',
    prompts: [
      { key: 'create', label: 'what I want to create', placeholder: 'Through the launch, or through my own allyship work, I want to create…' },
      { key: 'gets', label: 'what that gets me', placeholder: 'Having it would feel like…' },
      { key: 'now', label: 'what life is like right now', placeholder: 'Right now this is moving in the right direction, stuck, moving backward, or foggy…' },
      { key: 'living', label: 'how it feels to live there', placeholder: 'Living there feels…' },
      { key: 'reservation', label: 'the reservation underneath', placeholder: 'What stops me short of saying yes to it is…' },
      { key: 'next', label: 'what it needs next', placeholder: 'What this needs next is a Wake Up, Open Up, Clean Up, Grow Up, or Show Up move…' },
    ],
    cardPrompts: {
      'WAKE-SO-SHAMAN': 'See what is actually shaping your answer, under the reasons you would give for it.',
      'WAKE-SO-CHALLENGER': 'Name the reservation you have been working around instead of saying out loud.',
      'WAKE-SO-REGENT': 'Choose the part of this that most needs your attention first.',
      'WAKE-SO-ARCHITECT': 'Name the experience trying to emerge, before you plan how to reach it.',
      'WAKE-SO-DIPLOMAT': 'Notice who your yes would actually be for.',
      'WAKE-SO-SAGE': 'Connect this wanting to the pattern it repeats.',
    },
    drawTitle: 'Six ways to look at what you want.',
    drawBody:
      'Three of the six Wake Up cards for organizing. Each is a different way of looking at the answer you just gave.',
    receipt: {
      eyebrow: 'your Day 6 receipt',
      title: 'You know what you are reaching for.',
      body: 'One sentence holding what you want and the move it needs next. That is the whole job today.',
      stem: 'What I want to create is … and what it needs next is a … move.',
    },
    doNot: 'Day 6 stays with wanting. Taking a role and promising it to someone both wait for a later day.',
  },
  {
    day: 7,
    move: 'open_up',
    slug: 'open-up',
    title: 'Let the structure be felt',
    coreQuestion: 'What is it like to be inside that structure — or its absence?',
    practice: {
      name: 'The Load Check',
      body: 'Every structure has a lived cost. Notice yours before you fix it.',
    },
    entry:
      'A campaign can look small on paper and still ask one person to carry it alone. Before you organize it, let yourself notice what this way of working costs.',
    prompts: [
      { key: 'body', label: 'in the body', placeholder: 'When I think about maintaining this, what happens in my body is…' },
      { key: 'avoiding', label: 'what I am avoiding feeling', placeholder: 'About the work, the role, or the ask, I am avoiding…' },
      { key: 'unused', label: 'capacity already present', placeholder: 'Willingness or capacity that is here and unused…' },
      { key: 'care', label: 'what would make it care for people', placeholder: 'This structure would tend people as well as produce, if…' },
    ],
    cardPrompts: {
      'OPEN-SO-SHAMAN': 'Name the human cost before proposing a process.',
      'OPEN-SO-CHALLENGER': 'Contact the organizing responsibility you would rather not hold.',
      'OPEN-SO-REGENT': 'Notice control, abdication, and the possibility of sharing one piece.',
      'OPEN-SO-ARCHITECT': 'Notice unused willingness, while people stay people.',
      'OPEN-SO-DIPLOMAT': 'Ask how the system can tend relationship alongside tasks.',
      'OPEN-SO-SAGE': 'Watch how the work actually wants to flow.',
    },
    drawTitle: 'Six ways to feel a structure.',
    drawBody:
      'Three of the six Open Up cards for organizing. Each names something a system does to the people inside it.',
    receipt: {
      eyebrow: 'your Day 7 receipt',
      title: 'You let it be felt.',
      body: 'A structure you can feel is one you can design honestly. Nothing here asks you to fix it today.',
      stem: 'The part of this structure I need to stay present with is …',
    },
    doNot:
      'No guilt-driven recruitment ask, and no using this to prove you are the only competent person in the room.',
  },
  {
    day: 8,
    move: 'clean_up',
    slug: 'clean-up',
    title: 'Clear the story designing the system',
    coreQuestion: 'What story or strain is being designed into this campaign?',
    practice: {
      name: 'The Bottleneck 3-2-1',
      body: 'Day 3 introduced the method. Here the charged part is the one that believes the work cannot move without it.',
    },
    entry:
      'A campaign inherits the story you refuse to examine. “Only I can do this.” “Nobody will care.” “It is faster if I carry it.” Let the part running that story speak in its own voice before you build a system around it.',
    prompts: [
      { key: 'story', label: 'the story that is live', placeholder: 'The story or strain running underneath this is…' },
      { key: 'they', label: '3 · they — face it', placeholder: 'Describe that part in the third person. They…' },
      { key: 'you', label: '2 · you — talk to it', placeholder: 'Ask it directly. What do you want? What are you protecting? You…' },
      { key: 'i', label: '1 · i — let it speak', placeholder: 'Let it speak as you. The smallest true thing it needs, knows, or can hand off. I…' },
      { key: 'principle', label: 'the design principle', placeholder: 'So this campaign needs a structure that…' },
    ],
    cardPrompts: {
      'CLEAN-SO-SHAMAN': 'Name the channel that is running before you redesign anything.',
      'CLEAN-SO-CHALLENGER': 'Test the bottleneck story by handing off one real thing.',
      'CLEAN-SO-REGENT': 'Name the missing capability, in place of another rule.',
      'CLEAN-SO-ARCHITECT': 'Clear the charge first, then design.',
      'CLEAN-SO-DIPLOMAT': 'Give real ownership, beyond handing out tasks.',
      'CLEAN-SO-SAGE': 'Keep one lesson that changes the next design.',
    },
    drawTitle: 'Six ways to clear a system.',
    drawBody:
      'Three of the six Clean Up cards for organizing. The card supplies the lens you carry into the 3-2-1.',
    receipt: {
      eyebrow: 'your Day 8 receipt',
      title: 'You have a design principle.',
      body: 'One principle drawn from a charge you actually worked. It describes the system, and leaves you alone.',
      stem: 'This campaign needs a structure that … because the current pattern keeps …',
    },
    doNot:
      'The 3-2-1 asks what the part knows. Where that lands is yours to decide.',
  },
  {
    day: 9,
    move: 'grow_up',
    slug: 'grow-up',
    title: 'Practice the capacity to organize',
    coreQuestion: 'What organizing capacity deserves a deliberate rep?',
    practice: {
      name: 'The Role Rep',
      body: 'A small practice in coordinating, documenting, delegating, facilitating, or asking for clear ownership.',
    },
    entry:
      'A better system asks for one practised capacity. Choose the one you can rehearse before it carries the whole campaign.',
    prompts: [
      { key: 'capacity', label: 'the capacity', placeholder: 'What would make yesterday’s design principle possible is…' },
      { key: 'rep', label: 'the rep, one notch bigger', placeholder: 'One notch bigger than today, I will practise…' },
      { key: 'affected', label: 'who this touches', placeholder: 'This practice affects… and the support or boundary that keeps it clean is…' },
      { key: 'return', label: 'what will tell you it taught you something', placeholder: 'I will know this rep taught me something when…' },
    ],
    cardPrompts: {
      'GROW-SO-SHAMAN': 'Practise the organizing capacity already emerging in you.',
      'GROW-SO-CHALLENGER': 'Hand off one thing you have to stop doing yourself.',
      'GROW-SO-REGENT': 'Repeat one real delegation, documentation, or facilitation rep.',
      'GROW-SO-ARCHITECT': 'Train the highest-leverage capability: clarity, trust, or follow-through.',
      'GROW-SO-DIPLOMAT': 'Invest in another person’s capacity, beyond using it.',
      'GROW-SO-SAGE': 'Integrate the kind of steward you are becoming.',
    },
    drawTitle: 'Six ways a capacity grows.',
    drawBody:
      'Three of the six Grow Up cards for organizing. They are verbs — ways of growing something.',
    receipt: {
      eyebrow: 'your Day 9 receipt',
      title: 'You have a capacity practice.',
      body: 'One rep, with a support and a boundary, and something that will tell you what it taught you.',
    },
    doNot:
      'A rep is small enough to finish. A clean “not today” stays a capable move.',
  },
  {
    day: 10,
    move: 'show_up',
    slug: 'show-up',
    title: 'Build one structure someone can use',
    coreQuestion: 'What small structure can another person — or future me — actually use?',
    practice: {
      name: 'The Campaign Handoff',
      body: 'Create one usable organizing artifact and put it somewhere real.',
    },
    entry:
      'The standard for today: it has to make a next useful action easier for a real person who will actually open it.',
    prompts: [],
    cardPrompts: {
      'SHOW-SO-SHAMAN': 'Choose the one process this handoff serves first.',
      'SHOW-SO-CHALLENGER': 'Make one structural change, in place of another planning document.',
      'SHOW-SO-REGENT': 'Give it an owner and a review rhythm.',
      'SHOW-SO-ARCHITECT': 'Add one durable lever: a documented process, a clear role, or a handoff.',
      'SHOW-SO-DIPLOMAT': 'Give real ownership, to someone who consented to hold it.',
      'SHOW-SO-SAGE': 'Secure the capacity or documentation that survives one person’s absence.',
    },
    drawTitle: 'Six ways to ship a structure.',
    drawBody:
      'Three of the six Show Up cards for organizing. Each is a different way of making the thing real.',
    receipt: {
      eyebrow: 'your Day 10 receipt',
      title: 'You built something usable.',
      body: 'One artifact a real person can act on. Week 2 closes here, and the loop is meant to be run again.',
    },
    doNot:
      'A live structure is one someone has in hand. Any recruitment names a specific role, a time shape, decision rights, and permission to decline.',
  },
] as const

/** The Allyship Rhythm — Day 10's personal-lane artifact. */
export const ALLYSHIP_RHYTHM_FIELDS: RoundTwoPrompt[] = [
  { key: 'practice', label: 'the practice', placeholder: 'The kind of useful handoff I want to make repeatable is…' },
  { key: 'place', label: 'the place', placeholder: 'It fits in my actual life at…' },
  { key: 'support', label: 'the support', placeholder: 'What makes it easier to begin is…' },
  { key: 'boundary', label: 'the boundary', placeholder: 'What keeps it from eating the rest of my life is…' },
  { key: 'return', label: 'the return', placeholder: 'I will notice whether it is still useful by…' },
]

/** The Book Campaign Handoff — Day 10's local-team artifact. */
export const CAMPAIGN_HANDOFF_FIELDS: RoundTwoPrompt[] = [
  { key: 'purpose', label: 'purpose', placeholder: 'This is trying to make more possible…' },
  { key: 'audience', label: 'audience', placeholder: 'This particular handoff is for…' },
  { key: 'action', label: 'one next action', placeholder: 'The smallest useful thing to do is…' },
  { key: 'owner', label: 'owner', placeholder: 'Who owns that action (“me” is a real answer)…' },
  { key: 'terms', label: 'terms', placeholder: 'Optional… needs permission… explicitly not being asked…' },
  { key: 'review', label: 'return', placeholder: 'This gets reviewed when, and by…' },
]

/**
 * The three receipt states Week 2 shares with Day 5, kept distinct for the same
 * reason: a built thing that nobody can use yet is not a finished one.
 */
export type RoundTwoState = 'prepared' | 'made' | 'returning'

export const ROUND_TWO_STATES: ReadonlyArray<{ key: RoundTwoState; label: string; body: string }> = [
  { key: 'made', label: 'It is in use.', body: 'Someone — possibly future you — can act on it now.' },
  { key: 'prepared', label: 'It is built, and not in anyone’s hands yet.', body: 'A real thing to have made, and still waiting on a next step.' },
  { key: 'returning', label: 'I am coming back to this.', body: 'Something earlier in the loop wants attention first.' },
]

/** Day 10's Come Back question, and where each answer sends a reader. */
export const ROUND_TWO_COME_BACK = {
  question: 'Did this structure make the next useful handoff easier, harder, or clearer?',
  answers: [
    { key: 'easier', label: 'Easier or clearer.', body: 'Carry the learning into the next loop.', returnToDay: null },
    { key: 'harder', label: 'Harder, or nobody can use it.', body: 'There is an unaddressed move behind it — Days 6 to 9 are where it lives.', returnToDay: 6 },
    { key: 'not_structure', label: 'This should not become a structure.', body: 'Put it down cleanly. A single personal handoff is a complete game.', returnToDay: 1 },
  ],
} as const

const DECK = assembleDeck('mtgoa-week-two')

/** The six Skillful Organizing cards for a move. Never a subset, never a fork. */
export function roundTwoCardsFor(move: MtgoaCourseMove): MoveCard[] {
  return DECK.cards.filter(
    (card): card is MoveCard =>
      card.kind === 'move' && card.move === move && card.domain === ROUND_TWO_DOMAIN,
  )
}

export function roundTwoDay(day: number): RoundTwoDay | null {
  return ROUND_TWO_DAYS.find((d) => d.day === day) ?? null
}

export function roundTwoDayByMove(move: MtgoaCourseMove): RoundTwoDay | null {
  return ROUND_TWO_DAYS.find((d) => d.move === move) ?? null
}

/** Chips on the receipt. Only what the reader actually did. */
export function roundTwoEvidence(input: {
  day: number
  answered: number
  carried: boolean
  state: RoundTwoState | null
}): string[] {
  const evidence = [`showed up to Day ${input.day}`]
  if (input.answered > 0) evidence.push(`worked ${input.answered} prompt${input.answered > 1 ? 's' : ''}`)
  if (input.carried) evidence.push('carried a card')
  if (input.state === 'made') evidence.push('put it in use')
  if (input.state === 'prepared') evidence.push('built it')
  if (input.state === 'returning') evidence.push('found the earlier move')
  return evidence
}

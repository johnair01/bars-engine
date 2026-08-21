/**
 * MTGOA Clean Up Check — copy and the draft composer (pure).
 *
 * Everything the flow says lives here so `CleanUpCheck.tsx` stays layout + state.
 * Reference implementation: `.specify/specs/mtgoa-clean-up-check/design_handoff/
 * MTGOA Clean Up Check.dc.html` — when this file and the reference disagree, the
 * reference wins.
 *
 * Privacy invariant: the composer only ever emits canonical strings from this
 * module plus deck copy. Free-typed text (the visitor's 3-2-1 writing, the name
 * they give the part, the thread) is reduced to a boolean or a turn count before
 * it reaches `composeCleanUpDraft`, and is never sent anywhere.
 */

import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'

/** Which door the visitor came through. Decides copy, the card pool, and the lines. */
export type CleanUpRoute = 'book_promo' | 'own_charge'

/** Where the energy goes once the charge is worked. */
export type CleanUpMoveKey = 'act' | 'later' | 'not_mine'

/** The body reading — one word, no interpretation. */
export const CLEAN_UP_BODY_READINGS = ['tight', 'hot', 'heavy', 'foggy', 'buzzing', 'numb', 'not sure / skip'] as const
export type CleanUpBodyReading = (typeof CLEAN_UP_BODY_READINGS)[number]

/** The reading that carries no signal — drops its clause from the draft. */
export const CLEAN_UP_BODY_SKIP: CleanUpBodyReading = 'not sure / skip'

/**
 * The five emotional-alchemy channels, in the visitor's language rather than the
 * engine's. `clause` is the sentence the composer uses — never the bare label.
 */
export const CLEAN_UP_CHANNELS = [
  { key: 'fire', label: 'anger', hint: 'heat, resentment, the urge to push back', clause: 'The channel running was anger' },
  { key: 'water', label: 'fear', hint: 'bracing, scanning, waiting for impact', clause: 'The channel running was fear' },
  { key: 'metal', label: 'sadness', hint: 'grief, loss, something worth mourning', clause: 'The channel running was sadness' },
  { key: 'earth', label: 'numbness', hint: 'flat, far away, going through motions', clause: 'The channel running was numbness' },
  { key: 'wood', label: 'reach', hint: 'wanting more than the situation allows', clause: 'The channel running was reach — wanting more than the situation allowed' },
] as const
export type CleanUpChannel = (typeof CLEAN_UP_CHANNELS)[number]

/**
 * The line running underneath. The visible option is the sentence in the
 * visitor's own head; the canonical belief is revealed only on the selected row,
 * so the screen never opens with six diagnoses.
 */
export interface CleanUpLine {
  key: string
  voice: string
  belief: string
  overcome: string
  reframe: string
}

/** Book route — the six lines that stop someone from promoting a book they liked. */
export const CLEAN_UP_BOOK_LINES: readonly CleanUpLine[] = [
  {
    key: 'worthy',
    voice: '“Who am I to promote a book on allyship?”',
    belief: 'I’m not worthy',
    overcome: 'What’s the one true sentence you’d say about this book?',
    reframe: 'Honesty is the ask, not credentials. One true sentence is a complete recommendation.',
  },
  {
    key: 'capable',
    voice: '“I’ll get the message wrong and embarrass him.”',
    belief: 'I’m not capable',
    overcome: 'What can you say that is only about what the book gave you?',
    reframe: 'You do the handing; the book does the explaining. Your own experience can’t be gotten wrong.',
  },
  {
    key: 'good',
    voice: '“If it flops on my page, that’s on me.”',
    belief: 'I’m not good enough',
    overcome: 'Who is one person who’d be glad you sent it, regardless of the numbers?',
    reframe: 'Reach is the platform’s business. The hand-off is yours, and one landing is a full result.',
  },
  {
    key: 'ready',
    voice: '“I should read all of it before I push it.”',
    belief: 'I’m not ready',
    overcome: 'What has the book already given you? Share that.',
    reframe: 'What already landed is already shareable.',
  },
  {
    key: 'belong',
    voice: '“It feels gross to sell to my own people.”',
    belief: 'I don’t belong',
    overcome: 'What’s the difference between selling to them and handing something to them?',
    reframe: 'You’re not extracting from your people. You’re putting a tool in front of the ones who’d use it.',
  },
  {
    key: 'insignificant',
    voice: '“My network doesn’t care about this.”',
    belief: 'I’m insignificant',
    overcome: 'One hand-off is how books travel. Who’s your one?',
    reframe: 'Books move node to node. Significance is downstream of the hand-off, not upstream of it.',
  },
]

/** Practice route — the six lines that show up around a live allyship charge. */
export const CLEAN_UP_LINES: readonly CleanUpLine[] = [
  {
    key: 'good',
    voice: '“If I were better at this, it wouldn’t be getting to me.”',
    belief: 'I’m not good enough',
    overcome: 'What would you tell someone else who felt this about the same thing?',
    reframe: 'Feeling it is what makes you useful in the room.',
  },
  {
    key: 'worthy',
    voice: '“Who am I to be upset when others have it harder?”',
    belief: 'I’m not worthy',
    overcome: 'Whose pain are you comparing yours to — and did they ask you to?',
    reframe: 'Ranking your charge against someone else’s doesn’t transfer any energy to them. Working it does.',
  },
  {
    key: 'ready',
    voice: '“I should be over this by now.”',
    belief: 'I’m not ready',
    overcome: 'What has this charge been protecting since the first time you felt it?',
    reframe: 'Charge doesn’t expire on schedule. It waits until it’s worked.',
  },
  {
    key: 'belong',
    voice: '“It’s not my place to be upset about this.”',
    belief: 'I don’t belong',
    overcome: 'What did you see that made your body respond before your head did?',
    reframe: 'You don’t need standing to have a reaction. You need somewhere to put it.',
  },
  {
    key: 'insignificant',
    voice: '“Nothing I do about this would change anything.”',
    belief: 'I’m insignificant',
    overcome: 'What is the smallest true move that is still in your hands?',
    reframe: 'A worked charge funds one move, and one move is how anything moves at all.',
  },
  {
    key: 'capable',
    voice: '“If I say something I’ll get it wrong and make it worse.”',
    belief: 'I’m not capable',
    overcome: 'What can you say that is only about what you saw and felt?',
    reframe: 'Precision beats fluency. You don’t have to be articulate to be honest.',
  },
]

/** The lines offered on a given route. */
export function cleanUpLinesFor(route: CleanUpRoute): readonly CleanUpLine[] {
  return route === 'book_promo' ? CLEAN_UP_BOOK_LINES : CLEAN_UP_LINES
}

export function findCleanUpLine(route: CleanUpRoute, key: string | null): CleanUpLine | null {
  if (!key) return null
  return cleanUpLinesFor(route).find((line) => line.key === key) ?? null
}

export function findCleanUpChannel(key: string | null): CleanUpChannel | null {
  if (!key) return null
  return CLEAN_UP_CHANNELS.find((channel) => channel.key === key) ?? null
}

/** Openers for the second pass — offered only while the thread is empty. */
export const CLEAN_UP_OPENERS = [
  'What do you want from me?',
  'If you got that, what would you have then?',
  'What is life like for you right now?',
  'What would have to be true for you to settle?',
  'What are you most afraid would happen?',
] as const

/** The three vantage points, shown on the orientation screen. */
export const CLEAN_UP_STEPS = [
  { num: '3', title: 'Face it', body: 'Describe the charge in the third person — as an it. Unedited, unfair, exactly as it shows up.' },
  { num: '2', title: 'Talk to it', body: 'Address it in the second person. Say the thing you would say if there were no cost, and ask what it wants.' },
  { num: '1', title: 'Be it', body: 'Speak as it, in the first person, until the energy it was holding reads as yours.' },
] as const

/** Receipt copy per move. No move is the correct one. */
export const CLEAN_UP_RECEIPTS: Record<CleanUpMoveKey, { title: string; body: string }> = {
  act: {
    title: 'The energy is yours to spend.',
    body: 'You worked the charge instead of obeying it. Take the move while the line is clear — copy the entry if you want the record.',
  },
  later: {
    title: 'Let it settle.',
    body: 'Nothing expires and nothing is tracked. If a nudge would help, put it where your days actually live:',
  },
  not_mine: {
    title: 'Heard. This one isn’t yours to clean.',
    body: 'No date required. No explanation owed. Noticing the charge and setting it down is still a complete pass.',
  },
}

/** The only place the mechanic is named. */
export const CLEAN_UP_EXPLAINER =
  'How the book reads this: Clean Up doesn’t add motivation. Four of the five moves — noticing, receiving, metabolizing, building capacity — raise your throughput on the fifth one, showing up. You just cleared one blockage in that line.'

// ─── Route-dependent copy ────────────────────────────────────────────────────

export function cleanUpChargeHeading(route: CleanUpRoute): string {
  return route === 'book_promo'
    ? 'Where does the resistance to sharing it live in the body?'
    : 'Where does the charge live in the body?'
}

export function cleanUpLineHeading(route: CleanUpRoute): string {
  return route === 'book_promo' ? 'Which sentence stops you from posting?' : 'Which sentence is in your head about this one?'
}

export function cleanUpDeckRibbon(route: CleanUpRoute): string {
  return route === 'book_promo'
    ? '◇ allyship deck · clean up · raise awareness · 6 cards ◇'
    : '◇ from the allyship deck · clean up suit · 24 cards ◇'
}

export function cleanUpDrawSub(route: CleanUpRoute): string {
  return route === 'book_promo'
    ? 'The six Clean Up cards from the Raise Awareness domain — the ones about telling the truth in public. The card gives you the angle you take into 3-2-1.'
    : 'The card doesn’t answer the charge. It gives you the angle you take into 3-2-1. Tap one to read it in full.'
}

export function cleanUpActLabel(route: CleanUpRoute): string {
  return route === 'book_promo' ? 'post it →' : 'spend it on the move →'
}

export function cleanUpDraftLabel(route: CleanUpRoute): string {
  return route === 'book_promo' ? 'your post — drafted from the whole clean-up' : 'your entry — drafted from the whole clean-up'
}

export function cleanUpDraftLabelShort(route: CleanUpRoute): string {
  return route === 'book_promo' ? 'your post' : 'your entry'
}

export function cleanUpCopyLabel(route: CleanUpRoute): string {
  return route === 'book_promo' ? 'copy the post' : 'copy the entry'
}

/** The receipt headline. The book route's "act" receipt gets its own copy. */
export function cleanUpReceipt(route: CleanUpRoute, move: CleanUpMoveKey): { title: string; body: string } {
  if (route === 'book_promo' && move === 'act') {
    return {
      title: 'The recommendation is yours to make.',
      body: 'You named the resistance instead of obeying it. Here’s the post, drafted from your clean-up — make it yours, then send it wherever your people actually are.',
    }
  }
  return CLEAN_UP_RECEIPTS[move]
}

// ─── The deck pool ───────────────────────────────────────────────────────────

/** The real Clean Up suit: four domains × six operations. */
export const CLEAN_UP_PRACTICES: MoveCard[] = assembleDeck('clean-up-check').cards.filter(
  (card): card is MoveCard => card.kind === 'move' && card.move === 'clean_up',
)

/**
 * The book route draws only from Raise Awareness — the six Clean Up cards about
 * telling the truth in public, which is what promoting the book actually is.
 */
export const CLEAN_UP_BOOK_PRACTICES: MoveCard[] = CLEAN_UP_PRACTICES.filter((card) => card.domain === 'RAISE_AWARENESS')

export function cleanUpPoolFor(route: CleanUpRoute): MoveCard[] {
  return route === 'book_promo' ? CLEAN_UP_BOOK_PRACTICES : CLEAN_UP_PRACTICES
}

export const CLEAN_UP_CARD_IDS = new Set(CLEAN_UP_PRACTICES.map((card) => card.id))

// ─── Take-it-with-you lines ──────────────────────────────────────────────────

/** The consolation copy on the body-reading step, for someone who bails early. */
export function cleanUpBodyTakeaway(bodyReading: string | null, checkUrl: string): string {
  if (!bodyReading || bodyReading === CLEAN_UP_BODY_SKIP) return ''
  return `Ran a clean-up before deciding anything. The charge showed up ${bodyReading} in my body. Now I can work it. ${checkUrl}`
}

/** The same, on the line step. */
export function cleanUpLineTakeaway(line: CleanUpLine | null, checkUrl: string): string {
  if (!line) return ''
  return `Caught the line running underneath: “${line.belief}.” Working it instead of obeying it. ${checkUrl}`
}

// ─── The composer ────────────────────────────────────────────────────────────

export interface CleanUpDraftInput {
  route: CleanUpRoute
  /** One of `CLEAN_UP_BODY_READINGS`, or null. */
  bodyReading: string | null
  channel: CleanUpChannel | null
  line: CleanUpLine | null
  /** The drawn card's canonical question, or null when the draw was skipped. */
  cardQuestion: string | null
  /** Did they write anything in pass 3? (Never the writing itself.) */
  facedIt: boolean
  /** Did they name the part? (Never the name itself.) */
  namedIt: boolean
  /** How many turns in the pass-2 thread. (Never the turns themselves.) */
  threadTurns: number
  /** Did they write anything in pass 1? */
  spokeAsIt: boolean
  /** Did they answer "what shifted?" */
  noticedShift: boolean
  /** Site origin, e.g. `https://masteringallyship.com`. */
  origin: string
}

/**
 * Assemble the draft as natural first-person prose — not a template with visible
 * slots. Any skipped step drops its clause and the paragraph still reads.
 */
export function composeCleanUpDraft(input: CleanUpDraftInput): string {
  const isBook = input.route === 'book_promo'
  const bits: string[] = [
    isBook
      ? 'I’ve been sitting on a book recommendation, and today I worked out why.'
      : 'I ran a clean-up today on something that was still live in me.',
  ]

  if (input.bodyReading && input.bodyReading !== CLEAN_UP_BODY_SKIP) {
    bits.push(`The charge showed up ${input.bodyReading} in my body.`)
  }
  if (input.channel) bits.push(`${input.channel.clause}.`)
  if (input.line) bits.push(`Underneath it was a familiar line: “${input.line.belief}.”`)
  if (input.cardQuestion) bits.push(`The card I drew asked me: ${input.cardQuestion}`)

  if (input.facedIt && input.namedIt) bits.push('I gave it a form and a name.')
  else if (input.facedIt) bits.push('I gave it a form.')

  if (input.threadTurns >= 2) {
    bits.push('Then I talked with it — back and forth, both voices — until it said something I didn’t already know.')
  }
  if (input.spokeAsIt) {
    bits.push(
      'Last, I spoke as it with no one else in the room, and what it said on its own was simpler than the story I’d been telling about it.',
    )
  }
  if (input.noticedShift) bits.push('Something shifted when I held it with awareness.')

  bits.push(
    isBook
      ? `So here it is: Mastering the Game of Allyship changed how I show up, and I want you to have it too. ${input.origin}`
      : `What was stuck as story is available as energy again. If you want to run it yourself, it’s here: ${cleanUpCheckUrl(input.origin)}`,
  )

  return bits.join(' ')
}

export function cleanUpCheckUrl(origin: string): string {
  return `${origin}/clean-up`
}

// ─── The evidence strip ──────────────────────────────────────────────────────

export interface CleanUpEvidenceInput {
  route: CleanUpRoute
  bodyReading: string | null
  channel: CleanUpChannel | null
  line: CleanUpLine | null
  cardTitle: string | null
  facedIt: boolean
  /** The visitor's own word for the part. Rendered locally; never transmitted. */
  partName: string
  threadTurns: number
  spokeAsIt: boolean
  move: CleanUpMoveKey | null
}

/**
 * What they actually did — only steps actually taken appear. No score, no
 * percentage, no streak, no personality result.
 */
export function cleanUpEvidence(input: CleanUpEvidenceInput): string[] {
  const isBook = input.route === 'book_promo'
  const chips: string[] = []

  if (isBook) chips.push('route · promoting the book')
  chips.push('showed up to the charge')

  if (input.bodyReading && input.bodyReading !== CLEAN_UP_BODY_SKIP) chips.push(`body reading · ${input.bodyReading}`)
  if (input.channel) chips.push(`channel · ${input.channel.label}`)
  if (input.line) chips.push('named the line')
  if (input.cardTitle) chips.push(`carried ${input.cardTitle}`)
  if (input.facedIt) chips.push('faced it')
  if (input.partName.trim()) chips.push(`named it · ${input.partName.trim()}`)
  if (input.threadTurns > 0) chips.push(`talked with it · ${input.threadTurns} turns`)
  if (input.spokeAsIt) chips.push('spoke as it')

  if (input.move === 'act') chips.push(isBook ? 'chose · post it' : 'chose · spend it on the move')
  if (input.move === 'later') chips.push('chose · let it settle')
  if (input.move === 'not_mine') chips.push('chose · a clean no')

  return chips
}

/**
 * The founder's gate walk: content and rules (no React, no database).
 *
 * Source of record: Six-faces-council fundraiser-2026-11-16 seed.md (v2) and drafts/posts.md. Every link and every
 * number here is his, copied from those files. The copy, the feeling-to-place mapping and the window targets are
 * PLACEHOLDERS for his look; the file marks them.
 */
import table from '@/lib/quest-grammar/move-table.json'

/* ───── The feelings: Emotional Alchemy's five satisfied states, read from the one move table (never invented) ───── */

export interface Feeling {
  id: string // the channel id: fear, sadness, joy, anger, neutrality
  name: string // the satisfied name: Wonder-Excitement, Poignance, Bliss, Triumph, Peace
  move: string // the table's transcend move that lands in it
}

export const FEELINGS: Feeling[] = table.channels.map((c) => ({
  id: c.id,
  name: c.satisfied_name,
  move: table.moves.find((m) => m.family === 'transcend' && m.from === c.id)?.name ?? c.satisfied_name,
}))

/** One line each, in plain words. PLACEHOLDER copy. */
export const FEELING_LINES: Record<string, string> = {
  fear: 'Something new opens and you want to step into it.',
  sadness: 'Something that mattered gets its meaning back.',
  joy: 'Plain delight, the kind that makes you grow.',
  anger: 'You break through something that has held you.',
  neutrality: 'Things settle and you can rest in them.',
}

/* ───── Links: only those in the drafts folder ───── */

export const LINKS = {
  patreon: 'https://www.patreon.com/wendell_britt',
  bookshop: 'https://bookshop.org/p/books/mastering-the-game-of-allyship/2d776ec66c3911aa',
  amazon: 'https://www.amazon.com/dp/B0HPX1ZG1Z',
  coachingFree: 'https://calendly.com/wendell-britt/pay-what-feels-right',
  coaching75: 'https://calendly.com/wendell-britt/coaching-75',
  coaching150: 'https://calendly.com/wendell-britt/coaching-150',
  coaching250: 'https://calendly.com/wendell-britt/coaching-250',
} as const

/** Handles only: the drafts give no payment deep links, so the walk shows these with a copy button. */
export const PAY = { venmo: '@wendell-britt', cashapp: '$WendellBritt' } as const

/* ───── The figure: choices that already exist in public/between/cult/parts.json ───── */

export const FRAMES = [
  { id: 'f', name: 'Flowing frame' },
  { id: 'm', name: 'Upright frame' },
] as const

export const ROBES = [
  { id: 'A1', name: 'Sect robe', note: 'indigo under white gauze' },
  { id: 'A2', name: 'Training wrap', note: 'knee tunic, bracers' },
  { id: 'B1', name: 'Travel robe', note: 'with a cape' },
  { id: 'B2', name: 'Light traveller', note: 'a gourd at the hip' },
  { id: 'C1', name: 'Ceremony robe', note: 'white and gold, wide sleeves' },
  { id: 'C2', name: 'Inner robe', note: 'plain and close' },
] as const

/** The skin ramp of parts.json, light to dark: eight stones. */
export const SKIN_RAMP = ['#e9c9ae', '#dfb595', '#cf9f7c', '#bb8763', '#a46f4e', '#8a593d', '#6d4430', '#513224'] as const

export interface Cultivator {
  who: 'f' | 'm'
  outfit: (typeof ROBES)[number]['id']
  skin: number
}
export const DEFAULT_CULTIVATOR: Cultivator = { who: 'f', outfit: 'B2', skin: 4 }

/* ───── The places of the outer grounds ───── */

export interface Offer {
  label: string
  detail?: string
  href?: string
  pay?: 'venmo' | 'cashapp' | 'both'
}
export interface Place {
  id: string
  name: string
  blurb: string // what stands here, one sentence
  /** Feelings this place serves (channel ids). PLACEHOLDER mapping, his to rule. */
  serves: string[]
  offers: Offer[]
  /** A window onto something already built. */
  window: { label: string; href: string; img?: string }
}

export const PLACES: Place[] = [
  {
    id: 'training-hall',
    name: 'The training hall',
    blurb: 'Every week the Allyship Dojo meets here.',
    serves: ['anger', 'fear', 'joy'],
    offers: [
      { label: 'Join on Patreon at $25', detail: 'the weekly Dojo, the monthly group call and every past session', href: LINKS.patreon },
    ],
    window: { label: 'Walk the Heaven sect’s gate hall', href: '/sect/heaven.html' },
  },
  {
    id: 'quiet-room',
    name: 'The quiet room',
    blurb: 'One conversation with me. Pay what feels right.',
    serves: ['neutrality', 'sadness', 'anger'],
    offers: [
      { label: 'Pay what feels right', href: LINKS.coachingFree },
      { label: '$75', href: LINKS.coaching75 },
      { label: '$150', href: LINKS.coaching150 },
      { label: '$250', href: LINKS.coaching250 },
    ],
    window: { label: 'Take the forest walk with six questions', href: '/coaching/walk.html', img: '/coaching/meet-your-daemons-poster.jpg' },
  },
  {
    id: 'library',
    name: 'The library',
    blurb: 'The book is finished: Mastering the Game of Allyship.',
    serves: ['fear', 'sadness', 'neutrality'],
    offers: [
      { label: 'Get it on Bookshop', href: LINKS.bookshop },
      { label: 'Get it on Amazon', href: LINKS.amazon },
    ],
    window: { label: 'Read the first chapter', href: '/mastering-allyship-chapter-1.pdf', img: '/launch/cover-front.png' },
  },
  {
    id: 'couriers-post',
    name: 'The courier’s post',
    blurb: 'Kickstarter backers are still waiting for their copies. $11 prints and ships one.',
    serves: ['joy', 'anger', 'neutrality'],
    offers: [{ label: 'Send $11', detail: 'one backer’s copy', pay: 'both' }],
    window: { label: 'Visit the farm', href: '/between/farm.html' },
  },
  {
    id: 'gift-shelf',
    name: 'The gift shelf',
    blurb: 'A coaching session you give to someone else.',
    serves: ['joy', 'sadness'],
    offers: [{ label: 'Send what you like with the note “coaching for someone”', detail: 'I will pass it on', pay: 'both' }],
    window: { label: 'See the daemons who work with you', href: '/coaching/walk.html', img: '/coaching/meet-your-daemons-poster.jpg' },
  },
  {
    id: 'sect-gate',
    name: 'The sect’s register',
    blurb: 'Join and keep the work going every month. The goal is $1,500 a month.',
    serves: ['fear', 'sadness', 'joy', 'anger', 'neutrality'],
    offers: [
      { label: 'Patreon', detail: '$5, $25 or $150 a month', href: LINKS.patreon },
    ],
    window: { label: 'Walk the sect’s grounds', href: '/sect/heaven.html' },
  },
]

/** The places a feeling lights, in grounds order. The sect register serves every feeling. */
export function placesFor(feelingId: string): Place[] {
  return PLACES.filter((p) => p.serves.includes(feelingId))
}

/* ───── Stuck? One Emotional Alchemy step, with an action pointing forward ───── */

export function stuckStep(feelingId: string): { move: string; action: string } {
  const f = FEELINGS.find((x) => x.id === feelingId) ?? FEELINGS[0]
  return {
    move: f.move,
    // PLACEHOLDER actions: one future-pointing act each.
    action: STUCK_ACTIONS[f.id] ?? 'Pick the smallest next thing you could do today and do it before you close this page.',
  }
}
const STUCK_ACTIONS: Record<string, string> = {
  fear: 'Name the one thing you would try if it could not go wrong, then do the first minute of it today.',
  sadness: 'Pick one thing you have been carrying and decide where it goes: a message you will send, or a place you will put it down.',
  joy: 'Choose one small thing that delighted you this week and do it again tomorrow.',
  anger: 'Pick the one wall that has held you and take one action against it before tonight.',
  neutrality: 'Choose one thing that is settled and tell someone it is, so you can stop carrying it.',
}

/* ───── The keepsake ───── */

export function keepsakeLine(feelingId: string, placeIds: string[]): string {
  const f = FEELINGS.find((x) => x.id === feelingId)
  const names = placeIds.map((id) => PLACES.find((p) => p.id === id)?.name).filter(Boolean)
  if (!f) return ''
  const where = names.length ? ` You stopped at ${names.join(' and ')}.` : ''
  return `You came for ${f.name}. Your move was ${f.move.replace(/ \(.*\)$/, '')}.${where}`
}

/** The courier's count line. `shipped` is admin-editable at runtime; null hides the count. */
export function courierLine(shipped: number | null, goal = 300): string | null {
  if (shipped === null || !Number.isFinite(shipped) || shipped < 0) return null
  return `${Math.floor(shipped)} of about ${goal} shipped`
}

/* ───── The backstory: his words, draft 2 (Six-faces-council fundraiser-2026-11-16 drafts/backstory.md, seed v3) ─────
 * The text is his, shaped by the interview thread, and waits on his read (one [ASK] gap: why this friend, why now).
 * The pictures are STAND-INS: the interview thread's storyboard will replace them. Swap text and picture per beat.
 */
export interface StoryBeat {
  title: string
  paras: string[]
  img: string
  alt: string
  /** true while the picture is a stand-in for the storyboard frame */
  standIn: boolean
}
export const STORY: StoryBeat[] = [
  {
    title: 'The book is done',
    paras: [
      'In August I finished the book, Mastering the Game of Allyship. I wanted my life back on track. I wanted to start shipping copies to the people who backed it, and to spend my days on something I cared about.',
      'So I took a job at a tea store. Three days later they fired me, and I fell back into the scramble of making ends meet.',
    ],
    img: '/launch/cover-front.png',
    alt: 'The cover of Mastering the Game of Allyship',
    standIn: true,
  },
  {
    title: 'What I came back to',
    paras: [
      'Somewhere in the scramble I came back to something I keep coming back to. The book was done. Now I could build what I really care about: games that help the world be a better place.',
      'The plan was to turn Mastering the Game of Allyship into a game you can play, then do the same for Friendcraft and Flirtcraft. This time, instead of working alone like I did on the book, I would open the workshop on Patreon so you could watch it being built. All I needed first was a job.',
    ],
    img: '/mastering-allyship/wendell.jpg',
    alt: 'Wendell Britt',
    standIn: true,
  },
  {
    title: 'Months later',
    paras: [
      'That was months ago. The job has not come, so the backers’ books have not shipped.',
      'But the game has grown. It carries the game of BARs into the digital world, a place to practice these ideas that is more alive than a page.',
      'The book is live on Amazon now. If you backed it, you are still waiting for your copy, and I want it in your hands as soon as I can. That is what this campaign is for.',
    ],
    img: '/coaching/meet-your-daemons-poster.jpg',
    alt: 'The daemons who work with the player',
    standIn: true,
  },
  {
    title: 'A test',
    paras: [
      'It is also a test. If what I wrote in the book works, it should work on me. The universe keeps putting me where I have to find out.',
      'Here is what I have made peace with. I am a game designer. I write, but I write for games. And I cannot do this alone, even though I keep trying, and every time that story looks a lot less glamorous than I would like.',
    ],
    img: '/images/bb-invite-poster.png',
    alt: 'An invitation poster from the Bruised Banana residency',
    standIn: true,
  },
  {
    title: 'Where you come in',
    paras: ['So I am not doing it alone. That is where you come in.', 'Come through the gate. Make your own cultivator, and find the shape of the help that is yours to give.'],
    img: '/launch/allyship-deck-cover-1280x720.png',
    alt: 'The Allyship deck cover',
    standIn: true,
  },
]

/* ───── The friend's own arc (seed v3): the true shape of their impact, and the dream they plant ─────
 * PLACEHOLDER copy and options: the interview thread's answers shape these.
 */
export const IMPACT_LINE =
  'Holding space for someone is one shape of help. Yours may be bigger. The places below are different shapes; the one that lights up is a clue.'

export const STUCK_INTRO =
  'Help that runs in crisis mode burns the helper out. Stuck means something is holding that pattern in place. Befriend it with one step.'

export interface Dream {
  id: string
  name: string
  line: string
}
export const DREAMS: Dream[] = [
  { id: 'make', name: 'Something I will make', line: 'It rests in the grounds until you have the room to build it.' },
  { id: 'place', name: 'A place I will go', line: 'It waits for you, planted where the sect can keep it.' },
  { id: 'become', name: 'Someone I will become', line: 'A seed that grows slowly while your attention is elsewhere.' },
  { id: 'give', name: 'Something I will give', line: 'A gift you are saving for the right season.' },
]

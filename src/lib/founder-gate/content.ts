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

/* ───── v4: the walk as a point-and-click storyboard ─────
 * A scene is a real game still, a few caption lines (tap to advance), and hotspots on the picture (tap to choose).
 * Hotspot x and y are percent of the screen, tuned by eye against the phone captures in looks/founders-gate-2/.
 * Every still is a real capture from /mnt/project-files/looks/ (the source is in `source`); the stills are a storyboard
 * of the game that exists, not the live 3D. The campaign framing (Raise Awareness inside Gather Resources, skilled
 * organizing, direct actions, join or create) is seed.md v4; the exact wording of the `note` lines is PLACEHOLDER.
 */
export interface Hotspot {
  id: string
  x: number
  y: number
  label: string
  /** a scene id to go to */
  to?: string
  /** an outside link (only from LINKS) */
  href?: string
  /** a line that opens on the picture when tapped, without leaving the scene */
  note?: string
  /** the dream a seed plants */
  dream?: string
  /** the feeling a tap picks (a channel id) */
  feeling?: string
  /** shown dimmed, and tapping says why it is not open yet */
  locked?: boolean
}
export interface Scene {
  id: string
  img: string
  /** CSS object-position for the cover crop */
  pos?: string
  motion: 'in' | 'out' | 'left' | 'right'
  /** the domain the friend is standing in, shown small at the top */
  domain?: string
  lines: string[]
  hotspots?: Hotspot[]
  /** where a tap on the last line leads; omitted when hotspots lead on */
  next?: string
  nextLabel?: string
  source: string
  standIn?: boolean
}

const S = '/ally-gate/scenes/'
export const STORY_IMG: Array<{ img: string; pos?: string; motion: Scene['motion']; source: string }> = [
  { img: S + 'sect-founding.jpg', motion: 'in', source: 'looks/heaven-sect-look-1.jpg, founding era crop' },
  { img: S + 'farm-1.jpg', motion: 'left', source: 'looks/bars-farm-2/frame-1.jpg' },
  { img: S + 'farm-3.jpg', motion: 'right', source: 'looks/bars-farm-2/frame-3.jpg' },
  { img: S + 'sect-peak.jpg', motion: 'out', source: 'looks/heaven-sect-look-1.jpg, peer era crop' },
  { img: S + 'gate-arrival.jpg', motion: 'in', source: 'looks/heaven-sect-look-1.jpg, arrival crop' },
]

export const SCENES: Record<string, Scene> = {
  gate: {
    id: 'gate',
    img: S + 'gate-arrival.jpg',
    pos: '50% 40%',
    motion: 'in',
    domain: 'Wendell’s Gate',
    lines: ['An old friend has fallen on hard times again.', 'Come through the gate, make your own cultivator, and find the kind of help that feels alive for you.'],
    hotspots: [{ id: 'steps', x: 50, y: 52, label: 'Walk up the steps', to: 'story-0' }],
    source: 'looks/heaven-sect-look-1.jpg, arrival crop',
  },
  shape: {
    id: 'shape',
    img: S + 'sect-peak.jpg',
    pos: '55% 40%',
    motion: 'out',
    domain: 'The shape of this walk',
    lines: ['This walk is a campaign, and it shows you its shape. Tap what you see.'],
    hotspots: [
      { id: 'gather', x: 50, y: 30, label: 'Gather Resources', note: 'The larger campaign, gathering what the work needs.' },
      { id: 'aware', x: 28, y: 52, label: 'Raise Awareness', note: 'You are here. This walk is a subcampaign of the one above.' },
      { id: 'organize', x: 74, y: 50, label: 'Skilled organizing', note: 'The capacity this campaign grows, in you and in the people around you.' },
      { id: 'actions', x: 50, y: 66, label: 'Direct actions', note: 'Two: play the game, and donate.' },
    ],
    next: 'make',
    source: 'looks/heaven-sect-look-1.jpg, peer era crop',
  },
  dream: {
    id: 'dream',
    img: S + 'farm-2.jpg',
    pos: '50% 50%',
    motion: 'in',
    domain: 'Your own dream',
    lines: ['Plant a dream in the grounds beside your figure.', 'The sect keeps it safe while your attention is elsewhere. This is an exchange: you are not only giving.'],
    hotspots: [
      { id: 'd-make', x: 70, y: 38, label: 'Something I will make', dream: 'make' },
      { id: 'd-place', x: 28, y: 36, label: 'A place I will go', dream: 'place' },
      { id: 'd-become', x: 62, y: 56, label: 'Someone I will become', dream: 'become' },
      { id: 'd-give', x: 44, y: 58, label: 'Something I will give', dream: 'give' },
    ],
    source: 'looks/bars-farm-2/frame-2.jpg',
  },
  feeling: {
    id: 'feeling',
    img: S + 'farm-1.jpg',
    pos: '50% 50%',
    motion: 'in',
    domain: 'Your own desire',
    lines: ['Which feeling did you come for? Pick the one you would most like to feel today. It lights the places that serve it.'],
    hotspots: FEELINGS.map((f, i) => ({ id: 'f-' + f.id, x: [22, 72, 46, 28, 70][i % 5], y: [30, 32, 46, 56, 58][i % 5], label: f.name, feeling: f.id, to: 'grounds' })),
    source: 'looks/bars-farm-2/frame-1.jpg',
  },
  stuck: {
    id: 'stuck',
    img: S + 'farm-3.jpg',
    pos: '50% 50%',
    motion: 'right',
    domain: 'Befriending what blocks your help',
    lines: [STUCK_INTRO],
    source: 'looks/bars-farm-2/frame-3.jpg',
  },
  'room-intro': {
    id: 'room-intro',
    img: S + 'sect-peak.jpg',
    pos: '55% 40%',
    motion: 'out',
    domain: 'The quiet room · direct action',
    lines: [
      // PLACEHOLDER: the whole epiphany bridge for this room is unwritten and needs its own design pass. The first line is his, from his note on founders-gate-look-2.
      'I am a skilled coach in getting people unstuck, metabolizing shame, and getting clear on the life you want to live.',
      'You told this walk where you are stuck. The quiet room is where we could sit with that and make sense of it together. Pay what feels right.',
    ],
    next: 'place-quiet-room',
    nextLabel: 'Enter the quiet room',
    source: 'looks/heaven-sect-look-1.jpg, peer era crop (stand-in)',
    standIn: true,
  },
  end: {
    id: 'end',
    img: S + 'farm-4.jpg',
    pos: '50% 40%',
    motion: 'out',
    domain: 'Skilled organizing · what next',
    lines: ['Your dream is planted. There are two ways forward.'],
    hotspots: [
      { id: 'join', x: 30, y: 34, label: 'Join a campaign that fits what is alive for you', note: 'This one is open. It gathers what the work needs; the monthly register is Patreon at $5, $25 or $150.' },
      { id: 'create', x: 74, y: 40, label: 'Create your own campaign', note: 'Bring your own idea. The first session is on your idea, with me.' },
    ],
    source: 'looks/bars-farm-2/frame-4.jpg',
  },
}

/** Where each place's offers sit on its picture, and which still stands behind it. */
export const PLACE_IMG: Record<string, { img: string; pos?: string; standIn?: boolean; source: string }> = {
  'training-hall': { img: S + 'sect-founding.jpg', source: 'looks/heaven-sect-look-1.jpg, founding crop' },
  'quiet-room': { img: S + 'sect-peak.jpg', pos: '55% 40%', standIn: true, source: 'looks/heaven-sect-look-1.jpg, peer era crop (stand-in)' },
  library: { img: '/launch/allyship-deck-cover-1280x720.png', standIn: true, source: 'public/launch/allyship-deck-cover-1280x720.png (cover art, not a capture)' },
  'couriers-post': { img: S + 'farm-4.jpg', source: 'looks/bars-farm-2/frame-4.jpg' },
  'gift-shelf': { img: S + 'farm-3.jpg', source: 'looks/bars-farm-2/frame-3.jpg' },
  'sect-gate': { img: S + 'gate-arrival.jpg', source: 'looks/heaven-sect-look-1.jpg, arrival crop' },
}
export const PLACE_SPOTS: Array<[number, number]> = [[30, 30], [72, 34], [30, 52], [72, 54]]
/** Where each place stands on the grounds picture (the farm overview). PLACEHOLDER layout. */
export const GROUND_SPOTS: Record<string, [number, number]> = {
  'training-hall': [30, 30], 'quiet-room': [72, 30], library: [24, 48], 'couriers-post': [76, 48], 'gift-shelf': [26, 66], 'sect-gate': [72, 66],
}

export function dreamLine(dreamId: string | null): string {
  const d = DREAMS.find((x) => x.id === dreamId)
  return d
    ? `Your cultivator stands in the sect. Beside it you planted: ${d.name.charAt(0).toLowerCase()}${d.name.slice(1)}. It rests here and grows while your attention is elsewhere.`
    : 'Your cultivator stands in the sect. Plant a dream beside it.'
}

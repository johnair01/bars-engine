/**
 * The four acts done on the harvest card's back, and the shape of what a seal keeps (design pass gate-acts-2026-11-17).
 * Pure: no React, no database. Every word a visitor reads on a card back is here, so the copy tests read one place.
 * Rules: no forms (one question at a time, chips or a pencilled line); the visitor is the hero, so no copy names his
 * need; the server never receives a friend's name or the visitor's own words (only the fields in SealInput).
 */
import { z } from 'zod'
import { BELIEFS, DISSATISFACTIONS, jobsFor, EMPTY_WALK, type Channel } from '@/lib/coaching/unpacking-walk'
import { EXPERIENCE_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { CHANNELS } from '@/lib/between/crops'
import { GATE_ACT_LINKS, LINKS, PAY, SOIL, type SeedAct } from './content'
import type { Packet } from './seed-packet'

export type Act = Exclude<SeedAct, 'own'>
export const ACTS: ReadonlyArray<Act> = ['offering', 'intro', 'share', 'work']
export type IntroKind = 'work' | 'podcast'

export const CAMPAIGN_REF = 'founders-gate'
export const STORY_ID = 'founders-gate-v1'
export const PASS_ID = 'gate-acts-2026-11-17'
export const GATE_BAR_ID = 'founders-gate-bar'

/** The browser id and the device-only card answers live under these localStorage keys. */
export const STORE_ALLY = 'gate.ally'
export const STORE_CARDS = 'gate.cards'

/** Offering amounts a visitor can name. 'open' means they pick the amount in the payment app. */
export const OFFERING_BANDS = [
  { id: '5', label: '$5' },
  { id: '20', label: '$20' },
  { id: '60', label: '$60' },
  { id: 'open', label: 'I’ll choose there' },
] as const
export type Band = (typeof OFFERING_BANDS)[number]['id']

export const INTRO_KINDS: ReadonlyArray<{ id: IntroKind; label: string }> = [
  { id: 'work', label: 'Work' },
  { id: 'podcast', label: 'A podcast guest' },
]

export const WORK_QUESTIONS = ['What are you building toward?', 'Where does it stall?', 'What would one good hour change?'] as const
export const AGENDA_MAX = 280

/** The links keys open. A null link shows its key as the waiting line, never a dead tap. */
export const PAYMENT_LINKS = {
  venmo: `https://venmo.com/u/${PAY.venmo.replace(/^@/, '')}`,
  cashapp: `https://cash.app/${PAY.cashapp}`,
} as const

export const CARD_COPY = {
  offering: {
    question: 'What will you leave?',
    keys: { venmo: 'Open Venmo', cashapp: 'Open Cash App' },
    kept: 'Kept when sealed: an offering, the amount you named, the date. The walk keeps no check on whether money moved.',
    seal: 'I left it',
  },
  intro: {
    kindQuestion: 'Who is it for?',
    lineQuestion: 'Write the first line, in your words.',
    key: 'Copy the note and send it yourself',
    copied: 'Copied. Paste it to your person yourself.',
    note: 'Here is someone I think you would enjoy meeting:',
    kept: 'Kept when sealed: the kind (work or podcast) and the date. Their name stays on your phone.',
    seal: 'I sent it',
  },
  share: {
    question: 'Who will you hand it to?',
    keys: { buy: 'Buy it on Bookshop', share: 'Share the walk' },
    copied: 'Copied the link to the walk. Paste it to one person yourself.',
    kept: 'Kept when sealed: bought or shared, plus the date. The person stays on your phone.',
    seal: 'I handed it on',
  },
  work: {
    lead: 'These three answers go to Wendell as the agenda for your hour.',
    key: 'Book the hour: pay what feels right',
    kept: 'Kept when sealed: your three answers, as the agenda for that hour.',
    seal: 'Booked',
  },
  notToday: 'Not today',
  notTodayKept: 'Kept on this phone. Nothing was sent.',
  waiting: 'Opens once Wendell adds the link',
  pencilHint: 'in pencil, stays on this phone',
  sealedLead: 'Sealed. This card is yours now.',
  takeBack: 'Take it back',
  takenBack: 'Taken back. Nothing more happens with it.',
  keptDevice: 'Kept on this phone for now.',
} as const

/** The key's target for an offering or the work hour; null means the link waits for his answer. */
export function actLink(act: Act, kind?: IntroKind, table: typeof GATE_ACT_LINKS = GATE_ACT_LINKS): string | null {
  if (act === 'intro') return table.intro[kind ?? 'work']
  if (act === 'work') return LINKS.coachingFree
  if (act === 'share') return LINKS.bookshop
  return null
}

/** The note an introduction copies: the visitor's own line, one fixed sentence, and the link when it exists. */
export function introNote(line: string, kind: IntroKind, link: string | null = GATE_ACT_LINKS.intro[kind]): string {
  const own = line.trim()
  const parts = [own, CARD_COPY.intro.note, link].filter((x): x is string => !!x && x.length > 0)
  return parts.join('\n\n')
}

/* ───── What a seal sends and keeps ───── */

const DOMAIN_KEY: Record<(typeof EXPERIENCE_OPTIONS)[number], string> = {
  'Gather Resource': 'GATHERING_RESOURCES',
  'Skillful Organizing': 'SKILLFUL_ORGANIZING',
  'Raise Awareness': 'RAISE_AWARENESS',
  'Direct Action': 'DIRECT_ACTION',
}
export const ACT_DOMAIN: Record<Act, string> = {
  offering: DOMAIN_KEY['Gather Resource'],
  intro: DOMAIN_KEY['Skillful Organizing'],
  share: DOMAIN_KEY['Raise Awareness'],
  work: DOMAIN_KEY['Direct Action'],
}

/** Every job line a feeling can show at question 5, so the server accepts only a preset and never a typed sentence. */
const ALL_JOBS: ReadonlySet<string> = new Set(
  jobsFor({ ...EMPTY_WALK, feels: DISSATISFACTIONS.map((d) => d.state) }).map((j) => j.job),
)
const BELIEF_SET: ReadonlySet<string> = new Set(BELIEFS.map((b) => b.belief))
const WEATHER_SET: ReadonlySet<string> = new Set(DISSATISFACTIONS.map((d) => d.state))

/** The packet as it crosses to the server: preset ids only. Own-words answers are dropped here and refused there. */
const packetSchema = z.object({
  seed: z.enum([...EXPERIENCE_OPTIONS, 'own'] as [string, ...string[]]).nullable(),
  family: z.enum(CHANNELS as unknown as [Channel, ...Channel[]]).nullable(),
  soil: z.enum(SOIL.map((s) => s.id) as [string, ...string[]]).nullable(),
  weather: z.array(z.string().refine((v) => WEATHER_SET.has(v))).max(8),
  water: z.string().refine((v) => ALL_JOBS.has(v)).nullable(),
  stone: z.object({ belief: z.string().refine((v) => BELIEF_SET.has(v)), set: z.boolean() }).nullable(),
}).strict()
export type SealPacket = z.infer<typeof packetSchema>

export function packetToSeal(p: Packet): SealPacket {
  return {
    seed: p.seed,
    family: p.family,
    soil: p.soil,
    weather: p.weather.filter((w) => WEATHER_SET.has(w)),
    water: ALL_JOBS.has(p.water) ? p.water : null,
    stone: p.stone && BELIEF_SET.has(p.stone.belief) ? { belief: p.stone.belief, set: p.stone.set } : null,
  }
}

const agendaSchema = z.tuple([z.string().max(AGENDA_MAX), z.string().max(AGENDA_MAX), z.string().max(AGENDA_MAX)])

export const sealSchema = z.object({
  allyId: z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/),
  act: z.enum(['offering', 'intro', 'share', 'work']),
  kind: z.enum(['work', 'podcast']).optional(),
  band: z.enum(['5', '20', '60', 'open']).optional(),
  agenda: agendaSchema.optional(),
  packet: packetSchema,
}).strict().superRefine((v, ctx) => {
  if (v.agenda && v.act !== 'work') ctx.addIssue({ code: 'custom', message: 'agenda belongs to the work act only' })
  if (v.kind && v.act !== 'intro') ctx.addIssue({ code: 'custom', message: 'kind belongs to the introduction only' })
  if (v.band && v.act !== 'offering') ctx.addIssue({ code: 'custom', message: 'band belongs to the offering only' })
})
export type SealInput = z.infer<typeof sealSchema>

export const takeBackSchema = z.object({
  allyId: z.string().min(8).max(64).regex(/^[A-Za-z0-9-]+$/),
  index: z.number().int().min(0).max(1000),
}).strict()

/** One entry of lead.actionsJson. 'sealed' is never 'done': only his confirmation counts as money or a milestone. */
export interface ActEntry {
  act: Act
  kind?: IntroKind
  band?: Band
  at: string
  status: 'sealed' | 'withdrawn'
}

export const LIMITS = { perLeadPerDay: 4, perHour: 100 } as const

/* ───── Fixed copy for his side: no visitor words ───── */

export const QUEST_COPY: Record<Act, { title: string; description: string }> = {
  offering: { title: 'An offering through the gate', description: 'A visitor sealed an offering at the founder’s gate. Confirm it when you see it arrive.' },
  intro: { title: 'An introduction through the gate', description: 'A visitor sealed an introduction at the founder’s gate. The person’s name stays on their phone.' },
  share: { title: 'The book handed on', description: 'A visitor sealed that they bought or shared the book at the founder’s gate.' },
  work: { title: 'An hour booked through the gate', description: 'A visitor sealed a booked hour at the founder’s gate. Their agenda is on the lead.' },
}

export function stepLine(act: Act, kind: IntroKind | undefined, band: Band | undefined): string {
  switch (act) {
    case 'offering': return `An offering came in through the gate (about ${band && band !== 'open' ? `$${band}` : 'an amount they chose'}). Confirm it when you see it.`
    case 'intro': return kind === 'podcast' ? 'An introduction for a podcast guest is on its way to you.' : 'An introduction for work is on its way to you.'
    case 'share': return 'Someone handed the book on.'
    case 'work': return 'Someone booked an hour. Their agenda is ready.'
  }
}
export const WITHDRAWN_LINE = 'This was withdrawn by the person who sealed it.'

/** UTC calendar day of an ISO time, for the per-day limit. */
export const utcDay = (iso: string) => iso.slice(0, 10)

/** The founder's player id, set by an admin in AppConfig.theme under founderGate.founderPlayerId. Missing or blank means none. */
export function parseFounderId(theme: string | null | undefined): string | null {
  try {
    const gate = (theme ? JSON.parse(theme) : {})?.founderGate as { founderPlayerId?: unknown } | undefined
    const id = gate?.founderPlayerId
    return typeof id === 'string' && id.trim() ? id.trim() : null
  } catch {
    return null
  }
}

export function parseEntries(json: string | null | undefined): Array<ActEntry & { barId?: string }> {
  try {
    const v = json ? JSON.parse(json) : []
    return Array.isArray(v) ? v.filter((e) => e && typeof e === 'object' && typeof e.at === 'string') : []
  } catch {
    return []
  }
}


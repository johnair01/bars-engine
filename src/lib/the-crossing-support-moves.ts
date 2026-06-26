import type { ElementKey } from '@/lib/ui/card-tokens'

export const THE_CROSSING_CAMPAIGN_REF = 'the-crossing'
export const THE_CROSSING_PARENT_CAMPAIGN_REF = 'mtgoa-barn-raising'
export const THE_CROSSING_PARENT_LABEL = 'Mastering the Game of Allyship Launch + Barn Raising'

/** Car-fund constants (stand-in ledger). raised = base + Σ donor amounts. */
export const THE_CROSSING_FUND = { goal: 4800, base: 3225 } as const

/** Donor Venmo handle (confirmed). Used for the Donor fast-path deep link. */
export const THE_CROSSING_VENMO_HANDLE = 'wendell-britt'
export const theCrossingVenmoUrl = (handle: string = THE_CROSSING_VENMO_HANDLE) =>
  `https://venmo.com/u/${handle}`

/** Contact channel a contributor leaves. Stored lowercase; displayed title-case. */
export const THE_CROSSING_CHANNELS = ['text', 'email', 'instagram', 'signal', 'venmo'] as const
export type TheCrossingChannel = (typeof THE_CROSSING_CHANNELS)[number]

export function channelLabel(channel: string): string {
  const c = channel.toLowerCase()
  if (c === 'instagram') return 'Instagram'
  return c.charAt(0).toUpperCase() + c.slice(1)
}

/**
 * Contribution status machine:
 *   new → contacted → accepted | declined,  terminal: thanked
 * Donor submissions start `accepted`. Broadcast thanks all non-declined.
 */
export const THE_CROSSING_STATUSES = ['new', 'contacted', 'accepted', 'declined', 'thanked'] as const
export type TheCrossingStatus = (typeof THE_CROSSING_STATUSES)[number]

export const STATUS_META: Record<TheCrossingStatus, { label: string; color: string }> = {
  new: { label: 'New', color: '#d4a017' },
  contacted: { label: 'Contacted', color: '#3a93c8' },
  accepted: { label: 'Accepted', color: '#2ecc71' },
  declined: { label: 'Not needed', color: '#8e7d76' },
  thanked: { label: 'Thanked', color: '#a855f7' },
}

/** Steward dashboard filter chips. `new` filters by status; the rest by role id. */
export const THE_CROSSING_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Needs follow-up' },
  { key: 'car_scout', label: 'Leads' },
  { key: 'connector', label: 'Intros' },
  { key: 'signal_booster', label: 'Awareness' },
  { key: 'encourager', label: 'Care' },
  { key: 'donor', label: 'Donations' },
] as const
export type TheCrossingFilterKey = (typeof THE_CROSSING_FILTERS)[number]['key']

export type TheCrossingSupportRoleId =
  | 'car_scout'
  | 'car_expert'
  | 'connector'
  | 'signal_booster'
  | 'encourager'
  | 'donor'

/** Legacy → current role id aliases (e.g. the renamed `car_person`). */
const ROLE_ID_ALIASES: Record<string, TheCrossingSupportRoleId> = {
  car_person: 'car_expert',
}

export type AllyshipDomain =
  | 'GATHERING_RESOURCES'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'
  | 'SKILLFUL_ORGANIZING'

/** Each allyship domain carries one Wuxing element (element = color channel). */
export const DOMAIN_ELEMENT: Record<AllyshipDomain, ElementKey> = {
  GATHERING_RESOURCES: 'earth',
  SKILLFUL_ORGANIZING: 'wood',
  RAISE_AWARENESS: 'metal',
  DIRECT_ACTION: 'fire',
}

const DOMAIN_LABELS: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'Gather Resources',
  RAISE_AWARENESS: 'Raise Awareness',
  DIRECT_ACTION: 'Direct Action',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
}

export function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain as AllyshipDomain] ?? domain
}

/** Role-specific copy for the capture form. */
export type TheCrossingCaptureCopy = {
  contactPlaceholder: string
  offerLabel: string
  offerPlaceholder: string
  detailPlaceholder: string
}

export type TheCrossingSupportRole = {
  id: TheCrossingSupportRoleId
  label: string
  primaryDomain: AllyshipDomain
  secondaryDomains: AllyshipDomain[]
  element: ElementKey
  isDonor: boolean
  exploreVerb: 'Explore' | 'Give'
  /** Dashboard filter grouping — equals the role id. */
  filterKey: TheCrossingSupportRoleId
  description: string
  boundary: string
  tinyMove: string
  impact: string
  artifact: string
  ctaLabel: string
  /** Concrete "moves you can make" shown on the role detail page. */
  examples: string[]
  capture: TheCrossingCaptureCopy
  starterCardIds: string[]
}

const CONTACT_DEFAULT = 'phone, @handle, or email'

export const THE_CROSSING_SUPPORT_ROLES: readonly TheCrossingSupportRole[] = [
  {
    id: 'car_scout',
    label: 'Car Scout',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: ['SKILLFUL_ORGANIZING'],
    element: 'earth',
    isDonor: false,
    exploreVerb: 'Explore',
    filterKey: 'car_scout',
    description: 'Find viable cars, listings, and vehicle paths.',
    boundary: 'Use this path when you’ve spotted a car or a vehicle lead.',
    tinyMove: 'Send one promising car listing.',
    impact: 'Turns the open field into concrete options.',
    artifact: 'Listing lead',
    ctaLabel: 'Send a car lead',
    examples: [
      'Send a Marketplace or Craigslist listing that fits the budget.',
      'Flag a dealer, auction, or private-sale lead.',
      'Pass along a car a friend is quietly selling.',
    ],
    capture: {
      contactPlaceholder: CONTACT_DEFAULT,
      offerLabel: 'The lead',
      offerPlaceholder: '2019 Honda Civic, $6,200, clean title',
      detailPlaceholder: 'Paste the listing link and why it fits.',
    },
    starterCardIds: ['OPEN-GR-ARCHITECT', 'WAKE-SO-ARCHITECT'],
  },
  {
    id: 'car_expert',
    label: 'Car Expert',
    primaryDomain: 'SKILLFUL_ORGANIZING',
    secondaryDomains: ['DIRECT_ACTION'],
    element: 'wood',
    isDonor: false,
    exploreVerb: 'Explore',
    filterKey: 'car_expert',
    description: 'Evaluate listings, repairs, title risk, scams, and buying strategy.',
    boundary: 'Use this when you know cars or can sanity-check a specific option.',
    tinyMove: 'Sanity-check one listing.',
    impact: 'Reduces risk and helps a good decision happen faster.',
    artifact: 'Listing review',
    ctaLabel: 'Offer car judgment',
    examples: [
      'Read a listing and call out the red flags.',
      'Estimate a fair price and a walk-away price.',
      'Advise on title, mileage, and repair risk.',
    ],
    capture: {
      contactPlaceholder: CONTACT_DEFAULT,
      offerLabel: 'Your read',
      offerPlaceholder: 'Looks solid — offer $5,800, walk at $6,400',
      detailPlaceholder: 'What to check, what it’s worth, where the risk is.',
    },
    starterCardIds: ['SHOW-SO-ARCHITECT', 'WAKE-DA-CHALLENGER'],
  },
  {
    id: 'connector',
    label: 'Connector',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: ['SKILLFUL_ORGANIZING'],
    element: 'earth',
    isDonor: false,
    exploreVerb: 'Explore',
    filterKey: 'connector',
    description: 'Make warm human introductions that unlock resources.',
    boundary: 'Use this when you know a person who should talk to Wendell.',
    tinyMove: 'Make one warm introduction.',
    impact: 'Creates a person-to-person bridge that would not exist otherwise.',
    artifact: 'Warm intro',
    ctaLabel: 'Make an intro',
    examples: [
      'Introduce someone who sells or sources cars.',
      'Connect Wendell to a trusted mechanic.',
      'Bridge to someone with fleet or wholesale access.',
    ],
    capture: {
      contactPlaceholder: CONTACT_DEFAULT,
      offerLabel: 'The introduction',
      offerPlaceholder: 'My cousin sells fleet cars wholesale',
      detailPlaceholder: 'Who they are and the best way to reach them.',
    },
    starterCardIds: ['WAKE-GR-DIPLOMAT', 'SHOW-GR-DIPLOMAT'],
  },
  {
    id: 'signal_booster',
    label: 'Signal Booster',
    primaryDomain: 'RAISE_AWARENESS',
    secondaryDomains: [],
    element: 'metal',
    isDonor: false,
    exploreVerb: 'Explore',
    filterKey: 'signal_booster',
    description: 'Share the ask strategically with context.',
    boundary: 'Use this when your useful move is reaching your people.',
    tinyMove: 'Share the post with one sentence on why it matters.',
    impact: 'Extends the campaign beyond Wendell’s immediate reach.',
    artifact: 'Signal boost',
    ctaLabel: 'Share the ask',
    examples: [
      'Share the campaign with one sentence on why it matters.',
      'Post it to a group chat or your stories.',
      'Tag two people who would want to help.',
    ],
    capture: {
      contactPlaceholder: '@handle or email',
      offerLabel: 'Your boost',
      offerPlaceholder: 'IG stories + two group chats',
      detailPlaceholder: 'Where you’ll share it and the angle you’ll lead with.',
    },
    starterCardIds: ['SHOW-RA-DIPLOMAT', 'SHOW-RA-SAGE'],
  },
  {
    id: 'encourager',
    label: 'Encourager',
    primaryDomain: 'DIRECT_ACTION',
    secondaryDomains: ['GATHERING_RESOURCES'],
    element: 'fire',
    isDonor: false,
    exploreVerb: 'Explore',
    filterKey: 'encourager',
    description: 'Reach out, reflect momentum, and encourage aligned action.',
    boundary: 'Use this when your gift is helping the person stay in motion.',
    tinyMove: 'Send one check-in or encouragement.',
    impact: 'Reduces isolation and keeps the next move alive.',
    artifact: 'Encouragement note',
    ctaLabel: 'Send encouragement',
    examples: [
      'Send a check-in text or a voice note.',
      'Reflect the momentum back to Wendell.',
      'Remind him the next move is small.',
    ],
    capture: {
      contactPlaceholder: CONTACT_DEFAULT,
      offerLabel: 'Your note',
      offerPlaceholder: 'Sent Wendell a voice note',
      detailPlaceholder: 'What you said, or what you want him to know.',
    },
    starterCardIds: ['SHOW-DA-REGENT', 'OPEN-GR-DIPLOMAT'],
  },
  {
    id: 'donor',
    label: 'Donor',
    primaryDomain: 'GATHERING_RESOURCES',
    secondaryDomains: [],
    element: 'earth',
    isDonor: true,
    exploreVerb: 'Give',
    filterKey: 'donor',
    description:
      'Contribute money, time, expertise, space, temporary transportation, or resources.',
    boundary: 'Use this when you can materially support the campaign.',
    tinyMove: 'Donate, lend, or share the link.',
    impact: 'Adds real fuel to the car replacement effort.',
    artifact: 'Contribution',
    ctaLabel: 'Send Venmo',
    examples: [
      'Send Venmo toward the car.',
      'Offer a tool, a ride, or temporary space.',
      'Share the donation link with your people.',
    ],
    capture: {
      contactPlaceholder: CONTACT_DEFAULT,
      offerLabel: 'Your contribution',
      offerPlaceholder: '$50 toward the car / or a resource',
      detailPlaceholder: 'What you’re giving — money, a tool, space, a ride.',
    },
    starterCardIds: ['WAKE-GR-DIPLOMAT', 'SHOW-GR-ARCHITECT'],
  },
] as const

/** Resolve a role by id, honoring legacy aliases (e.g. `car_person`). */
export function getTheCrossingSupportRole(
  roleId: string | null | undefined,
): TheCrossingSupportRole | null {
  if (!roleId) return null
  const canonical = ROLE_ID_ALIASES[roleId] ?? roleId
  return THE_CROSSING_SUPPORT_ROLES.find((role) => role.id === canonical) ?? null
}

// ─── Contribution record (parsed from CustomBar.contextLines) ────────────────

/** A contribution as the steward surfaces consume it. Reuses CustomBar. */
export type TheCrossingContribution = {
  id: string
  role: TheCrossingSupportRoleId
  roleLabel: string
  name: string
  contact: string
  channel: TheCrossingChannel
  summary: string
  detail: string
  status: TheCrossingStatus
  amount: number | null
  notified: boolean
  createdAt: string
  notes: string[]
}

type RawBar = {
  id: string
  contextLines?: string | null
  createdAt?: Date | string | null
}

function coerceStatus(value: unknown): TheCrossingStatus {
  return THE_CROSSING_STATUSES.includes(value as TheCrossingStatus)
    ? (value as TheCrossingStatus)
    : 'new'
}

function coerceChannel(value: unknown): TheCrossingChannel {
  const c = typeof value === 'string' ? value.toLowerCase() : ''
  return THE_CROSSING_CHANNELS.includes(c as TheCrossingChannel)
    ? (c as TheCrossingChannel)
    : 'text'
}

/**
 * Parse a campaign-captured CustomBar into a typed contribution. Tolerates
 * legacy records (no status/channel/amount/notes) with sane defaults.
 */
export function parseContribution(bar: RawBar): TheCrossingContribution {
  let ctx: Record<string, unknown> = {}
  if (bar.contextLines) {
    try {
      const parsed = JSON.parse(bar.contextLines)
      if (parsed && typeof parsed === 'object') ctx = parsed as Record<string, unknown>
    } catch {
      ctx = {}
    }
  }

  const role = getTheCrossingSupportRole(typeof ctx.role === 'string' ? ctx.role : null)
  const roleId = (role?.id ?? 'car_scout') as TheCrossingSupportRoleId
  const amountRaw = ctx.amount
  const amount =
    typeof amountRaw === 'number' && Number.isFinite(amountRaw)
      ? amountRaw
      : typeof amountRaw === 'string' && amountRaw.trim() !== ''
        ? Number.parseFloat(amountRaw)
        : null

  const createdAt =
    typeof ctx.createdAt === 'string'
      ? ctx.createdAt
      : bar.createdAt instanceof Date
        ? bar.createdAt.toISOString()
        : typeof bar.createdAt === 'string'
          ? bar.createdAt
          : new Date(0).toISOString()

  return {
    id: bar.id,
    role: roleId,
    roleLabel: typeof ctx.roleLabel === 'string' ? ctx.roleLabel : (role?.label ?? 'Car Scout'),
    name: typeof ctx.contributorName === 'string' ? ctx.contributorName : '',
    contact: typeof ctx.contributorContact === 'string' ? ctx.contributorContact : '',
    channel: coerceChannel(ctx.channel),
    summary: typeof ctx.offerSummary === 'string' ? ctx.offerSummary : '',
    detail: typeof ctx.detail === 'string' ? ctx.detail : '',
    status: coerceStatus(ctx.status),
    amount: amount !== null && Number.isFinite(amount) ? amount : null,
    notified: ctx.notified === true,
    createdAt,
    notes: Array.isArray(ctx.notes) ? ctx.notes.filter((n): n is string => typeof n === 'string') : [],
  }
}

// ─── Derived steward values (computed, never stored) ─────────────────────────

export function computeFund(
  contributions: TheCrossingContribution[],
  fund: { goal: number; base: number } = THE_CROSSING_FUND,
): { raised: number; goal: number; pct: number; leads: number } {
  const donated = contributions.reduce(
    (sum, c) => sum + (c.role === 'donor' && c.amount ? c.amount : 0),
    0,
  )
  const raised = fund.base + donated
  const pct = fund.goal > 0 ? Math.min(100, (raised / fund.goal) * 100) : 0
  const leads = contributions.filter((c) => c.role === 'car_scout').length
  return { raised, goal: fund.goal, pct, leads }
}

export function computeStewardStats(contributions: TheCrossingContribution[]): {
  total: number
  pending: number
  people: number
} {
  const people = new Set(contributions.map((c) => c.name.trim().toLowerCase()).filter(Boolean))
  return {
    total: contributions.length,
    pending: contributions.filter((c) => c.status === 'new').length,
    people: people.size,
  }
}

/** Unique-by-name recipients for the thank-you broadcast (excludes declined). */
export function recipientsOf(
  contributions: TheCrossingContribution[],
): { name: string; channel: TheCrossingChannel }[] {
  const seen = new Set<string>()
  const out: { name: string; channel: TheCrossingChannel }[] = []
  for (const c of contributions) {
    if (c.status === 'declined') continue
    const key = c.name.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ name: c.name, channel: c.channel })
  }
  return out
}

/** Count contributions per dashboard filter chip. */
export function filterCounts(
  contributions: TheCrossingContribution[],
): Record<TheCrossingFilterKey, number> {
  const counts = {} as Record<TheCrossingFilterKey, number>
  for (const f of THE_CROSSING_FILTERS) {
    counts[f.key] =
      f.key === 'all'
        ? contributions.length
        : f.key === 'new'
          ? contributions.filter((c) => c.status === 'new').length
          : contributions.filter((c) => c.role === f.key).length
  }
  return counts
}

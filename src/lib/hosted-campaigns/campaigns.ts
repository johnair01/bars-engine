/**
 * Hosted allyship campaigns — a campaign page for someone other than the founder.
 *
 * The ally funnel (`/ally/[slug]`) is Wendell asking his own people for help. A
 * hosted campaign is the same idea pointed at someone else: one person's practice,
 * the four allyship domains as the ways in, and a join form that lands every
 * supporter on that person's own list. Annastasia's is the pilot.
 *
 * The campaign's owner fills the page in herself through a private edit link
 * (`/campaigns/<slug>/edit/<token>`), the same capability-URL model as
 * `/ally/mine/[leadId]`. Edits live in `AppConfig.theme` under one namespaced key,
 * like the ally content overrides — no migration, and authored defaults render
 * whenever the database read fails.
 *
 * Pure: no database, no request state. `server.ts` does the reads and writes.
 */

import { ALLYSHIP_DOMAINS, type AllyshipDomainKey } from '@/lib/allyship-domains'

/** `AppConfig.theme` key that holds every hosted campaign's edits and edit token. */
export const HOSTED_CAMPAIGNS_KEY = 'hostedCampaigns'

/** Every field the owner can change from her edit link. All plain text. */
export interface HostedCampaignFields {
  /** Her name as it should appear in public. */
  name: string
  /** One line about the work and who it helps. */
  tagline: string
  /** Two or three short paragraphs, blank-line separated. */
  story: string
  /** Free text so "$3,000" and "3000" both work; the bar parses digits. */
  goal: string
  raised: string
  deadline: string
  /** What the GoFundMe pays for. */
  gofundmeFor: string
  gofundmeUrl: string
  patreonUrl: string
  /** What people can book with her. */
  bookWhat: string
  rate: string
  bookingUrl: string
  /** Her podcast episode's release date. */
  episode: string
  /** Where supporters can follow along. */
  followAlong: string
  /** One sentence per domain: what helping in that domain looks like for her. */
  askResources: string
  askAction: string
  askAwareness: string
  askOrganizing: string
}

export type HostedFieldKey = keyof HostedCampaignFields

export interface HostedCampaign {
  slug: string
  /** `CampaignLead.campaignRef` for everyone who joins. */
  campaignRef: string
  fields: HostedCampaignFields
}

/** Labels and placeholder prompts, in the order the edit form shows them. */
export const FIELD_SPEC: ReadonlyArray<{
  key: HostedFieldKey
  label: string
  prompt: string
  long?: boolean
  url?: boolean
}> = [
  { key: 'name', label: 'Your name, as it should appear', prompt: 'Annastasia' },
  { key: 'tagline', label: 'One line about your work', prompt: 'What you do and who it helps' },
  { key: 'story', label: 'Your story', prompt: 'Two or three short paragraphs. What you are building, who it is for, and what support makes possible.', long: true },
  { key: 'goal', label: 'Goal amount', prompt: '$ goal' },
  { key: 'raised', label: 'Raised so far', prompt: '$0' },
  { key: 'deadline', label: 'Open until', prompt: 'A date, or leave blank' },
  { key: 'gofundmeFor', label: 'What the GoFundMe pays for', prompt: 'The named need it pays for' },
  { key: 'gofundmeUrl', label: 'GoFundMe link', prompt: 'https://gofund.me/…', url: true },
  { key: 'patreonUrl', label: 'Patreon link', prompt: 'https://patreon.com/…', url: true },
  { key: 'bookWhat', label: 'What people can book', prompt: 'Sessions, workshops, a consult' },
  { key: 'rate', label: 'Your rate', prompt: 'Your rate, and any sliding scale' },
  { key: 'bookingUrl', label: 'Booking link', prompt: 'https://calendly.com/…', url: true },
  { key: 'episode', label: 'Podcast episode release', prompt: 'The release date' },
  { key: 'followAlong', label: 'Where to follow along', prompt: 'Instagram, a newsletter, or wherever you post' },
  { key: 'askResources', label: 'Gathering Resources: what helping looks like', prompt: 'Give, join the Patreon, or book a session.', long: true },
  { key: 'askAction', label: 'Direct Action: what helping looks like', prompt: 'Come to a session as a practice client, or show up to an event.', long: true },
  { key: 'askAwareness', label: 'Raise Awareness: what helping looks like', prompt: 'Share the episode with a sentence of your own, or introduce one person who needs this work.', long: true },
  { key: 'askOrganizing', label: 'Skillful Organizing: what helping looks like', prompt: 'Help with scheduling, intake, or a launch plan.', long: true },
]

/** Which ask field speaks for which domain. */
export const DOMAIN_ASK: Record<AllyshipDomainKey, HostedFieldKey> = {
  GATHERING_RESOURCES: 'askResources',
  DIRECT_ACTION: 'askAction',
  RAISE_AWARENESS: 'askAwareness',
  SKILLFUL_ORGANIZING: 'askOrganizing',
}

const MAX_LEN: Partial<Record<HostedFieldKey, number>> = { story: 6000 }
const DEFAULT_MAX = 600

function blankFields(): HostedCampaignFields {
  return Object.fromEntries(FIELD_SPEC.map((f) => [f.key, ''])) as unknown as HostedCampaignFields
}

/**
 * Authored defaults. Blank means "show the placeholder prompt", which is what she
 * sees until she fills it in. Only what the record already holds is filled.
 */
export const HOSTED_CAMPAIGNS: Record<string, HostedCampaign> = {
  annastasia: {
    slug: 'annastasia',
    campaignRef: 'hosted-annastasia',
    fields: { ...blankFields(), name: 'Annastasia', episode: 'Wednesday, October 28' },
  },
}

export function getHostedDefault(slug: string): HostedCampaign | null {
  return HOSTED_CAMPAIGNS[slug.toLowerCase()] ?? null
}

/** What one campaign holds in `AppConfig.theme[HOSTED_CAMPAIGNS_KEY][slug]`. */
export interface HostedStoredEntry {
  fields?: Partial<HostedCampaignFields>
  editToken?: string
  updatedAt?: string
}

export type HostedStore = Record<string, HostedStoredEntry>

/** Parse the whole theme string. Never throws; anything malformed reads as empty. */
export function parseHostedStore(theme: string | null | undefined): HostedStore {
  try {
    const parsed = theme ? (JSON.parse(theme) as Record<string, unknown>) : {}
    const raw = parsed[HOSTED_CAMPAIGNS_KEY]
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: HostedStore = {}
    for (const [slug, entry] of Object.entries(raw as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue
      const e = entry as Record<string, unknown>
      out[slug] = {
        fields: cleanFields(e.fields),
        editToken: typeof e.editToken === 'string' ? e.editToken : undefined,
        updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : undefined,
      }
    }
    return out
  } catch {
    return {}
  }
}

/** Keep only known string fields, trimmed and capped. Unknown keys are dropped. */
export function cleanFields(raw: unknown): Partial<HostedCampaignFields> {
  if (!raw || typeof raw !== 'object') return {}
  const src = raw as Record<string, unknown>
  const out: Partial<HostedCampaignFields> = {}
  for (const { key, url } of FIELD_SPEC) {
    const v = src[key]
    if (typeof v !== 'string') continue
    let s = v.replace(/\r\n/g, '\n').trim().slice(0, MAX_LEN[key] ?? DEFAULT_MAX)
    if (url && s && !/^https?:\/\//i.test(s)) s = `https://${s}`
    out[key] = s
  }
  return out
}

/** Defaults with stored edits on top. Stored blanks win, so she can clear a field. */
export function resolveHosted(slug: string, store: HostedStore): HostedCampaign | null {
  const base = getHostedDefault(slug)
  if (!base) return null
  return { ...base, fields: { ...base.fields, ...(store[base.slug]?.fields ?? {}) } }
}

/** Constant-time token compare. An unset stored token never matches. */
export function tokenMatches(stored: string | undefined, given: string): boolean {
  if (!stored || !given || stored.length !== given.length) return false
  let diff = 0
  for (let i = 0; i < stored.length; i++) diff |= stored.charCodeAt(i) ^ given.charCodeAt(i)
  return diff === 0
}

/** Digits out of free text: "$3,000" → 3000. Null when there are none. */
export function parseAmount(s: string): number | null {
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : null
}

export function progressPercent(fields: HostedCampaignFields): number | null {
  const goal = parseAmount(fields.goal)
  const raised = parseAmount(fields.raised)
  if (!goal || raised === null) return null
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)))
}

export const DOMAIN_KEYS = ALLYSHIP_DOMAINS.map((d) => d.key) as AllyshipDomainKey[]

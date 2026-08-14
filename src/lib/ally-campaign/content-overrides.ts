/**
 * Ally Campaign — admin-editable content overrides.
 *
 * The problem this solves: every word of prose on the ally pages was drafted by a
 * machine, and some of it is a letter to a specific real person. Fixing that by
 * asking a model to write better sentences is the wrong shape. The right shape is
 * a text box.
 *
 * Storage follows the established `admin-editable-launch-page` pattern: authored
 * defaults live in TS (`allies.ts`, `workstreams.ts`), overrides live as JSON in
 * `AppConfig.theme` under the `allyCampaign` key. That means NO migration, and it
 * means the file is always a working fallback if the database is unreachable or
 * an override is malformed.
 *
 * Overrides are SPARSE — only fields an admin actually edited are stored, and
 * every unset field falls through to the authored default. Clearing a field
 * restores the default rather than blanking the page, so an admin can never
 * accidentally publish an empty letter.
 */

import {
  ALLIES,
  ALLY_MYTHS,
  DEFAULT_INVITE,
  UNDERSTANDING,
  type AllyInvite,
  type AllyMyth,
  type UnderstandingPanel,
} from './allies'
import { WORKSTREAMS, type Workstream } from './workstreams'

/** The JSON key inside `AppConfig.theme`. */
export const ALLY_CONTENT_KEY = 'allyCampaign'

export type InviteOverride = {
  displayName?: string
  eyebrow?: string
  opening?: string
  closing?: string
}

export type MythOverride = {
  myth?: string
  truth?: string
  reframe?: string
}

export type PanelOverride = {
  kicker?: string
  heading?: string
  body?: string
}

export type WorkstreamOverride = {
  title?: string
  emergentProblem?: string
  narrative?: string
  theAsk?: string
}

/** Everything an admin may rewrite. All optional, all sparse. */
export interface AllyContentOverrides {
  /** Keyed by invite slug — `mom`, `ray`, … plus `__default` for DEFAULT_INVITE. */
  invites?: Record<string, InviteOverride>
  /** Keyed by myth id. */
  myths?: Record<string, MythOverride>
  /** Keyed by panel index, as a string (JSON object keys are strings). */
  understanding?: Record<string, PanelOverride>
  /** Keyed by workstream key. */
  workstreams?: Record<string, WorkstreamOverride>
}

/** The slug used to override `DEFAULT_INVITE`, which has no entry in ALLIES. */
export const DEFAULT_INVITE_KEY = '__default'

/** Fully-resolved content the pages actually render. */
export interface ResolvedAllyContent {
  invite: AllyInvite
  myths: AllyMyth[]
  understanding: UnderstandingPanel[]
  workstreams: Workstream[]
}

// ── Parsing ─────────────────────────────────────────────────────────────────

/** A trimmed non-empty string, or undefined. Empty input means "use the default". */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function pickFields<T extends Record<string, unknown>>(
  raw: unknown,
  fields: readonly (keyof T & string)[],
): T | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const source = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const field of fields) {
    const value = text(source[field])
    if (value !== undefined) out[field] = value
  }
  return Object.keys(out).length > 0 ? (out as T) : undefined
}

function pickRecord<T extends Record<string, unknown>>(
  raw: unknown,
  fields: readonly (keyof T & string)[],
): Record<string, T> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const source = raw as Record<string, unknown>
  const out: Record<string, T> = {}
  for (const [key, value] of Object.entries(source)) {
    const picked = pickFields<T>(value, fields)
    if (picked) out[key] = picked
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const INVITE_FIELDS = ['displayName', 'eyebrow', 'opening', 'closing'] as const
const MYTH_FIELDS = ['myth', 'truth', 'reframe'] as const
const PANEL_FIELDS = ['kicker', 'heading', 'body'] as const
const WORKSTREAM_FIELDS = ['title', 'emergentProblem', 'narrative', 'theAsk'] as const

/**
 * Coerce arbitrary stored JSON into a safe override object. Anything unexpected
 * is dropped rather than trusted — this data reaches a public page, and a
 * malformed override must degrade to the authored default, never to a crash.
 */
export function normalizeOverrides(raw: unknown): AllyContentOverrides {
  if (!raw || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const result: AllyContentOverrides = {}

  const invites = pickRecord<InviteOverride>(source.invites, INVITE_FIELDS)
  if (invites) result.invites = invites

  const myths = pickRecord<MythOverride>(source.myths, MYTH_FIELDS)
  if (myths) result.myths = myths

  const understanding = pickRecord<PanelOverride>(source.understanding, PANEL_FIELDS)
  if (understanding) result.understanding = understanding

  const workstreams = pickRecord<WorkstreamOverride>(source.workstreams, WORKSTREAM_FIELDS)
  if (workstreams) result.workstreams = workstreams

  return result
}

/** Read overrides out of a raw `AppConfig.theme` string. Never throws. */
export function parseAllyContentTheme(theme: string | null | undefined): AllyContentOverrides {
  try {
    const parsed = theme ? (JSON.parse(theme) as Record<string, unknown>) : {}
    return normalizeOverrides(parsed[ALLY_CONTENT_KEY])
  } catch {
    return {}
  }
}

// ── Resolution (defaults ← overrides) ───────────────────────────────────────

/** The authored invite for a slug, before overrides. */
function baseInvite(slug: string | undefined): { invite: AllyInvite; key: string } {
  if (slug && ALLIES[slug.toLowerCase()]) {
    const key = slug.toLowerCase()
    return { invite: ALLIES[key], key }
  }
  // Unknown slugs render DEFAULT_INVITE but keep the requested slug for links.
  return { invite: { ...DEFAULT_INVITE, slug: slug ?? DEFAULT_INVITE.slug }, key: DEFAULT_INVITE_KEY }
}

export function resolveInviteWithOverrides(
  slug: string | undefined,
  overrides: AllyContentOverrides,
): AllyInvite {
  const { invite, key } = baseInvite(slug)
  const o = overrides.invites?.[key]
  if (!o) return invite
  return {
    ...invite,
    displayName: o.displayName ?? invite.displayName,
    eyebrow: o.eyebrow ?? invite.eyebrow,
    opening: o.opening ?? invite.opening,
    closing: o.closing ?? invite.closing,
  }
}

export function resolveMyths(overrides: AllyContentOverrides): AllyMyth[] {
  return ALLY_MYTHS.map((m) => {
    const o = overrides.myths?.[m.id]
    if (!o) return m
    return {
      ...m,
      myth: o.myth ?? m.myth,
      truth: o.truth ?? m.truth,
      reframe: o.reframe ?? m.reframe,
    }
  })
}

export function resolveUnderstanding(overrides: AllyContentOverrides): UnderstandingPanel[] {
  return UNDERSTANDING.map((p, i) => {
    const o = overrides.understanding?.[String(i)]
    if (!o) return p
    return {
      kicker: o.kicker ?? p.kicker,
      heading: o.heading ?? p.heading,
      body: o.body ?? p.body,
    }
  })
}

export function resolveWorkstreams(overrides: AllyContentOverrides): Workstream[] {
  return WORKSTREAMS.map((w) => {
    const o = overrides.workstreams?.[w.key]
    if (!o) return w
    return {
      ...w,
      title: o.title ?? w.title,
      emergentProblem: o.emergentProblem ?? w.emergentProblem,
      narrative: o.narrative ?? w.narrative,
      theAsk: o.theAsk ?? w.theAsk,
    }
  })
}

/** Everything `/ally/[slug]` needs, defaults merged with any admin edits. */
export function resolveAllyContent(
  slug: string | undefined,
  overrides: AllyContentOverrides,
): ResolvedAllyContent {
  return {
    invite: resolveInviteWithOverrides(slug, overrides),
    myths: resolveMyths(overrides),
    understanding: resolveUnderstanding(overrides),
    workstreams: resolveWorkstreams(overrides),
  }
}

/** Which override bucket a given invite slug writes to. */
export function inviteOverrideKey(slug: string | undefined): string {
  return slug && ALLIES[slug.toLowerCase()] ? slug.toLowerCase() : DEFAULT_INVITE_KEY
}

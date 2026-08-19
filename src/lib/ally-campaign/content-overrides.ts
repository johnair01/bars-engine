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
import {
  findLiteralFigure,
  literalFigureMessage,
  renderTokens,
  statesObligationWithoutRecovery,
} from './content-tokens'

/** The JSON key inside `AppConfig.theme`. */
export const ALLY_CONTENT_KEY = 'allyCampaign'

export type InviteOverride = {
  displayName?: string
  eyebrow?: string
  opening?: string
  closing?: string
  /** Only meaningful on created invites; authored ones keep their file value. */
  cohort?: string
  /**
   * This ally's own myths / panels / workstream copy, layered over the global
   * layer, layered over the authored file. Same shape at every scope so a
   * per-ally edit can say anything a global one can.
   */
  content?: ContentLayer
}

/**
 * Slugs that can never be an invite, because a real route already owns them.
 * `/ally/mine/[leadId]` is the ally return surface — an invite named `mine`
 * would sit under a path that means something else entirely.
 */
export const RESERVED_INVITE_SLUGS = new Set(['mine', '__default', 'api', 'new'])

/**
 * Prefix that turns any invite into a DRY RUN: `/ally/test-mom` walks the real
 * `mom` letter but writes nothing at all.
 *
 * This exists because rehearsing the flow on the live link is destructive in a
 * non-obvious way. `submitAllyIntake` claims each chosen need conditionally on
 * `status: 'open'`, so a single walkthrough would mark real tasks as taken and
 * put a fake lead on the steward board — and there are only 24 needs.
 */
export const TEST_SLUG_PREFIX = 'test-'

/** True when this slug should run without persisting anything. */
export function isTestSlug(slug: string | undefined): boolean {
  return !!slug && slug.trim().toLowerCase().startsWith(TEST_SLUG_PREFIX)
}

/**
 * The invite a test slug is rehearsing — `test-mom` → `mom`. A bare `test-`
 * (nothing after the prefix) rehearses the generic invite.
 */
export function testSlugTarget(slug: string | undefined): string | undefined {
  if (!isTestSlug(slug)) return slug
  const target = slug!.trim().toLowerCase().slice(TEST_SLUG_PREFIX.length)
  return target.length > 0 ? target : undefined
}

/** URL-safe, lowercase, no leading dash. Matches what the route can serve. */
export const INVITE_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/

export type SlugCheck = { ok: true; slug: string } | { ok: false; error: string }

/**
 * Validate a proposed invite slug. Shared by the create action and the admin UI so
 * the rules are stated once — the form can't disagree with the server about what
 * is allowed.
 */
export function checkInviteSlug(raw: string): SlugCheck {
  const slug = raw.trim().toLowerCase()
  if (!slug) return { ok: false, error: 'Give it a short name for the URL.' }
  if (!INVITE_SLUG_RE.test(slug)) {
    return {
      ok: false,
      error: 'Use lowercase letters, numbers and dashes only — like “uncle-ray”.',
    }
  }
  if (RESERVED_INVITE_SLUGS.has(slug)) {
    return { ok: false, error: `“${slug}” is reserved by another page. Pick a different name.` }
  }
  if (isTestSlug(slug)) {
    return {
      ok: false,
      error: `“${TEST_SLUG_PREFIX}…” is the dry-run prefix, not a name. /ally/${slug} already works as a test of “${testSlugTarget(slug) ?? 'the generic invite'}”.`,
    }
  }
  if (ALLIES[slug]) {
    return { ok: false, error: `“${slug}” already exists in code — edit it instead of creating it.` }
  }
  return { ok: true, slug }
}

const COHORTS: readonly AllyInvite['cohort'][] = ['family', 'friends', 'colleagues', 'public']

function asCohort(value: string | undefined, fallback: AllyInvite['cohort']): AllyInvite['cohort'] {
  return COHORTS.includes(value as AllyInvite['cohort'])
    ? (value as AllyInvite['cohort'])
    : fallback
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

/**
 * The content buckets an admin may rewrite, at either scope.
 *
 * Split out so the global layer and each per-invite layer are literally the same
 * shape — a per-ally override can say anything a global one can, which is the
 * point of the cascade.
 */
export interface ContentLayer {
  /** Keyed by myth id. */
  myths?: Record<string, MythOverride>
  /** Keyed by panel index, as a string (JSON object keys are strings). */
  understanding?: Record<string, PanelOverride>
  /** Keyed by workstream key. */
  workstreams?: Record<string, WorkstreamOverride>
}

/**
 * Everything an admin may rewrite. All optional, all sparse.
 *
 * THREE LAYERS, resolved per FIELD (see `resolveAllyContent`):
 *
 *   1. authored default   `workstreams.ts` / `allies.ts`
 *   2. global override    `.myths` / `.understanding` / `.workstreams`
 *   3. per-invite override `.invites[slug].content.*`
 *
 * Field-level rather than object-level on purpose: a per-ally rewrite of one
 * workstream's *narrative* must not silently discard a globally-corrected *ask*
 * for the same workstream. The two edits are about different things and are made
 * by the same person months apart.
 *
 * Every layer stores TOKENS, never figures — `{{carLoan}}`, not `$2,500`. That is
 * what lets the message differ per ally while the data stays single-source, and
 * it is enforced in `normalizeOverrides` rather than advised in the editor.
 */
export interface AllyContentOverrides extends ContentLayer {
  /** Keyed by invite slug — `mom`, `ray`, … plus `__default` for DEFAULT_INVITE. */
  invites?: Record<string, InviteOverride>
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

/**
 * Why a piece of override text was refused, if it was.
 *
 * `normalizeOverrides` silently DROPS refused text so a bad value can never reach
 * a reader, but the save action needs to tell the admin what happened — a field
 * that vanishes without explanation is worse than one that errors. `checkLayer`
 * is the reporting half of the same rule.
 */
export interface OverrideRejection {
  bucket: 'myths' | 'understanding' | 'workstreams' | 'invites'
  key: string
  field: string
  message: string
}

/**
 * True when this text may be stored. The invariant of the whole token layer:
 * an override carries `{{carLoan}}`, never `$2,500`. Enforced here, at the point
 * data enters, rather than advised in the editor — a rule that lives only in a
 * hint is a rule nobody keeps.
 */
function isStorableText(value: string): boolean {
  return findLiteralFigure(value) === null
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
    // A hard-coded figure is dropped rather than stored — see isStorableText.
    if (value !== undefined && isStorableText(value)) out[field] = value
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

const INVITE_FIELDS = ['displayName', 'eyebrow', 'opening', 'closing', 'cohort'] as const
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
  // pickRecord only keeps declared string fields, so the nested per-invite
  // content layer is normalized separately and re-attached.
  const rawInvites = (source.invites ?? {}) as Record<string, unknown>
  const withContent: Record<string, InviteOverride> = { ...(invites ?? {}) }
  for (const [slug, raw] of Object.entries(rawInvites)) {
    if (!raw || typeof raw !== 'object') continue
    const layer = normalizeLayer((raw as Record<string, unknown>).content)
    if (Object.keys(layer).length === 0) continue
    withContent[slug] = { ...(withContent[slug] ?? {}), content: layer }
  }
  if (Object.keys(withContent).length > 0) result.invites = withContent

  Object.assign(result, normalizeLayer(source))

  return result
}

/** Normalize one content layer — used for the global scope and each invite's. */
export function normalizeLayer(raw: unknown): ContentLayer {
  if (!raw || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const layer: ContentLayer = {}

  const myths = pickRecord<MythOverride>(source.myths, MYTH_FIELDS)
  if (myths) layer.myths = myths

  const understanding = pickRecord<PanelOverride>(source.understanding, PANEL_FIELDS)
  if (understanding) layer.understanding = understanding

  const workstreams = pickRecord<WorkstreamOverride>(source.workstreams, WORKSTREAM_FIELDS)
  if (workstreams) layer.workstreams = workstreams

  return layer
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

/**
 * Where a slug's edits live, and what it layers on top of.
 *
 * Three cases, in priority order:
 *   1. authored in `ALLIES`      → edits keyed by slug, layered on the file entry
 *   2. created in the database   → edits keyed by slug, layered on DEFAULT_INVITE
 *   3. anything else             → the shared `__default` bucket
 *
 * Case 2 is what makes an invite creatable without a deploy: an entry under a
 * slug that has no file counterpart *is* the invite, with DEFAULT_INVITE
 * supplying anything the admin left blank.
 */
function baseInvite(
  slug: string | undefined,
  overrides: AllyContentOverrides,
): { invite: AllyInvite; key: string } {
  const key = slug?.trim().toLowerCase()

  if (key && ALLIES[key]) return { invite: ALLIES[key], key }

  if (key && overrides.invites?.[key] && !RESERVED_INVITE_SLUGS.has(key)) {
    return { invite: { ...DEFAULT_INVITE, slug: key }, key }
  }

  // Unknown slugs render DEFAULT_INVITE but keep the requested slug for links.
  return {
    invite: { ...DEFAULT_INVITE, slug: key ?? DEFAULT_INVITE.slug },
    key: DEFAULT_INVITE_KEY,
  }
}

export function resolveInviteWithOverrides(
  slug: string | undefined,
  overrides: AllyContentOverrides,
): AllyInvite {
  const { invite, key } = baseInvite(slug, overrides)
  const o = overrides.invites?.[key]
  if (!o) return invite
  return {
    ...invite,
    displayName: o.displayName ?? invite.displayName,
    eyebrow: o.eyebrow ?? invite.eyebrow,
    // Letters carry tokens too — "{{carLoan}}, as a loan" in an admin-edited
    // opening must move with economics.ts exactly like the authored one does.
    opening: renderTokens(o.opening ?? invite.opening),
    closing: renderTokens(o.closing ?? invite.closing),
    cohort: asCohort(o.cohort, invite.cohort),
  }
}

export interface InviteSummary {
  slug: string
  displayName: string
  cohort: AllyInvite['cohort']
  /** `code` entries live in allies.ts; `created` ones exist only in the database. */
  source: 'code' | 'created'
  /** True when an authored invite has been edited in the admin UI. */
  edited: boolean
}

/**
 * Every invite that currently resolves to a real page — authored and created —
 * for the admin index. Sorted code-first, then alphabetically, so the entries
 * someone can delete are visually separate from the ones they can't.
 */
export function listInvites(overrides: AllyContentOverrides): InviteSummary[] {
  const out: InviteSummary[] = Object.values(ALLIES).map((invite) => ({
    slug: invite.slug,
    displayName: overrides.invites?.[invite.slug]?.displayName ?? invite.displayName,
    cohort: asCohort(overrides.invites?.[invite.slug]?.cohort, invite.cohort),
    source: 'code',
    edited: !!overrides.invites?.[invite.slug],
  }))

  for (const [slug, o] of Object.entries(overrides.invites ?? {})) {
    if (slug === DEFAULT_INVITE_KEY || ALLIES[slug] || RESERVED_INVITE_SLUGS.has(slug)) continue
    out.push({
      slug,
      displayName: o.displayName ?? slug,
      cohort: asCohort(o.cohort, DEFAULT_INVITE.cohort),
      source: 'created',
      edited: true,
    })
  }

  return out.sort((a, b) =>
    a.source === b.source ? a.slug.localeCompare(b.slug) : a.source === 'code' ? -1 : 1,
  )
}

/**
 * First defined value across the layers, most specific first, rendered through
 * the token registry. Field-level, so one layer overriding `narrative` never
 * discards another layer's `theAsk`.
 */
function pick<T extends Record<string, string | undefined>>(
  layers: (T | undefined)[],
  field: keyof T,
  authored: string,
): string {
  for (const layer of layers) {
    const v = layer?.[field]
    if (typeof v === 'string' && v.length > 0) return renderTokens(v)
  }
  // Authored prose already interpolated its figures at module load; running it
  // through the renderer is a no-op unless someone wrote a token in the file.
  return renderTokens(authored)
}

/** The layer stack for a slug: per-invite first, then global. */
export function layersFor(
  slug: string | undefined,
  overrides: AllyContentOverrides,
): ContentLayer[] {
  const key = inviteOverrideKey(slug, overrides)
  const perInvite = overrides.invites?.[key]?.content
  return perInvite ? [perInvite, overrides] : [overrides]
}

export function resolveMyths(
  overrides: AllyContentOverrides,
  slug?: string,
): AllyMyth[] {
  const layers = layersFor(slug, overrides)
  return ALLY_MYTHS.map((m) => {
    const os = layers.map((l) => l.myths?.[m.id])
    return {
      ...m,
      myth: pick(os, 'myth', m.myth),
      truth: pick(os, 'truth', m.truth),
      reframe: pick(os, 'reframe', m.reframe),
    }
  })
}

export function resolveUnderstanding(
  overrides: AllyContentOverrides,
  slug?: string,
): UnderstandingPanel[] {
  const layers = layersFor(slug, overrides)
  return UNDERSTANDING.map((p, i) => {
    const os = layers.map((l) => l.understanding?.[String(i)])
    return {
      kicker: pick(os, 'kicker', p.kicker),
      heading: pick(os, 'heading', p.heading),
      body: pick(os, 'body', p.body),
    }
  })
}

export function resolveWorkstreams(
  overrides: AllyContentOverrides,
  slug?: string,
): Workstream[] {
  const layers = layersFor(slug, overrides)
  return WORKSTREAMS.map((w) => {
    const os = layers.map((l) => l.workstreams?.[w.key])
    return {
      ...w,
      title: pick(os, 'title', w.title),
      emergentProblem: pick(os, 'emergentProblem', w.emergentProblem),
      narrative: pick(os, 'narrative', w.narrative),
      theAsk: pick(os, 'theAsk', w.theAsk),
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
    myths: resolveMyths(overrides, slug),
    understanding: resolveUnderstanding(overrides, slug),
    workstreams: resolveWorkstreams(overrides, slug),
  }
}

/**
 * Which override bucket a given invite slug writes to. Needs the overrides so a
 * created invite edits *itself* rather than the shared default — without this an
 * admin editing `/ally/uncle-ray` would silently rewrite everyone's fallback copy.
 */
export function inviteOverrideKey(
  slug: string | undefined,
  overrides: AllyContentOverrides = {},
): string {
  return baseInvite(slug, overrides).key
}

/** True when this slug resolves to a real invite rather than the generic fallback. */
export function inviteExists(slug: string | undefined, overrides: AllyContentOverrides): boolean {
  return inviteOverrideKey(slug, overrides) !== DEFAULT_INVITE_KEY
}

// ── Reporting the invariant ─────────────────────────────────────────────────

const LAYER_FIELDS: Record<'myths' | 'understanding' | 'workstreams', readonly string[]> = {
  myths: MYTH_FIELDS,
  understanding: PANEL_FIELDS,
  workstreams: WORKSTREAM_FIELDS,
}

/** Letter fields that carry prose and are therefore subject to the same rule. */
const INVITE_PROSE_FIELDS = ['opening', 'closing'] as const

/**
 * Every field in a patch that will be refused, and why.
 *
 * `normalizeOverrides` drops these silently — correct for rendering, useless for
 * the person who just typed them. The save action calls this first so it can say
 * *"“$2,500” is a live figure — write {{carLoan}} instead"* rather than accepting
 * the save and quietly discarding half of it.
 */
export function checkLayer(raw: unknown, scope = 'global'): OverrideRejection[] {
  if (!raw || typeof raw !== 'object') return []
  const source = raw as Record<string, unknown>
  const out: OverrideRejection[] = []

  for (const [bucket, fields] of Object.entries(LAYER_FIELDS)) {
    const rows = source[bucket]
    if (!rows || typeof rows !== 'object') continue
    for (const [key, row] of Object.entries(rows as Record<string, unknown>)) {
      if (!row || typeof row !== 'object') continue
      for (const field of fields) {
        const value = (row as Record<string, unknown>)[field]
        if (typeof value !== 'string' || !value.trim()) continue
        const rowKey = scope === 'global' ? key : `${scope}/${key}`
        const literal = findLiteralFigure(value)
        if (literal) {
          out.push({
            bucket: bucket as OverrideRejection['bucket'],
            key: rowKey,
            field,
            message: literalFigureMessage(literal),
          })
        } else if (statesObligationWithoutRecovery(value)) {
          out.push({
            bucket: bucket as OverrideRejection['bucket'],
            key: rowKey,
            field,
            message:
              'This names the copies already owed without saying what discharges them. Add {{sellable}} or {{breakEven}} — a debt stated with no way out of it just moves the weight onto the reader.',
          })
        }
      }
    }
  }

  return out
}

/** `checkLayer` across the global layer, every invite letter, and every per-invite layer. */
export function checkOverrides(raw: unknown): OverrideRejection[] {
  if (!raw || typeof raw !== 'object') return []
  const source = raw as Record<string, unknown>
  const out = checkLayer(source)

  const invites = source.invites
  if (invites && typeof invites === 'object') {
    for (const [slug, invite] of Object.entries(invites as Record<string, unknown>)) {
      if (!invite || typeof invite !== 'object') continue
      const inv = invite as Record<string, unknown>

      for (const field of INVITE_PROSE_FIELDS) {
        const value = inv[field]
        if (typeof value !== 'string' || !value.trim()) continue
        const literal = findLiteralFigure(value)
        if (literal) {
          out.push({ bucket: 'invites', key: slug, field, message: literalFigureMessage(literal) })
        } else if (statesObligationWithoutRecovery(value)) {
          out.push({
            bucket: 'invites',
            key: slug,
            field,
            message:
              'This letter names the copies already owed without saying what discharges them. Add {{sellable}} or {{breakEven}}.',
          })
        }
      }

      out.push(...checkLayer(inv.content, slug))
    }
  }

  return out
}

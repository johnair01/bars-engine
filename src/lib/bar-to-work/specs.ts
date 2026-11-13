/**
 * The spec store: a spec Claude writes for a BAR, held in the board store (board "specs") so a lane with only a token
 * can pull it. A lane reads a spec only once it is merged; a draft is Claude's and Wendell's to read. Reads, writes
 * and links go through here for the REST routes and the MCP tools alike.
 */
import { db } from '@/lib/db'
import { linkSeed, specKeyFor, type Seed } from './seeds'

export const BOARD = 'specs'
export const COLLECTION = 'specs'
export const MAX_SPEC = 60_000

export type SpecStatus = 'draft' | 'merged'
export type Spec = {
  key: string
  barId: string | null
  title: string
  markdown: string
  status: SpecStatus
  specUrl: string | null
  prUrl: string | null
  updatedAt: string
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
export const validKey = (k: unknown): k is string => typeof k === 'string' && /^[a-z0-9][a-z0-9._-]{0,119}$/i.test(k)
const httpsUrl = (v: unknown) => { const s = clean(v, 500); return /^https:\/\/[^\s]+$/.test(s) ? s : null }

async function latest(key: string): Promise<Spec | null> {
  const row = await db.boardSave.findFirst({
    where: { board: BOARD, collection: COLLECTION, docId: key }, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], select: { data: true },
  })
  return (row?.data as Spec | undefined) ?? null
}

/** A lane's read: merged specs only. */
export async function readSpec(key: string, opts: { includeDraft?: boolean } = {}): Promise<Spec | null> {
  const s = await latest(key)
  return s && (opts.includeDraft || s.status === 'merged') ? s : null
}

export async function listSpecs(opts: { includeDraft?: boolean } = {}): Promise<Omit<Spec, 'markdown'>[]> {
  const rows = await db.boardSave.findMany({
    where: { board: BOARD, collection: COLLECTION }, orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }], take: 400, select: { docId: true, data: true },
  })
  const seen = new Set<string>(); const out: Omit<Spec, 'markdown'>[] = []
  for (const r of rows) {
    if (seen.has(r.docId)) continue
    seen.add(r.docId)
    const { markdown: _m, ...rest } = r.data as Spec
    if (opts.includeDraft || rest.status === 'merged') out.push(rest)
  }
  return out
}

export type WriteSpec = { ok: true; spec: Spec; seed: Seed | null } | { ok: false; status: number; error: string }

/** Claude's write (council token): a spec for a BAR. A merged spec keeps its markdown and moves the seed forward. */
export async function writeSpec(input: Record<string, unknown>, now = new Date()): Promise<WriteSpec> {
  const barId = clean(input.barId, 120) || null
  const key = validKey(input.key) ? input.key : barId ? specKeyFor(barId) : ''
  if (!validKey(key)) return { ok: false, status: 400, error: 'A spec needs a key (letters, digits, . _ -) or a barId.' }
  const markdown = clean(input.markdown, MAX_SPEC)
  const title = clean(input.title, 200)
  if (!markdown || !title) return { ok: false, status: 400, error: 'A spec needs a title and its markdown.' }
  const status: SpecStatus = input.status === 'merged' ? 'merged' : 'draft'
  const before = await latest(key)
  const spec: Spec = {
    key, barId: barId ?? before?.barId ?? null, title, markdown, status,
    specUrl: httpsUrl(input.specUrl) ?? before?.specUrl ?? null, prUrl: before?.prUrl ?? null, updatedAt: now.toISOString(),
  }
  await db.boardSave.create({ data: { board: BOARD, collection: COLLECTION, docId: key, source: 'specs-api', data: spec as object } })
  const seed = spec.barId
    ? await linkSeed(spec.barId, { specKey: key, specUrl: spec.specUrl, status: status === 'merged' ? 'spec_merged' : 'spec_draft' })
    : null
  return { ok: true, spec, seed }
}

/** The lane's link back: the PR it opened for a merged spec. The seed shows the link; the spec keeps it too. */
export async function linkPr(key: string, prUrl: unknown, now = new Date()): Promise<WriteSpec> {
  const url = httpsUrl(prUrl)
  if (!url) return { ok: false, status: 400, error: 'prUrl is the https link to the pull request.' }
  const spec = await readSpec(key)
  if (!spec) return { ok: false, status: 404, error: 'No merged spec with that key.' }
  const next: Spec = { ...spec, prUrl: url, updatedAt: now.toISOString() }
  await db.boardSave.create({ data: { board: BOARD, collection: COLLECTION, docId: key, source: 'specs-api', data: next as object } })
  const seed = next.barId ? await linkSeed(next.barId, { prUrl: url, status: 'pr_open' }) : null
  return { ok: true, spec: next, seed }
}

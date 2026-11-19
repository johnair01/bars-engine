/**
 * The scout door: the council's tool inventory and its scout check, answered from the one pushed copy of
 * council/toolbox.yaml (Wendell, 2026-11-19: "We need to be leveraging as much mature work ... as possible").
 *
 * Nothing here keeps a second inventory. six-faces-council pushes toolbox.yaml with the board's other files, and this
 * module only reads it. The scoring and the check are a port of council/tools/scout.py (the Python stays the council's
 * own gate); __tests__/scout.test.ts holds the cases that file's output gives, so the two cannot drift quietly.
 */
import yaml from 'js-yaml'
import { readText } from './content-store'

export const TOOLBOX = 'council/toolbox.yaml'
const HELD = new Set(['in_use', 'proven', 'vendored'])
const MUST_NAME = 3
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with', 'its', 'each', 'all', 'from',
  'as', 'at', 'our', 'we', 'it', 'is', 'be', 'by', 'new', 'make', 'build', 'add', 'fix', 'this', 'that', 'into', 'one'])

export type Tool = {
  id: string; does: string; tags: string[]; where: string; licence: string; status: string
  kind?: string; when?: string; proof?: string
}

export async function readTools(): Promise<{ tools: Tool[]; error: string | null }> {
  const text = await readText(TOOLBOX)
  if (!text) return { tools: [], error: `${TOOLBOX} is not in the store; push it with board/push_content.py` }
  try {
    const doc = yaml.load(text) as { tools?: Tool[] } | null
    const tools = Array.isArray(doc?.tools) ? doc!.tools! : []
    return tools.length ? { tools, error: null } : { tools: [], error: `${TOOLBOX} holds no tools` }
  } catch (e) {
    return { tools: [], error: `${TOOLBOX} could not be read: ${(e as Error).message}` }
  }
}

const stem = (w: string) => w.replace(/s+$/, '')

export function words(text: string): Set<string> {
  const out = new Set<string>()
  for (const w of text.toLowerCase().match(/[a-z0-9][a-z0-9.\-]+/g) ?? []) {
    const s = stem(w)
    if (!STOP.has(s)) out.add(s)
  }
  return out
}

const overlap = (a: Set<string>, b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n }
const tagSet = (t: Tool) => new Set((t.tags ?? []).map(stem))
const isHeld = (t: Tool) => HELD.has(t.status)

/** The best tools for a job; a held tool ranks above an untried one that scores the same or a little more. */
export function match(tools: Tool[], job: string, limit = 5): Tool[] {
  const want = words(job)
  const scored: { total: number; s: number; t: Tool }[] = []
  for (const t of tools) {
    if (t.status === 'rejected') continue
    const s = 3 * overlap(want, tagSet(t)) + overlap(want, words(t.does ?? ''))
    if (s) scored.push({ total: s + (isHeld(t) ? 4 : 0), s, t })
  }
  scored.sort((a, b) => b.total - a.total || b.s - a.s)
  return scored.slice(0, limit).map((x) => x.t)
}

/** The held tools that fit a job by at least one tag: the ones a build must use or pass over in writing. */
export function heldFor(tools: Tool[], job: string, limit = MUST_NAME): Tool[] {
  const want = words(job)
  return match(tools, job, 12).filter((t) => isHeld(t) && overlap(want, tagSet(t)) > 0).slice(0, limit)
}

export function toolLine(t: Tool): string {
  const mark = isHeld(t) ? 'HELD ' : ''
  return `${mark}${t.id} [${t.status}, ${t.licence.split(';')[0]}]: ${t.does}. When: ${t.when ?? ''}. `
    + `Where: ${t.where.split(';')[0]}. Proof: ${t.proof ?? ''}`
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function field(text: string, key: string): string {
  const m = new RegExp(`^\\s*[-*]?\\s*\\**${key}\\**\\s*:\\**\\s*(.+?)\\s*$`, 'im').exec(text)
  return m ? m[1].replace(/^[ *]+|[ *]+$/g, '') : ''
}

/** What a building record still owes the ladder; [] passes. */
export function problems(tools: Tool[], text: string): string[] {
  const scout = field(text, 'scout')
  if (!scout)
    return ['no `scout:` line: look the job up with scout.lookup and name the inventory tool this builds with, or '
      + '`scout: no build (why)` (docs/tool-scout.md)']
  if (scout.includes('GAP:')) return ['the `scout:` line is still a GAP: look the job line up and name the tool']
  if (/^no build\s*\(.+\)/i.test(scout)) return []
  const job = field(text, 'job')
  if (!job || job.includes('GAP:'))
    return ['no `job:` line: say in a few words what this builds, so the ladder can be checked against it']
  const named = tools.map((t) => t.id).filter((i) => new RegExp(`(?<![\\w-])${esc(i)}(?![\\w-])`).test(scout))
  const out: string[] = []
  if (!named.length && !/^\s*5\b/.test(scout))
    out.push('the `scout:` line names no tool in council/toolbox.yaml; name the one this builds with '
      + `(scout.lookup "${job}" lists them), or reach rung 5 and say why none fits`)
  for (const t of heldFor(tools, job))
    if (!named.includes(t.id))
      out.push(`we hold \`${t.id}\` for this job (${t.when}); the \`scout:\` line must use it or pass it over with a `
        + `reason, as \`passed over: ${t.id} (why)\``)
  for (const i of [...named].sort()) {
    const why = new RegExp(`(?<![\\w-])${esc(i)}(?![\\w-])\\s*\\(([^)]*)\\)`).exec(scout)
    if (!why || why[1].split(/\s+/).filter(Boolean).length < 2)
      out.push(`\`${i}\` in the \`scout:\` line needs a reason in brackets: how it is used, or why it is passed over`)
  }
  return out
}

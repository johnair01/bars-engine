/**
 * The pipeline door's readers (six-faces-council .specify/specs/pipeline-mcp).
 *
 * Nine MCP tools answer from the files the content push carries, never from a checkout: council/pipeline.yaml for the
 * stages and their gates, council/faces.yaml for the lenses, council/loops/<strand>.json for a strand's checks, its
 * callsheet for the order of work, a round's judge.json for the verdict, canon/ for a rule and a mechanic's arithmetic,
 * and ontology/manifest.yaml for the load profile.
 *
 * No check is implemented here. council/judge/run_loop.py stays the one judge and writes judge.json beside the MANIFEST
 * line; this module reads that receipt and refuses a round whose receipt is missing, belongs to another strand, or
 * predates a check the loop now runs. A check's sentence is his, quoted from the loop, never rewritten.
 */
import { readText } from './content-store'

export const PIPELINE = 'council/pipeline.yaml'
export const FACES = 'council/faces.yaml'
export const ONTOLOGY = 'ontology/manifest.yaml'
export const PLAY_CANON = 'canon/play-canon.md'
export const FLOORS = 'council/look/floors.json'
export const MECHANICS = 'canon/mechanics'
/** A status or a brief is read on a phone: the door never answers longer than this. */
export const LINE_CAP = 40

const lines = (text: string): string[] => text.split(/\r?\n/)

/** A quoted or plain YAML scalar, without its trailing comment. */
function unquote(raw: string): string {
  const v = raw.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1)
  const cut = v.search(/\s#/)
  return (cut < 0 ? v : v.slice(0, cut)).trim()
}

/** The lines of a `key: >` or `key: |` block, folded to one sentence; `next` is the first line past it. The block ends
 * at the first non-blank line indented no deeper than its key, so `lessons:` under a folded `standing_test:` is not
 * swallowed into it. */
function foldFrom(ls: string[], i: number, indent: number): { value: string; next: number } {
  const body: string[] = []
  let j = i + 1
  for (; j < ls.length; j++) {
    const l = ls[j]
    if (!l.trim()) { body.push(''); continue }
    if (l.match(/^\s*/)![0].length <= indent) break
    body.push(l.trim())
  }
  return { value: body.join(' ').replace(/\s+/g, ' ').trim(), next: j }
}

/** A scalar at one indentation, folded when it is a block scalar. */
function scalarAt(text: string, key: string, indent: number): { value: string; line: number } | null {
  const ls = lines(text)
  const head = new RegExp(`^${' '.repeat(indent)}${key}:(?:\\s+(.*))?$`)
  for (let i = 0; i < ls.length; i++) {
    const m = head.exec(ls[i])
    if (!m) continue
    const rest = (m[1] ?? '').trim()
    if (rest === '>' || rest === '|') return { value: foldFrom(ls, i, indent).value, line: i + 1 }
    return { value: unquote(rest), line: i + 1 }
  }
  return null
}

const topScalar = (text: string, key: string) => scalarAt(text, key, 0)

/** `[a, b]` on one line. */
function inlineList(value: string): string[] {
  const m = /^\[(.*)\]$/.exec(value.trim())
  if (!m) return []
  return m[1].split(',').map((s) => unquote(s.trim())).filter(Boolean)
}

/** One `- {key: value, ...}` flow map, as the tuning bench writes its faders. */
function flowMap(line: string): Record<string, string> | null {
  const whole = /^\s*-\s*\{(.*)\}\s*$/.exec(line)
  if (!whole) return null
  const parts: string[] = []
  let cur = ''
  let quote: string | null = null
  for (const ch of whole[1]) {
    if (quote) {
      if (ch === quote) quote = null
      cur += ch
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === ',') { parts.push(cur); cur = ''; continue }
    cur += ch
  }
  parts.push(cur)
  const out: Record<string, string> = {}
  for (const part of parts) {
    const at = part.indexOf(':')
    if (at < 0) continue
    out[part.slice(0, at).trim()] = unquote(part.slice(at + 1))
  }
  return out
}

/** A scalars map at one indentation, as `feel:` holds it. */
function mapAt(text: string, key: string, indent: number): Record<string, string> {
  const ls = lines(text)
  const out: Record<string, string> = {}
  const head = new RegExp(`^${' '.repeat(indent)}${key}:\\s*$`)
  let inside = false
  for (const l of ls) {
    if (head.test(l)) { inside = true; continue }
    if (!inside) continue
    if (!l.trim()) continue
    if (l.match(/^\s*/)![0].length <= indent) break
    const m = new RegExp(`^\\s{${indent + 2}}([A-Za-z0-9_.-]+):\\s*(.*)$`).exec(l)
    if (m) out[m[1]] = unquote(m[2])
  }
  return out
}

/** The words he is quoted saying in a file's own comments: a comment that opens with a quote first, otherwise the
 * longest quote, since a thread's title is usually shorter than his sentence. */
function firstQuote(text: string): string | null {
  const quotes: string[] = []
  for (const l of lines(text)) {
    if (!l.trimStart().startsWith('#')) continue
    const m = /"([^"]{12,})"/.exec(l)
    if (!m) continue
    if (/^#\s*"/.test(l.trim())) return m[1]
    for (const q of l.matchAll(/"([^"]{12,})"/g)) quotes.push(q[1])
  }
  return quotes.sort((a, b) => b.length - a.length)[0] ?? null
}

/** Whether a lesson's own words name the strand. Whole words, so `gate` is not found inside `delegate`. */
function bearsOn(text: string, strand: string): boolean {
  const t = text.toLowerCase()
  const s = strand.toLowerCase()
  if (!s) return false
  if (t.includes(s)) return true
  const words = s.split(/[^a-z0-9]+/).filter(Boolean)
  return words.length > 0 && words.every((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t))
}

const roundFolder = (round: string): string => {
  const clean = round.trim().replace(/\/+$/, '')
  if (!clean) return ''
  return clean.startsWith('council/callsheets/stills/') ? clean : `council/callsheets/stills/${clean}`
}

const loopPath = (strand: string) => `council/loops/${strand}.json`

// ---------------------------------------------------------------- the loop

export type LoopCheck = {
  id: string
  note?: string
  look?: string
  types?: string[]
  reads?: Record<string, string[]>
  bound?: string
  holds?: string
  holds_by_hold?: Record<string, string>
  why?: string
}

export type LoopDeft = {
  made?: string
  by?: string
  node_types?: string[]
  place?: string | null
  floor?: unknown
  floor_note?: string
  references?: { id: string; still: string; answer?: string }[]
  checks?: LoopCheck[]
  emits?: Record<string, string[]>
  run?: string
}

export type Loop = { strand?: string; callsheet?: string; deft?: LoopDeft }

/** A strand's loop file, as make_loop.py wrote it. */
export async function readLoop(strand: string): Promise<{ path: string; loop: Loop | null; error: string | null }> {
  const path = loopPath(strand)
  const text = await readText(path)
  if (!text)
    return { path, loop: null, error: `no loop at ${path}: run python3 council/judge/make_loop.py ${strand}, then push it` }
  try {
    return { path, loop: JSON.parse(text) as Loop, error: null }
  } catch {
    return { path, loop: null, error: `${path} is not JSON; push it again from a clone that holds the loop` }
  }
}

// ------------------------------------------------------------ the pipeline

export type Stage = { id: string; owners: string[]; gate: string; line: number }

function stagesIn(text: string): Stage[] {
  const ls = lines(text)
  const out: Stage[] = []
  let inside = false
  let cur: Stage | null = null
  let gate: string[] | null = null
  const flush = () => {
    if (cur) {
      if (gate) cur.gate = gate.join(' ').replace(/\s+/g, ' ').trim()
      out.push(cur)
    }
    gate = null
  }
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]
    if (/^stages:\s*$/.test(l)) { inside = true; continue }
    if (!inside) continue
    if (/^\S/.test(l)) { flush(); cur = null; inside = false; continue }
    const id = /^ {2}- id:\s*(\S+)/.exec(l)
    if (id) { flush(); cur = { id: id[1], owners: [], gate: '', line: i + 1 }; continue }
    if (!cur) continue
    const owners = /^ {4}owners:\s*(.+)$/.exec(l)
    if (owners) { cur.owners = inlineList(owners[1]); continue }
    const g = /^ {4}gate:\s*(.*)$/.exec(l)
    if (!g) continue
    const rest = g[1].trim()
    const body: string[] = []
    let j = i + 1
    if (rest && rest !== '>' && rest !== '|') body.push(rest)
    else
      for (; j < ls.length; j++) {
        const b = ls[j]
        if (!b.trim()) { body.push(''); continue }
        if (!/^\s{6,}/.test(b)) break
        body.push(b.trim())
      }
    gate = body
    i = Math.max(i, j - 1)
  }
  flush()
  return out
}

/** The stages the pipeline names, in order, and the contract check that closes a stage. */
export async function readPipeline(): Promise<{ stages: Stage[]; check: string | null; error: string | null }> {
  const text = await readText(PIPELINE)
  if (!text) return { stages: [], check: null, error: `${PIPELINE} is not in the store; push it with board/push_content.py` }
  return { stages: stagesIn(text), check: scalarAt(text, 'check', 2)?.value ?? null, error: null }
}

/** The first script a stage's gate names, so a session has something to run. */
function commandIn(gate: string): string | null {
  const m = /python3\s+[A-Za-z0-9_./-]+\.py/.exec(gate)
  return m ? m[0] : null
}

// ------------------------------------------------------------- the standing

export type SignedLine = { stage: string; line: string; date: string | null; source: string }
export type Gap = { check: string; sentence: string; source: string }
export type NextStage = { stage: string; gate: string; command: string | null; source: string }
export type Standing = {
  strand: string
  sheet: { path: string; found: boolean }
  stage: { id: string; source: string } | null
  signed: SignedLine[]
  gaps: Gap[]
  next: NextStage | null
  files: string[]
  notes: string[]
}

type SignedBullet = { stage: string; rest: string; date: string | null; at: number }

function signedBullets(text: string): SignedBullet[] {
  const ls = lines(text)
  const out: SignedBullet[] = []
  let inside = false
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]
    if (/^##\s+Signed\b/.test(l)) { inside = true; continue }
    if (!inside) continue
    if (/^#/.test(l)) break
    const m = /^-\s+([A-Za-z0-9-]+):\s*(.+)$/.exec(l.trim())
    if (!m) continue
    const rest = m[2].trim()
    const date = /\((\d{4}-\d{2}-\d{2})\)\s*$/.exec(rest)
    out.push({ stage: m[1].toLowerCase(), rest, date: date ? date[1] : null, at: i + 1 })
  }
  return out
}

/** The numbered steps under a callsheet's last `## NEXT` heading: the order the work goes up in. */
function nextSteps(text: string): { steps: string[]; line: number } | null {
  const ls = lines(text)
  let start = -1
  for (let i = 0; i < ls.length; i++) if (/^##\s+NEXT\b/.test(ls[i])) start = i
  if (start < 0) return null
  const steps: string[] = []
  for (let i = start + 1; i < ls.length; i++) {
    const l = ls[i]
    if (/^#{1,2}\s/.test(l)) break
    const m = /^(\d+)\.\s+(.*)$/.exec(l.trim())
    if (m) { steps[Number(m[1]) - 1] = m[2].trim(); continue }
    if (!l.trim()) continue
    const last = steps.length - 1
    if (last >= 0) steps[last] = `${steps[last]} ${l.trim()}`
    else steps.push(l.trim())
  }
  const kept = steps.filter((s) => s && s.length > 0)
  return { steps: kept, line: start + 1 }
}

async function standingOf(strand: string): Promise<{ status: Standing; deft: LoopDeft | null }> {
  const { path: loops, loop, error: loopError } = await readLoop(strand)
  const sheetPath = (loop && typeof loop.callsheet === 'string' && loop.callsheet) || `council/callsheets/${strand}.md`
  const sheetText = await readText(sheetPath)
  const pipeline = await readPipeline()
  const notes: string[] = []
  if (pipeline.error) notes.push(pipeline.error)
  if (loopError) notes.push(loopError)
  if (!sheetText) notes.push(`no callsheet at ${sheetPath}; push it with board/push_content.py`)

  const signed = sheetText
    ? signedBullets(sheetText).map((b) => ({
      stage: b.stage, line: `- ${b.stage}: ${b.rest}`, date: b.date, source: `${sheetPath}:${b.at}`,
    }))
    : []

  const order = pipeline.stages.map((s) => s.id)
  let stage: Standing['stage'] = null
  for (const s of signed) {
    const idx = order.indexOf(s.stage)
    if (idx < 0) continue
    if (!stage || idx > order.indexOf(stage.id)) stage = { id: s.stage, source: s.source }
  }

  const at = stage ? order.indexOf(stage.id) : -1
  if (!stage && sheetText) notes.push(`no Signed line in ${sheetPath}, so the door names the pipeline's first stage`)
  const nextStage = pipeline.stages[at + 1] ?? null
  const next: NextStage | null = nextStage
    ? {
      stage: nextStage.id,
      gate: nextStage.gate,
      command: commandIn(nextStage.gate) ?? pipeline.check,
      source: `${PIPELINE}:${nextStage.line}`,
    }
    : null

  const deft = (loop?.deft ?? null) as LoopDeft | null
  const gaps: Gap[] = []
  if (!deft && loopError) gaps.push({ check: 'deft', sentence: loopError, source: loops })
  for (const c of deft?.checks ?? [])
    if (c.holds === 'no') gaps.push({ check: c.id, sentence: c.note ?? '', source: loops })

  const files = [loops, sheetPath, PIPELINE]
  return {
    status: {
      strand,
      sheet: { path: sheetPath, found: Boolean(sheetText) },
      stage,
      signed,
      gaps,
      next,
      files,
      notes,
    },
    deft,
  }
}

/** A strand's standing: its callsheet, the stage reached, his signed lines, the open gaps and the next gate. */
export async function pipelineStatus(strand: string): Promise<Standing> {
  return (await standingOf(strand)).status
}

/** The one stage a strand moves to next, and what runs it. */
export async function pipelineNext(strand: string): Promise<{ stage: Standing['stage']; next: NextStage | null; notes: string[]; files: string[] }> {
  const { status } = await standingOf(strand)
  return { stage: status.stage, next: status.next, notes: status.notes, files: status.files }
}

function cap(out: string[]): string[] {
  if (out.length <= LINE_CAP) return out
  const kept = out.slice(0, LINE_CAP - 1)
  kept.push(`(+${out.length - LINE_CAP + 1} more lines, cut at ${LINE_CAP})`)
  return kept
}

/** A standing as lines, each naming the file it came from. */
export function statusLines(s: Standing): string[] {
  const out: string[] = []
  out.push(`strand ${s.strand}: ${s.sheet.found ? s.sheet.path : `${s.sheet.path} (not in the store)`}`)
  out.push(s.stage
    ? `stage: ${s.stage.id} (signed, ${s.stage.source})`
    : `stage: none signed (${s.sheet.path})`)
  for (const line of s.signed) out.push(`signed ${line.line} (${line.source})`)
  for (const g of s.gaps) out.push(`gap ${g.check}: "${g.sentence}" (${g.source})`)
  if (s.next) {
    out.push(`next: ${s.next.stage} (${s.next.source})`)
    out.push(`gate: ${s.next.gate}`)
    if (s.next.command) out.push(`run: ${s.next.command}`)
  } else out.push('next: none: the pipeline names no stage after this one')
  for (const n of s.notes) out.push(`note: ${n}`)
  out.push(`files: ${s.files.join(', ')}`)
  return cap(out)
}

/** The next stage as lines. */
export function nextLines(n: Awaited<ReturnType<typeof pipelineNext>>): string[] {
  const out: string[] = []
  out.push(n.stage ? `stage reached: ${n.stage.id} (${n.stage.source})` : 'stage reached: none signed')
  if (n.next) {
    out.push(`next: ${n.next.stage} (${n.next.source})`)
    out.push(`gate: ${n.next.gate}`)
    if (n.next.command) out.push(`run: ${n.next.command}`)
  } else out.push('next: none: the pipeline names no stage after this one')
  for (const note of n.notes) out.push(`note: ${note}`)
  return cap(out)
}

// ------------------------------------------------------------------ the brief

export type Brief = {
  strand: string
  node: string | null
  node_types: string[]
  place: string | null
  floor: Record<string, unknown> | null
  floor_note: string | null
  checks: string[]
  existing: { id: string; still: string; answer: string | null; source: string }[]
  order: string[]
  proof: { command: string | null; emits: Record<string, string[]>; source: string }
  brief: string
  files: string[]
}

async function floorsFor(place: string | null): Promise<{ floor: Record<string, unknown> | null; found: boolean }> {
  if (!place) return { floor: null, found: true }
  const text = await readText(FLOORS)
  if (!text) return { floor: null, found: false }
  try {
    const doc = JSON.parse(text) as { places?: Record<string, Record<string, unknown>> }
    return { floor: doc.places?.[place] ?? null, found: true }
  } catch {
    return { floor: null, found: false }
  }
}

/** What one round of a strand owes: the node type, the floors, the frames it stands on, the order, and the emits. */
export async function assetBrief(strand: string, node?: string): Promise<{ brief: Brief | null; error: string | null }> {
  const { path: loops, loop, error: loopError } = await readLoop(strand)
  const deft = (loop?.deft ?? null) as LoopDeft | null
  if (!deft) return { brief: null, error: loopError ?? `${loops} holds no deft loop; run make_loop.py ${strand}` }

  const sheetPath = (loop && typeof loop.callsheet === 'string' && loop.callsheet) || `council/callsheets/${strand}.md`
  const sheetText = await readText(sheetPath)
  const nodeType = typeof node === 'string' && node.trim() ? node.trim() : null
  const nodeTypes = deft.node_types ?? []
  const checks = (deft.checks ?? []).filter((c) => !nodeType || (c.types ?? []).includes(nodeType)).map((c) => c.id)
  const { floor } = await floorsFor(deft.place ?? null)
  const order = sheetText ? nextSteps(sheetText)?.steps ?? [] : []
  const existing = (deft.references ?? []).map((r) => ({
    id: r.id, still: r.still, answer: r.answer ?? null, source: loops,
  }))
  const emits = deft.emits ?? {}

  const out: string[] = []
  out.push(`# ${strand}: ${nodeType ?? (nodeTypes.join(', ') || 'no node type')}`)
  out.push('')
  out.push(`node types: ${nodeTypes.join(', ') || 'none'} (${loops})`)
  out.push(`place: ${deft.place ?? 'none'} (${loops})`)
  out.push(floor
    ? `floor: ${floorLabel(floor)} (${FLOORS})`
    : `floor: none, ${deft.floor_note ?? 'no floor runs'} (${loops})`)
  out.push(`checks: ${checks.join(', ') || 'none for this node'} (${loops})`)
  out.push('')
  out.push('existing:')
  if (!existing.length) out.push('- none: the loop names no reference frame')
  for (const e of existing) out.push(`- ${e.id} ${e.still}${e.answer ? ` (${e.answer})` : ''} (${e.source})`)
  out.push('')
  out.push(`order (${sheetText ? `${sheetPath}:${nextSteps(sheetText)?.line ?? 1}` : 'no callsheet'}):`)
  if (!order.length) out.push('1. the callsheet names no NEXT steps yet')
  order.forEach((s, i) => out.push(`${i + 1}. ${s}`))
  out.push('')
  out.push(`proof: ${deft.run ?? `python3 council/judge/run_loop.py ${strand} <round folder>`} (${loops})`)
  out.push('')
  out.push(`emits (${loops}):`)
  const keys = Object.keys(emits)
  if (!keys.length) out.push('- none: the loop names no emits')
  for (const k of keys) out.push(`- ${k}: ${emits[k].join(', ')}`)

  return {
    brief: {
      strand,
      node: nodeType,
      node_types: nodeTypes,
      place: deft.place ?? null,
      floor,
      floor_note: deft.floor_note ?? null,
      checks,
      existing,
      order,
      proof: { command: deft.run ?? null, emits, source: loops },
      brief: out.join('\n'),
      files: [loops, sheetPath, ...(floor ? [FLOORS] : [])],
    },
    error: null,
  }
}

function floorLabel(floor: Record<string, unknown>): string {
  return Object.entries(floor)
    .filter(([k, v]) => typeof v === 'number' && k !== 'served')
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')
}

// ------------------------------------------------------------- the verdict

export type Refusal = { id: string; note: string; sentence: string; detail: string }
export type Verdict = {
  ok: boolean
  judge: string | null
  refused: Refusal[]
  reason: string | null
  stale: string[]
  registry: string | null
  source: { receipt: string; loop: string }
}

type Receipt = {
  strand?: string
  held?: boolean
  line?: string
  registry?: string
  checks?: { id: string; status: string; detail?: string; holds?: string }[]
}

/** A round's verdict, from the receipt run_loop.py wrote beside its `judge:` line. */
export async function verifyRound(strand: string, round: string): Promise<Verdict> {
  const folder = roundFolder(round)
  const receiptPath = `${folder}/judge.json`
  const { path: loops, loop } = await readLoop(strand)
  const deft = (loop?.deft ?? null) as LoopDeft | null
  const run = deft?.run ?? `python3 council/judge/run_loop.py ${strand} ${folder}`
  const verdict = (v: Partial<Verdict> & { ok: boolean }): Verdict => ({
    judge: null, refused: [], reason: null, stale: [], registry: null,
    source: { receipt: receiptPath, loop: loops }, ...v,
  })

  if (!folder)
    return verdict({ ok: false, reason: 'asset.verify needs the round folder, e.g. `2026-11-09-cc-gate-look-13`' })
  const text = await readText(receiptPath)
  if (!text)
    return verdict({ ok: false, reason: `no receipt at ${receiptPath}: the round has not been judged. Run ${run}` })
  if (!deft)
    return verdict({
      ok: false,
      reason: `no loop at ${loops}, so the receipt cannot be compared with the checks the strand runs. Push the loop; ${run}`,
    })

  let rec: Receipt | null = null
  try {
    rec = JSON.parse(text) as Receipt
  } catch {
    rec = null
  }
  if (!rec) return verdict({ ok: false, reason: `${receiptPath} is not JSON; run ${run} again` })

  if (rec.strand && rec.strand !== strand)
    return verdict({ ok: false, reason: `${receiptPath} is ${rec.strand}'s receipt, not ${strand}'s; run ${run}` })

  const done = rec.checks ?? []
  const stale = (deft.checks ?? []).map((c) => c.id).filter((id) => !done.some((c) => c.id === id))
  if (stale.length)
    return verdict({
      ok: false,
      stale,
      reason: `${receiptPath} predates ${stale.join(', ')}, which the loop runs now: run ${run} again`,
    })

  const notes = new Map((deft.checks ?? []).map((c) => [c.id, c.note ?? '']))
  const refused = done
    .filter((c) => c.status === 'fail' && c.holds === 'yes')
    .map((c) => {
      const note = notes.get(c.id) ?? ''
      return { id: c.id, note, sentence: `"${note}"`, detail: c.detail ?? '' }
    })

  if (refused.length)
    return verdict({ ok: false, refused, registry: rec.registry ?? null, reason: `held: ${refused.map((r) => r.id).join(', ')}` })
  if (rec.held)
    return verdict({
      ok: false,
      registry: rec.registry ?? null,
      reason: `${receiptPath} says the round is held but names no failing check; run ${run} again`,
    })

  return verdict({ ok: true, judge: rec.line ?? null, registry: rec.registry ?? null })
}

/** A refusal as the sentence the round is sent back with. */
export function refusalLines(v: Verdict): string[] {
  const out: string[] = []
  if (v.reason) out.push(v.reason)
  for (const r of v.refused) out.push(`${r.id}: ${r.sentence}${r.detail ? ` (${r.detail})` : ''}`)
  out.push(`files: ${v.source.receipt}, ${v.source.loop}`)
  return cap(out)
}

// ------------------------------------------------------------------ canon

export type CanonBlock = {
  name: string
  kind: 'mechanic' | 'rule'
  rule: string
  said: string | null
  ask: string | null
  source: string
  player_verb?: string | null
  standard?: string | null
  status?: string | null
  feel_status?: string | null
}

function mechanicBlock(name: string, path: string, text: string): CanonBlock {
  const world = topScalar(text, 'world_response')
  const standard = topScalar(text, 'standard')
  const status = topScalar(text, 'status')?.value ?? null
  const feelStatus = topScalar(text, 'feel_status')?.value ?? null
  const rule = world?.value ?? standard?.value ?? ''
  const ask = status === 'proposed' || /proposal until/i.test(feelStatus ?? '')
    ? feelStatus ?? `status: ${status ?? 'unnamed'}, so the council has not looked`
    : null
  return {
    name,
    kind: 'mechanic',
    rule,
    said: firstQuote(text),
    ask,
    source: `${path}:${(world ?? standard)?.line ?? 1}`,
    player_verb: topScalar(text, 'player_verb')?.value ?? null,
    standard: standard?.value ?? null,
    status,
    feel_status: feelStatus,
  }
}

function ruleBlock(name: string, text: string): CanonBlock | null {
  const want = name.trim().toLowerCase().replace(/[-_ ]+/g, ' ')
  const ls = lines(text)
  for (let i = 0; i < ls.length; i++) {
    const m = /^\s*-\s+\*\*(.+?)\*\*(.*)$/.exec(ls[i])
    if (!m) continue
    const title = m[1].replace(/\.$/, '').trim()
    if (title.toLowerCase().replace(/[-_ ]+/g, ' ') !== want) continue
    const rest = m[2].trim()
    const paren = /\(([^()]*)\)\s*$/.exec(rest)
    const rule = paren ? rest.slice(0, paren.index).trim() : rest
    return { name: title, kind: 'rule', rule, said: null, ask: paren ? paren[1] : null, source: `${PLAY_CANON}:${i + 1}` }
  }
  return null
}

/** One canon block: a mechanic's file, or a rule in canon/play-canon.md. */
export async function canonBlock(name: string): Promise<{ block: CanonBlock | null; error: string | null }> {
  const asked = name.trim()
  if (!asked) return { block: null, error: `canon.lookup needs a name: a ${MECHANICS} file, or a rule in ${PLAY_CANON}` }
  if (/^[A-Za-z0-9._-]+$/.test(asked)) {
    const path = `${MECHANICS}/${asked}.yaml`
    const text = await readText(path)
    if (text) return { block: mechanicBlock(asked, path, text), error: null }
  }
  const canon = await readText(PLAY_CANON)
  const rule = canon ? ruleBlock(asked, canon) : null
  if (rule) return { block: rule, error: null }
  return {
    block: null,
    error: `no canon block named ${asked}: no ${MECHANICS}/${asked}.yaml, and no rule of that name in ${PLAY_CANON}`,
  }
}

// --------------------------------------------------------------- ontology

export type Profile = {
  kind: string
  loads: string[]
  fields: { field: string; owner: string }[]
  source: string
  kinds: string[]
  error: string | null
}

function loadProfilesIn(text: string): Record<string, { loads: string[]; line: number }> {
  const out: Record<string, { loads: string[]; line: number }> = {}
  let kind: string | null = null
  for (const [i, l] of lines(text).entries()) {
    if (/^load_profiles:\s*$/.test(l)) { kind = null; continue }
    if (/^\S/.test(l)) { kind = null; continue }
    const k = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l)
    if (k) { kind = k[1]; out[kind] = { loads: [], line: i + 1 }; continue }
    const item = /^ {4}-\s*(\S+)\s*$/.exec(l)
    if (item && kind) out[kind].loads.push(item[1])
  }
  return out
}

function fieldOwnersIn(text: string): { field: string; owner: string; line: number }[] {
  const out: { field: string; owner: string; line: number }[] = []
  let inside = false
  for (const [i, l] of lines(text).entries()) {
    if (/^ {2}field_owners:/.test(l)) { inside = true; continue }
    if (!inside) continue
    if (!l.trim()) continue
    if (l.match(/^\s*/)![0].length < 4) break
    const m = /^ {4}([a-z_]+):\s*(\S+)\s*$/.exec(l)
    if (m) out.push({ field: m[1], owner: m[2], line: i + 1 })
  }
  return out
}

/** A task kind's load profile and the eleven design-ontology fields the stage owes. */
export async function ontologyProfile(kind: string): Promise<Profile> {
  const asked = kind.trim()
  const manifest = await readText(ONTOLOGY)
  const pipeline = await readText(PIPELINE)
  const profiles = manifest ? loadProfilesIn(manifest) : {}
  const fields = pipeline ? fieldOwnersIn(pipeline).map(({ field, owner }) => ({ field, owner })) : []
  const kinds = Object.keys(profiles)
  const base = { kind: asked, loads: [], fields, source: `${ONTOLOGY}:1`, kinds, error: null as string | null }
  if (!asked) return { ...base, error: `ontology.profile needs a task kind: ${kinds.join(', ') || 'none in the store'}` }
  if (!kinds.length) {
    return { ...base, error: `${ONTOLOGY} is not in the store; push it with board/push_content.py` }
  }
  const found = profiles[asked]
  if (!found) return { ...base, error: `no load profile named ${asked}: ${kinds.join(', ')}` }
  return { ...base, loads: found.loads, source: `${ONTOLOGY}:${found.line}` }
}

// -------------------------------------------------------------- a mechanic

export type Fader = {
  key: string
  value: number
  min: number
  max: number
  step: number | null
  unit: string | null
  feel: string | null
  said: string
  inRange: boolean
  inFeel: boolean
}

export type MechanicEval = {
  mechanic: string
  player_verb: string | null
  values: Record<string, number>
  faders: Fader[]
  unknown: string[]
  ok: boolean
  failures: string[]
  source: string
}

const fmt = (v: number) => String(Number(v.toFixed(6)))

function fadersIn(text: string): Record<string, string>[] {
  const out: Record<string, string>[] = []
  let inside = false
  for (const l of lines(text)) {
    if (/^tune:/.test(l)) { inside = true; continue }
    if (!inside) continue
    if (!l.trim()) continue
    if (!/^\s/.test(l)) break
    if (!l.trim().startsWith('-')) continue
    const m = flowMap(l)
    if (m) out.push(m)
  }
  return out
}

/** One mechanic's faders at a state, with the same two checks the tuning bench runs: inside its bounds, and the words
 * a fader says appear in the feel line it names. */
export async function evaluateMechanic(name: string, state: Record<string, unknown>): Promise<{ result: MechanicEval | null; error: string | null }> {
  const asked = name.trim()
  if (!asked) return { result: null, error: 'mechanic.eval needs a mechanic: the name in its canon/mechanics file' }
  const path = `${MECHANICS}/${asked}.yaml`
  const text = await readText(path)
  if (!text) return { result: null, error: `no mechanic at ${path}; push it with board/push_content.py` }

  const feel = mapAt(text, 'feel', 0)
  const raw = fadersIn(text)
  const faders: Fader[] = []
  const failures: string[] = []
  const values: Record<string, number> = {}
  const seen = new Set<string>()

  for (const f of raw) {
    const key = f.key ?? ''
    if (!key) { failures.push('a fader names no key'); continue }
    seen.add(key)
    const given = state[key]
    const value = given === undefined ? Number(f.value) : typeof given === 'number' ? given : Number(given)
    if (!Number.isFinite(value)) { failures.push(`${key}: ${String(given)} is not a number`); continue }
    const min = Number(f.min), max = Number(f.max), step = f.step === undefined ? null : Number(f.step)
    const says = f.says ?? ''
    if (!says.includes('{v}')) failures.push(`${key}: its says line carries no {v}`)
    const said = says.replace(/\{v\}/g, fmt(value))
    const line = f.feel ?? ''
    const feelLine = feel[line] ?? ''
    const inRange = Number.isFinite(min) && Number.isFinite(max) ? value >= min && value <= max : true
    const inFeel = Boolean(line) && feelLine.includes(said)
    if (!inRange) failures.push(`${key}: ${fmt(value)} is outside ${fmt(min)} to ${fmt(max)}`)
    if (line && !feelLine) failures.push(`${key}: feel names ${line}, which the file does not state`)
    else if (line && !inFeel) failures.push(`${key}: feel.${line} does not say "${said}"`)
    values[key] = value
    faders.push({ key, value, min, max, step, unit: f.unit ?? null, feel: line || null, said, inRange, inFeel })
  }

  const unknown = Object.keys(state).filter((k) => !seen.has(k))
  return {
    result: {
      mechanic: topScalar(text, 'name')?.value ?? asked,
      player_verb: topScalar(text, 'player_verb')?.value ?? null,
      values,
      faders,
      unknown,
      ok: failures.length === 0,
      failures,
      source: path,
    },
    error: null,
  }
}

// ------------------------------------------------------------------ faces

export type Lesson = { date: string; wendell: string; lesson: string; source: string; line: string }
export type Face = { face: string; lens: string; standing_test: string; lessons: Lesson[]; source: string }
export type Lenses = { strand: string; reach_test: string | null; faces: Face[]; source: string; notes: string[] }

function facesIn(text: string): Face[] {
  const ls = lines(text)
  const out: Face[] = []
  let inside = false
  let cur: Face | null = null
  let lesson: { date?: string; wendell?: string; lesson?: string; source?: string; at?: number } | null = null
  let section: 'none' | 'lessons' = 'none'

  const closeLesson = () => {
    if (lesson && cur)
      cur.lessons.push({
        date: lesson.date ?? '', wendell: lesson.wendell ?? '', lesson: lesson.lesson ?? '',
        source: lesson.source ?? '', line: `${FACES}:${lesson.at ?? 1}`,
      })
    lesson = null
  }
  const closeFace = () => { closeLesson(); if (cur) out.push(cur); cur = null }

  for (let i = 0; i < ls.length; i++) {
    const l = ls[i]
    if (/^faces:\s*$/.test(l)) { inside = true; continue }
    if (!inside) continue
    if (/^\S/.test(l)) break
    const name = /^ {2}([a-z]+):\s*$/.exec(l)
    if (name) { closeFace(); cur = { face: name[1], lens: '', standing_test: '', lessons: [], source: '' }; section = 'none'; continue }
    if (!cur) continue
    if (/^ {4}lessons:\s*$/.test(l)) { section = 'lessons'; continue }
    if (section === 'lessons') {
      const item = /^ {6}-\s+date:\s*(.*)$/.exec(l)
      if (item) { closeLesson(); lesson = { date: unquote(item[1]), at: i + 1 }; continue }
      const key = /^ {8}([a-z_]+):\s*(.*)$/.exec(l)
      if (key && lesson) {
        const k = key[1]
        const rest = key[2].trim()
        if (rest === '>' || rest === '|') {
          const fold = foldFrom(ls, i, 8)
          ;(lesson as Record<string, unknown>)[k] = fold.value
          i = fold.next - 1
        } else (lesson as Record<string, unknown>)[k] = unquote(rest)
      }
      continue
    }
    const key = /^ {4}([a-z_]+):\s*(.*)$/.exec(l)
    if (!key) continue
    if (key[1] === 'lens') {
      cur.lens = unquote(key[2])
      if (!cur.source) cur.source = `${FACES}:${i + 1}`
    } else if (key[1] === 'standing_test') {
      const rest = key[2].trim()
      if (rest === '>' || rest === '|') { const fold = foldFrom(ls, i, 4); cur.standing_test = fold.value; i = fold.next - 1 }
      else cur.standing_test = unquote(rest)
    }
  }
  closeFace()
  return out
}

/** Each face's lens, its standing test, and the lessons whose own words bear on the strand. */
export async function faceLens(strand: string): Promise<Lenses> {
  const text = await readText(FACES)
  const base: Lenses = { strand, reach_test: null, faces: [], source: FACES, notes: [] }
  if (!text) return { ...base, notes: [`${FACES} is not in the store; push it with board/push_content.py`] }
  const order = topScalar(text, 'order')
  const ranked = inlineList(order?.value ?? '')
  const faces = facesIn(text)
  const sorted = ranked.length
    ? [...faces].sort((a, b) => {
      const ai = ranked.indexOf(a.face), bi = ranked.indexOf(b.face)
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    })
    : faces
  return {
    ...base,
    reach_test: topScalar(text, 'reach_test')?.value ?? null,
    source: `${FACES}:${order?.line ?? 1}`,
    faces: sorted.map((f) => ({ ...f, lessons: f.lessons.filter((l) => bearsOn(`${l.source} ${l.wendell} ${l.lesson}`, strand)) })),
  }
}

/**
 * The Teaching Desk export (spec .specify/specs/voice-desk, FR-005). Pure and deterministic, no AI, no network.
 *
 * `foldVoice(files, events)` folds store events (collection `voice`, board `council`) onto the current
 * `content/voice/` files and returns the new files. The same events always give the same bytes, and folding the same
 * events onto files that already hold them changes nothing (a bank line is keyed by the event that made it).
 *
 * Only an event marked `wendell` (stamped by the server from the owner cookie, never taken from a body) can change a
 * status, write a bank line, or set the chart. Every other event is ignored.
 */
import yaml from 'js-yaml'

export type Status = 'proposed' | 'stoned' | 'banned'

export interface LexiconEntry {
  word: string
  forms: string[]
  plain: string
  usage: string
  status: Status
  shown_on: string[]
  struck_for: string[]
  drafted_by: string
  marked_by: 'wendell' | null
  at: string
  slip: string | null
  screen: string | null
}
export interface Lexicon {
  version: 1
  words: LexiconEntry[]
}

export interface BankLine {
  id: string
  old: string
  new: string
  screen: string
  file: string
  source: 'desk' | 'pencil'
  ring: string[]
  look_row: string | null
  marked_by: 'wendell'
  at: string
  slip: string | null
  /** docId of the store event that made this line; keeps a rerun from writing it twice. */
  event: string
}

export const FADER_AXES = ['length', 'figure', 'warmth', 'address'] as const
export type FaderAxis = (typeof FADER_AXES)[number]
export interface Fader {
  value: number
  low: string
  high: string
}
export interface Chart {
  version: 1
  set_by: 'wendell' | null
  at: string | null
  faders: Record<FaderAxis, Fader>
}

export interface Screen {
  id: string
  files: string[]
  after: string[]
}
export interface Screens {
  version: 1
  screens: Screen[]
}

export interface VoiceFiles {
  lexicon: Lexicon
  bank: BankLine[]
  chart: Chart
  screens: Screens
}

export interface VoiceEvent {
  docId: string
  seq: number
  data: Record<string, unknown> & { kind?: string; marked_by?: string | null; at?: string }
  receivedAt?: string
}

export class VoiceExportError extends Error {
  constructor(public docId: string, message: string) {
    super(`${docId}: ${message}`)
    this.name = 'VoiceExportError'
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const day = (iso: string): string => iso.slice(0, 10)

/** Latest event per docId wins (the store's rule), then seq order. */
export function latestWins(events: VoiceEvent[]): VoiceEvent[] {
  const byDoc = new Map<string, VoiceEvent>()
  for (const e of events) {
    const prev = byDoc.get(e.docId)
    if (!prev || e.seq >= prev.seq) byDoc.set(e.docId, e)
  }
  return [...byDoc.values()].sort((a, b) => a.seq - b.seq)
}

function stampOf(e: VoiceEvent): string {
  return str(e.data.at) || str(e.receivedAt) || '1970-01-01T00:00:00Z'
}

export function foldVoice(files: VoiceFiles, rawEvents: VoiceEvent[]): VoiceFiles {
  const events = latestWins(rawEvents)
  const words = new Map(files.lexicon.words.map((w) => [w.word, { ...w, forms: [...w.forms], struck_for: [...w.struck_for], shown_on: [...w.shown_on] }]))
  const bank = new Map(files.bank.map((b) => [b.event, b]))
  let chart: Chart = JSON.parse(JSON.stringify(files.chart))

  const slips = new Map<string, VoiceEvent>()
  const rings: VoiceEvent[] = []
  for (const e of events) {
    if (e.data.kind === 'slip') slips.set(str(e.data.id), e)
    if (e.data.kind === 'ring') rings.push(e)
  }
  const wendell = (e: VoiceEvent) => e.data.marked_by === 'wendell'

  for (const e of events) {
    if (!wendell(e)) continue
    const d = e.data
    const at = stampOf(e)

    if (d.kind === 'keep') {
      const slipId = str(d.slip)
      const slip = slips.get(slipId)
      if (!slip) throw new VoiceExportError(e.docId, `keep names slip "${slipId}" with no slip event`)
      const old = str(slip.data.line)
      const next = str(d.text)
      if (!next || next === old) {
        bank.delete(e.docId)
        continue
      }
      const redraft = d.redraft === null || d.redraft === undefined ? null : str(d.redraft)
      const ring = new Set<string>()
      for (const r of rings) {
        if (!wendell(r) || str(r.data.slip) !== slipId) continue
        const on = str(r.data.on)
        if (on === 'old' || (redraft !== null && on === redraft)) ring.add(str(r.data.word))
      }
      bank.set(e.docId, {
        id: bank.get(e.docId)?.id ?? '',
        old,
        new: next,
        screen: str(slip.data.screen),
        file: str(slip.data.file),
        source: 'desk',
        ring: [...ring].sort(),
        look_row: null,
        marked_by: 'wendell',
        at,
        slip: slipId,
        event: e.docId,
      })
    } else if (d.kind === 'pencil') {
      const old = str(d.old)
      const next = str(d.new)
      if (!next || next === old) {
        bank.delete(e.docId)
        continue
      }
      bank.set(e.docId, {
        id: bank.get(e.docId)?.id ?? '',
        old,
        new: next,
        screen: str(d.screen),
        file: str(d.file),
        source: 'pencil',
        ring: [],
        look_row: str(d.look_row) || null,
        marked_by: 'wendell',
        at,
        slip: null,
        event: e.docId,
      })
    } else if (d.kind === 'stone') {
      const word = str(d.word).toLowerCase()
      const pick = str(d.pick)
      if (!word) throw new VoiceExportError(e.docId, 'stone has no word')
      if (pick === 'same-as') {
        const target = words.get(str(d.target).toLowerCase())
        if (!target) throw new VoiceExportError(e.docId, `same-as names "${str(d.target)}", which is not in the lexicon`)
        if (!target.struck_for.includes(word)) target.struck_for = [...target.struck_for, word].sort()
        target.at = day(at)
        continue
      }
      if (pick !== 'plain' && pick !== 'off') throw new VoiceExportError(e.docId, `stone pick "${pick}" is not plain, off or same-as`)
      if (pick === 'plain' && !str(d.plain).trim()) throw new VoiceExportError(e.docId, 'stoned needs a plain meaning')
      const entry: LexiconEntry = words.get(word) ?? {
        word,
        forms: [],
        plain: '',
        usage: '',
        status: 'proposed',
        shown_on: [],
        struck_for: [],
        drafted_by: 'agent:desk',
        marked_by: null,
        at: day(at),
        slip: null,
        screen: null,
      }
      if (pick === 'plain') {
        entry.status = 'stoned'
        entry.plain = str(d.plain).trim()
        if (str(d.usage).trim()) entry.usage = str(d.usage).trim()
      } else {
        entry.status = 'banned'
      }
      entry.marked_by = 'wendell'
      entry.at = day(at)
      entry.slip = str(d.slip) || entry.slip
      entry.screen = str(d.screen) || entry.screen
      words.set(word, entry)
    } else if (d.kind === 'bench') {
      const incoming = (d.faders ?? {}) as Record<string, unknown>
      const next = JSON.parse(JSON.stringify(chart.faders)) as Chart['faders']
      for (const axis of FADER_AXES) {
        const f = incoming[axis]
        const v = typeof f === 'number' ? f : typeof f === 'object' && f ? (f as { value?: unknown }).value : undefined
        if (v === undefined) continue
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 10) throw new VoiceExportError(e.docId, `fader "${axis}" must be 0 to 10`)
        next[axis].value = v
      }
      chart = { version: 1, set_by: 'wendell', at, faders: next }
    }
  }

  // Bank: sort by at then event, then give new lines ids in that order (<date>-<NNN>, counted per date).
  const lines = [...bank.values()].sort((a, b) => (a.at === b.at ? a.event.localeCompare(b.event) : a.at.localeCompare(b.at)))
  const perDay = new Map<string, number>()
  const used = new Set(lines.map((l) => l.id).filter(Boolean))
  for (const l of lines) {
    if (l.id) continue
    const date = day(l.at)
    let n = perDay.get(date) ?? 0
    let id: string
    do {
      n += 1
      id = `vb-${date}-${String(n).padStart(3, '0')}`
    } while (used.has(id))
    perDay.set(date, n)
    used.add(id)
    l.id = id
  }

  return {
    lexicon: { version: 1, words: [...words.values()].sort((a, b) => a.word.localeCompare(b.word)) },
    bank: lines,
    chart,
    screens: files.screens,
  }
}

// ── Files ────────────────────────────────────────────────────────────────────

const DUMP = { lineWidth: -1, noRefs: true, sortKeys: false, quotingType: '"' as const }

const LEX_KEYS: (keyof LexiconEntry)[] = ['word', 'forms', 'plain', 'usage', 'status', 'shown_on', 'struck_for', 'drafted_by', 'marked_by', 'at', 'slip', 'screen']
const BANK_KEYS: (keyof BankLine)[] = ['id', 'old', 'new', 'screen', 'file', 'source', 'ring', 'look_row', 'marked_by', 'at', 'slip', 'event']

function ordered<T extends object>(o: T, keys: (keyof T)[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of keys) out[k as string] = o[k] === undefined ? null : o[k]
  return out
}

export function serialize(files: VoiceFiles): { lexicon: string; bank: string; chart: string; screens: string } {
  return {
    lexicon: yaml.dump({ version: 1, words: files.lexicon.words.map((w) => ordered(w, LEX_KEYS)) }, DUMP),
    bank: files.bank.map((b) => JSON.stringify(ordered(b, BANK_KEYS))).join('\n') + (files.bank.length ? '\n' : ''),
    chart: yaml.dump(
      {
        version: 1,
        set_by: files.chart.set_by,
        at: files.chart.at,
        faders: Object.fromEntries(FADER_AXES.map((a) => [a, { value: files.chart.faders[a].value, low: files.chart.faders[a].low, high: files.chart.faders[a].high }])),
      },
      DUMP,
    ),
    screens: yaml.dump({ version: 1, screens: files.screens.screens.map((s) => ({ id: s.id, files: s.files, after: s.after })) }, DUMP),
  }
}

export function parse(text: { lexicon: string; bank: string; chart: string; screens: string }): VoiceFiles {
  const lexicon = yaml.load(text.lexicon, { schema: yaml.CORE_SCHEMA }) as Lexicon
  const chart = yaml.load(text.chart, { schema: yaml.CORE_SCHEMA }) as Chart
  const screens = yaml.load(text.screens, { schema: yaml.CORE_SCHEMA }) as Screens
  const bank = text.bank
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as BankLine)
  return { lexicon, bank, chart, screens }
}

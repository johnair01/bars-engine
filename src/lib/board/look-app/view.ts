/**
 * The look card that Claude draws beside the chat (MCP Apps), as plain data: what the card shows and what each of its
 * three moves saves. No database here, so the tests read it directly.
 *
 * The card is the Council Board's own look card moved into Claude (six-faces-council docs/specs/council-board-v2.md
 * section 1; council/aesthetic-contract.md rules 4, 5, 6 and 8). Each move saves `questions/<id>` the way the board's
 * draw table does (board/template.html `drAnswer`), so his answer from Claude is the same document as his answer from
 * the board, and the same ticket follows it:
 *   Claude Takes It: the recommended option, no note (dispatch-lever).
 *   Steer: another option and/or his note (steer-helm).
 *   Compost: why it stalled, what to keep, his note (compost-hatch).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export const LOOK_CARD_URI = 'ui://council-board/look-card.html'
export const BOARD_ORIGIN = 'https://bars-engine.vercel.app'

/** A face's rim, as the board draws it (`CD_TRIM` in six-faces-council board/template.html). */
export const FACE_TRIM: Record<string, string> = {
  shaman: '#d6408a', architect: '#e8873a', challenger: '#c8323a', regent: '#e0a22a', diplomat: '#3f9e5c', sage: '#2f9e9e',
}
export const FACE_NAME: Record<string, string> = {
  shaman: 'Shaman', architect: 'Architect', challenger: 'Challenger', regent: 'Regent', diplomat: 'Diplomat', sage: 'Sage',
}
/** Spec section 5's fixed stall reasons, with the board's words (`CD_STALLS`). */
export const STALLS: [string, string][] = [
  ['missing_context', 'Missing context'], ['wrong_mechanic', 'Wrong mechanic'], ['lost_charge', 'Lost charge'],
  ['superseded', 'Superseded by another project'], ['too_big', 'Too big for one card'],
  ['blocked_outside', 'Blocked by something outside the work'],
]
/** What is worth keeping from a composted look (`DR_KEEP`). */
export const KEEP: [string, string][] = [['idea', 'The idea'], ['research', 'The research'], ['look', 'The look'], ['nothing', 'Nothing']]
export const MOVES = ['claude_takes_it', 'steer', 'compost'] as const
export type Move = (typeof MOVES)[number]

type Opt = { v?: unknown; label?: unknown; c?: unknown; then?: unknown }
export type LookRow = Record<string, unknown>
export interface Answered { choice?: string; label?: string; steer?: string; savedAt?: string }

export interface LookOption { v: string; label: string; detail: string; recommended: boolean }
export interface LookView {
  id: string
  title: string
  why: string
  ask: string
  whyYou: string
  still: string
  href: string
  face: string
  faceName: string
  trim: string
  deck: string
  options: LookOption[]
  recommended: string
  compost: string
  max: number
  stalls: { v: string; label: string }[]
  keep: { v: string; label: string }[]
  answered: Answered | null
}

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
/** "A. Yes, the doors work (recommended)" reads as "Yes, the doors work". */
export const plainLabel = (l: unknown) =>
  s(l).replace(/\s*\(recommended\)\s*/i, '').replace(/^[A-Z]\.\s*/, '').replace(/^Claude takes it:\s*/i, '').trim()

/** Is this row a look? The same test as the board's picture gate (src/lib/board/session-write.ts `isLook`). */
export const rowIsLook = (id: string, row: LookRow | null) =>
  !!row && row.kind === 'questions' && (row.look === true || /-look-\d+$/.test(id))

/** A board picture link made whole: a row may carry `/board/stills/...`, which the card's sandbox cannot resolve. */
export function wholeUrl(u: unknown): string {
  const v = s(u)
  if (!v) return ''
  if (v.startsWith('/')) return BOARD_ORIGIN + v
  return /^https:\/\//.test(v) || /^data:image\//.test(v) ? v : ''
}

/** A deck name read from a list id: `calrunian-dojo` reads as "Calrunian Dojo". */
export const deckName = (list: unknown) =>
  s(list).split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

export function lookView(id: string, row: LookRow, answered: Answered | null): LookView {
  const opts = (Array.isArray(row.options) ? row.options : []) as Opt[]
  const recV = s(row.recommended) || s(opts.find((o) => /recommended/i.test(s(o.label)))?.v) || s(opts[0]?.v)
  const compost = s(opts.find((o) => /compost/i.test(s(o.label)))?.v)
  const faces = Array.isArray(row.faces) ? row.faces.map(s) : [s(row.faces)]
  const face = faces.find((f) => FACE_TRIM[f]) || 'sage'
  const max = Number(row.max)
  return {
    id,
    title: s(row.lookTitle) || s(row.title),
    why: s(row.why),
    ask: s(row.q),
    whyYou: s(row.why_you),
    still: wholeUrl(row.still),
    href: wholeUrl(row.href),
    face,
    faceName: FACE_NAME[face],
    trim: FACE_TRIM[face],
    deck: deckName(row.list) || 'Council Board',
    options: opts.filter((o) => s(o.v)).map((o) => ({
      v: s(o.v), label: plainLabel(o.label) || s(o.v), detail: s(o.c), recommended: s(o.v) === recV,
    })),
    recommended: recV,
    compost,
    max: Number.isInteger(max) && max > 1 ? max : 1,
    stalls: STALLS.map(([v, label]) => ({ v, label })),
    keep: KEEP.map(([v, label]) => ({ v, label })),
    answered,
  }
}

/** What a seal press sends. `choice` is an option's v; `keep` holds KEEP values. */
export interface MoveInput { move?: unknown; choice?: unknown; choices?: unknown; note?: unknown; stall?: unknown; keep?: unknown }

/**
 * The `questions/<id>` document one move saves, or the sentence that refuses it. The shapes match the board's
 * `drAnswer` calls, so the ticket and the ready-drafts step read it as they read a board answer. `via` names where he
 * pressed it, so the record can tell Claude's card from the board.
 */
export function answerBody(view: LookView, input: MoveInput, via: string, now = new Date()):
  { body: Record<string, unknown> } | { error: string } {
  const move = s(input.move) as Move
  if (!MOVES.includes(move)) return { error: 'move is claude_takes_it, steer or compost' }
  const note = s(input.note).slice(0, 2000)
  const known = new Set(view.options.map((o) => o.v))
  const labelOf = (v: string) => view.options.find((o) => o.v === v)?.label ?? v
  const base = { savedAt: now.toISOString(), via }
  if (move === 'claude_takes_it') {
    if (!view.recommended) return { error: `${view.id} names no recommended option, so Claude Takes It has nothing to take` }
    return { body: { choice: view.recommended, steer: '', ...base } }
  }
  if (move === 'steer') {
    const many = Array.isArray(input.choices) ? input.choices.map(s).filter(Boolean) : []
    const choices = view.max > 1 ? many.slice(0, view.max) : []
    const choice = s(input.choice) || choices[0] || ''
    for (const c of [choice, ...choices].filter(Boolean))
      if (!known.has(c)) return { error: `${c} is not one of this look's options` }
    if (!choice && !note) return { error: 'Steer needs a way picked or a note' }
    const steer = note || `Steer: ${(choices.length ? choices : [choice]).map(labelOf).join('; ')}.`
    return { body: { choice, steer, ...(choices.length ? { choices } : {}), ...base } }
  }
  const stall = STALLS.find(([v]) => v === s(input.stall))
  if (!stall) return { error: 'Compost needs why it stalled: one of ' + STALLS.map(([v]) => v).join(', ') }
  const keep = (Array.isArray(input.keep) ? input.keep.map(s) : [])
    .map((v) => KEEP.find(([k]) => k === v)?.[1]).filter((v): v is string => !!v)
  const steer = `Compost. Stalled: ${stall[1]}.` + (keep.length ? ` Keep: ${keep.join(', ').toLowerCase()}.` : '')
    + (note ? ` Note: ${note}` : '')
  return { body: { choice: view.compost, steer, ...base } }
}

/** The line a tool answers once a move saved, in plain words. */
export function savedLine(view: LookView, body: Record<string, unknown>): string {
  const choice = s(body.choice)
  const label = view.options.find((o) => o.v === choice)?.label ?? ''
  const steer = s(body.steer)
  if (steer.startsWith('Compost.')) return `Wendell composted ${view.id}. ${steer}`
  return `Wendell answered ${view.id}: ${label || 'Steer only'}${steer ? `, with the note: "${steer}"` : ''}.`
}

// ── Elicitation (MCP 2026-07-28, multi round-trip requests) ─────────────────────────────────────────────────────────

export interface ElicitModes { form: boolean; url: boolean }

/**
 * Which elicitation modes the client said it takes on this request. The 2026-07-28 protocol carries the client's
 * capabilities on every request in `_meta`, and a server may not infer them from an earlier one. An empty
 * `elicitation: {}` means form mode only, as it did in 2025-11-25.
 */
export function elicitModes(params: Record<string, unknown>): ElicitModes {
  const meta = params._meta && typeof params._meta === 'object' ? params._meta as Record<string, unknown> : {}
  const caps = meta['io.modelcontextprotocol/clientCapabilities']
  const e = caps && typeof caps === 'object' ? (caps as Record<string, unknown>).elicitation : undefined
  if (!e || typeof e !== 'object') return { form: false, url: false }
  const keys = Object.keys(e)
  return { form: keys.length === 0 || 'form' in e, url: 'url' in e }
}

/** The client's answers to an earlier input_required result, keyed as the server asked. */
export function inputResponses(params: Record<string, unknown>): Record<string, { action?: string; content?: Record<string, unknown> }> {
  const r = params.inputResponses
  return r && typeof r === 'object' && !Array.isArray(r) ? r as never : {}
}

const STATE_TTL_MS = 30 * 60 * 1000
const b64 = (v: string) => Buffer.from(v, 'utf8').toString('base64url')

/**
 * The opaque `requestState` the client echoes back. It decides what gets saved or removed, so the spec asks for its
 * integrity: an HMAC under the council key, bound to the tool, the target and a 30-minute expiry.
 */
export function signState(payload: Record<string, unknown>, secret: string, now = Date.now()): string {
  const body = b64(JSON.stringify({ ...payload, exp: now + STATE_TTL_MS }))
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`
}

export function readState(state: unknown, secret: string, now = Date.now()): Record<string, unknown> | null {
  if (typeof state !== 'string' || !state.includes('.')) return null
  const [body, mac] = state.split('.', 2)
  const want = createHmac('sha256', secret).update(body).digest()
  let got: Buffer
  try { got = Buffer.from(mac, 'base64url') } catch { return null }
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>
    return typeof data.exp === 'number' && data.exp > now ? data : null
  } catch { return null }
}

const COMPOST = '__compost'

/** The form his answer takes when Claude asks in chat instead of drawing the card. */
export function answerForm(view: LookView) {
  const ways = [
    ...view.options.map((o) => ({ const: o.v, title: `${o.label}${o.recommended ? ' (Claude takes it)' : ''}` })),
    ...(view.compost ? [] : [{ const: COMPOST, title: 'Compost it' }]),
  ]
  const picture = view.still ? `\n\nThe picture: ${view.href || view.still}` : ''
  return {
    method: 'elicitation/create',
    params: {
      mode: 'form',
      message: `${view.title || view.ask}\n\n${view.ask}${picture}`,
      requestedSchema: {
        type: 'object',
        properties: {
          answer: { type: 'string', title: 'Your answer', oneOf: ways },
          note: { type: 'string', title: 'A note in your words (optional)', maxLength: 2000 },
          stall: { type: 'string', title: 'If you compost it: why did it stall?', oneOf: STALLS.map(([v, l]) => ({ const: v, title: l })) },
        },
        required: ['answer'],
      },
    },
  }
}

/** His form answer as a move: the recommended option is Claude Takes It, a compost option is Compost, any other is Steer. */
export function moveFromForm(view: LookView, content: Record<string, unknown>): MoveInput {
  const answer = s(content.answer)
  const note = s(content.note)
  if (answer === COMPOST || (view.compost && answer === view.compost)) return { move: 'compost', stall: content.stall, note }
  if (answer === view.recommended && !note) return { move: 'claude_takes_it' }
  return { move: 'steer', choice: answer, note }
}

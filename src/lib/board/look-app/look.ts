import 'server-only'
import { db } from '@/lib/db'
import { latestDoc } from '@/lib/board/store'
import { applyWrite, validateSave } from '@/lib/board/save'
import { listOpen, readAnswers } from '@/lib/board/mcp-reads'
import { ticketFromSave } from '@/lib/work/from-save'
import { wakePickupAfter } from '@/lib/work/wake'
import { readyDraftsAfterSave } from '@/lib/board/ready-drafts'
import type { AnswerDoc, RowDoc } from '@/lib/work/ticket'
import { lookCardHtml } from './card-html'
import {
  BOARD_ORIGIN, LOOK_CARD_URI, answerBody, answerForm, elicitModes, inputResponses, lookView, moveFromForm, readState,
  rowIsLook, savedLine, signState, type Answered, type LookRow, type LookView, type MoveInput,
} from './view'

/**
 * The board MCP's look card (MCP Apps) and its asks (elicitation). Three tools:
 *   show_look   draws an open look beside the chat, with its picture and the three moves (the model calls it).
 *   answer_look saves the move he pressed on that card (only the card calls it: `_meta.ui.visibility: ["app"]`).
 *   ask_look    asks him for his answer in a form, for a client that takes elicitation and draws no app.
 * remove_live_file asks him to confirm first, when the client takes elicitation (confirmRemove).
 *
 * His answers are his to save, never a session's (src/lib/board/session-write.ts). So nothing here lets a model write
 * an answer: answer_look is hidden from the model, and ask_look saves only what his own form returns.
 */

/** A tool's whole result, as the route sends it: a plain result, or a 2026-07-28 input_required result. */
export type AppResult = Record<string, unknown>

const text = (t: string) => ({ type: 'text', text: t })
const done = (t: string, extra: Record<string, unknown> = {}): AppResult => ({ content: [text(t)], isError: false, ...extra })
const refuse = (t: string): AppResult => ({ content: [text(t)], isError: true })

/** The card's page and what the host's sandbox must let it load: the board's pictures and the card's three fonts. */
export const LOOK_CARD_META = {
  ui: {
    csp: {
      resourceDomains: [BOARD_ORIGIN, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      connectDomains: [],
    },
    prefersBorder: false,
  },
}

export const LOOK_RESOURCE = {
  uri: LOOK_CARD_URI,
  name: 'look-card',
  title: 'Look card',
  description: 'An open look from the Council Board as the game\'s 5:7 card: the picture, the ask, and three wax seals.',
  mimeType: 'text/html;profile=mcp-app',
  _meta: LOOK_CARD_META,
}

export function readLookResource(uri: string) {
  if (uri !== LOOK_CARD_URI) return null
  return { contents: [{ uri, mimeType: LOOK_RESOURCE.mimeType, text: lookCardHtml(), _meta: LOOK_CARD_META }] }
}

const LOOK_ID = { type: 'string', description: 'The look row\'s id, e.g. `cd-dojo-doors-look-1`. Leave it out for the newest open look.' }

export const LOOK_TOOLS = [
  {
    name: 'show_look',
    title: 'Show him a look',
    description: 'Draw one look from the Council Board beside the chat as its card: the picture, the ask, and the three '
      + 'moves (Claude Takes It, Steer, Compost). When Wendell presses a seal, the card saves his answer to the store '
      + 'itself; do not answer for him. With no id it draws the newest open look. In a client that draws no apps, the '
      + 'text names the look, its options and its picture link.',
    inputSchema: { type: 'object', properties: { id: LOOK_ID } },
    annotations: { readOnlyHint: true },
    _meta: { ui: { resourceUri: LOOK_CARD_URI }, 'ui/resourceUri': LOOK_CARD_URI },
  },
  {
    name: 'answer_look',
    title: 'Save the move he pressed',
    description: 'Only the look card calls this, when Wendell presses one of its seals. It saves his move on the look '
      + 'to the store, as the board does. A model never calls it: his answers are his.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        move: { type: 'string', enum: ['claude_takes_it', 'steer', 'compost'] },
        choice: { type: 'string' },
        choices: { type: 'array', items: { type: 'string' } },
        note: { type: 'string', maxLength: 2000 },
        stall: { type: 'string' },
        keep: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'move'],
    },
    _meta: { ui: { resourceUri: LOOK_CARD_URI, visibility: ['app'] } },
  },
  {
    name: 'ask_look',
    title: 'Ask him a look in chat',
    description: 'Ask Wendell for his answer to one look through a form in the chat (elicitation), for a client that '
      + 'takes it. His form answer is saved as his. In a client that draws apps, show_look is better: it shows the '
      + 'picture. With no id it asks the newest open look.',
    inputSchema: { type: 'object', properties: { id: LOOK_ID } },
  },
]

/** The look to draw: the id named, or the newest open question row that is a look. */
async function findLook(rawId: unknown): Promise<{ id: string; row: LookRow } | { error: string }> {
  const id = typeof rawId === 'string' ? rawId.trim() : ''
  if (id) {
    const row = await latestDoc('council', 'rows', id) as LookRow | null
    if (!row) return { error: `${id}: no row by that id on the Council Board` }
    if (!rowIsLook(id, row)) return { error: `${id} is a board row but not a look (no picture to show). read_rows shows it.` }
    return { id, row }
  }
  const open = await listOpen(50)
  for (const q of open.questions) {
    const row = await latestDoc('council', 'rows', q.id) as LookRow | null
    if (rowIsLook(q.id, row)) return { id: q.id, row: row as LookRow }
  }
  return { error: 'No look is open on the Council Board right now.' }
}

async function answeredOf(id: string): Promise<Answered | null> {
  const [a] = await readAnswers([id])
  return a?.state === 'answered' ? { choice: a.choice, label: a.label, steer: a.steer, savedAt: a.savedAt } : null
}

async function viewOf(rawId: unknown): Promise<LookView | { error: string }> {
  const found = await findLook(rawId)
  if ('error' in found) return found
  return lookView(found.id, found.row, await answeredOf(found.id))
}

/** The look as words, for the model and for a client that draws no app. */
function lookText(v: LookView): string {
  const ways = v.options.map((o) => `${o.v}. ${o.label}${o.recommended ? ' (recommended)' : ''}`).join('\n')
  const state = v.answered
    ? `\n\nAlready answered${v.answered.savedAt ? ` at ${v.answered.savedAt}` : ''}: ${v.answered.label || v.answered.choice || 'a note'}`
      + (v.answered.steer ? `, with the note "${v.answered.steer}"` : '') + '.'
    : '\n\nThe card is drawn beside the chat. Wait for his press; the card saves it.'
  return `${v.title || v.id} (${v.id}, ${v.deck}, held by the ${v.faceName})\n\n${v.ask}\n\n${ways}`
    + (v.still ? `\n\nPicture: ${v.still}` : '') + (v.href ? `\nOpen it: ${v.href}` : '') + state
}

/** Save his answer as the board's POST /api/board/saves does: one document, then the ticket, the wake and the drafts. */
async function saveAnswer(view: LookView, body: Record<string, unknown>): Promise<AppResult> {
  if (await latestDoc('council', 'questions', view.id))
    return refuse(`${view.id} is already answered, so this move was not saved. The board keeps his first answer.`)
  const v = validateSave({ board: 'council', collection: 'questions', docId: view.id, mode: 'set', data: body })
  if (!v.ok) return refuse(`${view.id}: the store refused the answer (${v.errors.join('; ')})`)
  const doc = applyWrite(null, v.save)
  const saved = await db.boardSave.create({
    data: { board: 'council', collection: 'questions', docId: view.id, recordedAt: new Date(),
            record: 'board state; not recorded on main', data: doc as object },
    select: { receivedAt: true },
  })
  const work = await ticketFromSave(db, 'council', 'questions', view.id, doc)
  if (work?.created && work.lane === 'claude' && work.state !== 'held') wakePickupAfter(`answer to ${view.id}`)
  const row = await latestDoc('council', 'rows', view.id) as RowDoc | null
  readyDraftsAfterSave('council', 'questions', view.id, doc as AnswerDoc, row)
  const line = savedLine(view, doc)
  return done(line, { structuredContent: { saved: true, id: view.id, line, receivedAt: saved.receivedAt, work: work ?? null } })
}

export async function showLook(args: Record<string, unknown>): Promise<AppResult> {
  const v = await viewOf(args.id)
  if ('error' in v) return refuse(v.error)
  return done(lookText(v), { structuredContent: v, _meta: { ui: { resourceUri: LOOK_CARD_URI } } })
}

export async function answerLook(args: Record<string, unknown>): Promise<AppResult> {
  const id = typeof args.id === 'string' ? args.id.trim() : ''
  if (!id) return refuse('answer_look needs the id of the look the card shows')
  const v = await viewOf(id)
  if ('error' in v) return refuse(v.error)
  const made = answerBody(v, args as MoveInput, 'claude-look-card')
  if ('error' in made) return refuse(made.error)
  return saveAnswer(v, made.body)
}

/**
 * ask_look over the 2026-07-28 multi round-trip shape. The first call answers `input_required` with his form; the
 * client asks him and calls again with `inputResponses` and the `requestState` it was given, and that call saves.
 * A client that takes only URL mode gets the board's link; one that takes neither gets the look as words.
 */
export async function askLook(args: Record<string, unknown>, params: Record<string, unknown>, secret: string): Promise<AppResult> {
  const replies = inputResponses(params)
  if (Object.keys(replies).length || params.requestState !== undefined) {
    const state = readState(params.requestState, secret)
    if (!state || state.t !== 'ask_look' || typeof state.id !== 'string')
      return refuse('ask_look: that answer came back without a valid request state (or after 30 minutes). Ask again.')
    const v = await viewOf(state.id)
    if ('error' in v) return refuse(v.error)
    const open = replies.open
    if (open) {
      const now = await answeredOf(v.id)
      return done(now ? `He answered on the board: ${now.label || now.choice || 'a note'}.`
        : `${v.id} is still open; he did not answer it on the board.`)
    }
    const reply = replies.answer
    if (!reply || reply.action !== 'accept' || !reply.content)
      return done(`He put ${v.id} down without answering. Nothing was saved, and the look stays open on the board.`)
    const move = moveFromForm(v, reply.content)
    if (move.move === 'compost' && !move.stall) {
      return {
        resultType: 'input_required',
        inputRequests: { answer: answerForm(v) },
        requestState: signState({ t: 'ask_look', id: v.id }, secret),
      }
    }
    const made = answerBody(v, move, 'claude-ask-form')
    if ('error' in made) return refuse(made.error)
    return saveAnswer(v, made.body)
  }
  const v = await viewOf(args.id)
  if ('error' in v) return refuse(v.error)
  if (v.answered) return done(lookText(v))
  const modes = elicitModes(params)
  const requestState = signState({ t: 'ask_look', id: v.id }, secret)
  if (modes.form) return { resultType: 'input_required', inputRequests: { answer: answerForm(v) }, requestState }
  if (modes.url) {
    return {
      resultType: 'input_required',
      inputRequests: { open: { method: 'elicitation/create', params: {
        mode: 'url', message: `Answer "${v.title || v.ask}" on the Council Board.`, url: `${BOARD_ORIGIN}/board/council`,
      } } },
      requestState,
    }
  }
  return done(lookText(v).replace('The card is drawn beside the chat. Wait for his press; the card saves it.',
    'This client cannot ask him in a form. Call show_look where apps draw, or he answers on the board.'))
}

/**
 * The confirm step before remove_live_file. Null means go ahead: the client confirmed, or it takes no elicitation (the
 * box agents and older clients keep working as before, and revert_live_file still brings a file back).
 */
export function confirmRemove(args: Record<string, unknown>, params: Record<string, unknown>, secret: string): AppResult | null {
  const path = typeof args.path === 'string' ? args.path.trim() : ''
  const replies = inputResponses(params)
  if (Object.keys(replies).length || params.requestState !== undefined) {
    const state = readState(params.requestState, secret)
    if (!state || state.t !== 'remove_live_file' || state.path !== path)
      return refuse('remove_live_file: that confirm came back without a valid request state for this path. Nothing was removed.')
    const r = replies.confirm
    if (r?.action === 'accept' && r.content?.remove === true) return null
    return done(`Not removed: ${path} stays live.`)
  }
  if (!path || !elicitModes(params).form) return null
  return {
    resultType: 'input_required',
    inputRequests: { confirm: { method: 'elicitation/create', params: {
      mode: 'form',
      message: `Remove ${path} from the live site? Players lose it at once. revert_live_file can bring it back.`,
      requestedSchema: { type: 'object', properties: { remove: { type: 'boolean', title: 'Yes, remove it' } }, required: ['remove'] },
    } } },
    requestState: signState({ t: 'remove_live_file', path }, secret),
  }
}

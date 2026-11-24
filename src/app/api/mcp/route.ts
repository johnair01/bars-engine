/**
 * The Council Board's MCP server (six-faces-council docs/mcp-board.md).
 *
 * One https endpoint every environment can mount — FreeMilk, Claude Code, Codex, Cursor, Gemini, Freebuff — for the
 * rows, pictures and board documents that used to need a shell. It speaks the Streamable HTTP transport's JSON shape
 * and holds no package of its own: a client POSTs JSON-RPC, this route answers JSON, and a row goes through the same
 * `sessionWrite` call as POST /api/board/session-writes, so the row rule, the picture gate and the seal are the board's
 * own and a refused row comes back with the sentence that refused it.
 *
 * Pictures are stored by their sha256 (src/lib/board/picture-store.ts) and named at
 * `/board/stills/sha/<sha256>.<ext>`, the link the seal reads. The art index beside the manifest lets a client with no
 * checkout list what the server stored; council/callsheets/stills/ART.jsonl on main stays the record.
 *
 * Auth is COUNCIL_MENU_TOKEN, as `Authorization: Bearer <key>`, a bare header or `?token=`, the same three shapes
 * src/lib/council/token.ts reads for every other council call.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { givenToken, tokenMatches } from '@/lib/council/token'
import { createHash } from 'node:crypto'
import { sessionWrite, type SessionDoc } from '@/lib/board/session-write'
import { steerTicket } from '@/lib/work/queue'
import { latestDoc } from '@/lib/board/store'
import { decodePicture, valueAt } from '@/lib/board/pictures'
import { checkVisible, listOpen, readAnswers } from '@/lib/board/mcp-reads'
import { closeRead, closeSay } from '@/lib/close/chat'
import { isText, listLiveFiles, livePathError, liveUrl, putLiveFile, readLiveFile, removeLiveFile, revertLiveFile, type PutResult } from '@/lib/live/store'
import { listPictures, liftInlinePictures, readPictureBytes, shaFromUrl, storePicture, type StoredPicture }
  from '@/lib/board/picture-store'
import {
  assetBrief, canonBlock, evaluateMechanic, faceLens, nextLines, ontologyProfile, pipelineNext, pipelineStatus,
  readLoop, refusalLines, statusLines, verifyRound,
} from '@/lib/board/pipeline'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SERVER_NAME = 'council-board'
const SERVER_VERSION = '1.6.0'
const MAX_LIVE_FILES = 50
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_ROWS = 100
const MAX_IDS = 50
const MAX_DOCS = 50
const DESIGN_FACES = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage']
const BOARD_DOC_COLLECTIONS = new Set(['lists', 'steps', 'contacts', 'shows', 'records'])

type RpcId = string | number | null
type ToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
type ToolResult = { content: ToolContent[]; isError: boolean }

const text = (value: unknown): ToolContent => ({
  type: 'text',
  text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
})
const ok = (value: unknown): ToolResult => ({ content: [text(value)], isError: false })
const bad = (message: string): ToolResult => ({ content: [text(message)], isError: true })
const pictureContent = (bytes: Uint8Array, type: string): ToolContent =>
  ({ type: 'image', data: Buffer.from(bytes).toString('base64'), mimeType: type })

const STRAND = {
  type: 'string',
  description: "The strand's name, as council/loops/<strand>.json carries it, e.g. `hand-grip`.",
}

function strandOf(args: Record<string, unknown>): { strand: string } | { error: string } {
  const raw = args.strand
  const strand = typeof raw === 'string' ? raw.trim() : ''
  if (!strand) return { error: 'this tool needs strand: a strand name, e.g. `hand-grip`' }
  if (!/^[A-Za-z0-9._-]+$/.test(strand))
    return { error: `${strand}: a strand name is letters, digits, dot, dash or underscore` }
  return { strand }
}

/** The row's own fields, which `rowErrors` (src/lib/board/rows.ts) checks: `kind`, `pass`, `lane` and the list's. */
const ROW_DATA = {
  type: 'object',
  description: "One row: kind is its board list (positions, questions, terms, causes, battles); pass names the pass that "
    + 'posted it; lane names the environment that posted it; then the list\'s fields — a position needs faces and pos, a '
    + "question needs faces, q and options (each with v and label), a term needs term and plain, a cause needs desc, a "
    + 'battle needs name and rounds. A row\'s id is its docId, never a field. An inline `data:image` picture in '
    + '`still`, `image_url`, `files[].src` or `examples[].src` is stored first and the row keeps its link.',
  additionalProperties: true,
}

const TOOLS = [
  {
    name: 'post_rows',
    title: 'Post Council Board rows',
    description: 'Post rows to the Council Board, one document per row, lifting any inline picture to a stored link. '
      + 'The board shows them at its next load, and no pull request carries them. A row that fails the row rule or the '
      + 'picture gate is refused with its reason.',
    inputSchema: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          minItems: 1,
          maxItems: MAX_ROWS,
          description: 'The rows to post.',
          items: {
            type: 'object',
            properties: {
              docId: { type: 'string', description: "The row's id, e.g. `fnl-look-2`." },
              data: ROW_DATA,
            },
            required: ['docId', 'data'],
          },
        },
        dry: { type: 'boolean', description: 'true checks every row and writes nothing.' },
      },
      required: ['docs'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'read_rows',
    title: 'Read Council Board rows',
    description: 'Read board rows by id, as the store holds them. Use it after post_rows to see what landed.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', minItems: 1, maxItems: MAX_IDS, items: { type: 'string' }, description: 'The row ids to read.' },
        collection: { type: 'string', description: 'The collection to read, `rows` unless given.' },
      },
      required: ['ids'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'put_picture',
    title: 'Store a board picture',
    description: 'Store one picture under its sha256 and answer the link the board serves it at: '
      + '`https://bars-engine.vercel.app/board/stills/sha/<sha256>.<ext>`, which the seal accepts. One picture per call, '
      + 'under 3 MB decoded, as png, jpeg, gif or webp.',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'The picture as base64, or as a data:image/...;base64 URI.' },
        type: { type: 'string', description: 'image/png, image/jpeg, image/gif or image/webp; read from a data URI when absent.' },
        round: { type: 'string', description: 'The stills round it belongs to, e.g. `2026-11-12-farm-build-1`.' },
        maker: { type: 'string', description: 'The thread or lane that made it.' },
        path: {
          type: 'string',
          description: 'Optional repo path under council/callsheets/stills/; a path holding /refs/ goes to the private refs '
            + 'namespace instead of /board/stills.',
        },
      },
      required: ['data'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'read_picture',
    title: 'See a board picture',
    description: 'Answer one stored picture as image content, by its sha256 or by the row and field that names it, so a '
      + 'client can look at the frame instead of trusting a link.',
    inputSchema: {
      type: 'object',
      properties: {
        sha: { type: 'string', description: 'The sha256, or the board URL that names it.' },
        docId: { type: 'string', description: 'A row or step whose field holds the picture.' },
        field: { type: 'string', description: 'The field that holds it, e.g. `still`.' },
        collection: { type: 'string', description: '`rows` unless given.' },
        type: { type: 'string', description: 'The mime type, when the store does not hold one.' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'list_pictures',
    title: 'List a round\'s pictures',
    description: 'List what the store holds for a round or for every round: sha, type, size and the link, from the art '
      + 'index and the content manifest.',
    inputSchema: {
      type: 'object',
      properties: {
        round: { type: 'string', description: 'The stills round, or nothing for every picture.' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'post_board_docs',
    title: 'Write board documents',
    description: 'Write Your steps lists and steps, Outreach contacts and shows, and the council\'s records, through the '
      + 'same sessionWrite call as POST /api/board/session-writes. Rows stay with post_rows.',
    inputSchema: {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          minItems: 1,
          maxItems: MAX_DOCS,
          items: {
            type: 'object',
            properties: {
              collection: { type: 'string', description: 'lists, steps, contacts, shows or records.' },
              docId: { type: 'string' },
              mode: { type: 'string', description: 'set writes the document whole; update merges onto the stored one.' },
              data: { type: 'object', additionalProperties: true },
            },
            required: ['collection', 'docId', 'data'],
          },
        },
        dry: { type: 'boolean' },
      },
      required: ['docs'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'list_tickets',
    title: 'List work tickets',
    description: 'List the work tickets the lanes hold (newest first, up to 100), so a client can find the id to steer. '
      + 'Filter by `lane` (claude, freebuff, deepai) and `state` (ready, claimed, held, done, failed).',
    inputSchema: {
      type: 'object',
      properties: { lane: { type: 'string' }, state: { type: 'string' } },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'pipeline_status',
    title: 'Where a strand stands',
    description: 'Answer a strand\'s callsheet, the stage it has signed, the open gaps the loop reports and the next gate, '
      + 'in 40 lines or fewer, each fact naming the file it came from.',
    inputSchema: {
      type: 'object',
      properties: { strand: STRAND },
      required: ['strand'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'read_answers',
    title: 'Read his answers',
    description: 'Read what Wendell answered for each board row, live from the store: state (answered, open or unknown id), '
      + 'his choice, the option label, his steer note, and when he saved it. Use it before saying anything waits on him.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', minItems: 1, maxItems: MAX_IDS, items: { type: 'string' }, description: 'The question row ids.' },
      },
      required: ['ids'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'pipeline_next',
    title: 'The next gate',
    description: 'Answer the one stage a strand moves to next: its gate and the command that runs it.',
    inputSchema: {
      type: 'object',
      properties: { strand: STRAND },
      required: ['strand'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'loop_checks',
    title: 'A strand\'s checks',
    description: 'Answer council/loops/<strand>.json\'s deft block: each check\'s id, his note quoted, the look it came '
      + 'from, what it reads, its bound, and whether it holds or only reports.',
    inputSchema: {
      type: 'object',
      properties: { strand: STRAND },
      required: ['strand'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'asset_brief',
    title: 'What one round owes',
    description: 'Answer the brief for a strand\'s round as markdown: the node type, the place\'s floors, the reference '
      + 'frames with his answers, the order the callsheet\'s NEXT steps give, the proof command and the emits list.',
    inputSchema: {
      type: 'object',
      properties: {
        strand: STRAND,
        node: { type: 'string', description: 'The node type, e.g. `hall`; the checks that meet it are named.' },
      },
      required: ['strand'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'check_visible',
    title: 'Check a row will show',
    description: 'For each row id, say whether the Council Board page will draw it and where (Open, Your eyes, a battle), '
      + 'or why not (answered, settled, wrong kind, superseded). It runs the same data merge and status rule as the page. '
      + 'Run it after post_rows: nobody may say a row is on the board without this answer.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', minItems: 1, maxItems: MAX_IDS, items: { type: 'string' }, description: 'The row ids just posted.' },
      },
      required: ['ids'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'asset_verify',
    title: 'Judge a round before it posts',
    description: 'Read the round\'s judge.json receipt and refuse a round whose receipt is missing, belongs to another '
      + 'strand, predates a check the loop runs now, or holds; a held round comes back with the failing check and his '
      + 'sentence. A clear round answers the judge line.',
    inputSchema: {
      type: 'object',
      properties: {
        strand: STRAND,
        round: { type: 'string', description: 'The round folder, e.g. `2026-11-09-cc-gate-look-13`.' },
      },
      required: ['strand', 'round'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'list_open',
    title: 'List what is open',
    description: 'List what waits: unanswered question rows (newest first), battles with an open turn, and the ready work '
      + 'tickets per lane with their brief and owner lane. Rows posted before the store kept them may be missing.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 200, description: 'Most questions and battle turns to list; 50 unless given.' } },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'canon_lookup',
    title: 'One canon block',
    description: 'Answer one canon/mechanics file or one rule in canon/play-canon.md: its rule, the words he is quoted '
      + 'saying, the ask that remains, and the file:line it came from.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: '`lading-seal`, or a rule\'s title, e.g. `Hard magic`.' } },
      required: ['name'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'steer_ticket',
    title: 'Steer a ticket to another lane',
    description: 'The same move as the harbour page\'s lantern drag (POST /api/work/:id/steer), written to the store at '
      + 'once: send a ready or held ticket to the lane `lane` (claude, freebuff, deepai), or pass `hold` to hold it back. '
      + 'A claimed ticket is its crew\'s and is refused.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The ticket id, from list_tickets.' },
        lane: { type: 'string', description: 'claude, freebuff, deepai, or hold.' } },
      required: ['id', 'lane'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'close_read',
    title: 'Read the evening close',
    description: 'Show the closing ritual for a date (today in Pacific time unless given), at the move it is on: the same text the board page draws, then what a reply may say. Starts the close from the day\'s work tickets if none exists.',
    inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD; today if omitted.' } } },
    annotations: { readOnlyHint: false },
  },
  {
    name: 'close_say',
    title: 'Say one thing in the evening close',
    description: 'Apply one reply to the close: a sentence at the glass move, "p4 t3 w5" ratings, "win <id> <1-5>", three lines at the unpacking move, "keep <n>", "push <n>: <reason>", "lantern <n>", "next", "skip", "send <n>" at the lever. Returns the next screen. The lever sends one ticket to Zo per "send", and only after he says it.',
    inputSchema: { type: 'object', properties: { say: { type: 'string' }, date: { type: 'string' } }, required: ['say'] },
    annotations: { readOnlyHint: false },
  },
  {
    name: 'ontology_profile',
    title: 'What a task kind loads',
    description: 'Answer a load profile from ontology/manifest.yaml and the eleven design-ontology fields the stage owes.',
    inputSchema: {
      type: 'object',
      properties: { kind: { type: 'string', description: 'e.g. `game_design` or `council_deliberation`.' } },
      required: ['kind'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'mechanic_eval',
    title: 'A mechanic\'s arithmetic',
    description: 'Evaluate one canon/mechanics file at a state and show its arithmetic: each fader\'s value, its bounds, '
      + 'and whether the words it says appear in the feel line it names. The same two checks the tuning bench runs.',
    inputSchema: {
      type: 'object',
      properties: {
        mechanic: { type: 'string', description: 'The file\'s name, e.g. `lading-seal`.' },
        state: { type: 'object', additionalProperties: true, description: 'Fader key to number, e.g. {"press": 0.5}.' },
      },
      required: ['mechanic'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'faces_lens',
    title: 'The six lenses on a strand',
    description: 'Answer each face\'s lens, its standing test and the lessons whose own words bear on the strand, quoted '
      + 'from council/faces.yaml.',
    inputSchema: {
      type: 'object',
      properties: { strand: STRAND },
      required: ['strand'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'shaman_intake',
    title: 'The Shaman reads a doubt',
    description: 'Give the doubt in the player\'s own words. The Shaman answers what is moving underneath it and one '
      + 'small step to take today. Deterministic, no model call.',
    inputSchema: {
      type: 'object',
      properties: { doubt: { type: 'string', description: 'The doubt in his or her own words, e.g. `I do not think I am capable of building the thing that I want`.' } },
      required: ['doubt'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'put_live_files',
    title: 'Publish live game files',
    description: 'Publish a game prototype\'s files so they are live at once at https://bars-engine.vercel.app/live/<game>/<file>, '
      + 'with no pull request, no lint and no build. Each file is text or base64. Each answer names the earlier version, '
      + 'which revert_live_file brings back. The page runs sandboxed: it cannot use a player\'s sign-in.',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          minItems: 1,
          maxItems: MAX_LIVE_FILES,
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '`<game>/<file>`, e.g. `lantern-walk/index.html` or `lantern-walk/js/walk.js`.' },
              text: { type: 'string', description: 'The file as text (html, js, css, json, tmj, md, svg).' },
              base64: { type: 'string', description: 'The file as base64, for pictures, models, sound and wasm.' },
            },
            required: ['path'],
          },
        },
        by: { type: 'string', description: 'Who published it, e.g. `box:deepseek` or a thread name. Kept with the version.' },
      },
      required: ['files'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'read_live_file',
    title: 'Read a live game file',
    description: 'Read one live game file as it is served now: text for text files, base64 otherwise, with its sha.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: '`<game>/<file>`, e.g. `lantern-walk/index.html`.' } },
      required: ['path'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'list_live_files',
    title: 'List live game files',
    description: 'List the live games, or one game\'s files with each sha, size and time, and the earlier versions of each.',
    inputSchema: {
      type: 'object',
      properties: { game: { type: 'string', description: 'A game slug, e.g. `lantern-walk`. Leave out for every game.' } },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'revert_live_file',
    title: 'Revert a live game file',
    description: 'Point a live file back at one of its earlier versions (a sha list_live_files shows under history).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '`<game>/<file>`.' },
        sha: { type: 'string', description: 'The earlier version\'s sha256.' },
        by: { type: 'string', description: 'Who reverted it.' },
      },
      required: ['path', 'sha'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'remove_live_file',
    title: 'Remove a live game file',
    description: 'Stop serving a live file. Its versions stay, so revert_live_file brings it back.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: '`<game>/<file>`.' } },
      required: ['path'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'whoami',
    title: 'Which board this key reaches',
    description: 'Name the board, the server, the deployment and the tools, so a client can prove its key works.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
]

function refused(req: NextRequest): NextResponse | null {
  const secret = process.env.COUNCIL_MENU_TOKEN
  if (!secret) return NextResponse.json({ error: 'COUNCIL_MENU_TOKEN not configured' }, { status: 503, headers: NO_STORE })
  if (!tokenMatches(givenToken(req), secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })
  return null
}

function rpcResult(id: RpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers: NO_STORE })
}

function rpcError(id: RpcId, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { headers: NO_STORE })
}

/** A look is a design look when it carries `look` (or kind look) and names a face. */
function namesDesignFace(data: Record<string, unknown>): boolean {
  const faces = Array.isArray(data.faces) ? data.faces.join(' ') : typeof data.faces === 'string' ? data.faces : ''
  const named = faces.toLowerCase()
  return DESIGN_FACES.some((f) => named.includes(f))
}

function isDesignLook(data: Record<string, unknown>): boolean {
  if (!data.look && data.kind !== 'look') return false
  return namesDesignFace(data)
}

/** A lane's work receipt: a branch's own check and still, shown so he can see what moved. Not a design pass. */
function isLaneReceipt(data: Record<string, unknown>): boolean {
  return data.receipt === true
    && typeof data.lane === 'string' && data.lane.trim() !== ''
    && typeof data.pr === 'string' && data.pr.trim() !== ''
}

/** The sentence that refuses a design look without a sealed pass, or null when the look may be posted. */
async function unsealedPass(docId: string, data: Record<string, unknown>): Promise<string | null> {
  if (isLaneReceipt(data)) {
    if (namesDesignFace(data))
      return `${docId}: a lane receipt may not name design faces; it shows what a branch did, not what the design says. `
        + 'Drop `faces`, or post a design pass first (`python3 council/tools/pass_check.py <pass.md> --seal`).'
    return null
  }
  if (!isDesignLook(data)) return null
  const refuse = (why: string) =>
    `${docId}: this look names design faces, so it needs a pass that ran the design steps. ${why} `
    + 'Run `python3 council/tools/pass_check.py <pass.md> --seal`, then post the look with `pass: <pass id>`.'
  const passId = typeof data.pass === 'string' ? data.pass.trim() : ''
  if (!passId) return refuse('Its `pass` field is empty.')
  const pass = await latestDoc('council', 'records', passId)
  if (!pass || pass.kind !== 'pass' || typeof pass.body !== 'string')
    return refuse(`The records doc "${passId}" is not a stored pass.`)
  const check = await latestDoc('council', 'records', `pass-check-${passId}`)
  let sealed: { ok?: unknown; sha256?: unknown } = {}
  try { sealed = JSON.parse(typeof check?.body === 'string' ? check.body : '{}') } catch { /* unsealed */ }
  if (sealed.ok !== true) return refuse(`The pass "${passId}" has no passing pass-check record.`)
  if (sealed.sha256 !== createHash('sha256').update(pass.body, 'utf8').digest('hex'))
    return refuse(`The pass "${passId}" changed after it was sealed.`)
  return null
}

async function postRows(args: Record<string, unknown>): Promise<ToolResult> {
  const raw = args.docs
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ROWS)
    return bad(`post_rows takes docs: one {docId, data} per row, at least one and at most ${MAX_ROWS}`)
  const writes: SessionDoc[] = []
  const pictures: StoredPicture[] = []
  for (const entry of raw) {
    const doc = entry as Record<string, unknown> | null
    const docId = doc ? doc.docId : null
    if (typeof docId !== 'string' || !docId.trim())
      return bad("every row needs its docId, and a row's id is never a field of its data")
    const data = doc ? doc.data : null
    if (!data || typeof data !== 'object' || Array.isArray(data))
      return bad(`${docId}: data is the row itself, an object with kind, pass and its list's fields`)
    const unsealed = await unsealedPass(docId, data as Record<string, unknown>)
    if (unsealed) return bad(unsealed)
    const lifted = await liftInlinePictures(data, { maker: 'mcp' })
    if (lifted.error) return bad(`${docId}: ${lifted.error}`)
    pictures.push(...lifted.pictures)
    writes.push({ collection: 'rows', docId, mode: 'set', data: lifted.data })
  }
  const dry = args.dry === true
  const result = await sessionWrite(db, writes, dry)
  return ok({ board: 'council', dry, ...result, pictures })
}

async function readRows(args: Record<string, unknown>): Promise<ToolResult> {
  const ids = Array.isArray(args.ids)
    ? args.ids.filter((v): v is string => typeof v === 'string' && v.trim() !== '').slice(0, MAX_IDS)
    : []
  if (ids.length === 0) return bad('read_rows needs ids: the rows to read')
  const collection = typeof args.collection === 'string' && args.collection.trim() ? args.collection : 'rows'
  const found = await Promise.all(ids.map((id) => latestDoc('council', collection, id)))
  const docs = Object.fromEntries(ids.map((id, i) => [id, found[i]]))
  return ok({ board: 'council', collection, docs })
}

async function putPicture(args: Record<string, unknown>): Promise<ToolResult> {
  const data = typeof args.data === 'string' ? args.data : ''
  if (!data) return bad('put_picture needs data: the picture as base64 or as a data:image URI')
  const stored = await storePicture({
    data,
    type: typeof args.type === 'string' ? args.type : undefined,
    round: typeof args.round === 'string' ? args.round : undefined,
    maker: typeof args.maker === 'string' ? args.maker : 'mcp',
    path: typeof args.path === 'string' ? args.path : undefined,
  })
  if (stored.error || !stored.picture) return bad(stored.error ?? 'the picture was not stored')
  return ok(stored.picture)
}

async function readPicture(args: Record<string, unknown>): Promise<ToolResult> {
  const asked = typeof args.sha === 'string' ? args.sha.trim() : ''
  let sha = /^[0-9a-f]{64}$/i.test(asked) ? asked.toLowerCase() : shaFromUrl(asked) ?? ''

  if (!sha && typeof args.docId === 'string' && args.docId.trim() && typeof args.field === 'string' && args.field.trim()) {
    const collection = typeof args.collection === 'string' && args.collection.trim() ? args.collection : 'rows'
    const doc = await latestDoc('council', collection, args.docId)
    const held = doc ? valueAt(doc, args.field) : undefined
    if (typeof held === 'string') {
      sha = shaFromUrl(held) ?? ''
      if (!sha && held.startsWith('data:image')) {
        const decoded = decodePicture(held)
        if (decoded) return { content: [pictureContent(decoded.bytes, decoded.type)], isError: false }
        return bad(`${args.docId}: the picture at ${args.field} cannot be read`)
      }
    }
    if (!sha) return bad(`${args.docId} holds no stored picture at ${args.field}`)
  }
  if (!sha) return bad('read_picture needs a sha256, a board URL, or a docId and field')

  const got = await readPictureBytes(sha)
  if (!got) return bad(`the content store does not hold ${sha}`)
  const type = typeof args.type === 'string' && args.type.startsWith('image/') ? args.type : got.type
  return { content: [pictureContent(got.bytes, type)], isError: false }
}

async function listPicturesTool(args: Record<string, unknown>): Promise<ToolResult> {
  const round = typeof args.round === 'string' && args.round.trim() ? args.round.trim() : undefined
  return ok({ pictures: await listPictures(round) })
}

async function postBoardDocs(args: Record<string, unknown>): Promise<ToolResult> {
  const raw = args.docs
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_DOCS)
    return bad(`post_board_docs takes docs, at least one and at most ${MAX_DOCS}`)
  const writes: SessionDoc[] = []
  for (const entry of raw) {
    const doc = entry as Record<string, unknown> | null
    const collection = doc ? doc.collection : null
    const docId = doc ? doc.docId : null
    if (typeof collection !== 'string' || !BOARD_DOC_COLLECTIONS.has(collection))
      return bad(`a board document's collection is one of ${[...BOARD_DOC_COLLECTIONS].join(', ')}`)
    if (typeof docId !== 'string' || !docId.trim()) return bad(`${collection}: every document needs its docId`)
    const data = doc ? doc.data : null
    if (!data || typeof data !== 'object' || Array.isArray(data)) return bad(`${collection}/${docId}: data is the document`)
    const mode = doc && (doc.mode === 'set' || doc.mode === 'update') ? doc.mode : undefined
    writes.push(mode ? { collection, docId, mode, data } : { collection, docId, data })
  }
  const dry = args.dry === true
  const result = await sessionWrite(db, writes, dry)
  return ok({ board: 'council', dry, ...result })
}

async function listTickets(args: Record<string, unknown>): Promise<ToolResult> {
  const lane = typeof args.lane === 'string' && args.lane ? args.lane : undefined
  const state = typeof args.state === 'string' && args.state ? args.state : undefined
  const tickets = await db.workTicket.findMany({ where: { lane, state }, orderBy: { createdAt: 'desc' }, take: 100,
    select: { id: true, title: true, lane: true, lanes: true, state: true, claimedBy: true, attempts: true, createdAt: true } })
  return ok({ board: 'council', tickets })
}

async function steerTool(args: Record<string, unknown>): Promise<ToolResult> {
  if (typeof args.id !== 'string' || typeof args.lane !== 'string') return bad('steer_ticket needs id and lane')
  const r = await steerTicket(db, args.id, args.lane, 'mcp')
  if (!r.ok) return bad(r.error)
  return ok({ board: 'council', ticket: { id: r.ticket.id, state: r.ticket.state, lane: r.ticket.lane, lanes: r.ticket.lanes } })
}

async function pipelineStatusTool(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  return ok(statusLines(await pipelineStatus(s.strand)).join('\n'))
}

async function pipelineNextTool(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  return ok(nextLines(await pipelineNext(s.strand)).join('\n'))
}

async function loopChecks(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  const { path, loop, error } = await readLoop(s.strand)
  const deft = loop?.deft
  if (!deft)
    return bad(error ?? `${path} holds no deft loop; run python3 council/judge/make_loop.py ${s.strand}`)
  return ok({
    strand: s.strand,
    node_types: deft.node_types ?? [],
    place: deft.place ?? null,
    checks: (deft.checks ?? []).map((c) => ({
      id: c.id,
      note: c.note ?? '',
      look: c.look ?? null,
      reads: c.reads ?? {},
      bound: c.bound ?? '',
      holds: c.holds ?? 'no',
      holds_by_hold: c.holds_by_hold ?? null,
    })),
    emits: deft.emits ?? {},
    run: deft.run ?? null,
    source: path,
  })
}

async function assetBriefTool(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  const node = typeof args.node === 'string' ? args.node : undefined
  const r = await assetBrief(s.strand, node)
  if (!r.brief) return bad(r.error ?? `${s.strand}: the brief could not be read`)
  return ok(r.brief.brief)
}

async function assetVerify(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  const round = typeof args.round === 'string' ? args.round.trim() : ''
  if (!round) return bad('asset_verify needs round: the round folder, e.g. `2026-11-09-cc-gate-look-13`')
  const v = await verifyRound(s.strand, round)
  if (!v.ok) return bad(refusalLines(v).join('\n'))
  return ok({ ok: true, judge: v.judge, refused: [], registry: v.registry, source: v.source })
}

async function canonLookup(args: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof args.name === 'string' ? args.name : ''
  const r = await canonBlock(name)
  if (!r.block) return bad(r.error ?? `no canon block named ${name}`)
  return ok(r.block)
}

async function ontologyProfileTool(args: Record<string, unknown>): Promise<ToolResult> {
  const kind = typeof args.kind === 'string' ? args.kind : ''
  const p = await ontologyProfile(kind)
  if (p.error) return bad(p.error)
  return ok(p)
}

async function mechanicEval(args: Record<string, unknown>): Promise<ToolResult> {
  const mechanic = typeof args.mechanic === 'string' ? args.mechanic : ''
  const state = args.state && typeof args.state === 'object' && !Array.isArray(args.state)
    ? (args.state as Record<string, unknown>)
    : {}
  const r = await evaluateMechanic(mechanic, state)
  if (!r.result) return bad(r.error ?? `no mechanic named ${mechanic}`)
  return ok(r.result)
}

async function facesLens(args: Record<string, unknown>): Promise<ToolResult> {
  const s = strandOf(args)
  if ('error' in s) return bad(s.error)
  const l = await faceLens(s.strand)
  if (!l.faces.length)
    return bad(l.notes[0] ?? `${s.strand}: no face lens could be read from council/faces.yaml`)
  return ok(l)
}

type DoubtTheme = 'capable' | 'worthy' | 'enough' | 'belong' | 'other'
const DOUBT_THEMES: { theme: DoubtTheme; test: RegExp; moving: string; step: string }[] = [
  {
    theme: 'capable',
    test: /\b(capable|capability|can'?t build|cannot build|able to build|ability|skill|know how|figure (it )?out)\b/i,
    moving: 'Under this doubt sits a wish the size of a whole world, held next to a part of you that has not yet seen one finished piece of it. The wish is real. The doubt is a guard standing in front of it.',
    step: 'Pick the smallest piece of the thing you want that one afternoon could finish, and make only that piece today. Then put it where you can see it.',
  },
  {
    theme: 'worthy',
    test: /\b(worthy|deserve|allowed|right to|who am i)\b/i,
    moving: 'Under this doubt sits a question of permission: some part of you is waiting for a signature before it will begin. Nobody has been holding that pen but you.',
    step: 'Write one sentence that begins "I am giving myself leave to" and ends with a task small enough to finish today. Do that task before you sleep.',
  },
  {
    theme: 'enough',
    test: /\b(good enough|not enough|talent|measure up|mediocre|bad at|not good)\b/i,
    moving: 'Under this doubt sits a standard set by finished work you have only seen from the outside. Every maker you admire went through a stretch of work they were ashamed of.',
    step: 'Make one rough version of the thing in twenty minutes and call it a first draft. Keep it, and do not fix it today.',
  },
  {
    theme: 'belong',
    test: /\b(belong|fit in|outsider|accepted|welcome|alone|nobody|no one)\b/i,
    moving: 'Under this doubt sits a wish for company at the table where this work gets made. The ache is a sign you want to be among people, which is a different matter from lacking the ability.',
    step: 'Tell one person you trust the single thing you are trying to build, in one sentence, and ask for nothing back.',
  },
]
const DOUBT_OTHER = {
  moving: 'Under this doubt sits something you care about enough to be afraid for. The fear is loudest around the things that matter to you.',
  step: 'Name the thing you care about in one plain sentence, write it somewhere you will see it tomorrow, and do the first five minutes of it today.',
}

function shamanIntake(args: Record<string, unknown>): ToolResult {
  const doubt = typeof args.doubt === 'string' ? args.doubt.trim().slice(0, 2000) : ''
  if (!doubt) return bad('shaman_intake needs doubt: the doubt in his or her own words')
  const hit = DOUBT_THEMES.find((t) => t.test.test(doubt))
  const r = hit ?? { theme: 'other' as DoubtTheme, ...DOUBT_OTHER }
  return ok({ board: 'council', face: 'shaman', theme: r.theme, doubt, underneath: r.moving, next_step: r.step })
}

const byOf = (args: Record<string, unknown>) => typeof args.by === 'string' && args.by.trim() ? args.by.trim().slice(0, 80) : undefined
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 400)

async function putLiveFiles(args: Record<string, unknown>): Promise<ToolResult> {
  const files = Array.isArray(args.files) ? args.files.slice(0, MAX_LIVE_FILES) : []
  if (files.length === 0) return bad('put_live_files needs files: [{path, text} or {path, base64}]')
  const by = byOf(args)
  const published: PutResult[] = [], refused: string[] = []
  for (const raw of files) {
    const f = (raw ?? {}) as Record<string, unknown>
    const path = typeof f.path === 'string' ? f.path.trim() : ''
    const why = livePathError(path)
    if (why) { refused.push(why); continue }
    let bytes: Uint8Array
    if (typeof f.text === 'string') bytes = new TextEncoder().encode(f.text)
    else if (typeof f.base64 === 'string') bytes = new Uint8Array(Buffer.from(f.base64, 'base64'))
    else { refused.push(`${path}: send text or base64`); continue }
    try { published.push(await putLiveFile(path, bytes, by)) } catch (e) { refused.push(errText(e)) }
  }
  const out = { published, refused }
  return published.length ? ok(out) : { content: [text(out)], isError: true }
}

async function readLiveFileTool(args: Record<string, unknown>): Promise<ToolResult> {
  const path = typeof args.path === 'string' ? args.path.trim() : ''
  const why = livePathError(path)
  if (why) return bad(why)
  const got = await readLiveFile(path)
  if (!got) return bad(`${path}: not live (list_live_files shows what is)`)
  const bytes = new Uint8Array(await new Response(got.body).arrayBuffer())
  return ok({ path, sha: got.entry.sha, type: got.entry.type, at: got.entry.at, url: liveUrl(path),
    ...(isText(path) ? { text: new TextDecoder().decode(bytes) } : { base64: Buffer.from(bytes).toString('base64') }) })
}

async function revertLiveFileTool(args: Record<string, unknown>): Promise<ToolResult> {
  const path = typeof args.path === 'string' ? args.path.trim() : ''
  const sha = typeof args.sha === 'string' ? args.sha.trim() : ''
  if (!/^[0-9a-f]{64}$/.test(sha)) return bad('revert_live_file needs sha: a 64-character sha256 from list_live_files')
  try { return ok(await revertLiveFile(path, sha, byOf(args))) } catch (e) { return bad(errText(e)) }
}

async function removeLiveFileTool(args: Record<string, unknown>): Promise<ToolResult> {
  const path = typeof args.path === 'string' ? args.path.trim() : ''
  const why = livePathError(path)
  if (why) return bad(why)
  try { return ok(await removeLiveFile(path)) } catch (e) { return bad(errText(e)) }
}

/**
 * The tools' first names had a dot (pipeline.status). The Anthropic API accepts only ^[a-zA-Z0-9_-]{1,128}$ for a
 * tool name, so a client that forwards the list (Wizardgenie) got a 400. The dotted names still work on tools/call.
 */
const LEGACY_TOOL_NAMES: Record<string, string> = {
  'pipeline.status': 'pipeline_status',
  'pipeline.next': 'pipeline_next',
  'loop.checks': 'loop_checks',
  'asset.brief': 'asset_brief',
  'asset.verify': 'asset_verify',
  'canon.lookup': 'canon_lookup',
  'ontology.profile': 'ontology_profile',
  'mechanic.eval': 'mechanic_eval',
  'faces.lens': 'faces_lens',
}

async function callTool(rawName: string, args: Record<string, unknown>): Promise<ToolResult> {
  const name = LEGACY_TOOL_NAMES[rawName] ?? rawName
  if (name === 'post_rows') return postRows(args)
  if (name === 'read_rows') return readRows(args)
  if (name === 'put_picture') return putPicture(args)
  if (name === 'read_picture') return readPicture(args)
  if (name === 'list_pictures') return listPicturesTool(args)
  if (name === 'post_board_docs') return postBoardDocs(args)
  if (name === 'list_tickets') return listTickets(args)
  if (name === 'steer_ticket') return steerTool(args)
  if (name === 'read_answers') {
    const ids = Array.isArray(args.ids)
      ? args.ids.filter((v): v is string => typeof v === 'string' && v.trim() !== '').slice(0, MAX_IDS)
      : []
    if (ids.length === 0) return bad('read_answers needs ids: the question rows to look up')
    return ok({ board: 'council', answers: await readAnswers(ids) })
  }
  if (name === 'check_visible') {
    const ids = Array.isArray(args.ids)
      ? args.ids.filter((v): v is string => typeof v === 'string' && v.trim() !== '').slice(0, MAX_IDS)
      : []
    if (ids.length === 0) return bad('check_visible needs ids: the row ids just posted')
    return ok({ board: 'council', rows: await checkVisible(ids) })
  }
  if (name === 'list_open') {
    const n = Number(args.limit)
    const lim = Number.isInteger(n) && n >= 1 ? Math.min(n, 200) : 50
    // A blank 500 here hides the whole pile: what waits on him, and what waits on a lane. Name the failure instead.
    try {
      return ok(await listOpen(lim))
    } catch (e) {
      const detail = (e instanceof Error ? e.message : String(e)).slice(0, 300)
      return ok({ board: 'council', asOf: new Date().toISOString(), totalQuestions: 0, questions: [], battleTurns: [], readyTickets: {}, failed: [{ read: 'list_open', detail }] })
    }
  }
  if (name === 'close_read') return ok(await closeRead(db, typeof args.date === 'string' ? args.date : undefined))
  if (name === 'close_say') {
    if (typeof args.say !== 'string' || !args.say.trim()) return bad('close_say needs say: what he replies at this step')
    return ok(await closeSay(db, args.say, typeof args.date === 'string' ? args.date : undefined))
  }
  if (name === 'pipeline_status') return pipelineStatusTool(args)
  if (name === 'pipeline_next') return pipelineNextTool(args)
  if (name === 'loop_checks') return loopChecks(args)
  if (name === 'asset_brief') return assetBriefTool(args)
  if (name === 'asset_verify') return assetVerify(args)
  if (name === 'canon_lookup') return canonLookup(args)
  if (name === 'ontology_profile') return ontologyProfileTool(args)
  if (name === 'mechanic_eval') return mechanicEval(args)
  if (name === 'faces_lens') return facesLens(args)
  if (name === 'shaman_intake') return shamanIntake(args)
  if (name === 'put_live_files') return putLiveFiles(args)
  if (name === 'read_live_file') return readLiveFileTool(args)
  if (name === 'list_live_files') {
    const game = typeof args.game === 'string' && args.game.trim() ? args.game.trim() : undefined
    try { return ok(await listLiveFiles(game)) } catch (e) { return bad(errText(e)) }
  }
  if (name === 'revert_live_file') return revertLiveFileTool(args)
  if (name === 'remove_live_file') return removeLiveFileTool(args)
  if (name === 'whoami') {
    return ok({
      board: 'council',
      server: SERVER_NAME,
      version: SERVER_VERSION,
      endpoint: '/api/mcp',
      store: 'bars-engine',
      deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      tools: TOOLS.map((t) => t.name),
    })
  }
  return bad(`unknown tool: ${name}`)
}

/**
 * @route POST /api/mcp
 * @entity SYSTEM
 * @description The Council Board's MCP server, Streamable HTTP with JSON answers: post_rows, read_rows, put_picture,
 *   read_picture, list_pictures, post_board_docs, read_answers, list_open, check_visible, list_tickets, steer_ticket,
 *   close_read, close_say, whoami, the live game files (put_live_files, read_live_file,
 *   list_live_files, revert_live_file, remove_live_file), and the pipeline door's nine (pipeline_status, pipeline_next, loop_checks,
 *   asset_brief, asset_verify, canon_lookup, ontology_profile, mechanic_eval, faces_lens) and shaman_intake
 * @permissions COUNCIL_MENU_TOKEN, as Authorization: Bearer <key>, a bare header or ?token=
 * @energyCost 0 (the board's store, no model call)
 * @dimensions WHO:agent, WHAT:SYSTEM, WHERE:council board, ENERGY:0
 * @relationships SYSTEM (board store), BAR (a row is a unit of the council's record)
 * @example POST /api/mcp {"jsonrpc":"2.0","id":1,"method":"tools/list"}
 * @agentDiscoverable false
 */
export async function POST(req: NextRequest) {
  const no = refused(req)
  if (no) return no

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error: the body is not JSON')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return rpcError(null, -32600, 'Invalid Request: one JSON-RPC message, not a batch')

  const message = body as Record<string, unknown>
  const rawId = message.id
  const id: RpcId = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : null
  const rawMethod = message.method
  const method = typeof rawMethod === 'string' ? rawMethod : ''
  const params = message.params && typeof message.params === 'object' && !Array.isArray(message.params)
    ? (message.params as Record<string, unknown>)
    : {}

  switch (method) {
    case 'initialize': {
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
      const protocolVersion = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0]
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, title: 'Council Board', version: SERVER_VERSION },
        instructions: 'The Council Board on bars-engine. Store a picture with put_picture, post a question, position, '
          + 'term, cause or battle with post_rows, and see one back with read_picture. Every row carries its pass and a '
          + 'lane naming the environment that posted it. Run the reach test first (council/faces.yaml in '
          + 'six-faces-council). A question for Wendell is a row, never a line in a pull request. A round starts at '
          + 'pipeline_status and asset_brief, and asset_verify reads the judge receipt before its look posts.',
      })
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return new NextResponse(null, { status: 202, headers: NO_STORE })
    case 'ping':
      return rpcResult(id, {})
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS })
    case 'tools/call': {
      const rawName = params.name
      const name = typeof rawName === 'string' ? rawName : ''
      const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments)
        ? (params.arguments as Record<string, unknown>)
        : {}
      if (!name) return rpcError(id, -32602, 'tools/call needs the tool name')
      const result = await callTool(name, args)
      return rpcResult(id, { content: result.content, isError: result.isError })
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method || '(none)'}`)
  }
}

/**
 * @route GET /api/mcp
 * @entity SYSTEM
 * @description The MCP transport's GET, answered 405: this server answers a POST with JSON and opens no SSE stream
 * @permissions COUNCIL_MENU_TOKEN
 * @energyCost 0
 * @dimensions WHO:agent, WHAT:SYSTEM, WHERE:council board, ENERGY:0
 * @relationships SYSTEM (board store)
 * @example GET /api/mcp
 * @agentDiscoverable false
 */
export function GET() {
  return NextResponse.json(
    { error: 'POST only: this MCP server answers a POST with JSON and serves no SSE stream' },
    { status: 405, headers: { ...NO_STORE, Allow: 'POST' } },
  )
}

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
import { sessionWrite, type SessionDoc } from '@/lib/board/session-write'
import { latestDoc } from '@/lib/board/store'
import { decodePicture, valueAt } from '@/lib/board/pictures'
import { linkPr, listSpecs, readSpec, validKey, writeSpec } from '@/lib/bar-to-work/specs'
import { listPictures, liftInlinePictures, readPictureBytes, shaFromUrl, storePicture, type StoredPicture }
  from '@/lib/board/picture-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SERVER_NAME = 'council-board'
const SERVER_VERSION = '1.1.0'
const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_ROWS = 100
const MAX_IDS = 50
const MAX_DOCS = 50
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
    name: 'list_specs',
    title: 'List BAR specs',
    description: 'List the specs for BARs a player sent to their farm (BAR-to-work). Merged specs only unless drafts is true. No markdown; pull one with get_spec.',
    inputSchema: { type: 'object', properties: { drafts: { type: 'boolean', description: 'Also list draft specs.' } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_spec',
    title: 'Read one BAR spec',
    description: 'Read one spec whole, to build from. Merged specs only unless drafts is true.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, drafts: { type: 'boolean' } }, required: ['key'] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'post_spec',
    title: 'Write a BAR spec',
    description: 'Write the spec for a BAR: key (or barId), title, markdown, status draft or merged, specUrl. A merged spec moves the BAR\'s seed on the farm forward.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' }, barId: { type: 'string' }, title: { type: 'string' }, markdown: { type: 'string' },
        status: { type: 'string', description: 'draft or merged.' }, specUrl: { type: 'string' },
      },
      required: ['title', 'markdown'],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: 'link_pr',
    title: 'Link a pull request to a spec',
    description: 'Record the pull request a lane opened for a merged spec; the BAR\'s seed on the farm shows the link.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, prUrl: { type: 'string', description: 'https link to the pull request.' } }, required: ['key', 'prUrl'] },
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

const specResult = (r: Awaited<ReturnType<typeof writeSpec>>) => (r.ok ? ok({ spec: r.spec, seed: r.seed }) : bad(r.error))

async function specTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const includeDraft = args.drafts === true
  if (name === 'list_specs') return ok({ specs: await listSpecs({ includeDraft }) })
  if (name === 'post_spec') return specResult(await writeSpec(args))
  if (!validKey(args.key)) return bad(`${name} needs key: letters, digits, . _ -`)
  if (name === 'get_spec') {
    const spec = await readSpec(args.key, { includeDraft })
    return spec ? ok({ spec }) : bad('No merged spec with that key.')
  }
  return specResult(await linkPr(args.key, args.prUrl))
}

async function callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  if (name === 'post_rows') return postRows(args)
  if (name === 'read_rows') return readRows(args)
  if (name === 'put_picture') return putPicture(args)
  if (name === 'read_picture') return readPicture(args)
  if (name === 'list_pictures') return listPicturesTool(args)
  if (name === 'post_board_docs') return postBoardDocs(args)
  if (name === 'list_specs' || name === 'get_spec' || name === 'post_spec' || name === 'link_pr') return specTool(name, args)
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
 *   read_picture, list_pictures, post_board_docs, list_specs, get_spec, post_spec, link_pr and whoami
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
          + 'six-faces-council). A question for Wendell is a row, never a line in a pull request.',
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

import { beforeEach, describe, expect, it, vi } from 'vitest'

// The look card's tools through the board MCP route: show_look, answer_look, ask_look (elicitation), the confirm
// before remove_live_file, and the ui:// page itself.
vi.mock('server-only', () => ({}))
const saves = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }))
vi.mock('@/lib/db', () => ({
  db: {
    boardSave: { create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      saves.rows.push(data); return { receivedAt: new Date('2026-11-25T15:00:00Z') }
    }) },
  },
}))
const docs = vi.hoisted(() => new Map<string, Record<string, unknown>>())
vi.mock('@/lib/board/store', () => ({
  latestDoc: async (_b: string, c: string, id: string) => docs.get(`${c}/${id}`) ?? null,
}))
vi.mock('@/lib/board/mcp-reads', () => ({
  listOpen: async () => ({ questions: [{ id: 'mr-numbers' }, { id: 'cd-dojo-doors-look-1' }] }),
  readAnswers: async (ids: string[]) => ids.map((id) => {
    const a = docs.get(`questions/${id}`)
    return a ? { id, state: 'answered', choice: a.choice, label: 'Yes, the doors work', steer: a.steer } : { id, state: 'open' }
  }),
  checkVisible: vi.fn(),
}))
const ticket = vi.hoisted(() => vi.fn(async () => ({ id: 't1', lane: 'claude', state: 'ready', created: true })))
vi.mock('@/lib/work/from-save', () => ({ ticketFromSave: ticket }))
const wake = vi.hoisted(() => vi.fn())
vi.mock('@/lib/work/wake', () => ({ wakePickupAfter: wake }))
vi.mock('@/lib/board/ready-drafts', () => ({ readyDraftsAfterSave: vi.fn() }))
vi.mock('@/lib/board/session-write', () => ({ sessionWrite: vi.fn() }))
vi.mock('@/lib/board/picture-store', () => ({
  listPictures: vi.fn(), liftInlinePictures: vi.fn(), readPictureBytes: vi.fn(), shaFromUrl: vi.fn(), storePicture: vi.fn(),
}))
const live = vi.hoisted(() => ({ removeLiveFile: vi.fn(async (p: string) => ({ removed: p })) }))
vi.mock('@/lib/live/store', () => ({
  isText: vi.fn(), listLiveFiles: vi.fn(), livePathError: () => null, liveUrl: vi.fn(), putLiveFile: vi.fn(),
  readLiveFile: vi.fn(), removeLiveFile: live.removeLiveFile, revertLiveFile: vi.fn(),
}))

import { POST } from '@/app/api/mcp/route'
import { lookView, answerBody, elicitModes, signState, readState, moveFromForm } from '../view'

const LOOK = {
  kind: 'questions', look: true, list: 'calrunian-dojo', faces: ['architect', 'diplomat'],
  q: 'Do the four doors take you to the hall their plaque names?',
  why: 'A real browser walked each door.', why_you: 'You said to merge the stack.',
  lookTitle: 'The four new doors', still: '/board/stills/724db75a756ed448.jpg',
  href: 'https://bars-engine.vercel.app/board/look?t=x&i=724db75a756ed448.jpg',
  options: [
    { v: 'A', label: 'Yes, the doors work (recommended)', c: 'The doors stand.' },
    { v: 'B', label: 'Rename or re-aim a door', c: 'Say which door.' },
    { v: 'C', label: 'Something else is off' },
  ],
  recommended: 'A',
}

const rpc = (method: string, params: Record<string, unknown> = {}) => POST({
  nextUrl: { searchParams: new URLSearchParams() },
  headers: new Headers({ authorization: 'Bearer menu' }),
  json: async () => ({ jsonrpc: '2.0', id: 7, method, params }),
} as never)
const result = async (res: Response) => (await res.json()).result
const FORM = { 'io.modelcontextprotocol/clientCapabilities': { elicitation: { form: {} } } }

describe('the look card (MCP Apps)', () => {
  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = 'menu'
    docs.clear(); saves.rows.length = 0; ticket.mockClear(); wake.mockClear(); live.removeLiveFile.mockClear()
    docs.set('rows/cd-dojo-doors-look-1', LOOK)
    docs.set('rows/mr-numbers', { kind: 'questions', q: 'Do the numbers stand?', options: [{ v: 'A', label: 'Yes' }] })
  })

  it('lists the tools with the card attached and answer_look hidden from the model', async () => {
    const { tools } = await result(await rpc('tools/list'))
    const show = tools.find((t: { name: string }) => t.name === 'show_look')
    const answer = tools.find((t: { name: string }) => t.name === 'answer_look')
    expect(show._meta.ui.resourceUri).toBe('ui://council-board/look-card.html')
    expect(answer._meta.ui.visibility).toEqual(['app'])
    expect(tools.some((t: { name: string }) => t.name === 'ask_look')).toBe(true)
  })

  it('serves the card as an MCP App page that lets in only the board and the fonts', async () => {
    const init = await result(await rpc('initialize', { protocolVersion: '2025-06-18' }))
    expect(init.capabilities.resources).toBeDefined()
    const { resources } = await result(await rpc('resources/list'))
    expect(resources[0]).toMatchObject({ uri: 'ui://council-board/look-card.html', mimeType: 'text/html;profile=mcp-app' })
    const read = await result(await rpc('resources/read', { uri: 'ui://council-board/look-card.html' }))
    const page = read.contents[0]
    expect(page.mimeType).toBe('text/html;profile=mcp-app')
    expect(page._meta.ui.csp.resourceDomains).toEqual(['https://bars-engine.vercel.app', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'])
    expect(page.text).toContain('window.McpExtApps=')
    expect(page.text).toContain('Claude Takes It')
    expect(page.text.match(/<\/script>/g)).toHaveLength(2)
    const missing = await (await rpc('resources/read', { uri: 'ui://elsewhere' })).json()
    expect(missing.error.code).toBe(-32602)
  })

  it('show_look draws the newest open look, skipping rows that are not looks', async () => {
    const r = await result(await rpc('tools/call', { name: 'show_look', arguments: {} }))
    expect(r.isError).toBe(false)
    expect(r.structuredContent).toMatchObject({
      id: 'cd-dojo-doors-look-1', face: 'architect', trim: '#e8873a', deck: 'Calrunian Dojo', recommended: 'A',
      still: 'https://bars-engine.vercel.app/board/stills/724db75a756ed448.jpg', answered: null,
    })
    expect(r.structuredContent.options[0]).toEqual({ v: 'A', label: 'Yes, the doors work', detail: 'The doors stand.', recommended: true })
    expect(r.content[0].text).toContain('Picture: https://bars-engine.vercel.app/board/stills/')
    const notLook = await result(await rpc('tools/call', { name: 'show_look', arguments: { id: 'mr-numbers' } }))
    expect(notLook.isError).toBe(true)
  })

  it('answer_look saves Claude Takes It as the board does, then makes the ticket and wakes the pickup', async () => {
    const r = await result(await rpc('tools/call', { name: 'answer_look', arguments: { id: 'cd-dojo-doors-look-1', move: 'claude_takes_it' } }))
    expect(r.isError).toBe(false)
    expect(saves.rows).toHaveLength(1)
    expect(saves.rows[0]).toMatchObject({ board: 'council', collection: 'questions', docId: 'cd-dojo-doors-look-1' })
    expect(saves.rows[0].data).toMatchObject({ choice: 'A', steer: '', via: 'claude-look-card' })
    expect(ticket).toHaveBeenCalledOnce()
    expect(wake).toHaveBeenCalledWith('answer to cd-dojo-doors-look-1')
    expect(r.structuredContent.line).toBe('Wendell answered: Yes, the doors work.')
  })

  it('answer_look never replaces an answer he already gave', async () => {
    docs.set('questions/cd-dojo-doors-look-1', { choice: 'B', steer: 'west door' })
    const r = await result(await rpc('tools/call', { name: 'answer_look', arguments: { id: 'cd-dojo-doors-look-1', move: 'claude_takes_it' } }))
    expect(r.isError).toBe(true)
    expect(saves.rows).toHaveLength(0)
  })

  it('ask_look asks in a form when the client takes elicitation, and saves only what he sends back', async () => {
    const first = await result(await rpc('tools/call', { name: 'ask_look', arguments: { id: 'cd-dojo-doors-look-1' }, _meta: FORM }))
    expect(first.resultType).toBe('input_required')
    expect(first.inputRequests.answer.params.mode).toBe('form')
    expect(first.inputRequests.answer.params.requestedSchema.properties.answer.oneOf.map((o: { const: string }) => o.const))
      .toEqual(['A', 'B', 'C', '__compost'])
    const again = await result(await rpc('tools/call', {
      name: 'ask_look', arguments: { id: 'cd-dojo-doors-look-1' }, _meta: FORM, requestState: first.requestState,
      inputResponses: { answer: { action: 'accept', content: { answer: 'B', note: 'The west door should land at the tea library.' } } },
    }))
    expect(again.isError).toBe(false)
    expect(saves.rows[0].data).toMatchObject({ choice: 'B', steer: 'The west door should land at the tea library.', via: 'claude-ask-form' })
  })

  it('ask_look saves nothing on a decline or a forged state, and gives words to a client with no elicitation', async () => {
    const first = await result(await rpc('tools/call', { name: 'ask_look', arguments: {}, _meta: FORM }))
    const declined = await result(await rpc('tools/call', { name: 'ask_look', arguments: {}, requestState: first.requestState,
      inputResponses: { answer: { action: 'decline' } } }))
    expect(declined.content[0].text).toContain('Nothing was saved')
    const forged = await result(await rpc('tools/call', { name: 'ask_look', arguments: {}, requestState: signState({ t: 'ask_look', id: 'cd-dojo-doors-look-1' }, 'not-the-key'),
      inputResponses: { answer: { action: 'accept', content: { answer: 'A' } } } }))
    expect(forged.isError).toBe(true)
    const plain = await result(await rpc('tools/call', { name: 'ask_look', arguments: {} }))
    expect(plain.resultType).toBe('complete')
    expect(plain.content[0].text).toContain('cannot ask him in a form')
    expect(saves.rows).toHaveLength(0)
  })

  it('remove_live_file asks first when the client takes elicitation, and removes only on his yes', async () => {
    const ask = await result(await rpc('tools/call', { name: 'remove_live_file', arguments: { path: 'dojo/index.html' }, _meta: FORM }))
    expect(ask.resultType).toBe('input_required')
    expect(live.removeLiveFile).not.toHaveBeenCalled()
    const no = await result(await rpc('tools/call', { name: 'remove_live_file', arguments: { path: 'dojo/index.html' },
      requestState: ask.requestState, inputResponses: { confirm: { action: 'accept', content: { remove: false } } } }))
    expect(no.content[0].text).toContain('stays live')
    expect(live.removeLiveFile).not.toHaveBeenCalled()
    const otherPath = await result(await rpc('tools/call', { name: 'remove_live_file', arguments: { path: 'dojo/map.json' },
      requestState: ask.requestState, inputResponses: { confirm: { action: 'accept', content: { remove: true } } } }))
    expect(otherPath.isError).toBe(true)
    await rpc('tools/call', { name: 'remove_live_file', arguments: { path: 'dojo/index.html' },
      requestState: ask.requestState, inputResponses: { confirm: { action: 'accept', content: { remove: true } } } })
    expect(live.removeLiveFile).toHaveBeenCalledWith('dojo/index.html')
  })

  it('remove_live_file works as before for a client with no elicitation (the box agents)', async () => {
    await rpc('tools/call', { name: 'remove_live_file', arguments: { path: 'dojo/index.html' } })
    expect(live.removeLiveFile).toHaveBeenCalledWith('dojo/index.html')
  })
})

describe('the look card as data', () => {
  const v = lookView('cd-dojo-doors-look-1', LOOK, null)
  const now = new Date('2026-11-25T15:00:00Z')

  it('Steer needs a way or a note, and only this look\'s options', () => {
    expect(answerBody(v, { move: 'steer' }, 'x', now)).toEqual({ error: 'Steer needs a way picked or a note' })
    expect(answerBody(v, { move: 'steer', choice: 'Z' }, 'x', now)).toHaveProperty('error')
    expect(answerBody(v, { move: 'steer', choice: 'C' }, 'x', now))
      .toEqual({ body: { choice: 'C', steer: 'Steer: Something else is off.', savedAt: now.toISOString(), via: 'x' } })
  })

  it('Compost names why it stalled and what to keep, as the board writes it', () => {
    expect(answerBody(v, { move: 'compost' }, 'x', now)).toHaveProperty('error')
    expect(answerBody(v, { move: 'compost', stall: 'too_big', keep: ['idea', 'look'], note: 'later' }, 'x', now)).toEqual({ body: {
      choice: '', steer: 'Compost. Stalled: Too big for one card. Keep: the idea, the look. Note: later', savedAt: now.toISOString(), via: 'x',
    } })
  })

  it('reads elicitation modes from the request alone', () => {
    expect(elicitModes({})).toEqual({ form: false, url: false })
    expect(elicitModes({ _meta: { 'io.modelcontextprotocol/clientCapabilities': { elicitation: {} } } })).toEqual({ form: true, url: false })
    expect(elicitModes({ _meta: { 'io.modelcontextprotocol/clientCapabilities': { elicitation: { url: {} } } } })).toEqual({ form: false, url: true })
  })

  it('a request state expires and cannot be altered', () => {
    const st = signState({ t: 'ask_look', id: 'x' }, 'k', 0)
    expect(readState(st, 'k', 1000)).toMatchObject({ t: 'ask_look', id: 'x' })
    expect(readState(st, 'k', 31 * 60 * 1000)).toBeNull()
    const [, mac] = st.split('.')
    expect(readState(Buffer.from(JSON.stringify({ t: 'ask_look', id: 'y', exp: 9e15 })).toString('base64url') + '.' + mac, 'k', 1000)).toBeNull()
  })

  it('a form answer of the recommended option with no note is Claude Takes It', () => {
    expect(moveFromForm(v, { answer: 'A' })).toEqual({ move: 'claude_takes_it' })
    expect(moveFromForm(v, { answer: 'A', note: 'and add a sign' })).toMatchObject({ move: 'steer', choice: 'A' })
    expect(moveFromForm(v, { answer: '__compost', stall: 'lost_charge' })).toMatchObject({ move: 'compost', stall: 'lost_charge' })
  })
})

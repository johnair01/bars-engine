import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route reaches the board's store, which imports 'server-only'; every sibling suite stubs it the same way.
vi.mock('server-only', () => ({}))

import { createHash } from 'node:crypto'
// The steer tools write the work queue; the suite gives them a one-ticket store.
const tix = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }))
vi.mock('@/lib/db', () => ({
  db: {
    workTicket: {
      findUnique: async ({ where }: { where: { id: string } }) => tix.rows.find((t) => t.id === where.id) ?? null,
      findMany: async () => tix.rows,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const t = tix.rows.find((x) => x.id === where.id)!
        Object.assign(t, data)
        return t
      },
    },
  },
}))

import { setBackend, type ContentBackend } from '@/lib/board/content-store'
import { memoryBackend } from '@/lib/board/__tests__/memory-backend'
const docs = new Map<string, Record<string, unknown>>()
vi.mock('@/lib/board/store', async (orig) => ({
  ...(await orig<typeof import('@/lib/board/store')>()),
  latestDoc: async (_b: string, c: string, id: string) => docs.get(`${c}/${id}`) ?? null,
}))
vi.mock('@/lib/board/session-write', async (orig) => ({
  ...(await orig<typeof import('@/lib/board/session-write')>()),
  sessionWrite: async (_db: unknown, w: unknown[]) => ({ written: w.length }),
}))


import { POST } from '../route'

const KEY = 'test-council-key'
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
const PICTURE = `data:image/png;base64,${PNG.toString('base64')}`

type Content = { type: string; text?: string; data?: string; mimeType?: string }
type Rpc = {
  result?: { content?: Content[]; isError?: boolean; tools?: { name: string }[] }
  error?: { code: number; message: string }
}

function memory(): ContentBackend & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>()
  return {
    name: 'memory',
    files,
    async read(key) {
      const b = files.get(key)
      return b ? { body: new Response(new Uint8Array(b)).body!, type: 'image/png' } : null
    },
    async write(key, bytes) { files.set(key, bytes) },
  }
}

let mem: ReturnType<typeof memory>

async function rpc(method: string, params: Record<string, unknown> = {}): Promise<Rpc> {
  const req = new NextRequest('http://localhost/api/mcp', {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  return (await (await POST(req)).json()) as Rpc
}

const call = (name: string, args: Record<string, unknown>) => rpc('tools/call', { name, arguments: args })
const payload = (r: Rpc) => JSON.parse(r.result?.content?.[0]?.text ?? '{}') as Record<string, unknown>

describe('the board MCP server', () => {
  it('names why list_open could not read, instead of a blank 500', async () => {
    // The live server answered list_open with a blank 500 for weeks; every caller fell back to other tools and the
    // pile stayed invisible. The tool now says which read failed and still returns the parts it could reach.
    const body = payload(await call('list_open', {}))
    expect(body.failed).toEqual([expect.objectContaining({ read: 'list_open' })])
    expect(String((body.failed as { detail: string }[])[0].detail)).toMatch(/queryRaw/i)
    expect(body.questions).toEqual([])
    expect(body.readyTickets).toEqual({})
  })

  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = KEY
    mem = memory()
    setBackend(mem)
  })

  it('answers the handshake and lists the tools', async () => {
    const init = await rpc('initialize', { protocolVersion: '2025-06-18' })
    expect(init.error).toBeUndefined()
    const list = await rpc('tools/list')
    const names = (list.result?.tools ?? []).map((t) => t.name)
    expect(names).toContain('post_rows')
    expect(names).toContain('put_picture')
    expect(names).toContain('read_picture')
    expect(names).toContain('list_pictures')
    expect(names).toContain('post_board_docs')
    expect(names).toContain('steer_ticket')
    expect(names).toContain('list_tickets')
  })

  it('steer_ticket writes the store at once, and refuses a claimed ticket', async () => {
    tix.rows = [
      { id: 't1', title: 'x', state: 'ready', lane: 'claude', lanes: ['claude'], basis: {} },
      { id: 't2', title: 'y', state: 'claimed', lane: 'claude', lanes: ['claude'], basis: {} },
    ]
    const moved = await rpc('tools/call', { name: 'steer_ticket', arguments: { id: 't1', lane: 'freebuff' } })
    expect(moved.result?.isError).toBe(false)
    expect(tix.rows[0]).toMatchObject({ lane: 'freebuff', state: 'ready' })
    const refused = await rpc('tools/call', { name: 'steer_ticket', arguments: { id: 't2', lane: 'freebuff' } })
    expect(refused.result?.isError).toBe(true)
    expect(tix.rows[1].lane).toBe('claude')
    const listed = await rpc('tools/call', { name: 'list_tickets', arguments: {} })
    expect(listed.result?.content?.[0].text).toContain('t1')
  })

  it('stores a picture, shows it back as image content, and lists it', async () => {
    const put = await call('put_picture', { data: PICTURE, round: '2026-11-12-probe', maker: 'freemilk' })
    expect(put.result?.isError).toBe(false)
    const stored = payload(put)
    expect(String(stored.url)).toContain('/board/stills/sha/')

    const seen = await call('read_picture', { sha: String(stored.sha) })
    expect(seen.result?.content?.[0]?.type).toBe('image')
    expect(seen.result?.content?.[0]?.mimeType).toBe('image/png')

    const listed = await call('list_pictures', { round: '2026-11-12-probe' })
    const pictures = payload(listed).pictures as { sha: string }[]
    expect(pictures.map((p) => p.sha)).toContain(stored.sha)
  })

  it('refuses a picture type it cannot serve', async () => {
    const put = await call('put_picture', { data: 'data:image/bmp;base64,AAAA' })
    expect(put.result?.isError).toBe(true)
    expect(put.result?.content?.[0]?.text).toContain('image/png')
  })

  it('refuses a design look without a sealed pass, and accepts it with one', async () => {
    docs.clear()
    const look = { kind: 'look', look: true, faces: ['shaman', 'regent'], pass: 'demo-pass' }
    const refused = await call('post_rows', { docs: [{ docId: 'look-1', data: look }] })
    expect(refused.result?.isError).toBe(true)
    expect(refused.result?.content?.[0]?.text).toContain('pass_check.py')

    const body = 'Ontology: profile game_design\n'
    docs.set('records/demo-pass', { kind: 'pass', body })
    docs.set('records/pass-check-demo-pass', { kind: 'ledger', body: JSON.stringify({
      pass: 'demo-pass', ok: true, sha256: createHash('sha256').update(body, 'utf8').digest('hex') }) })
    const accepted = await call('post_rows', { docs: [{ docId: 'look-1', data: look }] })
    expect(accepted.result?.isError).toBe(false)
  })

  it('lets a lane receipt carry a still without a pass, and keeps design faces out of it', async () => {
    docs.clear()
    const receipt = {
      kind: 'questions', receipt: true, lane: 'freebuff', look: true,
      pr: 'https://github.com/johnair01/bars-engine/pull/836',
      still: 'https://bars-engine.vercel.app/board/stills/sha/aa.png',
      q: 'PR #836: the stair run, checked', options: [{ v: 'A', label: 'Take it' }, { v: 'B', label: 'Send it back' }],
    }
    const accepted = await call('post_rows', { docs: [{ docId: 'waker-result-1', data: receipt }] })
    expect(accepted.result?.isError).toBe(false)

    const sneaky = { ...receipt, faces: ['regent'] }
    const refused = await call('post_rows', { docs: [{ docId: 'waker-result-2', data: sneaky }] })
    expect(refused.result?.isError).toBe(true)
    expect(refused.result?.content?.[0]?.text).toContain('lane receipt may not name design faces')
  })

  it('refuses a call without the key', async () => {
    const req = new NextRequest('http://localhost/api/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
    expect((await POST(req)).status).toBe(401)
  })
})

describe('the pipeline door', () => {
  const LOOP = JSON.stringify({
    strand: 'hand-grip',
    callsheet: 'council/callsheets/hand-grip.md',
    deft: {
      node_types: ['held prop'],
      place: null,
      floor: null,
      floor_note: 'no place has no floor, so no floor runs',
      references: [{ id: 'hand-grip-look-2', still: 'https://bars-engine.vercel.app/board/stills/sha/aa.png', answer: 'Use this hold' }],
      checks: [
        { id: 'thumb_side', note: 'The thumb is on the wrong side of the brush', types: ['held prop'], holds: 'yes' },
        { id: 'finger_pad_gap', note: "hand isn't convincingly picking up the sword", types: ['held prop'], holds: 'no' },
      ],
      emits: { 'numbers.json': ['hold', 'padGapMm'] },
      run: 'python3 council/judge/run_loop.py hand-grip <round folder>',
    },
  })
  const CALLSHEET = '# Callsheet\n\n## NEXT\n\n1. Shoot the close-ups.\n\n## Signed\n\n- intake: shaman, diplomat (2026-11-09)\n'
  const PIPELINE = 'contract:\n  check: python3 council/tools/contract_check.py <spec folder>\nstages:\n'
    + '  - id: intake\n    owners: [shaman, diplomat]\n    gate: >\n      The ask is quoted.\n'
    + '  - id: assets\n    owners: [regent, architect]\n    gate: >\n      python3 council/tools/asset_callsheet.py check passes.\n'
  const FACES = 'order: [shaman]\n\nfaces:\n  shaman:\n    lens: What is moving underneath?\n    standing_test: >\n'
    + '      Does it say something is wrong with them?\n    lessons: []\n'
  const MECHANIC = 'name: lading-seal\nplayer_verb: load the hold\nworld_response: a ship docks with a full hold\n'
    + 'status: proposed\nfeel_status: every number is a proposal until Wendell looks\nfeel:\n'
    + '  response: 0.3 s ease-out-cubic press\ntune:\n'
    + '  - {key: press, label: "the seal presses", value: 0.3, min: 0.05, max: 1.2, step: 0.05, unit: "s", feel: "response", says: "{v} s ease-out-cubic press"}\n'
  const ONTOLOGY = 'load_profiles:\n  game_design:\n    - ontology/v0.1/QUICKSTART.md\n'
  const held = JSON.stringify({
    strand: 'hand-grip', held: true, registry: 'abcd1234', line: 'judge: held; thumb_side FAIL holds',
    checks: [
      { id: 'thumb_side', status: 'fail', detail: 'thumb at +297 mm', holds: 'yes' },
      { id: 'finger_pad_gap', status: 'pass', detail: '', holds: 'no' },
    ],
  })
  const clear = JSON.stringify({
    strand: 'hand-grip', held: false, registry: 'abcd1234', line: 'judge: not held; the round still needs his look',
    checks: [
      { id: 'thumb_side', status: 'pass', detail: '', holds: 'yes' },
      { id: 'finger_pad_gap', status: 'pass', detail: '', holds: 'no' },
    ],
  })

  beforeEach(() => {
    process.env.COUNCIL_MENU_TOKEN = KEY
    setBackend(memoryBackend({
      'council/loops/hand-grip.json': LOOP,
      'council/callsheets/hand-grip.md': CALLSHEET,
      'council/pipeline.yaml': PIPELINE,
      'council/faces.yaml': FACES,
      'canon/mechanics/lading-seal.yaml': MECHANIC,
      'ontology/manifest.yaml': ONTOLOGY,
      'council/callsheets/stills/r-held/judge.json': held,
      'council/callsheets/stills/r-clear/judge.json': clear,
    }).backend)
  })

  it('lists the nine pipeline tools beside the six board ones', async () => {
    const names = ((await rpc('tools/list')).result?.tools ?? []).map((t) => t.name)
    for (const n of ['pipeline.status', 'pipeline.next', 'loop.checks', 'asset.brief', 'asset.verify', 'canon.lookup',
      'ontology.profile', 'mechanic.eval', 'faces.lens'])
      expect(names).toContain(n)
  })

  it('answers a standing and the next gate in text, naming the files', async () => {
    const s = await call('pipeline.status', { strand: 'hand-grip' })
    expect(s.result?.isError).toBe(false)
    const text = s.result?.content?.[0]?.text ?? ''
    expect(text).toContain('stage: intake')
    expect(text).toContain('next: assets')
    expect(text).toContain('council/loops/hand-grip.json')
    expect(text).toContain('gap finger_pad_gap')

    const n = await call('pipeline.next', { strand: 'hand-grip' })
    expect(n.result?.content?.[0]?.text).toContain('run: python3 council/tools/asset_callsheet.py')
  })

  it('answers the loop, the brief and the six lenses', async () => {
    const loop = payload(await call('loop.checks', { strand: 'hand-grip' }))
    expect((loop.checks as { id: string }[]).map((c) => c.id)).toEqual(['thumb_side', 'finger_pad_gap'])

    const brief = (await call('asset.brief', { strand: 'hand-grip', node: 'held prop' })).result?.content?.[0]?.text ?? ''
    expect(brief).toContain('existing:')
    expect(brief).toContain('proof: python3 council/judge/run_loop.py hand-grip')
    expect(brief).toContain('emits')

    const lenses = payload(await call('faces.lens', { strand: 'hand-grip' }))
    expect((lenses.faces as { face: string }[])[0].face).toBe('shaman')
  })

  it('lists shaman_intake and returns a reading with one next step', async () => {
    const names = ((await rpc('tools/list')).result?.tools ?? []).map((t) => t.name)
    expect(names).toContain('shaman_intake')
    const r = payload(await call('shaman_intake', { doubt: 'I do not think I am capable of building the thing that I want' }))
    expect(r.face).toBe('shaman')
    expect(r.theme).toBe('capable')
    expect(String(r.underneath).length).toBeGreaterThan(20)
    expect(String(r.next_step)).toMatch(/today/)
    expect(String(r.underneath) + String(r.next_step)).not.toContain('?')
    expect(payload(await call('shaman_intake', { doubt: 'I feel stuck' })).theme).toBe('other')
    expect((await call('shaman_intake', { doubt: '  ' })).result?.isError).toBe(true)
  })

  it('refuses a held round with his sentence, and passes a clear one', async () => {
    const no = await call('asset.verify', { strand: 'hand-grip', round: 'r-held' })
    expect(no.result?.isError).toBe(true)
    expect(no.result?.content?.[0]?.text).toContain('"The thumb is on the wrong side of the brush"')

    const yes = await call('asset.verify', { strand: 'hand-grip', round: 'r-clear' })
    expect(yes.result?.isError).toBe(false)
    expect(payload(yes).judge).toContain('judge: not held')

    const missing = await call('asset.verify', { strand: 'hand-grip', round: 'r-missing' })
    expect(missing.result?.isError).toBe(true)
    expect(missing.result?.content?.[0]?.text).toContain('no receipt at council/callsheets/stills/r-missing/judge.json')
  })

  it('answers a canon block, a load profile and a mechanic\'s arithmetic', async () => {
    const block = payload(await call('canon.lookup', { name: 'lading-seal' }))
    expect(block.rule).toContain('a ship docks with a full hold')

    const profile = payload(await call('ontology.profile', { kind: 'game_design' }))
    expect(profile.loads).toEqual(['ontology/v0.1/QUICKSTART.md'])

    const tuned = payload(await call('mechanic.eval', { mechanic: 'lading-seal', state: { press: 0.5 } }))
    expect((tuned.faders as { said: string }[])[0].said).toBe('0.5 s ease-out-cubic press')
    expect(tuned.ok).toBe(false)
  })

  it('refuses a strand it cannot read', async () => {
    const r = await call('pipeline.status', { strand: 'no-such-strand' })
    expect(r.result?.isError).toBe(false)  // a standing with no loop still answers, and says so
    expect(r.result?.content?.[0]?.text).toContain('no loop at council/loops/no-such-strand.json')
  })
})

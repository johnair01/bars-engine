import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

const { currentPlayer, create, findMany } = vi.hoisted(() => ({ currentPlayer: vi.fn(), create: vi.fn(), findMany: vi.fn() }))
vi.mock('@/lib/between/store', () => ({ currentPlayer }))
vi.mock('@/lib/db', () => ({ db: { customBar: { create, findMany } } }))
import { GET, POST } from './route'

const sample = () => JSON.parse(readFileSync(join(process.cwd(), 'public/between/ctw/sample-player.json'), 'utf8'))
const request = (body: unknown) => new NextRequest('http://localhost/api/calrunia/kept', { method: 'POST', body: JSON.stringify(body) })
const get = (id = '') => new NextRequest('http://localhost/api/calrunia/kept' + (id ? '?id=' + id : ''))

describe('private Calrunia BAR capture and return', () => {
  beforeEach(() => { vi.clearAllMocks(); currentPlayer.mockResolvedValue({ id: 'owner' }); create.mockResolvedValue({}); findMany.mockResolvedValue([]) })

  it('requires a signed-in player and an explicit non-empty kernel', async () => {
    currentPlayer.mockResolvedValueOnce(null)
    expect((await POST(request({ content: 'yes', charge: sample(), notes: [] }))).status).toBe(401)
    expect((await POST(request({ content: '  ', charge: sample(), notes: [] }))).status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('keeps a private owner-scoped BAR with the chosen words and return context', async () => {
    const charge = sample()
    const result = await POST(request({ content: '  Invite a friend to hear this  ', charge, notes: [1, 3, 0] }))
    expect(result.status).toBe(201)
    const { data } = create.mock.calls[0][0]
    expect(data).toMatchObject({ creatorId: 'owner', visibility: 'private', type: 'bar', description: 'Invite a friend to hear this', rootId: data.id })
    const meta = JSON.parse(data.agentMetadata)
    expect(meta).toMatchObject({ source: 'calrunia_return_v1', notes: [1, 3, 0] })
    expect(meta.charge.q1).toEqual(charge.q1)
    expect(meta.charge.drafted).toBeUndefined()
  })

  it('refuses bad return data without writing', async () => {
    expect((await POST(request({ content: 'keep', charge: sample(), notes: [7] }))).status).toBe(400)
    expect((await POST(request({ content: 'keep', charge: {}, notes: [] }))).status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it('queries the current owner and returns the stored context only for a matching record', async () => {
    const charge = sample()
    findMany.mockResolvedValueOnce([{ id: 'bar-1', title: 'mine', description: 'mine', createdAt: new Date(), agentMetadata: JSON.stringify({ source: 'calrunia_return_v1', charge, notes: [2] }) }])
    const response = await GET(get('bar-1'))
    expect(response.status).toBe(200)
    expect((await response.json()).bar).toMatchObject({ id: 'bar-1', content: 'mine', charge, notes: [2] })
    expect(findMany.mock.calls[0][0].where).toMatchObject({ creatorId: 'owner', id: 'bar-1', type: 'bar' })
    currentPlayer.mockResolvedValueOnce({ id: 'other' })
    findMany.mockResolvedValueOnce([])
    expect((await GET(get('bar-1'))).status).toBe(404)
    expect(findMany.mock.calls[1][0].where.creatorId).toBe('other')
  })

  it('lists titles without exposing the saved context', async () => {
    findMany.mockResolvedValueOnce([{ id: 'bar-1', title: 'mine', description: 'mine', createdAt: new Date(), agentMetadata: JSON.stringify({ source: 'calrunia_return_v1', charge: sample(), notes: [2] }) }])
    const body = await (await GET(get())).json()
    expect(body.bars[0]).not.toHaveProperty('charge')
    expect(body.bars[0]).not.toHaveProperty('notes')
  })

  it('keeps and reloads the same BAR across requests while excluding another owner', async () => {
    const records: any[] = []
    create.mockImplementation(async ({ data }) => { records.push({ ...data, createdAt: new Date(), archivedAt: null }); return data })
    findMany.mockImplementation(async ({ where }) => records.filter(row => row.creatorId === where.creatorId && (!where.id || row.id === where.id)))
    const charge = sample()
    const saved = await (await POST(request({ content: 'A phrase to share', charge, notes: [0, 4] }))).json()
    const list = await (await GET(get())).json()
    expect(list.bars.map((bar: { id: string }) => bar.id)).toContain(saved.id)
    const restored = await (await GET(get(saved.id))).json()
    expect(restored.bar).toMatchObject({ id: saved.id, content: 'A phrase to share', notes: [0, 4], charge: { q1: charge.q1 } })
    currentPlayer.mockResolvedValue({ id: 'other' })
    expect((await GET(get(saved.id))).status).toBe(404)
  })
})

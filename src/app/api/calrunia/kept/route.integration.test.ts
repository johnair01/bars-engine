import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { NextRequest } from 'next/server'

// Requires a disposable local Postgres, the private-context migration, and an isolated generated client.
const enabled = !!process.env.CALRUNIA_TEST_PRISMA_CLIENT && !!process.env.DATABASE_URL && process.env.BARS_LOCAL === '1'
const state = vi.hoisted(() => ({ actor: 'test-admin', db: null as any }))
vi.mock('@/lib/between/store', () => ({ currentPlayer: async () => ({ id: state.actor }) }))
vi.mock('@/lib/db', () => ({ db: new Proxy({}, { get: (_target, key) => state.db[key] }) }))
import { GET, POST } from './route'

describe.skipIf(!enabled)('Calrunia private capture against disposable Postgres', () => {
  let barId: string | undefined
  beforeAll(async () => {
    const moduleUrl = pathToFileURL(process.env.CALRUNIA_TEST_PRISMA_CLIENT!).href
    const { PrismaClient } = await import(/* @vite-ignore */ moduleUrl)
    state.db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
  })
  afterAll(async () => {
    if (barId) await state.db.customBar.deleteMany({ where: { id: barId, creatorId: 'test-admin' } })
    await state.db.$disconnect()
  })
  it('saves and reloads private context only after owner authorization', async () => {
    const charge = JSON.parse(readFileSync(join(process.cwd(), 'public/between/ctw/sample-player.json'), 'utf8'))
    const req = new NextRequest('http://localhost/api/calrunia/kept', { method: 'POST', body: JSON.stringify({ content: 'Disposable test kernel', charge, notes: [1, 3] }) })
    const response = await POST(req)
    expect(response.status).toBe(201)
    barId = (await response.json()).id
    const row = await state.db.customBar.findUnique({ where: { id: barId } })
    expect(JSON.parse(row.agentMetadata)).toEqual({ source: 'calrunia_return_v2' })
    expect(row.agentMetadata).not.toContain(charge.q1.words)
    const privateRow = await state.db.calruniaBarPrivateContext.findUnique({ where: { barId } })
    expect(privateRow.data).toMatchObject({ charge: { q1: charge.q1 }, notes: [1, 3] })
    const owner = await GET(new NextRequest('http://localhost/api/calrunia/kept?id=' + barId))
    expect((await owner.json()).bar).toMatchObject({ id: barId, notes: [1, 3] })
    await state.db.barShare.create({ data: { barId, fromUserId: 'test-admin', toUserId: 'test-argyra-bold-heart' } })
    state.actor = 'test-argyra-bold-heart'
    const denied = await GET(new NextRequest('http://localhost/api/calrunia/kept?id=' + barId))
    expect(denied.status).toBe(404)
    await state.db.customBar.update({ where: { id: barId }, data: { visibility: 'public' } })
    const publicDenied = await GET(new NextRequest('http://localhost/api/calrunia/kept?id=' + barId))
    expect(publicDenied.status).toBe(404)
    // Ordinary BAR/share reads have no private snapshot on the BAR row.
    const shared = await state.db.barShare.findFirst({ where: { barId, toUserId: state.actor }, include: { bar: true } })
    expect(shared.bar.agentMetadata).toBe('{"source":"calrunia_return_v2"}')
    expect(JSON.stringify(shared)).not.toContain(charge.q1.words)
    state.actor = 'test-admin'
    await state.db.customBar.delete({ where: { id: barId } })
    expect(await state.db.calruniaBarPrivateContext.findUnique({ where: { barId } })).toBeNull()
    barId = undefined
  })
})

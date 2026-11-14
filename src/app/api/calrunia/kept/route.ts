/** Private, deliberate capture of a Calrunia encounter kernel and its return context. */
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { currentPlayer } from '@/lib/between/store'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization'
import { read } from '../../../../../public/calrunia/episode-sheet.js'

export const dynamic = 'force-dynamic'
const SOURCE = 'calrunia_return_v2'
const LIMIT = 32_000
const noStore = { 'Cache-Control': 'no-store' }

function stored(raw: string | null): boolean {
  try {
    const v = JSON.parse(raw || 'null')
    return !!v && v.source === SOURCE
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to see what you kept.' }, { status: 401, headers: noStore })
  const id = req.nextUrl.searchParams.get('id')
  if (id && (id.length > 100 || !/^[\w-]+$/.test(id))) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: noStore })
  const rows = await db.customBar.findMany({
    where: { creatorId: player.id, type: 'bar', status: 'active', archivedAt: null, ...(id ? { id } : {}), agentMetadata: { contains: SOURCE } },
    select: { id: true, title: true, description: true, agentMetadata: true, createdAt: true },
    orderBy: { createdAt: 'desc' }, take: id ? 1 : 50,
  })
  const records = rows.flatMap(row => {
    if (!stored(row.agentMetadata)) return []
    return [{ id: row.id, title: row.title, content: row.description, createdAt: row.createdAt }]
  })
  if (id && !records.length) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: noStore })
  if (id) {
    // Fetch the private context only after the BAR was found for this owner.
    const context = await db.calruniaBarPrivateContext.findFirst({ where: { barId: id, bar: { creatorId: player.id, type: 'bar', status: 'active', archivedAt: null } }, select: { data: true } })
    if (!context || !context.data || typeof context.data !== 'object' || Array.isArray(context.data))
      return NextResponse.json({ error: 'This journey cannot yet be reopened.' }, { status: 409, headers: noStore })
    const data = context.data as { charge?: unknown; notes?: unknown }
    if (!data.charge || !Array.isArray(data.notes)) return NextResponse.json({ error: 'This journey cannot yet be reopened.' }, { status: 409, headers: noStore })
    return NextResponse.json({ bar: { ...records[0], charge: data.charge, notes: data.notes } }, { headers: noStore })
  }
  return NextResponse.json({ bars: records }, { headers: noStore })
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to keep this.' }, { status: 401, headers: noStore })
  const raw = await req.text()
  if (raw.length > LIMIT) return NextResponse.json({ error: 'This is too large to keep.' }, { status: 413, headers: noStore })
  let data: { content?: unknown; charge?: unknown; notes?: unknown }
  try { data = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Could not read this.' }, { status: 400, headers: noStore }) }
  const content = typeof data?.content === 'string' ? data.content.trim() : ''
  if (!content || content.length > 1000 || !data.charge || typeof data.charge !== 'object' || Array.isArray(data.charge))
    return NextResponse.json({ error: 'Choose what you want to keep.' }, { status: 400, headers: noStore })
  if (!Array.isArray(data.notes) || data.notes.length > 6 || !data.notes.every(n => Number.isInteger(n) && n >= 0 && n <= 4))
    return NextResponse.json({ error: 'Those notes could not be kept.' }, { status: 400, headers: noStore })
  // Only the player's intake context is saved; authored/generated scene text is rebuilt on return.
  const input = data.charge as Record<string, unknown>
  const charge = Object.fromEntries(['id', 'player', 'episode', 'line', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6'].filter(k => k in input).map(k => [k, input[k]]))
  try {
    const result = await read(charge)
    if (result.errors) return NextResponse.json({ error: 'This journey cannot yet be reopened.' }, { status: 400, headers: noStore })
  } catch { return NextResponse.json({ error: 'This journey cannot yet be reopened.' }, { status: 400, headers: noStore }) }
  const id = randomUUID()
  await db.$transaction(async tx => {
    await tx.customBar.create({ data: {
      id, creatorId: player.id, title: content.split(/\r?\n/)[0].slice(0, 80), description: content,
      type: 'bar', reward: 0, visibility: 'private', status: 'active', inputs: '[]', rootId: id,
      seedMetabolization: mergeSeedMetabolization(null, { maturity: 'captured', soilKind: 'holding_pen' }),
      agentMetadata: JSON.stringify({ source: SOURCE }),
    } })
    await tx.calruniaBarPrivateContext.create({ data: { barId: id, data: { charge, notes: data.notes } as Prisma.InputJsonValue } })
  })
  return NextResponse.json({ id }, { status: 201, headers: noStore })
}

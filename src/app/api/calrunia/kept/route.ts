/** Private, deliberate capture of a Calrunia encounter kernel and its return context. */
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer } from '@/lib/between/store'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization'
import { read } from '../../../../../public/calrunia/episode-sheet.js'

export const dynamic = 'force-dynamic'
const SOURCE = 'calrunia_return_v1'
const LIMIT = 32_000
const noStore = { 'Cache-Control': 'no-store' }

function stored(raw: string | null): { source: string; charge: Record<string, unknown>; notes: number[] } | null {
  try {
    const v = JSON.parse(raw || 'null')
    return v && v.source === SOURCE && v.charge && typeof v.charge === 'object' && !Array.isArray(v.charge) && Array.isArray(v.notes) ? v : null
  } catch { return null }
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
    const meta = stored(row.agentMetadata)
    if (!meta) return []
    return [{ id: row.id, title: row.title, content: row.description, createdAt: row.createdAt, ...(id ? { charge: meta.charge, notes: meta.notes } : {}) }]
  })
  if (id && !records.length) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: noStore })
  return NextResponse.json(id ? { bar: records[0] } : { bars: records }, { headers: noStore })
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
  await db.customBar.create({ data: {
    id, creatorId: player.id, title: content.split(/\r?\n/)[0].slice(0, 80), description: content,
    type: 'bar', reward: 0, visibility: 'private', status: 'active', inputs: '[]', rootId: id,
    seedMetabolization: mergeSeedMetabolization(null, { maturity: 'captured', soilKind: 'holding_pen' }),
    agentMetadata: JSON.stringify({ source: SOURCE, charge, notes: data.notes }),
  } })
  return NextResponse.json({ id }, { status: 201, headers: noStore })
}

/**
 * @route GET /api/between/seedbed
 * @entity PLAYER
 * @description The seed bed in the signed-in player's hollow: the light BARs in their seed bag, the plants in the bed and the mana they hold, by element
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (CustomBar.seedMetabolization.plant, BetweenPrivate pouch)
 * @example GET /api/between/seedbed
 * @agentDiscoverable false
 *
 * @route POST /api/between/seedbed
 * @description Plants a light BAR in the hollow's bed with the player's line of intent, or tends a plant with one mana of its element
 * @permissions signed-in player (bars_player_id cookie); only their own BARs
 * @example POST /api/between/seedbed { "act": "plant", "bar": "cl...", "intent": "I want to ask for help before I'm drowning." }
 * @example POST /api/between/seedbed { "act": "tend", "bar": "cl..." }
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentPlayer } from '@/lib/between/store'
import { manaOf, plantInHollow, tendPlant } from '@/lib/garden/plant'
import { effectiveMaturity, parseSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { INNER_GARDEN_CAPTURE_TYPES } from '@/lib/inner-garden/bridge'
import { elementOf } from '../../../../../public/between/seedbed.js'

export const dynamic = 'force-dynamic'

/* Six-faces-council bars-garden slice 1 (his A on bg-first-minute-look-1): the first minute in the hollow. The words the
   page shows are the BAR's own and the player's line, untouched; nothing here counts for the page (FR-007). */
const SEED_BAG = 3
const BED_HOLDS = 7

export async function GET() {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to tend your seeds' }, { status: 401 })
  const base = { creatorId: player.id, status: 'active', archivedAt: null, isSystem: false, inviteId: null, mergedIntoId: null }
  const select = { id: true, title: true, description: true, nation: true, emotionalAlchemyTag: true, seedMetabolization: true, createdAt: true } as const
  const [light, planted, mana] = await Promise.all([
    db.customBar.findMany({ where: { ...base, type: { in: [...INNER_GARDEN_CAPTURE_TYPES] } }, orderBy: { createdAt: 'desc' }, take: 40, select }),
    db.customBar.findMany({ where: { ...base, seedMetabolization: { contains: '"bed":"hollow"' } }, orderBy: { createdAt: 'asc' }, take: BED_HOLDS, select }),
    manaOf(player.id),
  ])
  const words = (b: { title: string; description: string }) => (b.description && b.description.trim()) || b.title
  const bag = light
    .filter(b => { const s = parseSeedMetabolization(b.seedMetabolization); return !s.plant && effectiveMaturity(s) === 'captured' })
    .slice(0, SEED_BAG)
    .map(b => ({ id: b.id, title: b.title, words: words(b), element: elementOf(b), at: b.createdAt.toISOString() }))
  const bed = planted.flatMap(b => {
    const s = parseSeedMetabolization(b.seedMetabolization)
    return s.plant && s.plant.bed === 'hollow' ? [{ id: b.id, title: b.title, words: words(b), maturity: effectiveMaturity(s), plant: s.plant }] : []
  })
  return NextResponse.json({ bag, bed, mana })
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to tend your seeds' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { act?: string; bar?: string; intent?: string } | null
  const bar = typeof body?.bar === 'string' ? body.bar.slice(0, 64) : ''
  if (!bar) return NextResponse.json({ error: 'Name the seed' }, { status: 400 })
  if (body?.act === 'plant') {
    const r = await plantInHollow(player.id, bar, typeof body.intent === 'string' ? body.intent : undefined)
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.why }, { status: r.status })
  }
  if (body?.act === 'tend') {
    const r = await tendPlant(player.id, bar)
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.why }, { status: r.status })
  }
  return NextResponse.json({ error: 'Plant or tend' }, { status: 400 })
}

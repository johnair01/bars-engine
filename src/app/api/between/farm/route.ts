/**
 * @route GET /api/between/farm
 * @entity PLAYER
 * @description The signed-in player's private farm: the slot grid, mana, harvests, and the seeds (BARs sent from /bars/{id}). Weeds are settled against the player's local date.
 * @permissions signed-in player (bars_player_id cookie)
 * @relationships PLAYER (BetweenPrivate key "farm" on the homeroom)
 * @example GET /api/between/farm?today=2026-11-09
 * @agentDiscoverable false
 *
 * @route POST /api/between/farm
 * @description One farm act: enter, till, plant, water, ripen, reclear, pick (six-faces-council .specify/specs/bars-farm)
 * @permissions signed-in player (bars_player_id cookie)
 * @example POST /api/between/farm { "act": "till", "i": 17, "today": "2026-11-09" }
 */
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { currentPlayer, ensureHome } from '@/lib/between/store'
import { mintVibulon } from '@/actions/economy'
import * as F from '@/lib/between/farm'
import { readSeeds } from '@/lib/bar-to-work/seeds'
import { WORK_TYPE_LABEL } from '@/lib/bar-to-work/sort'

export const dynamic = 'force-dynamic'

const localDay = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 10))

async function load(playerId: string) {
  const { home } = await ensureHome(playerId)
  if (!home) return null
  const row = await db.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId: home.id, playerId, key: 'farm' } } })
  const raw = row?.data as Partial<F.Farm> | undefined
  const farm: F.Farm = raw && typeof raw === 'object' ? { ...F.newFarm(), ...raw } : F.newFarm()
  return { gardenId: home.id, farm }
}

const save = (gardenId: string, playerId: string, farm: F.Farm) => {
  const data = farm as unknown as Prisma.InputJsonValue
  return db.betweenPrivate.upsert({
    where: { gardenId_playerId_key: { gardenId, playerId, key: 'farm' } },
    create: { gardenId, playerId, key: 'farm', data }, update: { data },
  })
}

export async function GET(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to open the farm' }, { status: 401 })
  const s = await load(player.id)
  if (!s) return NextResponse.json({ error: 'No homeroom yet' }, { status: 409 })
  const today = localDay(req.nextUrl.searchParams.get('today'))
  const farm = F.settle(s.farm, today)
  const seeds = (await readSeeds(s.gardenId, player.id)).map(x => ({ ...x, workTypeLabel: WORK_TYPE_LABEL[x.workType] }))
  return NextResponse.json({ farm, seeds, today, first: !s.farm.firstEntryAt, cols: F.COLS, rows: F.ROWS })
}

export async function POST(req: NextRequest) {
  const player = await currentPlayer()
  if (!player) return NextResponse.json({ error: 'Sign in to bars-engine to tend the farm' }, { status: 401 })
  const b = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!b || typeof b.act !== 'string') return NextResponse.json({ error: 'Name the act' }, { status: 400 })
  const s = await load(player.id)
  if (!s) return NextResponse.json({ error: 'No homeroom yet' }, { status: 409 })
  const today = localDay(b.today)
  const now = new Date().toISOString()
  const i = Number(b.i)
  const base = F.settle(s.farm, today)
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  let r: F.Result
  switch (b.act) {
    case 'enter': r = { farm: F.enter(base, now), ok: true, mint: 0 }; break
    case 'till': r = F.till(base, i, now); break
    case 'plant': r = F.plant(base, i, str(b.barId), str(b.line), now, today); break
    case 'water': r = F.water(base, i, typeof b.aligned === 'string' && b.aligned ? { aligned: b.aligned } : 'mana', today); break
    case 'ripen': r = F.ripen(base, i, str(b.line), today); break
    case 'reclear': r = F.reclear(base, i, str(b.line), today); break
    case 'pick': r = F.pick(base, i, today); break
    default: return NextResponse.json({ error: 'Unknown act' }, { status: 400 })
  }
  if (!r.ok) return NextResponse.json({ error: r.why, farm: base }, { status: 422 })
  await save(s.gardenId, player.id, r.farm)
  if (r.mint > 0) {
    const title = b.act === 'pick' ? 'Farm harvest' : b.act === 'reclear' ? 'Farm return' : 'Farm aligned action'
    await mintVibulon(player.id, r.mint, { source: 'farm', id: `farm-${i}-${today}`, title })
  }
  return NextResponse.json({ farm: r.farm, mint: r.mint, harvest: r.harvest ?? null })
}

/**
 * A seed: a BAR the player sent to their farm. The list lives in BetweenPrivate key "seeds" next to the farm's own
 * doc, so no migration is needed. The marker `origin: 'bar-to-work'` and the ticket key `bar/<id>` tell the test BAR
 * from every other BAR.
 */
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { ensureHome } from '@/lib/between/store'
import { pushTicket } from '@/lib/work/queue'
import { sortBar, type WorkType } from './sort'

export const ORIGIN = 'bar-to-work'
export const SEEDS_KEY = 'seeds'
export const MAX_SEEDS = 200

export type SeedStatus = 'sorted' | 'spec_draft' | 'spec_merged' | 'pr_open' | 'done'
export type Seed = {
  barId: string
  title: string
  origin: typeof ORIGIN
  workType: WorkType
  rule: string
  status: SeedStatus
  sentAt: string
  ticketKey: string
  specKey: string | null
  specUrl: string | null
  prUrl: string | null
}

export const ticketKey = (barId: string) => `bar/${barId}`
export const specKeyFor = (barId: string) => `bar-${barId}`

export type PlayerFacts = { hasFarm: boolean; hasCharacter: boolean }

/** A farm exists once the player has entered it (the farm doc stamps firstEntryAt). */
export const farmExists = (farmDoc: unknown) =>
  !!farmDoc && typeof farmDoc === 'object' && typeof (farmDoc as { firstEntryAt?: unknown }).firstEntryAt === 'string'

/** A character exists once the creator has set an avatar, or a nation and an archetype. */
export const characterExists = (p: { avatarConfig: string | null; nationId: string | null; archetypeId: string | null }) =>
  !!p.avatarConfig || (!!p.nationId && !!p.archetypeId)

export function why(f: PlayerFacts): string | null {
  if (!f.hasFarm && !f.hasCharacter) return 'Make your character and open your farm first, then send the BAR.'
  if (!f.hasCharacter) return 'Make your character first, then send the BAR to your farm.'
  if (!f.hasFarm) return 'Open your farm once first, then send the BAR to it.'
  return null
}

export async function playerFacts(playerId: string) {
  const [p, home] = await Promise.all([
    db.player.findUnique({ where: { id: playerId }, select: { avatarConfig: true, nationId: true, archetypeId: true } }),
    ensureHome(playerId),
  ])
  const gardenId = home.home?.id ?? null
  const farm = gardenId
    ? await db.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId, playerId, key: 'farm' } } })
    : null
  return { gardenId, facts: { hasFarm: farmExists(farm?.data), hasCharacter: !!p && characterExists(p) } }
}

export async function readSeeds(gardenId: string, playerId: string): Promise<Seed[]> {
  const row = await db.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId, playerId, key: SEEDS_KEY } } })
  const d = row?.data as { seeds?: unknown } | undefined
  return Array.isArray(d?.seeds) ? (d!.seeds as Seed[]) : []
}

export async function writeSeeds(gardenId: string, playerId: string, seeds: Seed[]) {
  const data = { seeds: seeds.slice(0, MAX_SEEDS) } as unknown as Prisma.InputJsonValue
  await db.betweenPrivate.upsert({
    where: { gardenId_playerId_key: { gardenId, playerId, key: SEEDS_KEY } },
    create: { gardenId, playerId, key: SEEDS_KEY, data }, update: { data },
  })
}

export type SendResult =
  | { ok: true; seed: Seed; created: boolean }
  | { ok: false; status: number; error: string }

/** Sends one BAR the player owns to their farm: checks the farm and character, sorts, keeps the seed, queues the ticket. */
export async function sendToFarm(playerId: string, barId: string, now = new Date()): Promise<SendResult> {
  const bar = await db.customBar.findUnique({ where: { id: barId }, select: { id: true, creatorId: true, title: true, description: true, type: true } })
  if (!bar) return { ok: false, status: 404, error: 'That BAR was not found.' }
  if (bar.creatorId !== playerId) return { ok: false, status: 403, error: 'Only the BAR\'s maker can send it to their farm.' }
  const { gardenId, facts } = await playerFacts(playerId)
  const no = why(facts)
  if (no || !gardenId) return { ok: false, status: 409, error: no ?? 'No homeroom yet.' }
  const seeds = await readSeeds(gardenId, playerId)
  const found = seeds.find(s => s.barId === barId)
  if (found) return { ok: true, seed: found, created: false }
  const { type, rule } = sortBar({ title: bar.title, description: bar.description, type: bar.type })
  const seed: Seed = {
    barId, title: bar.title, origin: ORIGIN, workType: type, rule, status: 'sorted', sentAt: now.toISOString(),
    ticketKey: ticketKey(barId), specKey: null, specUrl: null, prUrl: null,
  }
  await writeSeeds(gardenId, playerId, [seed, ...seeds])
  await pushTicket(db, {
    sourceKey: seed.ticketKey,
    title: `Write the spec for BAR: ${bar.title}`.slice(0, 200),
    brief: `A player sent a BAR to their farm (origin ${ORIGIN}). Work type: ${type} (rule ${rule}).\n\n`
      + `BAR title: ${bar.title}\n\n${bar.description}\n\nWrite its spec and post it with POST /api/specs (key ${specKeyFor(barId)}, barId ${barId}), `
      + 'with the steps Ouroboros and the no-model fallback can follow. When the spec is merged, a lane pulls it from GET /api/specs/<key> or the MCP tool get_spec.',
    basis: { rows: [`bar-${barId}`], answer: type, label: 'BAR sent to farm', steer: '', savedAt: now.toISOString() },
    lanes: ['claude'],
  })
  return { ok: true, seed, created: true }
}

export type SeedPatch = Partial<Pick<Seed, 'status' | 'specKey' | 'specUrl' | 'prUrl'>>

/** Forward links: finds the BAR's maker and updates their seed. Returns the seed, or null when the BAR was never sent. */
export async function linkSeed(barId: string, patch: SeedPatch): Promise<Seed | null> {
  const bar = await db.customBar.findUnique({ where: { id: barId }, select: { creatorId: true } })
  if (!bar) return null
  const { home } = await ensureHome(bar.creatorId)
  if (!home) return null
  const seeds = await readSeeds(home.id, bar.creatorId)
  const i = seeds.findIndex(s => s.barId === barId)
  if (i < 0) return null
  seeds[i] = { ...seeds[i], ...patch }
  await writeSeeds(home.id, bar.creatorId, seeds)
  return seeds[i]
}

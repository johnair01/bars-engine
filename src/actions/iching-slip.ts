'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization'
import { PAIRS, snapshotOf, STOCK } from '../../public/between/iching/two-move.js'

/**
 * The I Ching two-move card's slip is a BAR seed (Six-faces-council .specify/specs/iching-two-move FR-008 to FR-010,
 * his note on ic2-pairs-look-1). Taking a slip plants a seed in the satchel; doing it grows the seed into a BAR; the
 * "Where this fits in the story" line is only ever written by the player. Letting go composts the seed with
 * `compostBarSeed` in ./bar-seed-metabolization (restorable). The slip not taken saves nothing.
 */

export type TakeSlipInput = {
  chargeId?: string
  hexagram: number
  slip: { side: 'inner' | 'outer'; trigram: string; good: string }
  campaignRef?: string | null
}

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

function validSlip(s: TakeSlipInput['slip']): boolean {
  const pair = (PAIRS as Record<string, string[]>)[s?.trigram]
  return !!pair && pair.includes(s.good) && (s.side === 'inner' || s.side === 'outer')
}

type SlipInputs = { source: 'iching-two-move'; whatHappened: string | null; storyFit: string | null }

function parseInputs(raw: string | null | undefined): SlipInputs | null {
  try {
    const v = JSON.parse(raw ?? '')
    return v && v.source === 'iching-two-move' ? { source: v.source, whatHappened: v.whatHappened ?? null, storyFit: v.storyFit ?? null } : null
  } catch {
    return null
  }
}

export async function takeSlip(input: TakeSlipInput): Promise<{ barId?: string; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  if (!Number.isInteger(input.hexagram) || input.hexagram < 1 || input.hexagram > 64) return { error: 'Not a hexagram.' }
  if (!validSlip(input.slip)) return { error: 'Not a slip.' }

  const stock = (STOCK as Record<string, { move: string; overdone: string }>)[input.slip.good]
  const snapshot = snapshotOf(input.hexagram, input.slip as never, input.chargeId ?? null, new Date().toISOString())
  const inputs: SlipInputs = { source: 'iching-two-move', whatHappened: null, storyFit: null }
  const seed = mergeSeedMetabolization(null, { soilKind: 'campaign', maturity: 'captured' })

  const bar = await db.customBar.create({
    data: {
      creatorId: playerId,
      title: `${input.slip.good}: ${stock.move}`.slice(0, 200),
      description: `Hexagram ${input.hexagram}, the ${input.slip.side} move (${input.slip.trigram}). ${stock.overdone}`,
      type: 'bar',
      reward: 0,
      visibility: 'private',
      status: 'active',
      campaignRef: input.campaignRef ?? null,
      plantSnapshot: snapshot,
      seedMetabolization: seed,
      inputs: JSON.stringify(inputs),
    },
    select: { id: true },
  })
  revalidatePath('/bars')
  revalidatePath('/bars/garden')
  return { barId: bar.id }
}

async function ownedSlip(barId: string, playerId: string) {
  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, seedMetabolization: true, inputs: true, plantSnapshot: true, archivedAt: true },
  })
  if (!bar) return { error: 'BAR not found' as const }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' as const }
  const snap = bar.plantSnapshot as { source?: string } | null
  if (snap?.source !== 'iching-two-move') return { error: 'This BAR is not a slip.' as const }
  return { bar }
}

/** Marks the seed done with one line of what happened: maturity captured to shared_or_acted. Nothing checks the line (FR-009). */
export async function markSlipDone(barId: string, input: { whatHappened: string }): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  const got = await ownedSlip(barId, playerId)
  if ('error' in got) return { error: got.error }
  const line = String(input?.whatHappened ?? '').trim().slice(0, 2000)
  if (!line) return { error: 'Write one line of what happened.' }
  const prev = parseInputs(got.bar.inputs) ?? { source: 'iching-two-move' as const, whatHappened: null, storyFit: null }
  await db.customBar.update({
    where: { id: barId },
    data: {
      seedMetabolization: mergeSeedMetabolization(got.bar.seedMetabolization, { maturity: 'shared_or_acted' }),
      inputs: JSON.stringify({ ...prev, whatHappened: line }),
    },
  })
  revalidatePath('/bars')
  revalidatePath(`/bars/${barId}`)
  return { ok: true }
}

/** "Where this fits in the story": only the player writes it (FR-010); the game never fills it. */
export async function setSlipStory(barId: string, input: { storyFit: string }): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  const got = await ownedSlip(barId, playerId)
  if ('error' in got) return { error: got.error }
  const prev = parseInputs(got.bar.inputs) ?? { source: 'iching-two-move' as const, whatHappened: null, storyFit: null }
  await db.customBar.update({
    where: { id: barId },
    data: { inputs: JSON.stringify({ ...prev, storyFit: String(input?.storyFit ?? '').trim().slice(0, 2000) || null }) },
  })
  revalidatePath(`/bars/${barId}`)
  return { ok: true }
}

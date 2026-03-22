'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  MATURITY_PHASES,
  SOIL_KINDS,
  type MaturityPhase,
  type SoilKind,
  mergeSeedMetabolization,
} from '@/lib/bar-seed-metabolization'

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

const BSM_TYPES = new Set<string>(['bar', 'charge_capture'])

function revalidateBarPaths(barId: string) {
  revalidatePath('/bars')
  revalidatePath(`/bars/${barId}`)
  revalidatePath('/bars/garden')
}

export async function nameBarSeedSoil(
  barId: string,
  input: { soilKind: SoilKind | null; contextNote?: string | null }
): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, type: true, seedMetabolization: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' }
  if (!BSM_TYPES.has(bar.type)) return { error: 'This BAR type does not support seed soil.' }

  const soil = input.soilKind
  if (soil != null && !SOIL_KINDS.includes(soil)) return { error: 'Invalid soil choice.' }

  const notePatch =
    input.contextNote === undefined
      ? {}
      : { contextNote: (String(input.contextNote).trim().slice(0, 2000) || null) as string | null }

  const merged = mergeSeedMetabolization(bar.seedMetabolization, {
    soilKind: soil,
    ...notePatch,
  })

  await db.customBar.update({
    where: { id: barId },
    data: { seedMetabolization: merged },
  })
  revalidateBarPaths(barId)
  return { ok: true }
}

export async function updateBarSeedMaturity(
  barId: string,
  input: { maturity: MaturityPhase }
): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  if (!MATURITY_PHASES.includes(input.maturity)) return { error: 'Invalid maturity.' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, type: true, seedMetabolization: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' }
  if (!BSM_TYPES.has(bar.type)) return { error: 'This BAR type does not support maturity.' }

  const merged = mergeSeedMetabolization(bar.seedMetabolization, { maturity: input.maturity })

  await db.customBar.update({
    where: { id: barId },
    data: { seedMetabolization: merged },
  })
  revalidateBarPaths(barId)
  return { ok: true }
}

export async function compostBarSeed(
  barId: string,
  input?: { releaseNote?: string | null }
): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, type: true, seedMetabolization: true, archivedAt: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' }
  if (!BSM_TYPES.has(bar.type)) return { error: 'This BAR type cannot be composted here.' }
  if (bar.archivedAt) return { error: 'Already composted.' }

  const release =
    input?.releaseNote == null || input.releaseNote === ''
      ? undefined
      : String(input.releaseNote).trim().slice(0, 2000)

  const nowIso = new Date().toISOString()
  const merged = mergeSeedMetabolization(bar.seedMetabolization, {
    maturity: 'integrated',
    compostedAt: nowIso,
    ...(release ? { releaseNote: release } : {}),
  })

  await db.customBar.update({
    where: { id: barId },
    data: {
      archivedAt: new Date(),
      seedMetabolization: merged,
    },
  })
  revalidateBarPaths(barId)
  return { ok: true }
}

export async function restoreBarSeedFromCompost(barId: string): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, type: true, seedMetabolization: true, archivedAt: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' }
  if (!BSM_TYPES.has(bar.type)) return { error: 'Not supported.' }
  if (!bar.archivedAt) return { error: 'This seed is not composted.' }

  const merged = mergeSeedMetabolization(bar.seedMetabolization, {
    compostedAt: null,
    releaseNote: null,
  })

  await db.customBar.update({
    where: { id: barId },
    data: {
      archivedAt: null,
      seedMetabolization: merged,
    },
  })
  revalidateBarPaths(barId)
  return { ok: true }
}

/** Thin wrapper — graduates seed to quest via existing grow flow. */
export async function graduateBarSeedToQuest(barId: string) {
  const { growQuestFromBar } = await import('@/actions/bars')
  return growQuestFromBar(barId)
}

'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization'
import { ENDINGS, MAX_SENTENCE, QUEST_SOURCE, oneLine, type QuestEnding } from '@/lib/heaven-quest-bar'

/**
 * The Heaven Sect quest's BAR ("Tonight, before you sleep"; plan heaven-quest-demo step 4, board bhq-overnight-1 A:
 * a guest signs in for anything past tonight). One sentence is saved: the act the player wrote. The doubt sentences,
 * the 3-2-1 lines and any person's name never come here (bhq-who-stays-local). A report is what the player says
 * happened, never a score: every ending is saved the same way (bhq-tried-is-report, bhq-named-endings).
 */

type QuestInputs = { source: typeof QUEST_SOURCE; sentence: string; ending: QuestEnding | null; whatHappened: string | null }

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

function parseInputs(raw: string | null | undefined): QuestInputs | null {
  try {
    const v = JSON.parse(raw ?? '')
    return v && v.source === QUEST_SOURCE ? { source: QUEST_SOURCE, sentence: String(v.sentence ?? ''), ending: v.ending ?? null, whatHappened: v.whatHappened ?? null } : null
  } catch {
    return null
  }
}

/** Saves the BAR sentence as a private BAR seed in the player's satchel. */
export async function takeQuestBar(input: { sentence: string }): Promise<{ barId?: string; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  const sentence = oneLine(input?.sentence, MAX_SENTENCE)
  if (!sentence) return { error: 'Write the act first.' }
  const inputs: QuestInputs = { source: QUEST_SOURCE, sentence, ending: null, whatHappened: null }
  const bar = await db.customBar.create({
    data: {
      creatorId: playerId,
      title: 'Tonight, before you sleep',
      description: sentence,
      type: 'bar',
      reward: 0,
      visibility: 'private',
      status: 'active',
      plantSnapshot: { source: QUEST_SOURCE, takenAt: new Date().toISOString() },
      seedMetabolization: mergeSeedMetabolization(null, { soilKind: 'campaign', maturity: 'captured' }),
      inputs: JSON.stringify(inputs),
    },
    select: { id: true },
  })
  revalidatePath('/bars')
  return { barId: bar.id }
}

/** The player's newest quest BAR that has no ending yet, or none. Signed-out gets "Not logged in". */
export async function openQuestBar(): Promise<{ bar: { id: string; sentence: string } | null; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { bar: null, error: 'Not logged in' }
  const rows = await db.customBar.findMany({
    where: { creatorId: playerId, archivedAt: null, plantSnapshot: { path: ['source'], equals: QUEST_SOURCE } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, inputs: true },
  })
  for (const r of rows) {
    const p = parseInputs(r.inputs)
    if (p && !p.ending) return { bar: { id: r.id, sentence: p.sentence } }
  }
  return { bar: null }
}

/** The player's report. Any of the four endings closes the BAR; a line is needed only for "tried". */
export async function reportQuestBar(barId: string, input: { ending: string; whatHappened?: string }): Promise<{ ok?: true; error?: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }
  const ending = input?.ending as QuestEnding
  if (!ENDINGS.includes(ending)) return { error: 'Say how it went.' }
  const line = oneLine(input?.whatHappened, 2000)
  if (ending === 'tried' && !line) return { error: 'Write one line of what happened.' }
  const bar = await db.customBar.findUnique({
    where: { id: String(barId ?? '') },
    select: { id: true, creatorId: true, seedMetabolization: true, inputs: true, plantSnapshot: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: 'Not authorized' }
  const prev = parseInputs(bar.inputs)
  if (!prev) return { error: 'This BAR is not a quest BAR.' }
  const acted = ending === 'tried' || ending === 'smaller'
  await db.customBar.update({
    where: { id: bar.id },
    data: {
      seedMetabolization: acted ? mergeSeedMetabolization(bar.seedMetabolization, { maturity: 'shared_or_acted' }) : bar.seedMetabolization ?? undefined,
      inputs: JSON.stringify({ ...prev, ending, whatHappened: line || null }),
    },
  })
  revalidatePath('/bars')
  revalidatePath(`/bars/${bar.id}`)
  return { ok: true }
}

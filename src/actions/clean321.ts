'use server'

/**
 * completeClean321 — persistence for the canonical 3·2·1 "Clean Up" flow
 * (src/components/clean321/Clean321Flow.tsx). The flow itself stays local while
 * the player authors the thread; on "Carry these into the day" it lands here:
 *
 *  1. Record the session — reuse `persist321Session` (writes the Shadow321Session,
 *     the Shaman "name shadow belief" witness BAR, and the 321 blessed-object unlock).
 *  2. Author the bridge tasks as BARs dealt into the Hand — `captureBar(... 'hand')`,
 *     which is daily-session-independent (Clean Up runs standalone on the NOW page)
 *     and routes to the Vault if the Hand is full.
 *  3. Mint the charge reward — ♦ +1 base, +1 bonus when the charge dropped by > 2.
 */

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { persist321Session } from '@/actions/charge-metabolism'
import { captureBar } from '@/actions/capture-bar'
import { mintVibulon } from '@/actions/economy'

type Clean321Message = { phase: 3 | 2 | 1; voice: 'you' | 'it'; text: string }

const CHARGE_DROP_THRESHOLD = 2

export async function completeClean321(input: {
  chargeBefore: number
  chargeAfter: number
  messages: Clean321Message[]
  tasks: string[]
}): Promise<{ barIds: string[]; minted: number } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const tasks = (input.tasks || []).map((t) => t.trim()).filter(Boolean).slice(0, 5)
  const messages = input.messages ?? []

  try {
    // 1. Record the 321 session (witness BAR + blessed object via persist321Session).
    const faceText = messages.filter((m) => m.phase === 3).map((m) => m.text).join('\n').trim()
    const phase3Snapshot = JSON.stringify({ identityFreeText: faceText || undefined })
    const phase2Snapshot = JSON.stringify({
      thread: messages,
      chargeBefore: input.chargeBefore,
      chargeAfter: input.chargeAfter,
    })
    await persist321Session({
      phase3Snapshot,
      phase2Snapshot,
      outcome: tasks.length > 0 ? 'bar_created' : 'skipped',
    })

    // 2. Author the bridge tasks as BARs dealt into the Hand (session-independent).
    const barIds: string[] = []
    for (const content of tasks) {
      const res = await captureBar({ content, destination: 'hand' })
      if ('success' in res) barIds.push(res.barId)
    }

    // 3. Mint the charge reward.
    const drop = input.chargeBefore - input.chargeAfter
    const minted = 1 + (drop > CHARGE_DROP_THRESHOLD ? 1 : 0)
    await mintVibulon(player.id, minted, {
      source: 'clean_321_completion',
      id: `clean321:${player.id}:${input.chargeBefore}-${input.chargeAfter}`,
      title: '3·2·1 Clean Up',
    })

    revalidatePath('/')
    revalidatePath('/vault')
    return { barIds, minted }
  } catch (e) {
    console.error('[clean321:completeClean321]', e)
    return { error: 'Failed to save your 3·2·1' }
  }
}

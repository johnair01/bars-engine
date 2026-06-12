'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

/**
 * HOOK B — "Plant this seed" from the Handbook reader.
 *
 * Creates a private `player_response` BAR from a Handbook prompt + the reader's
 * answer, so it lands in the player's hand like any other BAR. Mirrors the shape
 * `data/chapters/mtgoa/chapter-1.ts` defines for its `barCreationMoments`
 * ("Name the Call"): { promptText, response, defaultMoveType, barTypeHint }.
 *
 * Follows `createOnboardingBar`'s contract: when the reader is not authenticated
 * it returns `{ pending: true }` so the client can fall back to localStorage.
 */
export interface HandbookBarPayload {
  promptText: string
  response: string
  defaultMoveType?: string
  barTypeHint?: string
}

export async function createHandbookBar(
  payload: HandbookBarPayload
): Promise<
  | { success: true; barId: string }
  | { pending: true }
  | { error: string }
> {
  const response = (payload.response || '').trim()
  if (response.length < 3) {
    return { error: 'Write at least a few words before planting this seed.' }
  }

  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) {
    // Logged-out readers persist locally; client handles the fallback.
    return { pending: true }
  }

  const firstLine = response.split(/\r?\n/)[0] || ''
  const title = (firstLine.length <= 80 ? firstLine : firstLine.slice(0, 77) + '...') || 'Name the Call'

  const completionEffects = JSON.stringify({
    source: 'handbook',
    promptText: payload.promptText,
    barTypeHint: payload.barTypeHint || 'player_response',
  })

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: playerId,
        title,
        description: response,
        type: 'bar',
        reward: 0,
        inputs: JSON.stringify([
          { key: 'response', label: 'Response', type: 'text', placeholder: '' },
        ]),
        visibility: 'private',
        status: 'active',
        moveType: payload.defaultMoveType || 'wakeUp',
        storyPath: 'collective',
        storyContent: payload.promptText || null,
        completionEffects,
        rootId: 'temp',
      },
    })

    await db.customBar.update({
      where: { id: bar.id },
      data: { rootId: bar.id },
    })

    revalidatePath('/bars')
    revalidatePath('/hand')
    revalidatePath('/')
    return { success: true, barId: bar.id }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[HANDBOOK] BAR create failed:', message)
    return { error: 'Could not plant this seed. Please try again.' }
  }
}

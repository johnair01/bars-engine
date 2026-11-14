'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { createFromBar } from '@/services/daemon-seed-service'

export type ChargeRoutingResult<T> =
  | { success: true; data: T }
  | { error: string }

/**
 * Turn a BAR with captured charge into a Daemon (legacy UI label: "daemon seed").
 */
export async function createDaemonSeedFromBar(
  barId: string,
  name?: string,
  description?: string
): Promise<ChargeRoutingResult<{ daemonSeedId: string }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }

  try {
    const seed = await createFromBar({
      barId,
      playerId: player.id,
      name: name ?? '',
      description,
    })
    revalidatePath('/')
    revalidatePath('/bars')
    revalidatePath(`/bars/${barId}`)
    revalidatePath('/daemon-seeds')
    return { success: true, data: { daemonSeedId: seed.id } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create daemon seed' }
  }
}

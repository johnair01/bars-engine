'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { createFromBar } from '@/services/daemon-seed-service'

export type AttachmentType =
  | 'SUPPORTING_CONTEXT'
  | 'CHARGE_SOURCE'
  | 'INSIGHT_LINK'
  | 'DAEMON_TRACE'

export type ChargeRoutingResult<T> =
  | { success: true; data: T }
  | { error: string }

const ROUTING_UNAVAILABLE =
  'Charge routing (Vibeulon allocation, quest/bar attachments) is not wired to the current schema.'

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

/**
 * Convert BAR charge to Vibeulon.
 */
export async function convertBarChargeToVibeulon(
  _barId: string,
  _amount?: number
): Promise<ChargeRoutingResult<{ vibeulonAmount: number }>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  return { error: ROUTING_UNAVAILABLE }
}

/**
 * Allocate BAR charge to a quest.
 */
export async function allocateBarChargeToQuest(
  _barId: string,
  _questId: string,
  _amount: number
): Promise<ChargeRoutingResult<null>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  return { error: ROUTING_UNAVAILABLE }
}

/**
 * Attach a BAR to a quest (supporting context, charge source, etc.).
 */
export async function attachBarToQuest(
  _sourceBarId: string,
  _questId: string,
  _attachmentType: AttachmentType = 'SUPPORTING_CONTEXT'
): Promise<ChargeRoutingResult<null>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  return { error: ROUTING_UNAVAILABLE }
}

/**
 * Attach a BAR to another BAR.
 */
export async function attachBarToBar(
  _sourceBarId: string,
  _targetBarId: string,
  _attachmentType: AttachmentType = 'SUPPORTING_CONTEXT'
): Promise<ChargeRoutingResult<null>> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not logged in' }
  return { error: ROUTING_UNAVAILABLE }
}

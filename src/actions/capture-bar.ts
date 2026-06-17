'use server'

/**
 * Capture-first BAR creation with a destination choice (Pokémon rule).
 *
 * A fresh capture is created as `captured` maturity and routed to either the
 * bounded Hand or the unbounded Vault. Default is Vault — zero friction,
 * capture is never blocked. Choosing Hand with a full hand creates the BAR
 * (parked in the Vault) and returns an OverflowContext for the caller to
 * resolve via resolveOverflow.
 *
 * See .specify/specs/home-vault-ia-redesign/spec.md (captureBar)
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { mergeSeedMetabolization } from '@/lib/bar-seed-metabolization/parse'
import { addBarToHand, type HandContents, type OverflowContext } from '@/actions/hand'

export type CaptureDestination = 'hand' | 'vault'

/** Maturity + provenance stamped on every fresh capture (mirrors bars.ts). */
const CAPTURE_SEED_METABOLIZATION = mergeSeedMetabolization(null, {
    maturity: 'captured',
    soilKind: 'holding_pen',
})

function deriveTitle(content: string): string {
    const firstLine = content.trim().split(/\r?\n/)[0] || ''
    if (firstLine.length <= 80) return firstLine || 'Untitled'
    return firstLine.slice(0, 77) + '...'
}

export type CaptureBarResult =
    | { success: true; barId: string; placedIn: 'vault' }
    | { success: true; barId: string; placedIn: 'hand'; hand: HandContents }
    | { success: false; barId: string; overflow: OverflowContext }
    | { error: string }

/**
 * Create a BAR and route it to the chosen destination.
 * - destination omitted/'vault' → BAR sits in the vault (no HandSlot).
 * - destination 'hand' → auto-fills an empty slot, or returns `overflow` when
 *   the hand is full (the BAR is created and waits in the vault).
 */
export async function captureBar(input: {
    content: string
    title?: string
    destination?: CaptureDestination
}): Promise<CaptureBarResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const content = (input.content || '').trim()
    if (content.length < 1) return { error: 'Add a line to capture' }

    const title = (input.title || '').trim() || deriveTitle(content)
    const destination: CaptureDestination = input.destination ?? 'vault'

    let barId: string
    try {
        const bar = await db.customBar.create({
            data: {
                creatorId: player.id,
                title,
                description: content,
                type: 'bar',
                reward: 0,
                visibility: 'private',
                status: 'active',
                inputs: '[]',
                rootId: 'temp',
                seedMetabolization: CAPTURE_SEED_METABOLIZATION,
            },
            select: { id: true },
        })
        barId = bar.id
        // Self-reference rootId (capture is its own root).
        await db.customBar.update({ where: { id: barId }, data: { rootId: barId } })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[captureBar] create failed:', message)
        return { error: 'Failed to capture. Please try again.' }
    }

    revalidatePath('/')
    revalidatePath('/vault')
    revalidatePath('/bars/garden')

    if (destination === 'vault') {
        return { success: true, barId, placedIn: 'vault' }
    }

    // destination === 'hand'
    const handResult = await addBarToHand({ barId })
    if ('error' in handResult) {
        // Created but couldn't place — it's safely in the vault.
        return { success: true, barId, placedIn: 'vault' }
    }
    if (handResult.success) {
        return { success: true, barId, placedIn: 'hand', hand: handResult.hand }
    }
    // Hand full → caller resolves the overflow; BAR waits in the vault.
    return { success: false, barId, overflow: handResult.overflow }
}

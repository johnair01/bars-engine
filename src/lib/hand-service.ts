/**
 * Hand DB operations — no 'use server', safe to import from any server code.
 *
 * 'use server' files cannot cross-import each other in Turbopack.
 * This module holds the shared constants, types, and DB helpers so both
 * actions/hand.ts (the public server-action API) and other server actions
 * (capture-bar, daily-charge) can use them without a cross-boundary import.
 */

import { dbBase } from '@/lib/db'

export const HAND_SIZE = 6

export type HandSlotBar = {
    id: string
    title: string
    type: string
    moveType: string | null
}

export type HandSlotDTO = {
    slotIndex: number // 0–5
    barId: string | null
    isCarrying: boolean
    bar: HandSlotBar | null
}

export type HandContents = {
    slots: HandSlotDTO[] // always length HAND_SIZE, ordered by slotIndex
    filledCount: number
    size: number
    carryingBarId: string | null
}

export type OverflowContext = {
    newBarId: string
    newBarTitle: string
    currentHand: Array<{ slotIndex: number; barId: string; title: string; type: string }>
}

/** Read the player's current hand from the DB. */
export async function readHandDb(playerId: string): Promise<HandContents> {
    const rows = await dbBase.handSlot.findMany({
        where: { playerId },
        orderBy: { slotIndex: 'asc' },
        include: {
            bar: { select: { id: true, title: true, type: true, moveType: true } },
        },
    })

    const bySlot = new Map<number, (typeof rows)[number]>()
    for (const r of rows) bySlot.set(r.slotIndex, r)

    const slots: HandSlotDTO[] = []
    for (let i = 0; i < HAND_SIZE; i++) {
        const r = bySlot.get(i)
        slots.push({
            slotIndex: i,
            barId: r?.barId ?? null,
            isCarrying: r?.isCarrying ?? false,
            bar: r?.bar
                ? { id: r.bar.id, title: r.bar.title, type: r.bar.type, moveType: r.bar.moveType }
                : null,
        })
    }

    const carrying = rows.find((r) => r.isCarrying && r.barId)
    return {
        slots,
        filledCount: slots.filter((s) => s.barId).length,
        size: HAND_SIZE,
        carryingBarId: carrying?.barId ?? null,
    }
}

/**
 * Add a BAR to the hand for a known player. Auto-fills the lowest empty slot.
 * Returns an OverflowContext when the hand is full.
 */
export async function addBarToHandForPlayer(
    playerId: string,
    barId: string,
): Promise<
    | { success: true; hand: HandContents }
    | { success: false; overflow: OverflowContext }
    | { error: string }
> {
    const bar = await dbBase.customBar.findFirst({
        where: { id: barId, creatorId: playerId, status: 'active', archivedAt: null },
        select: { id: true, title: true, type: true },
    })
    if (!bar) return { error: 'BAR not found or not yours' }

    const slots = await dbBase.handSlot.findMany({ where: { playerId } })

    if (slots.some((s) => s.barId === barId)) {
        return { success: true, hand: await readHandDb(playerId) }
    }

    const usedIndexes = new Set(slots.filter((s) => s.barId).map((s) => s.slotIndex))
    let emptyIndex = -1
    for (let i = 0; i < HAND_SIZE; i++) {
        if (!usedIndexes.has(i)) {
            emptyIndex = i
            break
        }
    }

    if (emptyIndex === -1) {
        const filled = await dbBase.handSlot.findMany({
            where: { playerId, barId: { not: null } },
            orderBy: { slotIndex: 'asc' },
            include: { bar: { select: { id: true, title: true, type: true } } },
        })
        return {
            success: false,
            overflow: {
                newBarId: bar.id,
                newBarTitle: bar.title,
                currentHand: filled
                    .filter((s) => s.bar)
                    .map((s) => ({
                        slotIndex: s.slotIndex,
                        barId: s.bar!.id,
                        title: s.bar!.title,
                        type: s.bar!.type,
                    })),
            },
        }
    }

    await dbBase.handSlot.upsert({
        where: { playerId_slotIndex: { playerId, slotIndex: emptyIndex } },
        create: { playerId, slotIndex: emptyIndex, barId: bar.id },
        update: { barId: bar.id, isCarrying: false },
    })

    return { success: true, hand: await readHandDb(playerId) }
}

'use server'

/**
 * Bounded in-world inventory — the "hand".
 *
 * The hand is a bounded set of 6 ordered slots (slot 0 = active/carrying).
 * It is what the player carries into the spatial rooms. The vault is every
 * active BAR the player owns that is NOT bound to a hand slot (unbounded
 * storage, reached by leaving the play space).
 *
 * Membership is explicit: a BAR is in the hand iff a HandSlot row binds it.
 * This replaces the old derived heuristic in player-hand.ts.
 *
 * See .specify/specs/hand-vault-bounded-inventory/spec.md
 */

import { dbBase } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'

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

type ErrorResult = { error: string }

/** A BAR is eligible for the hand if the caller owns it and it is active. */
function ownedActiveBarWhere(playerId: string, barId: string) {
    return { id: barId, creatorId: playerId, status: 'active', archivedAt: null }
}

async function readHand(playerId: string): Promise<HandContents> {
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

/** Get the player's current hand (6 slots, filled count, carrying state). */
export async function getPlayerHand(): Promise<HandContents | ErrorResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }
    return readHand(player.id)
}

/**
 * Add a BAR to the hand. Auto-fills the lowest empty slot.
 * Returns an OverflowContext when the hand is full (caller shows the modal).
 */
export async function addBarToHand(input: {
    barId: string
}): Promise<
    | { success: true; hand: HandContents }
    | { success: false; overflow: OverflowContext }
    | ErrorResult
> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const bar = await dbBase.customBar.findFirst({
        where: ownedActiveBarWhere(player.id, input.barId),
        select: { id: true, title: true, type: true },
    })
    if (!bar) return { error: 'BAR not found or not yours' }

    const slots = await dbBase.handSlot.findMany({ where: { playerId: player.id } })

    // Idempotent: already in hand.
    if (slots.some((s) => s.barId === input.barId)) {
        return { success: true, hand: await readHand(player.id) }
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
        // Hand full → overflow.
        const filled = await dbBase.handSlot.findMany({
            where: { playerId: player.id, barId: { not: null } },
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
        where: { playerId_slotIndex: { playerId: player.id, slotIndex: emptyIndex } },
        create: { playerId: player.id, slotIndex: emptyIndex, barId: bar.id },
        update: { barId: bar.id, isCarrying: false },
    })

    return { success: true, hand: await readHand(player.id) }
}

/**
 * Resolve an overflow: the player chose which BAR goes to the vault.
 * `depositBarId` may be the incoming BAR (declined to swap → it goes to vault)
 * or one of the current 6 (freed, then the new BAR takes its slot).
 */
export async function resolveOverflow(input: {
    newBarId: string
    depositBarId: string
}): Promise<{ success: true; hand: HandContents } | ErrorResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    // Declined to swap → new BAR stays in the vault, hand unchanged.
    if (input.depositBarId === input.newBarId) {
        return { success: true, hand: await readHand(player.id) }
    }

    const bar = await dbBase.customBar.findFirst({
        where: ownedActiveBarWhere(player.id, input.newBarId),
        select: { id: true },
    })
    if (!bar) return { error: 'BAR not found or not yours' }

    const deposit = await dbBase.handSlot.findFirst({
        where: { playerId: player.id, barId: input.depositBarId },
    })
    if (!deposit) return { error: 'Deposited BAR is not in your hand' }

    // Free the deposited slot and place the new BAR there (preserves ordering).
    await dbBase.handSlot.update({
        where: { id: deposit.id },
        data: { barId: input.newBarId, isCarrying: false },
    })

    return { success: true, hand: await readHand(player.id) }
}

/** Move a hand BAR to the vault (free action). Frees its slot. */
export async function depositHandBarToVault(input: {
    barId: string
}): Promise<{ success: true; hand: HandContents } | ErrorResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const slot = await dbBase.handSlot.findFirst({
        where: { playerId: player.id, barId: input.barId },
    })
    if (!slot) return { error: 'BAR is not in your hand' }

    await dbBase.handSlot.update({
        where: { id: slot.id },
        data: { barId: null, isCarrying: false },
    })

    return { success: true, hand: await readHand(player.id) }
}

/** Promote a vault BAR into the hand. Only allowed when an empty slot exists. */
export async function promoteVaultBarToHand(input: {
    barId: string
    targetSlot?: number
}): Promise<
    | { success: true; hand: HandContents }
    | { success: false; reason: 'hand-full' }
    | ErrorResult
> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const bar = await dbBase.customBar.findFirst({
        where: ownedActiveBarWhere(player.id, input.barId),
        select: { id: true },
    })
    if (!bar) return { error: 'BAR not found or not yours' }

    const slots = await dbBase.handSlot.findMany({ where: { playerId: player.id } })
    if (slots.some((s) => s.barId === input.barId)) {
        return { success: true, hand: await readHand(player.id) }
    }

    const usedIndexes = new Set(slots.filter((s) => s.barId).map((s) => s.slotIndex))
    if (usedIndexes.size >= HAND_SIZE) return { success: false, reason: 'hand-full' }

    let target = input.targetSlot
    if (target === undefined || target < 0 || target >= HAND_SIZE || usedIndexes.has(target)) {
        target = -1
        for (let i = 0; i < HAND_SIZE; i++) {
            if (!usedIndexes.has(i)) {
                target = i
                break
            }
        }
    }
    if (target === -1) return { success: false, reason: 'hand-full' }

    await dbBase.handSlot.upsert({
        where: { playerId_slotIndex: { playerId: player.id, slotIndex: target } },
        create: { playerId: player.id, slotIndex: target, barId: bar.id },
        update: { barId: bar.id, isCarrying: false },
    })

    return { success: true, hand: await readHand(player.id) }
}

/**
 * Set the carrying BAR. Marks the slot holding `barId` as carrying and clears
 * the flag elsewhere. Pass null to stop carrying. The carrying indicator and
 * "plant on nursery" flow read this.
 */
export async function setCarryingFromHand(input: {
    barId: string | null
}): Promise<{ success: true; hand: HandContents } | ErrorResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    await dbBase.$transaction(async (tx) => {
        await tx.handSlot.updateMany({
            where: { playerId: player.id, isCarrying: true },
            data: { isCarrying: false },
        })
        if (input.barId) {
            await tx.handSlot.updateMany({
                where: { playerId: player.id, barId: input.barId },
                data: { isCarrying: true },
            })
        }
    })

    return { success: true, hand: await readHand(player.id) }
}

/** Reorder slots. Applies a new (slotIndex, barId) arrangement atomically. */
export async function reorderHandSlots(input: {
    newOrder: Array<{ slotIndex: number; barId: string | null }>
}): Promise<{ success: true; hand: HandContents } | ErrorResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const valid = input.newOrder.every(
        (o) => Number.isInteger(o.slotIndex) && o.slotIndex >= 0 && o.slotIndex < HAND_SIZE,
    )
    if (!valid) return { error: 'Invalid slot index' }

    const indexes = input.newOrder.map((o) => o.slotIndex)
    if (new Set(indexes).size !== indexes.length) return { error: 'Duplicate slot index' }

    await dbBase.$transaction(async (tx) => {
        // Park everything at temporary negative indexes to dodge the unique
        // (playerId, slotIndex) constraint during the shuffle.
        const existing = await tx.handSlot.findMany({ where: { playerId: player.id } })
        for (const row of existing) {
            await tx.handSlot.update({
                where: { id: row.id },
                data: { slotIndex: -1 - row.slotIndex },
            })
        }
        for (const o of input.newOrder) {
            await tx.handSlot.upsert({
                where: { playerId_slotIndex: { playerId: player.id, slotIndex: o.slotIndex } },
                create: { playerId: player.id, slotIndex: o.slotIndex, barId: o.barId },
                update: { barId: o.barId },
            })
        }
        // Drop any leftover parked rows not covered by newOrder.
        await tx.handSlot.deleteMany({ where: { playerId: player.id, slotIndex: { lt: 0 } } })
    })

    return { success: true, hand: await readHand(player.id) }
}

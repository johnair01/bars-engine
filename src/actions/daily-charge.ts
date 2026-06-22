'use server'

/**
 * Daily charge — the guaranteed ≥1-BAR-per-day engine for the "Now" home.
 *
 * One charge per day. The player can spend it two ways:
 *   - **mint**:    capture a fresh charge BAR (the classic daily ritual).
 *   - **advance**: push a BAR *already in the hand* one maturity phase forward.
 *                  To elaborate a Vault BAR, the player must promote it into
 *                  the hand first (promoteVaultBarToHand).
 *
 * "Done today" is the existing charge_capture-created-today signal (reused via
 * getTodayCharge), so both modes leave a single daily marker and the ritual
 * reads as spent. Advancing writes a lightweight charge marker so the day is
 * logged consistently.
 *
 * See .specify/specs/home-vault-ia-redesign/spec.md (daily charge on the Hand)
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { getTodayCharge } from '@/actions/charge-capture'
import { addBarToHandForPlayer } from '@/lib/hand-service'
import type { CaptureDestination } from '@/actions/capture-bar'
import {
    mergeSeedMetabolization,
    parseSeedMetabolization,
    effectiveMaturity,
} from '@/lib/bar-seed-metabolization/parse'
import { MATURITY_PHASES, type MaturityPhase } from '@/lib/bar-seed-metabolization/types'

const BSM_TYPES = new Set<string>(['bar', 'charge_capture'])

/** Maturity stamp for a fresh charge mint. */
const CHARGE_SEED_METABOLIZATION = mergeSeedMetabolization(null, {
    maturity: 'captured',
    soilKind: 'holding_pen',
})

/** The phase after `current`, capped at the final phase. */
function nextMaturity(current: MaturityPhase): MaturityPhase {
    const i = MATURITY_PHASES.indexOf(current)
    if (i < 0) return MATURITY_PHASES[0]
    return MATURITY_PHASES[Math.min(i + 1, MATURITY_PHASES.length - 1)]
}

async function isDoneToday(): Promise<boolean> {
    const today = await getTodayCharge()
    return 'success' in today && today.success && today.bar != null
}

export type DailyChargeTargets =
    | {
          alreadyDoneToday: boolean
          handBars: Array<{ barId: string; title: string; maturity: MaturityPhase }>
      }
    | { error: string }

/** What today's charge can act on: whether it's spent + advanceable hand BARs. */
export async function getTodayChargeTargets(): Promise<DailyChargeTargets> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const slots = await dbHandBars(player.id)

    const handBars = slots
        .map((s) => {
            const maturity = effectiveMaturity(parseSeedMetabolization(s.bar!.seedMetabolization))
            return { barId: s.bar!.id, title: s.bar!.title, type: s.bar!.type, maturity }
        })
        // Advanceable = supports BSM and not yet at the final phase.
        .filter((b) => BSM_TYPES.has(b.type) && b.maturity !== 'integrated')
        .map(({ barId, title, maturity }) => ({ barId, title, maturity }))

    return { alreadyDoneToday: await isDoneToday(), handBars }
}

async function dbHandBars(playerId: string) {
    return db.handSlot.findMany({
        where: { playerId, barId: { not: null } },
        orderBy: { slotIndex: 'asc' },
        include: { bar: { select: { id: true, title: true, type: true, seedMetabolization: true } } },
    })
}

export type ApplyDailyChargeResult =
    | { success: true; barId: string; maturity: MaturityPhase }
    | { success: false; reason: 'already-done-today' | 'bar-not-in-hand' }
    | { error: string }

/** Spend today's charge — mint a new BAR or advance a Hand BAR's maturity. */
export async function applyDailyCharge(
    input:
        | { mode: 'mint'; content: string; destination?: CaptureDestination }
        | { mode: 'advance'; barId: string },
): Promise<ApplyDailyChargeResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    if (await isDoneToday()) return { success: false, reason: 'already-done-today' }

    if (input.mode === 'mint') {
        const content = (input.content || '').trim()
        if (content.length < 1) return { error: 'Add a line to capture' }
        const title = content.split(/\r?\n/)[0].slice(0, 80) || 'Daily charge'

        let barId: string
        try {
            const bar = await db.customBar.create({
                data: {
                    creatorId: player.id,
                    title,
                    description: content,
                    type: 'charge_capture',
                    reward: 0,
                    visibility: 'private',
                    status: 'active',
                    inputs: '[]',
                    rootId: 'temp',
                    seedMetabolization: CHARGE_SEED_METABOLIZATION,
                },
                select: { id: true },
            })
            barId = bar.id
            await db.customBar.update({ where: { id: barId }, data: { rootId: barId } })
        } catch (e: unknown) {
            console.error('[applyDailyCharge:mint]', e)
            return { error: 'Failed to capture charge' }
        }

        if (input.destination === 'hand') {
            // Best-effort placement; if the hand is full the BAR stays in the vault.
            await addBarToHandForPlayer(player.id, barId)
        }

        revalidatePath('/')
        revalidatePath('/vault')
        return { success: true, barId, maturity: 'captured' }
    }

    // mode === 'advance' — the BAR must be in the player's hand.
    const slot = await db.handSlot.findFirst({
        where: { playerId: player.id, barId: input.barId },
        include: { bar: { select: { id: true, type: true, seedMetabolization: true } } },
    })
    if (!slot || !slot.bar) return { success: false, reason: 'bar-not-in-hand' }
    if (!BSM_TYPES.has(slot.bar.type)) return { error: 'This BAR type does not support maturity' }

    const current = effectiveMaturity(parseSeedMetabolization(slot.bar.seedMetabolization))
    const next = nextMaturity(current)

    try {
        await db.customBar.update({
            where: { id: slot.bar.id },
            data: {
                seedMetabolization: mergeSeedMetabolization(slot.bar.seedMetabolization, {
                    maturity: next,
                }),
            },
        })
        // Log the daily charge as spent (keeps getTodayCharge the single source).
        await db.customBar.create({
            data: {
                creatorId: player.id,
                title: 'Daily charge — advanced a BAR',
                description: `Advanced "${input.barId}" to ${next}.`,
                type: 'charge_capture',
                reward: 0,
                visibility: 'private',
                status: 'active',
                inputs: JSON.stringify({ dailyChargeMode: 'advance', advancedBarId: input.barId, to: next }),
                rootId: input.barId,
                seedMetabolization: CHARGE_SEED_METABOLIZATION,
            },
        })
    } catch (e: unknown) {
        console.error('[applyDailyCharge:advance]', e)
        return { error: 'Failed to advance BAR' }
    }

    revalidatePath('/')
    revalidatePath('/vault')
    revalidatePath('/bars/garden')
    return { success: true, barId: slot.bar.id, maturity: next }
}

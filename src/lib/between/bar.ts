/**
 * Writing a BAR at the hearth (spec .specify/specs/ember-to-vibeulon, FR-004 to FR-006, API Phase 3). A kept ember in the
 * player's private pouch becomes a private BAR and mints its vibeulon with the coin's face; the ember is marked written.
 * No ember text, feel or glow reaches a shared row (cc-pouch-private): the BAR holds only what the player wrote.
 */
import type { Prisma } from '@prisma/client'
import type { CoinFace } from '@/lib/economy/coin-face'
import { mintBarVibulon, stakeBarVibulon, type Tx } from '@/lib/economy/bar-mint'
import { readCoinStyle } from '@/lib/between/coin'
import { MOVES } from '@/lib/between/rules'

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

export type BarInput = { gardenId: string; playerId: string; emberAt?: unknown; mark?: unknown; barId?: unknown; offer?: unknown }
export type BarResult =
    | { ok: true; barId: string; vibulonId: string | null; ink: string; staked: boolean; face: CoinFace | null; choose: boolean }
    | { ok: false; status: 400 | 403 | 404 | 409; code: 'invalid_argument' | 'permission_denied' | 'not_found' | 'not_yet'; error: string }

const fail = (status: 400 | 403 | 404 | 409, code: 'invalid_argument' | 'permission_denied' | 'not_found' | 'not_yet', error: string): BarResult => ({ ok: false, status, code, error })

/** The ink is the colour of the ember's move: the element it starts from. */
export const inkOf = (move: string): string => MOVES[move]?.from ?? 'earth'

const kept = (e: unknown): e is Record<string, unknown> => {
    const o = asObj(e)
    return typeof o.move === 'string' && (o.state === 'held' || o.state === 'lit')
}

export async function writeBar(tx: Tx, input: BarInput): Promise<BarResult> {
    const where = { gardenId_playerId_key: { gardenId: input.gardenId, playerId: input.playerId, key: 'pouch' } }
    const row = await tx.betweenPrivate.findUnique({ where })
    const pouch = asObj(row?.data)
    const embers = asObj(pouch.embers)

    // Offer a BAR already written: publish it and stake its vibeulon (FR-006).
    if (input.offer === true && typeof input.barId === 'string') {
        const bar = await tx.customBar.findUnique({ where: { id: input.barId }, select: { id: true, creatorId: true } })
        if (!bar) return fail(404, 'not_found', 'There is no such BAR.')
        if (bar.creatorId !== input.playerId) return fail(403, 'permission_denied', 'Only its maker offers a BAR.')
        const ember = Object.values(embers).find((e) => asObj(e).bar === bar.id)
        if (!ember) return fail(409, 'not_yet', 'This BAR was not written at the hearth.')
        await tx.customBar.update({ where: { id: bar.id }, data: { visibility: 'public' } })
        const coin = await stakeBarVibulon(tx, { barId: bar.id, playerId: input.playerId })
        return { ok: true, barId: bar.id, vibulonId: coin, ink: inkOf(String(asObj(ember).move)), staked: !!coin, face: null, choose: false }
    }

    const mark = typeof input.mark === 'string' ? input.mark.trim() : ''
    if (!mark || mark.length > 2000) return fail(400, 'invalid_argument', 'Write a few words on the BAR (up to 2000 characters).')
    const keptIds = Object.keys(embers).filter((id) => kept(embers[id]))
    if (keptIds.length === 0) return fail(409, 'not_yet', 'Keep an ember at the hearth first.')
    const emberAt = typeof input.emberAt === 'string' ? input.emberAt : keptIds[0]
    if (!kept(embers[emberAt])) return fail(409, 'not_yet', 'That ember is not one you hold.')
    const ember = asObj(embers[emberAt])
    const move = String(ember.move)

    const title = mark.split('\n')[0].slice(0, 80)
    const bar = await tx.customBar.create({
        data: { creatorId: input.playerId, title, description: mark, visibility: 'private', type: 'vibe', storyPath: 'collective' },
        select: { id: true },
    })
    await tx.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
    const style = await readCoinStyle(tx, input.gardenId, input.playerId)
    const vibulonId = await mintBarVibulon(tx, { barId: bar.id, playerId: input.playerId, title, ember: { move }, seal: null, style })
    const data = { ...pouch, embers: { ...embers, [emberAt]: { ...ember, state: 'written', bar: bar.id } } } as Prisma.InputJsonValue
    await tx.betweenPrivate.update({ where, data: { data } })
    const minted = await tx.vibulon.findUnique({ where: { id: vibulonId }, select: { face: true } })
    return { ok: true, barId: bar.id, vibulonId, ink: inkOf(move), staked: false, face: (minted?.face as CoinFace | null) ?? null, choose: style === null }
}

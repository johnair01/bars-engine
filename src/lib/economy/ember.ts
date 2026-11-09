/**
 * Embers, lit by a place and caught by a BAR (spec .specify/specs/friendcraft-deck-3, FR-002, FR-017).
 *
 * A place lights an ember in a player's own pouch (the `pouch` private doc of their homeroom). The player works it at
 * their hearth, choosing its move. A worked ember can be set into a BAR they share: the BAR catches it, and one vibeulon
 * is minted from it, carrying the ember's energy and resting on the BAR (`fo3-ad-look-3` A).
 *
 * Calrunia's, not any place's: `place` is a string the caller passes. An ember holds ids, never words.
 */
import type { Prisma } from '@prisma/client'
import { EMBER_CATCH_SOURCE, mintBarVibulon, type Tx } from './bar-mint'
import { COIN_ON_PAGE, NOT_SHARED, readerOf, restCoin, type Refusal } from './coin-marks'

type Doc = Record<string, unknown>
const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)

/** What the BAR's coin is called in its own origin: a plain name of the place, never the card's words (FR-018). */
export const CAUGHT_TITLE = 'A BAR kept at the table'
export const NOT_WORKED = 'That ember is not worked yet.'
export const ALREADY_CAUGHT = 'That ember is already in a BAR.'

/** The garden whose `kind` is `home` for this player, or null (they have not arrived in Calrunia yet). */
async function homeGardenId(tx: Tx, playerId: string): Promise<string | null> {
    const rows = await tx.betweenMember.findMany({ where: { playerId }, include: { garden: true } })
    const home = rows.find((r) => isObj(r.garden.data) && (r.garden.data as Doc).kind === 'home')
    return home ? home.gardenId : null
}

async function readPouch(tx: Tx, gardenId: string, playerId: string): Promise<Doc> {
    const row = await tx.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId, playerId, key: 'pouch' } } })
    return row && isObj(row.data) ? (row.data as Doc) : {}
}

async function writePouch(tx: Tx, gardenId: string, playerId: string, data: Doc): Promise<void> {
    const json = data as Prisma.InputJsonValue
    await tx.betweenPrivate.upsert({
        where: { gardenId_playerId_key: { gardenId, playerId, key: 'pouch' } },
        create: { gardenId, playerId, key: 'pouch', data: json },
        update: { data: json },
    })
}

export type EmberFrom = { id: string; with?: string }

/**
 * Light one ember in the player's own pouch, keyed `e-<place>-<id>-<playerId>` so a second call for the same source
 * changes nothing. Returns the key, or null when the player has no homeroom.
 */
export async function lightEmber(tx: Tx, input: { playerId: string; place: string; from: EmberFrom }): Promise<string | null> {
    const gardenId = await homeGardenId(tx, input.playerId)
    if (!gardenId) return null
    const key = `e-${input.place}-${input.from.id}-${input.playerId}`
    const pouch = await readPouch(tx, gardenId, input.playerId)
    const embers = isObj(pouch.embers) ? { ...(pouch.embers as Doc) } : {}
    if (embers[key]) return key
    embers[key] = {
        move: null,
        feel: null,
        glow: null,
        state: 'lit',
        at: Date.now(),
        lantern: null,
        from: { place: input.place, id: input.from.id, ...(input.from.with ? { with: input.from.with } : {}) },
    }
    await writePouch(tx, gardenId, input.playerId, { ...pouch, embers })
    return key
}

/**
 * Set a worked ember into a BAR the player may read, and mint one vibeulon from it in the same transaction. The coin
 * carries the ember's `{ move, feel }`, rests on the BAR (`stakedOnBarId`), and is marked `minted` then `set`.
 * 403 when the player may not read the BAR; 409 when the ember is not theirs, not worked, already caught, or the
 * player already has a coin on that BAR.
 */
export async function catchEmber(
    tx: Tx,
    input: { playerId: string; barId: string; emberKey: string; place: string },
): Promise<{ coinId: string } | Refusal> {
    const reader = await readerOf(tx, input.barId, input.playerId)
    if (!reader.may) return { status: 403, error: NOT_SHARED }
    const gardenId = await homeGardenId(tx, input.playerId)
    if (!gardenId) return { status: 409, error: NOT_WORKED }
    const pouch = await readPouch(tx, gardenId, input.playerId)
    const embers = isObj(pouch.embers) ? (pouch.embers as Doc) : {}
    const ember = embers[input.emberKey]
    if (!isObj(ember)) return { status: 409, error: NOT_WORKED }
    if (ember.state === 'caught') return { status: 409, error: ALREADY_CAUGHT }
    if (ember.state !== 'held' || typeof ember.move !== 'string' || typeof ember.feel !== 'string') return { status: 409, error: NOT_WORKED }
    const onPage = await tx.vibulon.findFirst({ where: { ownerId: input.playerId, stakedOnBarId: input.barId }, select: { id: true } })
    if (onPage) return { status: 409, error: COIN_ON_PAGE }
    // Caught first, so a second tap in the same moment finds it caught and changes nothing.
    await writePouch(tx, gardenId, input.playerId, {
        ...pouch,
        embers: { ...embers, [input.emberKey]: { ...ember, state: 'caught', in: input.barId } },
    })
    const coinId = await mintBarVibulon(tx, {
        barId: input.barId,
        playerId: input.playerId,
        title: CAUGHT_TITLE,
        source: EMBER_CATCH_SOURCE,
        energy: { move: ember.move, feel: ember.feel },
        place: input.place,
    })
    await restCoin(tx, coinId, { playerId: input.playerId, barId: input.barId, place: input.place, toId: reader.other })
    return { coinId }
}

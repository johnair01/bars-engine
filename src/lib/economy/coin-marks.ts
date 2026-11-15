/**
 * Coin marks: what a vibeulon remembers (spec .specify/specs/deck-3, FR-007 to FR-011).
 *
 * Wendell's note on fo3-coin-on-page: "Vibeulons carry energy and provenance of what minted them and how they've been
 * spent". A coin keeps `energy` ({ move, feel } of what made it) and one `VibulonMark` for each act done to it. A mark
 * copies the coin's origin and energy and has no foreign key, so it still reads after the coin row is burned.
 *
 * This is Calrunia's module, not any one place's: every function takes the `place` that calls it as a short string
 * (`table-turn`, `nook-hearth`, `quest`). Nothing here is named for any one game.
 */
import { randomUUID } from 'node:crypto'
import { MOVES } from '@/lib/between/rules'
import { releaseStaleStakes, spendableWhere, type Tx } from './bar-mint'

export type CoinAct = 'minted' | 'staked' | 'released' | 'set' | 'finished' | 'takenBack' | 'given' | 'spent' | 'burned'

export type CoinEnergy = { move?: string | null; feel?: string | null } | null

export type MarkContext = { playerId: string; place: string; barId?: string | null; toId?: string | null; note?: string | null }

/** A coin row, as much of it as a mark copies. */
export type CoinRow = { id: string; originSource: string; originId: string; originTitle: string; energy?: unknown }

/** An id for a coin made by `createMany`, which returns no ids: a mark needs one. */
export const newCoinId = (): string => `v_${randomUUID()}`

/** Give each `createMany` row an id so its `minted` mark can name it. */
export const withCoinIds = <T extends object>(rows: T[]): Array<T & { id: string }> => rows.map((r) => ({ ...r, id: newCoinId() }))

/**
 * Write one mark for each coin, in the caller's transaction. Pass coin rows already read (`wallet`) or ids to read.
 * Call it BEFORE a delete (the mark copies the row) and AFTER a create. Returns how many marks were written.
 */
export async function markCoins(tx: Tx, coins: Array<string | CoinRow>, act: CoinAct, ctx: MarkContext): Promise<number> {
    if (coins.length === 0) return 0
    const ids = coins.filter((c): c is string => typeof c === 'string')
    const read = ids.length
        ? await tx.vibulon.findMany({ where: { id: { in: ids } }, select: { id: true, originSource: true, originId: true, originTitle: true, energy: true } })
        : []
    const rows: CoinRow[] = [...coins.filter((c): c is CoinRow => typeof c !== 'string'), ...read]
    if (rows.length === 0) return 0
    await tx.vibulonMark.createMany({
        data: rows.map((c) => ({
            vibulonId: c.id,
            act,
            playerId: ctx.playerId,
            place: ctx.place,
            barId: ctx.barId ?? null,
            toId: ctx.toId ?? null,
            note: ctx.note ? ctx.note.slice(0, 200) : null,
            originSource: c.originSource,
            originId: c.originId,
            originTitle: c.originTitle,
            energy: (c.energy ?? undefined) as never,
        })),
    })
    return rows.length
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** "Declare Intention, wood to fire", or null when the energy names no known move. */
export function energyPhrase(energy: unknown): string | null {
    if (!isObj(energy) || typeof energy.move !== 'string') return null
    const m = MOVES[energy.move]
    return m ? `${m.name}, ${m.from} to ${m.to}` : null
}

/** The element a coin glows: its energy's feel, or null (plain amber). */
export function energyFeel(energy: unknown): string | null {
    return isObj(energy) && typeof energy.feel === 'string' ? energy.feel : null
}

/**
 * A coin's story, oldest first, in plain lines. It names people, places and moves, never the words of a card
 * (fb-depth-consent). It says only what its marks know.
 */
export async function coinStory(tx: Tx, vibulonId: string, viewerId?: string): Promise<string[]> {
    const marks = await tx.vibulonMark.findMany({ where: { vibulonId }, orderBy: { createdAt: 'asc' } })
    const ids = [...new Set(marks.flatMap((m) => [m.playerId, m.toId].filter((x): x is string => !!x)))]
    const people = ids.length ? await tx.player.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : []
    const name = (id?: string | null) => people.find((p) => p.id === id)?.name ?? 'a friend'
    const lines: string[] = []
    for (const m of marks) {
        const phrase = energyPhrase(m.energy)
        switch (m.act) {
            case 'minted':
                if (m.originSource === 'ember_catch') lines.push(phrase ? `Minted when this BAR caught ${name(m.playerId)}'s ember of ${phrase}.` : `Minted when this BAR caught ${name(m.playerId)}'s ember.`)
                else if (m.originSource === 'bar_mint' && phrase) lines.push(`Minted when ${name(m.playerId)} wrote a BAR with an ember of ${phrase}.`)
                else if (m.originSource === 'bar_mint') lines.push(`Minted when ${name(m.playerId)} made a BAR: ${m.originTitle}.`)
                else lines.push(`Minted from ${m.originTitle}.`)
                break
            case 'set': {
                const other = viewerId && m.playerId === viewerId ? m.toId : m.playerId
                if (m.place === 'table-turn' && other) lines.push(`Set here at your table with ${name(other)}.`)
                else lines.push(`Set on this page by ${name(m.playerId)}.`)
                break
            }
            case 'finished': lines.push(`Finished by ${name(m.playerId)}.`); break
            case 'staked': lines.push('Rested on a BAR.'); break
            case 'released': lines.push('Rested on a BAR for a while.'); break
            case 'takenBack': lines.push(`Taken back by ${name(m.playerId)}.`); break
            case 'given': lines.push(`Given to ${name(m.toId)}.`); break
            case 'spent':
            case 'burned': lines.push(m.note ? `Spent on ${m.note}.` : 'Spent.'); break
        }
    }
    return lines
}

export type Refusal = { status: 403 | 409; error: string }

/** May this player read the BAR: they made it, or a `BarShare` joins them to it? `other` is the page's other reader. */
export async function readerOf(tx: Tx, barId: string, playerId: string): Promise<{ may: boolean; other: string | null }> {
    const bar = await tx.customBar.findUnique({ where: { id: barId }, select: { creatorId: true } })
    if (!bar) return { may: false, other: null }
    const shares = await tx.barShare.findMany({ where: { barId }, select: { fromUserId: true, toUserId: true } })
    const people = new Set<string>([bar.creatorId, ...shares.flatMap((s) => [s.fromUserId, s.toUserId])])
    if (!people.has(playerId)) return { may: false, other: null }
    people.delete(playerId)
    return { may: true, other: [...people][0] ?? null }
}

export const NOT_SHARED = 'You can set a coin only on a page you share.'
export const COIN_ON_PAGE = 'You have a coin on this page already.'
export const NO_COIN = 'You have no coin to set just now.'

/** Stake one coin on a page and mark it `set`. Shared by `setCoinOnPage` and `catchEmber`. */
export async function restCoin(tx: Tx, coinId: string, input: { playerId: string; barId: string; place: string; toId?: string | null }): Promise<void> {
    await tx.vibulon.update({ where: { id: coinId }, data: { stakedOnBarId: input.barId } })
    await tx.vibulonEvent.create({
        data: { playerId: input.playerId, source: 'coin_set', amount: 0, notes: 'Set on a page you share', questId: input.barId },
    })
    await markCoins(tx, [coinId], 'set', { playerId: input.playerId, place: input.place, barId: input.barId, toId: input.toId })
}

/**
 * Stake one of the player's spendable coins on a BAR they may read (made it, or a `BarShare`). Their oldest coin with
 * energy, else their oldest coin. Refuses when they hold a coin on that page already, or hold none to spend.
 */
export async function setCoinOnPage(tx: Tx, input: { playerId: string; barId: string; place: string }): Promise<{ coinId: string } | Refusal> {
    const reader = await readerOf(tx, input.barId, input.playerId)
    if (!reader.may) return { status: 403, error: NOT_SHARED }
    await releaseStaleStakes(tx, input.playerId)
    const already = await tx.vibulon.findFirst({ where: { ownerId: input.playerId, stakedOnBarId: input.barId }, select: { id: true } })
    if (already) return { status: 409, error: COIN_ON_PAGE }
    const wallet = await tx.vibulon.findMany({ where: spendableWhere(input.playerId), orderBy: { createdAt: 'asc' }, select: { id: true, energy: true } })
    const coin = wallet.find((c) => c.energy != null) ?? wallet[0]
    if (!coin) return { status: 409, error: NO_COIN }
    await restCoin(tx, coin.id, { ...input, toId: reader.other })
    return { coinId: coin.id }
}

/** Return the caller's own coin on a page to their pouch, free. Marks `takenBack`. False when they have none there. */
export async function takeCoinBack(tx: Tx, input: { playerId: string; barId: string; place: string }): Promise<boolean> {
    const coin = await tx.vibulon.findFirst({ where: { ownerId: input.playerId, stakedOnBarId: input.barId }, select: { id: true } })
    if (!coin) return false
    await tx.vibulon.update({ where: { id: coin.id }, data: { stakedOnBarId: null } })
    await markCoins(tx, [coin.id], 'takenBack', { playerId: input.playerId, place: input.place, barId: input.barId })
    return true
}

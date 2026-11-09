/**
 * The BAR mint and the stake (spec .specify/specs/ember-to-vibeulon, FR-001 to FR-003).
 *
 * Wendell's ruling ee-bar-mint-stake (A, 2026-10-29): making a BAR mints one vibeulon to its maker, and when the BAR goes
 * public that vibeulon is staked on it (`Vibulon.stakedOnBarId`) instead of one being burned. A stake keeps the
 * anti-spam weight and destroys nothing: taking the BAR back, composting it or archiving it releases the stake.
 *
 * Every spend and every balance a player reads counts only spendable vibeulons: `stakedOnBarId` is null.
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import { coinFace, type CoinStyle } from './coin-face'

/** A Prisma client or an interactive transaction client. */
export type Tx = Prisma.TransactionClient | PrismaClient

export const BAR_MINT_SOURCE = 'bar_mint'
export const BAR_STAKE_SOURCE = 'bar_stake'
export const BAR_STAKE_RELEASE_SOURCE = 'bar_stake_release'

/** The `where` for a player's spendable vibeulons. Use it in place of `{ ownerId }` on every spend and balance read. */
export function spendableWhere(ownerId: string): Prisma.VibulonWhereInput {
    return { ownerId, stakedOnBarId: null }
}

/**
 * Mint the one vibeulon a new BAR gives its maker. Call inside the transaction that creates the BAR.
 * The coin carries a face (ember-to-vibeulon FR-009): `ember.move` sets its ring and texture, `seal` its bezel, and
 * `style` (the player's coin style, FR-011) its colour and material; no style leaves the coin bare for the coin turn.
 */
export async function mintBarVibulon(
    tx: Tx,
    input: {
        barId: string
        playerId: string
        title: string
        ember?: { move: string } | null
        seal?: string | null
        style?: CoinStyle | null
    },
): Promise<string> {
    const v = await tx.vibulon.create({
        data: {
            ownerId: input.playerId,
            creatorId: input.playerId,
            originSource: BAR_MINT_SOURCE,
            originId: input.barId,
            originTitle: input.title.slice(0, 200),
            face: coinFace(input.ember?.move, input.seal, input.style),
        },
        select: { id: true },
    })
    await tx.vibulonEvent.create({
        data: {
            playerId: input.playerId,
            source: BAR_MINT_SOURCE,
            amount: 1,
            notes: `Made a BAR: ${input.title.slice(0, 120)}`,
            questId: input.barId,
        },
    })
    return v.id
}

/**
 * Stake a public BAR on its maker. The vibeulon that BAR minted is staked when the maker still holds it unstaked;
 * otherwise (the BAR predates the mint, or that coin was given away) the maker's oldest spendable vibeulon is staked.
 * A maker with no spendable vibeulon publishes with no stake: the BAR never falls back to private (FR-002).
 * Returns the staked vibeulon's id, or null when nothing was staked.
 */
export async function stakeBarVibulon(
    tx: Tx,
    input: { barId: string; playerId: string },
): Promise<string | null> {
    const already = await tx.vibulon.findFirst({ where: { stakedOnBarId: input.barId }, select: { id: true } })
    if (already) return already.id
    const own = await tx.vibulon.findFirst({
        where: { ...spendableWhere(input.playerId), originSource: BAR_MINT_SOURCE, originId: input.barId },
        select: { id: true },
    })
    const coin =
        own ??
        (await tx.vibulon.findFirst({
            where: spendableWhere(input.playerId),
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        }))
    if (!coin) return null
    await tx.vibulon.update({ where: { id: coin.id }, data: { stakedOnBarId: input.barId } })
    await tx.vibulonEvent.create({
        data: {
            playerId: input.playerId,
            source: BAR_STAKE_SOURCE,
            amount: 0,
            notes: 'Staked on a BAR you shared',
            questId: input.barId,
        },
    })
    return coin.id
}

/** Release every stake on these BARs: the vibeulons turn spendable again and each owner gets a release event. */
export async function releaseBarStake(tx: Tx, input: { barId: string } | { barIds: string[] }): Promise<number> {
    const barIds = 'barId' in input ? [input.barId] : input.barIds
    if (barIds.length === 0) return 0
    const staked = await tx.vibulon.findMany({
        where: { stakedOnBarId: { in: barIds } },
        select: { id: true, ownerId: true, stakedOnBarId: true },
    })
    if (staked.length === 0) return 0
    await tx.vibulon.updateMany({ where: { id: { in: staked.map((v) => v.id) } }, data: { stakedOnBarId: null } })
    for (const v of staked) {
        if (!v.ownerId) continue
        await tx.vibulonEvent.create({
            data: {
                playerId: v.ownerId,
                source: BAR_STAKE_RELEASE_SOURCE,
                amount: 0,
                notes: 'A BAR you shared came back; its vibeulon is yours to spend',
                questId: v.stakedOnBarId,
            },
        })
    }
    return staked.length
}

/**
 * Release the player's stakes whose BAR is no longer public and live (taken back, archived, composted, merged or
 * deleted), whatever path changed it. Spend paths call this before they read the wallet, so no path that hides a BAR
 * can strand its stake.
 */
export async function releaseStaleStakes(tx: Tx, ownerId: string): Promise<number> {
    const staked = await tx.vibulon.findMany({
        where: { ownerId, stakedOnBarId: { not: null } },
        select: { stakedOnBarId: true },
    })
    const ids = [...new Set(staked.map((v) => v.stakedOnBarId as string))]
    if (ids.length === 0) return 0
    const live = await tx.customBar.findMany({
        where: { id: { in: ids }, visibility: 'public', archivedAt: null, mergedIntoId: null, status: { not: 'archived' } },
        select: { id: true },
    })
    const liveIds = new Set(live.map((b) => b.id))
    return releaseBarStake(tx, { barIds: ids.filter((id) => !liveIds.has(id)) })
}

/** The player's spendable vibeulons, oldest first, after stale stakes are released. */
export async function spendableVibulons(tx: Tx, ownerId: string, take?: number) {
    await releaseStaleStakes(tx, ownerId)
    return tx.vibulon.findMany({
        where: spendableWhere(ownerId),
        orderBy: { createdAt: 'asc' },
        ...(take === undefined ? {} : { take }),
    })
}

/** How many vibeulons the player can spend now (staked ones excluded). */
export async function spendableBalance(tx: Tx, ownerId: string): Promise<number> {
    await releaseStaleStakes(tx, ownerId)
    return tx.vibulon.count({ where: spendableWhere(ownerId) })
}

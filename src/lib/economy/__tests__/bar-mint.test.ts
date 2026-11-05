import { describe, expect, it } from 'vitest'
import {
    mintBarVibulon,
    releaseBarStake,
    releaseStaleStakes,
    spendableBalance,
    spendableVibulons,
    stakeBarVibulon,
    type Tx,
} from '../bar-mint'

type V = { id: string; ownerId: string | null; creatorId: string | null; originSource: string; originId: string; originTitle: string; stakedOnBarId: string | null; createdAt: Date }
type Bar = { id: string; visibility: string; archivedAt: Date | null; mergedIntoId: string | null; status: string }
type Ev = { playerId: string; source: string; amount: number; questId?: string | null }

/** An in-memory stand-in for the few Prisma calls bar-mint makes. */
function fakeDb(bars: Bar[] = []) {
    const vibulons: V[] = []
    const events: Ev[] = []
    let n = 0
    const match = (v: V, w: Record<string, unknown> = {}) =>
        Object.entries(w).every(([k, want]) => {
            const got = (v as unknown as Record<string, unknown>)[k]
            if (want && typeof want === 'object' && !(want instanceof Date)) {
                const o = want as { in?: unknown[]; not?: unknown }
                if (o.in) return o.in.includes(got)
                if ('not' in o) return got !== o.not
            }
            return got === want
        })
    const sorted = () => [...vibulons].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const db = {
        vibulon: {
            create: async ({ data }: { data: Partial<V> }) => {
                const v = { id: `v${++n}`, stakedOnBarId: null, createdAt: new Date(1000 + n), ...data } as V
                vibulons.push(v)
                return v
            },
            findFirst: async ({ where }: { where: Record<string, unknown> }) => sorted().find((v) => match(v, where)) ?? null,
            findMany: async ({ where, take }: { where: Record<string, unknown>; take?: number }) =>
                sorted().filter((v) => match(v, where)).slice(0, take ?? Infinity),
            count: async ({ where }: { where: Record<string, unknown> }) => vibulons.filter((v) => match(v, where)).length,
            update: async ({ where, data }: { where: { id: string }; data: Partial<V> }) => {
                const v = vibulons.find((x) => x.id === where.id)!
                Object.assign(v, data)
                return v
            },
            updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<V> }) => {
                const hit = vibulons.filter((v) => match(v, where))
                hit.forEach((v) => Object.assign(v, data))
                return { count: hit.length }
            },
        },
        vibulonEvent: { create: async ({ data }: { data: Ev }) => (events.push(data), data) },
        customBar: {
            findMany: async ({ where }: { where: { id: { in: string[] }; status: { not: string } } & Record<string, unknown> }) =>
                bars.filter(
                    (b) =>
                        where.id.in.includes(b.id) &&
                        b.visibility === where.visibility &&
                        b.archivedAt === null &&
                        b.mergedIntoId === null &&
                        b.status !== where.status.not,
                ),
        },
    }
    return { tx: db as unknown as Tx, vibulons, events, bars }
}

describe('bar mint and stake (ee-bar-mint-stake)', () => {
    it('making a BAR mints one vibeulon to its maker, named for that BAR', async () => {
        const { tx, vibulons, events } = fakeDb()
        await mintBarVibulon(tx, { barId: 'b1', playerId: 'p1', title: 'A kind word' })
        expect(vibulons).toHaveLength(1)
        expect(vibulons[0]).toMatchObject({ ownerId: 'p1', creatorId: 'p1', originSource: 'bar_mint', originId: 'b1' })
        expect(events[0]).toMatchObject({ source: 'bar_mint', amount: 1, questId: 'b1' })
    })

    it('publishing stakes the BAR\'s own vibeulon and burns nothing', async () => {
        const { tx, vibulons, events } = fakeDb([{ id: 'b1', visibility: 'public', archivedAt: null, mergedIntoId: null, status: 'active' }])
        await tx.vibulon.create({ data: { ownerId: 'p1', originSource: 'starter', originId: 'x', originTitle: 'old' } })
        await mintBarVibulon(tx, { barId: 'b1', playerId: 'p1', title: 'Shared' })
        const id = await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })
        expect(vibulons).toHaveLength(2)
        expect(vibulons.find((v) => v.id === id)).toMatchObject({ originId: 'b1', stakedOnBarId: 'b1' })
        expect(await spendableBalance(tx, 'p1')).toBe(1)
        expect(events.at(-1)).toMatchObject({ source: 'bar_stake', amount: 0 })
    })

    it('staking twice keeps one stake', async () => {
        const { tx, vibulons } = fakeDb()
        await mintBarVibulon(tx, { barId: 'b1', playerId: 'p1', title: 't' })
        await mintBarVibulon(tx, { barId: 'b2', playerId: 'p1', title: 't' })
        await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })
        await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })
        expect(vibulons.filter((v) => v.stakedOnBarId === 'b1')).toHaveLength(1)
    })

    it('an empty wallet publishes with no stake instead of falling back to private', async () => {
        const { tx } = fakeDb()
        expect(await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })).toBeNull()
    })

    it('releasing a stake makes the vibeulon spendable again with a release event', async () => {
        const { tx, events } = fakeDb()
        await mintBarVibulon(tx, { barId: 'b1', playerId: 'p1', title: 't' })
        await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })
        expect(await releaseBarStake(tx, { barId: 'b1' })).toBe(1)
        expect(events.at(-1)).toMatchObject({ source: 'bar_stake_release', amount: 0, playerId: 'p1' })
    })

    it('a stake on a BAR taken back, archived or composted is released before any spend', async () => {
        const bars: Bar[] = [
            { id: 'live', visibility: 'public', archivedAt: null, mergedIntoId: null, status: 'active' },
            { id: 'back', visibility: 'private', archivedAt: null, mergedIntoId: null, status: 'active' },
            { id: 'composted', visibility: 'public', archivedAt: new Date(), mergedIntoId: null, status: 'archived' },
        ]
        const { tx } = fakeDb(bars)
        for (const b of bars) {
            await mintBarVibulon(tx, { barId: b.id, playerId: 'p1', title: b.id })
            await stakeBarVibulon(tx, { barId: b.id, playerId: 'p1' })
        }
        expect(await tx.vibulon.count({ where: { ownerId: 'p1', stakedOnBarId: null } })).toBe(0)
        expect(await releaseStaleStakes(tx, 'p1')).toBe(2)
        const spend = await spendableVibulons(tx, 'p1')
        expect(spend.map((v) => v.originId).sort()).toEqual(['back', 'composted'])
    })
})

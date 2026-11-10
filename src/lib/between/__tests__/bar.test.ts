import { describe, expect, it } from 'vitest'
import type { Tx } from '@/lib/economy/bar-mint'
import { writeBar } from '../bar'

type Row = Record<string, any>

function fake(pouch: Record<string, unknown> | null) {
    const bars: Row[] = []
    const coins: Row[] = []
    let store = pouch
    const tx = {
        betweenPrivate: {
            findUnique: async () => (store ? { data: store } : null),
            update: async ({ data }: { data: { data: Record<string, unknown> } }) => { store = data.data },
        },
        customBar: {
            create: async ({ data }: { data: Row }) => { const b = { id: `b${bars.length + 1}`, ...data }; bars.push(b); return { id: b.id } },
            update: async ({ where, data }: { where: { id: string }; data: Row }) => { Object.assign(bars.find((b) => b.id === where.id)!, data) },
            findUnique: async ({ where }: { where: { id: string } }) => bars.find((b) => b.id === where.id) ?? null,
        },
        vibulon: {
            create: async ({ data }: { data: Row }) => { const c = { id: `v${coins.length + 1}`, ...data }; coins.push(c); return { id: c.id } },
            findUnique: async ({ where }: { where: { id: string } }) => coins.find((c) => c.id === where.id) ?? null,
            findMany: async ({ where }: { where: { id: { in: string[] } } }) => coins.filter((c) => where.id.in.includes(c.id)),
            findFirst: async ({ where }: { where: Row }) =>
                coins.find((c) => (where.stakedOnBarId ? c.stakedOnBarId === where.stakedOnBarId : c.originId === where.originId && !c.stakedOnBarId)) ?? null,
            update: async ({ where, data }: { where: { id: string }; data: Row }) => { Object.assign(coins.find((c) => c.id === where.id)!, data) },
        },
        vibulonEvent: { create: async () => ({}) },
        vibulonMark: { createMany: async () => ({ count: 1 }) },
    }
    return { tx: tx as unknown as Tx, bars, coins, pouch: () => store }
}

const held = { embers: { e1: { move: 'water_fire', feel: 'water', state: 'held', at: 1 } } }
const input = { gardenId: 'g', playerId: 'p1', emberAt: 'e1', mark: 'I said it kindly' }

describe('POST /bar: writing a BAR at the hearth (FR-004, FR-005)', () => {
    it('answers 409 not_yet with no kept ember, and writes nothing', async () => {
        for (const p of [null, { embers: {} }, { embers: { e1: { move: 'water_fire', state: 'written', bar: 'x' } } }]) {
            const f = fake(p)
            expect(await writeBar(f.tx, input)).toMatchObject({ ok: false, status: 409, code: 'not_yet' })
            expect(f.bars).toHaveLength(0)
            expect(f.coins).toHaveLength(0)
        }
    })

    it('makes a private BAR, mints a bare coin, inks it and marks the ember written', async () => {
        const f = fake(held)
        const res = await writeBar(f.tx, input)
        expect(res).toMatchObject({ ok: true, barId: 'b1', vibulonId: 'v1', ink: 'water', staked: false, choose: true })
        expect(f.bars[0]).toMatchObject({ visibility: 'private', creatorId: 'p1', description: 'I said it kindly', rootId: 'b1' })
        expect(f.coins[0].face).toMatchObject({ ring: 'water', tex: 'fire', color: null, mat: null })
        expect((f.pouch() as any).embers.e1).toMatchObject({ state: 'written', bar: 'b1', move: 'water_fire' })
    })

    it('copies the coin style and answers choose:false once the player has one', async () => {
        const f = fake({ ...held, coinStyle: { color: 'jade', mat: 'brass' } })
        const res = await writeBar(f.tx, input)
        expect(res).toMatchObject({ ok: true, choose: false })
        expect(f.coins[0].face).toMatchObject({ color: 'jade', mat: 'brass' })
    })

    it('refuses an empty mark, and an ember that is already written', async () => {
        const f = fake(held)
        expect(await writeBar(f.tx, { ...input, mark: '  ' })).toMatchObject({ ok: false, status: 400 })
        await writeBar(f.tx, input)
        expect(await writeBar(f.tx, input)).toMatchObject({ ok: false, status: 409, code: 'not_yet' })
        expect(f.bars).toHaveLength(1)
    })

    it('writes no ember text, feel or glow onto the BAR', async () => {
        const f = fake({ embers: { e1: { move: 'water_fire', feel: 'water', glow: 4, state: 'lit', at: 1 } } })
        await writeBar(f.tx, input)
        expect(JSON.stringify(f.bars[0])).not.toMatch(/glow|feel|water_fire/)
    })
})

describe('POST /bar: offering a written BAR (FR-006)', () => {
    it('publishes it and stakes its vibeulon; only its maker offers', async () => {
        const f = fake(held)
        await writeBar(f.tx, input)
        expect(await writeBar(f.tx, { gardenId: 'g', playerId: 'p2', barId: 'b1', offer: true })).toMatchObject({ ok: false, status: 403 })
        const res = await writeBar(f.tx, { gardenId: 'g', playerId: 'p1', barId: 'b1', offer: true })
        expect(res).toMatchObject({ ok: true, staked: true, ink: 'water' })
        expect(f.bars[0].visibility).toBe('public')
        expect(f.coins[0].stakedOnBarId).toBe('b1')
    })
})

import { describe, expect, it } from 'vitest'
import type { Tx } from '@/lib/economy/bar-mint'
import { coinFace } from '@/lib/economy/coin-face'
import { finishCoin, readCoinStyle } from '../coin'

type Coin = { id: string; ownerId: string; creatorId: string; face: unknown }

function fake(coins: Coin[] = []) {
    const pouches = new Map<string, Record<string, unknown>>()
    const k = (w: { gardenId: string; playerId: string; key: string }) => `${w.gardenId}|${w.playerId}|${w.key}`
    const tx = {
        vibulon: {
            findUnique: async ({ where }: { where: { id: string } }) => coins.find((c) => c.id === where.id) ?? null,
            update: async ({ where, data }: { where: { id: string }; data: { face: unknown } }) => {
                coins.find((c) => c.id === where.id)!.face = data.face
            },
        },
        betweenPrivate: {
            findUnique: async ({ where }: { where: { gardenId_playerId_key: { gardenId: string; playerId: string; key: string } } }) => {
                const d = pouches.get(k(where.gardenId_playerId_key))
                return d ? { data: d } : null
            },
            upsert: async ({ where, create, update }: { where: { gardenId_playerId_key: { gardenId: string; playerId: string; key: string } }; create: { data: Record<string, unknown> }; update: { data: Record<string, unknown> } }) => {
                const key = k(where.gardenId_playerId_key)
                pouches.set(key, pouches.has(key) ? update.data : create.data)
            },
        },
    }
    return { tx: tx as unknown as Tx, coins, pouches }
}

const bare = (id = 'v1', owner = 'p1'): Coin => ({ id, ownerId: owner, creatorId: owner, face: coinFace('wood_fire', null, null) })

describe('the coin turn (FR-010 to FR-013)', () => {
    it('finishes a bare coin once and keeps the style for the next coins', async () => {
        const { tx, coins } = fake([bare()])
        const res = await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'v1', color: 'jade', mat: 'brass' })
        expect(res.ok).toBe(true)
        expect(coins[0].face).toMatchObject({ ring: 'wood', tex: 'fire', color: 'jade', mat: 'brass' })
        expect(await readCoinStyle(tx, 'g', 'p1')).toEqual({ color: 'jade', mat: 'brass' })
    })

    it('refuses a coin whose colour is set', async () => {
        const { tx, coins } = fake([bare()])
        await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'v1', color: 'jade', mat: 'brass' })
        const again = await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'v1', color: 'rose', mat: 'silk' })
        expect(again).toMatchObject({ ok: false, status: 409, code: 'face_set' })
        expect(coins[0].face).toMatchObject({ color: 'jade' })
    })

    it('changes only the style, not any coin, when no coin is named', async () => {
        const { tx, coins } = fake([bare()])
        const res = await finishCoin(tx, { gardenId: 'g', playerId: 'p1', color: 'night', mat: 'porcelain' })
        expect(res).toMatchObject({ ok: true, style: { color: 'night', mat: 'porcelain' } })
        expect(coins[0].face).toMatchObject({ color: null, mat: null })
        expect(await readCoinStyle(tx, 'g', 'p1')).toEqual({ color: 'night', mat: 'porcelain' })
    })

    it('answers 400 for an unknown colour or material and writes nothing', async () => {
        const { tx, pouches } = fake([bare()])
        expect(await finishCoin(tx, { gardenId: 'g', playerId: 'p1', color: 'gold', mat: 'brass' })).toMatchObject({ ok: false, status: 400 })
        expect(await finishCoin(tx, { gardenId: 'g', playerId: 'p1', color: 'jade', mat: 'steel' })).toMatchObject({ ok: false, status: 400 })
        expect(pouches.size).toBe(0)
    })

    it('lets only the maker finish a coin, and 404s a missing one', async () => {
        const { tx } = fake([bare('v1', 'p2')])
        expect(await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'v1', color: 'jade', mat: 'brass' })).toMatchObject({ ok: false, status: 403 })
        expect(await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'nope', color: 'jade', mat: 'brass' })).toMatchObject({ ok: false, status: 404 })
    })

    it('finishes a coin minted before faces existed (null face) as a bare blank', async () => {
        const { tx, coins } = fake([{ id: 'v9', ownerId: 'p1', creatorId: 'p1', face: null }])
        await finishCoin(tx, { gardenId: 'g', playerId: 'p1', vibulonId: 'v9', color: 'pearl', mat: 'silk' })
        expect(coins[0].face).toMatchObject({ ring: null, tex: null, color: 'pearl', mat: 'silk' })
    })

    it('keeps the rest of the pouch when it keeps the style', async () => {
        const { tx, pouches } = fake([])
        pouches.set('g|p1|pouch', { embers: { a: { move: 'wood_fire' } } })
        await finishCoin(tx, { gardenId: 'g', playerId: 'p1', color: 'rose', mat: 'walnut' })
        expect(pouches.get('g|p1|pouch')).toMatchObject({ embers: { a: { move: 'wood_fire' } }, coinStyle: { color: 'rose', mat: 'walnut' } })
    })
})

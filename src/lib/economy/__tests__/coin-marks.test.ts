import { describe, expect, it } from 'vitest'
import { mintBarVibulon, releaseStaleStakes, spendableBalance, stakeBarVibulon } from '../bar-mint'
import { COIN_ON_PAGE, coinStory, markCoins, NO_COIN, NOT_SHARED, setCoinOnPage, takeCoinBack, withCoinIds } from '../coin-marks'
import { ALREADY_CAUGHT, catchEmber, lightEmber, NOT_WORKED } from '../ember'
import { fakeDb } from './fake-db'
import { pouchWrite } from '@/lib/between/rules'

const BAR = { id: 'b1', visibility: 'private', archivedAt: null, mergedIntoId: null, status: 'active', creatorId: 'p1' }
const SHARE = { barId: 'b1', fromUserId: 'p1', toUserId: 'p2' }
const world = () => fakeDb({ bars: [BAR], shares: [SHARE], names: { p1: 'Ana', p2: 'Bo' }, homes: { p1: 'g1', p2: 'g2' } })

describe('coin marks (fo3, FR-007 to FR-011)', () => {
    it('a mint, a stake and a release each leave a mark that outlives a burn', async () => {
        const { tx, vibulons, marks } = fakeDb({ bars: [{ ...BAR, visibility: 'public' }] })
        const id = await mintBarVibulon(tx, { barId: 'b1', playerId: 'p1', title: 'Hello' })
        await stakeBarVibulon(tx, { barId: 'b1', playerId: 'p1' })
        await markCoins(tx, [id], 'burned', { playerId: 'p1', place: 'test' })
        vibulons.length = 0
        expect(marks.map((m) => m.act)).toEqual(['minted', 'staked', 'burned'])
        expect(marks.every((m) => m.originId === 'b1')).toBe(true)
    })

    it('withCoinIds gives each createMany row an id its mark can name', async () => {
        const { tx, marks } = fakeDb()
        const rows = withCoinIds([{ originSource: 'q', originId: 'x', originTitle: 't' }, { originSource: 'q', originId: 'x', originTitle: 't' }])
        expect(new Set(rows.map((r) => r.id)).size).toBe(2)
        await markCoins(tx, rows, 'minted', { playerId: 'p1', place: 'quest' })
        expect(marks.map((m) => m.vibulonId)).toEqual(rows.map((r) => r.id))
    })

    it('a coin is set on a shared page, and spending the rest leaves the stake standing', async () => {
        const { tx, vibulons, marks } = world()
        await mintBarVibulon(tx, { barId: 'x', playerId: 'p1', title: 'one' })
        await mintBarVibulon(tx, { barId: 'y', playerId: 'p1', title: 'two' })
        const r = await setCoinOnPage(tx, { playerId: 'p1', barId: 'b1', place: 'nook-hearth' })
        expect('coinId' in r).toBe(true)
        expect(marks.at(-1)).toMatchObject({ act: 'set', barId: 'b1', toId: 'p2' })
        expect(await spendableBalance(tx, 'p1')).toBe(1)
        // the BAR is private but shared: the stake stands
        expect(await releaseStaleStakes(tx, 'p1')).toBe(0)
        expect(vibulons.filter((v) => v.stakedOnBarId === 'b1')).toHaveLength(1)
    })

    it('refuses with 403 off the page, and 409 with a coin there already or none to set', async () => {
        const { tx } = world()
        expect(await setCoinOnPage(tx, { playerId: 'p3', barId: 'b1', place: 'p' })).toEqual({ status: 403, error: NOT_SHARED })
        expect(await setCoinOnPage(tx, { playerId: 'p1', barId: 'b1', place: 'p' })).toEqual({ status: 409, error: NO_COIN })
        await mintBarVibulon(tx, { barId: 'x', playerId: 'p1', title: 'one' })
        await mintBarVibulon(tx, { barId: 'y', playerId: 'p1', title: 'two' })
        await setCoinOnPage(tx, { playerId: 'p1', barId: 'b1', place: 'p' })
        expect(await setCoinOnPage(tx, { playerId: 'p1', barId: 'b1', place: 'p' })).toEqual({ status: 409, error: COIN_ON_PAGE })
    })

    it('taking a coin back is free and marked', async () => {
        const { tx, marks } = world()
        await mintBarVibulon(tx, { barId: 'x', playerId: 'p1', title: 'one' })
        await setCoinOnPage(tx, { playerId: 'p1', barId: 'b1', place: 'p' })
        expect(await takeCoinBack(tx, { playerId: 'p1', barId: 'b1', place: 'p' })).toBe(true)
        expect(await takeCoinBack(tx, { playerId: 'p1', barId: 'b1', place: 'p' })).toBe(false)
        expect(marks.at(-1)?.act).toBe('takenBack')
        expect(await spendableBalance(tx, 'p1')).toBe(1)
    })
})

describe('embers (fo3 FR-002, FR-017)', () => {
    const worked = (tx: ReturnType<typeof world>, key: string) => {
        const pouch = tx.pouches.get('g1|p1') as { embers: Record<string, Record<string, unknown>> }
        pouch.embers[key] = { ...pouch.embers[key], state: 'held', move: 'fire_metal', feel: 'fire' }
    }

    it('lighting is idempotent for one source', async () => {
        const w = world()
        const a = await lightEmber(w.tx, { playerId: 'p1', place: 'table-turn', from: { id: 't1', with: 'p2' } })
        const b = await lightEmber(w.tx, { playerId: 'p1', place: 'table-turn', from: { id: 't1', with: 'p2' } })
        expect(a).toBe(b)
        expect(Object.keys((w.pouches.get('g1|p1') as { embers: object }).embers)).toHaveLength(1)
        expect(await lightEmber(w.tx, { playerId: 'p9', place: 'x', from: { id: 'y' } })).toBeNull()
    })

    it('catching mints one coin that carries the energy, once', async () => {
        const w = world()
        const key = (await lightEmber(w.tx, { playerId: 'p1', place: 'table-turn', from: { id: 't1' } }))!
        expect(await catchEmber(w.tx, { playerId: 'p1', barId: 'b1', emberKey: key, place: 'nook-hearth' })).toEqual({ status: 409, error: NOT_WORKED })
        worked(w, key)
        const r = await catchEmber(w.tx, { playerId: 'p1', barId: 'b1', emberKey: key, place: 'nook-hearth' })
        expect('coinId' in r).toBe(true)
        expect(w.vibulons).toHaveLength(1)
        expect(w.vibulons[0]).toMatchObject({ originSource: 'ember_catch', stakedOnBarId: 'b1', energy: { move: 'fire_metal', feel: 'fire' } })
        expect(w.marks.map((m) => m.act)).toEqual(['minted', 'set'])
        expect(await catchEmber(w.tx, { playerId: 'p1', barId: 'b1', emberKey: key, place: 'nook-hearth' })).toEqual({ status: 409, error: ALREADY_CAUGHT })
        expect(w.vibulons).toHaveLength(1)
    })

    it('refuses a catch on a page the player does not share', async () => {
        const w = world()
        const r = await catchEmber(w.tx, { playerId: 'p3', barId: 'b1', emberKey: 'k', place: 'p' })
        expect(r).toEqual({ status: 403, error: NOT_SHARED })
    })

    it('the story names people, places and moves, never the words of a card', async () => {
        const w = world()
        const key = (await lightEmber(w.tx, { playerId: 'p1', place: 'table-turn', from: { id: 't1' } }))!
        worked(w, key)
        const r = await catchEmber(w.tx, { playerId: 'p1', barId: 'b1', emberKey: key, place: 'table-turn' })
        const story = await coinStory(w.tx, (r as { coinId: string }).coinId, 'p2')
        expect(story[0]).toMatch(/Ana/)
        expect(story.join(' ')).toMatch(/Set here at your table with Ana/)
        expect(story.join(' ')).not.toMatch(/A BAR kept at the table/)
    })
})

describe('pouchWrite keeps the server\'s embers its own', () => {
    const lit = { move: null, feel: null, glow: null, state: 'lit', at: 1, lantern: null, from: { place: 'table-turn', id: 't1' } }
    const cur = { embers: { k: lit } }

    it('a lit ember with no move stands only while unchanged', () => {
        expect(pouchWrite(cur, cur).ok).toBe(true)
        expect(pouchWrite({ embers: { k: lit } }, null).ok).toBe(false)
        expect(pouchWrite({ embers: { k: { ...lit, state: 'held' } } }, cur).ok).toBe(false)
    })

    it('working it keeps its source; a hand cannot light, re-source or catch', () => {
        const worked = { ...lit, state: 'held', move: 'fire_metal', feel: 'fire' }
        expect(pouchWrite({ embers: { k: worked } }, cur).ok).toBe(true)
        expect(pouchWrite({ embers: { k: { ...worked, from: { place: 'x', id: 'y' } } } }, cur).ok).toBe(false)
        expect(pouchWrite({ embers: { k: { ...worked, from: undefined } } }, cur).ok).toBe(false)
        expect(pouchWrite({ embers: { n: { ...worked, from: { place: 'x', id: 'y' } } } }, cur).ok).toBe(false)
        expect(pouchWrite({ embers: { k: { ...worked, state: 'caught', in: 'b1' } } }, cur).ok).toBe(false)
        const caught = { ...worked, state: 'caught', in: 'b1' }
        expect(pouchWrite({ embers: { k: caught } }, { embers: { k: caught } }).ok).toBe(true)
    })
})

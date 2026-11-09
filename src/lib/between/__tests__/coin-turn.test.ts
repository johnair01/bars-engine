import { describe, expect, it } from 'vitest'
import { COIN_COLORS, COIN_MATS } from '@/lib/economy/coin-face'
import * as Raw from '../../../../public/between/coin-data.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const D: any = Raw

describe('coin turn data (FR-010 to FR-013)', () => {
    it('offers exactly the six colours and six materials the server accepts', () => {
        expect([...D.COLORS]).toEqual([...COIN_COLORS])
        expect([...D.MATS]).toEqual([...COIN_MATS])
        for (const c of D.COLORS) expect(D.FILAMENT[c]).toHaveLength(2)
        for (const m of D.MATS) expect(D.SURFACE[m]).toBeTruthy()
    })
    it('a touch changes one thing and can be undone by another', () => {
        let p = D.firstPick(null)
        p = D.touch(p, 'color', 'jade')
        p = D.touch(p, 'mat', 'brass')
        expect(p).toEqual({ color: 'jade', mat: 'brass' })
        expect(D.touch(p, 'color', 'rose')).toEqual({ color: 'rose', mat: 'brass' })
        expect(D.touch(p, 'color', 'nope')).toEqual(p)
    })
    it('the turn takes half a second and swaps the colour at the half turn', () => {
        expect(D.TURN).toBe(0.5)
        expect(D.turnAt(0.25)).toBe(0.5)
        expect(D.swapsAt(D.turnAt(0.24))).toBe(false)
        expect(D.swapsAt(D.turnAt(0.25))).toBe(true)
        expect(D.turnAt(9)).toBe(1)
    })
    it('keeps a stored style for the next coin and falls back to the printed blank', () => {
        expect(D.firstPick({ color: 'night', mat: 'walnut' })).toEqual({ color: 'night', mat: 'walnut' })
        expect(D.firstPick({ color: 'x', mat: 'walnut' })).toEqual({ color: 'violet', mat: 'silk' })
        expect(D.canSetDown({ color: 'rose', mat: 'resin' })).toBe(true)
        expect(D.canSetDown({ color: 'rose' })).toBe(false)
    })
})

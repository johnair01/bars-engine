import { describe, expect, it } from 'vitest'
import { ALL_CANONICAL_MOVES } from '@/lib/quest-grammar/move-engine'
import { COIN_COLORS, COIN_MATS, MOVE_ELEMENTS, asCoinStyle, coinFace, faceIsSet } from '../coin-face'

describe('coin face (ember-to-vibeulon FR-009)', () => {
    it('knows the same fifteen moves the move engine does', () => {
        expect(Object.keys(MOVE_ELEMENTS).sort()).toEqual(ALL_CANONICAL_MOVES.map((m) => m.id).sort())
    })

    it('reads ring from the starting element and texture from the arrival element, for all fifteen moves', () => {
        for (const id of Object.keys(MOVE_ELEMENTS)) {
            const [from, to] = id.split('_')
            const face = coinFace(id, null, null)
            expect(face.ring).toBe(from)
            expect(face.tex).toBe(to === 'transcend' ? from : to)
        }
    })

    it('shows a transcend move\'s one element twice', () => {
        expect(coinFace('fire_transcend', null, null)).toMatchObject({ ring: 'fire', tex: 'fire' })
    })

    it('gives the blank for no ember or an unknown move', () => {
        expect(coinFace(undefined, null, null)).toMatchObject({ ring: null, tex: null })
        expect(coinFace('nonsense', 'seal-1', null)).toMatchObject({ ring: null, tex: null, seal: 'seal-1' })
    })

    it('leaves the bezel empty without a seal, and the body bare without a style', () => {
        expect(coinFace('wood_fire', undefined, null)).toEqual({ v: 1, ring: 'wood', tex: 'fire', seal: null, color: null, mat: null })
    })

    it('copies the player\'s style onto the coin', () => {
        expect(coinFace('wood_fire', 's', { color: 'jade', mat: 'brass' })).toMatchObject({ color: 'jade', mat: 'brass' })
    })

    it('offers six colours and six materials, and reads a style only when both are valid', () => {
        expect(COIN_COLORS).toHaveLength(6)
        expect(COIN_MATS).toHaveLength(6)
        expect(asCoinStyle({ color: 'rose', mat: 'walnut' })).toEqual({ color: 'rose', mat: 'walnut' })
        expect(asCoinStyle({ color: 'rose', mat: 'gold' })).toBeNull()
        expect(asCoinStyle(null)).toBeNull()
    })

    it('treats a coin as finished once its colour is set', () => {
        expect(faceIsSet(null)).toBe(false)
        expect(faceIsSet(coinFace('wood_fire', null, null))).toBe(false)
        expect(faceIsSet(coinFace('wood_fire', null, { color: 'night', mat: 'silk' }))).toBe(true)
    })
})

/**
 * The Council Board card type agrees with its schema (fixtures/council-card/card.schema.json, an identical copy of
 * six-faces-council schema/card.schema.json).
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CARD_CHANNELS, CARD_FACES, CARD_MECHANICS, CARD_MOVES, MISSING_KINDS, OUTCOME_RESULTS, STALLS } from '@/lib/board/card'

const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../fixtures/council-card/card.schema.json'), 'utf8'))

describe('council card type', () => {
  it('names the schema enums', () => {
    expect([...CARD_FACES]).toEqual(schema.$defs.face.enum)
    expect([...CARD_MOVES]).toEqual(schema.$defs.move_name.enum)
    expect([...CARD_MECHANICS]).toEqual(schema.$defs.move.properties.mechanic.enum)
    expect([...CARD_CHANNELS]).toEqual(schema.$defs.channel.enum)
    expect([...MISSING_KINDS]).toEqual(schema.$defs.missing.properties.kind.enum)
    expect([...STALLS]).toEqual(schema.$defs.bar.properties.stall.enum)
    expect([...OUTCOME_RESULTS]).toEqual(schema.$defs.outcome.properties.result.enum)
  })
  it('fixes the three moves in order with one recommended', () => {
    const m = schema.$defs.moves
    expect(m.prefixItems.map((p: { allOf: { properties?: { move?: { const: string } } }[] }) => p.allOf[1].properties!.move!.const)).toEqual([...CARD_MOVES])
    expect([m.minContains, m.maxContains]).toEqual([1, 1])
  })
})

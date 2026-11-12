import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getHexagramStructure, verifyHexagramIntegrity } from '../iching-struct'

type Hex = { n: number; lower: string; upper: string }
const table = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/between/iching/hexagrams.json'), 'utf8'),
) as { hexagrams: Hex[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

describe('iching-struct King Wen table', () => {
  it('matches hexagrams.json for all 64', () => {
    expect(table.hexagrams).toHaveLength(64)
    for (const h of table.hexagrams) {
      expect(getHexagramStructure(h.n), `hexagram ${h.n}`).toEqual({ upper: cap(h.upper), lower: cap(h.lower) })
    }
  })

  it('gives 64 different trigram pairs', () => {
    const pairs = new Set(Array.from({ length: 64 }, (_, i) => {
      const s = getHexagramStructure(i + 1)
      return `${s.upper}/${s.lower}`
    }))
    expect(pairs.size).toBe(64)
  })

  it('wraps a number outside 1 to 64 onto a real hexagram', () => {
    expect(getHexagramStructure(65)).toEqual(getHexagramStructure(1))
    expect(getHexagramStructure(0)).toEqual(getHexagramStructure(64))
  })

  it('keeps the spot checks passing', () => {
    expect(verifyHexagramIntegrity(15).errors.filter((e) => e.includes('expected Earth'))).toEqual([])
    expect(verifyHexagramIntegrity(20).errors.filter((e) => e.includes('expected Wind'))).toEqual([])
  })
})

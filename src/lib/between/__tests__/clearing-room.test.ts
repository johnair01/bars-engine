import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HAND } from '../../../../public/between/encounter-lines.js'

const root = join(__dirname, '../../../..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('the moot (shared-pick-room-look-1)', () => {
  const js = read('public/between/clearing/clearing.js')
  it('is a page of its own, reached by a veil place only for a room of two', () => {
    expect(read('public/between/clearing.html')).toContain('/between/clearing/clearing.js')
    const g = read('public/between/garden.js')
    expect(g).toMatch(/r\.phase !== "spark"\) out\.push\(\{ key: "clearing:"/)
    expect(g).toContain('/between/clearing.html?g=')
  })
  it('draws both figures as the cultivation model and never the dusk model', () => {
    expect(js).toContain('cult/walker.js')
    expect(js).not.toMatch(/average-dusk|dusk\.glb/)
    expect((js.match(/addFigure\(/g) || []).length).toBeGreaterThanOrEqual(3)
  })
  it('sends the same sealed letter as the nook, never a card the rule would refuse', () => {
    expect(js).toContain('sent: { [me]: { card, at: Date.now() } }')
    expect(HAND).toHaveLength(7)
  })
})

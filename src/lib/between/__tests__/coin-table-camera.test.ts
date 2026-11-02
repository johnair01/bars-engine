import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../../..')

// His note on bi-door-look-3 (2026-11-02): "The camera needs to move so we can actually see the coins being flipped. The
// player back blocks the way." Seated at the coin table, the camera goes round to the far side, high, over the coins.
describe('the coin table camera', () => {
  it('sits on the far side of the table, not behind the player', () => {
    const page = readFileSync(join(root, 'public/between/garden.js'), 'utf8')
    expect(page).toContain('if (S.coins) {')
    expect(page).toMatch(/sp = tall \? at\(0\.3, 1\.5, 1\.75\) : at\(0\.45, 1\.15, 1\.55\)/)
    const table = readFileSync(join(root, 'public/between/coin-table.js'), 'utf8')
    expect(table).toContain('coins: true')
  })
})

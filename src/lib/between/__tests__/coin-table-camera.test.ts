import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../../..')

// His note on bi-door-look-3 (2026-11-02): "The camera needs to move so we can actually see the coins being flipped. The
// player back blocks the way." Seated at the coin table, the camera stands off the right shoulder, high, across the coins (the far side sat inside the hollow's wall: his phone shot, 2026-11-02).
describe('the coin table camera', () => {
  it("stands off the player's right shoulder, clear of the hollow wall and the player's back", () => {
    const page = readFileSync(join(root, 'public/between/garden.js'), 'utf8')
    expect(page).toContain('if (S.coins) {')
    expect(page).toMatch(/sp = tall \? at\(-1\.15, 1\.45, 0\.35\) : at\(-1\.3, 1\.15, 0\.4\)/)
    const table = readFileSync(join(root, 'public/between/coin-table.js'), 'utf8')
    expect(table).toContain('coins: true')
  })
})

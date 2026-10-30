import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// Charge to world, build 3: the place generator's first walkable build reads the sample's encounter location.
import { locations, read, sheet } from '../../../../public/calrunia/episode-sheet.js'
import { plan, secretsHere, strongStart, toYou } from '../../../../public/between/land/place.js'

const root = join(__dirname, '../../../..')
const sample = () => JSON.parse(readFileSync(join(root, 'public/between/ctw/sample-player.json'), 'utf8'))

async function clearing() {
  const charge = sample()
  const g = await read(charge)
  const md = sheet(charge, g)
  const loc = locations(charge, g).find((l: { role: string | number }) => l.role === 'encounter')
  return { g, md, loc, p: plan(loc, g.weather) }
}

describe('the first land (place.js)', () => {
  it('builds every aspect of the Unfinished Clearing, in the forest, under rain', async () => {
    const { p } = await clearing()
    expect(p.name).toBe('The Unfinished Clearing')
    expect(p.land).toBe('forest')
    expect(p.weather).toBe('rain')
    expect(p.pieces.map((x: { id: string }) => x.id)).toEqual(['instrument-ring', 'music-bar', 'sounding-stump'])
    expect(p.unbuilt).toEqual([])
  })

  it('lists an aspect no piece builds instead of drawing a stand-in', () => {
    const p = plan({ location: 'The Glass Orchard', element: 'metal', aspects: ['a ring of instruments in the trunks', 'glass apples that ring'], line: 'creative', state: { seed: 'ab' } }, 'fog')
    expect(p.land).toBeNull()
    expect(p.unbuilt).toEqual(['glass apples that ring'])
    expect(p.weather).toBe('mist')
  })

  it('says the strong start to you, and finds the secrets this place can tell', async () => {
    const { md, p } = await clearing()
    const start = strongStart(md)
    expect(start[0]).toMatch(/^You step out of the homeroom into the forest/)
    expect(start.join(' ')).not.toMatch(/the player|drafted/i)
    const secrets = secretsHere(md, p)
    expect(secrets.some((s: string) => /stump in the clearing answers any note/.test(s))).toBe(true)
    expect(secrets.some((s: string) => /played to its end/.test(s))).toBe(true)
    expect(toYou("The hum is the player's own")).toBe('The hum is your own')
  })

  it('the nook stand offers the doorway once the episode is unrolled, and the land page exists', () => {
    const cw = readFileSync(join(root, 'public/between/charge-world.js'), 'utf8')
    expect(cw).toMatch(/data-ctw="through"/)
    expect(cw).toMatch(/location\.href = "\/between\/land\.html"/)
    const page = readFileSync(join(root, 'public/between/land.html'), 'utf8')
    expect(page).toMatch(/\/between\/land\/land\.js/)
  })
})

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// Charge to world in the Between (Six-faces-council pass charge-to-world-1): the page's port of episode_sheet.py.
import { SATISFACTION, canonical, locations, read, sheet, todo } from '../../../../public/calrunia/episode-sheet.js'
import moveTable from '../../../../public/calrunia/move-table.json'

const root = join(__dirname, '../../../..')
const sample = () => JSON.parse(readFileSync(join(root, 'public/between/ctw/sample-player.json'), 'utf8'))

describe('episode sheet (port of council/tools/episode_sheet.py)', () => {
  it('routes canonical satisfaction words to their move-table elements', () => {
    const labels: Record<string, keyof typeof SATISFACTION> = {
      fear: 'excited', sadness: 'poignant', joy: 'blissful', anger: 'triumphant', neutrality: 'peaceful',
    }
    for (const channel of moveTable.channels) {
      expect(SATISFACTION[labels[channel.id]]).toBe(channel.element)
    }
  })

  it('makes a blissful creation wood and its environment forest', async () => {
    const charge = sample()
    charge.q2.feelings = ['blissful']
    const result = await read(charge)
    expect(result.errors).toBeUndefined()
    expect(result.element).toBe('wood')
    expect(result.environment).toBe('forest')
  })

  it('writes the sample player the same sheet, line for line, as the Python tool did', async () => {
    const charge = sample()
    const g = await read(charge)
    expect(g.errors).toBeUndefined()
    const want = readFileSync(join(__dirname, 'fixtures/ctw-sample-episode.md'), 'utf8')
    expect(sheet(charge, g)).toBe(want)
  })

  it('seeds from the same canonical JSON as Python (sorted keys, no spaces)', () => {
    expect(canonical({ b: [1, 'é'], a: { d: null, c: true } })).toBe('{"a":{"c":true,"d":null},"b":[1,"é"]}')
  })

  it('refuses a charge the grammar cannot read', async () => {
    const charge = sample()
    charge.line = 'vibes'
    charge.q6.loudest = 'I am a teapot'
    const g = await read(charge)
    expect(g.errors?.length).toBe(2)
  })

  it('never invents drafted text: without the drafted block every free-text slot is a gap', async () => {
    const charge = sample()
    delete charge.drafted
    const g = await read(charge)
    const locs = locations(charge, g)
    expect(locs.every((l: { drafted: boolean }) => !l.drafted)).toBe(true)
    expect(sheet(charge, g).split('(drafted)').length).toBe(2) // only the header's own note on what drafted means
    expect(todo(charge)).toEqual(['strong_start', 'secrets (0 of 10)', 'locations.encounter', 'locations.villain', 'locations.road-home', 'capability'])
  })
})

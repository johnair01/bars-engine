import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// Charge to world, pass charge-to-world-2: a charge the player wrote at the stand walks all three lands.
import { locations, read, sheet, todo } from '../../../../public/calrunia/episode-sheet.js'
import { draft, people, withDraft } from '../../../../public/calrunia/episode-draft.js'
import { friendHere, plan, secretsHere, strongStart, takeHome } from '../../../../public/between/land/place.js'

const root = join(__dirname, '../../../..')
const sample = () => JSON.parse(readFileSync(join(root, 'public/between/ctw/sample-player.json'), 'utf8'))

// a second invented player, unlike the sample on every axis (no real person)
const other = () => ({
  id: 'your-charge', player: 'you', episode: 'episode 1', line: 'relational',
  q1: { words: 'A weekly supper for the neighbours on my street', quadrant: 'lower_left', domain: 'community' },
  q2: { feelings: ['peaceful'] },
  q3: { distance: 'next door', obstacles: ['a person'], townsfolk: [{ role: 'neighbour', name: 'Ines' }, { role: 'friend', name: 'Sam' }] },
  q4: { weather: [{ feeling: 'anxious', strength: 'a season' }] },
  q5: { keys: { fear: 'They want to be asked.' } },
  q6: { beliefs: ["I don't belong"], loudest: "I don't belong", hoard: 'the invitations I wrote and never sent' },
})

const ROLES: Record<string, string> = { encounter: 'clearing', villain: 'scale-house', 'road-home': 'friends-fire' }
const SAMPLE_WORDS = /garage|Oriel|Tinker|recording studio|half-finished songs/i

async function walk(charge: Record<string, unknown>) {
  let g = await read(charge)
  expect(g.errors).toBeUndefined()
  const c = withDraft(charge, g)
  g = await read(c)
  expect(g.errors).toBeUndefined()
  const md = sheet(c, g)
  const lands = locations(c, g).map((loc: { role: string | number }) => ({ role: String(loc.role), p: plan(loc, loc.role === 'encounter' ? g.weather : '') }))
  return { c, g, md, lands }
}

describe('a charge you wrote (episode-draft.js)', () => {
  it('leaves the sample untouched: its own drafted block stands', async () => {
    const s = sample()
    const g = await read(s)
    expect(withDraft(s, g)).toBe(s)
  })

  it('builds every piece of all three lands, with nothing left to draft', async () => {
    const { c, md, lands } = await walk(other())
    expect(todo(c)).toEqual([])
    expect(md).not.toMatch(/\[to draft/)
    for (const { role, p } of lands) {
      expect(p.pieces, ROLES[role]).toHaveLength(3)
      expect(p.unbuilt, ROLES[role]).toEqual([])
    }
  })

  it('speaks the player\'s own words and none of the sample\'s', async () => {
    const { c, md, lands } = await walk(other())
    const told = [...strongStart(md), ...lands.flatMap(({ p }) => secretsHere(md, p)), takeHome(md).capability, takeHome(md).key].join('\n')
    expect(told).toMatch(/a weekly supper for the neighbours on my street/)
    expect(told).toMatch(/the invitations I wrote and never sent/i)
    expect(told).toMatch(/They want to be asked/)
    expect(told).not.toMatch(SAMPLE_WORDS)
    expect(JSON.stringify(c.drafted)).not.toMatch(SAMPLE_WORDS)
    for (const { p } of lands) expect(secretsHere(md, p).length).toBeGreaterThan(0)
  })

  it('seats the friend you named at the fire, and the other as the neighbour', async () => {
    const { md } = await walk(other())
    expect(friendHere(md)).toEqual({ name: 'Sam', line: 'Play what you have so far?' })
    expect(people(other())).toEqual({ friend: 'Sam', neighbour: 'Ines' })
  })

  it('lets Oriel and the Tinker stand in when no one is named', async () => {
    const c = other(); c.q3.townsfolk = []
    expect(people(c)).toEqual({ friend: 'Oriel', neighbour: 'the Tinker' })
  })

  it('names the take-home as an offer to one person, on the right hand', async () => {
    const g = await read(other())
    const d = draft(other(), g)
    expect(d.capability).toEqual({ act: 'Show what you have so far of a weekly supper for the neighbours on my street to one person this week.', quadrant: 'upper_right' })
    expect(d.secrets).toHaveLength(10)
  })

  it('gives the same world for the same answers', async () => {
    const a = await walk(other()), b = await walk(other())
    expect(a.md).toBe(b.md)
  })
})

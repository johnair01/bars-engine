import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Who owns each WorkAdventure world's map file (Wendell's answer C on wa-world-door-intake-1, 2026-11-23).
 * A generated world is sealed and carries no .wam; the workroom is his to draw in and must carry one.
 * The same rule in Python, for the generators, is public/wa/wa_owner.py.
 */
const WA = path.join(process.cwd(), 'public', 'wa')

type Owner = 'generator' | 'editor'

function ownerOf(folder: string): { owner: string | null; where: string } {
  const names = fs.readdirSync(folder).sort()
  const sources = names.filter(n => n.endsWith('-language.json') || n.endsWith('-base.json'))
  if (names.includes('owner.json')) sources.push('owner.json')
  for (const name of sources) {
    const doc = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8')) as { owner?: string }
    if (doc?.owner) return { owner: doc.owner, where: name }
  }
  return { owner: null, where: sources.join(', ') || 'no design-language file and no owner.json' }
}

const worlds = fs.readdirSync(WA)
  .map(name => ({ name, folder: path.join(WA, name) }))
  .filter(w => fs.statSync(w.folder).isDirectory() && fs.readdirSync(w.folder).some(f => f.endsWith('.tmj')))

describe('WorkAdventure worlds name an owner', () => {
  it('finds the worlds', () => {
    expect(worlds.map(w => w.name)).toContain('workroom')
  })

  it.each(worlds)('$name names one owner, and its files match that owner', ({ name, folder }) => {
    const { owner, where } = ownerOf(folder)
    expect(owner, `${name}: ${where}`).toMatch(/^(generator|editor)$/)
    const hasWam = fs.readdirSync(folder).some(f => f.endsWith('.wam'))
    expect(hasWam, `${name} is owned by the ${owner as Owner}`).toBe(owner === 'editor')
  })

  it('the workroom is the only world the client may edit', () => {
    const editable = worlds.filter(w => ownerOf(w.folder).owner === 'editor').map(w => w.name)
    expect(editable).toEqual(['workroom'])
  })

  it("the workroom's WAM points at its own map", () => {
    const wam = JSON.parse(fs.readFileSync(path.join(WA, 'workroom', 'workroom.wam'), 'utf8')) as { mapUrl: string }
    expect(wam.mapUrl).toBe('workroom.tmj')
    expect(fs.existsSync(path.join(WA, 'workroom', 'workroom.tmj'))).toBe(true)
  })

  it("every exit of the workroom leads to a map that exists", () => {
    const map = JSON.parse(fs.readFileSync(path.join(WA, 'workroom', 'workroom.tmj'), 'utf8')) as {
      layers: { type: string; objects?: { properties?: { name: string; value: string }[] }[] }[]
    }
    const exits = map.layers
      .filter(l => l.type === 'objectgroup')
      .flatMap(l => l.objects ?? [])
      .flatMap(o => (o.properties ?? []).filter(p => p.name === 'exitUrl').map(p => p.value))
    expect(exits.length).toBeGreaterThan(0)
    for (const url of exits) {
      expect(fs.existsSync(path.join(WA, 'workroom', url)), `exit ${url}`).toBe(true)
    }
  })
})

import { describe, expect, it, afterEach } from 'vitest'
import { runGate } from '../gate'
import { playerForToken } from '../auth'

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]).toString('base64')
const good = () => ({
  files: {
    'world.yaml': 'id: lantern-walk\nname: Lantern Walk\nversion: 1\n',
    'world.md': '# Lantern Walk\n',
    'conditions.yaml': '- id: night\n',
    'obstacles.yaml': '[]\n',
    'npcs.yaml': '- id: keeper\n',
  },
  portraits: [{ name: 'keeper.png', base64: png }],
})

describe('world-kit gate', () => {
  it('accepts a clean kit and names its identity', () => {
    const r = runGate(good())
    expect(r.verdict).toBe('accepted')
    expect(r.identity).toEqual({ kitId: 'lantern-walk', name: 'Lantern Walk', version: '1' })
  })
  it('rejects a broken kit with stable ids and the file to open', () => {
    const k = good()
    delete (k.files as Record<string, string>)['npcs.yaml']
    k.files['world.yaml'] = 'name: x\n'
    k.portraits = [{ name: 'a.png', base64: Buffer.from('nope').toString('base64') }]
    const r = runGate(k)
    expect(r.verdict).toBe('rejected')
    expect(r.identity).toBeNull()
    expect(r.findings.map(f => `${f.id}@${f.file}`)).toEqual(
      expect.arrayContaining(['missing-file@npcs.yaml', 'missing-kit-id@world.yaml', 'missing-version@world.yaml', 'not-a-png@portraits/a.png']),
    )
  })
  it('passes with warnings for an empty portraits folder and an extra file', () => {
    const k = good()
    k.portraits = []
    ;(k.files as Record<string, string>)['notes.txt'] = 'x'
    const r = runGate(k)
    expect(r.verdict).toBe('accepted_with_warnings')
    expect(r.identity?.kitId).toBe('lantern-walk')
  })
})

describe('world-kit token', () => {
  const was = process.env.WORLD_KIT_TOKENS
  afterEach(() => { process.env.WORLD_KIT_TOKENS = was })
  it('maps a bearer token to its player and refuses others', () => {
    process.env.WORLD_KIT_TOKENS = JSON.stringify({ sekret: 'p1' })
    expect(playerForToken('Bearer sekret')).toBe('p1')
    expect(playerForToken('Bearer wrong!')).toBeNull()
    expect(playerForToken(null)).toBeNull()
  })
})

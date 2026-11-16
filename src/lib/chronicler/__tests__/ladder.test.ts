import { describe, it, expect } from 'vitest'
import { RUNGS, linkError, reach, flagsForApproval, nextFlags, type Node, type Link } from '../ladder'

const n = (barId: string, rung: Node['rung']): Node => ({ barId, rung })

describe('chronicler ladder', () => {
  it('has six rungs, none naming a face', () => {
    expect(RUNGS).toHaveLength(6)
  })
  it('allows a link only from a higher rung down', () => {
    expect(linkError(n('a', 'world'), n('b', 'campaign'))).toBeNull()
    expect(linkError(n('a', 'world'), n('b', 'inspiration'))).toBeNull()
    expect(linkError(n('b', 'campaign'), n('a', 'world'))).toMatch(/higher rung down/)
    expect(linkError(n('a', 'asset'), n('b', 'asset'))).toMatch(/higher rung down/)
    expect(linkError(n('a', 'asset'), n('a', 'asset'))).toMatch(/itself/)
    expect(linkError(undefined, n('a', 'asset'))).toMatch(/ladder/)
  })
  it('lets a card have several parents and finds reach through all of them', () => {
    const links: Link[] = [
      { parentId: 'w', childId: 'c1' }, { parentId: 'w', childId: 'c2' },
      { parentId: 'c1', childId: 'e' }, { parentId: 'c2', childId: 'e' }, { parentId: 'e', childId: 'a' },
    ]
    const r = reach('e', links)
    expect([...r.up].sort()).toEqual(['c1', 'c2', 'w'])
    expect([...r.down]).toEqual(['a'])
  })
  it('an approval flags every rung it reaches and asks the horizontal question once', () => {
    const nodes = [n('w', 'world'), n('c', 'campaign'), n('e', 'encounter'), n('a', 'asset'), n('x', 'asset')]
    const links: Link[] = [{ parentId: 'w', childId: 'c' }, { parentId: 'c', childId: 'e' }, { parentId: 'e', childId: 'a' }]
    const f = flagsForApproval('e', nodes, links)
    expect(f.filter((x) => x.kind === 'horizontal')).toHaveLength(1)
    expect(f.map((x) => x.barId).sort()).toEqual(['a', 'c', 'e', 'w'])
    expect(f.find((x) => x.barId === 'x')).toBeUndefined()
  })
  it('serves a few flags at a time, horizontal first then nearest rung', () => {
    const rungs: Record<string, Node['rung']> = { h: 'encounter', w: 'world', c: 'campaign', a: 'asset', i: 'inspiration' }
    const mk = (id: string, kind: string, t: number) => ({ id, barId: id, kind, createdAt: new Date(t) })
    const open = [mk('w', 'ripple', 1), mk('i', 'ripple', 2), mk('a', 'ripple', 3), mk('c', 'ripple', 4), mk('h', 'horizontal', 5)]
    const out = nextFlags(open, (b) => rungs[b], 'encounter')
    expect(out.map((x) => x.id)).toEqual(['h', 'a', 'i'])
  })
})

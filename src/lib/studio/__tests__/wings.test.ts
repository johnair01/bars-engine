import { describe, expect, it } from 'vitest'
import { placementId } from '../stores'
import { CRATE_RUN } from '../stores'
import { demoWings, strandName, strandOf, wingsOf } from '../wings'
import { wingsPage } from '../wings-page'

const crate = (sha: string, round: string, reviewed?: boolean) => ({ sha, round, title: 't-' + sha, maker: null, picture: '/p/' + sha, ...(reviewed ? { reviewed: true } : {}) })

describe('the Wings', () => {
  it('names a strand from a round slug', () => {
    expect(strandOf('2026-11-11-heaven-r28')).toBe('heaven')
    expect(strandOf('2026-10-30-money-gate-2')).toBe('money-gate')
    expect(strandOf('2026-10-29-tea-drink-blender')).toBe('tea-drink-blender')
    expect(strandName('money-gate')).toBe('Money gate')
  })
  it('groups unreviewed crates into rooms, the newest first, and drops placed ones', () => {
    const crates = [crate('aaaaaaaaaaaaaaaa1', '2026-11-11-heaven-r28'), crate('bbbbbbbbbbbbbbbb2', '2026-11-10-money-gate-1'),
      crate('cccccccccccccccc3', '2026-11-09-heaven-r27'), crate('dddddddddddddddd4', '2026-11-08-heaven-r26', true)]
    const w = wingsOf(crates, { [placementId(CRATE_RUN, 'crate-cccccccccccccccc')]: { to: 'shelf' } })
    expect(w.rooms.map(r => r.strand)).toEqual(['heaven', 'money-gate'])
    expect(w.rooms[0].crates.map(c => c.id)).toEqual(['crate-aaaaaaaaaaaaaaaa'])
  })
  it('renders a page with a door script and no counts', () => {
    const html = wingsPage(demoWings())
    expect(html).toContain('window.WINGS=')
    expect(html).toContain('Done for now')
    expect(html).not.toMatch(/\bleft\b.*\d+ crates/)
  })
})

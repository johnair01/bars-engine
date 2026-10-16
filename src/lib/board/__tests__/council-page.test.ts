import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { missingCouncilPatches, patchCouncilPage } from '../council-page'
import { wrapBoardPage } from '../page'
import { BOARD_SHIM, boardShim } from '@/app/board/shim'
import { COLLECTIONS } from '../save'

describe('board shim', () => {
  it('keeps the nonprofit shim as it was', () => {
    expect(BOARD_SHIM).toBe(boardShim('nonprofit', '/board'))
    expect(BOARD_SHIM).toContain("const BOARD = 'nonprofit'")
    expect(BOARD_SHIM).toContain("'/login?returnTo=/board'")
  })
  it('names the council board and its own path', () => {
    const s = boardShim('council', '/board/council')
    expect(s).toContain("const BOARD = 'council'")
    expect(s).toContain("'/login?returnTo=/board/council'")
    expect(s).not.toContain('${')
  })
  it('wraps a fragment in a document shell, shim first', () => {
    const out = wrapBoardPage('<title>x</title>', 'council', '/board/council')
    expect(out.startsWith('<!doctype html>')).toBe(true)
    expect(out.indexOf("const BOARD = 'council'")).toBeLessThan(out.indexOf('<title>x</title>'))
  })
})

describe('patchCouncilPage', () => {
  it('leaves a page without the Send lines unchanged', () => {
    expect(patchCouncilPage('<p>x</p>')).toBe('<p>x</p>')
    expect(missingCouncilPatches('<p>x</p>')).toHaveLength(4)
  })
})

// When a sibling checkout of six-faces-council is present (a cloud session, a developer machine), check the real page:
// every store call it makes must be one the save contract accepts, and every patch must still match.
const COUNCIL = process.env.COUNCIL_BOARD_HTML || '../Six-faces-council/board/council-board.html'
describe.skipIf(!existsSync(COUNCIL))('the real council-board.html', () => {
  const html = existsSync(COUNCIL) ? readFileSync(COUNCIL, 'utf8') : ''
  it('still matches every serve-time patch', () => {
    expect(missingCouncilPatches(html)).toEqual([])
  })
  it('calls only collections the save contract accepts', () => {
    const used = new Set<string>()
    for (const m of html.matchAll(/\.collection\('([a-z]+)'\)/g)) used.add(m[1])
    for (const m of html.matchAll(/\.doc\('([a-z]+)\//g)) used.add(m[1])
    for (const k of ['positions', 'questions', 'causes', 'terms']) used.add(k) // db.collection(kind) over this list
    for (const c of used) expect(COLLECTIONS as readonly string[]).toContain(c)
    expect(html).not.toMatch(/\.delete\(\)/) // the shim offers no delete
  })
})

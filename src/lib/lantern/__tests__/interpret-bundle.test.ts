import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// The lantern table's scene (public/lantern/table/table.js) imports interpret.js, built from interpret.ts. This fails when
// the committed build falls behind the source or the quest grammar's word lists: run npm run lantern:engine.
import { buildInterpret, INTERPRET_OUT } from '../../../../scripts/build-lantern-engine.mjs'

describe('the scene reads answers the way the tests read them', () => {
  it('public/lantern/table/interpret.js is built from the current interpret.ts', () => {
    expect(readFileSync(INTERPRET_OUT, 'utf8')).toBe(buildInterpret())
  })
  it('imports the rules from the page\'s own engine.js and carries no server code', () => {
    const js = readFileSync(INTERPRET_OUT, 'utf8')
    expect(js).toContain('from "./engine.js"')
    expect(js).not.toMatch(/@prisma|next\/|FACE_SENTENCES/)
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
// The lantern table's scene (public/lantern/table/table.js) imports engine.js, built from engine.ts. This fails when the
// committed build falls behind the source: run npm run lantern:engine.
import { buildEngine, OUT } from '../../../../scripts/build-lantern-engine.mjs'

describe('the scene plays the engine the tests play', () => {
  it('public/lantern/table/engine.js is built from the current engine.ts', () => {
    expect(readFileSync(OUT, 'utf8')).toBe(buildEngine())
  })
})

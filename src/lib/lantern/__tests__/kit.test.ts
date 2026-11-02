import { describe, expect, it } from 'vitest'
// The portable kit's motion checks (brief "Lantern Hall, portable kit", step 4). The two browser checks, the turntable
// render and the intake click-through, run in scripts/lantern-kit-check.mjs.
import { boneLengths, clearance, footSlip, walkBack } from '../../../../public/lantern/checks.js'

describe('lantern kit motion checks', () => {
  for (const check of [footSlip, boneLengths, clearance, walkBack]) {
    it(check.name, () => {
      const r = check()
      expect(r.pass, r.detail).toBe(true)
    })
  }
})

import { describe, expect, it } from 'vitest'
// The kneel as one verb word (public/between/kneel.js): drawn in the council's animation-language rounds 5 to 7 and
// approved on al-look-7. The pose takes a body's own lengths, so two different bodies must both land on the floor.
import { BEATS, CAP, DURATION, WORD, cap, defaultContacts, kneelPose } from '../../../../public/between/kneel.js'

// Two bodies, in metres: an average adult and a shorter one. Neither carries its own numbers in the module.
const BODIES = {
  tall: { H: 0.93, thigh: 0.42, shin: 0.42, hw: 0.18, A0: 0.08, K0: 0.5 },
  short: { H: 0.8, thigh: 0.36, shin: 0.36, hw: 0.16, A0: 0.07, K0: 0.43 },
}

describe('the kneel word', () => {
  it('names no body', () => {
    expect(WORD).toEqual({ verb: 'kneel', target: 'floor', manner: 'slowly', element: 'earth' })
    expect(BEATS).toHaveLength(5)
    expect(BEATS[4][0]).toBe(DURATION)
  })

  it('beats 1 and 2 follow capture 23_03 hip heights', () => {
    for (const d of Object.values(BODIES)) {
      expect(kneelPose(d, 0.5).hip.y / d.H).toBeCloseTo(0.931, 3)
      expect(kneelPose(d, 1.9).hip.y / d.H).toBeCloseTo(0.507, 3)
    }
    expect(cap('hip', 1.9)).toBeCloseTo(CAP.hip[19], 6)
  })

  it('the left knee goes down first, and the right joins after', () => {
    for (const d of Object.values(BODIES)) {
      const g = defaultContacts(d)
      expect(kneelPose(d, 1.9).K.L.y).toBeLessThan(0.2 * d.K0)   // the capture's back knee is nearly down at 1.9 s
      expect(kneelPose(d, 1.9).K.L.y).toBeGreaterThanOrEqual(g.kneeY)
      expect(kneelPose(d, 1.9).K.R.y).toBeGreaterThan(d.A0 + d.shin * 0.99)
      expect(kneelPose(d, 4).K.R.y).toBeCloseTo(g.kneeY, 3)
    }
  })

  it('nothing goes under the floor through the whole kneel, on both bodies', () => {
    for (const d of Object.values(BODIES)) {
      for (let i = 0; i <= 40; i++) {
        const p = kneelPose(d, (DURATION * i) / 40)
        for (const s of ['L', 'R'] as const) {
          expect(p.K[s].y).toBeGreaterThanOrEqual(0)
          const a = p.A[s]
          if (a) expect(a.y).toBeGreaterThanOrEqual(0)
        }
        expect(p.hip.y).toBeGreaterThan(0)
      }
    }
  })

  it('beat 3 leans back with the hips behind the knees, not rising to a tall kneel (al-look-6 B)', () => {
    for (const d of Object.values(BODIES)) {
      const p = kneelPose(d, 2.6)
      expect(p.lean).toBeLessThan(0)
      expect(p.hip.f).toBeLessThan(p.K.L.f)
      expect(p.hip.y).toBeLessThan(kneelPose(d, 1.9).hip.y + d.thigh * 0.8)
    }
  })

  it('rests tall and upright in beat 5 with the hands on the thighs', () => {
    for (const d of Object.values(BODIES)) {
      const p = kneelPose(d, 4)
      expect(Math.abs(p.lean)).toBeLessThan(0.01)
      expect(p.hands).toBeCloseTo(1, 5)
    }
  })
})

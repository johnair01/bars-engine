/* Lantern Hall kit checks: pure, numeric, no drawing. Each returns {name, pass, value, limit, detail} so an environment
   that cannot look at a frame still gets a verdict. Used by src/lib/lantern/__tests__/kit.test.ts and by
   scripts/lantern-kit-check.mjs, which adds the two browser checks (turntable renders, intake click-through).
   Brief "Lantern Hall, portable kit", step 4 (six-faces-council council/callsheets/lantern-hall.md). */
import { RIG } from './rig.js'
import { NAV, PATH } from './nav.js'

/** The hall layout of the v5/v6 reel and the rig study: eight hex tables, your own table and the sample table. */
export const TABLE_R = 1.35
export const HALL = {
  tables: [[-2.6, 8], [2.8, 11.5], [0.9, 16], [-2.8, 24], [3, 26], [-0.6, 31], [2.4, 36], [-2.6, 37]].map(([x, z]) => ({ x, z, r: TABLE_R })),
  own: { x: 0.9, z: 16 },
  sample: { x: -2.8, z: 24 },
}
/** Where the walker stands to sit at a table (the reel's AT_OWN / AT_SAMP). */
export const seatOf = t => ({ x: t.x + 0.25, z: t.z - 2.3 })
export const HUMAN = 1.7

const dist = (a, b) => Math.hypot(a.f - b.f, a.l - b.l, a.u - b.u)

/** Plan the walk out (own seat to sample seat) and the walk back, exactly as the reel and rig study do. */
export function hallWalk(hall = HALL) {
  const out = NAV.plan(seatOf(hall.own), seatOf(hall.sample), hall.tables, { clear: 0.35 })
  const back = PATH.reverse(out)
  return { out, back }
}

/** Foot slip at steady speed: while a foot touches the ground, its contact point must not move in the world.
    The body travels one stride per gait cycle; a planted heel or toe at ground level keeps the same world position. */
export function footSlip({ h = HUMAN, steps = 2000 } = {}) {
  const stride = RIG.stride(h)
  let worst = 0
  for (const side of ['L', 'R']) {
    for (const part of ['heel', 'toe']) {
      let anchor = null
      for (let i = 0; i <= steps; i++) {
        const phase = i / steps
        const P = RIG.pose(phase, 1)
        const g = P[side]
        const q = g[part]
        const down = g.plant && q.u < 1e-9
        if (!down) { anchor = null; continue }
        const world = phase * stride + q.f * h // body travel plus figure-local forward offset, in metres
        if (anchor == null) anchor = world
        worst = Math.max(worst, Math.abs(world - anchor))
      }
    }
  }
  return { name: 'foot slip at steady speed', pass: worst < 1e-6, value: worst, limit: 0, unit: 'm', detail: `largest drift of a planted heel or toe over one cycle: ${(worst * 1000).toFixed(4)} mm` }
}

/** Bone lengths exact: thigh, shin, upper arm and forearm keep their lengths at every phase and speed. */
export function boneLengths({ phases = 240, speeds = [0, 0.3, 0.6, 1, 1.2] } = {}) {
  const D = RIG.D
  let worst = 0, where = ''
  for (const k of speeds) for (let i = 0; i < phases; i++) {
    const P = RIG.pose(i / phases, k)
    const bones = [
      ['L thigh', P.L.hip, P.L.knee, D.thigh], ['L shin', P.L.knee, P.L.ankle, D.shin],
      ['R thigh', P.R.hip, P.R.knee, D.thigh], ['R shin', P.R.knee, P.R.ankle, D.shin],
      ['L upper arm', P.armL.sh, P.armL.el, D.upper], ['R upper arm', P.armR.sh, P.armR.el, D.upper],
      ['L forearm', P.armL.el, P.armL.wr, D.fore], ['R forearm', P.armR.el, P.armR.wr, D.fore],
    ]
    for (const [name, a, b, len] of bones) {
      const e = Math.abs(dist(a, b) - len)
      if (e > worst) { worst = e; where = `${name} at phase ${(i / phases).toFixed(3)}, speed ${k}` }
    }
  }
  return { name: 'bone lengths exact', pass: worst < 1e-9, value: worst, limit: 0, unit: 'figure heights', detail: worst < 1e-9 ? 'every leg and arm bone holds its length' : `worst: ${where}` }
}

/** Clearance: the walk keeps its centre line at or over TABLE_R (1.35 m) from every table centre, out and back. */
export function clearance(hall = HALL) {
  const { out, back } = hallWalk(hall)
  let min = Infinity, at = null
  for (const path of [out, back]) for (let s = 0; s <= path.len; s += 0.02) {
    const p = NAV.sample(path, s)
    for (const t of hall.tables) { const d = Math.hypot(p.x - t.x, p.z - t.z); if (d < min) { min = d; at = t } }
  }
  return { name: 'clearance from every table', pass: min >= TABLE_R, value: min, limit: TABLE_R, unit: 'm', detail: `closest approach ${min.toFixed(3)} m to the table at (${at.x}, ${at.z})` }
}

/** The walk back equals the walk out reversed, point for point (his note: "They didn't walk the same path back"). */
export function walkBack(hall = HALL) {
  const { out, back } = hallWalk(hall)
  let worst = Math.abs(out.len - back.len)
  for (let s = 0; s <= out.len; s += 0.05) {
    const a = NAV.at(out, s), b = NAV.at(back, back.len - s)
    worst = Math.max(worst, Math.hypot(a.x - b.x, a.z - b.z))
  }
  return { name: 'walk back equals walk out reversed', pass: worst < 1e-6, value: worst, limit: 0, unit: 'm', detail: `route ${out.len.toFixed(2)} m; largest gap between out and back ${worst.toExponential(2)} m` }
}

export const PURE_CHECKS = [footSlip, boneLengths, clearance, walkBack]
export const runPure = () => PURE_CHECKS.map(f => f())

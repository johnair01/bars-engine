// The robe (round 6, the robe-slit build; his yes to the layers still, 2026-10-24): robe.glb's own skinned mesh on the
// body's bones, no bake. The bake (robe-baked.glb) was the cloth recorded over one clip, so every new pose (the standing
// idle, sitting) had no robe that matched it. Below the waist the robe is now two panels hung from the rig's skirt bones,
// hemF and hemB (children of the hips), and each frame the legs drive them: the front panel rides the leading thigh, the
// back panel the trailing one (docs/3d-math.md rule 8: a long garment is skinned to the legs, not chased as cloth). It
// follows the Walk, the Idle, the sit and any later clip with no re-bake. Plain module, no three.js, so the tools
// (tools/figure-cover.mjs, tools/figure-legs-probe.mjs) run the same math in node.
//   skirtWeights({ pos, index, skinIndex, skinWeight, hemF, hemB, hemF2, hemB2, hipL, hipR })   // once: the weights, in place
//   const sk = skirt();  sk.step(legs, shins, hipsHigh, dt)           // each frame: the panels' pitches (radians forward)

// The outfit cuts: where the robe's hem falls (metres above the floor, rest pose; 0 is the robe's own hem at the ankle), whether
// the sash is tied, and which of the look's cloth colours the robe's light bands (collar, cuffs, hem) take: 1 light, 3 trim
export const CUT = { jacket: { hem: 0.73, sash: false, band: 1 }, dress: { hem: 0.36, sash: true, band: 1 }, coat: { hem: 0, sash: false, band: 3 } };
// the robe's own hem (robe.glb's lowest rest point), where the coat ends
export const ROBE_HEM = 0.15;
export const hemOf = C => C.hem || ROBE_HEM;

// The panels (rest metres): below SLIT_TOP the side slits cut the robe in two, and each point goes wholly to its panel by the
// mean z of its triangles, so the two copies of a slit-edge point go each to their own side (the slit sits at z -0.01). Above
// it the panels blend softly by z; they hold the robe wholly up to FULL (a thigh swung forward must not leave the cloth at
// half its turn) and by FADE_TOP, at the skirt bones' own height, the robe has its own weights back (hips and spine).
// The sides, where the robe hugs the outer thigh, ride the near thigh by up to SIDE (the brief's side panels: a thigh swung out
// in the Idle's stance or the sit must take the cloth with it).
// Over the hips and thighs (EASE_AT, rest metres) the robe lies on the trousers with no room; it is let out by EASE, a
// tailor's ease, so a thigh at the front of a stride or seated stays under it.
export const SLIT_TOP = 0.5, FULL = 0.76, FADE_TOP = 0.96, SPLIT_Z = -0.01, BLEND_Z = 0.05, SIDE = [0.4, 1], EASE = 0.02, EASE_AT = [0.5, 0.62, 0.86, 0.96];
const ease = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
// pos: flat rest positions; skinIndex / skinWeight: flat, 4 per point (plain arrays the caller writes back); the rest: bone ids
// (hemF2, hemB2: the lower skirt bones below the fold, FOLD)
export const easeOf = y => EASE * ease(EASE_AT[0], EASE_AT[1], y) * ease(EASE_AT[3], EASE_AT[2], y);
// Behind, the robe's own thigh weights round the hips (up to SEAT) go to the hips: a thigh folded up to sit drags that cloth
// into the seat (linear blend skinning between a bent thigh and the hips falls inside both). In front they stay, since the
// hips narrow on a slender build and the thighs do not.
export const SEAT = 1.06;
export function skirtWeights({ pos, index, skinIndex, skinWeight, hips, hemF, hemB, hemF2, hemB2, hipL, hipR }) {
  const n = pos.length / 3, zSum = new Float32Array(n), zN = new Float32Array(n);
  for (let t = 0; t < index.length; t += 3) { const c = (pos[index[t] * 3 + 2] + pos[index[t + 1] * 3 + 2] + pos[index[t + 2] * 3 + 2]) / 3; for (let q = 0; q < 3; q++) { zSum[index[t + q]] += c; zN[index[t + q]]++; } }
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], L = ease(FADE_TOP, FULL, y);
    if (y < SEAT && z < SPLIT_Z) for (let k = 0; k < 4; k++) if (skinIndex[i * 4 + k] === hipL || skinIndex[i * 4 + k] === hipR) skinIndex[i * 4 + k] = hips;
    if (L <= 0) { const m = new Map(); for (let k = 0; k < 4; k++) m.set(skinIndex[i * 4 + k], (m.get(skinIndex[i * 4 + k]) || 0) + skinWeight[i * 4 + k]);
      [...m].concat([[0, 0], [0, 0], [0, 0]]).slice(0, 4).forEach(([j, w], k) => { skinIndex[i * 4 + k] = j; skinWeight[i * 4 + k] = w; }); continue; }
    const hard = zSum[i] / (zN[i] || 1) > SPLIT_Z ? 1 : 0, soft = ease(SPLIT_Z - BLEND_Z, SPLIT_Z + BLEND_Z, z), b = ease(SLIT_TOP, SLIT_TOP + 0.16, y);
    const f = hard * (1 - b) + soft * b, sd = (SIDE[0] + (SIDE[1] - SIDE[0]) * ease(SLIT_TOP - 0.05, SLIT_TOP + 0.1, y)) * ease(0.6, 0.95, Math.abs(x) / (Math.hypot(x, z) || 1)), lo = ease(FOLD + 0.08, FOLD - 0.08, y);
    const all = new Map([[hemF, L * f * (1 - sd) * (1 - lo)], [hemB, L * (1 - f) * (1 - sd) * (1 - lo)], [hemF2, L * f * (1 - sd) * lo], [hemB2, L * (1 - f) * (1 - sd) * lo], [x > 0 ? hipL : hipR, L * sd]]);
    for (let k = 0; k < 4; k++) { const j = skinIndex[i * 4 + k]; all.set(j, (all.get(j) || 0) + skinWeight[i * 4 + k] * (1 - L)); }
    const best = [...all].sort((p, q) => q[1] - p[1]).slice(0, 4), sum = best.reduce((s, p) => s + p[1], 0) || 1;
    for (let k = 0; k < 4; k++) { skinIndex[i * 4 + k] = best[k] ? best[k][0] : 0; skinWeight[i * 4 + k] = best[k] ? best[k][1] / sum : 0; }
  }
}

// The panel driver. The forward pitch (radians, in the hips' own frame: 0 hangs straight down, + swings forward) of each
// thigh, and of each hip-to-ankle line (a shin folded back at toe-off reaches behind its thigh: the probe saw the trailing
// ankle through the back hem), gives the front panel the smooth max of them (the leading leg) and the back panel the smooth
// min (the trailing one), each clamped, and neither panel goes through the floor: when the hips are lower than a panel is long
// (sitting), the front lies forward over the lap and the back spreads behind. Below the fold (the lower skirt bones, made in
// code at knee height) each panel hangs plumb unless a shin pushes it (the smooth max or min of the shins' pitch and 0), and
// a fold too near the floor gathers its cloth (fold() squashes the lower panel to the height it has): seated, the robe lies
// over the lap and falls to the floor in front of the crossed shins. A light spring on top in fixed 1/240 s substeps
// (rule 5) is the secondary sway; with no dt (a tool posing one frame) the panels sit on their targets.
export const FRONT = [-0.3, 1.7], BACK = [-0.9, 1.2], SOFT = 0.04, PANEL = 0.83, FOLD = 0.52, LOWER = 0.37, SWAY = { hz: 4.5, zeta: 0.6 }, STEP = 1 / 240;
const clamp = (x, [a, b]) => Math.min(b, Math.max(a, x));
const smax = (p, k) => { const m = Math.max(...p); return m + k * Math.log(p.reduce((s, x) => s + Math.exp((x - m) / k), 0)); };
const smin = (p, k) => -smax(p.map(x => -x), k);
// legs: the thighs' and hip-to-ankle lines' pitches; shins: the knee-to-ankle pitches; high: hips over the floor (rig metres)
export function panelTargets(legs, shins, high = 1) {
  let f = clamp(smax(legs, SOFT), FRONT), b = clamp(smin(legs, SOFT), BACK);
  if (high < PANEL) { const lim = Math.acos(Math.max(0, high) / PANEL); f = Math.max(f, lim); b = Math.min(b, -lim); }
  return [f, b, smax([...shins, 0], SOFT), smin([...shins, 0], SOFT)];
}
// the lower panel's length share when its fold stands `high` over the floor at pitch a (1: its whole length)
export const fold = (high, a) => Math.cos(a) > 0.05 ? Math.min(1, Math.max(0.2, high / (LOWER * Math.cos(a)))) : 1;
export function skirt({ hz, zeta } = SWAY) {
  const K = (2 * Math.PI * hz) ** 2, C = 2 * zeta * 2 * Math.PI * hz, s = { a: [0, 0, 0, 0], v: [0, 0, 0, 0], acc: 0, on: false };
  return {
    s,
    // returns the four panel pitches [front, back, front below the fold, back below the fold]
    step(legs, shins, high, dt) {
      const t = panelTargets(legs, shins, high);
      if (!(dt > 0) || !s.on) { s.a = t; s.v = [0, 0, 0, 0]; s.acc = 0; s.on = dt > 0; return s.a; }
      s.acc = Math.min(s.acc + dt, 0.1);   // a long frame (a hidden tab) steps at most 0.1 s of sway
      for (; s.acc >= STEP; s.acc -= STEP) for (let k = 0; k < 4; k++) { s.v[k] += (K * (t[k] - s.a[k]) - C * s.v[k]) * STEP; s.a[k] += s.v[k] * STEP; }
      return s.a;
    },
  };
}

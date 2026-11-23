// robe-run-1 (Wendell's A on robe-run-research-1 and robe-research-look-1, 2026-11-20): the robe-on-a-run check. It drives the
// game's own step(), the cultivation walker and its skirt chains at a fixed 30 fps through a jog, a run and a jump, and
// measures, on the robe the player sees, the study's plain checks that a number can hold:
//   inside   robe points below the waist that sit inside a leg's own outline (target 0 on every frame)
//   hem      the hem over the leading leg stays at or below the knee; over the trailing leg at or below mid-calf
//   waist    the top of the robe hangs from the waist: the band just under it never stands off its skinned place
//   slit     the front slit opens in a stride (each leg carries its own panel, no single tube round both legs)
// Folds (at most five large ones) and the reference comparison stay a look at the frames; `frames` returns them.
// Run in the page: `(await import('/sect/heaven/robecheck.js')).robeCheck()`.
import * as THREE from 'three';
import * as M from '../cult/mix.js';

export const ROBE_BOUNDS = { inside: 0, hemLead: 0.0, hemTrail: 0.0, waist: 0.02, slitDeg: 6 };
const DT = 1 / 30, DEEP = 0.01, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());

// one frame's numbers, from the robe's drawn points (pt.settled) and the posed legs
export function robeFrame(w, fw, rest = null) {
  const X = w.X, F = X.F, pt = X.parts.find(p => p.name === 'robe'); if (!pt || !pt.settled) return null;
  const W = pt.settled, R0 = pt.world, E = pt.geo.attributes.aEdgeH, n = W.length / 3, p = V(); M.legFrame(X);
  const legs = {}; for (const s of ['L', 'R']) legs[s] = { hip: wp(F.bones['hip' + s]), knee: wp(F.bones['knee' + s]), ankle: wp(F.bones['ankle' + s]) };
  const pel = legs.L.hip.clone().add(legs.R.hip).multiplyScalar(0.5);
  const lead = legs.L.ankle.clone().sub(pel).dot(fw) > legs.R.ankle.clone().sub(pel).dot(fw) ? 'L' : 'R', trail = lead === 'L' ? 'R' : 'L';
  let inside = 0, waist = 0; const depth = rest ? null : new Float32Array(n).fill(-1), T1 = (() => { pt.settled = null; const t = Float32Array.from(M.partWorld(pt)); pt.settled = W; return t; })(), rim = []; let free = 0; // the skinned place (partWorld returns pt.settled while it is set, so `waist` read 0 before)
  for (let i = 0; i < n; i++) { p.fromArray(W, i * 3); const y0 = R0[i * 3 + 1];
    // the leg outline (mix.js legProfile) is the farthest skin per 2 cm and 15 degrees, smoothed, so at the stand some robe points already
    // sit a little inside it. A point counts as through the robe only when it is DEEP cm deeper inside a leg than it sat at the stand.
    if (y0 < X.yHip - 0.08) { let dep = -1; for (const s of ['L', 'R']) { const q = M.legOut(X.legR[s], p); if (q) dep = Math.max(dep, q.r - q.d); }
      if (rest) { if (dep > Math.max(rest[i], 0) + DEEP) inside++; } else depth[i] = dep; }
    if (y0 < X.yHip - 0.04 && y0 > X.yHip - 0.12) waist = Math.max(waist, p.distanceTo(V().fromArray(T1, i * 3)));
    if (E && E.getX(i) < 0.004) { rim.push(p.clone()); free += p.distanceTo(V().fromArray(T1, i * 3)); } }
  M.legFrame(X, false);
  // robe-sprint-look-4 (the hem's geometry): the longest any triangle edge has stretched past its length at the stand, and how many edges
  // are past 2x. A torn or spiked hem shows as edges that stretch; the stand is 1.
  let stretch = 1, torn = 0; { const I = pt.geo.index.array, e = (a, b) => { const d1 = Math.hypot(W[a * 3] - W[b * 3], W[a * 3 + 1] - W[b * 3 + 1], W[a * 3 + 2] - W[b * 3 + 2]), d0 = Math.hypot(R0[a * 3] - R0[b * 3], R0[a * 3 + 1] - R0[b * 3 + 1], R0[a * 3 + 2] - R0[b * 3 + 2]);
      if (d0 < 1e-4) return; const r = d1 / d0; if (r > stretch) stretch = r; if (r > 2) torn++; };
    for (let k = 0; k < I.length; k += 3) { e(I[k], I[k + 1]); e(I[k + 1], I[k + 2]); e(I[k + 2], I[k]); } }
  // the hem over a leg: rim points within 18 cm across the floor of the shin's middle, their median height
  const hemOver = s => { const m = legs[s].knee.clone().add(legs[s].ankle).multiplyScalar(0.5), ys = rim.filter(r => Math.hypot(r.x - m.x, r.z - m.z) < 0.18).map(r => r.y).sort((a, b) => a - b);
    return ys.length ? ys[ys.length >> 1] : null; };
  const hL = hemOver(lead), hT = hemOver(trail);
  const kneeY = legs[lead].knee.y, calfY = (legs[trail].knee.y + legs[trail].ankle.y) / 2;
  // the front slit: the widest gap between neighbouring rim points (by angle about the pelvis) within 45 degrees of forward
  const lft = V(-fw.z, 0, fw.x), ang = rim.map(r => Math.atan2(r.clone().sub(pel).dot(lft), r.clone().sub(pel).dot(fw))).sort((a, b) => a - b);
  let slit = 0; for (let k = 1; k < ang.length; k++) { const mid = (ang[k] + ang[k - 1]) / 2; if (Math.abs(mid) < Math.PI / 4) slit = Math.max(slit, ang[k] - ang[k - 1]); }
  // robe-sprint-look-6 B ("it swings too stiffly"), measured against the reference photos (robe-run/refs, R1 side view): in a real sprint the
  // back of the hem trails behind the hips and the front rides the leading thigh, so the hem opens as a bell. backDeg / frontDeg: the angle
  // off vertical, from the hips' centre, of the hem's rearmost and foremost points (positive = behind for back, ahead for front); free:
  // the hem's mean distance from its skinned place (a robe that only turns with the pelvis has free near 0); backOff: the rearmost point's
  // distance behind the hips along the run (its range over the sprint is the swing).
  let backOff = null, backDeg = null, frontDeg = null;
  if (rim.length) { let b = null, f = null; for (const r of rim) { const a = r.clone().sub(pel).dot(fw); if (!b || a < b.a) b = { a, y: r.y }; if (!f || a > f.a) f = { a, y: r.y }; }
    backOff = -b.a; backDeg = Math.atan2(-b.a, pel.y - b.y) * 180 / Math.PI; frontDeg = Math.atan2(f.a, pel.y - f.y) * 180 / Math.PI; }
  return { free: rim.length ? free / rim.length : null, backOff, backDeg, frontDeg, depth, inside, waist, stretch, torn, hemLead: hL == null ? null : hL - kneeY, hemTrail: hT == null ? null : hT - calfY, slitDeg: slit * 180 / Math.PI, lead,
    hemMin: rim.length ? Math.min(...rim.map(r => r.y)) - pel.y : null, hemMax: rim.length ? Math.max(...rim.map(r => r.y)) - pel.y : null };
}

// the plan: [frames, keys, run, jump at frame, name]
export const PLAN = [[20, [], false, -1, 'stand'], [45, ['w'], false, -1, 'jog'], [75, ['w'], true, -1, 'run'], [40, ['w'], true, 8, 'jump'], [20, [], false, -1, 'stop']];

export async function robeCheck({ shoot = null, plan = PLAN } = {}) {
  const h = window.heaven, w = await h.walking; await h.ready; h.manual = true;
  h.jump(1); h.rig.adopt(); h.rig.hands = 99; for (let i = 0; i < 20; i++) h.simulate(DT);
  // the stand's depths, the yardstick for `inside`
  const stand = robeFrame(w, V(-Math.sin(h.A.rotation.y), 0, -Math.cos(h.A.rotation.y))), rest = stand && stand.depth;
  const per = {}, worst = {}; let f = 0;
  for (const [n, keys, run, jumpAt, name] of plan) { per[name] = [];
    for (let i = 0; i < n; i++) { h.input.keys = new Set(keys); h.input.run = run; if (i === jumpAt) h.input.jump = true; h.simulate(DT);
      const yaw = h.A.rotation.y, fw = V(-Math.sin(yaw), 0, -Math.cos(yaw)), r = robeFrame(w, fw, rest); if (r) { delete r.depth; r.f = f; r.name = name; per[name].push(r); }
      if (shoot) await shoot(f, name, fw); f++; } }
  const all = Object.values(per).flat(), mx = k => Math.max(...all.map(r => r[k]).filter(x => x != null)), mn = k => Math.min(...all.map(r => r[k]).filter(x => x != null));
  const moving = all.filter(r => !['stand', 'stop'].includes(r.name));
  const S = { insideMax: mx('inside'), insideFrames: all.filter(r => r.inside > 0).length, frames: all.length, hemLeadMax: mx('hemLead'), hemTrailMax: mx('hemTrail'),
    waistMax: mx('waist'), slitMaxDeg: Math.max(...moving.map(r => r.slitDeg)), stretchMax: mx('stretch'), tornMax: mx('torn'), hemRange: [mn('hemMin'), mx('hemMax')] };
  for (const [name, rs] of Object.entries(per)) worst[name] = { inside: Math.max(0, ...rs.map(r => r.inside)), hemLead: Math.max(-9, ...rs.map(r => r.hemLead ?? -9)), hemTrail: Math.max(-9, ...rs.map(r => r.hemTrail ?? -9)), slitDeg: Math.max(0, ...rs.map(r => r.slitDeg)) };
  // the swing, per phase (robe-sprint-look-6 B): mean free swing (cm), mean back and front angles (degrees), and the back edge's range (cm)
  const avg = (rs, k) => { const v = rs.map(r => r[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }, r1 = x => x == null ? null : Math.round(x * 10) / 10;
  S.swing = {}; for (const [name, rs] of Object.entries(per)) { const bo = rs.map(r => r.backOff).filter(x => x != null);
    S.swing[name] = { free: r1(100 * avg(rs, 'free')), backDeg: r1(avg(rs, 'backDeg')), frontDeg: r1(avg(rs, 'frontDeg')), backRange: bo.length ? r1(100 * (Math.max(...bo) - Math.min(...bo))) : null }; }
  const B = ROBE_BOUNDS, breaks = [];
  if (S.insideMax > B.inside) breaks.push(`inside: ${S.insideMax} robe points inside a leg (${S.insideFrames} of ${S.frames} frames)`);
  if (S.hemLeadMax > B.hemLead) breaks.push(`hem over the leading leg rises ${(S.hemLeadMax * 100).toFixed(1)} cm above the knee`);
  if (S.hemTrailMax > B.hemTrail) breaks.push(`hem over the trailing leg rises ${(S.hemTrailMax * 100).toFixed(1)} cm above mid-calf`);
  if (S.waistMax > B.waist) breaks.push(`the band under the waist stands off ${(S.waistMax * 100).toFixed(1)} cm`);
  if (S.slitMaxDeg < B.slitDeg) breaks.push(`the front slit never opens past ${S.slitMaxDeg.toFixed(1)} degrees`);
  return { ok: !breaks.length, breaks, summary: S, worst };
}

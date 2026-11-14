// Cultivation parts round 5 (2026-10-31-cultivation-parts-4): drag at the parts that move. The stop-and-turn test
// (walk, stop, turn 180, stop) as frames. Every garment is skinned as before; on top of the skinning, the parts that
// should trail (sleeve ends below the elbow, the skirt below the knee, the sash tails, the long hair and the braid) lag
// behind their skinned place on a damped spring stepped at a fixed 1/240 s (docs/3d-math.md rule 5), then the skirt is
// pushed off the leg capsules after each frame (rule 8, as mix.js settle). How much a point trails is its drag weight:
// 0 where the part is held (above the knee, above the elbow, at the knot, at the nape), rising to 1 at the free end.
import * as THREE from 'three';
import * as FG from './figure.js';
import * as M from './mix.js';
import { MeshBVH } from 'three-mesh-bvh';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const ramp = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export let CHAIN_ON = true; export function chains(on) { CHAIN_ON = on; }
export const SPRING = { hz: 2.2, zeta: 0.4, dt: 1 / 240 };
export const SCRIPT = { walk: 1.6, stopBy: 2.0, turnAt: 2.5, turnBy: 3.2, end: 4.4, cycle: 1.0, speed: 0.8 };

// the motion: a procedural walk whose stride dies away, then a turn on the spot
export function poseAt(F, t) {
  const S = SCRIPT, { f, l } = F.fr, dn = FG.UP.clone().negate();
  const A = 1 - ramp(S.walk, S.stopBy, t), ph = 2 * Math.PI * t / S.cycle;
  FG.resetPose(F); F.root.quaternion.identity(); F.root.updateMatrixWorld(true);
  const arm = (sg, out, fwd) => V().copy(dn).addScaledVector(l, sg * out).addScaledVector(f, fwd);
  for (const [s, sg, p0] of [['L', 1, 0], ['R', -1, Math.PI]]) {
    const sw = Math.sin(ph + p0) * A, lift = Math.max(0, Math.sin(ph + p0 - 1.3)) * A; // a short robe stride: the hem limits it
    FG.aim(F, 'shoulder' + s, 'elbow' + s, arm(sg, 0.29, 0.03 - 0.3 * sw));
    FG.aim(F, 'elbow' + s, 'wrist' + s, arm(sg, 0.16, 0.24 - 0.36 * sw));
    FG.aim(F, 'hip' + s, 'knee' + s, V().copy(dn).addScaledVector(l, sg * 0.045).addScaledVector(f, 0.28 * sw));
    FG.aim(F, 'knee' + s, 'ankle' + s, V().copy(dn).addScaledVector(l, sg * 0.03).addScaledVector(f, 0.28 * sw - 0.3 * lift));
  }
  F.root.updateMatrixWorld(true);
  // distance walked (the stride dies away with A) and the turn about the vertical
  let d = 0; const n = 200; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n * t; d += (1 - ramp(S.walk, S.stopBy, u)) * S.speed * t / n; }
  const yaw = Math.PI * ramp(S.turnAt, S.turnBy, t);
  F.root.position.copy(F.ground).addScaledVector(f, d - 0.8); F.root.quaternion.setFromAxisAngle(FG.UP, yaw); F.root.updateMatrixWorld(true);
  F.mesh.skeleton.update(); F.poseName = 'turn';
}

// drag weight per vertex, from the fit-pose positions (pt.world)
function dragWeights(X, pt) {
  const F = X.F, n = pt.world.length / 3, w = new Float32Array(n), y = i => pt.world[i * 3 + 1];
  const yKnee = (wp(F.bones.kneeL).y + wp(F.bones.kneeR).y) / 2, yNeck = wp(F.bones.neck).y, yHip = X.yHip;
  const nm = pt.name; let max = 0.1;
  if (/^(robe|innerrobe|outer)(-trim)?$/.test(nm)) for (let i = 0; i < n; i++) w[i] = ramp(yKnee + 0.03, yKnee - 0.3, y(i)), max = 0.1;
  else if (/^(robe|outer)-sleeve[LR]$/.test(nm)) { const s = nm.slice(-1), el = wp(F.bones['elbow' + s]), wr = wp(F.bones['wrist' + s]), d = wr.clone().sub(el).normalize(), p = V();
    for (let i = 0; i < n; i++) { p.fromArray(pt.world, i * 3); w[i] = 0.6 * ramp(0.04, 0.3, p.sub(el).dot(d)); } max = 0.05; } // a sleeve trails a little; more and the forearm comes through
  else if (nm === 'sash-tail') { for (let i = 0; i < n; i++) w[i] = ramp(yHip + 0.08, yHip - 0.3, y(i)); return { w, max: 0.16, hz: 1.1, zeta: 0.22 }; }
  else if (/^hair-(long|braid|tie)$/.test(nm)) { for (let i = 0; i < n; i++) w[i] = ramp(yNeck + 0.02, yNeck - 0.35, y(i)); return { w, max: 0.14, hz: 1.2, zeta: 0.25 }; }
  else return null;
  return { w, max }; // round 5 finish: the free ends (sash tails, hair) swing slower and freer than the cloth on the body, so the lag reads
}

// round 5 finish, part 2: after the springs (and the leg push on the skirt), a swinging sash tail or hair point is
// pushed back off the posed robe it hangs over: the closest point on that robe, out along its face normal to its rest
// offset (at least 6 mm, at most 1.5 cm), as `drape` does; the spring's state goes with it.
const FREE = { 'sash-tail': /^(robe|innerrobe)(-trim)?$/, 'whisk-hair': /^(robe|innerrobe)(-trim)?$/, 'hair-long': /^(robe|cape|outer)$/, 'hair-braid': /^(robe|cape|outer)$/, 'hair-tie': /^(robe|cape|outer)$/ };
const KEEPOFF = 0.015; const ONES = n => new Float32Array(n).fill(1);
function pushOff(X, st, gap = 0.006) {
  const tri = new THREE.Triangle(), nrm = V(), q = V(), q0 = V(), hit = {}, hit0 = {}, cache = new Map(); let moved = 0;
  const colOf = pt => { if (cache.has(pt)) return cache.get(pt); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(M.partWorld(pt)), 3)); g.setIndex(pt.geo.index.clone());
    const c = { g, bvh: new MeshBVH(g) }; cache.set(pt, c); return c; };
  const side = (c, p, h) => { if (!c.bvh.closestPointToPoint(p, h, 0, 0.08)) return null; const I = c.g.index.array, f = h.faceIndex * 3; tri.setFromAttributeAndIndices(c.g.attributes.position, I[f], I[f + 1], I[f + 2]); tri.getNormal(nrm); return p.clone().sub(h.point).dot(nrm); };
  for (const s of st) { const re = FREE[s.pt.name]; if (!re || !(s.d || s.ch) || !s.T1) continue; const W = s.pt.settled, T1 = s.T1, w = s.d ? s.d.w : ONES(W.length / 3);
    for (const o of X.parts.filter(x => re.test(x.name))) { const c = colOf(o);
      for (let i = 0; i < w.length; i++) { if (!w[i]) continue; q.fromArray(W, i * 3); q0.fromArray(T1, i * 3);
        const d0 = side(c, q0, hit0); if (d0 == null) continue; const g = Math.max(gap, Math.min(d0, KEEPOFF)), d = side(c, q, hit); if (d == null || d >= g) continue;
        q.copy(hit.point).addScaledVector(nrm, g); W[i * 3] = q.x; W[i * 3 + 1] = q.y; W[i * 3 + 2] = q.z; moved++;
        // the spring's own state goes where the point now is, and loses its speed into the robe, so the next frame starts
        // outside it (otherwise the lag builds up behind the robe and the tail ends inside it)
        if (s.d && w[i] > 0.05) { let vn = 0; for (let c = 0; c < 3; c++) { s.x[i * 3 + c] = T1[i * 3 + c] + (W[i * 3 + c] - T1[i * 3 + c]) / w[i]; vn += s.v[i * 3 + c] * nrm.getComponent(c); }
          if (vn < 0) for (let c = 0; c < 3; c++) s.v[i * 3 + c] -= vn * nrm.getComponent(c); } } } }
  return moved;
}

// direction C, convention 18: the sleeves, the sash tails and ribbon and the whisk's horsehair hang on bone chains. Each
// chain is N nodes down the part (a tail by height, a sleeve along the forearm from the elbow); a node's target is the
// mean of its skinned points each frame. Node 0 is held; every other node is a damped spring toward its target, then
// kept at its rest distance from the node above (so the chain swings from its root instead of stretching) and within
// max of its target. A point follows its two nearest nodes, turned with each node's segment (linear blend, like bones).
// accessories round 2 (rule 1, at most three bones): the carved tails and the whisk's lock swing on three nodes, so each
// piece turns as a whole and keeps the fold carved into it
export const CHAINS = { 'sash-tail': { n: 3, hz: 1.1, zeta: 0.22, max: 0.14 }, 'whisk-hair': { n: 3, hz: 1.3, zeta: 0.25, max: 0.1 },
  sleeve: { n: 5, hz: 1.6, zeta: 0.3, max: 0.07, from: 0.04, soft: [0.15, 0.6] } }; // soft: a sleeve's points near the elbow stay skinned (the elbow came through it)
function chainOf(X, pt) {
  const F = X.F, n = pt.world.length / 3, m = /^(robe|outer)-sleeve([LR])$/.exec(pt.name), cfg = m ? CHAINS.sleeve : CHAINS[pt.name]; if (!cfg) return null;
  const u = new Float32Array(n), p = V();
  if (m) { const el = wp(F.bones['elbow' + m[2]]), wr = wp(F.bones['wrist' + m[2]]), d = wr.clone().sub(el).normalize(); let hi = 0;
    for (let i = 0; i < n; i++) { u[i] = p.fromArray(pt.world, i * 3).sub(el).dot(d); hi = Math.max(hi, u[i]); }
    for (let i = 0; i < n; i++) u[i] = THREE.MathUtils.clamp((u[i] - cfg.from) / (hi - cfg.from), 0, 1); }
  else { let y0 = -1e9, y1 = 1e9; for (let i = 0; i < n; i++) { const y = pt.world[i * 3 + 1]; y0 = Math.max(y0, y); y1 = Math.min(y1, y); }
    for (let i = 0; i < n; i++) u[i] = (y0 - pt.world[i * 3 + 1]) / (y0 - y1 || 1); }
  const N = cfg.n, j0 = new Uint16Array(n), wj = new Float32Array(n);
  for (let i = 0; i < n; i++) { const f = u[i] * (N - 1); j0[i] = Math.min(N - 2, Math.floor(f)); wj[i] = f - j0[i]; }
  const r = cfg.soft ? Float32Array.from(u, x => ramp(cfg.soft[0], cfg.soft[1], x)) : null;
  return { cfg, N, j0, wj, r, x: null, v: null, T0: null, len: null };
}
function chainTargets(ch, W) { const N = ch.N, T = new Float32Array(N * 3), c = new Float32Array(N);
  for (let i = 0; i < ch.j0.length; i++) for (const [j, w] of [[ch.j0[i], 1 - ch.wj[i]], [ch.j0[i] + 1, ch.wj[i]]]) { if (w <= 0) continue; c[j] += w; for (let k = 0; k < 3; k++) T[j * 3 + k] += w * W[i * 3 + k]; }
  for (let j = 0; j < N; j++) for (let k = 0; k < 3; k++) T[j * 3 + k] /= c[j] || 1; return T; }
function chainStep(ch, T1, fps, dt) {
  const N = ch.N, { hz, zeta, max } = ch.cfg, w0 = 2 * Math.PI * hz, sub = Math.round(1 / fps / dt);
  if (!ch.x) { ch.x = Float32Array.from(T1); ch.v = new Float32Array(N * 3); ch.T0 = T1; ch.len = []; for (let j = 1; j < N; j++) ch.len.push(Math.hypot(T1[j * 3] - T1[j * 3 - 3], T1[j * 3 + 1] - T1[j * 3 - 2], T1[j * 3 + 2] - T1[j * 3 - 1])); }
  const x = ch.x, v = ch.v, T0 = ch.T0, a = V(), b = V(), t = V();
  for (let s = 1; s <= sub; s++) { const f = s / sub;
    for (let k = 0; k < 3; k++) x[k] = T0[k] + (T1[k] - T0[k]) * f; // the root is held
    for (let j = 1; j < N; j++) for (let k = 0; k < 3; k++) { const q = j * 3 + k, T = T0[q] + (T1[q] - T0[q]) * f, vT = (T1[q] - T0[q]) * fps;
      v[q] += (w0 * w0 * (T - x[q]) + 2 * zeta * w0 * (vT - v[q])) * dt; x[q] += v[q] * dt; }
    for (let j = 1; j < N; j++) { a.fromArray(x, j * 3 - 3); b.fromArray(x, j * 3); const d = b.clone().sub(a), L = d.length() || 1; b.copy(a).addScaledVector(d, ch.len[j - 1] / L); // the bone keeps its length
      t.set(T0[j * 3] + (T1[j * 3] - T0[j * 3]) * f, T0[j * 3 + 1] + (T1[j * 3 + 1] - T0[j * 3 + 1]) * f, T0[j * 3 + 2] + (T1[j * 3 + 2] - T0[j * 3 + 2]) * f);
      const o = b.clone().sub(t), lim = max * j / (N - 1); if (o.length() > lim) b.copy(t).addScaledVector(o.normalize(), lim);
      b.toArray(x, j * 3); } }
  ch.T0 = T1;
}
function chainSkin(ch, W) { // the points follow their nodes, each node turned from its target segment to its swung one
  const N = ch.N, T = ch.T0, x = ch.x, q = [], a = V(), b = V(), out = new Float32Array(W.length), p = V(), o = V();
  for (let j = 0; j < N; j++) { if (!j) { q.push(new THREE.Quaternion()); continue; }
    a.set(T[j * 3] - T[j * 3 - 3], T[j * 3 + 1] - T[j * 3 - 2], T[j * 3 + 2] - T[j * 3 - 1]).normalize(); b.set(x[j * 3] - x[j * 3 - 3], x[j * 3 + 1] - x[j * 3 - 2], x[j * 3 + 2] - x[j * 3 - 1]).normalize();
    q.push(new THREE.Quaternion().setFromUnitVectors(a, b)); }
  for (let i = 0; i < W.length / 3; i++) { o.set(0, 0, 0);
    for (const [j, w] of [[ch.j0[i], 1 - ch.wj[i]], [ch.j0[i] + 1, ch.wj[i]]]) { p.fromArray(W, i * 3).sub(a.fromArray(T, j * 3)).applyQuaternion(q[j]).add(b.fromArray(x, j * 3)); o.addScaledVector(p, w); }
    if (ch.r) o.lerp(p.fromArray(W, i * 3), 1 - ch.r[i]); o.toArray(out, i * 3); }
  return out;
}

function skinnedWorld(pt) { pt.settled = null; return Float32Array.from(M.partWorld(pt)); }

// run the script; drag on or off. Calls shot(t, i) after each frame is posed and the cloth is placed.
export async function run(X, { drag = true, fps = 30, frames = null, pose = poseAt, end = null, pre = null, show = null }, shot) { /* gate round 11: pose, end, pre (a part's target before the springs) and show can be passed in */
  const F = X.F, S = SCRIPT, sp = SPRING, sub = Math.round(1 / fps / sp.dt);
  if (!F.ground) F.ground = F.root.position.clone();
  const st = X.parts.map(pt => { const ch = drag && CHAIN_ON ? chainOf(X, pt) : null; return { pt, ch, d: drag && !ch && !pt.noDrag ? dragWeights(X, pt) : null }; }); /* run-jump-cloth: a part the robe lattice drives (pt.noDrag) has no per-vertex spring */
  let prev = null; const N = Math.round((end ?? S.end) * fps);
  for (let fi = 0; fi <= N; fi++) {
    const t = fi / fps; pose(F, t);
    for (const s of st) {
      let T1 = skinnedWorld(s.pt); if (pre) T1 = pre(s.pt, T1, t) || T1; let out = T1; s.T1 = T1;
      if (s.ch) { chainStep(s.ch, chainTargets(s.ch, T1), fps, sp.dt); out = chainSkin(s.ch, T1); s.chainOut = out; }
      else if (s.d) { const mx = s.d.max, w0 = 2 * Math.PI * (s.d.hz || sp.hz), zeta = s.d.zeta || sp.zeta; if (!s.x) { s.x = Float32Array.from(T1); s.v = new Float32Array(T1.length); s.T0 = T1; }
        const T0 = s.T0, x = s.x, v = s.v, n = T1.length;
        for (let k = 1; k <= sub; k++) { const u = k / sub;
          for (let j = 0; j < n; j++) { const T = T0[j] + (T1[j] - T0[j]) * u, vT = (T1[j] - T0[j]) * fps;
            const a = w0 * w0 * (T - x[j]) + 2 * zeta * w0 * (vT - v[j]); v[j] += a * sp.dt; x[j] += v[j] * sp.dt;
            const o = x[j] - T; if (o > mx) x[j] = T + mx; else if (o < -mx) x[j] = T - mx; } }
        s.T0 = T1; out = new Float32Array(n); for (let j = 0; j < n; j++) { const q = (j / 3) | 0; out[j] = T1[j] + s.d.w[q] * (x[j] - T1[j]); } }
      s.pt.settled = out; }
    M.legPush(X); if (drag) pushOff(X, st); (show || M.showSettled)(X, t);
    if (!frames || frames.includes(fi)) await shot(t, fi);
  }
  for (const s of st) s.pt.settled = null;
}

// heaven round 19: one frame of run() for a live page. The caller poses the bones; step(dt) skins each part, swings the
// chains and drag springs over dt at SPRING.dt substeps, pushes the cloth off the legs and draws it (M.showLive keeps one
// geometry per part). reset() drops the springs' state, for a jump to a new place.
export function live(X, { drag = true } = {}) {
  const sp = SPRING; let st = null;
  const reset = () => { if (st) for (const s of st) s.pt.settled = null; st = X.parts.map(pt => { const ch = drag && CHAIN_ON ? chainOf(X, pt) : null; return { pt, ch, d: drag && !ch && !pt.noDrag ? dragWeights(X, pt) : null }; }); };
  reset();
  const step = dt => {
    const fps = 1 / Math.min(Math.max(dt, 1 / 240), 1 / 15), sub = Math.max(1, Math.round(1 / fps / sp.dt));
    for (const s of st) {
      s.pt.settled = null; const T1 = skinnedWorld(s.pt); let out = T1;
      if (s.ch) { chainStep(s.ch, chainTargets(s.ch, T1), fps, sp.dt); out = chainSkin(s.ch, T1); }
      else if (s.d) { const mx = s.d.max, w0 = 2 * Math.PI * (s.d.hz || sp.hz), zeta = s.d.zeta || sp.zeta; if (!s.x) { s.x = Float32Array.from(T1); s.v = new Float32Array(T1.length); s.T0 = T1; }
        const T0 = s.T0, x = s.x, v = s.v, n = T1.length;
        for (let k = 1; k <= sub; k++) { const u = k / sub;
          for (let j = 0; j < n; j++) { const T = T0[j] + (T1[j] - T0[j]) * u, vT = (T1[j] - T0[j]) * fps;
            const a = w0 * w0 * (T - x[j]) + 2 * zeta * w0 * (vT - v[j]); v[j] += a * sp.dt; x[j] += v[j] * sp.dt;
            const o = x[j] - T; if (o > mx) x[j] = T + mx; else if (o < -mx) x[j] = T - mx; } }
        s.T0 = T1; out = new Float32Array(n); for (let j = 0; j < n; j++) { const q = (j / 3) | 0; out[j] = T1[j] + s.d.w[q] * (x[j] - T1[j]); } }
      s.pt.settled = out; }
    M.legPush(X); if (drag) pushOff(X, st); M.showLive(X);
  };
  return { step, reset };
}

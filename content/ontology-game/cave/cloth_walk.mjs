// The robe's skirt cloth (cloth.js, the game's own code) run over a walk, for garments.py: test J5 and the pictures.
//
//   node cloth_walk.mjs JOB.json OUT.json
//
// JOB (written by garments.py, Blender's space: Z up, the figure faces -Y, metres):
//   bones: [{name, parent, head: [x, y, z]}]           the rig at rest, parents first
//   robe: {rest: [x y z ...], tris: [...], sim: [0|1 per vertex], weights: [[[bone index, w], ...] per vertex]}
//   capsules: [{a, b, r}]                                 a leg capsule from bone a's joint to bone b's
//   scenarios: [{name, steps, amp, turn: {at, angle, dur} | null, stop: {at, dur} | null, samples: [t, ...]}]
//   options: cloth.js options (optional; CLOTH_OPTS, a JSON object in the environment, overrides them)
// The figure stands for STAND seconds, eases into the walk over EASE seconds and walks on; t is seconds since it set
// off. It moves forward at the speed its stride gives (cave.js: the swing is asin(step / 2 / leg)), and a turn swings
// its heading by angle radians over dur seconds, and a stop eases the walk out to standing over dur seconds. The cloth runs at 60 frames a second, as in the game.
// OUT: per scenario, per sample t: the robe's points and each bone's deform matrix (4 x 4, column-major, as Blender's
// armature uses them), in the figure's own frame (the walk's travel and turn taken out), so Blender can draw them at the
// origin; and the cloth's cost per frame.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Cloth = require('./cloth.js');
const job = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const STAND = 0.5, EASE = 0.6, FPS = 60, LEG = 0.96 - 0.085;   // character.py LEG

// ---- the walk: character.py pose(), with the stride's amplitude and the steps a second as parameters ------------
// max(0, x) and |x| with their corners rounded over -SOFT..SOFT, as character.py ramp() and sabs() (round 7)
const SOFT = 0.3;
const ramp = (x, e = SOFT) => x <= -e ? 0 : x >= e ? x : 2 * e * (((x + e) / (2 * e)) ** 3 - ((x + e) / (2 * e)) ** 4 / 2);
const sabs = (x, e = SOFT) => ramp(x, e) + ramp(-x, e);
function pose(t, A, S) {
  const ph = t * Math.PI * S, sL = Math.sin(ph), sR = Math.sin(ph + Math.PI), r = {};
  r.hipL = -A * sL; r.hipR = -A * sR;
  r.kneeL = 0.12 + 0.95 * ramp(Math.cos(ph));
  r.kneeR = 0.12 + 0.95 * ramp(Math.cos(ph + Math.PI));
  r.ankleL = -(r.hipL + r.kneeL) * 0.8; r.ankleR = -(r.hipR + r.kneeR) * 0.8;
  const B = A * 0.85;
  r.shoulderL = B * sL; r.shoulderR = B * sR;
  r.elbowL = -(0.25 + 0.35 * ramp(-sL));
  r.elbowR = -(0.25 + 0.35 * ramp(-sR));
  r.hemF = -0.9 * A * sabs(sL);                    // 0.9 min(hipL, hipR), rounded
  r.hemB = 0.9 * A * sabs(sL);                     // 0.9 max(hipL, hipR), rounded
  const rot = {};
  for (const k in r) rot[k] = [r[k], 0];
  rot.spine = [0.07, 0.14 * sL];
  rot.hips = [0, -0.1 * sL];
  return { rot, drop: LEG * (1 - Math.cos(A)) * 0.85 * sabs(sL) };
}

// 4 x 4 matrices, column-major
const I = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
const T = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const RX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
const ap = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
function inv(m) {   // a rigid motion's inverse
  const r = [m[0], m[4], m[8], 0, m[1], m[5], m[9], 0, m[2], m[6], m[10], 0, 0, 0, 0, 1];
  const t = ap(r, [m[12], m[13], m[14]]);
  r[12] = -t[0]; r[13] = -t[1]; r[14] = -t[2];
  return r;
}

// each bone's deform: its parent's, then its own turn about its joint (Blender: turn about Z after X, armature axes)
const bones = job.bones, bi = Object.fromEntries(bones.map((b, i) => [b.name, i]));
function deforms(p, ease) {
  const D = [];
  for (const b of bones) {
    const [ax, az] = p.rot[b.name] || [0, 0], h = b.head;
    let m = mul(T(...h), mul(mul(RZ(az * ease), RX(ax * ease)), T(-h[0], -h[1], -h[2])));
    if (b.name === 'hips') m = mul(T(0, 0, -p.drop * ease), m);
    D.push(b.parent ? mul(D[bi[b.parent]], m) : m);
  }
  return D;
}

const robe = job.robe, nv = robe.rest.length / 3;
const cloth = Cloth.build({ rest: Float32Array.from(robe.rest), tris: Uint32Array.from(robe.tris), sim: Float32Array.from(robe.sim), options: Object.assign({}, job.options || {}, JSON.parse(process.env.CLOTH_OPTS || '{}')) });
function skinned(D, root) {
  const out = new Float32Array(3 * cloth.P);
  const W = D.map(d => mul(root, d));
  for (let p = 0; p < cloth.P; p++) {
    const v = cloth.reps[p], x = robe.rest.slice(3 * v, 3 * v + 3);
    let o = [0, 0, 0], tw = 0;
    for (const [b, w] of robe.weights[v]) { const q = ap(W[b], x); o = [o[0] + w * q[0], o[1] + w * q[1], o[2] + w * q[2]]; tw += w; }
    tw = tw || 1;
    out[3 * p] = o[0] / tw; out[3 * p + 1] = o[1] / tw; out[3 * p + 2] = o[2] / tw;
  }
  return out;
}
function capsules(D, root) {
  return job.capsules.map(c => {
    const a = ap(mul(root, D[bi[c.a]]), bones[bi[c.a]].head), b = ap(mul(root, D[bi[c.b]]), bones[bi[c.b]].head);
    return { s: [...a, ...b], r: c.r, bs: !!c.backstop };
  });
}

// Round 8: a fold point (marked 3) must anchor to cloth on its own side of a slit. The anchor must be reachable from
// it within FOLD_REACH edges of the mesh; across a slit the two panels meet only far above, so an anchor there is
// further. Counted here (fold_far) and checked by J5 on every robe.
const FOLD_REACH = 8;
function foldFar(c) {
  const adj = Array.from({ length: c.P }, () => []);
  for (let t = 0; t < c.tris.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = c.map[c.tris[t + k]], b = c.map[c.tris[t + (k + 1) % 3]];
    if (a !== b) { adj[a].push(b); adj[b].push(a); }
  }
  let far = 0;
  for (const f of c.fol) {
    const seen = new Set([f]);
    let ring = [f], found = false;
    for (let d = 0; d < FOLD_REACH && ring.length && !found; d++) {
      const next = [];
      for (const p of ring) for (const q of adj[p]) if (!seen.has(q)) { seen.add(q); next.push(q); if (q === c.anchor[f]) found = true; }
      ring = next;
    }
    if (!found) far++;
  }
  return far;
}
const result = { scenarios: [], particles: cloth.P, free: cloth.nfree, stretch: cloth.stL.length, bend: cloth.bdL.length,
  folds: cloth.fol.length, fold_far: foldFar(cloth) };
const costs = [];
for (const sc of job.scenarios) {
  const A = sc.amp, S = sc.steps, speed = S * 2 * LEG * Math.sin(A);
  cloth.started = false;
  let pos = [0, 0], heading = 0, out = [], si = 0;
  const samples = [...sc.samples].sort((a, b) => a - b);
  // frames at 60 a second, with a step ending exactly on each sample's time too
  let time = -STAND - EASE, prev = time, f = 0;
  for (;;) {
    const nextFrame = (f + 1) / FPS - STAND - EASE, nextSample = si < samples.length ? samples[si] : Infinity;
    const first = f === 0 && prev === time && !cloth.started;
    if (!first) {
      time = Math.min(nextFrame, nextSample);
      if (time >= nextFrame - 1e-9) f++;
    }
    const dt = time - prev;
    prev = time;
    let ease = Math.max(0, Math.min(1, (time + EASE) / EASE));
    if (sc.stop && time > sc.stop.at) ease = Math.min(ease, Math.max(0, 1 - (time - sc.stop.at) / sc.stop.dur));   // comes to a halt
    const e = ease * ease * (3 - 2 * ease);
    const tw = Math.max(0, time);                            // the walk's own clock
    if (sc.turn && time > sc.turn.at) heading = sc.turn.angle * Math.min(1, (time - sc.turn.at) / sc.turn.dur);
    pos[0] += Math.sin(heading) * speed * e * dt; pos[1] -= Math.cos(heading) * speed * e * dt;
    const root = mul(T(pos[0], pos[1], 0), RZ(heading));
    const D = deforms(pose(tw, A, S), e);
    const t0 = performance.now();
    Cloth.step(cloth, dt, skinned(D, root), capsules(D, root));
    if (f > 10 && Math.abs(dt - 1 / FPS) < 1e-9) costs.push(performance.now() - t0);
    while (si < samples.length && time >= samples[si] - 1e-9) {
      const back = inv(root), x = Cloth.positions(cloth, false), pts = new Array(3 * nv);
      for (let v = 0; v < nv; v++) { const q = ap(back, [x[3 * v], x[3 * v + 1], x[3 * v + 2]]); pts[3 * v] = +q[0].toFixed(5); pts[3 * v + 1] = +q[1].toFixed(5); pts[3 * v + 2] = +q[2].toFixed(5); }
      out.push({ t: samples[si], robe: pts, deform: Object.fromEntries(bones.map((b, i) => [b.name, D[i]])), heading });
      si++;
    }
    if (si >= samples.length) break;
  }
  result.scenarios.push({ name: sc.name, speed, samples: out });
}
costs.sort((a, b) => a - b);
result.step_ms = { median: costs[costs.length >> 1], p95: costs[Math.floor(costs.length * 0.95)] };
writeFileSync(process.argv[3], JSON.stringify(result));
console.log(JSON.stringify({ particles: cloth.P, free: cloth.nfree, folds: result.folds, fold_far: result.fold_far, step_ms: result.step_ms }));

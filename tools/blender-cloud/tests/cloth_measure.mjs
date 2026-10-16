// The skirt cloth's measures (CLOTH.md): float, back hem rise, standing hang, bulge under the belt and belt jitter, for
// one robe over a stand, a normal walk and a fast walk. A copy of cloth_walk.mjs's walk and skinning, so it runs the
// same cloth on the same robe job, about two seconds a run.
//   node cloth_measure.mjs $W/cloth-jobs/robe-job.json            (garments.py writes the job; OPTS='{"blend":0}' tries options)
// Prints one JSON line: per run, float_mm (hem points with no leg within 5 cm, height above standing: mean, p90),
// hem_rise_mm, back_hem_rise_p95 (mm), end_hem_dev_mm, tails_bulge_mm (front cloth under the belt from its skinned
// place: p90, p99) and belt_jitter_mm (second difference of the belt row's places, free and pinned).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Cloth = require(process.env.CLOTH || new URL("../../../content/ontology-game/cave/cloth.js", import.meta.url).pathname);
const job = JSON.parse(readFileSync(process.argv[2], 'utf8'));
job.options = JSON.parse(process.env.OPTS || '{}');
const STAND = 0.5, EASE = 0.6, FPS = +(process.env.FPS || 60), LEG = 0.96 - 0.085;
// ---- the walk: character.py pose(), with the stride's amplitude and the steps a second as parameters ------------
function pose(t, A, S) {
  const ph = t * Math.PI * S, sL = Math.sin(ph), sR = Math.sin(ph + Math.PI), r = {};
  r.hipL = -A * sL; r.hipR = -A * sR;
  r.kneeL = 0.12 + 0.95 * Math.max(0, Math.cos(ph));
  r.kneeR = 0.12 + 0.95 * Math.max(0, Math.cos(ph + Math.PI));
  r.ankleL = -(r.hipL + r.kneeL) * 0.8; r.ankleR = -(r.hipR + r.kneeR) * 0.8;
  const B = A * 0.85;
  r.shoulderL = B * sL; r.shoulderR = B * sR;
  r.elbowL = -(0.25 + 0.35 * Math.max(0, -sL));
  r.elbowR = -(0.25 + 0.35 * Math.max(0, -sR));
  r.hemF = 0.9 * Math.min(r.hipL, r.hipR);
  r.hemB = 0.9 * Math.max(r.hipL, r.hipR);
  const rot = {};
  for (const k in r) rot[k] = [r[k], 0];
  rot.spine = [0.07, 0.14 * sL];
  rot.hips = [0, -0.1 * sL];
  return { rot, drop: LEG * (1 - Math.cos(A)) * 0.85 * Math.abs(sL) };
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
const cloth = Cloth.build({ rest: Float32Array.from(robe.rest), tris: Uint32Array.from(robe.tris), sim: Float32Array.from(robe.sim), options: JSON.parse(process.env.OPTS || '{}') });
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

const sim = robe.sim, rz = i => robe.rest[3 * i + 2];
const hem = [], ring = [], isFree = [], upper = [];
for (let v = 0; v < nv; v++) { if (sim[v] === 2) hem.push(v); if (sim[v] === 0 && rz(v) > 0.93 && rz(v) < 1.09) ring.push(v); if (sim[v] === 1 && rz(v) > 0.90) ring.push(v); if (sim[v] === 1 && rz(v) > 0.80 && robe.rest[3*v+1] < 0) upper.push(v); }
function run(A, S, secs, jitterFrom, still) {
  cloth.started = false;
  let bulge = [], pos = [0, 0], time = -STAND - EASE, hist = [], kick = [], lift = [], jit = [], tj = [], back = [];
  const speed = S * 2 * LEG * Math.sin(A);
  const restHem = hem.map(v => robe.rest.slice(3 * v, 3 * v + 3));
  while (time < secs) {
    const dt = 1 / FPS; time += dt;
    let ease = Math.max(0, Math.min(1, (time + EASE) / EASE)); if (still) ease = 0; const e = ease * ease * (3 - 2 * ease);
    pos[1] -= speed * e * dt;
    const root = T(pos[0], pos[1], 0), D = deforms(pose(Math.max(0, time), A, S), e);
    const tg = skinned(D, root);
    Cloth.step(cloth, dt, tg, capsules(D, root));
    const x = Cloth.positions(cloth, false), bk = inv(root);
    const loc = v => ap(bk, [x[3 * v], x[3 * v + 1], x[3 * v + 2]]);
    if (time > 1.0) {
      const CP = capsules(D, root);
      hem.forEach((v, k) => { const q = loc(v); kick.push(q[2] - restHem[k][2]);
        const p = [x[3*v], x[3*v+1], x[3*v+2]];
        let near = false;
        for (const cp of CP) { const s = cp.s, u = [s[3]-s[0], s[4]-s[1], s[5]-s[2]], uu = u[0]*u[0]+u[1]*u[1]+u[2]*u[2] || 1e-12;
          let t = ((p[0]-s[0])*u[0]+(p[1]-s[1])*u[1]+(p[2]-s[2])*u[2])/uu; t = Math.max(0, Math.min(1, t));
          if (Math.hypot(p[0]-s[0]-u[0]*t, p[1]-s[1]-u[1]*t, p[2]-s[2]-u[2]*t) < cp.r + 0.05) near = true; }
        if (!near) lift.push(q[2] - restHem[k][2]); if (restHem[k][1] > 0.02) back.push(q[2] - restHem[k][2]); });
    }
    for (const v of upper) { const p = 3 * cloth.map[v]; bulge.push(Math.hypot(x[p]-tg[p], x[p+1]-tg[p+1], x[p+2]-tg[p+2])); }
    const R = ring.map(v => loc(v)), TG = ring.map(v => { const p = 3 * cloth.map[v]; return ap(bk, [tg[p], tg[p + 1], tg[p + 2]]); });
    hist.push([R, TG]);
    if (hist.length > 3) hist.shift();
    if (time > jitterFrom && hist.length === 3) {
      for (let k = 0; k < ring.length; k++) {
        let a = 0, b = 0;
        for (let c = 0; c < 3; c++) { a += (hist[2][0][k][c] - 2 * hist[1][0][k][c] + hist[0][0][k][c]) ** 2; b += (hist[2][1][k][c] - 2 * hist[1][1][k][c] + hist[0][1][k][c]) ** 2; }
        if (sim[ring[k]] === 1) jit.push(Math.sqrt(a)); else tj.push(Math.sqrt(a));
      }
    }
  }
  const x = Cloth.positions(cloth, false), bk = inv(T(pos[0], pos[1], 0));
  const dev = hem.map((v, k) => { const q = ap(bk, [x[3 * v], x[3 * v + 1], x[3 * v + 2]]); return [q[0] - restHem[k][0], q[1] - restHem[k][1], q[2] - restHem[k][2]]; });
  const pc = (a, p) => { const s = [...a].sort((m, n) => m - n); return s.length ? +(1000 * s[Math.min(s.length - 1, Math.floor(p * s.length))]).toFixed(1) : null; };
  const mean = a => a.length ? +(1000 * a.reduce((m, n) => m + n, 0) / a.length).toFixed(1) : null;
  return { tails_bulge_mm: { p90: pc(bulge, 0.9), p99: pc(bulge, 0.99) }, float_mm: { mean: mean(lift), p90: pc(lift, 0.9), n: lift.length }, hem_rise_mm: { mean: mean(kick), p95: pc(kick, 0.95), max: pc(kick, 0.999) }, back_hem_rise_p95: pc(back, 0.95),
    end_hem_dev_mm: { horiz: mean(dev.map(d => Math.hypot(d[0], d[1]))), z: mean(dev.map(d => d[2])) },
    belt_jitter_mm: { p50: pc(jit, 0.5), p99: pc(jit, 0.99), max: pc(jit, 1), pinned_p99: pc(tj, 0.99), pinned_max: pc(tj, 1) } };
}
const out = { stand: run(0.4, 2, 4, 1.5, true), walk: run(0.4, 2, 5, 1.0), fast: run(0.62, 2.5, 5, 1.0) };
console.log(JSON.stringify(out));

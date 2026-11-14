/* The mirror figure in node, for the robe tools (tools/figure-cover.mjs, tools/figure-legs-probe.mjs): the same wardrobe.js,
   figure-robe.js and stance.js the page runs, on the same .glb files, posed on the CPU, plus a ray caster (a small BVH).
   three.js is not a bars-engine dependency, so the tools take it from THREE_DIR (a three@0.160.0 package folder) or from
   NODE_PATH, and map the page's import names ("three", "three/addons/...") onto it:
     npm i --no-save --prefix /tmp/t three@0.160.0 && THREE_DIR=/tmp/t/node_modules/three node tools/figure-legs-probe.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

const HERE = path.dirname(new URL(import.meta.url).pathname), PUB = path.join(HERE, '..', 'public');
const THREE_DIR = process.env.THREE_DIR || (process.env.NODE_PATH || '').split(path.delimiter).map(d => path.join(d, 'three')).find(d => fs.existsSync(path.join(d, 'package.json')))
  || path.join(HERE, '..', 'node_modules', 'three');
if (!fs.existsSync(path.join(THREE_DIR, 'build', 'three.module.js'))) { console.error(`three.js not found (THREE_DIR=${THREE_DIR}); see the header of tools/figure-rig.mjs`); process.exit(2); }
const base = pathToFileURL(THREE_DIR).href;
register('data:text/javascript,' + encodeURIComponent(`const B = ${JSON.stringify(base)};
export async function resolve(s, c, next) {
  if (s === 'three') return { url: B + '/build/three.module.js', shortCircuit: true };
  if (s.startsWith('three/addons/')) return { url: B + '/examples/jsm/' + s.slice(13), shortCircuit: true };
  if (s.startsWith('three/examples/')) return { url: B + '/' + s.slice(6), shortCircuit: true };
  return next(s, c); }`), import.meta.url);

export const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { clone } = await import('three/addons/utils/SkeletonUtils.js');
const { dressFigure } = await import(pathToFileURL(path.join(PUB, 'between/wardrobe.js')).href);
export const { CUT, hemOf } = await import(pathToFileURL(path.join(PUB, 'between/figure-robe.js')).href);
const { SIT, SIT_DROP } = await import(pathToFileURL(path.join(PUB, 'between/stance.js')).href);
export const DUSK = path.join(PUB, 'between/m/dusk');

const glb = f => { const b = fs.readFileSync(f); return new Promise((ok, no) => new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', ok, no)); };
export async function parts({ cover = true } = {}) {
  const P = {}; for (const n of ['average-dusk', 'robe', 'sash']) P[n === 'average-dusk' ? 'dusk' : n] = await glb(path.join(DUSK, n + '.glb'));
  const cf = path.join(DUSK, 'robe-cover.json'); P.cover = cover && fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : null;
  return P;
}
export const BUILDS = ['slender', 'average', 'broad', 'round'], CUTS = ['jacket', 'dress', 'coat'];
export const look = (build, outfit, shape = 'a') => ({ shape, build, skin: 'olive', style: 'afro', colour: 'black', outfit, dye: 'saffron' });

/* One dressed figure and its poses. walk/idle: the clip from time 0, played on at 60 fps (the skirt spring runs, as on the page),
   calling at(t) every `every` frames; sit(w): the code-made sit at share w over the bind pose (garden.js makeBody). */
export function figure(P) {
  const obj = clone(P.dusk.scene), w = dressFigure(obj, P), mixer = new THREE.AnimationMixer(obj);
  const acts = Object.fromEntries(['Walk', 'Idle'].map(n => [n, mixer.clipAction(P.dusk.animations.find(a => a.name === n))]));
  const bones = {}; obj.traverse(o => { if (o.isBone) bones[o.name] = { b: o, q: o.quaternion.clone(), p: o.position.clone() }; });
  const qe = new THREE.Quaternion(), eu = new THREE.Euler();
  const weights = (wk, id) => { for (const [n, a] of Object.entries(acts)) { a.play(); a.setEffectiveWeight(n === 'Walk' ? wk : id); } };
  return {
    obj, w, bones, duration: n => acts[n].getClip().duration,
    play(name, seconds, every, at) {
      mixer.stopAllAction(); weights(+(name === 'Walk'), +(name === 'Idle')); mixer.setTime(0); bones.hips.b.position.y = bones.hips.p.y;
      w.dress(); const dt = 1 / 60;
      for (let f = 0, n = Math.round(seconds / dt); f <= n; f++) { if (f) { mixer.update(dt); w.dress(dt); } if (f % every === 0) { obj.updateMatrixWorld(true); at(f * dt); } }
    },
    sit(s) {
      mixer.stopAllAction(); weights(0, 0); mixer.update(0);
      for (const B of Object.values(bones)) B.b.quaternion.copy(B.q);
      for (const [n, x, y, z] of SIT) { const B = bones[n]; if (B) B.b.quaternion.copy(B.q).multiply(qe.setFromEuler(eu.set(x * s, y * s, z * s, 'XYZ'))); }
      bones.hips.b.position.y = bones.hips.p.y - SIT_DROP * s; w.dress(); obj.updateMatrixWorld(true);
    },
  };
}

// a skinned mesh's points as posed now, in the figure's space (flat), and its triangles' points (9 per triangle) for an index
const v = new THREE.Vector3();
export function posed(m, out = new Float32Array(m.geometry.attributes.position.count * 3)) {
  const Pp = m.geometry.attributes.position;
  for (let i = 0; i < Pp.count; i++) { v.fromBufferAttribute(Pp, i); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
  return out;
}
// area-weighted point normals of posed points
export function normals(pos, index) {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < index.length; t += 3) { const a = index[t] * 3, b = index[t + 1] * 3, c = index[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; } }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

/* A BVH over triangles (pos flat, index), and every hit along a ray: hits(o, d, tmax, f) calls f(t, tri, u, v) for each
   triangle the ray crosses at 0 < t < tmax (d need not be unit; t is in d's units). */
export function bvh(pos, index) {
  const T = index.length / 3, ids = Int32Array.from({ length: T }, (_, i) => i), c = new Float32Array(T * 3), lo = [], hi = [], kids = [], span = [];
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) c[t * 3 + k] = (pos[index[t * 3] * 3 + k] + pos[index[t * 3 + 1] * 3 + k] + pos[index[t * 3 + 2] * 3 + k]) / 3;
  function build(a, b) {
    const n = lo.length, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], cm = [Infinity, Infinity, Infinity], cx = [-Infinity, -Infinity, -Infinity];
    for (let i = a; i < b; i++) { const t = ids[i]; for (let q = 0; q < 3; q++) for (let k = 0; k < 3; k++) { const p = pos[index[t * 3 + q] * 3 + k]; if (p < mn[k]) mn[k] = p; if (p > mx[k]) mx[k] = p; }
      for (let k = 0; k < 3; k++) { cm[k] = Math.min(cm[k], c[t * 3 + k]); cx[k] = Math.max(cx[k], c[t * 3 + k]); } }
    lo.push(mn); hi.push(mx); kids.push(null); span.push([a, b]);
    if (b - a <= 4) return n;
    const ax = [0, 1, 2].sort((p, q) => (cx[q] - cm[q]) - (cx[p] - cm[p]))[0], mid = (cm[ax] + cx[ax]) / 2;
    let i = a, j = b - 1; while (i <= j) { if (c[ids[i] * 3 + ax] < mid) i++; else { const s = ids[i]; ids[i] = ids[j]; ids[j] = s; j--; } }
    if (i === a || i === b) i = (a + b) >> 1;
    kids[n] = [build(a, i), build(i, b)]; return n;
  }
  build(0, T);
  const P = (t, q, k) => pos[index[t * 3 + q] * 3 + k];
  function hits(o, d, tmax, f) {
    const inv = [1 / d[0], 1 / d[1], 1 / d[2]], st = [0];
    while (st.length) { const n = st.pop(); let t0 = 0, t1 = tmax;
      for (let k = 0; k < 3; k++) { let a = (lo[n][k] - o[k]) * inv[k], b = (hi[n][k] - o[k]) * inv[k]; if (a > b) { const s = a; a = b; b = s; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
      if (t0 > t1) continue;
      if (kids[n]) { st.push(kids[n][0], kids[n][1]); continue; }
      for (let i = span[n][0]; i < span[n][1]; i++) { const t = ids[i];   // Moller-Trumbore
        const e1 = [P(t, 1, 0) - P(t, 0, 0), P(t, 1, 1) - P(t, 0, 1), P(t, 1, 2) - P(t, 0, 2)], e2 = [P(t, 2, 0) - P(t, 0, 0), P(t, 2, 1) - P(t, 0, 1), P(t, 2, 2) - P(t, 0, 2)];
        const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
        if (Math.abs(det) < 1e-12) continue;
        const s = [o[0] - P(t, 0, 0), o[1] - P(t, 0, 1), o[2] - P(t, 0, 2)], u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det; if (u < 0 || u > 1) continue;
        const qv = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]], vv = (d[0] * qv[0] + d[1] * qv[1] + d[2] * qv[2]) / det; if (vv < 0 || u + vv > 1) continue;
        const tt = (e2[0] * qv[0] + e2[1] * qv[1] + e2[2] * qv[2]) / det; if (tt > 0 && tt < tmax) f(tt, t, u, vv); } }
  }
  return { hits };
}

// the directions a point looks out along: its normal, and rings tilted 35 and 65 degrees off it (9 rays)
export function looks(n) {
  const a = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], t = [n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]], l = Math.hypot(...t);
  const T = t.map(x => x / l), Bv = [n[1] * T[2] - n[2] * T[1], n[2] * T[0] - n[0] * T[2], n[0] * T[1] - n[1] * T[0]], out = [n];
  for (const [tilt, off] of [[35, 0], [65, 45]]) for (let k = 0; k < 4; k++) { const ph = (k * 90 + off) * Math.PI / 180, s = Math.sin(tilt * Math.PI / 180), c = Math.cos(tilt * Math.PI / 180);
    out.push([0, 1, 2].map(i => n[i] * c + (T[i] * Math.cos(ph) + Bv[i] * Math.sin(ph)) * s)); }
  return out;
}
// the floor stops a ray too (no eye looks up from under it): the distance along d to the floor at y = 0, or Infinity
export const toFloor = (o, d) => d[1] < 0 ? -o[1] / d[1] : Infinity;
// the poses both tools sample, as [name, run(f, at)]: the walk and the idle over a loop each, the sit eased half in and full
export const POSES = (every = { Walk: 6, Idle: 20 }) => [
  ['walk', (f, at) => f.play('Walk', f.duration('Walk') * 2, every.Walk, t => t >= f.duration('Walk') && at(t))],
  ['idle', (f, at) => f.play('Idle', f.duration('Idle'), every.Idle, at)],
  ['sit', (f, at) => { for (const s of [0.5, 1]) { f.sit(s); at(s); } }],
];

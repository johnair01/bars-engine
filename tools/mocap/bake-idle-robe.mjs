// The robe over the standing idle (six-faces-council relationship-creature, mirror light and standing idle build).
// The walk's robe (robe-baked.glb) is the J5 robe's cloth simulated over the Walk. The J5 robe with its cloth weights is
// not in this repo (garments.py on the J5 draft PRs makes it), and an idle hardly moves the cloth, so the idle robe is the
// walk bake's own first frame skinned to the body (docs/3d-math.md rule 8: a long garment follows the legs; the leg and
// arm capsules in figure-robe.js still push it off at runtime). Same mesh, same point order as robe-baked.glb, so the
// figure can crossfade from one to the other with no pop:
//   v_idle(t) = sum_j w_j M_j(Idle, t) M_j(Walk, 0)^-1 v_base
// with each point's weights the inverse-distance blend of the four nearest points of the skinned robe.glb posed at Walk 0.
// Written as robe-baked.glb is: a plain mesh with one morph target per frame and an "Idle" weights animation.
//   NODE_PATH=<dir with three@0.160 in node_modules> node tools/mocap/bake-idle-robe.mjs [FPS=12]
//   (DIR=public/between/m/dusk; reads average-dusk.glb, robe.glb, robe-baked.glb; writes robe-baked-idle.glb)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const THREE = require('three');
const { GLTFLoader } = await import(pathToFileURL(require.resolve('three/examples/jsm/loaders/GLTFLoader.js')).href);
const DIR = process.env.DIR || 'public/between/m/dusk', FPS = +(process.env.FPS || 12);
const parse = f => { const b = readFileSync(f); return new Promise((res, rej) => new GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', res, rej)); };
const [fig, robe, baked] = await Promise.all(['average-dusk', 'robe', 'robe-baked'].map(n => parse(`${DIR}/${n}.glb`)));
const walk = fig.animations.find(a => a.name === 'Walk'), idle = fig.animations.find(a => a.name === 'Idle');
if (!idle) throw new Error('average-dusk.glb has no Idle (tools/mocap/retarget_idle.py adds it)');
const bones = {}; fig.scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
let sm = null; robe.scene.traverse(o => { if (o.isSkinnedMesh && !sm) sm = o; });
sm.bind(new THREE.Skeleton(sm.skeleton.bones.map(b => bones[b.name]), sm.skeleton.boneInverses), sm.bindMatrix);
fig.scene.add(sm);
let bm = null; baked.scene.traverse(o => { if (o.isMesh && !bm) bm = o; });
const base = bm.geometry.attributes.position, n = base.count, NB = sm.skeleton.bones.length;
const mixer = new THREE.AnimationMixer(fig.scene);
const at = (clip, t) => { mixer.stopAllAction(); const a = mixer.clipAction(clip); a.play(); mixer.setTime(t); fig.scene.updateMatrixWorld(true); sm.skeleton.update(); };
// bone matrices (root space; the figure's root is the identity) at Walk 0
at(walk, 0);
const M0 = sm.skeleton.bones.map(b => b.matrixWorld.clone());
const SP = sm.geometry.attributes.position, J = sm.geometry.attributes.skinIndex, W = sm.geometry.attributes.skinWeight, v = new THREE.Vector3();
const sp = []; for (let i = 0; i < SP.count; i++) { v.fromBufferAttribute(SP, i); sm.applyBoneTransform(i, v); sp.push(v.clone()); }
// each baked point's weights: from its four nearest skinned points where the skinned robe is close (within NEAR), and
// otherwise carried along the baked mesh's own edges from the points that are (the cloth hem bands hang away from the
// skinned robe, and a hanging cuff's nearest skinned point can be a thigh: along the mesh it is still the sleeve's)
const NEAR = +(process.env.NEAR || 0.02);
const wts = new Float32Array(n * NB), sure = new Uint8Array(n), dist = new Float32Array(n);
for (let i = 0; i < n; i++) {
  v.fromBufferAttribute(base, i); const near = sp.map((p, j) => [p.distanceToSquared(v), j]).sort((a, b) => a[0] - b[0]).slice(0, 4);
  dist[i] = Math.sqrt(near[0][0]); sure[i] = dist[i] < NEAR ? 1 : 0;
  let tot = 0; for (const [d, j] of near) { const k = 1 / (Math.sqrt(d) + 1e-3); tot += k; for (let q = 0; q < 4; q++) wts[i * NB + J.getComponent(j, q)] += k * W.getComponent(j, q); }
  for (let b = 0; b < NB; b++) wts[i * NB + b] /= tot;
}
const nbr = Array.from({ length: n }, () => new Set()), ix = bm.geometry.index.array;
for (let t = 0; t < ix.length; t += 3) for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) if (a !== c) nbr[ix[t + a]].add(ix[t + c]);
// points at the same place (seams) are neighbours too
const key = i => `${base.getX(i).toFixed(4)},${base.getY(i).toFixed(4)},${base.getZ(i).toFixed(4)}`, same = new Map();
for (let i = 0; i < n; i++) { const k = key(i); if (same.has(k)) { nbr[i].add(same.get(k)); nbr[same.get(k)].add(i); } else same.set(k, i); }
let unsure = 0; for (let i = 0; i < n; i++) if (!sure[i]) unsure++;
for (let it = 0; it < 200; it++) {   // Jacobi: each unsure point takes its neighbours' mean, the sure ones hold
  const nw = wts.slice();
  for (let i = 0; i < n; i++) { if (sure[i] || !nbr[i].size) continue; nw.fill(0, i * NB, i * NB + NB);
    for (const j of nbr[i]) for (let b = 0; b < NB; b++) nw[i * NB + b] += wts[j * NB + b] / nbr[i].size; }
  wts.set(nw);
}
const far = Math.max(...Array.from(dist).filter((_, i) => sure[i]));
{ let dx = 0, dy = 0, dz = 0, c = 0; for (let i = 0; i < n; i++) { v.fromBufferAttribute(base, i); let bd = 1e9, bj = 0; sp.forEach((p, j) => { const d = p.distanceToSquared(v); if (d < bd) { bd = d; bj = j; } }); dx += v.x - sp[bj].x; dy += v.y - sp[bj].y; dz += v.z - sp[bj].z; c++; } console.error("mean offset baked - skinned (mm)", (1000 * dx / c).toFixed(1), (1000 * dy / c).toFixed(1), (1000 * dz / c).toFixed(1)); const bb = new THREE.Box3().setFromBufferAttribute(base), sb = new THREE.Box3().setFromPoints(sp); console.error("baked box", bb.min.toArray().map(x => x.toFixed(3)), bb.max.toArray().map(x => x.toFixed(3)), "skinned box", sb.min.toArray().map(x => x.toFixed(3)), sb.max.toArray().map(x => x.toFixed(3))); }
console.error(`weights: ${n - unsure} points from the skinned robe (within ${NEAR * 1000} mm), ${unsure} carried along the mesh; median gap ${(1000 * [...dist].sort((a, b) => a - b)[n >> 1]).toFixed(1)} mm`);
const N = Math.round(idle.duration * FPS), frames = [], normals = [], m = new THREE.Matrix4(), acc = new THREE.Matrix4(), nm = new THREE.Matrix3();
const bn = bm.geometry.attributes.normal;
for (let k = 0; k < N; k++) {
  at(idle, k / FPS);
  const D = sm.skeleton.bones.map((b, j) => b.matrixWorld.clone().multiply(M0[j].clone().invert()));
  const f = new Float32Array(n * 3), fn = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    acc.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let b = 0; b < NB; b++) { const w = wts[i * NB + b]; if (w > 1e-5) { m.copy(D[b]); for (let e = 0; e < 16; e++) acc.elements[e] += m.elements[e] * w; } }
    v.fromBufferAttribute(base, i).applyMatrix4(acc); f.set([v.x, v.y, v.z], i * 3);
    v.fromBufferAttribute(bn, i).applyMatrix3(nm.getNormalMatrix(acc)).normalize(); fn.set([v.x, v.y, v.z], i * 3);
  }
  frames.push(f); normals.push(fn);
}
// the seam: the clip's last key equals its first, so frame N would equal frame 0
let move = 0; for (let k = 1; k < N; k++) for (let i = 0; i < n * 3; i += 3) move = Math.max(move, Math.hypot(frames[k][i] - frames[0][i], frames[k][i + 1] - frames[0][i + 1], frames[k][i + 2] - frames[0][i + 2]));
// ---- GLB by hand, as bake.mjs writes robe-baked.glb (the base is the walk bake's base, so both share one rest shape)
const chunks = [], views = [], accs = []; let off = 0;
const add = (arr, target) => { const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - b.length % 4) % 4; chunks.push(b, Buffer.alloc(pad)); views.push({ buffer: 0, byteOffset: off, byteLength: b.length, ...(target ? { target } : {}) }); off += b.length + pad; return views.length - 1; };
const mm = a => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < a.length; i += 3) for (let j = 0; j < 3; j++) { mn[j] = Math.min(mn[j], a[i + j]); mx[j] = Math.max(mx[j], a[i + j]); } return { min: mn, max: mx }; };
const A = (arr, type, ct, extra = {}, target) => { accs.push({ bufferView: add(arr, target), componentType: ct, count: type === 'SCALAR' ? arr.length : arr.length / ({ VEC3: 3, VEC4: 4 }[type]), type, ...extra }); return accs.length - 1; };
const b0 = Float32Array.from(base.array), n0 = Float32Array.from(bn.array), col = bm.geometry.attributes.color;
const attrs = { POSITION: A(b0, 'VEC3', 5126, mm(b0), 34962), NORMAL: A(n0, 'VEC3', 5126, {}, 34962) };
if (col) attrs.COLOR_0 = A(Float32Array.from(col.array), col.itemSize === 4 ? 'VEC4' : 'VEC3', 5126, {}, 34962);
const indices = A(Uint32Array.from(bm.geometry.index.array), 'SCALAR', 5125, {}, 34963);
const targets = frames.map((f, k) => { const d = new Float32Array(f.length), dn = new Float32Array(f.length); for (let i = 0; i < f.length; i++) { d[i] = f[i] - b0[i]; dn[i] = normals[k][i] - n0[i]; } return { POSITION: A(d, 'VEC3', 5126, mm(d), 34962), NORMAL: A(dn, 'VEC3', 5126, {}, 34962) }; });
const T = new Float32Array(N + 1), Wt = new Float32Array((N + 1) * N);
for (let k = 0; k <= N; k++) { T[k] = k / FPS; Wt[k * N + (k % N)] = 1; }
const tAcc = A(T, 'SCALAR', 5126, { min: [0], max: [N / FPS] }), wAcc = A(Wt, 'SCALAR', 5126);
const json = { asset: { version: '2.0', generator: 'bars-engine tools/mocap/bake-idle-robe.mjs' }, scene: 0, scenes: [{ nodes: [0] }],
  nodes: [{ name: 'robe-baked-idle', mesh: 0 }],
  meshes: [{ name: 'robe-baked-idle', weights: Array.from({ length: N }, (_, k) => +(k === 0)), primitives: [{ attributes: attrs, indices, material: 0, targets }] }],
  materials: [{ name: 'robe', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.9 }, doubleSided: true }],
  animations: [{ name: 'Idle', samplers: [{ input: tAcc, output: wAcc, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'weights' } }] }],
  accessors: accs, bufferViews: views, buffers: [{ byteLength: off }],
  extras: { baked: { clip: 'Idle', frames: N, fps: FPS, method: 'walk bake frame 0 skinned to the idle', weight_transfer_far_mm: +(1000 * far).toFixed(1), max_travel_mm: +(1000 * move).toFixed(1) } } };
const bin = Buffer.concat(chunks); let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
const ch = (b, t) => { const h = Buffer.alloc(8); h.writeUInt32LE(b.length, 0); h.writeUInt32LE(t, 4); return Buffer.concat([h, b]); };
const OUT = `${DIR}/robe-baked-idle.glb`;
writeFileSync(OUT, Buffer.concat([head, ch(js, 0x4E4F534A), ch(bin, 0x004E4942)]));
console.log(JSON.stringify({ out: OUT, frames: N, verts: n, weight_transfer_far_mm: +(1000 * far).toFixed(1), max_travel_mm: +(1000 * move).toFixed(1), bytes: 12 + 16 + js.length + bin.length }));

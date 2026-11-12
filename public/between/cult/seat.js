// Brush in hand, round 4 (2026-11-07, his A on ee2-brush-cult-look-3: "This pose, now seated at the hearth").
// The round 3 arm, grip and beats, with the figure sat cross-legged on the hearth's worn cushion in the Nook, a low
// writing board between the figure and the fire. Three pieces live here:
//   crossLegs  the legs crossed under the lap (the game's own sit is cross-legged, garden.js SIT; the clothing kit's
//              authored poseCross numbers, 2026-10-25 r0g4 kit.js), the pelvis upright for the meditative seat his
//              al-look-2 note asked for ("a more upright meditative posture").
//   drape      the seated corrective shape for the skirts (ck-sit-own-state: sitting is its own garment state). The
//              shells were cut standing and the skirt is rigid to the pelvis (his ruling 2026-11-02), so the thighs
//              would come out through it. Each skirt point keeps its column (its angle round the waist) and its length
//              down the cloth from the hip line; the column is laid down a spoke that rests a margin over the crossed
//              legs, the cushion and the floor, spans the gap between the knees and lands on the floor (the clothing
//              kit's Lap height field, here moving the shell's own points, so its paint, bands and hem stay its own).
//   setHearth  the Nook's hearth (bars-engine public/between/hollow.js, the nook's 0.85 scale, its seat 1.55 m out), the
//              worn cushion (MAT_TOP 0.155), the room's light (the hemisphere, the window's dusk and the fire).
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { aim } from './figure.js';
import { partWorld } from './mix.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
export const MAT_TOP = 0.155, SEAT_PAD = 0.1, HEARTH_D = 1.55, NOOK = 0.85;

// the legs crossed: thighs out and forward and a little down, shins folded across in front, the left over the right
export function crossLegs(F, o = {}) {
  const { f, l } = F.fr, up = V(0, 1, 0);
  for (const [s, side] of [['L', 1], ['R', -1]]) { const top = s === 'L';
    aim(F, 'hip' + s, 'knee' + s, V().addScaledVector(l, (o.sx ?? 0.74) * side).addScaledVector(up, o.thigh ?? -0.24).addScaledVector(f, o.sz ?? 0.66));
    aim(F, 'knee' + s, 'ankle' + s, V().addScaledVector(l, -0.95 * side).addScaledVector(up, top ? (o.top ?? -0.05) : (o.bot ?? -0.2)).addScaledVector(f, top ? -0.12 : -0.28));
    aim(F, 'ankle' + s, 'ball' + s, V().addScaledVector(l, -0.55 * side).addScaledVector(f, 0.45).addScaledVector(up, -0.35)); }
  F.root.updateMatrixWorld(true);
}

// round 5 (his C on ee2-brush-cult-look-4: kneel). Seiza: the thighs forward and down to the knees (the hip joint
// about 0.20 k over the knee joint, the knees about 0.11 k apart), the shins straight back and flat on the cushion, the
// feet stretched with the toes back and the big toes nearly meeting, the hips sitting on the heels.
export function kneelLegs(F, o = {}) {
  const { f, l } = F.fr, up = V(0, 1, 0), k = F.stature / 1.75, mid = wp(F.bones.hipL).add(wp(F.bones.hipR)).multiplyScalar(0.5);
  for (const [s, side] of [['L', 1], ['R', -1]]) {
    const hp = wp(F.bones['hip' + s]), Lt = hp.distanceTo(wp(F.bones['knee' + s])), drop = (o.drop ?? 0.20) * k;
    const kneeAt = mid.clone().addScaledVector(l, side * (o.kneeX ?? 0.055) * k).addScaledVector(up, -drop);
    const lat = kneeAt.clone().sub(hp).dot(l), fwd = Math.sqrt(Math.max(0, Lt * Lt - drop * drop - lat * lat));
    aim(F, 'hip' + s, 'knee' + s, V().addScaledVector(l, lat).addScaledVector(up, -drop).addScaledVector(f, fwd));
    aim(F, 'knee' + s, 'ankle' + s, V().addScaledVector(f, -1).addScaledVector(up, o.shin ?? -0.10).addScaledVector(l, side * (o.shinX ?? 0.04)));
    aim(F, 'ankle' + s, 'ball' + s, V().addScaledVector(f, -1).addScaledVector(up, o.foot ?? 0.02).addScaledVector(l, -side * (o.toeIn ?? 0.16))); }
  F.root.updateMatrixWorld(true);
}
// the legs' skinned points (vertices whose dominant bone is a leg bone), world space
export function legSkin(F) {
  const G = F.mesh.geometry, legs = new Set(['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'ballL', 'ballR'].map(n => F.boneName.indexOf(n))), out = [], v = V();
  F.mesh.updateMatrixWorld(true); F.mesh.skeleton.update();
  for (let i = 0; i < G.attributes.position.count; i++) { if (!legs.has(F.dom[i])) continue; v.fromBufferAttribute(G.attributes.position, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); out.push(v.clone()); }
  return out;
}
// the hip height that rests the kneeling legs on the cushion: pose at a trial height, find the lowest leg point (the
// shins and the tops of the feet), and lower the hips until it lies on the cushion's top (sink: a few mm into the pad)
export function fitKneel(F, resetPose, o = {}) {
  const H = F.bones.hips, y0 = 0.6; resetPose(F); const hw = wp(H); hw.y = y0; H.position.copy(H.parent.worldToLocal(hw)); F.root.updateMatrixWorld(true);
  kneelLegs(F, o); let low = Infinity; for (const p of legSkin(F)) low = Math.min(low, p.y);
  const hipY = y0 - (low - MAT_TOP) - (o.sink ?? 0.006); resetPose(F); return hipY;
}

// the scene: floor, the hearth ahead of the seat, the worn cushion under the figure, the low writing board
export function setHearth(X, seatC, o = {}) {
  const F = X.F, { f, l } = F.fr, up = V(0, 1, 0), S = X.scene;
  S.background = new THREE.Color(0x1d1612);
  for (const o of [...S.children]) if (o.isLight) S.remove(o);
  const hemi = new THREE.HemisphereLight(0xffcf9a, 0x2a1c22, 0.55); S.add(hemi);
  const dusk = new THREE.DirectionalLight(0x8a7ad8, 0.9); dusk.position.copy(seatC).addScaledVector(l, 3).addScaledVector(up, 3).addScaledVector(f, -2); S.add(dusk);
  const rock = new THREE.MeshStandardMaterial({ color: 0xb3a08a, roughness: 0.9, flatShading: true }), soot = new THREE.MeshStandardMaterial({ color: 0x141010, roughness: 1 }), darkWood = new THREE.MeshStandardMaterial({ color: 0x4f321e, roughness: 0.85 });
  // floor: the nook's bark-brown boards (flagstones there; kept plain here)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.copy(seatC).setY(0); S.add(floor);
  // the hearth: hollow.js's stones at the nook's scale, its front toward the seat
  const H = new THREE.Group(); H.position.copy(seatC).setY(0).addScaledVector(f, HEARTH_D); const zA = f.clone().negate(), xA = V().crossVectors(up, zA); H.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, up, zA)); H.scale.setScalar(NOOK); S.add(H);
  const blk = new THREE.BoxGeometry(1, 1, 1), stone = (w, h, d, x, y, z) => { const m = new THREE.Mesh(blk, rock); m.scale.set(w, h, d); m.position.set(x, y, z); H.add(m); };
  stone(0.5, 1.5, 0.9, -0.85, 0.75, 0); stone(0.5, 1.5, 0.9, 0.85, 0.75, 0); stone(2.3, 0.4, 1.0, 0, 1.65, 0); stone(2.6, 0.14, 1.15, 0, 1.92, 0.04); stone(1.3, 1.5, 0.3, 0, 0.75, -0.36); stone(2.2, 0.12, 1.3, 0, 0.06, 0.15);
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), soot); s.position.set(0, 0.78, -0.2); H.add(s); }
  for (const [x, rz] of [[-0.18, 0.3], [0.16, -0.25], [0, 0]]) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 7), darkWood); g.position.set(x, 0.2 + (x === 0 ? 0.1 : 0), 0); g.rotation.set(Math.PI / 2, 0, rz); H.add(g); }
  let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12 + r() * 0.1, 0.5 + r() * 0.35, 8, 1, true), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xff7a22 : 0xffa840, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); c.position.set((r() - 0.5) * 0.5, 0.45, (r() - 0.5) * 0.2); H.add(c); }
  // the fire's light, where hollow.js puts it (0.82 of the way from the room's middle to the hearth: in front of the logs)
  const fire = new THREE.PointLight(LIGHT.hearth.colour, LIGHT.hearth.intensity, LIGHT.hearth.distance, LIGHT.hearth.decay); fire.position.copy(H.position).addScaledVector(f, -0.2).setY(0.8); S.add(fire);
  // the worn cushion (hollow.js makeRoomItem cushion, flattened to MAT_TOP), plum
  const cg = new THREE.BoxGeometry(1, 1, 1, 6, 2, 6), p = cg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), kk = 1 - (Math.abs(x * 2) ** 4 + Math.abs(z * 2) ** 4) * 0.35; p.setY(i, y * Math.max(0.25, kk)); const s = 1 - Math.abs(y) * 0.12; p.setX(i, x * s); p.setZ(i, z * s); }
  cg.computeVertexNormals();
  const cush = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: 0x7d3466, roughness: 0.9 })); cush.scale.set(0.95, MAT_TOP, 0.82); cush.position.copy(seatC).setY(MAT_TOP / 2).addScaledVector(f, (o.cushFwd ?? 0) * F.stature / 1.75); cush.quaternion.copy(H.quaternion); S.add(cush);
  cush.updateMatrixWorld(true);
  return { hearth: H, cushion: cush, floor, fire };
}

// ---- the seated skirt ----
// supports: the posed legs (body triangles carried by the thighs, shins and feet), the cushion and the floor
function supportBVHs(X, extra) {
  const F = X.F, G = F.mesh.geometry, N = G.attributes.position.count, P = new Float32Array(N * 3), v = V();
  for (let i = 0; i < N; i++) { v.fromBufferAttribute(G.attributes.position, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
  const legs = new Set(['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'ballL', 'ballR'].map(n => F.boneName.indexOf(n))), I = F.idx0.array, keep = [];
  for (let t = 0; t < I.length; t += 3) if (legs.has(F.dom[I[t]]) || legs.has(F.dom[I[t + 1]]) || legs.has(F.dom[I[t + 2]])) keep.push(I[t], I[t + 1], I[t + 2]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(keep);
  const out = [new MeshBVH(g)];
  for (const m of extra) { m.updateMatrixWorld(true); const g2 = m.geometry.clone().applyMatrix4(m.matrixWorld); out.push(new MeshBVH(g2.index ? g2 : g2)); }
  return out;
}

export function drape(X, seat, o = {}) {
  const F = X.F, k = F.stature / 1.75, up = V(0, 1, 0), { f, l } = F.fr;
  const names = o.parts || /^(robe|outer)(-trim)?$/; // round 5: the hem bands drape with their skirts (they stood up as dark patches)
  const parts = X.parts.filter(pt => names.test(pt.name)); if (!parts.length) return {};
  const margin = (o.margin ?? 0.028) * k, slope = o.slope ?? 3.2, span = o.span ?? 0.22, floorY = 0.004, floorRun = (o.floorRun ?? 0.11) * k;
  const bv = supportBVHs(X, seat.supports || []);
  // the hip line: points above it ride the pelvis as cut; below it the column lays down its spoke
  const yb0 = X.yHip + (o.hipLine ?? 0.07) * k, hipNow = wp(F.bones.hips), hip0 = X.hip0, dY = hipNow.y - hip0.y;
  const c0 = X.c0 || (X.c0 = (() => { let x = 0, z = 0, n = 0; for (const pt of parts) for (let i = 0; i < pt.world.length; i += 3) if (Math.abs(pt.world[i + 1] - yb0) < 0.03 * k) { x += pt.world[i]; z += pt.world[i + 2]; n++; } return V(x / n, 0, z / n); })());
  const cN = c0.clone().add(V(hipNow.x - hip0.x, 0, hipNow.z - hip0.z)), yb = yb0 + dY;
  const NA = 96, K = 70, rMax = 0.95 * k, dr = rMax / (K - 1), ray = new THREE.Ray(V(), V(0, -1, 0));
  const angOf = (x, z) => { const a = Math.atan2(x * l.x + z * l.z, x * f.x + z * f.z); return (a + 2 * Math.PI) % (2 * Math.PI); };
  const dirOf = a => f.clone().multiplyScalar(Math.cos(a)).addScaledVector(l, Math.sin(a));
  // the skirt's radius at the hip line, per angle (the spoke starts there)
  const r0 = new Float32Array(NA); for (const pt of parts) for (let i = 0; i < pt.world.length; i += 3) { const y = pt.world[i + 1]; if (Math.abs(y - yb0) > 0.02 * k) continue; const x = pt.world[i] - c0.x, z = pt.world[i + 2] - c0.z, b = Math.round(angOf(x, z) / (2 * Math.PI) * NA) % NA; r0[b] = Math.max(r0[b], Math.hypot(x, z)); }
  for (let pass = 0; pass < 8; pass++) for (let b = 0; b < NA; b++) if (!r0[b]) r0[b] = Math.max(r0[(b + 1) % NA], r0[(b + NA - 1) % NA]);
  // round 5: the rays start 0.3 k over the hip line (from yb + 0.02 k a ray began inside a thigh standing above the hip
  // line and the cloth lay under it); the legs and the flat supports (the cushion, the floor) are kept apart, so a spoke
  // knows where it lands
  const hb = (x, z) => { let leg = -1, flat = floorY; ray.origin.set(x, yb + 0.3 * k, z); bv.forEach((b, j) => { const h = b.raycastFirst(ray, THREE.DoubleSide); if (!h) return; const y = h.point.y + margin; if (j === 0) leg = Math.max(leg, y); else flat = Math.max(flat, y); }); return [Math.max(leg, flat), leg, flat]; };
  const Y = [], SUP = [], LEG = [], FLAT = []; for (let a = 0; a < NA; a++) { const d = dirOf(a / NA * 2 * Math.PI), row = [], sr = [], lr = [], fr = []; for (let q = 0; q < K; q++) { const p = cN.clone().addScaledVector(d, r0[a] + q * dr), [y, lg, fl] = hb(p.x, p.z); row.push(y); sr.push(y); lr.push(lg); fr.push(fl); } Y.push(row); SUP.push(sr); LEG.push(lr); FLAT.push(fr); }
  // no cap at the hip line where a support stands higher (a thigh top over the hip line keeps the cloth over it)
  const fall = () => { for (let a = 0; a < NA; a++) { let y = yb; for (let q = 0; q < K; q++) { y = Math.max(Y[a][q], q ? y - slope * dr : y); Y[a][q] = Math.max(SUP[a][q], Math.min(y, yb)); } } };
  fall();
  // across the front, knee to knee, the cloth spans the gap instead of dropping into it
  for (let q = 0; q < K; q++) { const col = Y.map(row => row[q]), out = col.slice(), arc = 2 * Math.PI * (0.15 * k + q * dr) / NA;
    for (let a = 0; a < NA; a++) { if (Math.cos(a / NA * 2 * Math.PI) < Math.cos(1.05)) continue; for (let d = 1; d < NA / 3; d++) { const drop = span * d * arc; if (drop > 0.25 * k) break; for (const j of [a - d, a + d]) { const jj = (j + NA) % NA; out[a] = Math.max(out[a], col[jj] - drop); } } }
    for (let a = 0; a < NA; a++) Y[a][q] = out[a]; }
  fall();
  const base = Y.map(r => r.slice());
  for (let it = 0; it < 6; it++) { const nx = Y.map(r => r.slice()); for (let a = 0; a < NA; a++) for (let q = 1; q < K - 1; q++) { const A = (a + NA - 1) % NA, B = (a + 1) % NA; nx[a][q] = Math.max(base[a][q], (2 * Y[a][q] + Y[a][q - 1] + Y[a][q + 1] + Y[A][q] + Y[B][q]) / 6); } for (let a = 0; a < NA; a++) Y[a] = nx[a]; }
  // each spoke as a polyline (r, y) with its arc length, from the hip line to the floor and floorRun past it
  // a spoke lands on the first flat support it meets with no leg over it (the cushion beside and before the knees, or
  // the floor), then runs floorRun along it and piles
  const spokes = Y.map((row, a) => { const pts = [[r0[a], yb]]; let landed = -1, landY = floorY;
    for (let q = 0; q < K; q++) { const y = Math.max(floorY, row[q]); pts.push([r0[a] + q * dr, y]); if (LEG[a][q] < FLAT[a][q] - 1e-4 && y <= FLAT[a][q] + 1e-4) { landed = q; landY = y; break; } }
    const s = [0]; for (let j = 1; j < pts.length; j++) s.push(s[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    return { pts, s, land: s[s.length - 1], landed: landed >= 0, landY }; });
  const along = (sp, t) => { const { pts, s } = sp; if (t >= sp.land) { const [r, y] = pts[pts.length - 1], over = t - sp.land; if (!sp.landed) return [r + over * 0.3, y - over]; // a short skirt ending in the air over the knees
      const run = floorRun * (1 - Math.exp(-over / floorRun)); return [r + run, sp.landY + 0.0025 * k * Math.min(4, (over - run) / (0.02 * k))]; } // past floorRun the hem piles on itself, a few mm up
    let j = 1; while (j < s.length - 1 && s[j] < t) j++; const u = (t - s[j - 1]) / Math.max(1e-6, s[j] - s[j - 1]); return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * u, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * u]; };
  let moved = 0;
  for (const pt of parts) { pt.settled = null; const W = Float32Array.from(partWorld(pt)), S0 = pt.world, LW = new Float32Array(S0.length / 3); pt.live0 = W.slice();
    // near and under the hip line a point rides the pelvis alone: the thighs turned forward 90 degrees, so even the small
    // thigh share of the skin weights threw the front of the skirt into a fold (a dark hole over her left thigh)
    const Mr = F.bones.hips.matrixWorld.clone().multiply(X.hipM0.clone().invert()), q = V();
    for (let i = 0; i < S0.length; i += 3) { const y0 = S0[i + 1], er = THREE.MathUtils.smoothstep(yb0 + 0.06 * k - y0, 0, 0.06 * k);
      LW[i / 3] = er; if (er > 0) { q.set(S0[i], S0[i + 1], S0[i + 2]).applyMatrix4(Mr); W[i] += (q.x - W[i]) * er; W[i + 1] += (q.y - W[i + 1]) * er; W[i + 2] += (q.z - W[i + 2]) * er; }
      if (y0 >= yb0) continue;
      const x = S0[i] - c0.x, z = S0[i + 2] - c0.z, a = angOf(x, z), fa = a / (2 * Math.PI) * NA, a0 = Math.floor(fa) % NA, a1 = (a0 + 1) % NA, w = fa - Math.floor(fa);
      const rr = Math.hypot(x, z), t = Math.hypot(yb0 - y0, rr - r0[Math.round(fa) % NA]); // the length down the cloth from the hip line
      const [ra, ya] = along(spokes[a0], t), [rb, ybb] = along(spokes[a1], t), R = ra * (1 - w) + rb * w, Yy = ya * (1 - w) + ybb * w;
      const off = rr - r0[Math.round(fa) % NA] > 0 ? 0 : 0; void off;
      // an outer layer lies over the robe's lap, never on the same surface (the two z-fought as stripes in the first try)
      const lift = Math.max(0, (pt.layer ?? 4) - 4) * 0.009 * k;
      const p = cN.clone().addScaledVector(dirOf(a), R + lift); p.y = Yy + lift;
      // ease in over the first 4 cm under the hip line, so the cut skirt and the laid one meet without a crease
      const e = THREE.MathUtils.smoothstep(yb0 - y0, 0, 0.04 * k);
      W[i] += (p.x - W[i]) * e; W[i + 1] += (p.y - W[i + 1]) * e; W[i + 2] += (p.z - W[i + 2]) * e; LW[i / 3] = Math.max(LW[i / 3], e); moved++; }
    // round 5, last: a laid point under a leg's top is lifted to the margin over it (between two spokes, or in the ease
    // band under the hip line, the blend could leave it inside a thigh: the thighs peeking through)
    const lift5 = Math.max(0, (pt.layer ?? 4) - 4) * 0.009 * k, dn = new THREE.Ray(V(), V(0, -1, 0));
    for (let i = 0; i < S0.length; i += 3) { if (S0[i + 1] >= yb0 + 0.06 * k) continue; dn.origin.set(W[i], yb + 0.3 * k, W[i + 2]); const h = bv[0].raycastFirst(dn, THREE.DoubleSide); if (h && h.point.y + margin + lift5 > W[i + 1]) W[i + 1] = h.point.y + margin + lift5; }
    pt.settled = W; pt.lapW = LW; pt.laid = W.slice(); }
  F.bones.hips.updateMatrixWorld(true);
  X.lap = { parts, M0inv: F.bones.hips.matrixWorld.clone().invert(), yb, yc: (seat.supports?.[0] ? new THREE.Box3().setFromObject(seat.supports[0]).max.y : MAT_TOP) };
  showDraped(X, parts);
  return { moved, parts: parts.map(p => p.name) };
}
export function showDraped(X, parts) {
  for (const pt of parts) { const g = pt.geo.clone(); g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight'); g.morphAttributes = {};
    g.setAttribute('position', new THREE.BufferAttribute(pt.settled, 3)); g.computeVertexNormals();
    // the lining only along the hem: elsewhere on the laid lap its back faces showed through the cloth as dark patches
    // (sat, the inside of the skirt is never seen except at its edge)
    const gb = g.clone(); gb.setAttribute('position', g.attributes.position); gb.setAttribute('normal', g.attributes.normal); const E = g.attributes.aEdgeH, I = g.index.array, kb = [], k = X.F.stature / 1.75;
    for (let t = 0; t < I.length; t += 3) if (!E || Math.min(E.getX(I[t]), E.getX(I[t + 1]), E.getX(I[t + 2])) < 0.012 * k) kb.push(I[t], I[t + 1], I[t + 2]);
    gb.setIndex(kb);
    if (!pt.static) { pt.static = new THREE.Mesh(g, pt.mesh.material); pt.staticB = new THREE.Mesh(gb, pt.back.material); pt.static.frustumCulled = pt.staticB.frustumCulled = false; pt.static.renderOrder = pt.mesh.renderOrder; pt.staticB.renderOrder = pt.back.renderOrder; X.scene.add(pt.static, pt.staticB); }
    else { pt.static.geometry.dispose(); pt.staticB.geometry.dispose(); pt.static.geometry = g; pt.staticB.geometry = gb; }
    pt.static.visible = pt.staticB.visible = true; pt.mesh.visible = pt.back.visible = false; if (globalThis.__noback) pt.staticB.visible = false; }
}

// the legs' skin is not drawn while sat (always under trousers or the lap); with a floor-length skirt the trousers and
// shoes are under the lap too and are not drawn either (ck-sit-own-state: the lap is one mass, the legs hidden)
export function hideLegs(X, under) {
  const F = X.F, G = F.mesh.geometry, legs = new Set(['hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'ballL', 'ballR'].map(n => F.boneName.indexOf(n)));
  const I = G.index.array, keep = []; for (let t = 0; t < I.length; t += 3) if (!(legs.has(F.dom[I[t]]) && legs.has(F.dom[I[t + 1]]) && legs.has(F.dom[I[t + 2]]))) keep.push(I[t], I[t + 1], I[t + 2]);
  G.setIndex(keep);
  if (under) for (const pt of X.parts) if (/^(trousers|shoes|legwraps|boots)/.test(pt.name)) { pt.mesh.visible = pt.back.visible = false; pt.hiddenSeated = true; }
  // a knee-length skirt covers the thighs when sat: the trousers' thighs are not drawn (they came up through the lap
  // between the knees); the shins, wraps and shoes crossed in front of the body still show
  else for (const pt of X.parts) if (/^trousers/.test(pt.name)) { const g = pt.geo; if (!pt.idxSeat0) pt.idxSeat0 = g.index.array.slice();
    const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, th = new Set(['hipL', 'hipR', 'hips'].map(n => F.boneName.indexOf(n))), hid = new Uint8Array(SI.count);
    for (let i = 0; i < SI.count; i++) { let w = 0; for (let j = 0; j < 4; j++) if (th.has(SI.getComponent(i, j))) w += SW.getComponent(i, j); hid[i] = w > 0.5 ? 1 : 0; }
    const I = pt.idxSeat0, keep = []; for (let t = 0; t < I.length; t += 3) if (!(hid[I[t]] && hid[I[t + 1]] && hid[I[t + 2]])) keep.push(I[t], I[t + 1], I[t + 2]); g.setIndex(keep); }
}

// round 5, plan step 4 and 5, run every frame after S.at (and once after drape for a still).
// followLap: the laid lap was frozen at drape time while the body swayed. Each point now keeps its laid place moved by
// the hips' change since the drape, weighted from 1 at the hip line to 0 on the cushion, and every point the drape left
// as cut (the bodice, the sleeves) is re-skinned live, so the arm's sleeve moves with the arm while the lap stays laid.
// gather: the writing sleeve. Past (wrist - 0.07 k) along the right forearm the sleeve (its mouth band included, and
// A1's open bell) is pushed up the arm to 0.3 of its length and drawn a quarter in, the way a writer pushes a wide
// sleeve back, so it no longer hangs over the writing hand.
const ARM_R = /^(elbowR|foreSwingR|wristR|hand.*R|thumb.*R|index.*R|middle.*R|ring.*R|pinky.*R)$/;
function armSet(F, pt) {
  if (pt.armR) return pt.armR; const G = pt.mesh.geometry, SI = G.attributes.skinIndex, SW = G.attributes.skinWeight, A = new Uint8Array(SI.count);
  const bones = new Set(F.boneName.map((n, i) => ARM_R.test(n) ? i : -1).filter(i => i >= 0));
  for (let i = 0; i < SI.count; i++) { let w = 0; for (let j = 0; j < 4; j++) if (bones.has(SI.getComponent(i, j))) w += SW.getComponent(i, j); A[i] = w > 0.5 ? 1 : 0; }
  return (pt.armR = A);
}
export function followLap(X, o = {}) {
  const F = X.F, k = F.stature / 1.75; F.root.updateMatrixWorld(true); F.mesh.skeleton.update();
  const lap = X.lap, laidParts = lap ? lap.parts : [], extra = X.parts.filter(pt => (o.sleeves ?? /^(outer-bellR|undercuffR|bracerR)$/).test(pt.name) && !laidParts.includes(pt));
  const el = wp(F.bones.elbowR), wr = wp(F.bones.wristR), ax = wr.clone().sub(el), L = ax.length(); ax.divideScalar(L);
  const cut = L - (o.cut ?? 0.07) * k, keep = o.keep ?? 0.3, pull = o.pull ?? 0.25, v = V(), rv = V();
  const Mr = lap ? F.bones.hips.matrixWorld.clone().multiply(lap.M0inv) : null, q = V();
  for (const pt of [...laidParts, ...extra]) {
    const D = pt.laid, held = pt.settled; pt.settled = null; const live = partWorld(pt), N = live.length / 3, out = D ? new Float32Array(live.length) : live, A = armSet(F, pt);
    for (let i = 0; i < N; i++) { const j = i * 3;
      if (D) { const lw = pt.lapW[i]; if (lw > 0) { const wy = THREE.MathUtils.clamp((D[j + 1] - lap.yc) / Math.max(1e-3, lap.yb - lap.yc), 0, 1) * lw; q.set(D[j], D[j + 1], D[j + 2]).applyMatrix4(Mr);
          out[j] = D[j] + (q.x - D[j]) * wy + (live[j] - pt.live0[j]) * (1 - lw); out[j + 1] = D[j + 1] + (q.y - D[j + 1]) * wy + (live[j + 1] - pt.live0[j + 1]) * (1 - lw); out[j + 2] = D[j + 2] + (q.z - D[j + 2]) * wy + (live[j + 2] - pt.live0[j + 2]) * (1 - lw); }
        else { out[j] = live[j]; out[j + 1] = live[j + 1]; out[j + 2] = live[j + 2]; } }
      if (!A[i]) continue; v.fromArray(out, j).sub(el); const s = v.dot(ax); if (s <= cut) continue;
      const ex = s - cut, g = Math.min(1, ex / (0.1 * k)); rv.copy(v).addScaledVector(ax, -s).multiplyScalar(1 - pull * g);
      v.copy(el).addScaledVector(ax, cut + ex * keep).add(rv); v.toArray(out, j); }
    pt.settled = out; void held;
    if (!pt.static) showDraped(X, [pt]);
    else { const P = pt.static.geometry.attributes.position; P.array.set(out); P.needsUpdate = true; pt.static.geometry.computeVertexNormals(); pt.static.visible = true; pt.mesh.visible = pt.back.visible = false; pt.staticB.visible = !globalThis.__noback; } }
}

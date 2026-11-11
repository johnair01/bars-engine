// Round 29: the Heaven altar behind the founder's hall. Wendell answered cc-heaven-r28 A ("keep going toward 7"), and
// the callsheet's line for A was the Heaven altar behind the hall. Round 26 left three bare discs here, 2.5 m off the
// hall's back wall, that nobody could reach. The altar is now the open-sky mound of a Heaven temple: three round tiers of
// white stone, a carved balustrade on every tier's edge, a stair of four risers up each tier in the four directions, the
// heart-of-heaven stone at the top in rings of paving, a paved walk out of the founder's north doors, a round apron, a
// green-tiled burner for offerings and two lantern poles. It is walkable: altarGround gives its ground and the
// balustrades are colliders; wayCheck walks on from the founder's hall to the heart stone.
// Coordinates: r along the crown axis (CROWN.th, + toward the gate), v across it (CROWN.n), both from the summit.
import * as THREE from 'three';
import { box, tex } from './kit.js';

export const ALTAR = { r: -25.5, R: [8.0, 6.2, 4.4], RISE: 0.15, NR: 4, T: 0.28, HW: 1.2, APRON: 10.4, DOOR: -13.5, WALK: 2.2 };
ALTAR.RUN = (ALTAR.NR - 1) * ALTAR.T; ALTAR.TH = ALTAR.RISE * ALTAR.NR; ALTAR.TOP = 3 * ALTAR.TH;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // (along r, along v): south to the hall, north, and the two sides

// the altar's ground above the crown's level (y0) at (r, v) from the summit, or -Infinity off it
export function altarGround(r, v, y0) {
  const A = ALTAR, a = r - A.r, d = Math.hypot(a, v);
  const tierAt = t => (t <= A.R[2] ? 3 : t <= A.R[1] ? 2 : t <= A.R[0] ? 1 : 0);
  for (const [er, ev] of DIRS) { const t = a * er + v * ev, c = Math.abs(a * ev - v * er);
    if (t <= 0 || c >= A.HW) continue;
    for (let k = 0; k < 3; k++) { const Rk = A.R[k]; if (t > Rk && t <= Rk + A.RUN) { const j = Math.floor((Rk + A.RUN - t) / A.T); return y0 + k * A.TH + A.RISE * (j + 1); } }
    return y0 + tierAt(t) * A.TH + 0.02; }
  if (d <= A.R[0]) return y0 + tierAt(d) * A.TH + 0.02;
  if (d <= A.APRON) return y0 + 0.02; // the round apron
  if (r <= A.DOOR + 0.6 && r >= A.r + A.R[0] && Math.abs(v) < A.WALK) return y0 + 0.02; // the walk from the north doors
  return -Infinity;
}

// the tiers, balustrades, stairs, heart stone, apron, walk, burner and poles; colliders go to `cols`
export function buildAltar(G, M, CROWN, at, y0, cols) {
  const A = ALTAR, [cx, cz] = at(A.r, 0), ry = Math.PI / 2 - CROWN.th;
  const marble = new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.62 });
  const marbleD = new THREE.MeshStandardMaterial({ color: 0xd3cdbf, roughness: 0.7 });
  // the top of each tier: paving laid in rings of nine round the heart stone (the round altar's counted stones)
  const ringTex = (R0, R1) => tex(1024, 1024, (x, w, h) => { const s = w / 2 / R0; x.fillStyle = '#e6e0d2'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,112,98,0.55)'; x.lineWidth = 2;
    const rings = Math.round((R0 - R1) / 0.55);
    for (let i = 0; i <= rings; i++) { const rr = R1 + (R0 - R1) * i / rings; x.beginPath(); x.arc(w / 2, h / 2, rr * s, 0, 7); x.stroke();
      if (i < rings) { const n = 9 * Math.round(rr / 0.5); const r2 = R1 + (R0 - R1) * (i + 1) / rings;
        for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2; x.beginPath(); x.moveTo(w / 2 + Math.cos(t) * rr * s, h / 2 + Math.sin(t) * rr * s); x.lineTo(w / 2 + Math.cos(t) * r2 * s, h / 2 + Math.sin(t) * r2 * s); x.stroke(); } } }
    const rnd = (() => { let q = 9; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '150,140,120' : '255,252,240'},${0.05 + 0.08 * rnd()})`; x.fillRect(rnd() * w, rnd() * h, 2 + 8 * rnd(), 2 + 8 * rnd()); } }, [1, 1]);
  const add = (geo, m, x, y, z) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); k.castShadow = k.receiveShadow = true; G.add(k); return k; };
  for (let k = 0; k < 3; k++) { const R = A.R[k], yb = y0 + k * A.TH;
    add(new THREE.CylinderGeometry(R, R + 0.04, A.TH + (k ? 0 : 0.3), 72), marbleD, cx, yb + (A.TH - (k ? 0 : 0.3)) / 2, cz);
    const top = add(new THREE.CircleGeometry(R - 0.01, 72), new THREE.MeshStandardMaterial({ map: ringTex(R, k < 2 ? A.R[k + 1] : 0.55), roughness: 0.6 }), cx, yb + A.TH + 0.012, cz); top.rotation.x = -Math.PI / 2; top.rotation.z = -ry;
    const lip = add(new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.12, 72, 1, true), marble, cx, yb + A.TH - 0.06, cz); lip.material = marble; }
  // the heart-of-heaven stone, a little raised, at the centre of the top
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 36), new THREE.MeshStandardMaterial({ color: 0xf4efe2, roughness: 0.5 }), cx, y0 + A.TOP + 0.03, cz);
  // the balustrades: posts with a ball head and panels between them on each tier's edge, open at the four stairs
  const posts = [], panels = [];
  for (let k = 0; k < 3; k++) { const R = A.R[k] - 0.18, yb = y0 + (k + 1) * A.TH, n = Math.round(2 * Math.PI * R / 1.25), gap = Math.asin((A.HW + 0.2) / R);
    for (let i = 0; i < n; i++) { const t0 = i / n * Math.PI * 2, t1 = (i + 1) / n * Math.PI * 2;
      const inGap = t => [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI].some(g => Math.abs(t - g) < gap);
      if (!inGap(t0)) posts.push([R, t0, yb]);
      if (!inGap(t0) && !inGap(t1)) panels.push([R, (t0 + t1) / 2, yb, 2 * R * Math.sin((t1 - t0) / 2)]); }
    // stair-side posts at each gap's edge
    for (const g of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) for (const sg of [-1, 1]) posts.push([R, g + sg * gap, yb]); }
  // a local polar angle t is measured from the crown axis (+r) toward +v
  const P = (R, t) => { const a = Math.cos(t) * R, v = Math.sin(t) * R; return at(A.r + a, v); };
  const yawOf = t => ry - t; // a panel's long side runs along the tangent
  { const geo = new THREE.BoxGeometry(0.22, 0.95, 0.22), head = new THREE.SphereGeometry(0.13, 10, 8);
    const I = new THREE.InstancedMesh(geo, marble, posts.length), H = new THREE.InstancedMesh(head, marble, posts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
    posts.forEach(([R, t, yb], i) => { const [x, z] = P(R, t); q.setFromEuler(e.set(0, yawOf(t), 0)); m4.compose(new THREE.Vector3(x, yb + 0.475, z), q, s); I.setMatrixAt(i, m4); m4.compose(new THREE.Vector3(x, yb + 1.04, z), q, s); H.setMatrixAt(i, m4); });
    I.castShadow = I.receiveShadow = true; G.add(I, H); }
  { const geo = new THREE.BoxGeometry(0.1, 0.62, 1), rail = new THREE.BoxGeometry(0.16, 0.1, 1);
    const I = new THREE.InstancedMesh(geo, marble, panels.length), Rl = new THREE.InstancedMesh(rail, marble, panels.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    panels.forEach(([R, t, yb, L], i) => { const [x, z] = P(R, t); q.setFromEuler(e.set(0, yawOf(t), 0)); m4.compose(new THREE.Vector3(x, yb + 0.38, z), q, new THREE.Vector3(1, 1, L - 0.2)); I.setMatrixAt(i, m4);
      m4.compose(new THREE.Vector3(x, yb + 0.86, z), q, new THREE.Vector3(1, 1, L)); Rl.setMatrixAt(i, m4);
      const yaw = yawOf(t); cols.push({ x, z, c: Math.cos(yaw), s: Math.sin(yaw), hw: 0.12, hd: L / 2 + 0.05, y0: yb - 0.5, y1: yb + 0.95 }); });
    I.castShadow = I.receiveShadow = true; G.add(I, Rl); }
  // the stairs: four risers up each tier in the four directions, with low cheek blocks either side
  for (const [er, ev] of DIRS) { const yaw = ry - Math.atan2(ev, er);
    for (let k = 0; k < 3; k++) { const Rk = A.R[k], yb = y0 + k * A.TH;
      for (let j = 0; j < A.NR - 1; j++) { const t = Rk + A.RUN - (j + 0.5) * A.T, top = yb + A.RISE * (j + 1), [x, z] = at(A.r + er * t, ev * t);
        const st = box(G, 2 * A.HW, top - yb + 0.05, A.T + 0.01, marble, x, (top + yb - 0.05) / 2, z); st.rotation.y = yaw; }
      for (const sg of [-1, 1]) { const t = Rk + A.RUN / 2 - 0.1, [x, z] = at(A.r + er * t - ev * sg * (A.HW + 0.15), ev * t + er * sg * (A.HW + 0.15)), h = A.TH + 0.3;
        const ch = box(G, 0.3, h, A.RUN + 0.3, marble, x, yb + h / 2, z); ch.rotation.y = yaw;
        cols.push({ x, z, c: Math.cos(yaw), s: Math.sin(yaw), hw: 0.15, hd: (A.RUN + 0.3) / 2, y0: yb - 0.3, y1: yb + h }); } } }
  // the round apron and the walk from the founder's north doors
  { const ap = add(new THREE.CylinderGeometry(A.APRON, A.APRON, 0.3, 72), M.paving, cx, y0 - 0.13, cz); ap.material = M.paving; }
  { const r0 = A.DOOR + 0.6, r1 = A.r + A.APRON - 0.5, [x, z] = at((r0 + r1) / 2, 0), w = box(G, 2 * A.WALK, 0.3, r0 - r1, M.paving, x, y0 - 0.12, z); w.rotation.y = ry; }
  // a green-tiled burner for the offerings, south-east of the altar, and two lantern poles on the apron's edge
  { const [bx, bz] = at(A.r + 6.8, 8.4), green = new THREE.MeshStandardMaterial({ color: 0x2f6b4a, roughness: 0.55 });
    const b = box(G, 2.2, 2.0, 2.2, green, bx, y0 + 1.0, bz); b.rotation.y = ry; const rf = box(G, 2.8, 0.25, 2.8, M.tileM, bx, y0 + 2.12, bz); rf.rotation.y = ry;
    const mouth = box(G, 0.9, 0.9, 0.05, new THREE.MeshStandardMaterial({ color: 0x1b1410, emissive: 0x5a2208, emissiveIntensity: 0.6 }), 0, 0, 0); mouth.removeFromParent();
    const [mx, mz] = at(A.r + 6.8, 8.4 - 1.13); mouth.position.set(mx, y0 + 0.75, mz); mouth.rotation.y = ry + Math.PI / 2; G.add(mouth);
    const st = box(G, 3, 0.25, 3, marbleD, bx, y0 + 0.1, bz); st.rotation.y = ry;
    cols.push({ x: bx, z: bz, c: Math.cos(ry), s: Math.sin(ry), hw: 1.5, hd: 1.5, y0: y0 - 0.2, y1: y0 + 2.3 }); }
  for (const sg of [-1, 1]) { const [px, pz] = at(A.r - 7.4, sg * 7.4);
    add(new THREE.CylinderGeometry(0.12, 0.16, 9, 10), M.wood, px, y0 + 4.5, pz); add(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), marbleD, px, y0 + 0.17, pz);
    const lamp = add(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xc8402e, emissive: 0x7a1a10, emissiveIntensity: 0.5, roughness: 0.6 }), px, y0 + 8.1, pz); lamp.castShadow = false;
    cols.push({ x: px, z: pz, c: 1, s: 0, hw: 0.5, hd: 0.5, y0: y0 - 0.2, y1: y0 + 3 }); }
}

// The Heaven sect blockout: one heightfield, the courts at the founder's standard, and the places of round 3's map.
// Grey boxes in the round 2 and 5 palette; three interiors (founder's hall, Shaman Elder's house, Virelune room) are
// built from rooms.json so their metres match round 4's plans.
import * as THREE from 'three';
import { heightAt, PADS, PATHS, COURTS, NATIONS, P, AXIS, ROUTE } from './layout.js';

export const PAL = {
  plaster: '#c25a3d', beam: '#2f6f6a', gold: '#b8862b', roof: '#3f4a4c', stone: '#9a9184', paper: '#efe5cf',
  wood: '#7a4a2a', earth: '#a8805a', pave: '#cdbf9e', grass: '#8a9867', rock: '#8a8274', forest: '#4f6a3c',
};
const mats = new Map();
export const mat = (col, o = {}) => {
  const k = col + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, ...o }));
  return mats.get(k);
};

// Everything that blocks the avatar, as oriented boxes; and every room whose roof lifts when you step inside.
export const colliders = [];
export const interiors = [];
export const floors = []; // meshes tap-to-walk may land on

// A frame: a group at (x, z) on the ground, turned so local -z faces `face` ([x, z]) and local +z points away.
export function frame(S, at, y, face, flip = false) {
  const G = new THREE.Group();
  const u = [face[0] - at[0], face[1] - at[1]];
  const th = flip ? Math.atan2(u[0], u[1]) : Math.atan2(-u[0], -u[1]);
  G.position.set(at[0], y, at[1]); G.rotation.y = th;
  S.add(G); return G;
}
// World frame of any group (rotations are about y only): origin, and cos/sin of its world yaw.
const _v = new THREE.Vector3();
function wf(G) {
  G.updateWorldMatrix(true, false); const e = G.matrixWorld.elements;
  return { x: e[12], y: e[13], z: e[14], c: e[0], s: -e[2] };
}
const toWorld = (F, x, z) => [F.x + F.c * x + F.s * z, F.z - F.s * x + F.c * z];
const pushCollider = (G, x, z, w, d, y0, h) => { const F = wf(G), [wx, wz] = toWorld(F, x, z);
  colliders.push({ x: wx, z: wz, c: F.c, s: F.s, hw: w / 2, hd: d / 2, y0: F.y + y0, y1: F.y + y0 + h }); };

export function box(G, x, z, w, d, h, col, { y0 = 0, collide = true, cast = true } = {}) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === 'string' ? mat(col) : col);
  b.position.set(x, y0 + h / 2, z); b.castShadow = cast; b.receiveShadow = true; G.add(b);
  if (collide) pushCollider(G, x, z, w, d, y0, h);
  return b;
}

const hipGeo = (() => { const g = new THREE.CylinderGeometry(0, 1, 1, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; })();
export function roof(G, x, z, w, d, y, rise, col = PAL.roof) {
  const R = new THREE.Group();
  const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.3, d + 1.6), mat(PAL.beam));
  eave.position.set(x, y + 0.15, z); eave.castShadow = true; R.add(eave);
  const p = new THREE.Mesh(hipGeo, mat(col)); p.scale.set((w + 1.6) / Math.SQRT2, rise, (d + 1.6) / Math.SQRT2);
  p.position.set(x, y + 0.3, z); p.castShadow = true; R.add(p);
  G.add(R); return R;
}

// A closed grey hall: walls, a teal beam band, a hip roof. Front (door) faces local -z.
export function hall(G, x, z, w, d, h, { col = PAL.plaster, door = PAL.wood, roofRise } = {}) {
  box(G, x, z, w, d, h, col);
  box(G, x, z - d / 2 - 0.05, w + 0.02, 0.12, 0.4, PAL.beam, { y0: h - 0.6, collide: false });
  box(G, x, z - d / 2 - 0.06, Math.min(2.4, w * 0.3), 0.1, Math.min(2.6, h * 0.8), door, { collide: false });
  roof(G, x, z, w, d, h, roofRise ?? Math.min(w, d) * 0.32);
}

export function paifang(G, x, z, w = 7, h = 5, col = PAL.plaster) {
  for (const sx of [-1, 1]) box(G, x + sx * w / 2, z, 0.6, 0.6, h, col);
  box(G, x, z, w + 1.6, 0.8, 0.5, PAL.beam, { y0: h, collide: false });
  box(G, x, z, w + 2.6, 1.4, 0.35, PAL.roof, { y0: h + 0.5, collide: false });
  box(G, x, z - 0.42, 1.6, 0.06, 0.9, PAL.gold, { y0: h - 1.2, collide: false });
}

// ---------- terrain ----------
export function terrain(S) {
  const W = 1140, D = 822, N = 380, M = 274, cx = 24, cz = -9 + 1;
  const g = new THREE.PlaneGeometry(W, D, N, M); g.rotateX(-Math.PI / 2); g.translate(cx, 0, cz);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), t = new THREE.Color();
  const segs = [];
  for (const [pts, w, cc] of PATHS) for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i], w / 2, new THREE.Color(cc)]);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightAt(x, z); pos.setY(i, y);
    c.set(PAL.grass);
    const north = Math.max(0, (-z - 180) / 120) + Math.max(0, (-x - 330) / 120);
    if (north > 0) c.lerp(t.set(PAL.forest), Math.min(1, north));
    if (y < -60) c.lerp(t.set(PAL.rock), Math.min(1, (-60 - y) / 60));
    for (const p of PADS) if (p[3] > 6 && Math.hypot(x - p[0], z - p[1]) < p[3] - 1) { c.set(PAL.pave); break; }
    for (const [a, b, hw, cc] of segs) {
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
      const k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      if (Math.hypot(x - a[0] - k * dx, z - a[1] - k * dz) < hw) { c.lerp(cc, 0.7); break; }
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const T = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false }));
  T.receiveShadow = true; T.name = 'ground'; S.add(T); floors.push(T);
  // the cloud sea below
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: '#e9eef0', roughness: 1, transparent: true, opacity: 0.92 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -105; S.add(sea);
  return T;
}

// ---------- a court at the founder's standard ----------
// Gate toward the summit, yard behind it, teaching hall at the back facing the summit, the Elder's house beside the
// yard, the five lieutenants' rooms in a row on the other side.
export function court(S, c, rooms) {
  const G = frame(S, c.at, c.h, P.summit);
  if (!c.crag) {
    paifang(G, 0, -24, 7, 4.6);
    box(G, 0, -8, 24, 20, 0.08, c.key === 'regent' ? '#7f9fb0' : '#d8c9a6', { collide: false, cast: false });
  }
  hall(G, 0, 9, 20, 12, 5.2);
  box(G, -9.5, -24.6, 0.8, 0.8, 8, c.col, { collide: true }); // the court's mark post, in its face's colour
  if (c.key === 'shaman') {
    const E = new THREE.Group(); E.position.set(-22, 0, -6); E.rotation.y = Math.PI / 2;
    // Elder's house: its south door faces the yard (+x of the court frame)
    G.add(E); room(E, rooms.elder);
    // fire circle in the yard
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; box(G, Math.cos(a) * 2.4, -10 + Math.sin(a) * 2.4, 0.6, 0.6, 0.5, PAL.stone, { collide: false }); }
  } else {
    hall(G, -22, -6, 10, 14, 3.6, { col: c.key === 'challenger' ? '#a8574a' : PAL.plaster });
  }
  NATIONS.forEach(([name, , ncol], i) => {
    const z = -18 + i * 6.2;
    if (c.key === 'shaman' && name === 'Virelune') {
      const L = new THREE.Group(); L.position.set(18, 0, z); L.rotation.y = -Math.PI / 2;
      G.add(L); room(L, rooms.lieutenant);
    } else {
      const R = new THREE.Group(); R.position.set(18, 0, z); R.rotation.y = -Math.PI / 2; G.add(R);
      hall(R, 0, 0, 5.5, 4.5, 2.8, { door: ncol, roofRise: 1.2 });
    }
  });
  return G;
}

// ---------- a room from rooms.json ----------
// Room plan coords: x across (0..Wd), y from the north wall (0) to the south door wall (D). Local +z is south.
export function room(E, R, roofCol = PAL.roof) {
  const ox = R.Wd / 2, oz = R.D / 2;
  const add = (x, y, w, d, h, col, o = {}) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col));
    const lx = x + w / 2 - ox, lz = y + d / 2 - oz, y0 = o.y0 || 0;
    b.position.set(lx, y0 + h / 2, lz); b.castShadow = true; b.receiveShadow = true; E.add(b);
    if (o.collide !== false) pushCollider(E, lx, lz, w, d, y0, h);
    return b;
  };
  const fl = new THREE.Mesh(new THREE.BoxGeometry(R.Wd, 0.06, R.D), mat(R.floor_col));
  fl.position.y = 0.03; fl.receiveShadow = true; E.add(fl);
  for (const it of R.items) {
    const [k, , x, y, w, d, h, col] = it;
    if (k === 'w' || k === 'c' || k === '0') add(x, y, w, d, k === 'w' ? h : R.Ht, col);
    else add(x, y, w, d, h, col, { collide: h > 0.5 });
  }
  // the teal beam band and gold-trimmed door frames on the deco list
  for (const [side, a, b, z0, z1, col] of R.deco || []) {
    if (col === '#2f6f6a' && side === 'N') add(a, -0.08, b - a, 0.1, z1 - z0, col, { y0: z0, collide: false });
    if (col === '#2f6f6a' && side === 'W') add(-0.12, a, 0.1, b - a, z1 - z0, col, { y0: z0, collide: false });
  }
  (R.tablets || []).forEach(([yy, zz, mended]) => add(0.3, yy - 0.22, 0.06, 0.44, 0.55, mended ? PAL.gold : '#3b2a1c', { y0: zz + 0.5, collide: false }));
  const top = R.Ht + (R.key === 'elder' ? 0.6 : 0);
  const rf = roof(E, 0, 0, R.Wd, R.D, top, Math.min(R.Wd, R.D) * 0.3, roofCol);
  const F = wf(E);
  interiors.push({ x: F.x, z: F.z, c: F.c, s: F.s, hw: R.Wd / 2 + 0.3, hd: R.D / 2 + 0.3, y: F.y, roof: rf, key: R.key, R, E });
  return E;
}

// ---------- the other places ----------
export function places(S, rooms) {
  // Thunder gate: the paifang across the axis
  { const G = frame(S, P.gate, 0, AXIS[7]); paifang(G, 0, 0, 9, 6.5); box(G, -9, 6, 5, 4, 3, PAL.plaster); }
  // Arrival court: gatehouse, arrival hall (12 bunks), notice wall
  { const G = frame(S, P.arrival, 12, P.summit); hall(G, 0, 10, 16, 8, 4); hall(G, -12, -6, 7, 6, 3.4); box(G, 10, -8, 6, 0.4, 2.2, PAL.paper); }
  // Great court: censer, chore board, the lathe bell in its frame
  { const G = frame(S, P.great, 25, P.summit);
    box(G, 0, 0, 1.4, 1.4, 1.2, '#7d6a3a'); box(G, 12, -2, 4, 0.3, 2.4, PAL.wood);
    for (const sx of [-1, 1]) box(G, -12 + sx * 1.8, 6, 0.4, 0.4, 4.6, PAL.wood);
    box(G, -12, 6, 4.4, 0.5, 0.5, PAL.beam, { y0: 4.6, collide: false });
    const bell = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.75, 0], [0.72, 0.15], [0.6, 0.6], [0.55, 1.4], [0.42, 1.75], [0.12, 1.85], [0, 1.85]].map(([r, y]) => new THREE.Vector2(r, y)), 28), mat('#7d6a3a', { metalness: 0.6, roughness: 0.45 }));
    bell.position.set(-12, 2.6, 6); bell.castShadow = true; G.add(bell);
  }
  // Summit: the founder's hall (its south doors face the great court) and the Heaven altar, open sky, behind it
  { const G = frame(S, P.summit, 90, P.great, true);
    const H = new THREE.Group(); H.position.set(0, 0, 4); G.add(H); room(H, rooms.founder);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(7 - i * 2, 7 - i * 2, 0.5, 40), mat(i % 2 ? PAL.paper : PAL.stone)); c.position.set(0, 0.25 + i * 0.5, -20); c.receiveShadow = c.castShadow = true; G.add(c); }
  }
  // Dojo, refectory
  { const G = frame(S, P.dojo, 30, P.summit); hall(G, 0, 2, 18, 14, 5);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.8, 40), mat(PAL.plaster)); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.05, -10); G.add(ring); }
  { const G = frame(S, P.refectory, 44, P.summit); hall(G, 0, 0, 24, 10, 4.4); }
  // Exiles' rows: eight team houses, yours with the lit door
  { const G = frame(S, P.rows, 50, P.summit);
    for (let i = 0; i < 8; i++) { const x = -13.5 + (i % 4) * 9, z = i < 4 ? -6 : 8;
      hall(G, x, z, 6, 5, 3, { door: i === 2 ? '#ffd27a' : PAL.wood, roofRise: 1.4 }); }
    const lamp = new THREE.PointLight('#ffb860', 6, 14); lamp.position.set(-13.5 + 2 * 9, 2, -9.5); G.add(lamp); }
  // The spring: pool, bathhouse, infirmary, the vessel cells
  { const G = frame(S, P.spring, 50, P.summit);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(7, 40), mat('#5f8fa3', { roughness: 0.15, metalness: 0.1 })); pool.rotation.x = -Math.PI / 2; pool.position.set(-12, 0.06, 4); G.add(pool);
    hall(G, 12, 10, 10, 8, 3.6); hall(G, 12, -6, 10, 8, 3.6);
    for (let i = 0; i < 6; i++) hall(G, -18 + i * 4.2, -14, 3.2, 3.2, 2.6, { roofRise: 1 }); }
  // The forest gate, and the edge
  { const G = frame(S, P.forestGate, heightAt(...P.forestGate), P.edge); paifang(G, 0, 0, 5, 4.2, '#4c6a35'); }
  // The cave mouth below the Shaman's court
  { const G = frame(S, P.caveMouth, heightAt(...P.caveMouth), COURTS[0].at); box(G, 0, 3, 14, 6, 9, '#5d584e'); box(G, 0, -0.2, 5, 0.4, 4, '#1f1b17', { collide: false }); }
}

// Stone lanterns pair up along the axis; trees fill the forest to the north and west.
export function axisMarks() {
  const out = [];
  for (let i = 1; i < AXIS.length; i++) {
    const a = AXIS[i - 1], b = AXIS[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 26);
    const nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L;
    for (let k = 1; k <= n; k++) { const t = k / (n + 1), x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      for (const s of [-1, 1]) out.push([x + nx * 5 * s, z + nz * 5 * s]); }
  }
  return out;
}

export function forest(S) {
  const cone = new THREE.ConeGeometry(2.6, 9, 7); cone.translate(0, 7, 0);
  const trunk = new THREE.CylinderGeometry(0.3, 0.4, 3, 6); trunk.translate(0, 1.5, 0);
  const pts = []; let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9000 && pts.length < 900; i++) {
    const x = -540 + rnd() * 1100, z = -400 + rnd() * 780;
    const inForest = (z < -200 && x < 400) || (x < -330 && z < 250);
    if (!inForest) continue;
    if (PADS.some(p => p[3] > 6 && Math.hypot(x - p[0], z - p[1]) < p[3] + 6)) continue;
    if (Math.abs(x) < 5 && z < -150) continue; // keep the spring path clear
    pts.push([x, z]);
  }
  const C = new THREE.InstancedMesh(cone, mat('#3f5a33'), pts.length), T = new THREE.InstancedMesh(trunk, mat('#5a4030'), pts.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  pts.forEach(([x, z], i) => { const k = 0.7 + rnd() * 0.7; m4.compose(v.set(x, heightAt(x, z) - 0.3, z), q, new THREE.Vector3(k, k, k)); C.setMatrixAt(i, m4); T.setMatrixAt(i, m4); });
  C.castShadow = true; S.add(C, T);
}

// Numbered posts at round 3's eleven route stops.
export function routePosts(S) {
  for (const r of ROUTE) {
    const y = heightAt(...r.at);
    const px = r.at[0] + 3, pz = r.at[1] - 1; const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8), mat(PAL.plaster)); post.position.set(px, heightAt(px, pz) + 1.6, pz); post.castShadow = true; S.add(post);
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#a3322a'; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fill(); x.strokeStyle = '#fff8ea'; x.lineWidth = 6; x.stroke();
    x.fillStyle = '#fff8ea'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(r.n), 64, 68);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
    sp.scale.set(2.4, 2.4, 1); sp.position.set(px, heightAt(px, pz) + 4.4, pz); sp.renderOrder = 10; sp.userData.routeBadge = true; S.add(sp);
  }
}

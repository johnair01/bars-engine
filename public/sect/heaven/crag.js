// Round 13: the summit crag's crown, as the anchor painting draws it. Wendell scored round 12 a 3/10; the green dome
// behind the great court was the farthest thing from his painting, where a grey rock tower stands behind the hall with
// a walled crown, tiered halls on its lip and a wall that winds down its face. layout.js now shapes the cliff; this
// module builds what stands on it, in world coordinates, every piece seated on heightAt.
import * as THREE from 'three';
import { hall, box, paifang } from './kit.js';
import { heightAt, P, CRAG, cragNoise, AXIS, PILGRIM } from './layout.js';

const rimAt = th => CRAG.rim + cragNoise(th) * 7;

// Round 17: the way up the ridge. From the gate the slope in front of the crag was one pale, empty mound. The painting's
// crag is reached by a pilgrim stair; here a stone stair climbs from the great court's back edge to a landing with a gate
// on the ridge's crest (the axis point at +50), and a bridge carries the way over the saddle behind it to the foot of the
// winding wall, so the eye can follow one road from the hall to the crown.
const _tg = Math.atan2(P.great[1] - P.summit[1], P.great[0] - P.summit[0]);
const WALL_TH = _tg - 1.1; // where the winding road starts its turn (ROAD)
const LAND = AXIS[9];
// Round 24: the winding road's nodes, shared by cragCrown (which draws it) and wayGround (which lets the figure walk it).
// [x, z, y, th]; y is the road's centre line, its paved top stands 0.25 m above.
export const ROAD = (() => { const steps = 150, turn = Math.PI * 2.4, yLo = 46, yHi = 89, out = [];
  for (let i = 0; i <= steps; i++) { const t = i / steps, th = WALL_TH + t * turn, y = yLo + (yHi - yLo) * t;
    const slope = 3.2 + 1.6 * cragNoise(th * 3 + 1), dy = Math.max(0, 90 - y), r = rimAt(th) + dy / slope + 7.8 + Math.floor(dy / 7.5) * 0.35 + dy * 0.03;
    out.push([P.summit[0] + Math.cos(th) * r, P.summit[1] + Math.sin(th) * r, y, th]); }
  return out; })();
// Round 24: Wendell on cc-heaven-r22, "The first image has steps on a pier that lead to nowhere". Round 20 put the zigzag's
// landings into WAY, so WAY[2], which had been the winding wall's foot, became the second landing, and the bridge ran from
// the gate back over the zigzag to a deck 10 m in the air. Walkability rule 2 (calrunian-sect.md): a bridge joins walkable
// ground or another way at both ends at the same height. The bridge now runs from the gate terrace to the node of the
// winding road nearest the gate whose top is no more than 2 m above the gate, and the road starts there; its lower turn,
// which ended 3 m above the ground at the crag's foot, is gone.
const ROAD_J = (() => { const ya = 50.15; let best = 0, bd = 1e9;
  ROAD.forEach(([x, z, y], i) => { const d = Math.hypot(x - LAND[0], z - LAND[1]); if (y + 0.25 >= ya - 0.5 && y + 0.25 <= ya + 2 && d < bd) { bd = d; best = i; } });
  return best; })();
export const ROAD_START = ROAD_J;
const WAY = [PILGRIM.foot, ...PILGRIM.landings.map(l => [l.x, l.z]), PILGRIM.top, LAND, ROAD[ROAD_J]]; // round 20: the zigzag's turns
function nearWay(x, z) { let best = 1e9;
  for (let i = 1; i < WAY.length; i++) { const [a, b] = [WAY[i - 1], WAY[i]], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); best = Math.min(best, Math.hypot(x - a[0] - k * dx, z - a[1] - k * dz)); }
  return best; }

// Round 18: Wendell answered cc-heaven-r17 A, keep going: the stair was drawn but the avatar walked the hill under it,
// sinking through the treads and passing through its walls. Now the way carries its own ground (wayGround) and walls
// (wayColliders): the stair rises in even flights over the ridge's profile, the landing and the bridge deck can be stood
// on, and the walls and the gate's posts stop the avatar. CREST_STAIR ends the walk the "Climb to the crest" button takes.
export const wayColliders = [];
export const TREAD = PILGRIM.T; // round 20: the gentle stair's tread depth (0.28 m), one step of the figure per tread
const FOOT = 3; // round 24: the apron before the first tread, at the court's height (rule 1)
const TW = 1.2; // half the width of a tread; the walls stand outside it, to PILGRIM.HW
// where a foot should land on the stair: the middle of the tread under (x, z) as [x, z, top], or null off the stair
export function stairTread(x, z) {
  for (const f of PILGRIM.flights) { const s = (x - f.a[0]) * f.ux + (z - f.a[1]) * f.uz, v = (x - f.a[0]) * f.nx + (z - f.a[1]) * f.nz;
    if (s < f.s0 || s >= f.s1 || Math.abs(v) > TW) continue;
    const k = Math.floor((s - f.s0) / TREAD), sc = f.s0 + (k + 0.5) * TREAD;
    return [f.a[0] + f.ux * sc + f.nx * v, f.a[1] + f.uz * sc + f.nz * v, f.y + PILGRIM.R * (k + 1)]; }
  return null;
}
const way = { stair: null, land: null, bridge: null, terrace: null };
const wallBox = (x, z, len, thick, ry, y0, y1) => wayColliders.push({ x, z, c: Math.cos(ry), s: Math.sin(ry), hw: len / 2, hd: thick / 2, y0, y1 });
// ground of the way at (x, z), or -Infinity off it
export function wayGround(x, z) {
  // round 24: the landing's ground and its pad stop at its radius (were 0.25 m wider, which buried the last and first
  // treads of every flight under the pad and left a double riser of 0.34 m at each turn; walkability rule 1)
  for (const l of PILGRIM.landings) if (Math.hypot(x - l.x, z - l.z) < l.r) return l.y;
  const t = stairTread(x, z); if (t) return t[2];
  { const f = PILGRIM.flights[0], s = (x - f.a[0]) * f.ux + (z - f.a[1]) * f.uz, v = (x - f.a[0]) * f.nx + (z - f.a[1]) * f.nz;
    if (s >= -FOOT && s < f.s0 && Math.abs(v) < PILGRIM.HW) return f.y; } // round 24: the paved apron at the stair's foot
  const ld = way.land;
  if (ld) { const dx = x - ld.x, dz = z - ld.z, lx = dx * ld.c - dz * ld.s, lz = dx * ld.s + dz * ld.c; if (Math.abs(lx) < 5 && Math.abs(lz) < 5) return ld.y; }
  const tr = way.terrace;
  if (tr) { const dx = x - tr.x, dz = z - tr.z; if (Math.abs(dx * tr.ux + dz * tr.uz) < tr.hl && Math.abs(dx * tr.nx + dz * tr.nz) < tr.hw) return tr.y; }
  const br = way.bridge;
  if (br) { const u = ((x - br.a[0]) * br.ux + (z - br.a[1]) * br.uz) / br.L, v = (x - br.a[0]) * br.nx + (z - br.a[1]) * br.nz;
    if (u >= 0 && u <= 1 && Math.abs(v) < 1.8) return br.yAt(u); }
  { const c = crownGround(x, z); if (c > -Infinity) return c; } // round 25: the crown deck, forecourt, stair and porch
  // round 24: the winding road is walkable from the bridge to the crown (rule 4: nothing drawn as a road is decor only)
  if (Math.hypot(x - P.summit[0], z - P.summit[1]) < 110) {
    for (let i = ROAD_J + 1; i < ROAD.length; i++) { const [px, pz, py] = ROAD[i - 1], [qx, qz, qy] = ROAD[i], dx = qx - px, dz = qz - pz, L2 = dx * dx + dz * dz;
      const t = ((x - px) * dx + (z - pz) * dz) / L2; if (t < -0.05 || t > 1.05) continue;
      if (Math.abs(((x - px) * dz - (z - pz) * dx) / Math.sqrt(L2)) < 1.8) return py + (qy - py) * Math.max(0, Math.min(1, t)) + 0.25; } }
  return -Infinity;
}
// the stair's foot, the landing and a step through the gate: the last legs of the "Climb to the crest" walk
export const CREST_STAIR = (() => { // round 20: the foot, each landing of the zigzag, the top step, through the gate
  const [ax, az] = PILGRIM.axis, [fx, fz] = PILGRIM.foot, [lx, lz] = LAND;
  return [[fx - ax * 2, fz - az * 2], PILGRIM.foot, ...PILGRIM.landings.map(l => [l.x, l.z]), PILGRIM.top, LAND, [lx + ax * 3, lz + az * 3]];
})();

export function cragWay(S, M) {
  const G = new THREE.Group(); G.name = 'cragWay'; S.add(G);
  // Round 20: Wendell answered cc-heaven-r19 C, "Make the stair gentle and zigzag". The plan is layout.js's PILGRIM:
  // 148 risers of 0.17 m on 0.28 m treads, four flights crossing the slope and turning on round landings, and a last
  // straight flight up the axis to the gate. Each tread is a stone block down to the ground under it; low walls run
  // along both sides of each flight, stepped every three treads, and round the outside of each landing.
  { const { R, HW, flights, landings } = PILGRIM, WT = 0.3, wy = HW - WT / 2;
    const lowUnder = (x, z, ux, uz, nx, nz, len, half) => { let low = 1e9;
      for (const t of [-0.5, 0, 0.5]) for (const s of [-half, 0, half]) low = Math.min(low, heightAt(x + ux * t * len + nx * s, z + uz * t * len + nz * s)); return low; };
    for (const f of flights) {
      for (let k = 0; k < f.m - 1; k++) {
        const sc = f.s0 + (k + 0.5) * TREAD, x = f.a[0] + f.ux * sc, z = f.a[1] + f.uz * sc, top = f.y + R * (k + 1);
        const low = lowUnder(x, z, f.ux, f.uz, f.nx, f.nz, TREAD, TW), hgt = top - low + 0.6;
        const st = box(G, TREAD + 0.01, hgt, TW * 2, M.plinth, x, top - hgt / 2, z); st.rotation.y = f.ry;
        if (k % 2 === 0) { const n = Math.min(2, f.m - 1 - k), sm = f.s0 + (k + n / 2) * TREAD, xm = f.a[0] + f.ux * sm, zm = f.a[1] + f.uz * sm, wt = f.y + R * (k + n) + 0.4, // round 22: a 0.4 m kerb in pairs (was 0.75 m in threes), so side views see the feet
             len = n * TREAD + 0.02;
          for (const sg of [-1, 1]) { const wx = xm + f.nx * wy * sg, wz = zm + f.nz * wy * sg, wl = lowUnder(wx, wz, f.ux, f.uz, f.nx, f.nz, len, 0.15), wh = wt - wl + 0.6;
            const w = box(G, len, wh, WT, M.stone, wx, wt - wh / 2, wz); w.rotation.y = f.ry; wallBox(wx, wz, len, WT, f.ry, wl - 0.6, wt); } }
      }
    }
    // round 24: a paved apron 3 m long at the court's height before the first tread, so the court meets the stair with
    // one riser (the earthwork had cut a 0.45 m trench in front of it)
    { const f = flights[0], sc = f.s0 - FOOT / 2, x = f.a[0] + f.ux * sc, z = f.a[1] + f.uz * sc, lo = lowUnder(x, z, f.ux, f.uz, f.nx, f.nz, FOOT, HW), h = f.y - lo + 0.6;
      const ap = box(G, FOOT, h, HW * 2, M.plinth, x, f.y - h / 2, z); ap.rotation.y = f.ry; }
    // the landings: a round stone platform, and a wall round its outside, open where a flight meets it
    landings.forEach((l, i) => {
      const r = l.r, low = (() => { let lo = 1e9; for (let a = 0; a < 12; a++) for (const q of [0, 0.6, 1]) lo = Math.min(lo, heightAt(l.x + Math.cos(a * Math.PI / 6) * r * q, l.z + Math.sin(a * Math.PI / 6) * r * q)); return lo; })();
      const h = l.y - low + 0.6, pad = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), M.plinth); pad.position.set(l.x, l.y - h / 2, l.z); pad.castShadow = pad.receiveShadow = true; G.add(pad);
      const open = [flights[i], flights[i + 1]].map((f, j) => Math.atan2(j ? f.uz : -f.uz, j ? f.ux : -f.ux)), half = Math.atan2(HW + 0.3, r);
      const NS = 20; for (let s = 0; s < NS; s++) { const th = (s + 0.5) / NS * Math.PI * 2;
        if (open.some(o => Math.abs(Math.atan2(Math.sin(th - o), Math.cos(th - o))) < half)) continue;
        const wr = r - WT / 2, wx = l.x + Math.cos(th) * wr, wz = l.z + Math.sin(th) * wr, len = 2 * Math.PI * wr / NS + 0.04, ry = -th + Math.PI / 2;
        const w = box(G, len, 0.4 + 0.6, WT, M.stone, wx, l.y + 0.4 - 0.5, wz); w.rotation.y = ry; wallBox(wx, wz, len, WT, ry, l.y - 0.6, l.y + 0.4); }
    }); }
  // the landing on the crest, and a gate on it facing the court
  { const [x, z] = LAND, y = heightAt(x, z), face = Math.atan2(P.great[0] - x, P.great[1] - z);
    const pad = box(G, 10, 3, 10, M.plinth, x, y - 1.35, z); pad.rotation.y = face;
    way.land = { x, z, y: y + 0.15, c: Math.cos(face), s: Math.sin(face) };
    const gate = paifang(M, { w: 6.5, h: 5.2, plaque: '登天' }); gate.position.set(x, y + 0.15, z); gate.rotation.y = face; G.add(gate);
    for (const px of [-6.5 / 2, -6.5 / 6.5, 6.5 / 6.5, 6.5 / 2]) wallBox(x + Math.cos(face) * px, z - Math.sin(face) * px, 0.5, 0.5, face, y, y + 5); }
  // the bridge over the saddle to the wall's foot: a deck with parapets on stone piers
  { const [a, b] = [LAND, ROAD[ROAD_J]], ya = heightAt(...a) + 0.15, yb = ROAD[ROAD_J][2] + 0.25, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    const n = Math.ceil(L / 2), ry = -Math.atan2(dz, dx), nx = -dz / L, nz = dx / L;
    // round 24: the deck stays level across the crest terrace and only then climbs to the road (rule 2: same height where they meet)
    const t0 = Math.min(0.9, 6.5 / L), yAt = t => ya + (yb - ya) * Math.max(0, (t - t0) / (1 - t0));
    way.bridge = { a, L, ux: dx / L, uz: dz / L, nx, nz, ya, yb, yAt };
    // round 22: the crest beyond the gate. A paved terrace 10 m wide and 6 m deep runs on from the gate toward the bridge, held
    // by a stone block down to the ground, with a 0.45 m kerb on its two sides and a stone lantern at each of its far corners.
    { const ux = dx / L, uz = dz / L, TL = 6, TWD = 10, cx = a[0] + ux * (TL / 2 + 0.5), cz = a[1] + uz * (TL / 2 + 0.5), top = ya;
      let lo = 1e9; for (const t of [0, 0.5, 1]) for (const s of [-1, 0, 1]) lo = Math.min(lo, heightAt(cx + ux * (t - 0.5) * TL + nx * s * TWD / 2, cz + uz * (t - 0.5) * TL + nz * s * TWD / 2));
      const th = Math.max(0.5, top - lo + 0.6), ter = box(G, TL, th, TWD, M.plinth, cx, top - th / 2, cz); ter.rotation.y = ry;
      way.terrace = { x: cx, z: cz, ux, uz, nx, nz, hl: TL / 2, hw: TWD / 2 - 0.3, y: top }; // round 24: walkable (rule 4)
      for (const sg of [-1, 1]) { const wx = cx + nx * (TWD / 2 - 0.15) * sg, wz = cz + nz * (TWD / 2 - 0.15) * sg;
        const k = box(G, TL, 0.45 + 0.1, 0.3, M.stone, wx, top + 0.225, wz); k.rotation.y = ry; wallBox(wx, wz, TL, 0.3, ry, top - 0.2, top + 0.45);
        const lx = cx + ux * (TL / 2 - 0.6) + nx * (TWD / 2 - 0.15) * sg, lz = cz + uz * (TL / 2 - 0.6) + nz * (TWD / 2 - 0.15) * sg;
        const base = box(G, 0.5, 0.5, 0.5, M.stone, lx, top + 0.25, lz), post = box(G, 0.22, 0.9, 0.22, M.stone, lx, top + 0.95, lz), cap = box(G, 0.55, 0.14, 0.55, M.stone, lx, top + 1.5, lz), box_ = box(G, 0.34, 0.34, 0.34, M.stone, lx, top + 1.74, lz);
        wallBox(lx, lz, 0.5, 0.5, 0, top - 0.2, top + 1.9); [base, post, cap, box_].forEach(m => { m.rotation.y = ry; }); } }
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = a[0] + dx * t, z = a[1] + dz * t, y = yAt(t);
      const d = box(G, L / n + 0.05, 0.8, 4, M.plinth, x, y - 0.4, z); d.rotation.y = ry;
      for (const s of [-1, 1]) { const wx = x + nx * 2 * s, wz = z + nz * 2 * s, w = box(G, L / n + 0.05, 1.1, 0.45, M.stone, wx, y + 0.55, wz); w.rotation.y = ry;
        if (t * L > 5.5) wallBox(wx, wz, L / n + 0.05, 0.45, ry, y - 0.8, y + 1.1); }
      if (k % 4 === 2) { const g = Math.min(heightAt(x + nx * 1.5, z + nz * 1.5), heightAt(x - nx * 1.5, z - nz * 1.5)), h = y - 0.8 - g + 2;
        if (h > 1.5) { if (h <= 4) { const pr = box(G, 2.4, h, 3.6, M.stone, x, g - 2 + h / 2, z); pr.rotation.y = ry; }
          else { // round 23: over a real hollow (the ground is 10 m under the deck here) the pier is a slim trestle, two 0.8 m posts with a cross-beam, not one 12 m slab
            for (const sg of [-1, 1]) { const px = x + nx * 1.2 * sg, pz = z + nz * 1.2 * sg, gp = heightAt(px, pz), hp = y - 0.8 - gp + 1, post = box(G, 0.8, hp, 0.8, M.stone, px, gp - 1 + hp / 2, pz); post.rotation.y = ry; }
            const bm = box(G, 1.2, 0.6, 3.6, M.stone, x, y - 1.1, z); bm.rotation.y = ry; } } } } }
  // rock outcrops on the ridge either side of the way, flat-faced like the crag
  { const geo = new THREE.DodecahedronGeometry(1, 0), mat = new THREE.MeshStandardMaterial({ color: '#b3a68f', roughness: 1, flatShading: true });
    const R = new THREE.InstancedMesh(geo, mat, 70), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const [sx, sz] = P.summit; let nr = 0;
    for (let n = 0; n < 1500 && nr < 70; n++) {
      const th = _tg + (hash(n * 6.1 + 2) - 0.5) * 1.9, d = 56 + hash(n * 3.7 + 1) * 80, x = sx + Math.cos(th) * d, z = sz + Math.sin(th) * d, y = heightAt(x, z);
      if (y < 26 || nearWay(x, z) < 5 || Math.hypot(x - P.great[0], z - P.great[1]) < 38) continue;
      const s = 1.2 + hash(n * 9.7) * 2.8; e.set(hash(n) * 3, hash(n * 2.3) * 6, hash(n * 4.1) * 3); q.setFromEuler(e);
      sc.set(s * 1.4, s * 0.8, s * 1.1); p.set(x, y + s * 0.15, z); m.compose(p, q, sc); R.setMatrixAt(nr++, m);
    }
    R.count = nr; R.castShadow = R.receiveShadow = true; G.add(R); }
  return G;
}

// Round 16: the cliff as its own rock mesh. Wendell scored round 14d a 5 and named the real problem: the mountain
// behind the hall looked fuzzy and distorted. The cliff was the 3 m ground grid stretched over 50 m of drop, so each
// triangle spanned about 12 m of height and the rock bands aliased into smears. Here the face is cut as the painting
// draws it: pale stone in vertical pillars with flat planes, a ledge every few storeys and pines in the ledges. It stands
// just outside the walkable cliff, so the ground and the avatar keep reading heightAt.
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const N_TH = 58; // about 5 m pillars
const pillar = th => { const u = ((th / (Math.PI * 2)) % 1 + 1) % 1, k = Math.floor(u * N_TH); return k; };
// outward radius of the rock face at bearing th and height y
export function cliffR(th, y) {
  const k = pillar(th), slope = 3.2 + 1.6 * cragNoise(th * 3 + 1);
  const ledge = Math.floor((90 - y) / 7.5), lean = (hash(k * 3.1) - 0.5) * 0.06;
  const out = 1.4 + hash(k) * 3.6 + hash(k * 7 + ledge * 13) * 1.1 + ledge * 0.35;
  return rimAt(th) + Math.max(0, 90 - y) / slope + out + (90 - y) * lean;
}

export function cragRock(S) {
  const [sx, sz] = P.summit, NT = N_TH * 4, levels = [];
  for (let y = 90.4; y > 18; y -= 1.25) levels.push(y);
  const NY = levels.length, pos = [], col = [], c = new THREE.Color();
  // round 17: warm stone, as the painting's sunlit crag
  const tones = ['#ddd1bb', '#d1c5ae', '#c3b8a3', '#b5ab98'].map(h => new THREE.Color(h));
  const V = (j, i) => { // vertex (bearing i, level j) -> [x, y, z]
    const th = i / NT * Math.PI * 2, y = levels[j], r = j === 0 ? rimAt(th) - 3 : cliffR(th, y);
    return [sx + Math.cos(th) * r, y, sz + Math.sin(th) * r];
  };
  const grid = [];
  for (let j = 0; j < NY; j++) { grid.push([]); for (let i = 0; i <= NT; i++) grid[j].push(V(j, i)); }
  // each bearing's face ends a few metres under the ground it meets
  const bottom = [];
  for (let i = 0; i <= NT; i++) { let j = 1; while (j < NY - 1) { const [x, y, z] = grid[j][i]; if (heightAt(x, z) >= y + 0.5) break; j++; } bottom.push(Math.min(NY - 1, j + 2)); }
  for (let i = 0; i < NT; i++) {
    const k = pillar((i + 0.5) / NT * Math.PI * 2), jb = Math.max(bottom[i], bottom[i + 1]);
    for (let j = 0; j < jb; j++) {
      const a = grid[j][i], b = grid[j][i + 1], d = grid[j + 1][i], e = grid[j + 1][i + 1];
      const ledge = Math.floor((90 - levels[j]) / 7.5), t = tones[Math.floor(hash(k * 5 + ledge * 3) * 4)];
      c.copy(t);
      if (pillar(i / NT * Math.PI * 2) !== pillar((i + 1) / NT * Math.PI * 2)) c.multiplyScalar(0.78); // the joint between pillars
      if (j === 0) c.set('#a9a79f');
      const streak = hash(i * 1.7) > 0.86 ? 0.82 : 1; c.multiplyScalar(streak * (1 - Math.max(0, levels[j] - 30 < 8 ? (8 - (levels[j] - 30)) * 0.02 : 0)));
      // wind each triangle so its front faces out from the summit; the grid's own order faced in on much of the crag,
      // so the face was culled and the black strips were the joints seen from inside (round 17)
      for (const [p, q, r] of [[a, d, b], [b, d, e]]) {
        const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
        const nx = uy * vz - uz * vy, nz = ux * vy - uy * vx, ox = p[0] + q[0] + r[0] - 3 * sx, oz = p[2] + q[2] + r[2] - 3 * sz;
        if (nx * ox + nz * oz < 0) pos.push(...p, ...r, ...q); else pos.push(...p, ...q, ...r);
      }
      for (let q = 0; q < 6; q++) col.push(c.r, c.g, c.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // round 17: each flat facet takes a little more light the more it turns toward the court, and the facets turned away
  // fall into a cool shade, so the pillars read as planes from the gate instead of one soft grey wall
  { const [gx, gz] = P.great, fx = gx - sx, fz = gz - sz, fl = Math.hypot(fx, fz), nr = g.attributes.normal, cl = g.attributes.color, shade = new THREE.Color('#a7a8ad');
    const ps = g.attributes.position;
    for (let v = 0; v < nr.count; v++) {
      // where a pillar steps back the face folds and its normal points into the rock, which rendered as black strips;
      // turn those normals outward so every facet takes the light
      const ox = ps.getX(v) - sx, oz = ps.getZ(v) - sz;
      if (nr.getX(v) * ox + nr.getZ(v) * oz < 0) nr.setXYZ(v, -nr.getX(v), -nr.getY(v), -nr.getZ(v));
      const f = (nr.getX(v) * fx + nr.getZ(v) * fz) / fl, up = nr.getY(v);
      c.setRGB(cl.getX(v), cl.getY(v), cl.getZ(v));
      if (f < 0) c.lerp(shade, Math.min(0.3, -f * 0.4)); else c.multiplyScalar(1 + f * 0.14);
      if (up > 0.5) c.multiplyScalar(1.08); // ledge tops catch the sky
      cl.setXYZ(v, c.r, c.g, c.b);
    } }
  const rock = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
  rock.name = 'cragRock'; rock.castShadow = rock.receiveShadow = true; S.add(rock);

  // pines and shrubs rooted in the ledges, as the painting's crag carries them
  const pineGeo = new THREE.ConeGeometry(1, 2.6, 7), bushGeo = new THREE.IcosahedronGeometry(1, 0);
  pineGeo.translate(0, 1.3, 0);
  const pines = new THREE.InstancedMesh(pineGeo, new THREE.MeshStandardMaterial({ color: '#3f5a3a', roughness: 1, flatShading: true }), 260);
  const bushes = new THREE.InstancedMesh(bushGeo, new THREE.MeshStandardMaterial({ color: '#56704a', roughness: 1, flatShading: true }), 140);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  let np = 0, nb = 0;
  for (let n = 0; n < 400 && (np < 90 || nb < 140); n++) {
    const th = hash(n * 3.3) * Math.PI * 2, ledge = 1 + Math.floor(hash(n * 5.9) * 6), y = 90 - ledge * 7.5 + 0.2;
    const r = cliffR(th, y + 0.6) - 0.6, x = sx + Math.cos(th) * r, z = sz + Math.sin(th) * r;
    if (heightAt(x, z) > y - 1) continue;
    const s = 0.8 + hash(n * 2.2) * 1.2;
    if (hash(n * 9.1) < 0.45 && np < 90) { sc.set(s * 1.1, s * 1.5, s * 1.1); p.set(x, y, z); m.compose(p, q, sc); pines.setMatrixAt(np++, m); }
    else if (nb < 140) { sc.set(s * 1.3, s * 0.7, s * 1.3); p.set(x, y + 0.3, z); m.compose(p, q, sc); bushes.setMatrixAt(nb++, m); }
  }
  // the ridge under the crag, where the axis climbs to its foot: a stand of pines either side of the way up, so from the
  // gate the shoulder behind the hall reads as wooded rock instead of a bare pale mound
  { const [gx, gz] = P.great, tg = Math.atan2(gz - sz, gx - sx);
    for (let n = 0; n < 2400 && np < 90 + 150; n++) {
      const th = tg + (hash(n * 4.7) - 0.5) * 1.6, d = 58 + hash(n * 8.3) * 70, x = sx + Math.cos(th) * d, z = sz + Math.sin(th) * d, y = heightAt(x, z);
      const off = Math.abs(Math.sin(th - tg) * d); if (y < 27 || off < 7 || Math.hypot(x - gx, z - gz) < 40 || nearWay(x, z) < 6) continue;
      const s = 1.6 + hash(n * 1.9) * 1.4; sc.set(s, s * 1.8, s); p.set(x, y - 0.3, z); m.compose(p, q, sc); pines.setMatrixAt(np++, m);
    } }
  pines.count = np; bushes.count = nb; pines.castShadow = bushes.castShadow = true; S.add(pines, bushes);
  return rock;
}

export function cragCrown(S, M) {
  cragRock(S); cragWay(S, M);
  const [sx, sz] = P.summit, G = new THREE.Group(); S.add(G);
  const at = (th, r) => [sx + Math.cos(th) * r, sz + Math.sin(th) * r];

  // the crown wall: a parapet with merlons a little inside the cliff's lip, the whole way round
  const n = 96;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
    const r0 = Math.max(30, rimAt(a0) - 2.5), r1 = Math.max(30, rimAt(a1) - 2.5);
    const [x0, z0] = at(a0, r0), [x1, z1] = at(a1, r1), L = Math.hypot(x1 - x0, z1 - z0);
    const am = (a0 + a1) / 2, gap = Math.atan2(Math.sin(am - CROWN.th), Math.cos(am - CROWN.th));
    if (Math.abs(gap) < Math.atan2(3.4, CROWN.rWall)) continue; // round 25: the crown gate's opening
    const seg = box(G, L + 0.3, 1.6, 0.9, M.stone, (x0 + x1) / 2, 90.8, (z0 + z1) / 2);
    seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    wallBox((x0 + x1) / 2, (z0 + z1) / 2, L + 0.3, 0.9, seg.rotation.y, 89.4, 91.6); // round 25: rule 7, the lip drops 20 m
    if (i % 2 === 0) { const m = box(G, 0.9, 0.7, 0.95, M.stone, (x0 + x1) / 2, 91.95, (z0 + z1) / 2); m.rotation.y = seg.rotation.y; }
  }

  // tiered halls on the crown's lip, facing the great court: a three-tier tower and two lower halls beside it.
  // Round 13c: about twice the size and brought out to the lip, the tower raised on a stepped stone podium, because from
  // the anchor view the round 13 halls read as specks on the rim where the painting's crown is mostly buildings.
  const place = (H, th, r, y = 90, k = 1) => { const [x, z] = at(th, r); H.position.set(x, y, z); H.rotation.y = Math.PI / 2 - th; H.scale.setScalar(k); G.add(H); return H; };
  // Round 26: Wendell's note on cc-heaven-r25: "Buildings are overlapping in a strange way". Measured as rectangles in
  // plan with their eaves, the tower's podium ran 12 m into the gate hall, and the gate hall, the tower and both lower
  // halls all cut into the founder's hall (world.js), which stands 30 m by 20 m at the crown's centre. The crown is about
  // 80 m across and cannot hold six buildings this size, so it is now one compound on the crown gate's axis, the way a
  // temple is laid out: the gate hall, then the founder's hall turned onto the same axis and set back 7.5 m, then the
  // Heaven altar. The tower stands on a stone base beside the founder's hall, facing the axis, at two thirds of its old
  // size, and the one-tier hall stands beside the gate hall. The two-tier hall at the back is gone. Every pair keeps at
  // least 2.5 m between eaves and every footprint stands inside the crown wall (council/callsheets/calrunian-sect.md).
  const ax = (r, v) => [sx + Math.cos(CROWN.th) * r + CROWN.nx * v, sz + Math.sin(CROWN.th) * r + CROWN.nz * v];
  const onAxis = (H, r, v, face, y = 90, k = 1) => { const [x, z] = ax(r, v); H.position.set(x, y, z); H.rotation.y = Math.PI / 2 - face; H.scale.setScalar(k); G.add(H); return H; };
  const sideL = Math.atan2(-CROWN.nz, -CROWN.nx), sideR = Math.atan2(CROWN.nz, CROWN.nx); // a side building's front faces the axis
  { const TS = 1.4, [x, z] = ax(1.5, -27); // the tower: three stepped stone tiers, the three-tier hall on top
    for (let i = 0; i < 3; i++) { const b = box(G, 19.9 - i * 1.5, 2.4, 15.6 - i * 1.5, M.stone, x, 90 + 1.2 + i * 2.4, z); b.rotation.y = Math.PI / 2 - sideR; }
    onAxis(hall(M, { w: 11, d: 8, ph: 4.4, tiers: 3, seed: 21 }), 1.5, -27, sideR, 97.2, TS); }
  // round 25: this hall stands on the crown gate's axis (CROWN), its plinth front behind the forecourt, its stair on the way
  { const H = place(hall(M, { w: 8, d: 6, ph: 3.6, tiers: 2, seed: 22 }), CROWN.th, CROWN.rHall, 90, 2);
    const c = Math.cos(H.rotation.y), s = Math.sin(H.rotation.y); // the hall's body stops the figure; the way ends at its door
    wayColliders.push({ x: H.position.x, z: H.position.z, c, s, hw: 8.6, hd: 6.4, y0: 90, y1: 98 }); }
  onAxis(hall(M, { w: 7, d: 5, ph: 3.4, tiers: 1, seed: 23 }), 20, 18.7, sideL, 90, 1.7); // round 26: was on the lip, eaves on the gate hall's

  // the winding wall: a walled road cut into the cliff, climbing from the crag's foot toward the great court round to
  // the crown, a turn and a quarter, held to the contour where the ground stands at the road's height
  // round 16: held to the new rock face, with a stone retaining wall under it so it reads built into the cliff.
  // Round 24: the nodes are ROAD (above), and the road starts where the bridge from the gate meets it (ROAD_START). The
  // parapet is a collider and an inner kerb keeps the figure off the cliff; the first segment's parapet is open for the bridge.
  let prev = null;
  for (let i = ROAD_START; i < ROAD.length; i++) {
    const [x, z, y, th] = ROAD[i];
    if (prev) {
      const [px, pz, py] = prev, L = Math.hypot(x - px, z - pz), ry = -Math.atan2(z - pz, x - px);
      const road = box(G, L + 0.4, 0.9, 3.6, M.plinth, (x + px) / 2, (y + py) / 2 - 0.2, (z + pz) / 2); road.rotation.y = ry;
      const [ox, oz] = [Math.cos(th) * 1.95, Math.sin(th) * 1.95];
      const ym = (y + py) / 2;
      if (i > ROAD_START + 1) { const wall = box(G, L + 0.4, 1.6, 0.8, M.stone, (x + px) / 2 + ox, ym + 0.8, (z + pz) / 2 + oz); wall.rotation.y = ry;
        wallBox((x + px) / 2 + ox, (z + pz) / 2 + oz, L + 0.4, 0.8, ry, ym, ym + 1.6); }
      if (i < ROAD.length - 1) { const kx = (x + px) / 2 - ox, kz = (z + pz) / 2 - oz, k = box(G, L + 0.4, 0.45, 0.3, M.stone, kx, ym + 0.25 + 0.2, kz); k.rotation.y = ry;
        wallBox(kx, kz, L + 0.4, 0.3, ry, ym, ym + 0.7); } // round 25: the last segment's inner side opens onto the crown deck
      const base = box(G, L + 0.4, 6, 9, M.stone, (x + px) / 2 - ox * 1.2, (y + py) / 2 - 3.6, (z + pz) / 2 - oz * 1.2); base.rotation.y = ry;
      if (i % 3 === 0) { const m = box(G, 0.8, 0.6, 0.85, M.stone, x + ox, y + 1.9, z + oz); m.rotation.y = ry; }
    }
    prev = [x, z, y];
  }
  crownGate(G, M);
  return G;
}

// Round 25: the road's top against the crown. Wendell answered cc-heaven-r24 A. The check found the winding road's last
// node 8 m outside the crown's rim and 0.75 m below it, over a 20 m drop, with the crown's parapet closed all the way
// round: the road stopped in the air facing a wall (walkability rules 2 and 6). Now a stone deck turns off the road's
// top, climbs 0.75 m over 10 m (1 in 14, rule 3) through a gate in the crown wall onto a paved forecourt, and a stair of
// eight 0.175 m risers on 0.28 m treads climbs the two-tier hall's plinth to its door, where the way ends (rule 6).
export const CROWN = (() => { const [ex, ez, ey, th] = ROAD[ROAD.length - 1], [sx, sz] = P.summit, rE = Math.hypot(ex - sx, ez - sz);
  const rWall = Math.max(30, rimAt(th) - 2.5), FC = 6, RISE = 1.4, NR = 8, RUN = (NR - 1) * TREAD;
  const rStair = rWall - 0.45 - FC, rPlinth = rStair - RUN, rHall = rPlinth - 7; // the hall's plinth is 7 m deep in front of its centre (scale 2)
  return { th, ux: -Math.cos(th), uz: -Math.sin(th), nx: Math.sin(th), nz: -Math.cos(th), rE, rWall, rStair, rPlinth, rHall, yE: ey + 0.25, y0: 90, NR, R: RISE / NR, RUN,
    at: r => [sx + Math.cos(th) * r, sz + Math.sin(th) * r] }; })();
const CW = 1.8; // half the deck's walkable width
// the crown way's ground at (x, z): the deck, the forecourt, the stair and the porch, or -Infinity off it
export function crownGround(x, z) {
  const C = CROWN, [sx, sz] = P.summit, dx = x - sx, dz = z - sz, r = dx * -C.ux + dz * -C.uz, v = dx * C.nx + dz * C.nz;
  if (r > C.rE + 0.3 || r < C.rPlinth - 1.2) return -Infinity;
  if (r >= C.rWall && Math.abs(v) < CW) return C.yE + (C.y0 - C.yE) * Math.min(1, (C.rE - r) / (C.rE - C.rWall)); // the deck
  if (r >= C.rStair && r < C.rWall && Math.abs(v) < 5) return C.y0 + 0.02; // the forecourt's paving
  if (r < C.rStair && r >= C.rPlinth && Math.abs(v) < 1.5) { const k = Math.floor((C.rStair - r) / TREAD); return C.y0 + C.R * (k + 1); } // the stair
  if (r < C.rPlinth && Math.abs(v) < 8.5) return C.y0 + C.NR * C.R; // the porch on the hall's plinth
  return -Infinity;
}
function crownGate(G, M) {
  const C = CROWN, ry = Math.PI / 2 - C.th, at = (r, v) => { const [x, z] = C.at(r); return [x + C.nx * v, z + C.nz * v]; };
  // the deck: one slab per metre, a 1.1 m parapet each side, and a 3 m stone corbel under its outer half into the rock
  const n = Math.ceil(C.rE - C.rWall);
  for (let k = 0; k < n; k++) { const r = C.rE - (k + 0.5) * (C.rE - C.rWall) / n, y = crownGround(...C.at(r)), L = (C.rE - C.rWall) / n + 0.05, [x, z] = C.at(r);
    const d = box(G, 4, 0.8, L, M.plinth, x, y - 0.4, z); d.rotation.y = ry;
    const cb = box(G, 3.4, 3, L, M.stone, x, y - 0.8 - 1.5, z); cb.rotation.y = ry;
    for (const sg of [-1, 1]) { if (k === 0 && sg === 1) continue; // the side the road comes from stays open at the turn
      const [wx, wz] = at(r, 2 * sg), w = box(G, 0.45, 1.1, L, M.stone, wx, y + 0.55, wz); w.rotation.y = ry;
      wayColliders.push({ x: wx, z: wz, c: Math.cos(ry), s: Math.sin(ry), hw: 0.225, hd: L / 2, y0: y - 0.8, y1: y + 1.1 }); } }
  // the road's end beyond the turn: a wall across it, so the road stops at the deck and not at the air
  { const [ex, ez, , ] = ROAD[ROAD.length - 1], [px, pz] = ROAD[ROAD.length - 2], tl = Math.hypot(ex - px, ez - pz), tx = (ex - px) / tl, tz = (ez - pz) / tl;
    const wx = ex + tx * 2.3, wz = ez + tz * 2.3, wr = -Math.atan2(tz, tx) + Math.PI / 2, w = box(G, 4.2, 1.1, 0.5, M.stone, wx, C.yE + 0.55, wz); w.rotation.y = wr;
    wayColliders.push({ x: wx, z: wz, c: Math.cos(wr), s: Math.sin(wr), hw: 2.1, hd: 0.25, y0: C.yE - 0.5, y1: C.yE + 1.1 }); }
  // the crown gate: a paifang in the wall's opening, square to the deck, with stub walls closing the opening to its posts
  { const [x, z] = C.at(C.rWall), g = paifang(M, { w: 6.5, h: 5.2, plaque: '天冠' }); g.position.set(x, C.y0, z); g.rotation.y = ry; G.add(g);
    for (const px of [-6.5 / 2, -6.5 / 6.5, 6.5 / 6.5, 6.5 / 2]) { const [qx, qz] = at(C.rWall, px); wayColliders.push({ x: qx, z: qz, c: 1, s: 0, hw: 0.25, hd: 0.25, y0: C.y0 - 0.5, y1: C.y0 + 5 }); }
    for (const sg of [-1, 1]) { const [wx, wz] = at(C.rWall, sg * 3.3 + sg * 0.5), w = box(G, 1.2, 1.6, 0.9, M.stone, wx, 90.8, wz); w.rotation.y = ry;
      wayColliders.push({ x: wx, z: wz, c: Math.cos(ry), s: Math.sin(ry), hw: 0.6, hd: 0.45, y0: 89.4, y1: 91.6 }); } }
  // the forecourt: paving 10 m wide from the gate to the stair, a stone lantern at each corner by the hall
  { const r = (C.rWall + C.rStair) / 2, [x, z] = C.at(r), fl = box(G, 10, 0.3, C.rWall - C.rStair, M.paving, x, C.y0 - 0.13, z); fl.rotation.y = ry;
    for (const sg of [-1, 1]) { const [lx, lz] = at(C.rStair + 0.8, sg * 4.2), base = box(G, 0.5, 0.5, 0.5, M.stone, lx, C.y0 + 0.25, lz), post = box(G, 0.22, 0.9, 0.22, M.stone, lx, C.y0 + 0.95, lz),
        cap = box(G, 0.55, 0.14, 0.55, M.stone, lx, C.y0 + 1.5, lz), bx = box(G, 0.34, 0.34, 0.34, M.stone, lx, C.y0 + 1.74, lz);
      wayColliders.push({ x: lx, z: lz, c: 1, s: 0, hw: 0.25, hd: 0.25, y0: C.y0 - 0.2, y1: C.y0 + 1.9 }); [base, post, cap, bx].forEach(m => { m.rotation.y = ry; }); } }
  // the stair up the hall's plinth: seven treads, the eighth riser lands on the porch; a 0.4 m cheek wall each side (rule 7)
  for (let k = 0; k < C.NR - 1; k++) { const r = C.rStair - (k + 0.5) * TREAD, top = C.y0 + C.R * (k + 1), [x, z] = C.at(r), st = box(G, 3, top - C.y0 + 0.2, TREAD + 0.01, M.plinth, x, (top + C.y0 - 0.2) / 2, z); st.rotation.y = ry; }
  for (const sg of [-1, 1]) { const r = C.rStair - C.RUN / 2, [wx, wz] = at(r, sg * 1.65), h = C.NR * C.R + 0.4, w = box(G, 0.3, h, C.RUN + 0.1, M.stone, wx, C.y0 + h / 2 - 0.05, wz); w.rotation.y = ry;
    wayColliders.push({ x: wx, z: wz, c: Math.cos(ry), s: Math.sin(ry), hw: 0.15, hd: C.RUN / 2, y0: C.y0, y1: C.y0 + h }); }
}

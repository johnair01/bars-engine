// Round 13: the summit crag's crown, as the anchor painting draws it. Wendell scored round 12 a 3/10; the green dome
// behind the great court was the farthest thing from his painting, where a grey rock tower stands behind the hall with
// a walled crown, tiered halls on its lip and a wall that winds down its face. layout.js now shapes the cliff; this
// module builds what stands on it, in world coordinates, every piece seated on heightAt.
import * as THREE from 'three';
import { hall, box, paifang } from './kit.js';
import { heightAt, P, CRAG, cragNoise, AXIS } from './layout.js';

const rimAt = th => CRAG.rim + cragNoise(th) * 7;

// Round 17: the way up the ridge. From the gate the slope in front of the crag was one pale, empty mound. The painting's
// crag is reached by a pilgrim stair; here a stone stair climbs from the great court's back edge to a landing with a gate
// on the ridge's crest (the axis point at +50), and a bridge carries the way over the saddle behind it to the foot of the
// winding wall, so the eye can follow one road from the hall to the crown.
const _tg = Math.atan2(P.great[1] - P.summit[1], P.great[0] - P.summit[0]);
const WALL_TH = _tg - 1.1, WALL_Y = 46; // where the winding wall starts (cragCrown)
const wallFoot = () => { const th = WALL_TH, dy = 90 - WALL_Y, slope = 3.2 + 1.6 * cragNoise(th * 3 + 1);
  const r = rimAt(th) + dy / slope + 7.8 + Math.floor(dy / 7.5) * 0.35 + dy * 0.03; return [P.summit[0] + Math.cos(th) * r, P.summit[1] + Math.sin(th) * r]; };
const LAND = AXIS[9], STAIR0 = [P.great[0] + (LAND[0] - P.great[0]) * 0.5, P.great[1] + (LAND[1] - P.great[1]) * 0.5];
const WAY = [STAIR0, LAND, wallFoot()];
function nearWay(x, z) { let best = 1e9;
  for (let i = 1; i < WAY.length; i++) { const [a, b] = [WAY[i - 1], WAY[i]], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); best = Math.min(best, Math.hypot(x - a[0] - k * dx, z - a[1] - k * dz)); }
  return best; }

export function cragWay(S, M) {
  const G = new THREE.Group(); G.name = 'cragWay'; S.add(G);
  // the stair: treads about 1.1 m deep, each set level on the highest ground under it, with a low wall either side
  { const [a, b] = [STAIR0, LAND], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), n = Math.ceil(L / 1.1), ry = -Math.atan2(dz, dx), nx = -dz / L, nz = dx / L;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, tm = (t0 + t1) / 2, x = a[0] + dx * tm, z = a[1] + dz * tm;
      let top = -1e9, low = 1e9; for (const t of [t0, tm, t1]) for (const s of [-2.4, 0, 2.4]) { const h = heightAt(a[0] + dx * t + nx * s, a[1] + dz * t + nz * s); top = Math.max(top, h); low = Math.min(low, h); }
      top += 0.18; const hgt = top - low + 0.8;
      const st = box(G, L / n + 0.04, hgt, 4.2, M.plinth, x, top - hgt / 2, z); st.rotation.y = ry;
      for (const s of [-1, 1]) { const w = box(G, L / n + 0.06, hgt + 0.7, 0.55, M.stone, x + nx * 2.35 * s, top + 0.35 - hgt / 2, z + nz * 2.35 * s); w.rotation.y = ry; }
    } }
  // the landing on the crest, and a gate on it facing the court
  { const [x, z] = LAND, y = heightAt(x, z), face = Math.atan2(P.great[0] - x, P.great[1] - z);
    const pad = box(G, 10, 3, 10, M.plinth, x, y - 1.35, z); pad.rotation.y = face;
    const gate = paifang(M, { w: 6.5, h: 5.2, plaque: '登天' }); gate.position.set(x, y + 0.15, z); gate.rotation.y = face; G.add(gate); }
  // the bridge over the saddle to the wall's foot: a deck with parapets on stone piers
  { const [a, b] = [LAND, WAY[2]], ya = heightAt(...a) + 0.15, yb = WALL_Y, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
    const n = Math.ceil(L / 2), ry = -Math.atan2(dz, dx), nx = -dz / L, nz = dx / L;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = a[0] + dx * t, z = a[1] + dz * t, y = ya + (yb - ya) * t;
      const d = box(G, L / n + 0.05, 0.8, 4, M.plinth, x, y - 0.4, z); d.rotation.y = ry;
      for (const s of [-1, 1]) { const w = box(G, L / n + 0.05, 1.1, 0.45, M.stone, x + nx * 2 * s, y + 0.55, z + nz * 2 * s); w.rotation.y = ry; }
      if (k % 4 === 2) { const g = Math.min(heightAt(x + nx * 1.5, z + nz * 1.5), heightAt(x - nx * 1.5, z - nz * 1.5)), h = y - 0.8 - g + 2;
        if (h > 1.5) { const pr = box(G, 2.4, h, 3.6, M.stone, x, g - 2 + h / 2, z); pr.rotation.y = ry; } } } }
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
  const toGreat = Math.atan2(P.great[1] - sz, P.great[0] - sx);
  const at = (th, r) => [sx + Math.cos(th) * r, sz + Math.sin(th) * r];

  // the crown wall: a parapet with merlons a little inside the cliff's lip, the whole way round
  const n = 96;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
    const r0 = Math.max(30, rimAt(a0) - 2.5), r1 = Math.max(30, rimAt(a1) - 2.5);
    const [x0, z0] = at(a0, r0), [x1, z1] = at(a1, r1), L = Math.hypot(x1 - x0, z1 - z0);
    const seg = box(G, L + 0.3, 1.6, 0.9, M.stone, (x0 + x1) / 2, 90.8, (z0 + z1) / 2);
    seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    if (i % 2 === 0) { const m = box(G, 0.9, 0.7, 0.95, M.stone, (x0 + x1) / 2, 91.95, (z0 + z1) / 2); m.rotation.y = seg.rotation.y; }
  }

  // tiered halls on the crown's lip, facing the great court: a three-tier tower and two lower halls beside it.
  // Round 13c: about twice the size and brought out to the lip, the tower raised on a stepped stone podium, because from
  // the anchor view the round 13 halls read as specks on the rim where the painting's crown is mostly buildings.
  const place = (H, th, r, y = 90, k = 1) => { const [x, z] = at(th, r); H.position.set(x, y, z); H.rotation.y = Math.PI / 2 - th; H.scale.setScalar(k); G.add(H); return H; };
  { const th = toGreat - 0.45, r = rimAt(th) - 15, [x, z] = at(th, r);
    for (let i = 0; i < 3; i++) { const b = box(G, 30 - i * 5, 2.4, 24 - i * 4, M.stone, x, 90 + 1.2 + i * 2.4, z); b.rotation.y = Math.PI / 2 - th; }
    place(hall(M, { w: 11, d: 8, ph: 4.4, tiers: 3, seed: 21 }), th, r, 97.2, 2.1); }
  place(hall(M, { w: 8, d: 6, ph: 3.6, tiers: 2, seed: 22 }), toGreat + 0.1, rimAt(toGreat + 0.1) - 11, 90, 2);
  place(hall(M, { w: 7, d: 5, ph: 3.4, tiers: 1, seed: 23 }), toGreat + 0.62, rimAt(toGreat + 0.62) - 10, 90, 1.9);
  place(hall(M, { w: 9, d: 7, ph: 4, tiers: 2, seed: 24 }), toGreat + Math.PI, 18, 90, 1.8);

  // the winding wall: a walled road cut into the cliff, climbing from the crag's foot toward the great court round to
  // the crown, a turn and a quarter, held to the contour where the ground stands at the road's height
  const steps = 150, start = toGreat - 1.1, turn = Math.PI * 2.4, yLo = 46, yHi = 89;
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, th = start + t * turn, y = yLo + (yHi - yLo) * t;
    // round 16: held to the new rock face, with a stone retaining wall under it so it reads built into the cliff
    const slope = 3.2 + 1.6 * cragNoise(th * 3 + 1), dy = Math.max(0, 90 - y);
    const r = rimAt(th) + dy / slope + 7.8 + Math.floor(dy / 7.5) * 0.35 + dy * 0.03, [x, z] = at(th, r); // smooth: clears every pillar
    if (prev) {
      const [px, pz, py] = prev, L = Math.hypot(x - px, z - pz), ry = -Math.atan2(z - pz, x - px);
      const road = box(G, L + 0.4, 0.9, 3.6, M.plinth, (x + px) / 2, (y + py) / 2 - 0.2, (z + pz) / 2); road.rotation.y = ry;
      const [ox, oz] = [Math.cos(th) * 1.95, Math.sin(th) * 1.95];
      const wall = box(G, L + 0.4, 1.6, 0.8, M.stone, (x + px) / 2 + ox, (y + py) / 2 + 0.8, (z + pz) / 2 + oz); wall.rotation.y = ry;
      const base = box(G, L + 0.4, 6, 9, M.stone, (x + px) / 2 - ox * 1.2, (y + py) / 2 - 3.6, (z + pz) / 2 - oz * 1.2); base.rotation.y = ry;
      if (i % 3 === 0) { const m = box(G, 0.8, 0.6, 0.85, M.stone, x + ox, y + 1.9, z + oz); m.rotation.y = ry; }
    }
    prev = [x, z, y];
  }
  return G;
}

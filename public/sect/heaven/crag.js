// Round 13: the summit crag's crown, as the anchor painting draws it. Wendell scored round 12 a 3/10; the green dome
// behind the great court was the farthest thing from his painting, where a grey rock tower stands behind the hall with
// a walled crown, tiered halls on its lip and a wall that winds down its face. layout.js now shapes the cliff; this
// module builds what stands on it, in world coordinates, every piece seated on heightAt.
import * as THREE from 'three';
import { hall, box } from './kit.js';
import { heightAt, P, CRAG, cragNoise } from './layout.js';

const rimAt = th => CRAG.rim + cragNoise(th) * 7;

export function cragCrown(S, M) {
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
    let lo = rimAt(th) - 3, hi = 75;
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; const [x, z] = at(th, mid); if (heightAt(x, z) > y) lo = mid; else hi = mid; }
    const [x, z] = at(th, lo + 1.6);
    if (prev) {
      const [px, pz, py] = prev, L = Math.hypot(x - px, z - pz), ry = -Math.atan2(z - pz, x - px);
      const road = box(G, L + 0.4, 0.9, 3.2, M.plinth, (x + px) / 2, (y + py) / 2 - 0.2, (z + pz) / 2); road.rotation.y = ry;
      const [ox, oz] = [Math.cos(th) * 1.7, Math.sin(th) * 1.7];
      const wall = box(G, L + 0.4, 1.5, 0.6, M.stone, (x + px) / 2 + ox, (y + py) / 2 + 0.75, (z + pz) / 2 + oz); wall.rotation.y = ry;
      if (i % 3 === 0) { const m = box(G, 0.7, 0.55, 0.65, M.stone, x + ox, y + 1.75, z + oz); m.rotation.y = ry; }
    }
    prev = [x, z, y];
  }
  return G;
}

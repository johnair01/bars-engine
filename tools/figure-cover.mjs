/* The robe's cover, authored once per cut (the robe-slit build, docs/3d-math.md rule 8: hide what clothes cover, measured with
   rays): which trouser points a cut's robe covers in every pose, so wardrobe.js mask() hides only those. From each trouser
   point, rays go out along its normal and two rings around it (figure-rig.mjs looks); the point is covered only if every ray
   crosses a drawn robe triangle (rest height at the crossing above the cut's hem) or meets the floor, in every sampled pose of the Walk, the
   Idle and the sit, on the four builds (shape a) and shapes b and c. So the side slits, which open as the legs move, are
   never covered, and MARGIN above each hem stays drawn (a shin swinging out under the hem must not show a hole).
     THREE_DIR=<three@0.160.0 folder> node tools/figure-cover.mjs     -> public/between/m/dusk/robe-cover.json */
import fs from 'node:fs';
import path from 'node:path';
import { parts, figure, look, posed, normals, bvh, looks, toFloor, POSES, BUILDS, CUTS, CUT, hemOf, DUSK } from './figure-rig.mjs';

export const MARGIN = 0.12;
const P = await parts({ cover: false }), f = figure(P), L = f.w.layers;
const n = L.pantsSrc.length, low = new Float32Array(n).fill(Infinity);   // per trouser point: the lowest cover height seen
const bodies = [...BUILDS.map(b => ['a', b]), ['b', 'average'], ['c', 'average']];
let frames = 0;
for (const [shape, build] of bodies) {
  f.w.set(look(build, 'coat', shape));
  for (const [, run] of POSES()) run(f, () => {
    frames++;
    const rp = posed(L.robe), ry = L.robe.geometry.attributes.restY.array, rix = L.robe.geometry.index.array, R = bvh(rp, rix);
    const pp = posed(L.pants), pn = normals(pp, L.pantsIndex);
    for (let k = 0; k < n; k++) { if (low[k] < 0) continue;
      const o = [pp[k * 3], pp[k * 3 + 1], pp[k * 3 + 2]]; let h = Infinity;
      for (const d of looks([pn[k * 3], pn[k * 3 + 1], pn[k * 3 + 2]])) { let top = -1;
        R.hits([o[0] + d[0] * 1e-3, o[1] + d[1] * 1e-3, o[2] + d[2] * 1e-3], d, 1.5, (t, tri, u, v) => { const y = ry[rix[tri * 3]] * (1 - u - v) + ry[rix[tri * 3 + 1]] * u + ry[rix[tri * 3 + 2]] * v; if (y > top) top = y; });
        if (toFloor(o, d) < 1.5) top = Infinity;
        h = Math.min(h, top); if (h < 0) break; }
      low[k] = Math.min(low[k], h); }
  });
}
const cuts = {};
for (const c of CUTS) { const hem = hemOf(CUT[c]), s = new Set();
  for (let k = 0; k < n; k++) if (L.pantsY[k] >= hem + MARGIN && low[k] >= hem) s.add(L.pantsSrc[k]);
  cuts[c] = [...s].sort((a, b) => a - b); }
const out = { note: 'trouser points (Average Dusk body point ids) each cut\'s robe covers in every pose; made by tools/figure-cover.mjs', margin: MARGIN, frames, points: n, cuts };
fs.writeFileSync(path.join(DUSK, 'robe-cover.json'), JSON.stringify(out) + '\n');
console.log(`robe-cover.json: ${frames} pose frames x ${bodies.length} bodies, ${n} trouser points; covered ` + CUTS.map(c => `${c} ${cuts[c].length}`).join(', '));

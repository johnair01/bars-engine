/* The legs probe (the robe-slit build, docs/3d-math.md rule 8: measure with rays, not nearest points). The mirror figure,
   posed as the page poses it (figure-rig.mjs: the Walk and the Idle played on with the skirt spring, the sit eased half in and
   full), on the four builds (shape a) under the three cuts, counts two things per pose frame:
   - through: drawn leg or trouser points with a drawn robe triangle between them and their leg's bone (the ray from the
     closest point on the thigh or shin axis out to the point crosses the robe more than TOL before it), i.e. legs through
     the robe (its body and skirt; the sleeves are left out, a hand at the thigh is the arm's matter);
   - void: hidden trouser points that can still be seen (one of the nine rays out of the point, figure-rig.mjs looks, meets
     no drawn robe, no drawn trouser and not the floor), i.e. a hole where the mask hides cloth that shows.
   Prints a table of point-frames and exits 1 when a total passes its line (LIMIT; the goal is zero).
     THREE_DIR=<three@0.160.0 folder> node tools/figure-legs-probe.mjs [--json] [--why: each point through] */
import { parts, figure, look, posed, normals, bvh, looks, toFloor, POSES, BUILDS, CUTS, CUT, THREE } from './figure-rig.mjs';

export const TOL = 0.002, WHY = process.argv.includes('--why');
// The lines, at what the robe-slit build reached (2026-10-24): walk 0, the Idle 10 (slender, at the seat), and the sit, where
// the seated thighs press the robe's hem band and the seat, the rest. The goal stays zero; a change that adds any fails.
export const LIMIT = { through: 520, void: 0 };
const P = await parts(), f = figure(P), L = f.w.layers, G = [['hipL', 'kneeL'], ['kneeL', 'ankleL'], ['hipR', 'kneeR'], ['kneeR', 'ankleR']];
const legBones = new Set(['hips', 'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR'].map(n => L.body.skeleton.bones.indexOf(f.bones[n].b)));
const bsi = L.body.geometry.attributes.skinIndex, bsw = L.body.geometry.attributes.skinWeight;
const bodyLeg = Uint8Array.from({ length: bsi.count }, (_, j) => { let b = 0, w = -1; for (let k = 0; k < 4; k++) if (bsw.getComponent(j, k) > w) { w = bsw.getComponent(j, k); b = bsi.getComponent(j, k); } return legBones.has(b) ? 1 : 0; });
// the sleeves are not the skirt: a hand resting at the thigh in the Idle is the arm's business, not this probe's
const rJ = L.robe.geometry.attributes.skinIndex, rW = L.robe.geometry.attributes.skinWeight, rB = L.robe.skeleton.bones.map(b => b.name);
const SLEEVE = Float32Array.from({ length: rJ.count }, (_, i) => { let a = 0; for (let k = 0; k < 4; k++) if (/shoulder|elbow|wrist/.test(rB[rJ.getComponent(i, k)])) a += rW.getComponent(i, k); return a > 0.5 ? 1 : 0; });
const used = ix => { const s = new Uint8Array(ix.reduce((m, j) => Math.max(m, j), 0) + 1); for (const j of ix) s[j] = 1; return s; };
const rows = [], tot = { through: 0, void: 0 }, A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), seg = new THREE.Line3();
for (const build of BUILDS) for (const cut of CUTS) {
  f.w.set(look(build, cut)); const hem = CUT[cut].hem, row = { build, cut };
  const pix = Array.from(L.pants.geometry.index.array), pDrawn = used(pix), bDrawn = used(Array.from(L.body.geometry.index.array));
  for (const [name, run] of POSES()) { let th = 0, vo = 0, fr = 0;
    run(f, () => { fr++;
      const rp = posed(L.robe), ry = L.robe.geometry.attributes.restY.array, rix = L.robe.geometry.index.array, R = bvh(rp, rix);
      const skirtAt = (tri, u, v) => SLEEVE[rix[tri * 3]] + SLEEVE[rix[tri * 3 + 1]] + SLEEVE[rix[tri * 3 + 2]] < 1.5 && drawnAt(tri, u, v);
      const drawnAt = (tri, u, v) => !hem || ry[rix[tri * 3]] * (1 - u - v) + ry[rix[tri * 3 + 1]] * u + ry[rix[tri * 3 + 2]] * v >= hem;
      const axes = G.map(([a, b]) => [f.bones[a].b.getWorldPosition(new THREE.Vector3()), f.bones[b].b.getWorldPosition(new THREE.Vector3())]);
      const through = (x, y, z) => { C.set(x, y, z); let best = null, bd = Infinity;
        for (const [a, b] of axes) { seg.set(a, b); seg.closestPointToPoint(C, true, A); const d = A.distanceTo(C); if (d < bd) { bd = d; best = A.clone(); } }
        const d = [x - best.x, y - best.y, z - best.z], len = Math.hypot(...d); if (len < 1e-4) return false; let hit = false;
        R.hits(best.toArray(), d, 1 - TOL / len, (t, tri, u, v) => { if (skirtAt(tri, u, v)) hit = true; }); return hit; };
      const pp = posed(L.pants), bp = posed(L.body), pn = normals(pp, L.pantsIndex), PB = bvh(pp, pix);
      for (let k = 0; k < L.pantsSrc.length; k++) if (pDrawn[k] && through(pp[k * 3], pp[k * 3 + 1], pp[k * 3 + 2])) { th++; if (WHY) console.log('through trouser', name, build, cut, k, L.pantsY[k].toFixed(2)); }
      for (let j = 0; j < bodyLeg.length; j++) if (bodyLeg[j] && bDrawn[j] && through(bp[j * 3], bp[j * 3 + 1], bp[j * 3 + 2])) { th++; if (WHY) console.log('through body', name, build, cut, j); }
      for (let k = 0; k < L.pantsSrc.length; k++) { if (pDrawn[k]) continue; const o = [pp[k * 3], pp[k * 3 + 1], pp[k * 3 + 2]];
        for (const d of looks([pn[k * 3], pn[k * 3 + 1], pn[k * 3 + 2]])) { const q = [o[0] + d[0] * TOL, o[1] + d[1] * TOL, o[2] + d[2] * TOL]; let blocked = toFloor(q, d) < 1.5;
          if (!blocked) R.hits(q, d, 1.5, (t, tri, u, v) => { if (drawnAt(tri, u, v)) blocked = true; });
          if (!blocked) PB.hits(q, d, 1.5, () => { blocked = true; });
          if (!blocked) { vo++; break; } } }
    });
    row[name] = [th, vo]; tot.through += th; tot.void += vo; row.frames = (row.frames || 0) + fr; }
  rows.push(row);
}
if (process.argv.includes('--json')) console.log(JSON.stringify({ rows, tot }));
console.log('legs probe: point-frames, through / void (Walk and Idle over a loop each, sit at half and full)');
console.log('build    cut     walk        idle        sit');
for (const r of rows) console.log(`${r.build.padEnd(8)} ${r.cut.padEnd(7)} ${POSES().map(([n]) => `${r[n][0]} / ${r[n][1]}`.padEnd(11)).join(' ')}`);
console.log(`total through ${tot.through} (line ${LIMIT.through}), void ${tot.void} (line ${LIMIT.void})`);
if (tot.through > LIMIT.through || tot.void > LIMIT.void) process.exit(1);

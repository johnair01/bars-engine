// Cultivation parts round 4 (2026-10-31-cultivation-parts-3): round 3's garment recipes, sleeves falling straight below
// the elbow (tube `fall`). Round 3 (2026-10-30-cultivation-parts-2): the garment recipes. Round 3 follows his note on
// cult-parts-look-1 and the Clone Wars rules (refs/rules.md in project files): at most two modelled shells, the other
// layers shown as bands at the collar and hem (`under`), the outer robe 1 to 3 cm off the body, set-in sleeves (no
// shoulder cap in the body rings, which made the boxy jacket look), a cinched waist, and long hair for the women.
// Round 2's header: A garment here is a recipe, not a fixed mesh: each one is
// run against the posed body of the mix (any gender, build, height), measured from that body's own skin, and then
// skinned to the shared UBC skeleton, so it fits every body without a redraw and follows the body when it moves.
//
//   loft (robe, inner robe, cape): horizontal rings down the body; each ring is the convex hull of the body's skin in a
//        2.5 cm slab (soft closed shapes), plus ease; below the waist the radius never shrinks (gravity) and opens into an
//        A-line, with soft folds that only ever add cloth.
//   tube (sleeves, trousers, leg wraps, boot shafts): rings along a bone chain, the hull of the limb's skin plus ease;
//        a sleeve flares toward the cuff.
//   shell (shoes, boot feet, hair cap): the body's own skin pushed out along its normals, with the body's own weights.
//   band (collar, hem, cuffs, sash, sash tails): a strip laid on a loft's surface a few mm out.
//   rigid (topknot, pin, crown, braid): small solids weighted to the head or the upper back.
// Skinning (docs/3d-math.md rule 8): upper garments copy the weights of the nearest body skin of their region; a robe
// skirt below the hip blends hips and both thighs by side, so it follows the legs without splitting between them.
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { TORSO, ARM, LEG, FOOT, UP, CHILD } from './figure.js';
import * as ACC from './accessories.js'; // accessories round 2 (2026-11-04): the knot, tails, disc, whisk and gourd

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const LAYER = { trousers: 1, legwraps: 2, boots: 2, shoes: 2, innerrobe: 3, robe: 4, sash: 5, outer: 5.5, cape: 6, hair: 7 };
export { LAYER };

// ---------- 2D helpers
function hull(pts) { // monotone chain, pts [[x,y]...] -> ccw hull
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function centroid(h) { let x = 0, y = 0; for (const q of h) { x += q[0]; y += q[1]; } return [x / h.length, y / h.length]; }
function radial(h, c, nT) { // radius of the hull boundary at each angle about c (c inside)
  const r = new Float32Array(nT);
  for (let k = 0; k < nT; k++) {
    const th = (k / nT) * TAU, dx = Math.cos(th), dy = Math.sin(th); let best = 0;
    for (let i = 0; i < h.length; i++) {
      const a = h[i], b = h[(i + 1) % h.length], ex = b[0] - a[0], ey = b[1] - a[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
      const wx = a[0] - c[0], wy = a[1] - c[1]; const t = (wx * ey - wy * ex) / den, u = (wx * dy - wy * dx) / den;
      if (u >= -1e-6 && u <= 1 + 1e-6 && t > best) best = t;
    }
    r[k] = best;
  }
  return r;
}
const circSmooth = (r, w = 1) => { const n = r.length, o = new Float32Array(n); for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let j = -w; j <= w; j++) { s += r[(i + j + n) % n]; c++; } o[i] = Math.max(r[i], s / c); } return o; };
const sampleR = (r, th) => { const n = r.length; let u = ((th / TAU) % 1 + 1) % 1 * n; const i = Math.floor(u) % n, t = u - Math.floor(u); return r[i] * (1 - t) + r[(i + 1) % n] * t; };

// ---------- body context
export function context(F, B) {
  const { f, l } = F.fr, bn = F.boneName, dom = F.dom, rep = F.rep, N = B.count;
  const S = F.stature, k = S / 1.75;
  const y = n => wp(F.bones[n]).y;
  let crown = -1e9; for (let i = 0; i < N; i++) if (bn[dom[i]] === 'head') crown = Math.max(crown, B.P[i * 3 + 1]);
  const C = { F, B, f, l, S, k, bn, dom, rep, N, crown,
    yNeck: y('neck'), yHead: y('head'), ySh: (y('shoulderL') + y('shoulderR')) / 2, yHip: y('hips'), yKnee: (y('kneeL') + y('kneeR')) / 2,
    yAnkle: (y('ankleL') + y('ankleR')) / 2, pos: i => V(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2]), nrm: i => V(B.N[i * 3], B.N[i * 3 + 1], B.N[i * 3 + 2]),
    name: i => bn[dom[i]] };
  C.yWaist = C.yHip + 0.11 * k; // natural waist, where the sash sits
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(B.P), 3)); g.setIndex(F.idx0.clone()); C.bodyBVH = new MeshBVH(g); C.bodyGeo = g; } // round 5: the drape collides with it
  C.uniq = []; for (let i = 0; i < N; i++) if (rep[i] === i) C.uniq.push(i);
  C.ab = p => [p.dot(f), p.dot(l)];
  C.fromAB = (a, b, yy) => V().addScaledVector(f, a).addScaledVector(l, b).add(V(0, yy, 0));
  C.side = i => Math.sign(C.pos(i).dot(l) - wp(F.bones.hips).dot(l));
  // grid of body skin for nearest lookups
  const G = new Map(), cell = 0.04, key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (const i of C.uniq) { const kk = key(B.P[i * 3], B.P[i * 3 + 1], B.P[i * 3 + 2]); if (!G.has(kk)) G.set(kk, []); G.get(kk).push(i); }
  C.nearest = (p, ok) => {
    const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell), cz = Math.floor(p.z / cell);
    for (let R = 1; R <= 8; R++) { let best = -1, bd = 1e9;
      for (let x = cx - R; x <= cx + R; x++) for (let yy = cy - R; yy <= cy + R; yy++) for (let z = cz - R; z <= cz + R; z++) {
        const a = G.get(`${x},${yy},${z}`); if (!a) continue;
        for (const i of a) { if (ok && !ok(i)) continue; const d = (B.P[i * 3] - p.x) ** 2 + (B.P[i * 3 + 1] - p.y) ** 2 + (B.P[i * 3 + 2] - p.z) ** 2; if (d < bd) { bd = d; best = i; } } }
      if (best >= 0 && Math.sqrt(bd) < R * cell) return best; }
    let best = -1, bd = 1e9; for (const i of C.uniq) { if (ok && !ok(i)) continue; const d = (B.P[i * 3] - p.x) ** 2 + (B.P[i * 3 + 1] - p.y) ** 2 + (B.P[i * 3 + 2] - p.z) ** 2; if (d < bd) { bd = d; best = i; } } return best;
  };
  return C;
}

// ---------- loft (rings down the body)
function loft(C, { yTop, yHem, regionAt, ease, flare = 0, folds = 0, foldN = 11, cinch = null, nT = 72, dy = 0.022, topEase = 0.012, yoke = 0, tcut = false, neckDrop = 0, neckPow = 2, neckBack = 0 }) {
  const ys = []; for (let yy = yTop; yy > yHem; yy -= dy * C.k) ys.push(yy); ys.push(yHem);
  const rings = ys.map(yy => {
    const pts = []; const sl = 0.016 * C.k;
    for (const i of C.uniq) { const p = C.B.P[i * 3 + 1]; if (Math.abs(p - yy) > sl) continue; if (!regionAt(C.name(i), yy, i)) continue; pts.push(C.ab(C.pos(i))); }
    return { y: yy, h: pts.length >= 3 ? hull(pts) : null };
  });
  for (let i = 0; i < rings.length; i++) if (!rings[i].h) rings[i].h = (rings[i - 1] || rings.find(r => r.h)).h;
  // centres: hull centroids smoothed; held fixed below the hip so the skirt hangs straight
  let cs = rings.map(r => centroid(r.h)); const sm = cs.map((c, i) => { let a = 0, b = 0, n = 0; for (let j = -3; j <= 3; j++) { const q = cs[i + j]; if (q) { a += q[0]; b += q[1]; n++; } } return [a / n, b / n]; });
  const iHip = rings.findIndex(r => r.y < C.yHip); cs = sm.map((c, i) => (iHip >= 0 && i > iHip ? sm[iHip] : c));
  const yWb = cinch ? cinch.y - cinch.h / 2 : C.yWaist;
  let prev = null;
  rings.forEach((r, i) => {
    let rr = circSmooth(radial(r.h, cs[i], nT), 2);
    const below = r.y < yWb;
    if (below && prev) for (let t = 0; t < nT; t++) rr[t] = Math.max(rr[t], prev[t]); // gravity: the skirt never draws in
    prev = Float32Array.from(rr);
    const out = new Float32Array(nT);
    for (let t = 0; t < nT; t++) {
      const th = (t / nT) * TAU; let e = ease;
      if (r.y > C.yNeck - 0.01 * C.k) e = topEase + (ease - topEase) * sstep(C.yNeck + 0.04 * C.k, C.yNeck - 0.03 * C.k, r.y);
      if (cinch) { const cw = 1 - sstep(cinch.h * 0.5, cinch.h * 0.5 + 0.012 * C.k, Math.abs(r.y - cinch.y)); e = e + (Math.min(e, 0.004 + ease * 0.25) - e) * cw; } // round 5: only under the sash
      let add = 0;
      if (below) { const u = sstep(yWb, yHem, r.y); add += flare * u * (0.75 + 0.25 * Math.cos(th - Math.PI)); // more fullness at the back
        if (folds) { const w = 0.5 + 0.5 * Math.sin(foldN * th + 1.7 * Math.sin(2 * th) + 3 * u); add += folds * Math.pow(u, 0.6) * (foldN > 11 ? w * w * (3 - 2 * w) : w); } } // round 6: foldN columns from the waist gather, rounder ridges
      out[t] = rr[t] + e + add;
    }
    r.c = cs[i]; r.r = out;
  });
  // drape above the waist (round 4, kept): cloth bridges the hollows between chest, ribs and belly instead of following
  // each slab; it also lifts the cloth over shoulder-weighted skin at the front of the armpit, which the rings leave out
  const iW = rings.findIndex(r => r.y < yWb); const top = iW < 0 ? rings.length : iW;
  const raw = rings.map(r => Float32Array.from(r.r));
  const yArmD = C.ySh - 0.1 * C.k;
  for (let i = 0; i < top; i++) for (let t = 0; t < nT; t++) { if (tcut && rings[i].y > yArmD && Math.abs(Math.sin(t / nT * TAU)) > 0.88) continue; /* round 6, T-cut: above the armpit the sides follow the shoulder's own slope; bridging there squared the shoulder into a cap */
    // round 7 (his note on cult-parts-look-6: "the slope of the chest is still off in the side view"): at the front the
    // cloth hangs from the bust down to the sash but lies on the upper chest above it, so a front column bridges only
    // downward. Bridging upward too (0.7 cm a ring) stood the robe 5 to 6 cm off the breastbone and walled it up to the chin.
    const wF = neckDrop ? sstep(0.2, 0.6, Math.cos(t / nT * TAU)) : 0; let m = raw[i][t], mUp = raw[i][t];
    for (let j = -5; j <= 5; j++) { const q = raw[i + j]; if (q && i + j < top) { const v = q[t] - Math.abs(j) * 0.007 * C.k; m = Math.max(m, v); if (j <= 0) mUp = Math.max(mUp, v); } }
    rings[i].r[t] = m + (mUp - m) * wF; }
  // round 5, flat front: above the sash each angular column spans its hollows. The column's profile, measured along its
  // own direction (ring centre plus radius), is replaced by its upper hull from the top ring to the sash top, so cloth
  // runs straight from the bust apex (or the chest) to the sash, as a tent, and never dips back in under the bust. At the
  // sides the window starts below the armpit, so the robe does not tent out from the shoulder into the hanging arm.
  // (Round 4 let each ring fall in at 0.007 m a ring, which hollowed in under the bust and bulged out again at the sash.)
  const ySt = cinch ? cinch.y + cinch.h / 2 : C.yWaist, iSt = rings.findIndex(r => r.y <= ySt), last = iSt < 0 ? rings.length - 1 : iSt;
  const yArm = C.ySh - 0.12 * C.k;
  for (let t = 0; t < nT; t++) {
    const th = (t / nT) * TAU, dx = Math.cos(th), dyy = Math.sin(th), side = Math.abs(dyy);
    const yW = side > 0.75 ? yArm : side > 0.55 ? C.ySh - 0.12 * C.k * (side - 0.55) / 0.2 : 9; // window top for this column
    const yWn = neckDrop && dx > 0.3 ? C.yNeck - 0.01 * C.k : 9; // round 7: at the front the window starts under the hollow of the throat, so the cloth does not span from the neck to the bust
    const pts = []; for (let i = 0; i <= last; i++) if (rings[i].y <= Math.min(yW, yWn)) pts.push([rings[i].y, rings[i].c[0] * dx + rings[i].c[1] * dyy + rings[i].r[t], i]);
    if (pts.length < 3) continue;
    pts.sort((a, b) => a[0] - b[0]); const H = []; // upper hull of (y, s): the least concave profile over the column
    for (const q of pts) { while (H.length >= 2) { const a = H[H.length - 2], b = H[H.length - 1]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) >= 0) H.pop(); else break; } H.push(q); }
    for (const q of pts) { let j = 0; while (j < H.length - 2 && H[j + 1][0] < q[0]) j++; const a = H[j], b = H[Math.min(j + 1, H.length - 1)];
      const u = b[0] > a[0] ? (q[0] - a[0]) / (b[0] - a[0]) : 0, sH = a[1] + (b[1] - a[1]) * u; rings[q[2]].r[t] += Math.max(0, sH - q[1]); }
  }
  if (yoke) { // the top ring sits on the trapezius; close it onto the neck with a sloped yoke, so the robe has no open shelf
    const nk = []; const yN = rings[0].y + yoke * C.k;
    for (const i of C.uniq) if (C.name(i) === 'neck' && Math.abs(C.B.P[i * 3 + 1] - yN) < 0.02 * C.k) nk.push(C.ab(C.pos(i)));
    if (nk.length >= 3) { const h = hull(nk), c = centroid(h), rn = radial(h, c, nT).map(x => x + topEase); const r0 = rings[0];
      const add = [];
      for (let j = 1; j <= 3; j++) { const t = j / 3, rr = new Float32Array(nT); for (let q = 0; q < nT; q++) rr[q] = r0.r[q] + (rn[q] - r0.r[q]) * t * t; // dome: stays full over the trapezius, turns in at the neck
        add.unshift({ y: r0.y + (yN - r0.y) * t, c: [r0.c[0] + (c[0] - r0.c[0]) * t, r0.c[1] + (c[1] - r0.c[1]) * t], r: rr }); }
      rings.unshift(...add); }
  }
  // round 7: the neckline sits on the base of the neck. At the back it stays high on the yoke; towards the front it drops
  // to the hollow of the throat (neckDrop, metres at the centre front), so the cloth never climbs the front of the neck.
  const yT0 = rings[0].y, topAt = th => yT0 - neckDrop * C.k * Math.pow(0.5 + 0.5 * Math.cos(th), neckPow) - neckBack * C.k * Math.pow(0.5 - 0.5 * Math.cos(th), 4); // direction A: neckBack lowers the back of the neckline (women), so it does not stand behind the dropped front as a hood // round 7 finish: neckPow narrows the drop to the centre front
  return { rings, nT, yTop: yT0, yHem, topAt };
}
function loftAt(L, th, yy) { // point on a loft surface at angle th and height yy -> {a, b, r}
  const R = L.rings; let i = 0; while (i < R.length - 2 && R[i + 1].y > yy) i++;
  const r0 = R[i], r1 = R[i + 1], t = THREE.MathUtils.clamp((r0.y - yy) / (r0.y - r1.y || 1), 0, 1);
  const c = [r0.c[0] * (1 - t) + r1.c[0] * t, r0.c[1] * (1 - t) + r1.c[1] * t], r = sampleR(r0.r, th) * (1 - t) + sampleR(r1.r, th) * t;
  return { a: c[0] + r * Math.cos(th), b: c[1] + r * Math.sin(th), r, c };
}

// ---------- tube (rings along a bone chain)
function tube(C, { chain, ok, s0 = 0, s1 = null, ease, easeAt = null, flare = () => 0, nT = 40, ds = 0.02, sideBag = null, fall = null, span = null, cyl = null, smoothC = 0 }) {
  const seg = []; let L = 0; for (let i = 0; i < chain.length - 1; i++) { const a = chain[i], b = chain[i + 1], d = b.clone().sub(a), len = d.length(); seg.push({ a, d: d.divideScalar(len), len, s: L }); L += len; }
  if (s1 == null) s1 = L;
  const at = s => { let g = seg[0]; for (const q of seg) if (s >= q.s) g = q; const t = s - g.s; return { o: g.a.clone().addScaledVector(g.d, t), t: g.d.clone() }; };
  const tanAt = s => { const w = 0.05; const a = at(Math.max(0, s - w)).t, b = at(Math.min(L, s + w)).t; return a.add(b).normalize(); };
  // project candidate skin onto the chain
  const prj = [];
  for (const i of C.uniq) { if (!ok(i)) continue; const p = C.pos(i); let best = null;
    for (const q of seg) { const t = THREE.MathUtils.clamp(p.clone().sub(q.a).dot(q.d), 0, q.len); const o = q.a.clone().addScaledVector(q.d, t); const dd = p.distanceTo(o); if (!best || dd < best.dd) best = { s: q.s + t, o, dd }; }
    if (best.dd < 0.25) prj.push({ i, p, s: best.s, o: best.o }); }
  const rings = []; const sl = 0.022 * C.k; let last = null;
  // pass 1: the skin hull radius at each ring (round 3 used these as they came)
  const raw = [];
  for (let s = s0; s <= s1 + 1e-6; s += ds * C.k) {
    const sc = Math.min(s, L), { o } = at(sc), t = tanAt(sc); let u = C.f.clone().addScaledVector(t, -C.f.dot(t)); if (u.lengthSq() < 1e-4) u = C.l.clone().addScaledVector(t, -C.l.dot(t)); u.normalize(); const v = V().crossVectors(t, u);
    const pts = []; for (const q of prj) if (Math.abs(q.s - sc) < sl) { const d = q.p.clone().sub(o); pts.push([d.dot(u), d.dot(v)]); }
    let rr = pts.length >= 3 ? circSmooth(radial(hull(pts), [0, 0], nT), 1) : last; if (!rr) rr = new Float32Array(nT).fill(0.05);
    if (s > L && last) rr = last; last = rr; raw.push({ s, sc, t, u, v, rr });
  }
  // round 4, fall: below s = fall (the elbow) cloth hangs, it does not follow the forearm muscle. Each angle's radius is
  // the straight line from the elbow ring to the cuff ring, raised only where the skin would come through it (never
  // below the skin hull, so no pokes), then smoothed along the sleeve; the line is drawn under the hull's own bumps.
  if (span != null) { const iE = Math.max(2, raw.findIndex(x => x.s >= span)); // round 6: the upper arm's cloth spans the hollows under the deltoid and biceps (upper hull of r along s, per angle)
    for (let k = 0; k < nT; k++) { const pts = raw.slice(0, iE + 1).map((x, i) => [x.s, x.rr[k], i]); const H = [];
      for (const q of pts) { while (H.length >= 2) { const a = H[H.length - 2], b = H[H.length - 1]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) >= 0) H.pop(); else break; } H.push(q); }
      for (const q of pts) { let j = 0; while (j < H.length - 2 && H[j + 1][0] < q[0]) j++; const a = H[j], b = H[Math.min(j + 1, H.length - 1)]; const u = b[0] > a[0] ? (q[0] - a[0]) / (b[0] - a[0]) : 0;
        raw[q[2]].rr[k] = Math.max(raw[q[2]].rr[k], a[1] + (b[1] - a[1]) * u); } } }
  if (fall != null) { const iE = raw.findIndex(x => x.s >= fall), n = raw.length - 1;
    if (iE >= 0 && iE < n) { const keep = raw.map(x => Float32Array.from(x.rr));
      for (let k = 0; k < nT; k++) { const r0 = keep[iE][k], r1 = keep[n][k]; let lift = 0;
        for (let i = iE; i <= n; i++) { const u = (i - iE) / (n - iE); lift = Math.max(lift, keep[i][k] - (r0 + (r1 - r0) * u)); }
        for (let i = iE; i <= n; i++) { const u = (i - iE) / (n - iE); raw[i].rr[k] = Math.max(keep[i][k], r0 + (r1 - r0) * u + lift * (1 - 0.5 * u)); } }
      for (let pass = 0; pass < 2; pass++) for (let i = Math.max(1, iE - 2); i < n; i++) for (let k = 0; k < nT; k++) raw[i].rr[k] = Math.max(keep[i][k], (raw[i - 1].rr[k] + 2 * raw[i].rr[k] + raw[i + 1].rr[k]) / 4); } }
  // round 3 of B and C (the look-2 read: "the C1 sleeves still carry vertical creases"): each angle's fall line is found on
  // its own, so neighbouring angles stepped into long ridges down a wide sleeve; `smoothC` passes of a round mean that only
  // fills the hollows (circSmooth never draws a ring in, so no new pokes) run each ring below the fall smooth round the sleeve
  if (fall != null && smoothC) { const iE = Math.max(0, raw.findIndex(x => x.s >= fall)); for (let i = iE; i < raw.length; i++) for (let pass = 0; pass < smoothC; pass++) raw[i].rr = circSmooth(raw[i].rr, 2); }
  // direction C, wide trousers: below s = cyl each angle keeps the widest radius the leg reaches there, so the leg hangs as
  // one straight column (no step at the knee or calf)
  if (cyl != null) for (let k = 0; k < nT; k++) { let m = 0; for (const x of raw) if (x.s >= cyl) m = Math.max(m, x.rr[k]); for (const x of raw) if (x.s >= cyl) x.rr[k] = m; }
  for (const { s, t, u, v, rr } of raw) {
    const sn = (s - s0) / (s1 - s0 || 1), out = new Float32Array(nT), fl = flare(sn);
    let cOff = [0, 0], aw = [0, 0];
    if (sideBag && fl > 0) { const g = sideBag.clone().addScaledVector(t, -sideBag.dot(t)); const m = Math.hypot(g.dot(u), g.dot(v)) || 1; aw = [g.dot(u) / m, g.dot(v) / m]; cOff = [aw[0] * fl * 0.03, aw[1] * fl * 0.03]; } // the centre barely moves: the inner wall must stay outside the forearm
    // the flare grows away from the body (sideBag), so a wide sleeve hangs out and down instead of into the robe
    const eF = fall != null && s > fall ? 1 - 0.45 * Math.min(1, (s - fall) / Math.max(1e-3, s1 - fall)) : 1; // round 4: the falling cloth sits closer toward the cuff
    for (let k = 0; k < nT; k++) { const th = k / nT * TAU, c = Math.cos(th) * aw[0] + Math.sin(th) * aw[1]; out[k] = rr[k] + ease * eF + (easeAt ? easeAt(s) : 0) + fl * (0.04 + 0.46 * Math.max(0, c)); }
    const oo = at(Math.min(s, L)).o.clone(); if (s > L) oo.addScaledVector(seg[seg.length - 1].d, s - L);
    rings.push({ s, o: oo.addScaledVector(u, cOff[0]).addScaledVector(v, cOff[1]), u, v, r: out });
  }
  return { rings, nT, L };
}


// round 2 of B and C (his note on cult-dir-c-look-1, 2026-11-02: "Wrinkles that shouldn't be there trying to simulate
// cloth there we really only need to do that for dangling bits"): the cloth bake runs only on what dangles (sash tails,
// ribbons, tassels, and the chains in motion.js). The robe body, its skirt, the sleeves and the cape keep the recipe's
// own shape and folds; a switch here puts the bake back on one of them.
const SIM = { skirt: true, sleeve: false, cape: false };
const noBake = (C, X) => (X.bake = { mean: 0, max: 0, sag: 0, off: true });
// ---------- round 5: bake (drape the recipe once as cloth on the posed body, keep the settled shape)
// The recipe's grid (rows of nT points, closed round) is the cloth's rest shape. It falls under gravity for `secs` at a
// fixed 1/240 s (docs/3d-math.md rule 5), held by its pinned rows; edges and two-apart edges keep their recipe lengths
// (stretch fully, compression nearly so: at this grid a fold is finer than a cell, so the cells keep their size), and after each step any point closer
// to the body than `margin`, or within 4 mm of a garment already put on (C.colliders: trousers, the inner robe), is
// pushed out along that surface's face normal. The settled points are written back into the
// recipe's rings, so the bands, trims and sash built on it sit on the baked cloth and the skin weights are found the
// same way as before.
function drape(C, X, rows, nT, pinned, { secs = 0.75, margin = 0.006, iters = 6, every = 2, open = false } = {}) { if (C.rigid) return { P: Float32Array.from(X), mean: 0, max: 0 }; // shells round (his ruling 2026-11-02): no cloth simulation; a strip keeps the shape it is laid in
  // open: a strip (no edge joins its last point to its first)
  const n = rows * nT, P = Float32Array.from(X), Q = Float32Array.from(X), E = [], dt = 1 / 240, g = -9.81 * dt * dt;
  const id = (r, t) => r * nT + ((t % nT) + nT) % nT;
  for (let r = 0; r < rows; r++) for (let t = 0; t < nT; t++) for (const [dr, dtt, ks] of [[0, 1, 1], [1, 0, 1], [1, 1, 0.5], [1, -1, 0.5], [0, 2, 0.3], [2, 0, 0.3]]) { // round-wise edges (dr 0) keep their length both ways: a hem does not shrink, it folds
    if (r + dr >= rows || (open && (t + dtt < 0 || t + dtt >= nT))) continue; const a = id(r, t), b = id(r + dr, t + dtt);
    E.push(a, b, Math.hypot(X[a * 3] - X[b * 3], X[a * 3 + 1] - X[b * 3 + 1], X[a * 3 + 2] - X[b * 3 + 2]), dr ? ks : -ks); }
  const w = new Float32Array(n); for (let i = 0; i < n; i++) w[i] = pinned(Math.floor(i / nT), i % nT) ? 0 : 1;
  // tethers (long-range attachments): each free point stays within its rest distance of the nearest pinned point of its
  // own column, so a long skirt cannot stretch under its own weight however few iterations a step has
  const teth = []; for (let t = 0; t < nT; t++) { let pin = -1; for (let r = 0; r < rows; r++) { const i = r * nT + t; if (!w[i]) { pin = i; continue; } if (pin >= 0) teth.push(i, pin, Math.hypot(X[i * 3] - X[pin * 3], X[i * 3 + 1] - X[pin * 3 + 1], X[i * 3 + 2] - X[pin * 3 + 2])); } }
  const tri = new THREE.Triangle(), nrm = V(), q = V(), hit = {};
  const steps = Math.round(secs / dt);
  for (let st = 0; st < steps; st++) {
    for (let i = 0; i < n; i++) { if (!w[i]) continue; for (let c = 0; c < 3; c++) { const x = P[i * 3 + c], v = (x - Q[i * 3 + c]) * 0.985; Q[i * 3 + c] = x; P[i * 3 + c] = x + v + (c === 1 ? g : 0); } }
    for (let it = 0; it < iters; it++) for (let e = 0; e < E.length; e += 4) { const a = E[e], b = E[e + 1], L0 = E[e + 2], ks = Math.abs(E[e + 3]), hoop = E[e + 3] < 0, wa = w[a], wb = w[b]; if (!(wa + wb)) continue;
      const dx = P[b * 3] - P[a * 3], dy = P[b * 3 + 1] - P[a * 3 + 1], dz = P[b * 3 + 2] - P[a * 3 + 2], L = Math.hypot(dx, dy, dz) || 1e-9;
      const k = (L > L0 || hoop ? 1 : 0.9) * ks, m = k * (L - L0) / L / (wa + wb);
      P[a * 3] += dx * m * wa; P[a * 3 + 1] += dy * m * wa; P[a * 3 + 2] += dz * m * wa; P[b * 3] -= dx * m * wb; P[b * 3 + 1] -= dy * m * wb; P[b * 3 + 2] -= dz * m * wb; }
    for (let e = 0; e < teth.length; e += 3) { const i = teth[e], j = teth[e + 1], L0 = teth[e + 2]; const dx = P[i * 3] - P[j * 3], dy = P[i * 3 + 1] - P[j * 3 + 1], dz = P[i * 3 + 2] - P[j * 3 + 2], L = Math.hypot(dx, dy, dz);
      if (L > L0) { const m = L0 / L; P[i * 3] = P[j * 3] + dx * m; P[i * 3 + 1] = P[j * 3 + 1] + dy * m; P[i * 3 + 2] = P[j * 3 + 2] + dz * m; } }
    if (st % every && st !== steps - 1) continue;
    for (const col of [{ bvh: C.bodyBVH, geo: C.bodyGeo, m: margin }].concat((C.colliders || []).map(x => ({ ...x, m: 0.008 })))) // round 6: 8 mm off what is already on (was 4; boot shafts came through a long skirt)
      for (let i = 0; i < n; i++) { if (!w[i]) continue; q.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); const h = col.bvh.closestPointToPoint(q, hit, 0, 0.04); if (!h) continue;
        const I = col.geo.index.array, A = col.geo.attributes.position, f = h.faceIndex * 3; tri.setFromAttributeAndIndices(A, I[f], I[f + 1], I[f + 2]); tri.getNormal(nrm);
        const d = q.clone().sub(h.point).dot(nrm); if (d < col.m && d > -0.03) { q.copy(h.point).addScaledVector(nrm, col.m); P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; } }
  }
  let sum = 0, mx = 0; for (let i = 0; i < n; i++) { const d = Math.hypot(P[i * 3] - X[i * 3], P[i * 3 + 1] - X[i * 3 + 1], P[i * 3 + 2] - X[i * 3 + 2]); sum += d; mx = Math.max(mx, d); }
  return { P, mean: sum / n, max: mx };
}
function bakeLoft(C, L, pinned, opt) { // rings -> cloth -> rings (radius along each column's own direction; heights stay)
  const R = L.rings, nT = L.nT, X = new Float32Array(R.length * nT * 3);
  R.forEach((r, i) => { for (let t = 0; t < nT; t++) { const th = t / nT * TAU, p = C.fromAB(r.c[0] + r.r[t] * Math.cos(th), r.c[1] + r.r[t] * Math.sin(th), r.y); X.set([p.x, p.y, p.z], (i * nT + t) * 3); } });
  const D = drape(C, X, R.length, nT, (i, t) => pinned(R[i], t), opt), p = V();
  R.forEach((r, i) => { let yy = 0; for (let t = 0; t < nT; t++) { const th = t / nT * TAU, j = (i * nT + t) * 3; p.set(D.P[j], D.P[j + 1], D.P[j + 2]); yy += p.y; const [a, b] = C.ab(p); r.r[t] = Math.max(0.005, (a - r.c[0]) * Math.cos(th) + (b - r.c[1]) * Math.sin(th)); } r.dy = yy / nT - r.y; });
  const sag = Math.max(...R.map(r => -r.dy)); // how far the hem settled; heights stay as cut (the hem is a length the outfit names)
  return L.bake = { mean: +D.mean.toFixed(4), max: +D.max.toFixed(4), sag: +sag.toFixed(4) };
}
function bakeTube(C, T, pinned, opt) {
  const R = T.rings, nT = T.nT, X = new Float32Array(R.length * nT * 3);
  R.forEach((r, i) => { for (let k = 0; k < nT; k++) { const th = k / nT * TAU, p = r.o.clone().addScaledVector(r.u, r.r[k] * Math.cos(th)).addScaledVector(r.v, r.r[k] * Math.sin(th)); X.set([p.x, p.y, p.z], (i * nT + k) * 3); } });
  const D = drape(C, X, R.length, nT, i => pinned(R[i]), opt), p = V();
  R.forEach((r, i) => { for (let k = 0; k < nT; k++) { const th = k / nT * TAU, j = (i * nT + k) * 3; p.set(D.P[j], D.P[j + 1], D.P[j + 2]).sub(r.o); r.r[k] = Math.max(0.004, p.dot(r.u) * Math.cos(th) + p.dot(r.v) * Math.sin(th)); } });
  return T.bake = { mean: +D.mean.toFixed(4), max: +D.max.toFixed(4) };
}

// round 6: push any point of a fitted piece that lies under the skin (or within `m` of it) out along the skin's face
// normal; the sleeve's root on the shoulder slope meets the trapezius at a sharp angle and a ring there can dip in
function pushOutOfBody(C, g, m = 0.004) {
  const P = g.attributes.position, tri = new THREE.Triangle(), nrm = V(), q = V(), hit = {}; let moved = 0;
  for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(P, i); const h = C.bodyBVH.closestPointToPoint(q, hit, 0, 0.06); if (!h) continue;
    const I = C.bodyGeo.index.array, A = C.bodyGeo.attributes.position, f = h.faceIndex * 3; tri.setFromAttributeAndIndices(A, I[f], I[f + 1], I[f + 2]); tri.getNormal(nrm);
    const d = q.clone().sub(h.point).dot(nrm); if (d < m && d > -0.06) { q.copy(h.point).addScaledVector(nrm, m); P.setXYZ(i, q.x, q.y, q.z); moved++; } }
  if (moved) { P.needsUpdate = true; g.computeVertexNormals(); } return moved;
}

// ---------- meshes
function gridGeo(C, rows, nT, posAt, colAt, { gap = null, edgeAt }) {
  const P = [], Cc = [], E = [], I = [];
  rows.forEach((row, ri) => { for (let k = 0; k < nT; k++) { const p = posAt(row, k); P.push(p.x, p.y, p.z); const c = colAt(row, k, ri); Cc.push(c.r, c.g, c.b); E.push(edgeAt(ri, k)); } });
  for (let ri = 0; ri < rows.length - 1; ri++) for (let k = 0; k < nT; k++) {
    if (gap && gap(k)) continue;
    const a = ri * nT + k, b = ri * nT + (k + 1) % nT, c = (ri + 1) * nT + k, d = (ri + 1) * nT + (k + 1) % nT; I.push(a, c, b, b, c, d);
  }
  return finish(P, Cc, E, I);
}
function finish(P, Cc, E, I) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I);
  g.userData.edge = Float32Array.from(E); g.computeVertexNormals(); return g;
}
function orientOut(g, centreOf) { // flip winding so normals face away from the body axis
  const P = g.attributes.position, N = g.attributes.normal; let s = 0; const p = V(), n = V();
  for (let i = 0; i < P.count; i += 7) { p.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i); s += Math.sign(n.dot(p.clone().sub(centreOf(p)))); }
  if (s < 0) { const I = g.index.array; for (let t = 0; t < I.length; t += 3) { const x = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = x; } g.index.needsUpdate = true; g.computeVertexNormals(); }
  return g;
}
const col = h => new THREE.Color(h);

function loftGeo(C, L, color, { gap = null, openTop = true } = {}) {
  const R = L.rings, nT = L.nT, n = R.length, cumul = [0]; for (let i = 1; i < n; i++) cumul.push(cumul[i - 1] + Math.abs(R[i - 1].y - R[i].y));
  const tot = cumul[n - 1], c0 = col(color);
  const g = gridGeo(C, R, nT, (r, k) => { const th = (k / nT) * TAU; const yT = L.topAt ? L.topAt(th) : r.y; if (r.y > yT) { const s = loftAt(L, th, yT); return C.fromAB(s.c[0] + s.r * Math.cos(th), s.c[1] + s.r * Math.sin(th), yT); } const rr = r.r[k]; return C.fromAB(r.c[0] + rr * Math.cos(th), r.c[1] + rr * Math.sin(th), r.y); }, () => c0,
    { gap, edgeAt: (ri, k) => { let e = Math.min(tot - cumul[ri], openTop ? cumul[ri] : 9); if (gap) { for (let d = 0; d < 6; d++) if (gap((k + d) % nT) || gap((k - d - 1 + nT) % nT)) { e = Math.min(e, d * 0.02); break; } } return e; } });
  g.userData.grid = nT; // rows of nT points: mix.js tents the leg push along each column
  return orientOut(g, p => C.fromAB(R[0].c[0], R[0].c[1], p.y));
}
function tubeGeo(C, T, color, colorAt = null) {
  const R = T.rings, nT = T.nT, n = R.length, c0 = col(color), sEnd = R[n - 1].s;
  const g = gridGeo(C, R, nT, (r, k) => { const th = (k / nT) * TAU; return r.o.clone().addScaledVector(r.u, r.r[k] * Math.cos(th)).addScaledVector(r.v, r.r[k] * Math.sin(th)); },
    (r, k) => (colorAt ? colorAt(r, k) : c0), { edgeAt: ri => sEnd - R[ri].s });
  const axis = p => { let b = R[0], bd = 1e9; for (const r of R) { const d = r.o.distanceTo(p); if (d < bd) { bd = d; b = r; } } return b.o; };
  return orientOut(g, axis);
}
// a strip on a loft surface along a path of (th, y) points; width w across the path, raised off the surface
function bandOnLoft(C, L, path, w, off, color, rows = 3, thick = 0, widthAt = null, capY = null) {
  // direction A, shared neck fix: capY(th) is the highest the band may reach at angle th; a point above it comes down onto it,
  // so a band's square end follows the edge of the piece it tucks under instead of standing out past it as a corner
  // round 6: an edge is a built piece. With `thick`, the strip has a cross-section: it rises off the cloth at one edge,
  // runs across at its thickness and comes back down at the other, so the band stands as its own piece (convention 1)
  // instead of a colour painted on the robe. widthAt(i/n) scales the width along the path (a twisting tail).
  const prof = thick > 0 ? [[-0.5, 0], [-0.5, 0.75], [-0.42, 1], [0, 1], [0.42, 1], [0.5, 0.75], [0.5, 0]] : Array.from({ length: rows }, (_, j) => [j / (rows - 1) - 0.5, 0]);
  rows = prof.length;
  const P = [], Cc = [], E = [], I = [], c0 = col(color), n = path.length;
  for (let i = 0; i < n; i++) {
    const [th, yy] = path[i], q = path[Math.min(n - 1, i + 1)], p0 = path[Math.max(0, i - 1)], ww = w * (widthAt ? widthAt(i / (n - 1)) : 1);
    const r = loftAt(L, th, yy).r; let ds = (q[0] - p0[0]) * r, dyy = q[1] - p0[1]; const m = Math.hypot(ds, dyy) || 1; ds /= m; dyy /= m;
    for (const [uf, tf] of prof) { const u = uf * ww; const th2 = th + (-dyy * u) / r, y2 = capY ? Math.min(yy + ds * u, capY(th2)) : yy + ds * u;
      const s = loftAt(L, th2, y2); const rr = s.r + off + tf * thick; const p = C.fromAB(s.c[0] + rr * Math.cos(th2), s.c[1] + rr * Math.sin(th2), y2); P.push(p.x, p.y, p.z); Cc.push(c0.r, c0.g, c0.b); E.push(0); }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < rows - 1; j++) { const a = i * rows + j, b = a + 1, c = a + rows, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = finish(P, Cc, E, I);
  return orientOut(g, p => C.fromAB(L.rings[0].c[0], L.rings[0].c[1], p.y));
}
const line = (a, b, n = 24) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
// a closed ring band on a loft between two heights (yLo may vary with th, for cloud hems)
function ringBand(C, L, yLo, yHi, off, color, nT = 96, rows = 4) {
  const P = [], Cc = [], E = [], I = [], c0 = col(color);
  for (let j = 0; j < rows; j++) for (let k = 0; k < nT; k++) { const th = k / nT * TAU, lo = typeof yLo === 'function' ? yLo(th) : yLo, yy = yHi + (lo - yHi) * j / (rows - 1);
    const s = loftAt(L, th, yy), rr = s.r + off, p = C.fromAB(s.c[0] + rr * Math.cos(th), s.c[1] + rr * Math.sin(th), yy); P.push(p.x, p.y, p.z); Cc.push(c0.r, c0.g, c0.b); E.push(0); }
  for (let j = 0; j < rows - 1; j++) for (let k = 0; k < nT; k++) { const a = j * nT + k, b = j * nT + (k + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); }
  return orientOut(finish(P, Cc, E, I), p => C.fromAB(L.rings[0].c[0], L.rings[0].c[1], p.y));
}
function shell(C, ok, off, color) {
  const idx = C.F.idx0.array, map = new Map(), P = [], Cc = [], E = [], I = [], src = [], c0 = col(color);
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; if (!(ok(a) && ok(b) && ok(c))) continue;
    for (const v of [a, b, c]) { const r = C.rep[v]; if (!map.has(r)) { map.set(r, src.length); src.push(r); const p = C.pos(r).addScaledVector(C.nrm(r), off); P.push(p.x, p.y, p.z); Cc.push(c0.r, c0.g, c0.b); E.push(1); } }
    I.push(map.get(C.rep[a]), map.get(C.rep[b]), map.get(C.rep[c])); }
  const g = finish(P, Cc, E, I); g.userData.src = src; // body vertex per shell vertex, for exact weights
  return g;
}
function solid(C, geo, at, color) { geo = geo.toNonIndexed(); const n = geo.attributes.position.count, c0 = col(color); const Cc = []; for (let i = 0; i < n; i++) Cc.push(c0.r, c0.g, c0.b);
  geo.applyMatrix4(at); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); const ix = []; for (let i = 0; i < n; i++) ix.push(i); geo.setIndex(ix); geo.userData.edge = new Float32Array(n).fill(1); geo.computeVertexNormals(); return geo; }

// ---------- skinning: weights, then bind-space positions by inverting the blended bone matrix at the fit pose
function weightsNearest(C, g, ok) {
  const P = g.attributes.position, SI = C.F.mesh.geometry.attributes.skinIndex, SW = C.F.mesh.geometry.attributes.skinWeight, n = P.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), p = V(), src = g.userData.src;
  for (let i = 0; i < n; i++) { const b = src ? src[i] : C.nearest(p.fromBufferAttribute(P, i), ok); for (let j = 0; j < 4; j++) { si[i * 4 + j] = SI.getComponent(b, j); sw[i * 4 + j] = SW.getComponent(b, j); } }
  return { si, sw };
}
function weightsSkirt(C, g, W, yTopBlend) { // below the hip: hips plus both thighs by side (rule 8, blended leg weights)
  const P = g.attributes.position, p = V(), bi = n => C.bn.indexOf(n), H = bi('hips'), TL = bi('hipL'), TR = bi('hipR');
  const hc = wp(C.F.bones.hips).dot(C.l);
  for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); if (p.y > yTopBlend) continue;
    const u = sstep(yTopBlend, yTopBlend - 0.22 * C.k, p.y), sL = sstep(-0.05 * C.k, 0.05 * C.k, p.dot(C.l) - hc), hipW = 1 - 0.88 * u;
    const blend = [[H, hipW], [TL, (1 - hipW) * sL], [TR, (1 - hipW) * (1 - sL)]];
    const mix = 1 - sstep(yTopBlend, yTopBlend - 0.08 * C.k, p.y); // ease in from the copied weights just above
    const acc = new Map(); for (let j = 0; j < 4; j++) { const b = W.si[i * 4 + j], w = W.sw[i * 4 + j] * mix; if (w > 0) acc.set(b, (acc.get(b) || 0) + w); }
    for (const [b, w] of blend) if (w > 0) acc.set(b, (acc.get(b) || 0) + w * (1 - mix));
    const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4); const s = top.reduce((a, x) => a + x[1], 0);
    for (let j = 0; j < 4; j++) { W.si[i * 4 + j] = top[j] ? top[j][0] : 0; W.sw[i * 4 + j] = top[j] ? top[j][1] / s : 0; } }
  return W;
}
function weightsBone(C, g, name) { const n = g.attributes.position.count, b = C.bn.indexOf(name), si = new Uint16Array(n * 4).fill(0), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; } return { si, sw }; }

function skinned(C, g, W, color, name, layer, { lining = 0.55, surface = null } = {}) {
  const F = C.F, sk = F.mesh.skeleton, BM = F.mesh.bindMatrix, BMI = F.mesh.bindMatrixInverse, P = g.attributes.position, n = P.count;
  const world = Float32Array.from(P.array); // the fit-pose positions, kept for the checks
  if (!g.attributes.normal) g.computeVertexNormals(); const NA = g.attributes.normal, NM = new THREE.Matrix3(), nn = V();
  const M = new THREE.Matrix4(), T = new THREE.Matrix4(), p = V();
  const bm = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i]));
  for (let i = 0; i < n; i++) { M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    for (let j = 0; j < 4; j++) { const w = W.sw[i * 4 + j]; if (w <= 0) continue; const e = bm[W.si[i * 4 + j]].elements; for (let q = 0; q < 16; q++) M.elements[q] += e[q] * w; }
    p.fromBufferAttribute(P, i); T.copy(M).multiply(BM);
    // normals were made on the fit-pose surface; carry them with the transpose of the skin matrix (bind-space normals
    // from the inverted surface come out crumpled where weights change fast, as on a cape over the shoulders)
    nn.fromBufferAttribute(NA, i); NM.getNormalMatrix(T.clone().invert()); nn.applyMatrix3(NM).normalize(); NA.setXYZ(i, nn.x, nn.y, nn.z);
    p.applyMatrix4(T.invert()); // attached bind mode: world = MW * MW^-1 * M * BM * p = M * BM * p
    P.setXYZ(i, p.x, p.y, p.z); }
  P.needsUpdate = true; NA.needsUpdate = true;
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(W.si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(W.sw, 4));
  // round 6, surface by outfit (convention 12): working cloth matte; satin sheen only on formal robes; a gauze outer
  // lets 30 to 50% through
  const mat = surface === 'satin' ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.48, metalness: 0, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color(1, 0.96, 0.86), side: THREE.FrontSide })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: surface === 'gauze' ? 0.7 : 0.9, metalness: 0, side: THREE.FrontSide });
  const back = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, color: new THREE.Color(lining, lining, lining), side: THREE.BackSide });
  if (surface === 'gauze') { back.color.setRGB(0.92, 0.92, 0.92); for (const x of [mat, back]) { x.transparent = true; x.opacity = 0.55; x.depthWrite = false; } }
  const m = new THREE.SkinnedMesh(g, mat), mb = new THREE.SkinnedMesh(g, back);
  for (const x of [m, mb]) { x.frustumCulled = false; F.mesh.parent.add(x); x.bind(sk, BM); }
  return { name, layer, mesh: m, back: mb, geo: g, world, edge: g.userData.edge };
}

// ---------- the recipes
const isArm = (n, s) => ARM(s).includes(n);
// the shoulder cap belongs to the body piece (cut-on shoulder): upper-arm skin above the armpit is in the torso rings
const torsoOK = (C, withLegs) => (n, yy) => TORSO.includes(n) || (n === 'neck' && yy > C.ySh - 0.02) || (withLegs && (LEG('L').includes(n) || LEG('R').includes(n)) && yy < C.yHip + 0.1 * C.k);

// round 6: drop the faces whose corners fall in a gap of a ring grid (an open front, a half-cape)
function dropGap(g, nT, gapK) { const I = g.index.array, keep = []; for (let t = 0; t < I.length; t += 3) { if ([I[t], I[t + 1], I[t + 2]].some(v => gapK(v % nT))) continue; keep.push(I[t], I[t + 1], I[t + 2]); } g.setIndex(keep); return g; }
const shade = (h, m) => '#' + col(h).multiplyScalar(m).getHexString();
// round 6 edge profiles: [f across the band, extra offset]; a hem band turns under the hem, so it shows its thickness
const HEM = t => [[0, -0.004], [0, t * 0.6], [0.06, t], [0.94, t], [1, t * 0.6], [1, 0]];
// direction C: a cloud edge, rounded lobes rising off a base band (the cloud-scroll hem of the inner-alchemy concept).
// pc.cloud true keeps round 6's six lobes at 0.55; an object {n, rise} sets them. Each lobe is a round arch, not a sine.
const cloudAt = (pc, th) => { const c = pc.cloud === true ? { n: 6, rise: 0.55 } : pc.cloud, u = ((th * c.n / TAU) % 1 + 1) % 1; return c.rise * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)); };
const MOUTH = t => [[0, 0.0015], [0.08, t], [0.9, t], [1, t * 0.5], [1, -0.004], [0.2, -0.004]]; // over the sleeve mouth and back inside it: the lining shows

const NECK_BACK = 0.005; // direction A, shared neck fix: the women's back neckline 1 cm lower at the centre back, 0.5 at 135 degrees, nothing at the side
// round 2 of B and C (his note on cult-dir-b-look-1, 2026-11-02: "the undershirts need to go. We should see the skin
// where the robe crosses ... showing a bit of skin and cleavage for both genders (also in alignment with the concept
// art)"): a closed robe is cut open between its two laps above the cross, so the body shows in the V the collar bands
// draw, as in the concept frames. The cut runs a third of a band inside each lap line, so the band covers its edge; the
// covered-body mask (mix.js) then draws the skin there. `undershirt: true` on a robe puts round 6's white collar back.
function cutV(C, L, g, pc, fem) {
  const k = C.k, d = Math.PI / 180, sL = (fem ? 36 : 30) * d, yX = C.yNeck - (fem ? 0.19 : 0.22) * k, cw = (pc.collarW ?? (fem ? 0.022 : 0.045)) * k;
  const yL = L.topAt(sL) - (0.009 + (fem ? 0.01 : 0.004)) * k, m = 0.3 * cw / (0.15 * k);
  const edge = (y, sg) => { const yB = sg > 0 ? yX : yX + 0.01 * k; return y <= yB ? 0 : sg * sL * Math.min(1, (y - yB) / (yL - yB)); };
  const P = g.attributes.position, I = g.index.array, keep = [], q = V(); let cut = 0;
  const ringAt = y => L.rings.reduce((a, r) => (Math.abs(r.y - y) < Math.abs(a.y - y) ? r : a));
  for (let t = 0; t < I.length; t += 3) { q.set(0, 0, 0); for (let j = 0; j < 3; j++) q.add(V().fromBufferAttribute(P, I[t + j])); q.divideScalar(3);
    const [a, b] = C.ab(q), c = ringAt(q.y).c, th = Math.atan2(b - c[1], a - c[0]);
    if (Math.cos(th) > 0 && q.y > yX && th < edge(q.y, 1) - m && th > edge(q.y, -1) + m) { cut++; continue; }
    keep.push(I[t], I[t + 1], I[t + 2]); }
  g.setIndex(keep); return cut;
}
// round 3 of B and C: the sleeve tubes are found before the body piece is skinned, so the body's cloth over the shoulder
// can be tucked under the sleeve root (tuckUnderSleeves); the recipe is round 2's, unchanged
function sleeveTube(C, pc, sv, s) { const k = C.k, B = C.F.bones; const sh = wp(B['shoulder' + s]), el = wp(B['elbow' + s]), wr = wp(B['wrist' + s]);
    const cl = wp(B['clav' + s]), start = cl.clone().lerp(sh, C.male ? 0.5 : 0.2), sSh = start.distanceTo(sh), sEl = sSh + sh.distanceTo(el), sWr = sEl + el.distanceTo(wr);
    const okA = i => isArm(C.name(i), s), okS = i => okA(i) || (C.name(i) === 'clav' + s && C.pos(i).y < sh.y + 0.01 * k); /* round 2 of B and C: the sleeve's root takes clavicle skin only up to the shoulder joint, so it no longer domes over the trapezius and the shoulder blade (the humps on the back) */
    const T = tube(C, { chain: [start, sh, el, wr], ok: okS, s0: 0, s1: sWr + sv.ext * k, ease: sv.ease + (pc.sleeveEase || 0) + 0.006 * k, easeAt: x => 0.006 * k * Math.exp(-(((x - sEl) / (0.06 * k)) ** 2)) + (0.008 * k * sstep(0, sSh, x) + (pc.rootEase ?? (C.male ? 0.012 : 0)) * k * (1 - sstep(0, sSh, x))) * (1 - sstep(sSh + 0.02 * k, sSh + 0.14 * k, x)), /* round 3 of B and C: a man's sleeve root stands 1.2 cm out, over the body's shoulder (the peaked back) */ // the shoulder: room over the deltoid (round 2 of B and C: 8 mm, was 16, now the deltoid is drawn in by parts.json shoulder)
      fall: sv.flare >= 0.1 ? sSh + 0.05 * k : sEl + 0.02 * k, /* round 2 of B and C: a mid or wider sleeve hangs from just past the shoulder, one straight fall to the cuff over the arm's bumps, so no deltoid or biceps reads through it */ span: sEl, flare: sn => sv.flare * k * Math.pow(sstep(sv.from ?? 0.45, 1, sn), sv.pow ?? 1.5), nT: 44, smoothC: sv.smoothC ?? 0, sideBag: V(0, -1, 0).addScaledVector(C.f, sv.back ?? -0.25).addScaledVector(C.l, (s === 'L' ? 1 : -1) * (sv.out ?? 0.35)) }); // direction C: the widest sleeve opens from higher up the arm (from, pow) and its bag hangs down and back rather than out (out, back)
  return { cl, start, sSh, sEl, sWr, okA, okS, T };
}
// round 3 of B and C (his note on cult-dir-c-look-2: "Men's shoulders not so much yet"; the read: peaked, angular shoulder
// points on the men's backs): the body piece's cloth over the shoulder stood outside the sleeve root, so its cut edge drew
// a peak down the shoulder blade and a spike at the front of the armpit. Every body point within 3 cm outside a sleeve
// ring, from the sleeve's root to `reach` (10 cm) past the shoulder joint and on the upper side of the arm, goes in to 8 mm under
// that ring: the sleeve now lies over the body at the shoulder, as a set-in seam does. Only body cloth moves, never the
// sleeve (pushing the sleeve root out crumpled it in round 2), and nothing is cut (trimming the body cut holes).
function tuckUnderSleeves(C, g, tubes, { out = 0.03, under = 0.008, reach = 0.1, down = -0.25 } = {}) {
  const k = C.k, P = g.attributes.position, p = V(), q = V(), t = V();
  for (let i = 0; i < P.count; i++) { p.fromBufferAttribute(P, i); let moved = false;
    for (const { T, sSh } of tubes) { if (moved) break; const R = T.rings; let best = null;
      for (let j = 0; j < R.length && R[j].s <= sSh + reach * k; j++) { t.crossVectors(R[j].u, R[j].v); q.copy(p).sub(R[j].o); const dl = q.dot(t);
        if (j === 0 && dl < 0) { best = null; break; } if (!best || Math.abs(dl) < Math.abs(best.dl)) best = { j, dl }; }
      if (!best || Math.abs(best.dl) > 0.015 * k) continue;
      const r = R[best.j]; t.crossVectors(r.u, r.v); q.copy(p).sub(r.o); const a = q.dot(r.u), b = q.dot(r.v), dd = Math.hypot(a, b); if (dd < 1e-6) continue;
      const up = (a * r.u.y + b * r.v.y) / dd; if (up < down) continue; // the upper side only: under the arm the body stays as it is
      let th = Math.atan2(b, a); if (th < 0) th += TAU; const x = th / TAU * T.nT, k0 = Math.floor(x) % T.nT, k1 = (k0 + 1) % T.nT, rr = r.r[k0] + (r.r[k1] - r.r[k0]) * (x - Math.floor(x));
      if (dd > rr + out * k || dd < rr - under * k) continue;
      const nd = rr - under * k; p.copy(r.o).addScaledVector(t, best.dl).addScaledVector(r.u, a / dd * nd).addScaledVector(r.v, b / dd * nd); P.setXYZ(i, p.x, p.y, p.z); moved = true; } }
  P.needsUpdate = true; g.computeVertexNormals(); return g;
}
function robe(C, pc, reg, { inner = false, open = false } = {}) {
  const parts = [], k = C.k, d = Math.PI / 180, fem = !C.male;
  const yHem = Math.max(0.034 * C.k, pc.hem * C.S); // round 6: a long hem breaks on the shoe top, the toes show under it (convention 7) // round 6: men's long hems break on the shoe, women's sit lower still (convention 7)
  // round 7 finish: the men's neckline drops 4 cm at the centre front only (neckPow 6: 2.2 cm at the laps' start, 6 cm in
  // round 7), so the 4.5 cm band starts on the yoke as in round 6 and lies flat instead of flipping out over the shoulder.
  // The women's back neck sits 1 cm lower and 1.1 cm closer, so its inside no longer shows as a rim behind the dropped front.
  const yk = inner ? 0.05 : fem && !open ? 0.025 : 0.035;
  const yTop = C.yNeck + 0.02 * k, name = inner ? 'innerrobe' : open ? 'outer' : 'robe', surface = pc.surface || null;
  const L = loft(C, { yTop, yHem, regionAt: torsoOK(C, true), ease: pc.ease, flare: pc.flare || 0, folds: pc.folds || 0, foldN: pc.foldN || 11, cinch: open ? null : { y: C.yWaist, h: 0.07 * k }, topEase: inner ? 0.007 : open ? 0.028 : fem ? 0.005 : 0.016, yoke: yk, tcut: !inner, neckDrop: fem ? yk + 0.025 : 0.04, neckPow: fem ? 2 : 6, neckBack: fem && !inner && !open ? NECK_BACK : 0 });
  // round 5: baked on (the skirt hangs and settles over the legs and what is already on); round 6 bakes it longer, heavier
  (SIM.skirt ? bakeLoft : noBake)(C, L, r => r.y > (C.qixiong ? Math.min(C.yWaist - 0.035 * k, C.yHip + 0.05 * k) : C.yWaist - 0.035 * k), // a qixiong skirt is held by the hips too
    { margin: inner ? 0.004 : 0.006, secs: pc.hem < 0.05 ? 1.0 : 0.75 });
  const oa = open ? (pc.open || 12) * d : 0, gapK = kk => { const th = kk / L.nT * TAU; return th < oa || th > TAU - oa; };
  const g = loftGeo(C, L, pc.color, open ? { gap: gapK } : {});
  if (!open && !pc.undershirt) L.vCut = cutV(C, L, g, pc, fem); // round 2 of B and C: skin in the V, no undershirt
  const okW = i => { const n = C.name(i); return TORSO.includes(n) || n === 'neck' || LEG('L').includes(n) || LEG('R').includes(n); };
  pushOutOfBody(C, g, inner ? 0.003 : 0.004);
  const sv = reg.sleeves[pc.sleeve || 'mid'], SLV = {}; if (!inner) for (const s of ['L', 'R']) SLV[s] = sleeveTube(C, pc, sv, s);
  if (!inner && !open && pc.tuck !== false) { tuckUnderSleeves(C, g, Object.values(SLV)); pushOutOfBody(C, g, 0.004); } // round 3 of B and C: the body cloth goes under the sleeve root, never under the skin
  let W = weightsNearest(C, g, okW); W = weightsSkirt(C, g, W, C.yHip);
  parts.push(skinned(C, g, W, pc.color, name, LAYER[name], { surface })); parts[parts.length - 1].bake = L.bake;
  // the hem against the hip: a long robe's hem is 1.5 to 2 times the hip round (convention 7)
  { const per = R => { let s = 0; for (let t = 0; t < L.nT; t++) { const a = t / L.nT * TAU, b = (t + 1) / L.nT * TAU, ra = R.r[t], rb = R.r[(t + 1) % L.nT]; s += Math.hypot(rb * Math.cos(b) - ra * Math.cos(a), rb * Math.sin(b) - ra * Math.sin(a)); } return s; };
    const rh = L.rings.reduce((a, r) => (Math.abs(r.y - C.yHip) < Math.abs(a.y - C.yHip) ? r : a)); L.bake.hemToHip = +(per(L.rings[L.rings.length - 1]) / per(rh)).toFixed(2); }
  const trimOn = (gg, nm = name + '-trim', c = pc.trim, lining = 0.55) => parts.push(skinned(C, gg, weightsSkirt(C, gg, weightsNearest(C, gg, okW), C.yHip), c, nm, LAYER[name], { surface: surface === 'gauze' ? null : surface, lining }));
  const tk = 0.004 * k; // band thickness
  if (inner) return { parts, loft: L };
  // round 3 of B and C (his note on cult-dir-c-look-2: "The female need to have cleavage where the skin is showing OR a
  // wrap that cuts across the chest but under the armpits to maintain modesty"): a woman's closed robe without an
  // undershirt carries a chest wrap (moxiong) in `wrap` (or the robe's `under`), seen in the V from the cross up to 7 cm
  // above it, just inside the robe, so the skin of the upper chest shows over it and the robe's own V edges lie on top
  if (fem && !open && L.vCut && pc.wrap !== false) { const sL = 36 * d, yX = C.yNeck - 0.19 * k, wc = pc.wrap || pc.under || pc.trim;
    const wb = ringBand2(C, L, yX - 0.01 * k, () => yX + (pc.wrapH ?? 0.07) * k, -0.008, wc, 144, 0, [[0, 0], [0, 0.001], [0.12, 0.002], [0.88, 0.002], [1, 0.001], [1, 0]]);
    dropGap(wb, 144, kk => { const th = kk / 144 * TAU; return Math.cos(th) < Math.cos(sL + 14 * d); }); trimOn(wb, 'wrap', wc); }
  // hem band: a built piece 3 to 4 cm, turning under the hem (conventions 1, 2); a cloud hem rises and falls
  const hw = (pc.hemBand ?? 0.035) * k;
  if (hw > 0) { const hi = th => yHem + hw * (pc.cloud ? 1 + cloudAt(pc, th) : 1), hb = ringBand2(C, L, yHem + 0.001, hi, 0.002, pc.band || pc.trim, 144, 0, HEM(tk));
    if (open) dropGap(hb, 144, kk => { const th = kk / 144 * TAU; return th < oa || th > TAU - oa; }); trimOn(hb, name + '-trim', pc.band || pc.trim); }
  const yB = L.yTop - 0.009 * k; // the collar edge runs on the yoke close to the neck
  const yBa = th => L.topAt(th) - 0.009 * k; // round 7: and drops with the neckline towards the front
  if (open) {
    // an open outer: the band follows the front edges from the back of the neck to the hem (convention 2), with a thin
    // line inside it (14); it hangs straight on either side and is never belted shut (15)
    const ob = 0.007, bw = (pc.bandW ?? 0.035) * k, /* round 7 finish: bands 7 mm out, clear of the gauze yoke (A1's pink neck patch was the band seen through it) */ r0 = 0.17 * k, te = oa + 0.5 * bw / r0, tl = te + (0.5 * bw + 0.011 * k) / r0;
    for (const sg of [1, -1]) { trimOn(bandOnLoft(C, L, line([sg * te, yBa(te)], [sg * te, yHem + hw * 0.6], 50), bw, ob, pc.band, 3, tk), name + '-trim', pc.band);
      if (pc.line) trimOn(bandOnLoft(C, L, line([sg * tl, yBa(tl) - 0.01 * k], [sg * tl, yHem + hw + 0.01 * k], 50), 0.007 * k, 0.003, pc.line, 3, tk * 0.6), name + '-trim', pc.line); }
    trimOn(bandOnLoft(C, L, line([te, yB], [TAU - te, yB], 30).map(([th]) => [th, yBa(th)]), bw * 0.8, ob, pc.band, 3, tk), name + '-trim', pc.band);
  } else {
    // cross collar (jiaoling), left over right: the left front crosses to the wearer's right at the bust, 16 to 22 cm under
    // the throat for women and 20 to 24 for men (convention 5), and runs on to the right side seam, where the band ends
    // (2). Women's band 2 cm in the robe's own cloth, men's 4.5 cm in the trim (1). No band runs down the front any more.
    const cw = (pc.collarW ?? (fem ? 0.022 : 0.045)) * k, cc = pc.collarColor || (fem ? shade(pc.color, 0.82) : pc.trim);
    const sL = (fem ? 36 : 30) * d, yX = C.yNeck - (fem ? 0.19 : 0.22) * k, ySt = C.yWaist + 0.04 * k, ySide = Math.min(yX - 0.05 * k, Math.max(ySt + 0.01 * k, yX - 0.16 * k));
    const yL = yBa(sL) - (fem ? 0.01 : 0.004) * k, lap = line([sL, yL], [0, yX], 22) /* the laps start under the neck ring, off the steep yoke */.concat(line([0, yX], [-86 * d, ySide], 26).slice(1));
    // direction A, shared neck fix: at its ends the neck ring's lower edge stays 3 mm above the laps' top (easing down 1 mm a
    // degree behind them), so its end is cut level with the lap and no pointed tab hangs beside it; a lap's corner outside the ring's
    // ends comes down to the ring's lower edge (capLap)
    const a0 = sL + (fem ? 4 : -3) * d, wr = th => Math.abs(Math.atan2(Math.sin(th), Math.cos(th))), capLap = th => (wr(th) < a0 ? yBa(th) - 0.011 * k : 9);
    const neckBand = (lo, hi, a0, off, c, t) => { const nb = ringBand2(C, L, lo, th => hi(th) + 0.004 * k, off, c, 144, 0, [[0, 0], [0, t], [0.1, t * 1.2], [0.9, t * 1.2], [1, t], [1, 0]], 3); dropGap(nb, 144, kk => { const th = kk / 144 * TAU; return th < a0 || th > TAU - a0; }); return nb; };
    trimOn(neckBand(th => Math.max(yBa(th) - 0.014 * k, yL + 0.003 * k - 0.001 * k * Math.max(0, wr(th) - a0) / d), yBa, a0, 0.0045, cc, tk) /* round 7 finish: 4.5 mm out (2 mm flickered through the yoke at the shoulder turn); a man's ring runs 3 degrees past his laps' start, which sit at 30 degrees and higher, so the 4.5 cm lap tucks under it with no notch */, name + '-trim', cc, 1); /* round 7 finish: the ring's inside, seen over the dropped front, is the same cloth (0.55 drew a dark rim behind the neck) */ // round the back of the neck: a ring on the yoke (a strip across the steep yoke spiked)
    trimOn(bandOnLoft(C, L, line([-sL, yL], [0, yX + 0.01 * k], 16), cw * 0.95, 0.002, cc, 3, tk * 0.8, null, capLap), name + '-trim', cc); // the under lap, going under at the cross
    trimOn(bandOnLoft(C, L, lap, cw, 0.004, cc, 3, tk, null, capLap), name + '-trim', cc);
    // the undershirt: a white crossed collar 1 to 2 cm inside the outer one, and its line round the back of the neck (3)
    if (pc.undershirt) { // round 6's undershirt collar; off by default since round 2 of B and C (skin shows in the V instead)
      const uc = pc.under || '#ebe5d6', uw = 0.02 * k, gap = cw * 0.5 + 0.012 * k;
      trimOn(bandOnLoft(C, L, line([sL - 6 * d, yBa(sL - 6 * d) - 0.006 * k], [0, yX + gap * 1.4], 18), uw + gap, 0.001, uc, 3, tk * 0.5), name + '-trim', uc);
      trimOn(bandOnLoft(C, L, line([-(sL - 6 * d), yBa(sL - 6 * d) - 0.006 * k], [0, yX + gap * 1.4 + 0.01 * k], 18), uw + gap, 0.0005, uc, 3, tk * 0.5), name + '-trim', uc); }
    if (pc.under && pc.underHem !== false && yHem > 0.05 * C.S) trimOn(ringBand2(C, L, yHem - 0.028 * k, () => yHem + 0.004, -0.004, pc.under), name + '-trim', pc.under); // an inner robe's hem shows under a short robe only
  }
  // sleeves: the T-cut sleeve spans the arm's hollows (no cap, no deltoid lump), hangs from the elbow, and ends in a
  // built mouth band whose lining shows (convention 8); under it the undershirt's cuff (3); bracers where named (8)
  for (const s of ['L', 'R']) { const B = C.F.bones; const sh = wp(B['shoulder' + s]), el = wp(B['elbow' + s]), wr = wp(B['wrist' + s]);
    // round 6, T-cut: the sleeve starts on the shoulder slope, a third of the way out from the clavicle's root, and takes
    // the shoulder's own skin, so it covers the shoulder as one piece with the body and the seam drops down the arm
    // (convention 6). Round 5 started it 3.5 cm inside the shoulder joint, so the body piece stood out over it as a cap.
    const { start, sSh, sEl, sWr, okA, okS, T } = SLV[s];
    { const cs = C.colliders; if (open) C.colliders = []; (SIM.sleeve ? bakeTube : noBake)(C, T, r => r.s < sEl, { margin: 0.005 }); C.colliders = cs; } // an outer sleeve is cut clear of the one under it
    const gS = tubeGeo(C, T, pc.dbg || pc.color); if (open) { // round 7 finish: an open outer's sleeve root stops under its neck band, so the band is never seen through the gauze (A1's pink neck patch in round 7)
      const P = gS.attributes.position, I = gS.index.array, keep = [], c0 = L.rings[0].c, q = V();
      const hi = v => { q.fromBufferAttribute(P, v); const [a, b] = C.ab(q); return q.y > L.topAt(Math.atan2(b - c0[1], a - c0[0])) - 0.009 * k - 0.45 * (pc.bandW ?? 0.035) * k; };
      for (let t = 0; t < I.length; t += 3) if (!(hi(I[t]) || hi(I[t + 1]) || hi(I[t + 2]))) keep.push(I[t], I[t + 1], I[t + 2]);
      gS.setIndex(keep); } if (!C.male) pushOutOfBody(C, gS, 0.004); /* the women's sleeve root sits nearer the neck */ const WS = weightsNearest(C, gS, okS), sn = (open ? 'outer' : 'robe') + '-sleeve' + s;
    parts.push(skinned(C, gS, WS, pc.color, sn, LAYER[name], { surface })); parts[parts.length - 1].bake = T.bake;
    const sEnd = T.rings[T.rings.length - 1].s, lw = (sv.mouth ?? (sv.flare > 0.1 ? 0.065 : 0.035)) * k, lc = pc.lining || pc.band || pc.trim;
    const mb = tubeBand(C, T, sEnd - lw, sEnd, MOUTH(tk), lc, pc.cloud && pc.cloudCuff ? th => sEnd - lw * (1 + cloudAt(pc.cloudCuff === true ? pc : { cloud: pc.cloudCuff }, th)) : null); parts.push(skinned(C, mb, weightsNearest(C, mb, okA), lc, sn.replace('sleeve', 'cuff'), LAYER[name], { surface: surface === 'gauze' ? null : surface }));
    if (pc.bracer) { const bl = 0.21 * k, bb = tubeBand(C, T, sEnd - bl, sEnd + 0.002, [[0, 0.002], [0.03, 0.008], [0.97, 0.008], [1, 0.002]], pc.bracer);
      parts.push(skinned(C, bb, weightsNearest(C, bb, okA), pc.bracer, 'bracer' + s, LAYER[name])); }
    if (!open && !pc.bracer && pc.undershirt) { // the undershirt cuff (off unless the robe names its undershirt, round 2 of B and C): 1.5 cm past a narrow or mid sleeve; inside a wide one it shows in the mouth
      const Lf = el.distanceTo(wr), peek = sv.flare > 0.2 ? 0.02 : sv.ext + 0.015;
      const TI = tube(C, { chain: [el, wr], ok: i => /^(elbow|foreSwing)/.test(C.name(i)) && C.name(i).endsWith(s), s0: Lf - 0.09 * k, s1: Lf + peek * k, ease: 0.004 * k, nT: 32, ds: 0.012 });
      const uc = pc.under || '#ebe5d6', gi = tubeGeo(C, TI, uc); parts.push(skinned(C, gi, weightsNearest(C, gi, okA), uc, 'undercuff' + s, LAYER.innerrobe)); }
  }
  return { parts, loft: L };
}
function ringBand2(C, L, lo, hi, off, color, nT = 144, rows = 3, prof = null, smooth = 0) {
  // round 6: prof [[f, extra off]...] from the low edge (f 0) to the high edge (f 1); a thick hem band turns under the hem
  // and a sash bulges, so both read as pieces with thickness
  if (!prof) prof = Array.from({ length: rows }, (_, j) => [j / (rows - 1), 0]);
  rows = prof.length; const P = [], Cc = [], E = [], I = [], c0 = col(color);
  for (const [f, ex] of prof) { const row = [];
    for (let k = 0; k < nT; k++) { const th = k / nT * TAU, lo0 = typeof lo === 'function' ? lo(th) : lo, yy = lo0 + (hi(th) - lo0) * f; row.push([th, yy, loftAt(L, th, yy)]); }
    // direction A, shared neck fix: smooth (n steps) takes the running mean of the radius, never more than 3 mm inside the
    // cloth it sits on (the band stands 4.5 mm out), so a ring on a rough yoke runs as one smooth band with no shingled
    // steps at the shoulder turn; a running max first pushed the ring through B1's cape at the shoulder
    let R = row.map(([, , s]) => s.r); if (smooth) { const R0 = R; R = R0.map((r, k) => Math.max(r - 0.003, Array.from({ length: 2 * smooth + 1 }, (_, j) => R0[(k + j - smooth + nT) % nT]).reduce((a, b) => a + b) / (2 * smooth + 1))); }
    row.forEach(([th, yy, s], k) => { const rr = R[k] + off + ex, p = C.fromAB(s.c[0] + rr * Math.cos(th), s.c[1] + rr * Math.sin(th), yy); P.push(p.x, p.y, p.z); Cc.push(c0.r, c0.g, c0.b); E.push(0); }); }
  for (let j = 0; j < rows - 1; j++) for (let k = 0; k < nT; k++) { const a = j * nT + k, b = j * nT + (k + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); }
  return orientOut(finish(P, Cc, E, I), p => C.fromAB(L.rings[0].c[0], L.rings[0].c[1], p.y));
}
// round 6: a band on a tube between two lengths (cuff, lining at the sleeve mouth, bracer); prof [[f, extra off]...]
function tubeAt(T, s, k) { const R = T.rings; let i = 0; while (i < R.length - 2 && R[i + 1].s < s) i++; const a = R[i], b = R[i + 1], t = THREE.MathUtils.clamp((s - a.s) / ((b.s - a.s) || 1), 0, 1);
  const o = a.o.clone().lerp(b.o, t), u = a.u.clone().lerp(b.u, t).normalize(), v = a.v.clone().lerp(b.v, t).normalize(); return { o, u, v, r: a.r[k] * (1 - t) + b.r[k] * t }; }
function tubeBand(C, T, sA, sB, prof, color, sAAt = null) { // sAAt(th): the band's inner edge varies round the tube (a cloud cuff)
  const nT = T.nT, P = [], Cc = [], E = [], I = [], c0 = col(color);
  for (const [f, ex] of prof) for (let k = 0; k < nT; k++) { const th = k / nT * TAU, a0 = sAAt ? sAAt(th) : sA, q = tubeAt(T, a0 + (sB - a0) * f, k), rr = Math.max(0.003, q.r + ex);
    const p = q.o.clone().addScaledVector(q.u, rr * Math.cos(th)).addScaledVector(q.v, rr * Math.sin(th)); P.push(p.x, p.y, p.z); Cc.push(c0.r, c0.g, c0.b); E.push(0); }
  for (let j = 0; j < prof.length - 1; j++) for (let k = 0; k < nT; k++) { const a = j * nT + k, b = j * nT + (k + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); }
  const g = finish(P, Cc, E, I); const axis = p => { let b = T.rings[0], bd = 1e9; for (const r of T.rings) { const d = r.o.distanceTo(p); if (d < bd) { bd = d; b = r; } } return b.o; };
  return orientOut(g, axis);
}

function sash(C, pc, L) {
  const k = C.k, h = pc.h * k, y0 = C.yWaist, parts = [], d = Math.PI / 180, qx = !!C.qixiong;
  const okT = i => TORSO.includes(C.name(i)) || LEG('L').includes(C.name(i)) || LEG('R').includes(C.name(i));
  // round 6: a sash with volume (convention 9): it rounds out from the cloth and back, 1.3 cm at its fullest
  const g = ringBand2(C, L, y0 - h / 2, () => y0 + h / 2, 0.004, pc.color, 96, 0, [[0, 0], [0.06, 0.006], [0.3, 0.011], [0.5, 0.013], [0.7, 0.011], [0.94, 0.006], [1, 0]]);
  parts.push(skinned(C, g, weightsNearest(C, g, okT), pc.color, 'sash', LAYER.sash));
  if (pc.belt || (C.male && pc.belt !== false)) { // men: a 4 to 6 cm belt over the soft sash (convention 9)
    const bc = pc.belt || '#3a2c22', bw = 0.05 * k, yb = y0 - h * 0.08, gb = ringBand2(C, L, yb - bw / 2, () => yb + bw / 2, 0.004, bc, 96, 0, [[0, 0.011], [0.08, 0.018], [0.92, 0.018], [1, 0.011]]);
    parts.push(skinned(C, gb, weightsNearest(C, gb, okT), bc, 'sash-belt', LAYER.sash)); }
  // accessories round 2 (his A on cult-acc-look-1): the tails, the knot and the jade disc are rigid carved pieces from
  // accessories.js, lying on the skirt's loft; no drape
  const AH = { loftAt, skinned, weightsBone, weightsNearest, weightsSkirt, LAYER, okT };
  parts.push(...ACC.sashTails(C, pc, L, AH), ...ACC.sashKnot(C, pc, L, AH));
  if (pc.pendant) parts.push(...ACC.pendant(C, pc, L, AH));
  return parts;
}

// direction C: the fly-whisk (fuchen), the adept's one prop. A turned wooden handle hooked through the sash at the
// wearer's left front, its head up and out; the white horsehair falls from the head down the robe as three strands laid
// on the cloth and settled like the sash tails (so the drag chains take them). pc: {handle, hair, at (deg), len (m)}.
function whisk(C, pc, L) { // accessories round 2: the carved whisk from accessories.js (handle, ferrule, horsehair lock)
  const okT = i => TORSO.includes(C.name(i)) || LEG('L').includes(C.name(i)) || LEG('R').includes(C.name(i));
  return ACC.whisk(C, pc, L, { loftAt, skinned, weightsBone, weightsNearest, weightsSkirt, LAYER, okT });
}

function cape(C, pc, robeL) {
  const k = C.k, yTop = C.yNeck + 0.02 * k, yHem = C.ySh - pc.drop * k, d = Math.PI / 180, open = 16 * d;
  const okR = (n, yy) => TORSO.includes(n) || n === 'neck' || ['shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'foreSwingL', 'foreSwingR'].includes(n);
  const L = loft(C, { yTop, yHem, regionAt: okR, ease: (pc.ease ?? 0.075) * k, topEase: 0.018, flare: 0.02, folds: 0, cinch: null, nT: 72, yoke: 0.03, neckDrop: 0.055 }); // round 7 finish: the back of the cape 1.5 cm lower, off the jaw line // round 7: the cape's neckline drops to the hollow of the throat too
  // gravity from the shoulder down: the cape never draws in under the arms
  for (let i = 1; i < L.rings.length; i++) if (L.rings[i].y < C.ySh) for (let t = 0; t < L.nT; t++) L.rings[i].r[t] = Math.max(L.rings[i].r[t], L.rings[i - 1].r[t]);
  for (const r of L.rings) for (let pass = 0; pass < 3; pass++) r.r = circSmooth(r.r, 3); // a felt cape lies smooth over the arms
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < L.rings.length - 1; i++) for (let t = 0; t < L.nT; t++) L.rings[i].r[t] = Math.max(L.rings[i].r[t], (L.rings[i - 1].r[t] + L.rings[i + 1].r[t]) / 2);
  // round 7 finish: over the chest the cape lies on the robe (1.5 cm off it, the felt's own thickness) instead of standing
  // off it as a dome; under the bust it may only come in 3 mm a ring, so it hangs from the chest rather than wrapping in
  if (robeL) { const c0 = L.rings; for (let t = 0; t < L.nT; t++) { const th = t / L.nT * TAU, ct = Math.cos(th), st = Math.sin(th), w = sstep(0.15, 0.55, ct); if (w <= 0) continue;
    let prev = null; for (const r of L.rings) { if (r.y > robeL.yTop || r.y < robeL.yHem) { prev = r.r[t]; continue; }
      const q = loftAt(robeL, th, r.y), tgt = (q.a - r.c[0]) * ct + (q.b - r.c[1]) * st + 0.015 * k;
      let v = r.r[t] + (Math.min(r.r[t], tgt) - r.r[t]) * w; if (prev != null) v = Math.max(v, prev - 0.003 * k * w - (1 - w) * 9); r.r[t] = v; prev = v; } } }
  const hi = (pc.half ? 200 : 360) * d - open; const gap = kk => { const th = kk / L.nT * TAU; return th < open || th > open + hi; }; // round 6: a half-cape over the left shoulder, the outfit's one accent (conventions 6, 10)
  const g = loftGeo(C, L, pc.color, { gap });
  const parts = [skinned(C, g, weightsNearest(C, g, i => okR(C.name(i))), pc.color, 'cape', LAYER.cape, { lining: 0.8 })];
  const hb = ringBand2(C, L, yHem + 0.002, () => yHem + 0.03 * k, 0.003, pc.trim);
  // drop the hem band's front gap the same way
  dropGap(hb, 144, kk => { const th = kk / 144 * TAU; return th < open + 0.02 || th > open + hi - 0.02; });
  parts.push(skinned(C, hb, weightsNearest(C, hb, i => okR(C.name(i))), pc.trim, 'cape-trim', LAYER.cape));
  return { parts, loft: L };
}

function trousers(C, pc) {
  const parts = [], k = C.k;
  for (const s of ['L', 'R']) { const B = C.F.bones, hp = wp(B['hip' + s]), kn = wp(B['knee' + s]), an = wp(B['ankle' + s]); const top = hp.clone().add(V(0, 0.03 * k, 0)); // the trousers stop under the sash line: the robe hugs the waist now
    const sg = s === 'L' ? 1 : -1; const ok = i => { const n = C.name(i); return LEG(s).includes(n) || (n === 'hips' && C.side(i) === sg); };
    const L = top.distanceTo(hp) + hp.distanceTo(kn) + kn.distanceTo(an);
    const T = tube(C, { chain: pc.wide ? [top, hp, an] : [top, hp, kn, an] /* wide: one straight fall from the hip, no ring kink at the knee */, ok, s0: 0, s1: L - (pc.full ? 0.025 : 0.035) * k, /* direction C: full-length wide trousers reach the shoe */ ease: 0.006 * k, flare: sn => (pc.loose || 0) * k * sstep(0.35, 1, sn), nT: 40, ...(pc.wide ? { cyl: top.distanceTo(hp) + 0.25 * hp.distanceTo(an), easeAt: x => pc.wide * k * (0.25 + 0.75 * sstep(0.2 * L, 0.85 * L, x)) } : {}) }); // direction C: wide trousers (kuku) spread all round from the hip to the shoe, spanning the knee's hollows
    const g = tubeGeo(C, T, pc.color); parts.push(skinned(C, g, weightsNearest(C, g, ok), pc.color, 'trousers' + s, LAYER.trousers)); }
  return parts;
}
function shin(C, pc, name, from, ease, colorAt) {
  const parts = [], k = C.k;
  for (const s of ['L', 'R']) { const B = C.F.bones, kn = wp(B['knee' + s]), an = wp(B['ankle' + s]); const L = kn.distanceTo(an);
    const ok = i => LEG(s).includes(C.name(i)) && C.name(i) === 'knee' + s;
    const T = tube(C, { chain: [kn, an], ok, s0: from * L, s1: L + 0.005 * k, ease: ease * k, nT: 40, ds: 0.012 });
    const g = tubeGeo(C, T, pc.color, colorAt); parts.push(skinned(C, g, weightsNearest(C, g, i => LEG(s).includes(C.name(i))), pc.color, name + s, LAYER[name])); }
  return parts;
}
function feet(C, pc, name, off, upTo) {
  const ok = i => FOOT('L').concat(FOOT('R')).includes(C.name(i)) && C.B.P[C.rep[i] * 3 + 1] < C.yAnkle + upTo * C.k;
  const g = shell(C, ok, off * C.k, pc.color);
  return [skinned(C, g, weightsNearest(C, g), pc.color, name, LAYER[name])];
}

function hair(C, style, color, backAt, opt = {}) {
  const k = C.k, parts = [], hi = C.bn.indexOf('head'), H = wp(C.F.bones.head);
  let fmax = -1e9; for (const i of C.uniq) if (C.dom[i] === hi) fmax = Math.max(fmax, C.pos(i).dot(C.f));
  const hf = H.dot(C.f);
  const ok = i => { if (C.dom[i] !== hi) return false; const p = C.pos(C.rep[i]); const fy = p.dot(C.f) - hf; const top = C.crown - p.y;
    if (top < 0.075 * k) return true; // crown cap
    return fy < -0.012 * k && top < 0.17 * k; }; // back of the head down to the nape, behind the ears; the face left bare
  if (style !== 'long') { const g = shell(C, ok, 0.008 * k, color); parts.push(skinned(C, g, weightsNearest(C, g), color, 'hair-cap', LAYER.hair)); }
  const crownP = V(H.x, C.crown, H.z).addScaledVector(C.f, -0.012 * k);
  const add = (geo, m, c, bone = 'head', nm = 'hair') => { const gg = solid(C, geo, m, c); parts.push(skinned(C, gg, C.hairW ? C.hairW(gg, bone) : weightsBone(C, gg, bone), c, nm, LAYER.hair)); }; // shells round 2: C.hairW skins the strand to the back it lies on
  if (style === 'topknot' || style === 'crown') {
    const kp = crownP.clone().add(V(0, 0.028 * k, 0));
    add(new THREE.SphereGeometry(0.04 * k, 20, 14), new THREE.Matrix4().makeTranslation(kp.x, kp.y, kp.z).multiply(new THREE.Matrix4().makeScale(1, 0.85, 1)), color);
    const pin = new THREE.CylinderGeometry(0.0035 * k, 0.0035 * k, 0.15 * k, 8); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), C.l);
    if (opt.crown !== 'leaf') add(pin, new THREE.Matrix4().compose(kp.clone().add(V(0, 0.006 * k, 0)), q, V(1, 1, 1)), style === 'crown' ? (C.metal || '#b8955a') : '#8a6a44', 'head', 'hair-pin');
    if (style === 'crown') { const cg = new THREE.CylinderGeometry(0.026 * k, 0.034 * k, 0.045 * k, 20, 1, false);
      if (opt.crown !== 'leaf') add(cg, new THREE.Matrix4().makeTranslation(kp.x, kp.y + 0.012 * k, kp.z), C.metal || '#b8955a', 'head', 'hair-crown');
      else { // direction C: a gold leaf crown, a band round the head at the crown with leaves rising off it, tallest at the front
        const gold = C.metal || '#b8955a', cy = C.crown - 0.025 * k, H0 = V(H.x, cy, H.z).addScaledVector(C.f, -0.012 * k); let rB = 0.03 * k; for (const i of C.uniq) { if (C.dom[i] !== hi) continue; const p = C.pos(i); if (Math.abs(p.y - cy) < 0.008 * k) rB = Math.max(rB, Math.hypot(p.x - H0.x, p.z - H0.z)); } rB += 0.012 * k; // the band clears the hair cap
        const tq = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), V(0, 1, 0));
        add(new THREE.TorusGeometry(rB, 0.0045 * k, 8, 40), new THREE.Matrix4().compose(H0, tq, V(1, 1, 1.15)), gold, 'head', 'hair-crown');
        for (let j = 0; j < 11; j++) { const a = (j - 5) / 5 * 1.25, out = V().addScaledVector(C.f, Math.cos(a)).addScaledVector(C.l, Math.sin(a)), hgt = (0.05 - 0.022 * Math.abs(j - 5) / 5) * k;
          const base = H0.clone().addScaledVector(out, rB * (Math.abs(a) < 0.9 ? 1.04 : 1.0)), dir = out.clone().multiplyScalar(0.35).add(V(0, 1, 0)).normalize();
          const lq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir); const tw = new THREE.Quaternion().setFromAxisAngle(dir, Math.atan2(out.x, out.z));
          add(new THREE.ConeGeometry(0.011 * k, hgt, 4), new THREE.Matrix4().compose(base.clone().addScaledVector(dir, hgt / 2), tw.multiply(lq), V(1, 1, 0.35)), gold, 'head', 'hair-crown'); } } }
  }
  if (style === 'long') { // hair falling from the nape to the shoulder blades, lying on the robe
    // shells round 3: one smooth sheet, not a stack of lobes (round 2 drew 30 flattened spheres 1.1 cm apart, which read
    // as stacked bands from behind). Each row is an ellipse across the back (half-width wdt, half-depth 0.016) centred on
    // the line backAt gives, rows 6 mm apart, the tip rounded; the strands are painted as fine darker partings down the
    // sheet. The part above the neck base rides the head, the part below lies on the back (C.hairW), with an overlap.
    const y0 = C.crown - 0.13 * k, y1 = C.yNeck - 0.24 * k, yS = C.yNeck + 0.01 * k;
    // round 4 fix 3 (tuck): the upper sheet's lowest 1.5 cm tucks 8% inside the lower one and is left open, so no edge line
    // shows across the strands at the neck
    const sheet = (ya, yb, bone, tuck = false) => { const n = Math.max(2, Math.round((ya - yb) / (0.006 * k))), nT = 40, P = [], Cc = [], I = [], c0 = col(color);
      for (let j = 0; j <= n; j++) { const yy = ya + (yb - ya) * j / n, u = (y0 - yy) / (y0 - y1), bk = backAt(yy), o = C.fromAB(bk[0], bk[1], yy);
        const tk = tuck ? 1 - 0.08 * Math.min(1, Math.max(0, (yb + 0.015 * k - yy) / (0.015 * k))) : 1; const tip = tk * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - 0.86) / 0.14), 2))), wdt = (0.062 - 0.02 * u * u) * k * Math.max(0.04, tip), dep = 0.016 * k * Math.max(0.15, tip);
        for (let t = 0; t < nT; t++) { const th = t / nT * Math.PI * 2, x = Math.cos(th), z = Math.sin(th); const p = o.clone().addScaledVector(C.l, wdt * x).addScaledVector(C.f, dep * z); P.push(p.x, p.y, p.z);
          const strand = 0.84 + 0.16 * Math.sin(x * 31.0 + 1.3) * Math.sin(x * 13.0 + 0.4), part = 1 - 0.22 * Math.pow(Math.max(0, Math.sin(x * 9.5 * Math.PI)), 24); const sheen = 1 + 0.35 * Math.exp(-Math.pow((u - 0.12) / 0.07, 2)) * Math.max(0, z) * (1 - x * x); Cc.push(c0.r * strand * part * sheen, c0.g * strand * part * sheen, c0.b * strand * part * sheen); } } // a soft sheen band where the hair rounds over the nape
      for (let j = 0; j < n; j++) for (let t = 0; t < nT; t++) { const a = j * nT + t, b = j * nT + (t + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); }
      // close the bottom ring to its centre
      if (!tuck) { const last = n * nT, ctr = P.length / 3, ob = C.fromAB(...backAt(yb), yb); P.push(ob.x, ob.y, ob.z); Cc.push(c0.r, c0.g, c0.b); for (let t = 0; t < nT; t++) I.push(last + t, ctr, last + (t + 1) % nT); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
      { const N = g.attributes.normal, p = V(), nn = V(), q = 2 * nT + 10; p.fromBufferAttribute(g.attributes.position, q); nn.fromBufferAttribute(N, q); const oc = C.fromAB(...backAt(p.y), p.y); if (nn.dot(p.clone().sub(oc)) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const s2 = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = s2; } g.computeVertexNormals(); } }
      g.userData.edge = new Float32Array(P.length / 3).fill(1);
      parts.push(skinned(C, g, C.hairW ? C.hairW(g, bone) : weightsBone(C, g, bone), color, 'hair-long', LAYER.hair)); };
    sheet(y0, yS - 0.012 * k, 'head', true); sheet(yS + 0.012 * k, y1, 'spine03');
    // fuller at the back of the head, so the hair does not read as a cap
    const nb = C.fromAB(...backAt(C.crown - 0.1 * k), C.crown - 0.1 * k);
    add(new THREE.SphereGeometry(1, 18, 12), new THREE.Matrix4().makeTranslation(nb.x, nb.y, nb.z).multiply(new THREE.Matrix4().makeRotationY(Math.atan2(-C.l.z, C.l.x))).multiply(new THREE.Matrix4().makeScale(0.075 * k, 0.07 * k, 0.03 * k)), color, 'head', 'hair-long');
  }
  if (style === 'braid') {
    const y0 = C.crown - 0.15 * k, y1 = C.yWaist + 0.04 * k, n = Math.round((y0 - y1) / (0.028 * k));
    for (let j = 0; j <= n; j++) { const yy = y0 + (y1 - y0) * j / n; const bk = backAt(yy); const p = C.fromAB(bk[0], bk[1], yy).addScaledVector(C.l, (j % 2 ? 1 : -1) * 0.005 * k);
      const r = (0.021 - 0.006 * j / n) * k; add(new THREE.SphereGeometry(r, 12, 8), new THREE.Matrix4().makeTranslation(p.x, p.y, p.z).multiply(new THREE.Matrix4().makeScale(1, 1.35, 0.8)), color, yy > C.yNeck ? 'head' : 'spine03', 'hair-braid'); }
    const e = backAt(y1 - 0.02 * k), pe = C.fromAB(e[0], e[1], y1 - 0.02 * k);
    add(new THREE.CylinderGeometry(0.012 * k, 0.012 * k, 0.018 * k, 10), new THREE.Matrix4().makeTranslation(pe.x, pe.y, pe.z), '#8c4a32', 'spine03', 'hair-tie');
  }
  return parts;
}

// ---------- an outfit
export function dress(C, reg, outfitKey) {
  const o = reg.outfits[outfitKey]; if (!o) throw new Error('outfit ' + outfitKey);
  const parts = []; let outer = null, capeL = null;
  // round 6: men wear the sash lower, on the hip bones (convention 9), and the same parts as women (13); a qixiong
  // outfit on a woman ties under the bust (9), so its waist is there
  C.male = !(C.F.mix && C.F.mix.gender === 'f'); C.yWaist = C.yHip + (C.male ? 0.08 : 0.11) * C.k; C.qixiong = false; C.metal = o.metal || null;
  if (o.qixiong && !C.male) { let best = -1e9, yA = C.yWaist; for (const i of C.uniq) { const n = C.name(i), p = C.pos(i); if (!TORSO.includes(n) || p.y > C.ySh - 0.05 * C.k || p.y < C.ySh - 0.3 * C.k) continue; const fw = p.dot(C.f); if (fw > best) { best = fw; yA = p.y; } }
    C.yWaist = yA - 0.075 * C.k; C.qixiong = true; }
  C.colliders = []; const addCol = from => { for (const pt of parts.slice(from)) { if (/hair|sash|pendant|whisk/.test(pt.name)) continue; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(pt.world), 3)); g.setIndex(pt.geo.index.clone()); C.colliders.push({ bvh: new MeshBVH(g), geo: g }); } };
  for (const pc of o.pieces) { const from = parts.length;
    if (pc.p === 'trousers') parts.push(...trousers(C, pc));
    else if (pc.p === 'legwraps') { const bc = col(pc.band), c0 = col(pc.color); parts.push(...shin(C, pc, 'legwraps', 0.12, 0.024, (r, kk) => (Math.sin(TAU * (r.s / (0.05 * C.k) + 1.5 * kk / 40)) > 0.55 ? bc : c0))); }
    else if (pc.p === 'shoes') parts.push(...feet(C, pc, 'shoes', 0.007, 0.03));
    else if (pc.p === 'boots') { const longRobe = o.pieces.some(q => q.p === 'robe' && q.hem < 0.15); parts.push(...feet(C, pc, 'boots', 0.011, 0.06)); parts.push(...shin(C, pc, 'boots', longRobe ? 0.72 : 0.42, longRobe ? 0.02 : 0.03, null)); } // round 6: under a long robe the boot shaft is short (unseen, and it came through the skirt)
    else if (pc.p === 'innerrobe') { const r = robe(C, pc, reg, { inner: true }); parts.push(...r.parts); }
    else if (pc.p === 'robe') { const r = robe(C, pc, reg); parts.push(...r.parts); outer = r.loft; }
    else if (pc.p === 'outer') { const r = robe(C, pc, reg, { open: true }); parts.push(...r.parts); outer = r.loft; }
    else if (pc.p === 'sash') parts.push(...sash(C, pc, outer));
    else if (pc.p === 'whisk') parts.push(...whisk(C, pc, outer));
    else if (pc.p === 'cape') { const r = cape(C, pc, outer); parts.push(...r.parts); capeL = r.loft; }
    else if (pc.p === 'hair') { const fem = C.F.mix && C.F.mix.gender === 'f'; const styles = (fem || pc.long) && pc.style !== 'braid' ? [pc.style, 'long'] : [pc.style];
      for (const st of styles) parts.push(...hair(C, st, reg.hairColor, yy => { const L = capeL && yy > capeL.yHem ? capeL : outer; const s = loftAt(L, Math.PI, yy); return [s.c[0] + (s.r + 0.018 * C.k) * Math.cos(Math.PI), s.c[1] + (s.r + 0.018 * C.k) * Math.sin(Math.PI)]; }, pc)); }
    else throw new Error('piece ' + pc.p);
    addCol(from); // round 5: what is on already is what the next layer drapes over
  }
  return parts;
}

// shells round: the pieces the rigid-shell dress (shells.js) reuses as they are
export { loft, loftAt, loftGeo, skinned, weightsNearest, weightsBone, weightsSkirt, trousers, feet, shin, sash, whisk, hair, col, solid, torsoOK };

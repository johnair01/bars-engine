// Accessories round 3 (2026-11-04, his B on cult-acc-look-2): the knots rebuilt as flat folded cloth and flat woven cord
// (sashKnot, flatKnot, the tassel head); everything else is round 2's.
// Accessories round 2 (2026-11-04, his A on cult-acc-look-1): the sash knot and tails, the jade disc, the gourd and the
// fly-whisk as rigid, carved pieces with real thickness and painted detail, tied on where you can see it, on the figures.
// Grown from round 1's make/props.js (stills/2026-11-04-cultivation-accessories). The rules are that round's
// art-direction.md: no drape and no settle; a ribbon 3.5 mm thick with closed edges and an angled cut end; a cord a round
// tube of at least 2.5 mm; a knot one wrapped body with a band round its middle; every piece at least 8 mm off the robe;
// tails end above the hem; tails at most 600 triangles, every other prop at most 1,500 (the whisk hair is a lock and 20
// strands, the cards it becomes in game).
//
// garments-b.js and garments-c.js call these in place of their own tails, knots, pendant, whisk and gourd. Each takes the
// context C (the figure's frame: C.f forward, C.l left, C.k scale, C.yWaist), the robe's loft L (the skirt surface every
// piece lies on) and H, the garment module's own helpers { loftAt, skinned, weightsBone, weightsNearest, weightsSkirt,
// LAYER, okT }, and returns parts in the shape skinned() makes. Part names are the ones motion.js and the checks know:
// sash-knot, sash-tail, sash-pendant, whisk-handle, whisk-metal, whisk-hair, prop-gourd.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C3 = h => new THREE.Color(h);
const D2R = Math.PI / 180;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const TRIS = {}; // triangles per part name, read by the round's report
export const budget = () => ({ ...TRIS });

// ---------- geometry: paint each piece in its own colour, then merge into one indexed mesh per part
function paint(g, f) { const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color(), q = V();
  for (let i = 0; i < p.count; i++) { f(q.fromBufferAttribute(p, i), col, i); c.set([col.r, col.g, col.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
// on near-black cloth a multiplied shade stays black: add a little light in proportion to the shade so folds read
const lift = (c, base, s) => { const l = base.r + base.g + base.b; if (l < 0.6) c.addScalar(Math.max(0, 0.11 * (s - 0.55)) * (1 - l / 0.6)); return c; };
const flat = (g, hex, k = 1) => paint(g, (p, c) => c.set(hex).multiplyScalar(k));
function merge(list) {
  const P = [], Cc = [], I = []; let o = 0;
  for (const g0 of list) { const g = g0.index ? g0 : (() => { const n = g0.attributes.position.count; g0.setIndex([...Array(n).keys()]); return g0; })();
    const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Cc.push(c.getX(i), c.getY(i), c.getZ(i)); }
    for (const x of g.index.array) I.push(x + o); o += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I);
  g.computeVertexNormals(); g.userData.edge = new Float32Array(P.length / 3).fill(1); return g;
}
// a piece built in a local frame (x across, y up, z out from the body) placed at p
const basis = (x, y, z, p) => new THREE.Matrix4().makeBasis(x, y, z).setPosition(p);
const tube = (pts, r, seg = 24, rad = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rad, false);

// ---------- where a piece sits: a point on the loft at angle th (0 = centre front, + toward the wearer's left), height y,
// `off` metres out from the cloth; out(th) the outward direction there, along(th) the way round the body
function frame(C, L, H) {
  const out = th => V().addScaledVector(C.f, Math.cos(th)).addScaledVector(C.l, Math.sin(th));
  const along = th => V().addScaledVector(C.f, -Math.sin(th)).addScaledVector(C.l, Math.cos(th));
  const on = (th, y, off = 0) => { const s = H.loftAt(L, th, y), r = s.r + off; return C.fromAB(s.c[0] + r * Math.cos(th), s.c[1] + r * Math.sin(th), y); };
  // how far a world point stands off the loft (radially, at its own angle and height); negative is inside
  const clear = p => { const [a, b] = C.ab(p), s0 = H.loftAt(L, 0, p.y), th = Math.atan2(b - s0.c[1], a - s0.c[0]), s = H.loftAt(L, th, p.y); return Math.hypot(a - s.c[0], b - s.c[1]) - s.r; };
  const push = (p, need) => { const d = clear(p); if (d >= need) return p; const [a, b] = C.ab(p), s0 = H.loftAt(L, 0, p.y), th = Math.atan2(b - s0.c[1], a - s0.c[0]); return p.addScaledVector(out(th), need - d); };
  const yLow = L.rings[L.rings.length - 1].y;
  return { out, along, on, clear, push, yLow };
}

function put(C, H, g, name, layer, { bone = 'hips', skirt = false, nearest = false, solid = false, mat = null } = {}) {
  const W = nearest ? H.weightsNearest(C, g, H.okT) : skirt ? H.weightsSkirt(C, g, H.weightsNearest(C, g, H.okT), C.yHip) : H.weightsBone(C, g, bone);
  TRIS[name] = (TRIS[name] || 0) + g.index.count / 3;
  const pt = H.skinned(C, g, W, '#ffffff', name, layer);
  if (mat) { pt.mesh.material.dispose(); pt.mesh.material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.FrontSide, ...mat }); }
  if (solid && pt.back) pt.back.visible = false; // a closed slab has no lining to show (round 4: the grey glint under the gathers was this lining)
  return pt;
}

// ---------- a ribbon with thickness: centre c(u), across a(u), width w(u), thickness t. Both faces carry the painted fold
// shade, a stitched hem line inside each long edge, and the free end is cut at an angle.
function ribbon({ c, across, w, t, nu = 24, nv = 4, color, shade = () => 1, hem = 0.004, end = 0.5, bump = null }) {
  const P = [], Col = [], I = [], base = C3(color), tmp = new THREE.Color();
  const fr = u => { const p = c(u), e = 1e-3, tg = c(Math.min(1, u + e)).sub(c(Math.max(0, u - e))).normalize(); const a = across(u).clone(); a.sub(tg.clone().multiplyScalar(a.dot(tg))).normalize(); return { p, a, n: tg.clone().cross(a).normalize(), tg }; };
  for (const side of [1, -1]) for (let i = 0; i <= nu; i++) { const u = i / nu, F = fr(u), W = w(u);
    for (let j = 0; j <= nv; j++) { const v = j / nv - 0.5, x = F.p.clone().addScaledVector(F.a, v * W).addScaledVector(F.n, side * t / 2 + (bump ? bump(i / nu, v) : 0));
      if (end && i === nu) x.addScaledVector(F.tg, -end * (v + 0.5) * W); // the angled cut at the free end
      P.push(x.x, x.y, x.z); const dEdge = (0.5 - Math.abs(v)) * W, h = Math.abs(dEdge - hem) < W / nv * 0.6 && j > 0 && j < nv ? 1.18 : 1;
      tmp.copy(base).multiplyScalar(shade(u, v) * h * (side < 0 ? 0.8 : 1)); lift(tmp, base, shade(u, v) * h); Col.push(tmp.r, tmp.g, tmp.b); } }
  const row = nv + 1, nf = (nu + 1) * row;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * row + j, b = a + row; I.push(a, a + 1, b, b, a + 1, b + 1); const a2 = nf + a, b2 = nf + b; I.push(a2, b2, a2 + 1, b2, b2 + 1, a2 + 1); }
  for (let i = 0; i < nu; i++) for (const [jj, fl] of [[0, 0], [nv, 1]]) { const a = i * row + jj, b = a + row, a2 = nf + a, b2 = nf + b; if (fl) I.push(a, b, a2, b, b2, a2); else I.push(a, a2, b, b, a2, b2); } // the long edges
  for (let j = 0; j < nv; j++) { const a = j, e = nu * row + j; I.push(a, nf + a, a + 1, a + 1, nf + a, nf + a + 1); I.push(e, e + 1, nf + e, e + 1, nf + e + 1, nf + e); } // both ends closed
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Col, 3)); g.setIndex(I); return g;
}

// ---------- a fringe: a bound tassel's skirt of threads, a flared tube with painted strands and a ragged hem
function fringe(top, len, r0, r1, color, seed = 1) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 18, 4, true); g.translate(top.x, top.y - len / 2, top.z);
  const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i) - top.y; if (y < -len * 0.99) { const a = Math.atan2(P.getZ(i) - top.z, P.getX(i) - top.x); P.setY(i, P.getY(i) + len * 0.08 * (0.5 + 0.5 * Math.sin(a * 7 + seed))); } }
  return paint(g, (p, c) => { const a = Math.atan2(p.z - top.z, p.x - top.x); c.set(color).multiplyScalar(0.82 + 0.2 * Math.sin(a * 40 + seed) * Math.sin(a * 13) - 0.15 * smooth(top.y - len * 0.2, top.y, p.y)); });
}
const capOf = (top, len, r) => { const g = new THREE.CircleGeometry(r, 20); g.rotateX(Math.PI / 2); g.translate(top.x, top.y - len * 0.02, top.z); return g; };
// a bound tassel: a round head, a metal collar, the fringe (cord colour), hanging from p
function tassel(p, k, cord, metal, len = 0.07) {
  const head = paint(new THREE.CylinderGeometry(0.0046 * k, 0.0056 * k, 0.011 * k, 12, 3).translate(p.x, p.y - 0.0065 * k, p.z),
    (q, c) => c.set(cord).multiplyScalar(0.8 + 0.22 * (0.5 + 0.5 * Math.sin((q.y - p.y) * 2400 / k)))); // round 3: wound cord, not a ball
  const coll = flat(new THREE.CylinderGeometry(0.0056 * k, 0.0056 * k, 0.007 * k, 14).translate(p.x, p.y - 0.016 * k, p.z), metal);
  const ft = p.clone().add(V(0, -0.019 * k, 0)), fr = fringe(ft, len * k, 0.0052 * k, 0.0085 * k, cord, 3), cap = flat(capOf(ft, len * k, 0.0052 * k), cord, 0.7);
  return { cloth: [head, fr, cap], metal: [coll] };
}

// ---------- a flat cord knot (accessories round 3, his B on cult-acc-look-2: "the balls as knots need to be more obviously
// folded fabric ... they should be flatter"): a pan chang (mystic) knot, the flat woven diamond that holds jade on a cord.
// Two cords each way woven over and under in one plane, four ear loops at the corners, about 2 cm across and 5 mm deep.
// c the centre, x across, y up, n out from the body; d the half diagonal.
function flatKnot(c, x, y, n, d, r, color) {
  const out = [], M = basis(x, y, n, c), s3 = d / 3, ax = [V(1, 1, 0).normalize(), V(1, -1, 0).normalize()];
  for (const [ia, A] of ax.entries()) { const P = V(-A.y, A.x, 0);
    for (const sg of [-1, 1]) { const pts = [];
      for (let i = 0; i <= 8; i++) { const t = (i / 8 - 0.5) * 2 * d * 0.78, z = r * 0.9 * sg * Math.sin(Math.PI * t / (2 * s3)) * (ia ? -1 : 1);
        pts.push(A.clone().multiplyScalar(t).addScaledVector(P, sg * s3).setZ(z)); }
      const g = tube(pts, r, 6, 4); out.push(paint(g, (q, cc) => cc.set(color).multiplyScalar(0.8 + 0.25 * smooth(-r, r, q.z)))); } }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, e = new THREE.TorusGeometry(d * 0.32, r, 4, 6, Math.PI * 1.35); e.rotateZ(a - Math.PI * 0.675); e.scale(1, 1, 0.6);
    e.translate(Math.cos(a) * d * 0.86, Math.sin(a) * d * 0.86, 0); out.push(paint(e, (q, cc) => cc.set(color).multiplyScalar(0.92))); }
  for (const g of out) g.applyMatrix4(M); return out;
}

// ---------- where the sash's own surface stands off the robe's loft at height y (accessories round 4): the soft sash's
// bulge (garments sash(), 0.4 cm plus up to 1.3 cm), or his belt over it (0.4 plus 1.1 to 1.8 cm); 0 off the band
const lerpProf = (prof, f) => { if (f <= prof[0][0]) return prof[0][1]; for (let i = 1; i < prof.length; i++) if (f <= prof[i][0]) { const [f0, a] = prof[i - 1], [f1, b] = prof[i]; return a + (b - a) * (f - f0) / (f1 - f0); } return prof[prof.length - 1][1]; };
const SASH = [[0, 0], [0.06, 0.006], [0.3, 0.011], [0.5, 0.013], [0.7, 0.011], [0.94, 0.006], [1, 0]], BELT = [[0, 0.011], [0.08, 0.018], [0.92, 0.018], [1, 0.011]];
function sashSurf(C, pc, y, L = null, H = null, th = 0) {
  // with the loft (L, H), measured on the band as drawn: its rows are joined by flat facets, and where the waist curves in
  // the loft between two rows lies inside the facet, so the band stands further off there than the profile says
  const k = C.k, h = pc.h * k, y0 = C.yWaist, band = (lo, hgt, prof) => { const f = (y - lo) / hgt; if (f < 0 || f > 1) return 0; if (!L) return 0.004 + lerpProf(prof, f);
      let i = 1; while (i < prof.length - 1 && prof[i][0] < f) i++; const [f0, e0] = prof[i - 1], [f1, e1] = prof[i], t = (f - f0) / ((f1 - f0) || 1);
      const r0 = H.loftAt(L, th, lo + f0 * hgt).r + 0.004 + e0, r1 = H.loftAt(L, th, lo + f1 * hgt).r + 0.004 + e1; return r0 + (r1 - r0) * t - H.loftAt(L, th, y).r; };
  let s = band(y0 - h / 2, h, SASH);
  if (pc.belt || (C.male && pc.belt !== false)) { const bw = 0.05 * k, yb = y0 - h * 0.08; s = Math.max(s, band(yb - bw / 2, bw, BELT)); }
  return s;
}

// ---------- a slab of cloth lying on the sash: at(u, v) gives the back face's point and its outward normal, t(u, v) the
// thickness; the front, the back and the four edges are closed and wound to face out (FrontSide)
function slab(at, t, nu, nv, col) {
  const P = [], Cc = [], I = [], G = [], c = new THREE.Color();
  for (const side of [0, 1]) for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = i / nu, v = j / nv - 0.5, A = at(u, v), x = A.p.clone().addScaledVector(A.n, side * t(u, v));
    P.push(x.x, x.y, x.z); col(u, v, side, c); Cc.push(c.r, c.g, c.b); G.push(A); }
  const row = nv + 1, nf = (nu + 1) * row, id = (s, i, j) => s * nf + i * row + j, X = q => V(P[q * 3], P[q * 3 + 1], P[q * 3 + 2]);
  const tri = (a, b, c2, want) => { const n = X(b).sub(X(a)).cross(X(c2).sub(X(a))); if (n.dot(want) < 0) I.push(a, c2, b); else I.push(a, b, c2); };
  for (const s of [0, 1]) for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const want = G[id(0, i, j)].n.clone().multiplyScalar(s ? 1 : -1);
    tri(id(s, i, j), id(s, i + 1, j), id(s, i, j + 1), want); tri(id(s, i + 1, j), id(s, i + 1, j + 1), id(s, i, j + 1), want); }
  const mid = (i, j) => X(id(0, i, j)).add(X(id(1, i, j))).multiplyScalar(0.5);
  const edge = (i0, j0, i1, j1, ci, cj) => { const want = mid(i0, j0).sub(mid(ci, cj)); tri(id(0, i0, j0), id(0, i1, j1), id(1, i0, j0), want); tri(id(0, i1, j1), id(1, i1, j1), id(1, i0, j0), want); };
  const ci = Math.round(nu / 2), cj = Math.round(nv / 2);
  for (let i = 0; i < nu; i++) { edge(i, 0, i + 1, 0, ci, cj); edge(i, nv, i + 1, nv, ci, cj); }
  for (let j = 0; j < nv; j++) { edge(0, j, 0, j + 1, ci, cj); edge(nu, j, nu, j + 1, ci, cj); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); return g;
}

// ---------- the sash knot (round 4, his B on cult-acc-look-3: "They look like bows disconnected from the belt"). A flat
// knot (pingjie) is the sash's own two ends tied over the sash, so the knot grows out of the band instead of sitting on
// it. Each end comes round the body on top of the band at its full height, gathers into pleats that run in toward the
// knot, and pinches to half the band's height where the knot holds it; the two short folded loops of the knot sit on that
// pinch, a wrap band crosses the middle, and the tails leave from under the wrap's lower edge. The pinch shades darker
// where the knot presses it. Depth about 1.5 cm over the sash. Black silk keeps round 3's sheen and lit edges.
export function sashKnot(C, pc, L, H) {
  C.sashH = pc.h; // the gourd's cord tucks under this sash's lower edge
  const k = C.k, Fm = frame(C, L, H), y0 = C.yWaist, hs = pc.h * k, kt = (pc.knotAt ?? 22) * D2R, yc = y0 + 0.002 * k;
  const knot = pc.knot || pc.color, base = C3(knot), T = 0.0035 * k, belted = !!(pc.belt || (C.male && pc.belt !== false)), gap = (belted ? 0.004 : 0.0012) * k;
  const dark = base.r + base.g + base.b < 0.6;
  const rim = v => dark ? 1 + 0.9 * Math.exp(-(((0.5 - Math.abs(v)) / 0.09) ** 2)) : 1;
  const Rw = H.loftAt(L, kt, y0).r, surf = (y, th = kt) => Math.max(...[-1, -0.5, 0, 0.5, 1].map(d => sashSurf(C, pc, y + d * (belted ? 0.006 : 0.002) * k, L, H, th))), g0 = 0.0032 * k; // g0: the gathers' thickness at the knot
  // surf: on his belt, the most the band stands out within 6 mm, so no step of the belt cuts through the gathers
  const pinch = 0.27 * hs;
  // art director's read on round 4: a light sash's gathers read two stops lighter than the band (tone 0.84); on black silk
  // the knot's loops and wrap stand 18% lighter than the band so they separate from it
  const tone = dark ? 1.05 : 0.84, lit = dark ? 1.18 : 0.92; // half the band's height, where the knot holds the gathers
  // the gathers: each end of the sash on top of the band, from the knot out round the body
  const gather = side => {
    // on his belt the ends come from round his sides, so no cut end shows from the front
    const Ls = (pc.gather ?? (belted ? 0.2 : 0.11)) * k, hw = u => pinch + (0.5 * hs - 0.004 * k - pinch) * smooth(0.04, 0.85, u), th = u => kt + side * (0.006 * k + u * Ls) / Rw;
    const amp = u => 0.0024 * k * (1 - smooth(0.1, 0.95, u)), folds = 3.5;
    const bumpAt = (u, v) => amp(u) * (0.5 + 0.5 * Math.cos(v * 2 * Math.PI * folds));
    const at = (u, v) => { const y = yc + v * 2 * hw(u), a = th(u); return { p: Fm.on(a, y, surf(y, a) + gap + bumpAt(u, v)), n: Fm.out(a) }; };
    const t = u => 0.0007 * k + (g0 - 0.0007 * k) * (1 - smooth(0, 0.9, u));
    const col = (u, v, s, c) => { const fold = 0.86 + 0.22 * Math.cos(v * 2 * Math.PI * folds) * (1 - smooth(0.15, 1, u)), press = 1 - 0.38 * Math.exp(-((u / 0.16) ** 2)), sh = fold * press * (s ? rim(v) : 0.55) * tone;
      c.copy(base).multiplyScalar(sh); lift(c, base, sh); };
    return slab(at, t, 8, 8, col);
  };
  // the knot sits on the pinch: its centre on the gathers' top face
  const n = Fm.out(kt), x = Fm.along(kt), up = V(0, 1, 0), p = Fm.on(kt, yc, surf(yc) + gap + g0);
  const M = basis(x, up, n, p);
  // a loop of the knot: a short folded bight from under the wrap out to one side, folded back on itself at its end
  const ear = side => {
    const Lx = 0.026 * k, rise = 0.0025 * k * side, R = 0.0038 * k, uf = 0.78;
    const bend = q => q.setZ(q.z - q.x * q.x / (2 * (Rw + 0.02 * k)));
    const c0 = u => { if (u <= uf) { const t = u / uf; return V(side * (0.004 * k + t * (Lx - R)), rise * t, 0.0019 * k + 0.0016 * k * Math.sin(Math.PI * t)); }
      const a = (u - uf) / (1 - uf) * Math.PI; return V(side * (0.004 * k + Lx - R + R * Math.sin(a)), rise, 0.0019 * k + R * (Math.cos(a) - 1) + 0.0001); };
    const c = u => bend(c0(u));
    const w = u => 2 * pinch * (0.92 + 0.16 * smooth(0.05, 0.6, u));
    const pleat = (u, v) => 0.0013 * k * Math.sin(v * Math.PI * 4) * (1 - smooth(0.25, 0.75, u));
    const shade = (u, v) => { const f = 0.88 + 0.16 * Math.sin(v * Math.PI * 4 + 1.2) * (1 - smooth(0.25, 0.75, u)), top = 0.92 + 0.14 * v,
      fold = 1 - 0.3 * Math.exp(-(((u - uf + 0.06) / 0.05) ** 2)) + 0.35 * Math.exp(-(((u - uf - 0.07) / 0.05) ** 2));
      return lit * f * fold * top * rim(v) * (u > uf ? 0.82 : 1) * (dark ? 1 + 0.5 * Math.exp(-(((u - uf - 0.07) / 0.05) ** 2)) : 1); };
    const g = ribbon({ c, across: () => V(0, 1, 0), w, t: T, nu: 12, nv: 4, color: knot, shade, hem: 0.003 * k, end: 0, bump: pleat });
    g.applyMatrix4(M); return g;
  };
  // the wrap: a band round the middle of the knot, its lower edge where the tails come out
  const Ry = pinch * 1.12, Rz = 0.006 * k, zc = 0.0025 * k;
  const wc = u => { const a = (0.62 - 1.24 * u) * Math.PI; return V(0, Ry * Math.sin(a), zc + Rz * Math.cos(a) + 0.003 * k); };
  const ww = u => (0.026 - 0.005 * Math.exp(-(((u - 0.5) / 0.25) ** 2))) * k;
  const step = (u, v) => 0.0012 * k * smooth(-0.04, 0.04, v * 0.9 - (u - 0.5) * 0.8);
  const wshade = (u, v) => { const d = v * 0.9 - (u - 0.5) * 0.8; return lit * (0.9 + 0.12 * Math.cos((u - 0.5) * Math.PI)) * (1 - 0.32 * Math.exp(-((d / 0.05) ** 2))) * (1 - 0.18 * Math.abs(v)) * rim(v); };
  const wrap = ribbon({ c: wc, across: () => V(1, 0, 0), w: ww, t: T, nu: 12, nv: 4, color: knot, shade: wshade, hem: 0.003 * k, end: 0, bump: step });
  wrap.applyMatrix4(M);
  const mat = { roughness: dark ? 0.42 : 0.7 };
  return [put(C, H, merge([gather(-1), gather(1)]), 'sash-knot', H.LAYER.sash, { nearest: true, solid: true, mat }), // skinned as the sash and belt are, so they move as one
    put(C, H, merge([ear(-1), ear(1), wrap]), 'sash-knot', H.LAYER.sash, { mat })];
}

// ---------- the tails: ribbons carved with their twist in them, lying 1.6 cm off the skirt, gathered under the knot and
// opening as they fall, each ending above the hem. pc.tailsAt [[deg, length, width, colour?]...] or the outfit's defaults.
export function sashTails(C, pc, L, H) {
  const k = C.k, Fm = frame(C, L, H), h = pc.h * k, y0 = C.yWaist, kt = (pc.knotAt ?? 22) * D2R, parts = [];
  const tails = pc.tailsAt ? pc.tailsAt.map(([a, len, w, c]) => [a * D2R, len, w, c]) : [[kt, pc.tails, 0.05], [kt + 9 * D2R, pc.tails * 0.82, 0.045]].concat(pc.ribbon ? [[kt - 10 * D2R, pc.tails * 1.08, 0.035]] : []);
  tails.forEach(([th1, len, wd, tc], j) => {
    const yTop = y0 + 0.002 * k - h * 0.2, yEnd = Math.max(yTop - len * k, Fm.yLow + 0.12 * k), Lk = yTop - yEnd, ph = 0.4 + 1.5 * j, color = tc || pc.color;
    const thAt = u => kt + (th1 - kt) * smooth(0, 0.35, u) + (th1 - kt) * 0.35 * u; // from under the knot out to its own line, spreading as it falls
    const tw = u => 0.24 * Math.sin(u * 2.4 + ph) * smooth(0, 0.25, u); // the twist carved in, so it reads as a ribbon and not a plank
    const off = u => (0.017 + 0.0015 * j + 0.006 * smooth(0.3, 1, u)) * k + 0.004 * k * Math.sin(u * 5 + ph) * smooth(0, 0.2, u) + 0.004 * k * (1 - smooth(0, 0.15, u));
    // round 4: never under the gathers over the band (the sash's surface + 4.4 mm + its own half thickness), then on the skirt
    const offAt = u => { const y = yTop - u * Lk, sf = sashSurf(C, pc, y, L, H, thAt(u)); return Math.max(off(u), sf > 0 ? sf + 0.0062 * k : 0) + 0.0035 * k * j * (1 - 0.6 * smooth(0.3, 0.8, u)); }; // later tails lie over earlier ones where they leave the knot
    const c = u => Fm.on(thAt(u), yTop - u * Lk, offAt(u));
    const across = u => { const th = thAt(u), a = tw(u); return Fm.along(th).multiplyScalar(Math.cos(a)).addScaledVector(Fm.out(th), Math.sin(a)); };
    const w = u => wd * k * (0.62 + 0.38 * smooth(0.04, 0.3, u) + 0.15 * smooth(0.3, 1, u)); // gathered under the knot, opening as it falls
    const shade = (u, v) => { const t = Math.cos(u * 3.0 + ph); return 0.62 + 0.5 * (0.5 + 0.5 * t * Math.sign(v + 1e-3) * Math.min(1, Math.abs(v) * 4)) - 0.22 * Math.exp(-(((u - 0.04) / 0.05) ** 2)); };
    const g = ribbon({ c, across, w, t: 0.0035 * k, nu: Math.max(18, Math.round(Lk / k * 50)), nv: 4, color, shade, hem: 0.004 * k, end: 0.5 });
    parts.push(put(C, H, merge([g]), 'sash-tail', H.LAYER.sash, { skirt: true, mat: { roughness: 0.74 } }));
  });
  return parts;
}

// ---------- the jade disc at the right hip: a red cord from under the sash's lower edge, a button knot, a mottled bi
// disc facing out, a bound tassel with a gold collar under it
export function pendant(C, pc, L, H) {
  const k = C.k, Fm = frame(C, L, H), h = pc.h * k, y0 = C.yWaist, th = (pc.pendantAt ?? -34) * D2R, cord = pc.cord || '#8a2a2f', metal = C.metal || '#c09a55';
  const n = Fm.out(th), x = Fm.along(th), yS = y0 - h / 2;
  const top = Fm.on(th, yS + 0.012 * k, 0.009 * k), lip = Fm.on(th, yS - 0.006 * k, 0.016 * k), kb = Fm.on(th, yS - 0.04 * k, 0.021 * k), dc = Fm.on(th, yS - 0.088 * k, 0.024 * k);
  const R0 = 0.0105 * k, R1 = 0.0245 * k, T = 0.0032 * k;
  const cloth = [flat(tube([top, lip, kb, dc.clone().add(V(0, R1 - 0.002 * k, 0))], 0.0013 * k * 2, 20, 6), cord)];
  cloth.push(...flatKnot(kb, x, V(0, 1, 0), n, 0.011 * k, 0.0017 * k, cord)); // round 3: a flat pan chang knot, not a ball
  const ring = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2; ring.push(new THREE.Vector2((R0 + R1) / 2 + (R1 - R0) / 2 * Math.cos(a), T * Math.sin(a))); }
  const bi = new THREE.LatheGeometry(ring, 24); bi.rotateX(Math.PI / 2);
  paint(bi, (q, c) => { const m = Math.sin(q.x * 260 / k + q.y * 180 / k) * Math.cos(q.y * 120 / k) + 0.5 * Math.sin(q.x * 90 / k - q.y * 70 / k); c.set(pc.pendant).multiplyScalar(0.84 + 0.14 * m); });
  bi.applyMatrix4(basis(x, V(0, 1, 0), n, dc));
  const tt = dc.clone().add(V(0, -R1 - 0.004 * k, 0)); cloth.push(flat(tube([dc.clone().add(V(0, -R1 + 0.003 * k, 0)), tt], 0.0024 * k, 6, 6), cord));
  const ts = tassel(tt, k, cord, metal, 0.075); cloth.push(...ts.cloth);
  return [put(C, H, merge(cloth), 'sash-pendant', H.LAYER.sash, { mat: { roughness: 0.78 } }),
    put(C, H, merge([bi]), 'sash-pendant', H.LAYER.sash, { mat: { roughness: 0.32, metalness: 0.0 } }),
    put(C, H, merge(ts.metal), 'sash-pendant', H.LAYER.sash, { mat: { roughness: 0.38, metalness: 0.65 } })];
}

// ---------- his gourd: a matte waxed bottle gourd with a stopper, a double cord round its waist with a small knot and
// tassel, and the cord looped up into the sash. Hung from the hips, at least 1.2 cm off the skirt at every height.
export function gourd(C, pc, L, H) {
  const k = C.k, Fm = frame(C, L, H), y0 = C.yWaist, hS = (pc.sashH ?? 0.06) * k, th = (pc.gourdAt ?? -62) * D2R, cord = pc.cord || '#8a2a2f', metal = C.metal || '#c09a55';
  const n = Fm.out(th), x = Fm.along(th), Hg = 0.2 * k, Rb = 0.052 * k, yTop = y0 - hS / 2 - 0.03 * k, yBot = yTop - Hg;
  let need = 0; for (let y = yBot; y <= yTop; y += 0.01 * k) need = Math.max(need, H.loftAt(L, th, y).r - H.loftAt(L, th, yTop).r); // the skirt's flare under it
  const ctr = Fm.on(th, yTop, need + Rb + 0.012 * k); ctr.y = yBot;
  const bulb = (t, c, hr, R) => { const q = (t - c) / hr; return Math.abs(q) >= 1 ? 0 : R * Math.sqrt(1 - q * q); };
  const prof = []; for (let i = 0; i <= 20; i++) { const t = i / 20, r = Math.max(bulb(t, 0.3, 0.31, Rb), bulb(t, 0.79, 0.2, Rb * 0.6), t > 0.5 && t < 0.7 ? 0.017 * k : 0, t > 0.02 && t < 0.98 ? 0.004 * k : 0); prof.push(new THREE.Vector2(r, t * Hg)); }
  const gg = new THREE.LatheGeometry(prof, 14);
  paint(gg, (q, c) => { const a = Math.atan2(q.x, q.z); c.set(pc.gourd).multiplyScalar(0.8 + 0.05 * Math.sin(a * 9 + q.y * 30 / k) + 0.15 * smooth(0, Hg, q.y) - 0.18 * Math.exp(-(((q.y - 0.004 * k) / (0.015 * k)) ** 2))); });
  const tilt = new THREE.Matrix4().makeRotationAxis(x, -0.06); gg.applyMatrix4(tilt); gg.translate(ctr.x, ctr.y, ctr.z);
  const at = t => ctr.clone().add(V(0, t * Hg, 0).applyMatrix4(tilt));
  const top = at(1), waist = at(0.61);
  const stopper = paint(new THREE.CylinderGeometry(0.009 * k, 0.011 * k, 0.026 * k, 10).translate(top.x, top.y + 0.01 * k, top.z), (q, c) => c.set('#5a3b24').multiplyScalar(0.85 + 0.2 * Math.sin(q.y * 900 / k)));
  const cl = []; for (const dy of [-0.004, 0.004]) { const t = new THREE.TorusGeometry(0.0195 * k, 0.0032 * k, 5, 12); t.rotateX(Math.PI / 2); t.translate(waist.x, waist.y + dy * k, waist.z); cl.push(flat(t, cord)); }
  const kn = waist.clone().addScaledVector(n, 0.021 * k); cl.push(...flatKnot(kn, x, V(0, 1, 0), n, 0.0095 * k, 0.0016 * k, cord)); // round 3: a flat pan chang knot, not a ball
  const tuck = (dth, dy) => Fm.on(th + dth, y0 - hS / 2 + dy * k, 0.009 * k), lipOff = d => Fm.on(th + d, y0 - hS / 2 - 0.006 * k, 0.02 * k);
  const mid = kn.clone().lerp(lipOff(0), 0.5).addScaledVector(n, 0.004 * k);
  cl.push(flat(tube([kn, mid, lipOff(0.03), tuck(0.04, 0.012)], 0.0028 * k, 10, 4), cord));
  cl.push(flat(tube([kn, mid.clone().addScaledVector(x, -0.012 * k), lipOff(-0.05), tuck(-0.06, 0.012)], 0.0028 * k, 10, 4), cord));
  const ts = tassel(kn.clone().addScaledVector(n, 0.004 * k), k, cord, metal, 0.055); cl.push(...ts.cloth);
  return [put(C, H, merge([gg]), 'prop-gourd', H.LAYER.prop ?? 7.5, { mat: { roughness: 0.72 } }),
    put(C, H, merge([stopper, ...cl]), 'prop-gourd', H.LAYER.prop ?? 7.5, { mat: { roughness: 0.8 } }),
    put(C, H, merge(ts.metal), 'prop-gourd', H.LAYER.prop ?? 7.5, { mat: { roughness: 0.38, metalness: 0.65 } })];
}

// ---------- her fly-whisk: a turned wooden handle with rings hooked through the sash at her left front, its brass
// ferrule standing above the band, and a full white horsehair lock falling from the ferrule: a carved lock with a warmer
// shade under it and 20 strands on its surface, swung by the whisk-hair chain in motion.js
export function whisk(C, pc, L, H) {
  const k = C.k, Fm = frame(C, L, H), y0 = C.yWaist, at = (pc.at ?? 40) * D2R, len = (pc.len ?? 0.42) * k;
  const lo = Fm.on(at - 6 * D2R, y0 - 0.075 * k, 0.012 * k), hi = Fm.on(at + 8 * D2R, y0 + 0.15 * k, 0.034 * k), ax = hi.clone().sub(lo), Lh = ax.length(); ax.normalize();
  const hp = [[0, 0], [0.0062, 0], [0.0068, 0.02], [0.0085, 0.024], [0.0068, 0.028], [0.0064, 0.6], [0.0072, 0.82], [0.0095, 0.86], [0.0072, 0.9], [0.0078, 0.93], [0.0098, 0.965], [0.0085, 1.0]].map(([r, y]) => new THREE.Vector2(r * k, y * Lh));
  const handle = new THREE.LatheGeometry(hp, 16); paint(handle, (q, c) => c.set(pc.handle).multiplyScalar(0.85 + 0.22 * Math.sin(q.y * 900 / k + Math.sin(Math.atan2(q.x, q.z) * 3) * 2)));
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), ax); handle.applyQuaternion(q); handle.translate(lo.x, lo.y, lo.z);
  const yBand = y0 + (C.sashH ?? 0.06) * k / 2, tB = (yBand - lo.y) / (hi.y - lo.y), hook = lo.clone().lerp(hi, tB); // where it leaves the band
  const loop = new THREE.TorusGeometry(0.0095 * k, 0.0026 * k, 6, 16); loop.rotateX(Math.PI / 2); loop.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), hi.clone().sub(lo).normalize())); loop.translate(hook.x, hook.y, hook.z);
  const hookCord = flat(loop, pc.cord || '#7a2630');
  const fp = lo.clone().addScaledVector(ax, Lh * 1.012); const fer = flat(new THREE.CylinderGeometry(0.0125 * k, 0.011 * k, 0.026 * k, 18).applyQuaternion(q).translate(fp.x, fp.y, fp.z), pc.ring || '#b8955a');
  const root = lo.clone().addScaledVector(ax, Lh * 1.03), out = Fm.out(at + 8 * D2R), dir0 = out.clone().add(V(0, 0.55, 0)).normalize();
  // the lock's centre line: up and out of the ferrule, then down, kept at least its own radius plus 1.2 cm off the robe
  const n = 24, rAt = u => (0.006 + 0.017 * Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * (1 - 0.75 * u * u)) * k, cl = [];
  for (let i = 0; i <= n; i++) { const u = i / n; cl.push(root.clone().addScaledVector(dir0, len * u * (1 - u) * 0.55).add(V(0, -(len * (u * u * 0.9 + u * 0.1)), 0))); }
  for (let i = 1; i <= n; i++) Fm.push(cl[i], rAt(i / n) + 0.012 * k); // only ever outward
  for (let pass = 0; pass < 3; pass++) for (let i = 1; i < n; i++) { const m = cl[i - 1].clone().add(cl[i + 1]).multiplyScalar(0.5); if (Fm.clear(m) >= rAt(i / n) + 0.012 * k) cl[i].lerp(m, 0.5); }
  const curve = new THREE.CatmullRomCurve3(cl), m = 12, P = [], Cc = [], I = [], under = C3(pc.hairShade || "#8a7a62"), top = C3(pc.hair);
  const fr = u => { const p = curve.getPointAt(u), tg = curve.getTangentAt(u), a = V().crossVectors(tg, out).normalize(), b = V().crossVectors(a, tg).normalize(); return { p, a, b }; };
  for (let i = 0; i <= n; i++) { const u = i / n, F = fr(u), rr = rAt(u);
    for (let j = 0; j <= m; j++) { const a = j / m * Math.PI * 2, x = F.p.clone().addScaledVector(F.a, Math.cos(a) * rr).addScaledVector(F.b, Math.sin(a) * rr * 0.78); P.push(x.x, x.y, x.z);
      const facing = 0.5 + 0.5 * Math.sin(a), t = 0.88 + 0.1 * Math.sin(a * 23 + u * 3) * Math.sin(a * 7); const c = under.clone().lerp(top, smooth(0.15, 0.85, facing)).multiplyScalar(t); Cc.push(c.r, c.g, c.b); } }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * (m + 1) + j, b = a + m + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const lock = new THREE.BufferGeometry(); lock.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lock.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); lock.setIndex(I);
  const hair = [lock]; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 20; i++) { const a0 = rnd() * Math.PI * 2, L0 = 0.86 + 0.16 * rnd(), pts = [];
    for (let kk = 0; kk <= 8; kk++) { const u = Math.min(1, kk / 8 * L0), F = fr(u), rr = rAt(u) * (1.02 + 0.25 * u * rnd()), a = a0 + 0.3 * u * (rnd() - 0.5); pts.push(F.p.clone().addScaledVector(F.a, Math.cos(a) * rr).addScaledVector(F.b, Math.sin(a) * rr * 0.78)); }
    hair.push(flat(tube(pts, 0.0011 * k, 8, 3), pc.hair, 0.8 + 0.22 * rnd())); }
  return [put(C, H, merge([handle, hookCord]), 'whisk-handle', H.LAYER.sash, { mat: { roughness: 0.45 } }),
    put(C, H, merge([fer]), 'whisk-metal', H.LAYER.sash, { mat: { roughness: 0.35, metalness: 0.7 } }),
    put(C, H, merge(hair), 'whisk-hair', H.LAYER.sash, { skirt: true, mat: { roughness: 0.6 } })];
}

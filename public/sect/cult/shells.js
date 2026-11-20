// Shells round (2026-11-02): clothing as a rigid shell skinned to the body. Wendell's ruling on his marked screenshots
// (2026-11-02 22:35Z): "These marked places at the joints is where we'd expect the model to stretch and use textures to
// simulate seams ... it should be more rigid than what I see being modeled. We can simulate folds and such with textures
// and paint but fully trying to simulate fabric has been what's getting in the way", and the women need bust cleavage.
//
// So, for every direction:
//   body shell   the robe's top half (chest, back, shoulders, both sleeves to the cuff) is ONE mesh: the body's own skin
//                pushed out along its normals, carrying the body's own skin weights. At the shoulder, the elbow and the
//                waist it stretches exactly as the skin does, so there is no sleeve root, no seam wedge, no shelf.
//                Its edges are cut by smooth fields (neckline, the cross collar's V, the cuff, the waist under the sash),
//                each triangle split on the field's zero line, so every edge is a clean line, not a stair of triangles.
//   skirt        rings from under the sash to the hem (the clothing kit's loft, no folds modelled), skinned mostly to the
//                pelvis and partly to each thigh: it hangs as a rigid bell and swings with the stride.
//   bell sleeve  (wide-sleeved outfits) a rigid hanging piece on the forearm bone: its top blends into the skin weights at
//                the elbow, the rest is held by the forearm alone, and its bulk hangs below the arm.
//   paint        collar bands, cuff and hem bands, the lapped panel's edge, the shoulder and side seams, the folds of the
//                skirt and the creases at the elbow are painted in the material (painted.js), never modelled.
//   no cloth     no drape, no settle, no leg push, no springs on cloth. Hair and props keep their own pieces.
// The bust: the shell follows each breast, the cross collar opens down to the under-bust line, and a woman's V is wide
// enough that the cleavage shows in it.
import * as THREE from 'three';
import { TORSO, ARM, LEG } from './figure.js';
import * as GB from './garments-b.js';
import * as GC from './garments-c.js';
import { paint } from './painted.js';
import { hairPaint } from './hairpaint.js';
import { bellFall, armpitFix } from './posefix.js';
import * as ACC from './accessories.js';
export { context } from './garments-c.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const BIG = 9;

// ---------- clip an indexed mesh by a scalar field: keep g > 0, split every crossing triangle on g = 0
// verts: [{p:Vector3, n:Vector3, si:[4], sw:[4], ...extra}], tris: flat index array. Returns the same shape.
function lerpV(a, b, t) {
  const acc = new Map(); for (const [v, w] of [[a, 1 - t], [b, t]]) for (let j = 0; j < 4; j++) { const ww = v.sw[j] * w; if (ww > 0) acc.set(v.si[j], (acc.get(v.si[j]) || 0) + ww); }
  const top = [...acc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4), s = top.reduce((q, x) => q + x[1], 0);
  const o = { p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize(), si: [0, 0, 0, 0], sw: [0, 0, 0, 0], arm: t < 0.5 ? a.arm : b.arm, src: t < 0.5 ? a.src : b.src };
  top.forEach(([bi, w], j) => { o.si[j] = bi; o.sw[j] = w / s; }); return o;
}
function clip(M, g) {
  const val = M.verts.map(g), out = { verts: M.verts.slice(), tris: [] }, cut = new Map();
  const mid = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (!cut.has(k)) { const t = val[a] / (val[a] - val[b]); out.verts.push(lerpV(M.verts[a], M.verts[b], t)); val.push(0); cut.set(k, out.verts.length - 1); } return cut.get(k); };
  for (let t = 0; t < M.tris.length; t += 3) { const I = [M.tris[t], M.tris[t + 1], M.tris[t + 2]], inn = I.map(i => val[i] > 0), n = inn.filter(Boolean).length;
    if (n === 3) { out.tris.push(...I); continue; } if (n === 0) continue;
    // rotate so the odd one out is first, keeping winding
    let r = 0; for (; r < 3; r++) if ((n === 1 && inn[r]) || (n === 2 && !inn[r])) break;
    const a = I[r], b = I[(r + 1) % 3], c = I[(r + 2) % 3], ab = mid(a, b), ac = mid(a, c);
    if (n === 1) out.tris.push(a, ab, ac); else out.tris.push(ab, b, c, ab, c, ac); }
  // drop vertices no triangle uses
  const used = new Int32Array(out.verts.length).fill(-1), verts = [];
  for (let i = 0; i < out.tris.length; i++) { const v = out.tris[i]; if (used[v] < 0) { used[v] = verts.length; verts.push(out.verts[v]); } out.tris[i] = used[v]; }
  return { verts, tris: out.tris };
}

// ---------- the cross collar (jiaoling), right over left, in the body's front plane
// x: across the body toward the wearer's left, y: up, z: forward, all from the pelvis axis at the fit pose.
function collarLines(C, sh) {
  const k = C.k, hc = wp(C.F.bones.hips), fem = !C.male;
  const yN = C.yNeck + (sh.vTop ?? 0.03) * k, wN = (sh.neckW ?? (fem ? 0.06 : 0.05)) * k;
  // crossing point: the women's sits at the under-bust line (the cleavage shows above it), the men's mid-sternum
  const yc = fem ? C.yApex - (sh.crossBelowApex ?? (C.wrap ? C.wrap.crossBelow + C.wrap.crossPerCup * (C.cup - 1) : 0.075)) * k : yN - (sh.cross ?? 0.2) * k, xc = -(sh.crossX ?? (fem ? 0 : 0.025)) * k; // shells round 2: a woman's V crosses on the midline, so its two edges mirror (his B on cult-shells-look-1)
  const L = { hc, yN, wN, yc, xc, fem, p: 1, e: 0.05 };
  // shells round 3 (his note on cult-dir-b-look-3: "cleavage in the women's models with the wrap as a function of cup
  // size"): a woman's V edges curve out over the inner slope of each breast. The cup (mix.bust) sets how low the wrap
  // crosses under the bust and how far each edge opens at the apex line: wA = xa (open + openPerCup (cup - 1)), xa the
  // apex's distance from the midline. Each edge is x = wN f(t), f(t) = ((t + e)^p - e^p) / ((1 + e)^p - e^p), t = 0 at
  // the crossing and 1 at the neck; p (<= 1) is solved so the edge passes through wA at the apex line (p = 1 is the
  // straight V, which the men keep).
  if (fem && C.wrap) { const W = C.wrap, ta = (C.yApex - L.yc) / (L.yN - L.yc), wA = C.xApex * (W.open + W.openPerCup * (C.cup - 1));
    if (ta > 0 && ta < 1 && wA > wN * ta) { let lo = 0.15, hi = 1; for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; L.p = m; if (wN * fCurve(L, ta) > wA) lo = m; else hi = m; } L.p = (lo + hi) / 2; }
    L.wA = wA; L.ta = ta; }
  // shells round 4: below the crossing the lapped edge turns from the curve's slope to the straight V's slope over B, so
  // the line has no corner (round 3's corner made the notch); painted.js and the skirt read this same line (lapX)
  L.B = (sh.lapBlend ?? 0.03) * k; L.s1 = (wN - xc) / (L.yN - L.yc); L.s0 = (wN - xc) * dCurve(L, 0) / (L.yN - L.yc);
  return L;
}
// shells round 4: the over edge's x at height y, neck to crossing on the curve, below it the blended lapped line
export function lapX(Lc, y) {
  const { yN, wN, yc, xc, B, s0, s1 } = Lc; if (y >= yc) return xc + (wN - xc) * fCurve(Lc, (y - yc) / (yN - yc));
  const d = yc - y; return xc - (s0 * d + (s1 - s0) * (d < B ? d * d / (2 * B) : d - B / 2));
}
function fCurve(L, t) { t = Math.max(0, t); if (L.p === 1) return t; const { p, e } = L; return (Math.pow(t + e, p) - Math.pow(e, p)) / (Math.pow(1 + e, p) - Math.pow(e, p)); }
function dCurve(L, t) { t = Math.max(0, t); if (L.p === 1) return 1; const { p, e } = L; return p * Math.pow(t + e, p - 1) / (Math.pow(1 + e, p) - Math.pow(e, p)); }
function frontXY(C, p, hc) { const d = p.clone().sub(hc); return { x: d.dot(C.l), y: p.y, z: d.dot(C.f) }; }
// signed distance (m, across) to the V: positive is cloth
function vField(Lc, q) {
  if (q.z < 0.0) return BIG; // the back
  const { yN, wN, yc, xc } = Lc;
  const t = fCurve(Lc, (q.y - yc) / (yN - yc)), xo = xc + (wN - xc) * t, xu = xc + (-wN - xc) * t; // over edge (from the left neck), under edge (from the right neck)
  return Math.max(q.x - xo, xu - q.x, yc - q.y);
}
// the lapped panel's edge below the crossing: from the crossing on toward the wearer's right side, on the slope of the
// over edge. Positive on the over panel (below and left of the line).
function lapField(Lc, q) { // signed distance below the whole over edge (neck to crossing and on to the right side); smooth, so the band is a clean line
  if (q.z < 0.0) return BIG; const { yN, wN, yc, xc } = Lc;
  if (Lc.p !== 1) { // round 3, the curved V: above the crossing the over edge itself, below it the straight V's slope on to the right side (the lapped edge turns at the crossing and runs down to the sash, as before)
    const t = (q.y - yc) / (yN - yc), s = (wN - xc) * (t > 0 ? dCurve(Lc, t) : 1) / (yN - yc), x = t > 0 ? xc + (wN - xc) * fCurve(Lc, t) : xc + s * (q.y - yc);
    return -(q.x - x) / Math.sqrt(1 + s * s); } const dx = xc - wN, dy = yc - yN, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  return -((q.x - xc) * nx + (q.y - yc) * ny);
}

// ---------- the body shell: chest, back, shoulders, sleeves, one mesh off the skin
function bodyShell(C, pc, sh) {
  const F = C.F, B = C.B, k = C.k, fem = !C.male, SI = F.mesh.geometry.attributes.skinIndex, SW = F.mesh.geometry.attributes.skinWeight;
  const armB = new Set([...ARM('L'), ...ARM('R'), ...(pc.bracer ? ['wristL', 'wristR'] : [])]), // round 6: on his body the lower forearm's skin follows the wrist bone, so a bracer's sleeve stopped mid-forearm; the cuff cut still ends it short of the hand
    region = n => TORSO.includes(n) || n === 'neck' || armB.has(n) || LEG('L').includes(n) || LEG('R').includes(n);
  const Lc = collarLines(C, sh), hc = Lc.hc;
  const arm = {}; for (const s of ['L', 'R']) { const a = wp(F.bones['shoulder' + s]), e = wp(F.bones['elbow' + s]), w = wp(F.bones['wrist' + s]); arm[s] = { a, e, w, ew: w.clone().sub(e), len: w.distanceTo(e), up: e.clone().sub(a) }; }
  const sideOf = p => (p.clone().sub(hc).dot(C.l) > 0 ? 'L' : 'R');
  // ease: the torso stands off the skin by ease; the sleeve grows from that at the shoulder to sleeveEase at the cuff
  const eT = (sh.ease ?? 0.012) * k, eA0 = (sh.armEase0 ?? 0.01) * k, eA1 = (sh.armEase1 ?? 0.02) * k;
  const map = new Map(), verts = [], tris = [], idx = F.idx0.array;
  const vOf = r => { if (map.has(r)) return map.get(r); const n = C.name(r), p = C.pos(r), nr = C.nrm(r), isArm = armB.has(n);
    let e = eT; if (isArm || /^clav/.test(n)) { const s = sideOf(p), A = arm[s]; const u = p.clone().sub(A.a).dot(A.up) / A.up.lengthSq(); // 0 at the shoulder joint, 1 at the elbow, on to the wrist
      e = eT + (eA0 - eT) * sstep(-0.3, 0.2, u); if (u > 0.2) e = eA0 + (eA1 - eA0) * sstep(0.2, 2.0, u); }
    if (n === 'neck') e = Math.min(e, 0.008 * k);
    const v = { p: p.clone().addScaledVector(nr, e), n: nr.clone(), si: [0, 1, 2, 3].map(j => SI.getComponent(r, j)), sw: [0, 1, 2, 3].map(j => SW.getComponent(r, j)), arm: isArm ? sideOf(p) : null, src: r };
    map.set(r, verts.length); verts.push(v); return verts.length - 1; };
  for (let t = 0; t < idx.length; t += 3) { const r3 = [idx[t], idx[t + 1], idx[t + 2]].map(i => C.rep[i]); if (!r3.every(r => region(C.name(r)))) continue; tris.push(...r3.map(vOf)); }
  let M = { verts, tris };
  // cloth, not skin: smooth the shell (the muscle and rib detail of the body must not read through it), held at least
  // minEase off the skin it came from, so smoothing can never pull it into the body
  { const nb = M.verts.map(() => new Set()); for (let t = 0; t < M.tris.length; t += 3) { const a = M.tris[t], b = M.tris[t + 1], c = M.tris[t + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
    const minE = (sh.minEase ?? 0.007) * k, it = sh.smooth ?? 14, q = V();
    for (const v of M.verts) v.e0 = v.p.clone().sub(C.pos(v.src)).dot(v.n);
    const step = f => { const nx = M.verts.map((v, i) => { if (!nb[i].size) return v.p.clone(); q.set(0, 0, 0); for (const j of nb[i]) q.add(M.verts[j].p); q.divideScalar(nb[i].size); return v.p.clone().lerp(q, f); }); M.verts.forEach((v, i) => v.p.copy(nx[i])); };
    // round 7 (his marks on cult-shells-look-9): a taubin shell (the open outer) holds its clearance along a smoothed
    // normal, not the skin's own: at her cleavage, under the bust and at the armpit the skin's normals cross, and pushing
    // each vertex out along its own normal after every pass folded the white outer into jagged facets
    const cn = sh.taubin ? M.verts.map(v => v.n.clone()) : null;
    if (cn) for (let pass = 0; pass < 24; pass++) { const nx = cn.map((n, i) => { const a = n.clone(); for (const j of nb[i]) a.add(cn[j]); return a.normalize(); }); nx.forEach((n, i) => cn[i].copy(n)); }
    const hold = () => M.verts.forEach((v, i) => { const nn = cn ? cn[i] : v.n, d = v.p.clone().sub(C.pos(v.src)).dot(nn), want = Math.max(minE, Math.min(v.e0, minE + 0.5 * (v.e0 - minE))); if (d < want) v.p.addScaledVector(nn, want - d); });
    if (cn) M.verts.forEach((v, i) => { v.e0 = v.p.clone().sub(C.pos(v.src)).dot(cn[i]); });
    for (let pass = 0; pass < it; pass++) { step(0.55); if (cn) step(-0.58); if (!cn || pass % 8 === 7 || pass === it - 1) hold(); } }
  // shells round 3, the armpit: the skin crumples under a raised arm (its weights change from arm to chest within a
  // centimetre or two), and a shell carrying those same weights crumpled with it: with the arms raised it folded over
  // itself and the armpit skin came through. Round 3 spreads the shell's weights round each shoulder joint (a diffusion
  // over the shell's own edges, strongest within armpitR of the joint, fading out by 1.6 armpitR, under the joint only), so the cloth there
  // stretches smoothly from the chest to the arm as a rigid shell does. The fit pose does not move.
  { const R = (sh.armpitR ?? 0.1) * k, passes = sh.armpitPasses ?? 30, nb = M.verts.map(() => new Set());
    for (let t = 0; t < M.tris.length; t += 3) { const a = M.tris[t], b = M.tris[t + 1], c = M.tris[t + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
    const J = ['L', 'R'].map(s => wp(F.bones['shoulder' + s])), amt = M.verts.map(v => { const j = J[0].distanceTo(v.p) < J[1].distanceTo(v.p) ? J[0] : J[1], d = j.distanceTo(v.p); const med = v.arm ? sstep(-0.2, 0.4, -v.n.dot(C.l) * Math.sign(v.p.clone().sub(hc).dot(C.l))) : 1; return (1 - sstep(R, 1.6 * R, d)) * (1 - sstep(-0.04 * k, 0.0, v.p.y - j.y)) * med; }); // under the joint only, and on the arm only its inner side: the top and the outside of the shoulder follow the skin
    let W = M.verts.map(v => { const m = new Map(); for (let j = 0; j < 4; j++) if (v.sw[j] > 0) m.set(v.si[j], v.sw[j]); return m; });
    for (let pass = 0; pass < passes; pass++) W = W.map((m, i) => { if (!(amt[i] > 0) || !nb[i].size) return m; const acc = new Map(); for (const j of nb[i]) for (const [b, w] of W[j]) acc.set(b, (acc.get(b) || 0) + w / nb[i].size);
      const o = new Map(); for (const b of new Set([...m.keys(), ...acc.keys()])) o.set(b, (m.get(b) || 0) * (1 - 0.6 * amt[i]) + (acc.get(b) || 0) * 0.6 * amt[i]); return o; });
    M.verts.forEach((v, i) => { if (!(amt[i] > 0)) return; const top4 = [...W[i].entries()].sort((x, y) => y[1] - x[1]).slice(0, 4), sum = top4.reduce((q, x) => q + x[1], 0); v.si = [0, 0, 0, 0]; v.sw = [0, 0, 0, 0]; top4.forEach(([bi, w], j) => { v.si[j] = bi; v.sw[j] = w / sum; }); }); }
  // a sleeve hangs a little: the underside of the arm drops off the skin (rigid, not simulated)
  for (const v of M.verts) if (v.arm) { const A = arm[v.arm], u = v.p.clone().sub(A.a).dot(A.up) / A.up.lengthSq(); const down = Math.max(0, -v.n.y); v.p.y -= (sh.sag ?? 0.012) * k * down * sstep(0.1, 0.9, u); }
  // the flat front (round 5's rule, kept): below the bust the cloth runs straight down to the sash, never into the waist
  flatFront(C, M, Lc);
  // elder regalia round 2 (his B on er-regalia-look-1: "the male shaman doesn't look like a male"; "gaps between the clothing layers"):
  // (1) the man's cut is carried by the shell itself: a squared shoulder yoke over each shoulder cap and straight sides from
  // the underarm to the hip, so a body of any build reads as a man. (2) every upper layer is the SAME shell lifted off the
  // robe's own surface by a few millimetres (sh.lift), with its lip eased down to 1.5 mm at an open edge: a sculpted step,
  // never a second shell 2 cm out with a void between.
  if (sh.manCut) manShape(C, M, Lc, arm, sideOf, sh);
  const baseP = new Map(); for (const v of M.verts) baseP.set(v.src, v.p.clone());
  if (sh.base && sh.lift) { // held at least lift off the robe's surface: the push each vertex needs is spread over its neighbours (a dilation and a blur), so the step is a smooth swell, not a spike where the robe's own shell has a bump the smoother shell lacks
    const lf = sh.lift * k, nb = M.verts.map(() => new Set()); for (let t = 0; t < M.tris.length; t += 3) { const a = M.tris[t], b = M.tris[t + 1], c = M.tris[t + 2]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
    const need = M.verts.map(v => { const b = sh.base.get(v.src); return b ? Math.max(0, lf - v.p.clone().sub(b).dot(v.n)) : 0; }); let push = Float32Array.from(need);
    for (let pass = 0; pass < 16; pass++) { const nx = Float32Array.from(push); push.forEach((x, i) => { if (!nb[i].size) return; let a = 0; for (const j of nb[i]) a += push[j]; nx[i] = Math.max(need[i], 0.5 * x + 0.5 * a / nb[i].size); }); push = nx; }
    M.verts.forEach((v, i) => { if (push[i] > 0) v.p.addScaledVector(v.n, push[i]); }); }
  // fields, each a rough distance in metres, positive where the cloth is
  // the neckline rings the base of the neck: cloth where the skin is further than collarR from the neck's axis, or low
  // enough on the shoulders; never above yNeck + 5 cm
  const nA = wp(F.bones.neck), nH = wp(F.bones.head), nAx = nH.clone().sub(nA).normalize(), rC = (sh.collarR ?? (fem ? 0.075 : 0.068)) * k;
  const top = v => { if (v.arm) return BIG; const d = v.p.clone().sub(nA), along = d.dot(nAx), rad = d.addScaledVector(nAx, -along).length(); return Math.min(Math.max(rad - rC, C.yNeck - 0.035 * k - v.p.y), C.yNeck + (0.05 + (sh.collarUp ?? 0)) * k - v.p.y); };
  const V_ = v => (v.arm ? BIG : vField(Lc, frontXY(C, v.p, hc)));
  const waist = v => (v.arm ? BIG : v.p.y - (C.yWaist - (0.022 + (sh.waistDrop ?? 0)) * k)); // round 5: the open outer's shell runs on under its skirt's top
  const cuffAt = (sh.cuff ?? (pc.bracer ? 0.82 : 0.96)), // round 6: a bracer's sleeve is cut clean just short of the wrist (at 0.96 the shell ran out at the hand's skin first, a ragged end)
    cuff = v => { if (!v.arm) return BIG; const A = arm[v.arm]; const s = v.p.clone().sub(A.e).dot(A.ew) / A.len; return cuffAt * A.len - s; };
  // round 5 (every outfit): a cape is the same shell cut higher, across the body at yCut and round the upper arm at
  // capArm (0 at the shoulder joint, 1 at the elbow); an open outer has its V crossing far below the waist (two front edges)
  const uArm = v => { const A = arm[v.arm]; return v.p.clone().sub(A.a).dot(A.up) / A.up.lengthSq(); };
  // round 6 (his B on cult-shells-look-8, the cape read as a square yoke): the cape's hem curves, lowest at the centre back
  // (capeBack under yCut), rising to yCut at the sides, and a little lower at the centre front (capeFront)
  const capeY = v => { if (!sh.capeBack && !sh.capeFront) return sh.yCut; const q = frontXY(C, v.p, hc), xs = Math.min(1, Math.abs(q.x) / ((sh.capeHalfW ?? 0.2) * k)), bk = sstep(0.03 * k, -0.06 * k, q.z), cv = 1 - xs * xs;
    return Math.max(C.yWaist + 0.07 * k, sh.yCut - k * cv * ((sh.capeBack ?? 0) * bk + (sh.capeFront ?? 0) * (1 - bk))); }; // never down to the sash
  const below = v => (sh.yCut == null ? BIG : v.arm ? (sh.capArm ?? 0.35) + (sh.capSlant ?? 0) * v.n.dot(C.l) * (v.arm === 'L' ? 1 : -1) - uArm(v) : v.p.y - capeY(v));
  M = clip(M, top); M = clip(M, V_); if (sh.yCut == null) M = clip(M, waist); M = clip(M, cuff); if (sh.yCut != null) M = clip(M, below);
  // round 7 (his marks on cult-shells-look-9, the white torn where it meets the red band): the cut runs across the shell's
  // triangles, so seen from the side its edge zigzags in depth; on the taubin shell the open edges are smoothed along
  // themselves (each edge vertex toward its two neighbours on the edge, 12 passes)
  if (sh.taubin) { const cnt = new Map(), key = (a, b) => (a < b ? a + ',' + b : b + ',' + a), E2 = new Map();
    for (let t = 0; t < M.tris.length; t += 3) for (let j = 0; j < 3; j++) { const a = M.tris[t + j], b = M.tris[t + (j + 1) % 3], kk = key(a, b); cnt.set(kk, (cnt.get(kk) || 0) + 1); }
    for (const [kk, c] of cnt) if (c === 1) { const [a, b] = kk.split(',').map(Number); (E2.get(a) || E2.set(a, []).get(a)).push(b); (E2.get(b) || E2.set(b, []).get(b)).push(a); }
    const ids = [...E2.keys()].filter(i => E2.get(i).length === 2);
    for (let pass = 0; pass < 12; pass++) { const nx = ids.map(i => { const [a, b] = E2.get(i); return M.verts[i].p.clone().multiplyScalar(0.5).addScaledVector(M.verts[a].p, 0.25).addScaledVector(M.verts[b].p, 0.25); }); ids.forEach((i, j) => M.verts[i].p.copy(nx[j])); } }
  // shells round 2: the V's two edges at the sternum, measured on the cut mesh (the vertices the V's zero line made),
  // each side's distance from the body's midline (between the clavicles), per 1 cm from the crossing to the neck
  { const xm = wp(F.bones.clavL).add(wp(F.bones.clavR)).multiplyScalar(0.5).sub(hc).dot(C.l), bins = new Map();
    for (const v of M.verts) { if (v.arm) continue; const q = frontXY(C, v.p, hc); if (q.z < 0 || Math.abs(V_(v)) > 1e-5 || q.y < Lc.yc + 0.01 * k || q.y > Lc.yN - 0.02 * k) continue;
      const b = Math.round(q.y / 0.01), e = bins.get(b) || { L: [], R: [] }; (q.x > xm ? e.L : e.R).push(Math.abs(q.x - xm)); bins.set(b, e); }
    let worst = 0, n = 0; const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    for (const e of bins.values()) { if (!e.L.length || !e.R.length) continue; worst = Math.max(worst, Math.abs(mean(e.L) - mean(e.R))); n++; }
    C.vSym = { rows: n, worstMm: +(worst / k * 1000).toFixed(1), crossX: +((Lc.xc - xm) / k * 1000).toFixed(1) }; }
  // shells round 3: true distances to the open edges, measured on the cut mesh at the fit pose. (1) dOpen, to the nearest
  // vertex of the neck, V and cuff cuts (the waist cut lies under the sash): the body mask keeps skin drawn only within
  // KEEP of a real opening. Round 2 used the cut fields themselves, which are rough distances: under the arm the neck
  // field read 5 to 7 cm, so the armpit skin stayed drawn under the shell and came through it with the arms raised.
  // (2) dTop, to the neck cut alone: the back collar band is a true width from the edge (the field made it a block).
  const dOpen = new Float32Array(M.verts.length).fill(BIG), dTop = new Float32Array(M.verts.length).fill(BIG);
  { const cnt = new Map(), key = (a, b) => (a < b ? a + ',' + b : b + ',' + a); for (let t = 0; t < M.tris.length; t += 3) for (let j = 0; j < 3; j++) { const kk = key(M.tris[t + j], M.tris[t + (j + 1) % 3]); cnt.set(kk, (cnt.get(kk) || 0) + 1); }
    const bnd = new Set(); for (const [kk, c] of cnt) if (c === 1) for (const x of kk.split(',')) bnd.add(+x);
    const open = [], neck = []; for (const i of bnd) { const v = M.verts[i]; if (Math.abs(waist(v)) < 1e-6) continue; open.push(v.p); if (Math.abs(top(v)) < 1e-6) neck.push(v.p); }
    M.verts.forEach((v, i) => { for (const q of open) dOpen[i] = Math.min(dOpen[i], v.p.distanceTo(q)); for (const q of neck) dTop[i] = Math.min(dTop[i], v.p.distanceTo(q)); }); }
  if (sh.base && sh.lift) { const lf = sh.lift * k; M.verts.forEach((v, i) => { if (dOpen[i] < 0.01 * k) v.p.addScaledVector(v.n, -lf * 0.6 * (1 - sstep(0, 0.01 * k, dOpen[i]))); }); } // the rounded lip: 4 mm of lift eases to 1.6 mm over the last centimetre at an open edge
  // geometry
  const n = M.verts.length, P = new Float32Array(n * 3), Cc = new Float32Array(n * 3), E = new Float32Array(n), eC = new Float32Array(n), eH = new Float32Array(n), lap = new Float32Array(n), rest = new Float32Array(n * 3), seam = new Float32Array(n);
  const c0 = new THREE.Color(pc.color), cw = (pc.collarW ?? 0.04) * k, cBr = pc.bracer ? new THREE.Color(pc.bracer) : null; // round 5: A2's bracers are painted on the sleeve's forearm, not modelled
  M.verts.forEach((v, i) => { const q = frontXY(C, v.p, hc);
    const ec = v.arm ? BIG : Math.min(dTop[i], V_(v)), lp = v.arm ? BIG : lapField(Lc, q);
    // round 4: the V band and the lapped edge are painted per fragment from aRest (painted.js, uniforms from collarLines);
    // the attribute keeps the back collar band (dTop) alone, and aLap flags the torso (1) against the sleeves (0)
    eC[i] = v.arm ? BIG : dTop[i]; lap[i] = v.arm ? 0 : 1; void lp;
    eH[i] = Math.min(cuff(v), below(v)); E[i] = Math.min(Math.min(ec, Math.abs(lp - cw / 2) + cw / 2), eH[i]);
    // the collar band stands 3 mm proud (one mesh, so it cannot come apart from the robe)
    if (ec < cw && sh.collarProud) v.p.addScaledVector(v.n, 0.003 * k * sstep(0, 0.006 * k, ec) * (1 - sstep(cw * 0.85, cw, ec))); // only at the neck and the V; the lapped edge is paint alone
    // the shoulder seam: a signed distance along the upper arm from a plane just outside the shoulder joint
    if (v.arm) { const A = arm[v.arm]; seam[i] = v.p.clone().sub(A.a).dot(A.up.clone().normalize()) - 0.035 * k; } else { const s = sideOf(v.p), A = arm[s]; seam[i] = Math.min(-0.012 * k, v.p.clone().sub(A.a).dot(A.up.clone().normalize()) - 0.035 * k); }
    P.set(v.p.toArray(), i * 3); Cc.set([c0.r, c0.g, c0.b], i * 3); void cBr; rest.set([q.x, q.y, q.z], i * 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setIndex(M.tris);
  g.computeVertexNormals(); g.userData.edge = Float32Array.from(dOpen);
  // round 6 (his B on cult-shells-look-8): the bracer is painted per fragment from the cuff's distance (aEdgeH), from the cuff
  // up to bracerFrom of the forearm, with an edge band at each end (painted.js); round 5 coloured whole vertices
  if (cBr) g.userData.bracerW = (cuffAt - (pc.bracerFrom ?? 0.42)) * (arm.L.len + arm.R.len) / 2; // round 3: the true distance to an opening (see dOpen)
  g.setAttribute('aEdgeC', new THREE.BufferAttribute(eC, 1)); g.setAttribute('aEdgeH', new THREE.BufferAttribute(eH, 1)); g.setAttribute('aLap', new THREE.BufferAttribute(lap, 1));
  g.setAttribute('aRest', new THREE.BufferAttribute(rest, 3)); g.setAttribute('aSeam', new THREE.BufferAttribute(seam, 1));
  const W = { si: new Uint16Array(n * 4), sw: new Float32Array(n * 4) }; M.verts.forEach((v, i) => { for (let j = 0; j < 4; j++) { W.si[i * 4 + j] = v.si[j]; W.sw[i * 4 + j] = v.sw[j]; } });
  return { g, W, Lc, base: baseP };
}
// ---------- elder regalia round 2: the man's cut, carried by the shell (design 2026-11-19, regalia-2/handoff.md section 3)
// A squared yoke over each shoulder cap (up to 18 mm out and up, crest at the acromion) and straight sides from the underarm to
// the hip (the shell fills out to the hip's half-width, so there is no waist). Both move the shell's own vertices at the fit pose
// and ride the skin's weights, so the cut holds in every pose, and every build wears it.
function manShape(C, M, Lc, arm, sideOf, sh) {
  const k = C.k, hc = Lc.hc, F = C.F, J = { L: wp(F.bones.shoulderL), R: wp(F.bones.shoulderR) }, up = V(0, 1, 0), t = V();
  for (const v of M.verts) { const s = sideOf(v.p), j = J[s], dist = v.p.distanceTo(j.clone().add(V(0, 0.02 * k, 0))), w = (1 - sstep(0.05 * k, 0.14 * k, dist)) * sstep(j.y - 0.06 * k, j.y - 0.01 * k, v.p.y) * (v.arm && arm[v.arm] ? 1 - sstep(0.1, 0.35, v.p.clone().sub(arm[v.arm].a).dot(arm[v.arm].up) / arm[v.arm].up.lengthSq()) : 1);
    if (!(w > 0)) continue; t.copy(v.n).multiplyScalar(0.5).addScaledVector(C.l, 0.5 * (s === 'L' ? 1 : -1)).addScaledVector(up, 0.3).normalize(); v.p.addScaledVector(t, (sh.yoke ?? 0.018) * k * w); }
  const bins = new Map(), bin = y => Math.round(y / (0.01 * k)); let nTop = 0;
  for (const v of M.verts) { if (v.arm) continue; const y = v.p.y; if (y > J.L.y || y < C.yHip) continue; const x = Math.abs(v.p.clone().sub(hc).dot(C.l)), b = bin(y); bins.set(b, Math.max(bins.get(b) || 0, x)); nTop++; }
  const hw = y => { let m = 0; for (let d = -3; d <= 3; d++) m = Math.max(m, bins.get(bin(y) + d) || 0); return m; }, // a flank row is the widest within 3 cm (a mesh row at one height can miss the side)
    yU = J.L.y - 0.09 * k, yB = C.yHip + 0.02 * k, wU = hw(yU), wB = hw(yB);
  if (wU > 0 && wB > 0) for (const v of M.verts) { if (v.arm || v.p.y > yU || v.p.y < C.yHip) continue; const d = v.p.clone().sub(hc), x = d.dot(C.l), ax = Math.abs(x), row = hw(v.p.y); if (!(row > 0)) continue;
    const line = wB + (wU - wB) * (v.p.y - yB) / (yU - yB), dW = Math.max(0, line - row) * sstep(0.5, 0.9, ax / row); if (dW > 0) { v.p.addScaledVector(C.l, Math.sign(x) * dW); } // every vertex of a row's flank moves by the same amount (no spikes)
  }
}

function flatFront(C, M, Lc) {
  const k = C.k, hc = Lc.hc, yTop = C.yApex ?? (C.ySh - 0.12 * k), yBot = C.yWaist, bin = 0.012 * k, cols = new Map();
  const isFront = v => !v.arm && v.n.dot(C.f) > 0.2;
  for (const v of M.verts) { if (!isFront(v)) continue; const q = frontXY(C, v.p, hc); if (q.y > yTop + 0.03 * k || q.y < yBot - 0.02 * k) continue; const b = Math.round(q.x / bin); const c = cols.get(b) || { top: -1, bot: -1 };
    if (Math.abs(q.y - yTop) < 0.025 * k) c.top = Math.max(c.top, q.z); if (Math.abs(q.y - yBot) < 0.02 * k) c.bot = Math.max(c.bot, q.z); cols.set(b, c); }
  for (const v of M.verts) { if (!isFront(v)) continue; const q = frontXY(C, v.p, hc); if (q.y > yTop || q.y < yBot) continue; const c = cols.get(Math.round(q.x / bin)); if (!c || c.top < 0 || c.bot < 0) continue;
    const t = (yTop - q.y) / (yTop - yBot), zT = c.top + (c.bot - c.top) * t; if (q.z < zT) v.p.addScaledVector(C.f, (zT - q.z) * sstep(0, 0.15, t)); }
}

// ---------- the skirt: rings from under the sash to the hem, hung rigid from the pelvis
function skirt(C, pc, sh, L, Lc, G) {
  const k = C.k, nT = L.nT, top = C.yWaist + (sh.skirtTop ?? 0.02) * k, // round 6: the open outer's skirt rises over its shell's cut, above the sash
    R = L.rings.filter(r => r.y <= top + 1e-6), rows = R.length;
  const P = [], I = [], E = [], rest = [], lapA = [], hc = Lc.hc;
  const xLap = lapX(Lc, C.yWaist); // where the lapped edge meets the sash (round 4: the torso's own line, lapX)
  for (let ri = 0; ri < rows; ri++) for (let t = 0; t < nT; t++) { const th = t / nT * Math.PI * 2, r = R[ri]; const rr = r.r[t]; const p = C.fromAB(r.c[0] + rr * Math.cos(th), r.c[1] + rr * Math.sin(th), r.y);
    if (sh.hug) sh.hug(p);
    P.push(p.x, p.y, p.z); E.push(r.y - L.yHem); const q = frontXY(C, p, hc); rest.push(q.x, q.y, q.z); lapA.push(q.z > 0.02 ? q.x - xLap : BIG); }
  for (let ri = 0; ri < rows - 1; ri++) for (let t = 0; t < nT; t++) { const a = ri * nT + t, b = ri * nT + (t + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  // winding: normals out from the axis
  { const N = g.attributes.normal, p = V(), n = V(); p.fromBufferAttribute(g.attributes.position, nT * 2); n.fromBufferAttribute(N, nT * 2); const c = C.fromAB(R[2].c[0], R[2].c[1], p.y); if (n.dot(p.clone().sub(c)) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const s = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = s; } g.computeVertexNormals(); } }
  const c0 = new THREE.Color(pc.color), Cc = []; for (let i = 0; i < P.length / 3; i++) Cc.push(c0.r, c0.g, c0.b); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const cwS = (pc.collarW ?? 0.035) * k, lapE = lapA.map(x => (x >= BIG ? BIG : Math.abs(x - cwS / 2) + cwS / 2));
  g.setAttribute('aEdgeH', new THREE.Float32BufferAttribute(E, 1)); g.setAttribute('aEdgeC', new THREE.Float32BufferAttribute(lapE, 1)); g.setAttribute('aLap', new THREE.Float32BufferAttribute(lapA, 1));
  g.setAttribute('aRest', new THREE.Float32BufferAttribute(rest, 3)); g.setAttribute('aSeam', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3).fill(-1), 1));
  g.userData.edge = Float32Array.from(E);
  // weights: the pelvis holds it; each side takes some of its thigh toward the hem, so the stride swings it as one piece
  const n = P.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), bi = nm => C.bn.indexOf(nm), H = bi('hips'), TL = bi('hipL'), TR = bi('hipR'), hl = hc.dot(C.l), p = V();
  const thighMax = sh.thigh ?? 0.5;
  for (let i = 0; i < n; i++) { p.fromBufferAttribute(g.attributes.position, i); const u = sstep(C.yHip + 0.03 * k, C.yHip - 0.22 * k, p.y) * thighMax, sL = sstep(-0.06 * k, 0.06 * k, p.dot(C.l) - hl);
    const w = [[H, 1 - u], [TL, u * sL], [TR, u * (1 - sL)]].filter(x => x[1] > 1e-4).sort((a, b) => b[1] - a[1]); w.forEach(([b, ww], j) => { si[i * 4 + j] = b; sw[i * 4 + j] = ww; }); }
  return { g, W: { si, sw } };
}

// ---------- the bell sleeve: a rigid piece hung on the forearm
function bell(C, pc, sh, s) {
  const k = C.k, F = C.F, e = wp(F.bones['elbow' + s]), w = wp(F.bones['wrist' + s]), ax = w.clone().sub(e), len = ax.length(); ax.normalize();
  const dn = V(0, -1, 0).addScaledVector(ax, ax.y).normalize(); // straight down, in the ring's plane
  const sd = V().crossVectors(ax, dn).normalize();
  const armProf = (sv, nT) => { const R = new Float32Array(nT); for (const i of C.uniq) { const n = C.name(i); if (!ARM(s).includes(n)) continue; const p = C.pos(i), d = p.clone().sub(e), t = d.dot(ax); if (Math.abs(t - sv) > 0.015 * k) continue; d.addScaledVector(ax, -t);
      const a = Math.atan2(d.dot(sd), d.dot(dn)), b = ((Math.round(a / (Math.PI * 2) * nT) % nT) + nT) % nT; R[b] = Math.max(R[b], d.length()); }
    for (let pass = 0; pass < 3; pass++) for (let b = 0; b < nT; b++) if (!R[b]) R[b] = Math.max(R[(b + 1) % nT], R[(b + nT - 1) % nT]);
    const S = R.map((_, b) => (R[(b + nT - 1) % nT] + 2 * R[b] + R[(b + 1) % nT]) / 4); return S; };
  // round 7 (his marks on cult-shells-look-9, the torn edge where the bell meets the sleeve): the outer's bell takes its
  // top section from the outer's own smoothed sleeve shell, 3 mm inside it, not from the bumpy arm, so the line where it
  // comes out of the sleeve is a clean ring. Per angle the sleeve is the shell nearest the arm's axis (the torso lies further out)
  function shellProf(W, sv, nT) { const R = new Float32Array(nT), p = V(); for (let i = 0; i < W.length; i += 3) { p.fromArray(W, i); const d = p.clone().sub(e), t = d.dot(ax); if (Math.abs(t - sv) > 0.015 * k) continue; d.addScaledVector(ax, -t); if (d.length() > 0.2 * k) continue;
      const a = Math.atan2(d.dot(sd), d.dot(dn)), b = ((Math.round(a / (Math.PI * 2) * nT) % nT) + nT) % nT; R[b] = R[b] ? Math.min(R[b], d.length()) : d.length(); }
    for (let pass = 0; pass < 6; pass++) for (let b = 0; b < nT; b++) if (!R[b]) R[b] = Math.max(R[(b + 1) % nT], R[(b + nT - 1) % nT]);
    let S = R; for (let pass = 0; pass < 6; pass++) S = S.map((_, b) => (S[(b + nT - 1) % nT] + 2 * S[b] + S[(b + 1) % nT]) / 4);
    return S.map(x => x - pe - 0.003 * k); }
  const armR = sv => { let m = 0.03 * k; for (const i of C.uniq) { const n = C.name(i); if (!ARM(s).includes(n)) continue; const p = C.pos(i), d = p.clone().sub(e), t = d.dot(ax); if (Math.abs(t - sv) > 0.02 * k) continue; m = Math.max(m, d.addScaledVector(ax, -t).length()); } return m; };
  // elder robes round 2 (his steer 2026-11-18, "the textured patterns and drape geometry"): a drape test. drapeN folds
  // hang round the bell, drapeA deep, growing toward the mouth (u^1.5) and deeper on the lower side where the cloth's
  // weight gathers; drapeLen lets the lower edge hang on below the mouth in a long curve, as the reference sleeves do.
  // With none of the three keys set the bell is the rigid cone it was (nR 22, nT 48).
  const dN = sh.drapeN ?? 0, dA = sh.drapeA ?? 0, dL = sh.drapeLen ?? 0, drape = dA > 0 || dL > 0;
  const s0 = -(sh.bellUp ?? 0.06) * k, s1 = len + (sh.bellPast ?? 0.12) * k, nR = drape ? 34 : 22, nT = drape ? 72 : 48, r0 = armR(s0) + (sh.armEase0 ?? 0.01) * k - 0.009 * k, // fix 4: tucked 9 mm inside the sleeve shell (was 4), so no ledge shows at the elbow
    // the top ring tucks just inside the sleeve shell, so no rim shows
    rM = (sh.bellR ?? 0.15) * k;
  const P = [], E = [], A = [], rest = [], hc = wp(F.bones.hips), I = []; // A: arc length round the ring, for the woven pattern and the cuff motif
  const pe = (sh.armEase0 ?? 0.01) * k - 0.003 * k, prof = sh.sleeveOf ? shellProf(sh.sleeveOf, s0, nT) : armProf(s0, nT);
  for (let ri = 0; ri <= nR; ri++) { const u = ri / nR, sv = s0 + (s1 - s0) * u, grow = Math.pow(u, 2.0), r = r0 + (rM - r0) * grow, drop = (r - r0) * (sh.hang ?? 0.8);
    // the mouth is cut on a slant: its lower edge hangs further than its upper edge (the sleeve's weight), rigid
    for (let t = 0; t < nT; t++) { const th = t / nT * Math.PI * 2, cdn = Math.cos(th); const svx = sv + (ri === nR ? 0 : 0) + u * u * (sh.square ? 0 : (sh.slant ?? 0.06)) * k * (0.5 + 0.5 * cdn); // the square mouth is cut flat, not slanted
      let svxD = 0; const o = e.clone().addScaledVector(ax, svx).addScaledVector(dn, drop); let rr = r + (prof[t] + pe - r0) * (1 - sstep(0, 0.4, u)); if (sh.sleeveOf) rr = Math.max(rr, prof[t] + pe + 0.015 * k * sstep(0, 0.08, u)); // round 7: out over the sleeve's shell within 2 cm, so the sleeve's own end stays inside the bell // near the top the ring is the arm's own section, then it rounds out
      if (drape) { const fu = Math.pow(u, 1.5) * sstep(0.12, 0.5, u), fs = Math.sin(dN * th + 0.7 * Math.sin(3 * th)); rr *= 1 + dA * fu * (0.75 + 0.25 * cdn) * (fs - 0.3 * fs * fs + 0.15); // rounded crests, tighter valleys
        svxD = dA * rM * 0.6 * u * u * u * fs; } else svxD = 0; // the mouth's edge rises and falls with the folds
      o.addScaledVector(ax, svxD); let cs = cdn, sn = Math.sin(th), rq = rr; // round 2, the man's cut: the mouth is a squared section (a superellipse, 4th power) opening from the round cuff, so the sleeve ends in a straight lower edge (a Ming square sleeve), not a trumpet
      if (sh.square) { const q = sstep(0.08, 0.7, u), ac = Math.abs(cdn), as = Math.abs(sn), nrm = Math.pow(ac ** 4 + as ** 4, -0.25); rq = rr * (1 + (nrm - 1) * q * 0.85); }
      let p = o.addScaledVector(dn, rq * cs).addScaledVector(sd, rq * sn * (1 - 0.12 * grow));
      if (sh.gravity) { // round 4c (his note on er-regalia-look-4: "the cone of the sleeves need to flatten onto the arm and only drape where gravity pulls it down"): no cone. The ring is the arm's own section all the way down, so the top and the sides lie flat on the arm; the extra cloth is a world-down hang on the lower side only, growing to the mouth, with the folds in the hang and a small spill to the sides where it leaves the arm
        const fu2 = Math.pow(u, 1.7), wl = Math.pow(0.5 + 0.5 * cdn, 1.3), ws = sstep(-0.2, 1, cdn), ext = rM - r0, sn_ = Math.sin(th);
        let fm = 1; if (drape) { const fs2 = Math.sin(dN * th + 0.7 * Math.sin(3 * th)); fm = 1 + 1.5 * dA * sstep(0.12, 0.6, u) * (fs2 - 0.3 * fs2 * fs2 + 0.15); }
        const pr = prof[t] + pe + 0.004 * k * sstep(0, 0.5, u); // a few mm of ease, never the cone
        p = e.clone().addScaledVector(ax, svx).addScaledVector(dn, pr * cdn).addScaledVector(sd, pr * sn_);
        p.addScaledVector(V(0, -1, 0), ext * (sh.hang ?? 0.8) * 2.0 * fu2 * wl * fm).addScaledVector(dn, 0).addScaledVector(sd, ext * 0.28 * fu2 * ws * sn_ * fm); }
      if (dL > 0) p.addScaledVector(V(0, -1, 0), dL * k * u * u * (0.3 + 0.7 * Math.pow(0.5 + 0.5 * cdn, 1.5))); // the cloth falls world down, the lower edge furthest, in a long curve
      P.push(p.x, p.y, p.z); E.push((s1 - sv) * 1.0); A.push((th > Math.PI ? th - 2 * Math.PI : th) * r); const q = frontXY(C, p, hc); rest.push(q.x, q.y, q.z); } }
  for (let ri = 0; ri < nR; ri++) for (let t = 0; t < nT; t++) { const a = ri * nT + t, b = ri * nT + (t + 1) % nT, c = a + nT, d = b + nT; I.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  { const N = g.attributes.normal, p = V(), n = V(), j = nT * 3; p.fromBufferAttribute(g.attributes.position, j); n.fromBufferAttribute(N, j); const o = e.clone().addScaledVector(ax, p.clone().sub(e).dot(ax)); if (n.dot(p.clone().sub(o)) < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const q = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = q; } g.computeVertexNormals(); } }
  const c0 = new THREE.Color(pc.color), Cc = []; for (let i = 0; i < P.length / 3; i++) Cc.push(c0.r, c0.g, c0.b); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('aEdgeH', new THREE.Float32BufferAttribute(E, 1)); g.setAttribute('aEdgeC', new THREE.Float32BufferAttribute(new Float32Array(E.length).fill(BIG), 1)); g.setAttribute('aLap', new THREE.Float32BufferAttribute(new Float32Array(E.length).fill(BIG), 1));
  g.setAttribute('aRest', new THREE.Float32BufferAttribute(rest, 3)); g.setAttribute('aSeam', new THREE.Float32BufferAttribute(A, 1)); g.userData.edge = Float32Array.from(E); // on a bell aSeam carries the arc (no seam is painted on a bell)
  // weights: the top ring takes the skin's own weights (it stretches with the elbow); below, the forearm alone (rigid)
  const okA = i => ARM(s).includes(C.name(i)), Wn = GC.weightsNearest(C, g, okA), fb = C.bn.indexOf('elbow' + s), n = P.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const ri = Math.floor(i / nT), t = sstep(0, 0.35, ri / nR); const acc = new Map(); for (let j = 0; j < 4; j++) { const ww = Wn.sw[i * 4 + j] * (1 - t); if (ww > 0) acc.set(Wn.si[i * 4 + j], (acc.get(Wn.si[i * 4 + j]) || 0) + ww); } acc.set(fb, (acc.get(fb) || 0) + t);
    [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).forEach(([b, ww], j) => { si[i * 4 + j] = b; sw[i * 4 + j] = ww; }); for (let j = 0; j < 4; j++) { const s4 = sw[i * 4] + sw[i * 4 + 1] + sw[i * 4 + 2] + sw[i * 4 + 3]; if (s4 > 0) sw[i * 4 + j] /= s4; } }
  return { g, W: { si, sw }, B: { nR, nT, s0, s1, r0 } };
}

// round 4d (his answer on er-regalia-look-5, B: "the sleeve shorter to show the hands and the sense of the sleeve of the undershirt inside"):
// the bell's mouth stops above the wrist, and the undershirt's own sleeve (pc.under, cream) runs on from inside it to the wrist, so the
// cuff reads as a robe sleeve over a closer one. A tube round the forearm on the inner-robe layer, a few mm out from the arm; the
// mouth band is a thicker rim at its end. Off unless the robe sets underSleeve.
function underSleeves(C, G, pc, sh) {
  const out = [], k = C.k, F = C.F, ok = n => n;
  for (const s of ['L', 'R']) { const el = wp(F.bones['elbow' + s]), wr = wp(F.bones['wrist' + s]), Lf = el.distanceTo(wr);
    const T = GC.tube(C, { chain: [el, wr], ok: i => /^(elbow|foreSwing)/.test(C.name(i)) && C.name(i).endsWith(s), s0: Lf * (sh.underFrom ?? 0.3), s1: Lf + (sh.underPast ?? 0.012) * k, ease: (sh.underEase ?? 0.007) * k, nT: 32, ds: 0.012 });
    const uc = pc.under || '#ebe5d6', gi = GC.tubeGeo(C, T, uc), okA = i => ARM(s).includes(C.name(i));
    out.push(G.skinned(C, gi, G.weightsNearest(C, gi, okA), uc, 'undersleeve' + s, G.LAYER.innerrobe)); }
  void ok; return out;
}

function bustSpread(C) { // round 3: each apex's distance from the midline (the most forward chest point on each side), averaged
  const k = C.k, hl = wp(C.F.bones.hips).dot(C.l), best = { L: [-1e9, 0], R: [-1e9, 0] };
  for (const i of C.uniq) { const n = C.name(i), p = C.pos(i); if (!TORSO.includes(n) || p.y > C.ySh - 0.05 * k || p.y < C.ySh - 0.3 * k) continue; const x = p.dot(C.l) - hl; if (Math.abs(x) < 0.03 * k) continue;
    const b = best[x > 0 ? 'L' : 'R'], fw = p.dot(C.f); if (fw > b[0]) { b[0] = fw; b[1] = Math.abs(x); } }
  return (best.L[1] + best.R[1]) / 2;
}
function bustApex(C) { // height of the bust apex (the most forward chest point between the underarm and the waist), both genders
  const k = C.k; let best = -1e9, yA = C.ySh - 0.15 * k; for (const i of C.uniq) { const n = C.name(i), p = C.pos(i); if (!TORSO.includes(n) || p.y > C.ySh - 0.05 * k || p.y < C.ySh - 0.3 * k) continue; const fw = p.dot(C.f); if (fw > best) { best = fw; yA = p.y; } } return yA;
}

export function dress(C, reg, outfitKey) {
  const o = reg.outfits[outfitKey]; if (!o) throw new Error('outfit ' + outfitKey);
  const G = outfitKey[0] === 'B' ? GB : GC, parts = [], k = C.k; C.rigid = true;
  C.male = !(C.F.mix && C.F.mix.gender === 'f'); C.yWaist = C.yHip + (C.male ? 0.08 : 0.11) * k; C.qixiong = false; C.metal = o.metal || null; C.colliders = []; C.yApex = bustApex(C);
  // round 3: the cup size the wrap reads (mix.bust, 1 = the body as bought) and the apex spread; reg.bust.wrap holds the rule
  C.cup = C.F.mix && C.F.mix.bust != null ? +C.F.mix.bust : (reg.bust ? reg.bust.default : 1); C.wrap = !C.male && reg.bust ? reg.bust.wrap || null : null; C.xApex = bustSpread(C);
  // elder regalia (2026-11-19): a piece may carry a man's and a woman's form of the same word (pc.m, pc.f, merged over
  // it), or be worn by one only (pc.who 'm' or 'f'), so one outfit key dresses both bodies in their own cut
  const pieces = o.pieces.filter(p => !p.who || p.who === (C.male ? 'm' : 'f')).map(p => ({ ...p, ...((C.male ? p.m : p.f) || {}), shell: { ...(p.shell || {}), ...(((C.male ? p.m : p.f) || {}).shell || {}) } }));
  const rp = pieces.find(p => p.p === 'robe'); if (!rp) return []; // a test outfit with no robe: the body alone
  const sh = { ...(reg.shell || {}), ...(rp.shell || {}) }, yHem = Math.max(0.034 * k, rp.hem * C.S);
  // elder regalia round 2: the cut comes from the body today (position er-cut-free: any body may wear either, stored apart later)
  C.cut = C.male ? 'm' : 'f'; C.reg = pieces.some(p => p.p === 'regalia'); C.robeSh = sh; C.robeBase = null;
  if (C.reg && C.cut === 'm') { sh.manCut = true; sh.collarUp = 0.01; sh.square = !!sh.bell; }
  // one loft for the skirt and for what lies on the robe (sash, hair, props): no folds modelled, no drape
  const L = G.loft(C, { yTop: C.yNeck + 0.02 * k, yHem, regionAt: G.torsoOK(C, true), ease: (sh.skirtEase ?? 0.02), flare: rp.flare || 0, folds: 0, cinch: { y: C.yWaist, h: 0.07 * k }, topEase: 0.012, yoke: 0.03, tcut: true });
  const robeParts = [];
  { const { g, W, Lc, base } = bodyShell(C, rp, sh); C.Lc = Lc; if (C.reg) C.robeBase = base;
    // the rank square's place: under the collar's crossing, over the sash, at most 17 cm square
    { const top = Lc.yc - 0.02 * k, bot = C.yWaist + 0.06 * k; C.rankS = Math.max(0.03 * k, Math.min(0.085 * k, (top - bot) / 2)); C.rankY = (top + bot) / 2; }
    const pt = G.skinned(C, g, W, rp.color, 'robe-shell', 4); paint(pt, rp, sh.bell ? { ...sh, cuffW: 0 } : sh, 'shell', C); /* fix 4: under a bell the sleeve's own cuff band is hidden, so no gold sliver shows at the elbow */ armpitFix(C, pt, 0.009); robeParts.push(pt);
    // fix 4 (his B on cult-shells-look-5: "an option to have an underwrap to protect modesty"): mix.underwrap puts a second, thinner shell
    // under the robe's, cut with a high round neckline, so the robe's V shows the cloth and not the chest
    if (!C.male && C.F.mix.underwrap) { const uw = rp.underwrap || {}, ush = { ...sh, ease: (sh.ease ?? 0.012) * 0.45, armEase0: (sh.armEase0 ?? 0.01) * 0.45, armEase1: (sh.armEase1 ?? 0.02) * 0.6, minEase: 0.0035, crossBelowApex: uw.crossBelowApex ?? -0.07, vTop: uw.vTop ?? 0.01, neckW: uw.neckW ?? 0.07 }, urp = { ...rp, color: uw.color || '#e8dfcf', collarColor: uw.color || '#e8dfcf', collarW: 0.0, band: uw.color || '#e8dfcf', trim: uw.color || '#e8dfcf', hemBand: 0 };
      const u = bodyShell(C, urp, ush); const pu = G.skinned(C, u.g, u.W, urp.color, 'underwrap', 4); paint(pu, urp, ush, 'shell', C); robeParts.push(pu); }
    // elder regalia round 2: the skirt's top ring is welded to the shell's seam (it takes the shell's radius at the waist cut, widening to it
    // over the 10 cm under the cut), so no gap can open between shell and skirt; the skirt is a drape piece, tagged for the cloth bake
    const hugR = C.reg ? makeHug(C, Lc, pt.world, C.yWaist - 0.022 * k, C.yWaist + 0.03 * k, pt.geo.attributes.aLap.array) : null;
    const S = skirt(C, rp, hugR ? { ...sh, hug: hugR } : sh, L, Lc, G); const ps = G.skinned(C, S.g, S.W, rp.color, 'robe', 4); paint(ps, rp, sh, 'skirt', C); if (C.reg) ACC.tagDrape(ps, 'waist', C.yWaist); robeParts.push(ps);
    if (sh.bell) for (const s of ['L', 'R']) { const b = bell(C, rp, sh, s); const pb = G.skinned(C, b.g, b.W, rp.color, 'bell' + s, 4); paint(pb, rp, sh, 'bell', C); bellFall(C, pb, b.B, s, !!sh.gravity); if (C.reg) ACC.tagDrape(pb, 'elbow' + s, 0); robeParts.push(pb); } if (sh.underSleeve) robeParts.push(...underSleeves(C, G, rp, sh)); }
  let hairPc = null;
  const AH = { loftAt: G.loftAt, skinned: G.skinned, weightsBone: G.weightsBone, weightsNearest: G.weightsNearest, weightsSkirt: G.weightsSkirt, LAYER: G.LAYER || { sash: 5 }, okT: i => G.torsoOK(C, true)(C.name(i), C.pos(i).y) };
  for (const pc of pieces) {
    if (pc.p === 'trousers') parts.push(...G.trousers(C, pc));
    else if (pc.p === 'regalia') { // round 2: the girdle and the stole seat on the measured envelope of the shells and skirts under them (not on the loft), so none floats
      const env = buildEnv(C, L, G, parts), AHr = { ...AH, loftAt: (L2, th, y) => { const s0 = G.loftAt(L2, th, y), e = env(th, y); return e > s0.r ? { ...s0, r: e } : s0; } };
      parts.push(...(C.male ? ACC.girdle(C, pc, L, AHr) : ACC.stole(C, { ...pc, over: 0, under: pieces.some(q => q.p === 'outer') }, L, AHr))); C.env = env; }
    else if (pc.p === 'shoes') parts.push(...G.feet(C, pc, 'shoes', 0.007, 0.03));
    else if (pc.p === 'boots') { parts.push(...G.feet(C, pc, 'boots', 0.011, 0.06)); parts.push(...G.shin(C, pc, 'boots', yHem < 0.15 * C.S ? 0.72 : (pc.shaft ?? 0.42), 0.02, null)); }
    else if (pc.p === 'robe') parts.push(...robeParts);
    else if (pc.p === 'sash') parts.push(...G.sash(C, pc, L));
    else if (pc.p === 'whisk') parts.push(...G.whisk(C, pc, L));
    else if (pc.p === 'props') parts.push(...G.props(C, pc, L));
    else if (pc.p === 'legwraps') { const bc = G.col(pc.band), c0 = G.col(pc.color); parts.push(...G.shin(C, pc, 'legwraps', 0.12, 0.024, (r, kk) => (Math.sin(Math.PI * 2 * (r.s / (0.05 * C.k) + 1.5 * kk / 40)) > 0.55 ? bc : c0))); }
    else if (pc.p === 'outer') parts.push(...openShell(C, reg, rp, pc, sh, G, 'outer'));
    else if (pc.p === 'cape') parts.push(...openShell(C, reg, rp, pc, sh, G, 'cape'));
    else if (pc.p === 'hair') hairPc = pc; // shells round 2: the hair goes on last, over the clothes it lies on
    else throw new Error('piece ' + pc.p);
  }
  if (hairPc) { const fem = !C.male, styles = (fem || hairPc.long) && hairPc.style !== 'braid' ? [hairPc.style, 'long'] : [hairPc.style], backAt = hairBack(C, parts);
    C.hairW = hairWeights(C); hairPc = { ...hairPc, envAt: C.env || null }; // round 2: the man's beard lies on the envelope of the robe
    for (const st of styles) parts.push(...G.hair(C, st, reg.hairColor, backAt, hairPc));
    C.hairW = null;
    if (C.male && C.reg && hairPc.crown === 'elder' && hairPc.beard !== false) parts.push(...elderBeard(C, parts, G, reg.hairColor));
    hairPaint(C, parts); } // round 4 fix 3: strands and sheen painted on the hair
  return parts;
}

// ---------- shells round 2: the hair lies on the clothes (his B on cult-shells-look-1: "Hair needs to be fixed. Collision
// with the clothes"). Round 1 hung the hair 2 cm off the skirt's loft, which is not the shell: at the nape it passed
// through the collar and at the shoulders it stood off the back. Now the hair's line down the back is the outermost
// envelope of what it lies on (the head and neck skin, the robe shell with its collar, the sash), taken across the hair's
// own width and spanned taut over every hollow (the lower convex hull in depth), so a strand can never dip into the cloth;
// it lies 4 mm off that envelope. Below the neck it is skinned with the body's own weights there, as the shell is, so it
// moves with the back it lies on at every pose (round 1: the whole strand on one spine bone).
const HAIR_HALF_W = 0.07, HAIR_DEPTH = 0.017, HAIR_CLEAR = 0.004;
// ---------- elder regalia round 3: the Elder's beard, a separate hair pass (his B on er-regalia-look-2: "the beard looks horrible. That
// needs to have a separate hair pass and needs to be on bones so that it flows"). Round 2 drew it as one grey slab. Now it is locks:
// a fan of tapered flat strands (a ribbon each) that start along the jaw, converge and hang 14 to 22 cm onto the chest, their ends
// making a soft point, with a moustache of two swept locks. Each lock lies 8 mm off whatever it hangs on (the face, then the robe's
// measured envelope), its top skinned to the head and its end to the body's own weights (neck and chest), so it lies on the chest
// when the head bows. The part is named `beard`: sect/cult/motion.js's chain tool (CHAINS.beard, make/chains.js) hangs it on
// bone nodes down its length, so it swings from the jaw and lags the head. Design default; hair.beard = false drops it.
function elderBeard(C, parts, G, hairColor) {
  const k = C.k, f = C.f, l = C.l, H = wp(C.F.bones.head), hf = H.dot(f), hl = H.dot(l), p = V(), hash = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  let chinY = 1e9; for (const i of C.uniq) { if (C.name(i) !== 'head') continue; const q = C.pos(i); if (q.dot(f) - hf > 0.02 * k && q.y < chinY) chinY = q.y; }
  const cells = new Map(), cell = (y, la) => Math.round(y / (0.006 * k)) + ',' + Math.round((la - hl) / (0.006 * k));
  for (const i of C.uniq) { if (C.name(i) !== 'head') continue; const q = C.pos(i), key = cell(q.y, q.dot(l)), v = q.dot(f); if (!(cells.get(key) > v)) cells.set(key, v); }
  const headFront = (y, la) => { let m = -1e9; for (let dy = -1; dy <= 1; dy++) for (let dl = -1; dl <= 1; dl++) { const v = cells.get(Math.round(y / (0.006 * k)) + dy + ',' + (Math.round((la - hl) / (0.006 * k)) + dl)); if (v !== undefined && v > m) m = v; } return m; };
  const bodyFront = y => { let m = -1e9; for (const pt of parts) { if (!/^(robe|outer|cape|underwrap|sash)/.test(pt.name)) continue; const W = pt.world; for (let i = 0; i < W.length; i += 3) { if (Math.abs(W[i + 1] - y) > 0.012 * k) continue; p.set(W[i], W[i + 1], W[i + 2]); if (Math.abs(p.dot(l) - hl) < 0.05 * k) m = Math.max(m, p.dot(f)); } } for (const i of C.uniq) { const n = C.name(i); if (n !== 'neck' && !TORSO.includes(n)) continue; const q = C.pos(i); if (Math.abs(q.y - y) < 0.012 * k && Math.abs(q.dot(l) - hl) < 0.05 * k) m = Math.max(m, q.dot(f)); } return m; };
  const bf = new Map(); const bodyAt = y => { const kk = Math.round(y / (0.004 * k)); if (!bf.has(kk)) bf.set(kk, bodyFront(kk * 0.004 * k)); return bf.get(kk); };
  // a lock: centreline from (lat0, yA) down length L; lat(u) and the lie on the surface are worked per row
  const locks = [], nI = 15;
  for (let i = 0; i < nI; i++) { const s = (i / (nI - 1)) * 2 - 1, a = Math.abs(s), r = hash(i + 1);
    locks.push({ lat0: s * 0.066 * k, conv: 0.68 + 0.1 * r, yA: chinY + (0.034 + 0.045 * Math.pow(a, 1.6)) * k, L: (0.205 * (1 - 0.5 * Math.pow(a, 1.4)) + 0.02 * (r - 0.5)) * k, w: 0.0125 * k, ph: r * 6.28, off: (i % 2) * 0.0025 * k, bend: (r - 0.5) * 0.012 * k }); }
  const yM = chinY + 0.062 * k;
  for (const sg of [-1, 1]) locks.push({ mous: true, sg, lat0: sg * 0.006 * k, yA: yM, L: 0.07 * k, w: 0.015 * k, ph: sg, off: 0.004 * k });
  const nR = 18, nT = 6, P = [], I = [], lockOf = [], uOf = [];
  for (const L of locks) { const base = P.length / 3, row = [];
    for (let r = 0; r <= nR; r++) { const u = r / nR; let y, lat, w, th;
      if (L.mous) { lat = hl + L.sg * (0.004 + 0.034 * Math.pow(u, 0.9)) * k; y = L.yA - 0.022 * k * Math.pow(u, 1.4); w = L.w * (1 - 0.45 * Math.pow(u, 1.5)); th = 0.0065 * k; }
      else { y = L.yA - u * L.L; lat = hl + L.lat0 * (1 - L.conv * Math.pow(u, 0.8)) + L.bend * Math.sin(Math.PI * u + L.ph); w = L.w * (1 - Math.pow(u, 2.2)) * (0.35 + 0.65 * sstep(0, 0.18, u)) + 0.0008 * k; th = 0.0055 * k * (1 - 0.5 * u) * (0.5 + 0.5 * sstep(0, 0.18, u)); }
      const hF = headFront(Math.max(y, chinY + 0.004 * k), lat), bF = y < chinY + 0.02 * k ? bodyAt(y) : -1e9;
      row.push({ y, lat, w, th, b0: Math.max(hF > -1e8 ? hF : hf + 0.07 * k, bF) + (L.mous ? 0.006 : 0.009) * k + L.off * (L.mous ? 1 : sstep(0.1, 0.4, u)) + 0.004 * k * Math.sin(L.ph + 5 * u) * sstep(0, 0.3, u) }); }
    // the surface under a lock is read in 6 mm cells; a lock is a smooth curve, so its distance out is blurred along its length
    // and then held to no more than 1.5 mm inside the surface (a hair never sinks into the face)
    let sm = row.map(q => q.b0); for (let it = 0; it < 3; it++) sm = sm.map((v, i) => (sm[Math.max(0, i - 1)] + v * 2 + sm[Math.min(nR, i + 1)]) / 4);
    let prev = -1e9; row.forEach((q, r) => { const front = Math.max(sm[r], q.b0 - 0.0015 * k, prev - 0.0035 * k); prev = front; q.front = front; });
    for (const q of row) for (let t = 0; t < nT; t++) { const a = t / nT * Math.PI * 2; P.push(...V().addScaledVector(f, q.front - q.th + q.th * Math.sin(a)).addScaledVector(l, q.lat + q.w * Math.cos(a) * 0.5).add(V(0, q.y, 0)).toArray()); lockOf.push(L); uOf.push(q.y === row[0].y ? 0 : (row.indexOf(q) / nR)); }
    for (let r = 0; r < nR; r++) for (let t = 0; t < nT; t++) { const a = base + r * nT + t, b = base + r * nT + (t + 1) % nT, c = a + nT, d = b + nT; I.push(a, c, b, b, c, d); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
  const n = P.length / 3, c0 = new THREE.Color('#b9b6ae'), Cc = []; for (let i = 0; i < n; i++) { const sh = 0.9 + 0.12 * hash(Math.floor(i / nT / (nR + 1)) * 7.3); Cc.push(c0.r * sh, c0.g * sh, c0.b * sh); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.userData.edge = new Float32Array(n).fill(1);
  // weights: the top on the head, the end on the body's own weights (the neck and the chest it lies on); the moustache all head
  const SI = C.F.mesh.geometry.attributes.skinIndex, SW = C.F.mesh.geometry.attributes.skinWeight, okB = i => { const nm = C.name(i); return nm === 'neck' || TORSO.includes(nm); }, hb = C.bn.indexOf('head');
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const L = lockOf[i], s = L.mous ? 0 : sstep(0.3, 0.85, uOf[i]); si[i * 4] = hb; sw[i * 4] = 1 - s; if (s <= 0) continue;
    const bi = C.nearest(p.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]), okB); let tot = 0; for (let j = 0; j < 3; j++) { const q = SW.getComponent(bi, j); si[i * 4 + 1 + j] = SI.getComponent(bi, j); sw[i * 4 + 1 + j] = q; tot += q; } for (let j = 1; j < 4; j++) sw[i * 4 + j] = tot > 0 ? sw[i * 4 + j] / tot * s : 0; if (!(tot > 0)) sw[i * 4] = 1; }
  const part = G.skinned(C, g, { si, sw }, '#b9b6ae', 'beard', 7); part.noDrag = false; return [part];
}
function hairBack(C, parts) {
  const k = C.k, H = wp(C.F.bones.head), bmid = C.ab(H)[1], aAxis = C.ab(wp(C.F.bones.spine03))[0], hw = HAIR_HALF_W * k, dy = 0.005 * k;
  const y0 = C.yWaist - 0.04 * k, y1 = C.crown + 0.01 * k, nb = Math.ceil((y1 - y0) / dy), amin = new Float32Array(nb + 1).fill(9), p = V();
  const take = (x, y, z) => { p.set(x, y, z); const [a, b] = C.ab(p); if (a > aAxis || Math.abs(b - bmid) > hw || y < y0 || y > y1) return; const i = Math.round((y - y0) / dy); if (a < amin[i]) amin[i] = a; };
  for (const pt of parts) { if (/^hair/.test(pt.name)) continue; const W = pt.world; for (let i = 0; i < W.length; i += 3) take(W[i], W[i + 1], W[i + 2]); }
  for (const i of C.uniq) { const n = C.name(i); if (n !== 'neck' && n !== 'head' && !TORSO.includes(n)) continue; const q = C.pos(i); take(q.x, q.y, q.z); }
  // below the shoulder blades the hair lies on the back: the envelope widened by a 4 cm min filter and then averaged
  // over 4 cm, which can only sit at or behind the cloth (each averaged value is at or behind the point itself)
  for (let i = 0; i <= nb; i++) if (amin[i] >= 9) { let j = 1; while (j < nb && (amin[i - j] ?? 9) >= 9 && (amin[i + j] ?? 9) >= 9) j++; amin[i] = Math.min(amin[i - j] ?? 9, amin[i + j] ?? 9); }
  const w = Math.round(0.04 * k / dy), lo = new Float32Array(nb + 1), sm = new Float32Array(nb + 1);
  for (let i = 0; i <= nb; i++) { let m = 9; for (let j = Math.max(0, i - w); j <= Math.min(nb, i + w); j++) m = Math.min(m, amin[j]); lo[i] = m; }
  for (let i = 0; i <= nb; i++) { let t = 0, c = 0; for (let j = Math.max(0, i - w); j <= Math.min(nb, i + w); j++) { t += lo[j]; c++; } sm[i] = t / c; }
  // the blades: the backmost point between 30 and 5 cm under the neck base. From there up to the crown the hair hangs
  // taut (the lower convex hull of (y, a), straight over the nape and the collar); below it, it lies on the back
  let iB = 0, aB = 9; for (let i = 0; i <= nb; i++) { const y = y0 + i * dy; if (y > C.yNeck - 0.3 * k && y < C.yNeck - 0.05 * k && amin[i] < aB) { aB = amin[i]; iB = i; } }
  const pts = []; for (let i = iB; i <= nb; i++) if (amin[i] < 9) pts.push([y0 + i * dy, amin[i]]);
  const hull = []; const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (const q of pts) { while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], q) <= 0) hull.pop(); hull.push(q); }
  const off = (HAIR_DEPTH + HAIR_CLEAR) * k;
  return yy => { if (yy < hull[0][0]) { const i = Math.max(0, Math.min(nb, Math.round((yy - y0) / dy))); return [Math.min(sm[i], aB) - off, bmid]; } for (let i = 1; i < hull.length; i++) if (yy <= hull[i][0]) { const [ya, aa] = hull[i - 1], [yb, ab] = hull[i]; return [aa + (ab - aa) * (yy - ya) / (yb - ya) - off, bmid]; } return [hull[hull.length - 1][1] - off, bmid]; };
}
function hairWeights(C) {
  const ok = i => { const n = C.name(i); return n === 'neck' || TORSO.includes(n); }, SI = C.F.mesh.geometry.attributes.skinIndex, SW = C.F.mesh.geometry.attributes.skinWeight, p = V();
  return (g, bone) => { const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), b0 = C.bn.indexOf(bone);
    for (let i = 0; i < n; i++) { if (bone === 'head') { si[i * 4] = b0; sw[i * 4] = 1; continue; } const b = C.nearest(p.fromBufferAttribute(g.attributes.position, i), ok); for (let j = 0; j < 4; j++) { si[i * 4 + j] = SI.getComponent(b, j); sw[i * 4 + j] = SW.getComponent(b, j); } }
    return { si, sw }; };
}

// ---------- round 5 (his A on cult-shells-look-7, "use this everywhere"): the open pieces on the same method
// outer  A1's white gauze outer: a second body shell further off the skin, open down the front (its V crosses far
//        below the waist, so the two front edges run nearly parallel), wide sleeves as rigid bells on the forearm, and
//        a skirt ring from the waist to the hem clipped open at the front on the same line. Bands painted on every edge.
// cape   B1's half cape: the same shell cut across the chest and back at the drop and round the upper arm, open at the
//        front; it rides the shoulders and lifts with the arms, rigid, with its trim painted on the cut edge.
// round 2: the envelope of the shells and skirts already built (the torso of each shell, not its sleeves): per 2 cm slice and
// 5 degrees round the loft's centre, the outermost radius at the fit pose. env(th, y) is that radius, or 0 where nothing is there.
function buildEnv(C, L, G, parts) {
  const k = C.k, NB = 72, dY = 0.02 * k, pp = V(), slices = new Map(), names = new Set(['robe-shell', 'robe', 'outer-shell', 'outer', 'cape-shell']);
  for (const pt of parts) { if (!names.has(pt.name)) continue; const lap = /-shell$/.test(pt.name) ? pt.geo.attributes.aLap.array : null;
    for (let i = 0; i < pt.world.length; i += 3) { if (lap && lap[i / 3] < 0.5) continue; pp.fromArray(pt.world, i); const [a, b] = C.ab(pp), c = G.loftAt(L, 0, pp.y).c, th = Math.atan2(b - c[1], a - c[0]), r = Math.hypot(a - c[0], b - c[1]),
        yi = Math.round(pp.y / dY), bi = ((Math.round(th / (Math.PI * 2) * NB) % NB) + NB) % NB; let R = slices.get(yi); if (!R) slices.set(yi, R = new Float32Array(NB)); R[bi] = Math.max(R[bi], r); } }
  for (const R of slices.values()) { for (let pass = 0; pass < 4; pass++) for (let b = 0; b < NB; b++) if (!R[b]) R[b] = Math.max(R[(b + 1) % NB], R[(b + NB - 1) % NB]); const T = Float32Array.from(R); for (let b = 0; b < NB; b++) R[b] = Math.max(T[b], (T[(b + NB - 1) % NB] + 2 * T[b] + T[(b + 1) % NB]) / 4); }
  return (th, y) => { const f = y / dY, y0 = Math.floor(f), t = f - y0, A = slices.get(y0), B2 = slices.get(y0 + 1); if (!A && !B2) return 0; const q = ((th / (Math.PI * 2) * NB) % NB + NB) % NB, b0 = Math.floor(q) % NB, b1 = (b0 + 1) % NB, u = q - Math.floor(q);
    const at = R => (R ? R[b0] + (R[b1] - R[b0]) * u : 0), a = at(A), b = at(B2); return a && b ? a * (1 - t) + b * t : a || b; };
}

// the skirt's top ring seats on the shell it hangs from: per angle the shell's outermost radius in 2 cm slices from the cut up to
// yTop, the skirt widening to it below the cut and closing in on it above (round 7), so the two read as one garment and no seam opens
function makeHug(C, Lc, P0, yCut, yTop, lapA) {
  const k = C.k, NB = 72, dY = 0.02 * k, NY = Math.ceil((yTop - yCut) / dY) + 2, pp = V(), hcW = Lc.hc;
    const angR = p => { const d = p.clone().sub(hcW), x = d.dot(C.l), z = d.dot(C.f); return [Math.atan2(x, z), Math.hypot(x, z), x, z]; };
    // the shell's outermost radius per angle, in 2 cm slices from the cut up to the skirt's top (the bust and the flat
    // front stand further out higher up, so one ring taken at the cut let the skirt's front corners stand off the shell)
    const shY = []; for (let yi = 0; yi < NY; yi++) { const y0 = yCut + (yi - 0.5) * dY, R = new Float32Array(NB);
      for (let i = 0; i < P0.length; i += 3) { if (lapA && lapA[i / 3] < 0.5) continue; pp.fromArray(P0, i); if (pp.y < y0 - 0.012 * k || pp.y > y0 + dY + 0.012 * k) continue; const [a, r] = angR(pp), b = ((Math.round(a / (Math.PI * 2) * NB) % NB) + NB) % NB; R[b] = Math.max(R[b], r); }
      for (let pass = 0; pass < 4; pass++) for (let b = 0; b < NB; b++) if (!R[b]) R[b] = Math.max(R[(b + 1) % NB], R[(b + NB - 1) % NB]);
      shY.push(R.map((_, b) => Math.max(R[b], (R[(b + NB - 1) % NB] + 2 * R[b] + R[(b + 1) % NB]) / 4))); }
    const hug = p => { const [a, r, x, z] = angR(p), f = ((a / (Math.PI * 2) * NB) % NB + NB) % NB, b0 = Math.floor(f) % NB, b1 = (b0 + 1) % NB, yf = THREE.MathUtils.clamp((p.y - yCut) / dY, 0, NY - 1), y0 = Math.floor(yf), y1 = Math.min(NY - 1, y0 + 1), ty = yf - y0;
      const at = S => S[b0] + (S[b1] - S[b0]) * (f - Math.floor(f)), hr = at(shY[y0]) * (1 - ty) + at(shY[y1]) * ty + 0.004 * k;
      if (!(hr > 0.01 * k)) return; const w = hr > r ? sstep(yCut - 0.1 * k, yCut, p.y) : sstep(yCut, yTop, p.y), nr = r + (hr - r) * w, s2 = nr / r; p.copy(hcW.clone().addScaledVector(C.l, x * s2).addScaledVector(C.f, z * s2).setY(p.y)); };
  return hug;
}

function openShell(C, reg, rp, pc, sh0, G, kind) {
  const k = C.k, outer = kind === 'outer', ease = outer ? (pc.ease ?? 0.034) : (pc.shellEase ?? 0.028), gap = ((pc.open ?? (outer ? 11 : 9)) / 100) / 2;
  // elder regalia round 2: with a regalia piece the upper layer is one shell with the robe's: its ease is the robe's plus a lift
  // (over-robe 4 mm, mantle 6 mm), its arm the robe's plus 4 mm (no more 1.2 times), and it is held that far off the robe's
  // own surface (sh.base), so no void opens at any edge. The skin-to-robe ease is what sets how it sits, not a fresh 34 mm.
  const one = !!C.robeBase, lift = pc.lift ?? (outer ? 0.004 : 0.006), easeUp = ease, ease1 = one ? (sh0.ease ?? 0.012) + lift : ease;
  const sh = { ...sh0, ...(pc.shell || {}), ease: ease1, armEase0: one ? (sh0.armEase0 ?? 0.01) + lift : ease * 0.9, armEase1: one ? (sh0.armEase1 ?? 0.02) + 0.004 : ease * (outer ? 1.2 : 0.9), sag: one ? (sh0.sag ?? 0.012) : outer ? 0.006 : 0,
    base: one ? C.robeBase : null, lift: one ? lift : 0,
    waistDrop: outer ? -0.067 : 0, smooth: outer ? 320 : 60, taubin: outer, minEase: one ? (sh0.minEase ?? 0.009) + lift : ease * (outer ? 0.6 : 0.7), neckW: gap / k + 0.012, vTop: 0.03, cross: 3, crossBelowApex: 3, crossX: 0, collarR: (sh0.collarR ?? (C.male ? 0.068 : 0.075)) + 0.012 };
  if (outer) { sh.bell = pc.sleeve === 'wide' || pc.sleeve === 'widest'; if (C.reg && C.cut === 'm') sh.square = sh.bell; sh.cuff = sh.bell ? 0.15 : 0.96; sh.bellR = pc.bellR ?? 0.16; sh.bellPast = pc.bellPast ?? 0.1; sh.hang = sh.square ? 0.3 : 0.8; sh.slant = 0.06; sh.bellUp = 0.05; if (sh.square) { sh.bellR = pc.bellR ?? 0.135; sh.bellPast = pc.bellPast ?? 0.07; } sh.drapeN = pc.drapeN; sh.drapeA = pc.drapeA; sh.drapeLen = pc.drapeLen; sh.gravity = !!pc.gravity; }
  else { sh.yCut = C.ySh - (pc.drop ?? 0.24) * k; sh.capArm = pc.capArm ?? 0.45; sh.cuff = 2; sh.capeBack = pc.capeBack ?? 0.14; sh.capeFront = pc.capeFront ?? 0.05; sh.capeHalfW = pc.capeHalfW ?? 0.2; sh.capSlant = pc.capSlant ?? 0.2; } // round 6: capSlant drops the cape further down the outside of the arm than the inside, so it curves over the shoulder
  const wrap = C.wrap, Lc0 = C.Lc, vSym = C.vSym; C.wrap = null; // the V measure stays the robe's
  const p2 = { ...pc, lining: pc.lining || (outer ? pc.color : undefined), collarColor: pc.band || pc.trim || pc.color, collarW: pc.collarW ?? 0.03, trim: pc.band || pc.trim || pc.color, hemBand: pc.hemBand ?? 0.03 };
  const { g, W, Lc } = bodyShell(C, p2, sh); C.Lc = Lc; const out = [];
  const pt = G.skinned(C, g, W, pc.color, kind + '-shell', outer ? 5.5 : 6); paint(pt, p2, sh.bell ? { ...sh, cuffW: 0 } : { ...sh, cuffW: outer ? undefined : (pc.trimW ?? 0.03) }, 'shell', C); /* round 4: the upper layers pass 50 mm (was 34), so the navy robe shell beneath cannot come through the raised armpit */ armpitFix(C, pt, 0.05); out.push(pt);
  if (outer) {
    const yHem = Math.max(0.034 * k, (pc.hem ?? 0.035) * C.S), sk = sh0.skirtEase ?? 0.028;
    const L = G.loft(C, { yTop: C.yNeck + 0.02 * k, yHem, regionAt: G.torsoOK(C, true), ease: Math.max(sk + 0.012, easeUp + 0.004), flare: pc.flare || 0, folds: 0, cinch: null, topEase: 0.012, yoke: 0.03, tcut: true });
    // round 7 (his marks on cult-shells-look-9: a hard horizontal seam at the waist, and from above the sash showed in
    // the gap at the back): the skirt's top hugs the shell it laps over, 4 mm outside it, and widens to its own loft by
    // 10 cm under the shell's cut (where the skirt stands further out than the shell, as over the sash at the back, it
    // closes in on the shell only above the cut, so it never passes through the sash), so the outer reads as one garment and no gap opens between the two pieces
    const yCut = C.yWaist - (0.022 + sh.waistDrop) * k, yTop = C.yWaist + 0.14 * k, hug = makeHug(C, Lc, pt.world, yCut, yTop, pt.geo.attributes.aLap.array);
    const S = skirt(C, p2, { ...sh, thigh: sh0.thigh, skirtTop: 0.14, hug }, L, Lc, G), half = lapX(Lc, C.yWaist), hc = Lc.hc;
    const og = openFront(C, S, hc, y => lapX(Lc, Math.max(y, Lc.yc + 0.01)), yHem);
    const ps = G.skinned(C, og.g, og.W, pc.color, kind, 5.5); paint(ps, p2, sh, 'skirt', C); if (C.reg) ACC.tagDrape(ps, 'waist', C.yWaist); out.push(ps); void half;
    if (sh.bell) for (const s of ['L', 'R']) { const b = bell(C, p2, { ...sh, sleeveOf: pt.world }, s); const pb = G.skinned(C, b.g, b.W, pc.color, kind + '-bell' + s, 5.5); paint(pb, p2, sh, 'bell', C); bellFall(C, pb, b.B, s, !!sh.gravity); if (C.reg) ACC.tagDrape(pb, 'elbow' + s, 0); out.push(pb); }
    if (sh.bell && sh.underSleeve) out.push(...underSleeves(C, G, p2, sh));
  }
  C.wrap = wrap; C.Lc = Lc0; C.vSym = vSym; return out;
}
// the outer's skirt ring, clipped open at the front on its edge line; the edge distance (aEdgeC) paints the front band
function openFront(C, S, hc, xEdge, yHem) {
  const g0 = S.g, P = g0.attributes.position, N = g0.attributes.normal, verts = [];
  for (let i = 0; i < P.count; i++) verts.push({ p: V().fromBufferAttribute(P, i), n: V().fromBufferAttribute(N, i), si: [0, 1, 2, 3].map(j => S.W.si[i * 4 + j]), sw: [0, 1, 2, 3].map(j => S.W.sw[i * 4 + j]), arm: null, src: i });
  const field = v => { const q = frontXY(C, v.p, hc); return q.z < 0 ? BIG : Math.abs(q.x) - xEdge(q.y); };
  const M = clip({ verts, tris: Array.from(g0.index.array) }, field), n = M.verts.length;
  const Pp = new Float32Array(n * 3), Cc = new Float32Array(n * 3), E = new Float32Array(n), eC = new Float32Array(n), lap = new Float32Array(n).fill(BIG), rest = new Float32Array(n * 3), seam = new Float32Array(n).fill(-1), c0 = V().fromBufferAttribute(g0.attributes.color, 0);
  M.verts.forEach((v, i) => { const q = frontXY(C, v.p, hc); Pp.set(v.p.toArray(), i * 3); Cc.set([c0.x, c0.y, c0.z], i * 3); E[i] = v.p.y - yHem; eC[i] = Math.min(BIG, Math.max(0, field(v))); rest.set([q.x, q.y, q.z], i * 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setIndex(M.tris); g.computeVertexNormals();
  g.setAttribute('aEdgeH', new THREE.BufferAttribute(E, 1)); g.setAttribute('aEdgeC', new THREE.BufferAttribute(eC, 1)); g.setAttribute('aLap', new THREE.BufferAttribute(lap, 1)); g.setAttribute('aRest', new THREE.BufferAttribute(rest, 3)); g.setAttribute('aSeam', new THREE.BufferAttribute(seam, 1));
  g.userData.edge = Float32Array.from(M.verts.map((v, i) => Math.min(E[i], eC[i])));
  const W = { si: new Uint16Array(n * 4), sw: new Float32Array(n * 4) }; M.verts.forEach((v, i) => { for (let j = 0; j < 4; j++) { W.si[i * 4 + j] = v.si[j]; W.sw[i * 4 + j] = v.sw[j]; } });
  return { g, W };
}

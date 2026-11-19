// Shells round (2026-11-02): what used to be modelled is painted. One material per shell piece reads five per-vertex
// fields written at the fit pose (shells.js) and paints, in the fragment shader:
//   collar band   aEdgeC < collarW: the collar colour, with a stitch line inside its edge (the V, the back neck, the
//                 lapped panel's edge from the crossing down to the hem)
//   hem and cuff  aEdgeH < hemW: the band colour; a cloud edge scallops its top (direction C)
//   lap shadow    a soft shadow on the under panel just above the lapped edge (aLap just below 0)
//   seams         the shoulder seam (aSeam = 0) and the side seams, thin darker lines
//   folds         skirt: soft columns from the sash gathers to the hem, deeper toward the hem; torso: drag lines from
//                 the bust to the sash; sleeve: creases at the inside of the elbow; bell: long folds down the sleeve
// The fields move with the skin, so the paint stretches with the mesh at the joints as his ruling asks.
import * as THREE from 'three';
const KIND = { shell: 0, skirt: 1, bell: 2 };
// shells round 4: the cross collar per fragment, from the rest position r (x toward the wearer's left, y up, z forward).
// The over edge runs from the left neck to the crossing and on as the lapped edge (lapX in shells.js); the under edge from
// the right neck to the crossing, and on under the over panel. collarField returns (band distance, shadow distance):
// x, the distance into the cloth from the nearest visible edge (0 at the edge), 9 where no edge is near; y, the
// distance on the under panel from the lapped edge (positive below and to the right of it), for the lap's shadow.
const GLSL_COLLAR = `
float fC(float t) { t = max(0.0, t); if (uP >= 0.999) return t; return (pow(t + uE, uP) - pow(uE, uP)) / (pow(1.0 + uE, uP) - pow(uE, uP)); }
float dC(float t) { t = max(0.0, t); if (uP >= 0.999) return 1.0; return uP * pow(t + uE, uP - 1.0) / (pow(1.0 + uE, uP) - pow(uE, uP)); }
float lapXf(float y) { if (y >= uYC) return uXC + (uWN - uXC) * fC((y - uYC) / (uYN - uYC));
  float d = uYC - y; return uXC - (uS0 * d + (uS1 - uS0) * (d < uB ? d * d / (2.0 * uB) : d - uB / 2.0)); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); return length(p - a - ab * h); }
// distance to each edge as a polyline (the curve bends hard near the crossing, so a distance across at the point's own
// height thins the band where the edge runs flat): samples dense near the crossing (t = u^2)
vec2 collarField(vec3 r) {
  vec2 p = r.xy; float H = uYN - uYC, t = (r.y - uYC) / H;
  float xo = lapXf(r.y), xu = uXC + (-uWN - uXC) * fC(t);
  float dO = 9.0, dU = 9.0; vec2 po = vec2(uXC, uYC), pu = po;
  for (int i = 1; i <= 24; i++) { float u = float(i) / 24.0, tt = u * u * 1.15, y = uYC + tt * H, f = fC(tt);
    vec2 qo = vec2(uXC + (uWN - uXC) * f, y), qu = vec2(uXC + (-uWN - uXC) * f, y); dO = min(dO, segD(p, po, qo)); dU = min(dU, segD(p, pu, qu)); po = qo; pu = qu; }
  po = vec2(uXC, uYC);
  for (int i = 1; i <= 24; i++) { float d = float(i) / 24.0; d = d * d * (uYC - uTop + 0.05 * uK); vec2 q = vec2(lapXf(uYC - d), uYC - d); dO = min(dO, segD(p, po, q)); po = q; }
  bool over = r.x > xo, under = !over && (t < 0.0 || r.x < xu);
  float band = over ? dO : (under ? dU : 9.0); // the under edge shows only where the over panel is not
  return vec2(band, (!over && t < 0.0) ? dO : -1.0);
}
`;
// round 2: the weave and the band motif. weave(p, m) returns (figure, grain): p in pattern repeats, m in metres.
// The figure is a half-drop grid of roundels: a ring, and inside it Heaven's stepped brick stacked as a small stair, so
// the body cloth carries the same mark as the bands. The grain is a 2/2 twill, diagonal, fading out where it would alias.
// brick(q) paints the band: q.x 0..1 across the band (0 at its outer edge), q.y along it in band widths. Two rows of
// brick, the second offset by half a brick, in metal thread with dark mortar lines; a fine border line at each side.
const GLSL_WEAVE = `
float boxD(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
vec2 weave(vec2 p, vec2 m) {
  vec2 cell = vec2(1.0, 1.0); float col = floor(p.x / cell.x); vec2 q = p; q.y += 0.5 * mod(col, 2.0);
  vec2 f = fract(q / cell) - 0.5; float r = length(f), fw = max(fwidth(r), 1e-4);
  float ring = 1.0 - smoothstep(0.018, 0.018 + fw * 1.5, abs(r - 0.36));
  // the stair: three bricks stepping up, centred in the roundel
  float st = 9.0; for (int i = 0; i < 3; i++) { float fi = float(i); st = min(st, boxD(f - vec2(-0.14 + 0.14 * fi, -0.12 + 0.12 * fi), vec2(0.11, 0.045))); }
  float stair = 1.0 - smoothstep(0.0, fw * 1.5, st);
  float fig = max(ring, stair);
  float tp = 0.0025, t = (m.x + m.y) / tp, tw = fwidth(t); float grain = (0.5 + 0.5 * sin(t * 6.2832)) * (1.0 - smoothstep(0.25, 0.6, tw));
  return vec2(fig, grain - 0.5);
}
float brick(vec2 q) {
  if (q.x < 0.0 || q.x > 1.0) return 0.0;
  float aw = max(fwidth(q.x), 1e-4);
  float border = max(1.0 - smoothstep(0.0, aw * 1.5, abs(q.x - 0.12)), 1.0 - smoothstep(0.0, aw * 1.5, abs(q.x - 0.88)));
  if (q.x < 0.2 || q.x > 0.8) return border;
  float row = q.x < 0.5 ? 0.0 : 1.0, y = q.y / 0.9 + 0.5 * row, fy = fract(y), fx = fract((q.x - 0.2) / 0.3);
  float mort = min(min(fy, 1.0 - fy) * 0.9 / 0.3, min(fx, 1.0 - fx)); float mw = max(fwidth(y) * 0.9 / 0.3, aw / 0.3) * 1.5;
  return smoothstep(0.06, 0.06 + mw, mort) * (0.85 + 0.15 * fx);
}
`;
// round 3: the fold map, loaded once; until it arrives a flat normal stands in
let FOLD = null;
function foldMap() {
  if (FOLD) return FOLD;
  const flat = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1); flat.needsUpdate = true; FOLD = flat;
  new THREE.TextureLoader().load(new URL('./folds-normal.png', import.meta.url).href, t => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true; FOLD = t; for (const m of FOLD_USERS) m.value = t; });
  return flat;
}
const FOLD_USERS = [];
// the torso weight of a shell: the share of each vertex's skin weight on the trunk bones, so the arms stay flat
function torsoWeight(g, C) {
  const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, n = g.attributes.position.count, T = new Set(['spine01', 'spine', 'spine03', 'hips'].map(b => C.bn.indexOf(b)).filter(i => i >= 0)), out = new Float32Array(n);
  if (!SI) return out.fill(1);
  for (let i = 0; i < n; i++) { let w = 0; for (let j = 0; j < 4; j++) if (T.has(SI.getComponent(i, j))) w += SW.getComponent(i, j); out[i] = Math.min(1, Math.max(0, (w - 0.35) / 0.4)); }
  return out;
}
export function paint(pt, rp, sh, kind, C) {
  const k = C.k, col = h => new THREE.Color(h || '#000');
  const U = {
    uKind: { value: KIND[kind] }, uK: { value: k },
    uCollarC: { value: col(rp.collarColor || rp.trim) }, uCollarW: { value: (rp.collarW ?? 0.035) * k },
    uHemC: { value: col(rp.band || rp.trim) }, uHemW: { value: (kind === 'skirt' ? (rp.hemBand ?? 0.03) : (kind === 'shell' && rp.bracer ? 0 : sh.cuffW ?? (kind === 'bell' ? 0.03 : 0.028))) * k }, // round 6: a bracer's own edge band stands at its cuff
    uCloud: { value: kind === 'skirt' ? (rp.cloud ? rp.cloud.rise : 0) : kind === 'bell' ? 0 : 0 } /* shells round 4 fix 4: the bell's mouth keeps one even band; the cloud lobes read as a torn, spiked edge on the slanted mouth */,
    uCloudN: { value: kind === 'skirt' ? (rp.cloud ? rp.cloud.n * 2 : 0) : (rp.cloudCuff ? rp.cloudCuff.n * 2 : 0) },
    uFoldA: { value: sh.paintFold ?? 0.16 }, uFoldN: { value: rp.foldN || 14 }, uTop: { value: C.yWaist }, uHem: { value: Math.max(0.034 * k, rp.hem * C.S) },
    uApex: { value: C.yApex }, uElbow: { value: sh.elbowAt ?? 0.25 * k },
    // round 6: a painted bracer on the forearm (A2), its length from the shell, with an edge band at each end
    // elder robes round 2 (his steer 2026-11-18): a woven pattern on the body cloth and a motif in metal thread in the
    // collar, hem and cuff bands. rp.weave = { a: strength, s: repeat in metres, c: thread colour }; rp.motif = 'brick'
    // (Heaven's stepped brick, Calrunia's own) with rp.motifC its metal thread. Off unless a piece names them.
    uWeave: { value: rp.weave ? rp.weave.a ?? 0.5 : 0 }, uWeaveS: { value: (rp.weave ? rp.weave.s ?? 0.11 : 0.11) }, uWeaveC: { value: col(rp.weave ? rp.weave.c || rp.color : rp.color) },
    uMotif: { value: rp.motif === 'brick' ? 1 : 0 }, uMotifC: { value: col(rp.motifC || '#b8995a') },
    // elder regalia (his B on er-grammar-look-1, 2026-11-19: "marks of rank and station that can be observed from a
    // distance"): the rank square, painted on the chest and the back of the outermost garment. rp.rank = { c: the face's
    // colour, tri: the trigram's three lines bottom to top (1 whole, 0 broken), back: true on an open over-robe (its front
    // is split by the opening, so only the back carries it) }. Its place comes from the body (C.rankY, C.rankS), so it
    // sits between the collar's crossing and the waist on every body.
    uRank: { value: kind === 'shell' && rp.rank && C.rankS ? (rp.rank.back ? 2 : 1) : 0 }, uRankC: { value: col(rp.rank ? rp.rank.c : '#000') }, uRankY: { value: C.rankY || 0 }, uRankS: { value: C.rankS || 1 },
    uRankT: { value: new THREE.Vector3(...((rp.rank && rp.rank.tri) || [1, 1, 1])) },
    uBrW: { value: (kind === 'shell' && rp.bracer && pt.mesh.geometry.userData.bracerW) || 0 }, uBrC: { value: col(rp.bracer) }, uBrE: { value: col(rp.bracerBand || '#e6d9bd') }, uBrB: { value: (rp.bracerBandW ?? 0.011) * k },
  };
  // elder regalia round 3: the baked fold normal map (scripts/regalia/make_fold_normals.py) on the torso, where aFold (the
  // shell's torso skin weight, written below) is on
  const fm = foldMap(); Object.assign(U, { uFoldMap: { value: fm }, uFoldS: { value: sh.foldS ?? 3.0 }, uFy0: { value: C.yWaist }, uFy1: { value: (C.ySh ?? C.yNeck) + 0.03 * k }, uFoldOn: { value: kind === 'shell' && rp.folds !== false ? 1 : 0 } });
  if (kind === 'shell') FOLD_USERS.push(U.uFoldMap);
  if (kind === 'shell') pt.mesh.geometry.setAttribute('aFold', new THREE.Float32BufferAttribute(torsoWeight(pt.mesh.geometry, C), 1));
  // shells round 4: the cross collar's lines as uniforms, so the V band, the lapped edge and its shadow are measured per
  // fragment, perpendicular to each line (round 3 wrote them per vertex on big triangles: a notch, a ragged band)
  const Lc = C.Lc || { yN: 1, wN: 0, yc: 0, xc: 0, p: 1, e: 0.05, B: 0.03, s0: 0, s1: 0 };
  Object.assign(U, { uYN: { value: Lc.yN }, uWN: { value: Lc.wN }, uYC: { value: Lc.yc }, uXC: { value: Lc.xc }, uP: { value: Lc.p }, uE: { value: Lc.e }, uB: { value: Lc.B }, uS0: { value: Lc.s0 }, uS1: { value: Lc.s1 } });
  const surface = rp.surface || null;
  const mat = surface === 'satin' ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(1, 0.97, 0.9) })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = 'attribute float aEdgeC; attribute float aEdgeH; attribute float aLap; attribute float aSeam; attribute vec3 aRest; attribute float aFold;\nvarying float vFold;\nvarying float vEdgeC; varying float vEdgeH; varying float vLap; varying float vSeam; varying vec3 vRest;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEdgeC = aEdgeC; vEdgeH = aEdgeH; vLap = aLap; vSeam = aSeam; vRest = aRest; vFold = aFold;');
    s.fragmentShader = 'varying float vFold; uniform sampler2D uFoldMap; uniform float uFoldS; uniform float uFy0; uniform float uFy1; uniform float uFoldOn;\nvarying float vEdgeC; varying float vEdgeH; varying float vLap; varying float vSeam; varying vec3 vRest;\nuniform int uKind; uniform float uK; uniform vec3 uCollarC; uniform float uCollarW; uniform vec3 uHemC; uniform float uHemW; uniform float uCloud; uniform float uCloudN; uniform float uFoldA; uniform float uFoldN; uniform float uTop; uniform float uHem; uniform float uApex; uniform float uElbow; uniform float uBrW; uniform vec3 uBrC; uniform vec3 uBrE; uniform float uBrB; uniform float uYN; uniform float uWN; uniform float uYC; uniform float uXC; uniform float uP; uniform float uE; uniform float uB; uniform float uS0; uniform float uS1;\nuniform float uWeave; uniform float uWeaveS; uniform vec3 uWeaveC; uniform float uMotif; uniform vec3 uMotifC;\nuniform float uRank; uniform vec3 uRankC; uniform float uRankY; uniform float uRankS; uniform vec3 uRankT;\n' + GLSL_COLLAR + GLSL_WEAVE
      + 'float gBand = 0.0; float gWeave = 0.0; float gMetal = 0.0;\n' + s.fragmentShader.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_SHEEN\nmaterial.sheenColor *= 1.0 - gBand;\n#endif\nmaterial.specularColor *= 1.0 - 0.85 * gBand; material.specularF90 *= 1.0 - 0.85 * gBand; material.roughness = mix(material.roughness, 1.0, gBand);\nmaterial.roughness = mix(material.roughness, 0.5, gWeave); material.specularColor = mix(material.specularColor, vec3(0.09), gWeave);\nmaterial.roughness = mix(material.roughness, 0.32, gMetal); material.specularColor = mix(material.specularColor, uMotifC, gMetal); material.specularF90 = mix(material.specularF90, 1.0, gMetal);') // round 4 fix 3: nor a grazing highlight (from the side, the band's edge-on glint read as a grey line along her V) // round 4: no satin sheen on the collar band (at a grazing angle it greyed the black band into smoke)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
if (uFoldOn > 0.5 && vFold > 0.02) {
  // the baked folds: cylindrical coordinates of the rest position; the wrap at the back seam would break the screen-space
  // derivatives, so they are taken from whichever of two phases is continuous there
  float ph = atan(vRest.x, vRest.z) / 6.2831853; float u1 = ph + 0.5, u2 = fract(ph + 1.0);
  float vv = clamp((vRest.y - uFy0) / max(uFy1 - uFy0, 1e-3), 0.0, 1.0);
  vec2 d1x = vec2(dFdx(u1), dFdx(vv)), d1y = vec2(dFdy(u1), dFdy(vv)), d2x = vec2(dFdx(u2), dFdx(vv)), d2y = vec2(dFdy(u2), dFdy(vv));
  bool use2 = abs(d2x.x) + abs(d2y.x) < abs(d1x.x) + abs(d1y.x);
  vec2 st0 = use2 ? d2x : d1x, st1 = use2 ? d2y : d1y;
  vec3 mapN = texture2D(uFoldMap, vec2(u1, vv)).xyz * 2.0 - 1.0; mapN.xy *= uFoldS * vFold * faceDirection;
  vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition), N0 = normalize(normal), q1p = cross(q1, N0), q0p = cross(N0, q0);
  vec3 Tt = q1p * st0.x + q0p * st1.x, Bb = q1p * st0.y + q0p * st1.y; float det = max(dot(Tt, Tt), dot(Bb, Bb)), sc = det == 0.0 ? 0.0 : inversesqrt(det);
  normal = normalize(Tt * (mapN.x * sc) + Bb * (mapN.y * sc) + N0 * mapN.z);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 c = diffuseColor.rgb; float th = atan(vRest.x, vRest.z); float aa = 0.0012;
  // folds, painted as light and shade (no geometry)
  if (uKind == 1) { float u = clamp((uTop - vRest.y) / max(0.01, uTop - uHem), 0.0, 1.0);
    float s = sin(uFoldN * th + 1.7 * sin(2.0 * th) + 3.0 * u + 0.6 * sin(5.0 * th + 7.0 * u));
    c *= 1.0 + uFoldA * pow(u, 0.6) * (0.55 * s - 0.15 * s * s);
    float g = (1.0 - smoothstep(0.0, 0.09 * uK, uTop - vRest.y)) * (1.0 - smoothstep(uTop + 0.02 * uK, uTop + 0.03 * uK, vRest.y)); /* round 7: no gathers above the sash (the outer skirt of A1 rises 14 cm over the waist; there they read as a pleated band) */ c *= 1.0 - 0.08 * g * (0.5 + 0.5 * sin(46.0 * th)); }
  if (uKind == 0) { float below = smoothstep(uApex, uApex - 0.14 * uK, vRest.y) * (1.0 - smoothstep(uTop + 0.03 * uK, uTop, vRest.y));
    float d = sin((abs(vRest.x) * 1.4 + vRest.y) * 70.0 / uK); c *= 1.0 - 0.045 * below * smoothstep(0.02, 0.12, abs(vRest.x)) * (0.5 + 0.5 * d) * step(0.0, vRest.z);
    if (vSeam > 0.0) { float e = vSeam - uElbow; float w = 1.0 - smoothstep(0.02 * uK, 0.06 * uK, abs(e)); c *= 1.0 - 0.10 * w * (0.5 + 0.5 * sin(e * 260.0 / uK)); } }
  if (uKind == 2) { float s = sin(vRest.x * 95.0 / uK + vRest.z * 60.0 / uK + vEdgeH * 9.0); c *= 1.0 + uFoldA * 0.8 * (0.5 * s - 0.1); }
  // the woven pattern (round 2): tone-on-tone roundels in the weave, catching the light where the thread floats, and a
  // fine twill grain under it. The cloth's own coordinates: arc round the body and height; on a bell, arc and length
  if (uWeave > 0.0) { vec2 wq = uKind == 2 ? vec2(vSeam, vEdgeH) : vec2(th * length(vRest.xz), vRest.y);
    vec2 wv = weave(wq / (uWeaveS * uK), wq / uK); c = mix(c, mix(c, uWeaveC, 0.3) * (1.0 + 0.12 * uWeave), wv.x * uWeave); c *= 1.0 + 0.05 * uWeave * wv.y; gWeave = wv.x * uWeave; }
  // the baked folds' cavity (alpha of the fold map): the valleys take less light, so the folds read on a dark cloth too
  if (uFoldOn > 0.5 && vFold > 0.02) { float fv = clamp((vRest.y - uFy0) / max(uFy1 - uFy0, 1e-3), 0.0, 1.0); c *= mix(1.0, texture2D(uFoldMap, vec2(th / 6.2831853 + 0.5, fv)).a, vFold); }
  // seams: shoulder (a line round the arm just past the joint) and the side seams of torso and skirt
  if (uKind == 0) c *= 1.0 - 0.22 * (1.0 - smoothstep(0.0008, 0.0024, abs(vSeam)));
  if (uKind != 2) { float sd = min(abs(th - 1.5708), abs(th + 1.5708)) * length(vRest.xz); c *= 1.0 - 0.14 * (1.0 - smoothstep(0.0008, 0.0025, sd)); }
  // the collar: on the shell, measured here per fragment (round 4); on the skirt, the lapped edge's attribute
  float eC = vEdgeC;
  if (uKind == 0) { vec2 cl = collarField(vRest);
    // the fields are measured in the body's front plane; where the cloth turns away (the side of the breast) a plane
    // distance covers more cloth, so it is stretched by the surface's slope across the body (the band keeps its width on
    // the cloth and its edge stays sharp)
    vec3 Nr = cross(dFdx(vRest), dFdy(vRest)); float st = length(Nr) > 0.0 ? min(4.0, sqrt(1.0 + pow(Nr.x / max(abs(Nr.z), 1e-4), 2.0))) : 1.0; cl *= st;
    if (vLap > 0.5 && vRest.z > 0.0) { eC = min(eC, cl.x);
      c *= 1.0 - 0.32 * (1.0 - smoothstep(0.0, 0.01 * uK, cl.y)) * step(0.0, cl.y) * step(vRest.y, uYC + 0.01 * uK); } } // the lap's shadow on the under panel below the crossing
  else if (vLap < 0.0) c *= 1.0 - 0.32 * (1.0 - smoothstep(0.0, 0.01 * uK, -vLap));
  // collar band with a stitch line
  float aC = max(0.0006, min(aa, fwidth(eC))); float bc = 1.0 - smoothstep(uCollarW - aC, uCollarW, eC); c = mix(c, uCollarC, bc); gBand = bc;
  if (uMotif > 0.0) { float m = brick(vec2(eC / uCollarW, (vRest.y + abs(th) * length(vRest.xz)) / uCollarW)); c = mix(c, uMotifC * (0.75 + 0.25 * m), bc * m * uMotif); gMetal = bc * m * uMotif; }
  c *= 1.0 - 0.28 * bc * (1.0 - smoothstep(0.0005, 0.0016, abs(eC - (uCollarW - 0.005 * uK))));
  c *= 1.0 - 0.18 * (1.0 - bc) * (1.0 - smoothstep(0.0, 0.005 * uK, eC - uCollarW)); // its shadow on the robe
  // the bracer (round 6): brown from the cuff up the forearm, a light edge band with a stitch line at each end, its shadow on the sleeve
  if (uKind == 0 && uBrW > 0.0 && vLap < 0.5) { float ab = max(0.0006, min(aa, fwidth(vEdgeH)));
    float inB = 1.0 - smoothstep(uBrW - ab, uBrW, vEdgeH), eB = max(1.0 - smoothstep(uBrB - ab, uBrB, vEdgeH), smoothstep(uBrW - uBrB - ab, uBrW - uBrB, vEdgeH)) * inB;
    c *= 1.0 - 0.2 * (1.0 - inB) * (1.0 - smoothstep(0.0, 0.006 * uK, vEdgeH - uBrW));
    c = mix(c, uBrC, inB); c = mix(c, uBrE, eB); gBand = max(gBand, inB);
    c *= 1.0 - 0.3 * eB * (1.0 - smoothstep(0.0004, 0.0013, min(abs(vEdgeH - 0.55 * uBrB), abs(vEdgeH - (uBrW - 0.55 * uBrB))))); }
  // the rank square: a field of the face's colour with a metal border and the trigram's three bars in metal thread
  if (uRank > 0.5 && (uRank < 1.5 || vRest.z < 0.0) && vSeam < 0.0) { vec2 q = vec2(vRest.x, vRest.y - uRankY) / uRankS; float d = boxD(q, vec2(1.0)), ad = max(fwidth(d), 1e-4);
    if (d < ad) { float inS = 1.0 - smoothstep(-ad, ad, d); vec3 sc = uRankC * 0.92; float bord = 1.0 - smoothstep(0.1 - ad, 0.1 + ad, -d);
      float bars = 0.0; for (int i = 0; i < 3; i++) { float fi = float(i), yb = -0.48 + 0.48 * fi, whole = i == 0 ? uRankT.x : (i == 1 ? uRankT.y : uRankT.z);
        float b = boxD(q - vec2(0.0, yb), vec2(0.6, 0.12)); if (whole < 0.5) b = max(b, 0.13 - abs(q.x)); bars = max(bars, 1.0 - smoothstep(-ad, ad, b)); }
      vec3 m = uMotifC * (0.8 + 0.2 * sin(q.x * 40.0) * sin(q.y * 40.0));
      c = mix(c, sc, inS); c = mix(c, m, inS * max(bord, bars)); c *= 1.0 - 0.3 * inS * (1.0 - smoothstep(0.0, 2.0 * ad, abs(d + 0.1))); gBand = max(gBand, inS); gMetal = max(gMetal, inS * max(bord, bars)); } }
  // hem and cuff band; a cloud edge rises in lobes
  float w = uHemW * (1.0 + uCloud * pow(max(0.0, sin(uCloudN * th * 0.5)), 2.0));
  if (uKind == 2) w = uHemW * (1.0 + uCloud * pow(max(0.0, sin(uCloudN * (vRest.x + vRest.z) * 9.0 / uK)), 2.0));
  float bh = 1.0 - smoothstep(w - aa, w, vEdgeH); c = mix(c, uHemC, bh);
  if (uMotif > 0.0) { float al = uKind == 2 ? vSeam : th * length(vRest.xz); float m = brick(vec2(vEdgeH / w, al / w)); c = mix(c, uMotifC * (0.75 + 0.25 * m), bh * m * uMotif); gMetal = max(gMetal, bh * m * uMotif); }
  c *= 1.0 - 0.25 * bh * (1.0 - smoothstep(0.0005, 0.0016, abs(vEdgeH - (w - 0.004 * uK))));
  c *= 1.0 - 0.14 * (1.0 - bh) * (1.0 - smoothstep(0.0, 0.006 * uK, vEdgeH - w));
  diffuseColor.rgb = c;
}`);
  };
  mat.customProgramCacheKey = () => 'shell-paint-' + kind + '-' + (surface || '');
  mat.userData.U = U; mat.userData.weave = !!rp.weave; // round 2: a preview's sliders set the weave live
  pt.mesh.material = mat;
  // round 4 fix 3: the inside is painted too, so the collar band runs on round the cut edge as a facing (from the side her
  // V showed a thin grey line of lining along its edge); the lining keeps its colour everywhere else
  const lin = col(rp.lining || rp.trim || rp.color), back = new THREE.MeshStandardMaterial({ color: lin.multiplyScalar(0.8), roughness: 0.95, side: THREE.BackSide });
  if (kind === 'shell') { back.onBeforeCompile = mat.onBeforeCompile; back.customProgramCacheKey = () => 'shell-paint-back-' + kind; }
  pt.back.material = back;
  return pt;
}

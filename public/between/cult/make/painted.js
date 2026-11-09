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
    uBrW: { value: (kind === 'shell' && rp.bracer && pt.mesh.geometry.userData.bracerW) || 0 }, uBrC: { value: col(rp.bracer) }, uBrE: { value: col(rp.bracerBand || '#e6d9bd') }, uBrB: { value: (rp.bracerBandW ?? 0.011) * k },
  };
  // shells round 4: the cross collar's lines as uniforms, so the V band, the lapped edge and its shadow are measured per
  // fragment, perpendicular to each line (round 3 wrote them per vertex on big triangles: a notch, a ragged band)
  const Lc = C.Lc || { yN: 1, wN: 0, yc: 0, xc: 0, p: 1, e: 0.05, B: 0.03, s0: 0, s1: 0 };
  Object.assign(U, { uYN: { value: Lc.yN }, uWN: { value: Lc.wN }, uYC: { value: Lc.yc }, uXC: { value: Lc.xc }, uP: { value: Lc.p }, uE: { value: Lc.e }, uB: { value: Lc.B }, uS0: { value: Lc.s0 }, uS1: { value: Lc.s1 } });
  const surface = rp.surface || null;
  const mat = surface === 'satin' ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(1, 0.97, 0.9) })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = 'attribute float aEdgeC; attribute float aEdgeH; attribute float aLap; attribute float aSeam; attribute vec3 aRest;\nvarying float vEdgeC; varying float vEdgeH; varying float vLap; varying float vSeam; varying vec3 vRest;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEdgeC = aEdgeC; vEdgeH = aEdgeH; vLap = aLap; vSeam = aSeam; vRest = aRest;');
    s.fragmentShader = 'varying float vEdgeC; varying float vEdgeH; varying float vLap; varying float vSeam; varying vec3 vRest;\nuniform int uKind; uniform float uK; uniform vec3 uCollarC; uniform float uCollarW; uniform vec3 uHemC; uniform float uHemW; uniform float uCloud; uniform float uCloudN; uniform float uFoldA; uniform float uFoldN; uniform float uTop; uniform float uHem; uniform float uApex; uniform float uElbow; uniform float uBrW; uniform vec3 uBrC; uniform vec3 uBrE; uniform float uBrB; uniform float uYN; uniform float uWN; uniform float uYC; uniform float uXC; uniform float uP; uniform float uE; uniform float uB; uniform float uS0; uniform float uS1;\n' + GLSL_COLLAR
      + 'float gBand = 0.0;\n' + s.fragmentShader.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_SHEEN\nmaterial.sheenColor *= 1.0 - gBand;\n#endif\nmaterial.specularColor *= 1.0 - 0.85 * gBand; material.specularF90 *= 1.0 - 0.85 * gBand; material.roughness = mix(material.roughness, 1.0, gBand);') // round 4 fix 3: nor a grazing highlight (from the side, the band's edge-on glint read as a grey line along her V) // round 4: no satin sheen on the collar band (at a grazing angle it greyed the black band into smoke)
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
  c *= 1.0 - 0.28 * bc * (1.0 - smoothstep(0.0005, 0.0016, abs(eC - (uCollarW - 0.005 * uK))));
  c *= 1.0 - 0.18 * (1.0 - bc) * (1.0 - smoothstep(0.0, 0.005 * uK, eC - uCollarW)); // its shadow on the robe
  // the bracer (round 6): brown from the cuff up the forearm, a light edge band with a stitch line at each end, its shadow on the sleeve
  if (uKind == 0 && uBrW > 0.0 && vLap < 0.5) { float ab = max(0.0006, min(aa, fwidth(vEdgeH)));
    float inB = 1.0 - smoothstep(uBrW - ab, uBrW, vEdgeH), eB = max(1.0 - smoothstep(uBrB - ab, uBrB, vEdgeH), smoothstep(uBrW - uBrB - ab, uBrW - uBrB, vEdgeH)) * inB;
    c *= 1.0 - 0.2 * (1.0 - inB) * (1.0 - smoothstep(0.0, 0.006 * uK, vEdgeH - uBrW));
    c = mix(c, uBrC, inB); c = mix(c, uBrE, eB); gBand = max(gBand, inB);
    c *= 1.0 - 0.3 * eB * (1.0 - smoothstep(0.0004, 0.0013, min(abs(vEdgeH - 0.55 * uBrB), abs(vEdgeH - (uBrW - 0.55 * uBrB))))); }
  // hem and cuff band; a cloud edge rises in lobes
  float w = uHemW * (1.0 + uCloud * pow(max(0.0, sin(uCloudN * th * 0.5)), 2.0));
  if (uKind == 2) w = uHemW * (1.0 + uCloud * pow(max(0.0, sin(uCloudN * (vRest.x + vRest.z) * 9.0 / uK)), 2.0));
  float bh = 1.0 - smoothstep(w - aa, w, vEdgeH); c = mix(c, uHemC, bh);
  c *= 1.0 - 0.25 * bh * (1.0 - smoothstep(0.0005, 0.0016, abs(vEdgeH - (w - 0.004 * uK))));
  c *= 1.0 - 0.14 * (1.0 - bh) * (1.0 - smoothstep(0.0, 0.006 * uK, vEdgeH - w));
  diffuseColor.rgb = c;
}`);
  };
  mat.customProgramCacheKey = () => 'shell-paint-' + kind + '-' + (surface || '');
  pt.mesh.material = mat;
  // round 4 fix 3: the inside is painted too, so the collar band runs on round the cut edge as a facing (from the side her
  // V showed a thin grey line of lining along its edge); the lining keeps its colour everywhere else
  const lin = col(rp.lining || rp.trim || rp.color), back = new THREE.MeshStandardMaterial({ color: lin.multiplyScalar(0.8), roughness: 0.95, side: THREE.BackSide });
  if (kind === 'shell') { back.onBeforeCompile = mat.onBeforeCompile; back.customProgramCacheKey = () => 'shell-paint-back-' + kind; }
  pt.back.material = back;
  return pt;
}

// shells round 4, fix 3 (his B on cult-shells-look-4, 2026-11-03): the hair reads as hair, not as a plain dark sheet.
// One material for the hair pieces (cap, bun, sheet, braid; not the pins, crown or tie) paints, per fragment:
//   strands   fine light and dark lines that follow the hair from the crown down (two scales: clumps and strands),
//             faded out where a strand is smaller than a pixel, so a far figure does not shimmer
//   sheen     two highlights along the strands (Kajiya-Kay: bright where the light's half vector is across the strand),
//             a white one and a softer one tinted by the hair, as lit hair shows a band, not a spot
// Per vertex, from the fit pose: aHU, the arc across the head round the vertical axis (metres, 0 at the back); aHV, the
// distance from the crown; aHT, the strand's direction (from the crown toward the point, laid on the surface), carried
// into bind space here and skinned in the shader, so the sheen turns with the head when he raises his arms.
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const HAIR = /^hair(-cap|-long|-braid)?$/;
export function hairPaint(C, parts) {
  const k = C.k, H = new THREE.Vector3().setFromMatrixPosition(C.F.bones.head.matrixWorld);
  const top = V(H.x, C.crown, H.z).addScaledVector(C.f, -0.012 * k), mid = V(H.x, C.crown - 0.1 * k, H.z), R = 0.09 * k;
  const sk = C.F.mesh.skeleton, BM = C.F.mesh.bindMatrix, bm = sk.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i]));
  for (const pt of parts) {
    if (!HAIR.test(pt.name)) continue;
    const g = pt.geo, n = g.attributes.position.count, W = pt.world;
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(Float32Array.from(W), 3)); if (g.index) wg.setIndex(g.index.clone()); wg.computeVertexNormals();
    const WN = wg.attributes.normal, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const U = new Float32Array(n), Vv = new Float32Array(n), T = new Float32Array(n * 3), p = V(), nn = V(), d = V(), M = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      p.set(W[i * 3], W[i * 3 + 1], W[i * 3 + 2]); nn.fromBufferAttribute(WN, i);
      d.copy(p).sub(mid); U[i] = Math.atan2(d.dot(C.l), -d.dot(C.f)) * R;
      d.copy(p).sub(top); Vv[i] = d.length(); d.addScaledVector(nn, -d.dot(nn)); if (d.lengthSq() < 1e-10) d.set(0, -1, 0); d.normalize();
      M.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      for (let j = 0; j < 4; j++) { const w = SW.getComponent(i, j); if (w <= 0) continue; const e = bm[SI.getComponent(i, j)].elements; for (let q = 0; q < 16; q++) M.elements[q] += e[q] * w; }
      M.multiply(BM).invert(); d.transformDirection(M); T[i * 3] = d.x; T[i * 3 + 1] = d.y; T[i * 3 + 2] = d.z;
    }
    g.setAttribute('aHU', new THREE.BufferAttribute(U, 1)); g.setAttribute('aHV', new THREE.BufferAttribute(Vv, 1)); g.setAttribute('aHT', new THREE.BufferAttribute(T, 3));
    pt.mesh.material = hairMaterial(k);
  }
}
function hairMaterial(k) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 });
  const U = { uK: { value: k }, uSheenA: { value: 0.06 }, uSheenB: { value: 0.05 } };
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = 'attribute float aHU; attribute float aHV; attribute vec3 aHT;\nvarying float vHU; varying float vHV; varying vec3 vHT;\n' + s.vertexShader.replace('#include <skinnormal_vertex>', `#include <skinnormal_vertex>
  vec3 hT = aHT;
#ifdef USE_SKINNING
  hT = (skinMatrix * vec4(hT, 0.0)).xyz;
#endif
  vHT = normalize(normalMatrix * hT); vHU = aHU; vHV = aHV;`);
    s.fragmentShader = 'varying float vHU; varying float vHV; varying vec3 vHT;\nuniform float uK; uniform float uSheenA; uniform float uSheenB;\nfloat hH(float x) { return fract(sin(x * 127.1) * 43758.5453); }\nfloat hN(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hH(i), hH(i + 1.0), f); }\nfloat gStr = 0.5;\n'
      + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
{
  float fw = fwidth(vHU) + 1e-6, front = 1.0 - smoothstep(2.4, 2.8, abs(vHU) / (0.09 * uK)); // the arc wraps at the front: no strands across the seam
  float c1 = hN(vHU / (0.006 * uK) + 0.37 * hN(vHV / (0.04 * uK))), c2 = hN(vHU / (0.0016 * uK) + 9.1 * floor(vHV / (0.07 * uK) + hH(floor(vHU / (0.0016 * uK)))));
  float a1 = (1.0 - smoothstep(0.0015 * uK, 0.005 * uK, fw)) * front, a2 = (1.0 - smoothstep(0.0005 * uK, 0.0016 * uK, fw)) * front;
  gStr = c2; diffuseColor.rgb *= 1.0 + 0.38 * a1 * (c1 - 0.5) + 0.34 * a2 * (c2 - 0.5);
}`).replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
{
  vec3 Tn = vHT - normal * dot(vHT, normal); Tn = length(Tn) > 1e-4 ? normalize(Tn) : vec3(0.0, -1.0, 0.0);
  vec3 Vw = normalize(vViewPosition); float sh = (gStr - 0.5) * 0.3;
  vec3 T1 = normalize(Tn + normal * (sh - 0.10)), T2 = normalize(Tn + normal * (sh + 0.14));
  for (int i = 0; i < NUM_DIR_LIGHTS; i++) { vec3 L = directionalLights[i].direction, Hh = normalize(L + Vw);
    float t1 = dot(T1, Hh), t2 = dot(T2, Hh), s1 = pow(sqrt(max(0.0, 1.0 - t1 * t1)), 90.0), s2 = pow(sqrt(max(0.0, 1.0 - t2 * t2)), 22.0);
    float vis = smoothstep(-0.15, 0.35, dot(normal, L));
    reflectedLight.directSpecular += directionalLights[i].color * vis * (uSheenA * s1 * vec3(0.9, 0.8, 0.7) + uSheenB * s2 * (0.35 + gStr * 0.4) * vec3(0.62, 0.48, 0.38)); }
}
#endif`);
  };
  mat.customProgramCacheKey = () => 'hair-paint';
  return mat;
}

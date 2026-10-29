/* Figure light (six-faces-council relationship-creature, "Mirror light and standing idle build"; still-maker
   /mnt/project-files/between/lighting/r2/still2.html). Two things that light the player figures and nothing else, so the
   room keeps its dark:
   - wrapFigure(material): light wraps a little past the body's edge before it fades (the terminator becomes a gradient).
     One shared uniform, so a style change needs no recompile.
   - figureProbe(renderer, scene, at): one 64 px capture of the room from `at` (call it with the figures hidden),
     prefiltered once, and the luminance of its SH DC term, so envMapIntensity = k / dc gives the room's colours and
     directions at a set strength whatever the room's own brightness.
   The strengths live per style in public/calrunia/room-styles.js (`figure`). */
import * as THREE from "three";
import { LightProbeGenerator } from "three/addons/lights/LightProbeGenerator.js";

export const figureWrap = { value: 0.25 };
const IRR = "vec3 irradiance = dotNL * directLight.color;";
const WRAPPED = THREE.ShaderChunk.lights_physical_pars_fragment.replace(IRR,
  "float wrapNL = saturate( ( dot( geometryNormal, directLight.direction ) + uFigWrap ) / ( 1.0 + uFigWrap ) ); vec3 irradiance = wrapNL * directLight.color;");
export const wrapReady = WRAPPED.includes("uFigWrap");   // false if a three.js update moved the line (the probe checks it)

export function wrapFigure(m) {
  if (!m || !m.isMeshStandardMaterial || m.userData.figWrap) return;
  m.userData.figWrap = true;
  const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  m.onBeforeCompile = function (sh, r) {
    if (prev) prev.call(this, sh, r);
    sh.uniforms.uFigWrap = figureWrap;
    sh.fragmentShader = "uniform float uFigWrap;\n" + sh.fragmentShader.replace("#include <lights_physical_pars_fragment>", WRAPPED);
  };
  m.customProgramCacheKey = function () { return (key ? key.call(this) : "") + "|figwrap"; };
  m.needsUpdate = true;
}

/* One capture; returns { env, dc } and keeps nothing else (the caller disposes the previous env). */
export function figureProbe(renderer, scene, at) {
  const rt = new THREE.WebGLCubeRenderTarget(64, { type: THREE.HalfFloatType });
  const cc = new THREE.CubeCamera(0.05, 40, rt); cc.position.copy(at);
  scene.add(cc); cc.update(renderer, scene); scene.remove(cc);
  const pm = new THREE.PMREMGenerator(renderer), env = pm.fromCubemap(rt.texture); pm.dispose();
  const c0 = LightProbeGenerator.fromCubeRenderTarget(renderer, rt).sh.coefficients[0];
  rt.dispose();
  return { env, dc: Math.max(1e-3, 0.2126 * c0.x + 0.7152 * c0.y + 0.0722 * c0.z) };
}

/* The figure's materials take the capture: envMap, strength k / dc, and a roughness floor so the capture reads as soft
   light, not a reflection. */
export function lightFigure(root, env, intensity) {
  root.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m || !m.isMeshStandardMaterial) continue;
      wrapFigure(m);
      if (m.envMap !== env) { m.envMap = env; m.needsUpdate = true; }
      m.envMapIntensity = intensity;
      if (m.userData.rough0 == null) m.userData.rough0 = m.roughness;
      m.roughness = Math.max(m.userData.rough0, 0.85);
    }
  });
}

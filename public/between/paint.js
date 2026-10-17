/* The Between, round 3: the painterly shader.
   Wendell's ruling on ppo-who-paints, "code-paints": our code paints the four views, with no hand-painting step and no
   image from ChatGPT in the page. The concept views (/mnt/project-files/between/round2/concept/, his ChatGPT art) are a
   colour reference only (cs-chatgpt-ai-art): their luminance ramp was read once, and the five stops below are those
   numbers. Nothing from the pictures ships.

   What it does to every standard material in the scene (the hollow, the creature, the glb figures), as a patch to
   three's own shader, so draw calls and geometry stay as they were:
     1. brush: strokes of value noise, stretched along the surface's long axis, nudge the lit colour, and wobble the
        band edges, so tones read as laid paint and not as a smooth render;
     2. soft: colour maps are read a mip or so blurrier, so speckle in the textures becomes brush-sized;
     3. bands: light is quantized into a few soft steps (the picture's cel look), with wet-edged transitions;
     4. ramp: each band is tinted by the concept's ramp (warm brown shadow, mauve mid-light, amber high light), keyed to
        the concept's measured stops, while the material keeps its own hue (moss stays green, water teal);
     5. rim: a thin warm paint-light on edges facing away from the camera, as the pictures have on every figure.
   ?paint=0 on the page URL turns it off, for the side-by-side with round 2. ?paint=0.5 is half strength. */
import * as THREE from "three";

/* Concept ramp, read from the four views' luminance percentiles (10, 40, 70, 95): the mean colour inside each band.
   Views 1 to 4 agree within a few counts, so one ramp serves all four. sRGB hex. */
export const RAMP = ["#1d1007", "#351e15", "#4d2e23", "#774f4f", "#e09a72"];
export const RAMP_STOPS = [0.0, 0.2, 0.42, 0.66, 1.0];   // where each colour sits along the banded light (0 dark, 1 lit)

const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("paint");
const strength = q === null ? 1 : Math.max(0, Math.min(1, Number(q)));
export const paint = {
  uStrength: { value: Number.isFinite(strength) ? strength : 1 },
  uBands: { value: 5 },
  uRamp: { value: RAMP.map(h => new THREE.Color(h)) },   // THREE.Color converts sRGB hex to linear
  uStops: { value: RAMP_STOPS },
  uBrush: { value: 1 },
  uSoft: { value: 3.2 },        // mip bias on colour maps: paint has no pixel-level speckle
};

const VERT_DECL = `varying vec3 vPaintPos;
varying vec3 vPaintN;
`;
const VERT_BODY = `
{ vec4 pw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    pw = instanceMatrix * pw;
  #endif
  vPaintPos = (modelMatrix * pw).xyz;
  vPaintN = normalize(mat3(modelMatrix) * objectNormal); }
`;

const FRAG_DECL = `varying vec3 vPaintPos;
varying vec3 vPaintN;
uniform float uPaintStrength;
uniform float uPaintBands;
uniform float uPaintBrush;
uniform float uPaintSoft;
uniform vec3 uPaintRamp[5];
uniform float uPaintStops[5];
float pHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pHash(i), pHash(i + vec3(1,0,0)), f.x), mix(pHash(i + vec3(0,1,0)), pHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(pHash(i + vec3(0,0,1)), pHash(i + vec3(1,0,1)), f.x), mix(pHash(i + vec3(0,1,1)), pHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 pRamp(float t) {
  vec3 c = uPaintRamp[0];
  for (int i = 1; i < 5; i++) c = mix(c, uPaintRamp[i], smoothstep(uPaintStops[i - 1], uPaintStops[i], t));
  return c;
}
`;
/* Runs on outgoingLight (linear, lit, before tone mapping). */
const FRAG_BODY = `
if (uPaintStrength > 0.001) {
  vec3 base = outgoingLight;
  float L = dot(base, vec3(0.2126, 0.7152, 0.0722));
  /* brush: strokes follow the surface's own tangent plane, long in one direction, short across */
  vec3 pn = normalize(vPaintN);
  vec3 ax = abs(pn.y) > 0.85 ? vec3(1.0, 0.0, 0.0) : normalize(cross(pn, vec3(0.0, 1.0, 0.0)));
  vec3 ay = normalize(cross(pn, ax));
  vec3 sp = vPaintPos;
  vec3 sc = vec3(dot(sp, ax) * 3.2, dot(sp, ay) * 11.0, dot(sp, pn) * 3.2);
  float stroke = pNoise(sc) * 0.6 + pNoise(sc * 2.3 + 7.1) * 0.4;
  float fine = pNoise(sp * 38.0);
  /* bands in perceptual light, edges wobbled by the brush */
  float x = L / (1.0 + L);
  float xb = x * uPaintBands * (1.0 + (stroke - 0.5) * 0.45 * uPaintBrush);
  float fl = floor(xb);
  float fr = smoothstep(0.30, 0.70, fract(xb));
  float banded = (fl + fr) / uPaintBands;
  float lit = clamp(banded, 0.0, 1.0);
  float Lb = lit / max(1.0 - lit, 0.02);          // back to linear light
  vec3 col = base * (Lb * 1.6 / max(L, 0.002));  // same hue, painted brightness, lifted to keep the room as bright as before
  col = mix(base, col, 0.6);
  /* concept ramp as a tint: its colour at this band, normalised to unit light, pulled in gently */
  vec3 rc = pRamp(lit);
  float rl = max(dot(rc, vec3(0.2126, 0.7152, 0.0722)), 0.004);
  vec3 rt = rc / rl; rt /= max((rt.r + rt.g + rt.b) / 3.0, 0.001);
  col *= mix(vec3(1.0), rt, 0.30);
  /* laid paint: slight value and hue drift per stroke, a grain you only feel up close */
  col *= 1.0 + ((stroke - 0.5) * 0.30 + (fine - 0.5) * 0.08) * uPaintBrush;
  col = mix(col, col * vec3(1.06, 0.97, 0.9), (stroke - 0.5) * 0.4 * uPaintBrush);
  /* richer chroma, as the pictures are */
  float cl = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(cl), col, 1.3);
  /* a warm fill in the shadows, as the pictures never go black: the ramp's mid brown, added, not multiplied */
  col += uPaintRamp[2] * 0.14;
  /* rim: a thin warm paint-light on edges turned from the camera */
  float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.2);
  col += uPaintRamp[4] * rim * 0.16 * smoothstep(0.02, 0.25, L);
  outgoingLight = mix(outgoingLight, col, uPaintStrength);
}
`;

let installed = false;
/* One patch for every MeshStandardMaterial (also the physical subclass, which inherits it). Call once, before anything renders. */
export function installPaint() {
  if (installed) return; installed = true;
  const proto = THREE.MeshStandardMaterial.prototype;
  const prev = proto.onBeforeCompile;
  proto.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(this, shader, renderer);
    if (this.userData && this.userData.noPaint) return;
    const u = shader.uniforms;
    u.uPaintStrength = paint.uStrength; u.uPaintBands = paint.uBands; u.uPaintBrush = paint.uBrush; u.uPaintSoft = paint.uSoft;
    u.uPaintRamp = paint.uRamp; u.uPaintStops = paint.uStops;
    shader.vertexShader = VERT_DECL + shader.vertexShader
      .replace("#include <project_vertex>", "#include <project_vertex>\n" + VERT_BODY);
    const soft = THREE.ShaderChunk.map_fragment.replace("texture2D( map, vMapUv )", "texture2D( map, vMapUv, uPaintSoft * uPaintStrength )");
    shader.fragmentShader = FRAG_DECL + shader.fragmentShader.replace("#include <map_fragment>", soft).replace("#include <opaque_fragment>", FRAG_BODY + "\n#include <opaque_fragment>");
  };
  const key = proto.customProgramCacheKey;
  proto.customProgramCacheKey = function () { return (key ? key.call(this) : "") + (this.userData && this.userData.noPaint ? "|plain" : "|paint1"); };
}

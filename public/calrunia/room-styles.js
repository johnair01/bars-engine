/* Room styles: the place's light and weather, as data (six-faces-council relationship-creature, br-style-is-the-place).
   A style changes the place, not the Between, so either person in a room may change it with no yes.
   Plain module, no three.js: applyStyle only sets values on the handles a scene hands it (public/between/hollow.js
   buildHollow returns them as `handles`), so the Cave of Lessons and Big Mind can take it as it is.

   Sky colours are the sky shader's own raw values (r, g, b from 0 to 1), not hex, so Dusk hollow stays exactly the
   hollow as it was. Lights are hex and a strength; fire and lantern strengths are the base their flicker moves around.
   `land` tints the valley past the opening: the four mountain ranges far to near, the valley floor, and two multipliers
   over the river's and the pines' own colours (white leaves them as they are). */

export const STYLES = [
  {
    id: "dusk-hollow", name: "Dusk hollow", line: "The hollow at sundown: warm inside, violet sky past the opening.",
    sky: { top: [0.17, 0.12, 0.36], mid: [0.52, 0.33, 0.62], low: [0.98, 0.56, 0.40], hor: [1.0, 0.74, 0.48] }, sun: 0xffcf86, stars: 0.7,
    background: 0x1a1018, fog: { color: 0x24161a, near: 10, far: 30 },
    hemi: { sky: 0xffcf9a, ground: 0x2a1c22, strength: 0.55 }, dusk: { color: 0x8a7ad8, strength: 0.9 }, rim: { color: 0xff9a6a, strength: 0.35 },
    fire: { color: 0xff8a3a, strength: 16 }, lantern: { color: 0xffb066, strength: 7 }, land: { ranges: [0x9a7cb0, 0x75609a, 0x4a4674, 0x2e3758], valley: 0x1f2c40, river: 0xffffff, pines: 0xffffff }, weather: null,
  },
  {
    id: "moonlit", name: "Moonlit", line: "Night blue and silver, with the stars out.",
    sky: { top: [0.02, 0.03, 0.10], mid: [0.06, 0.09, 0.24], low: [0.16, 0.22, 0.40], hor: [0.30, 0.36, 0.52] }, sun: 0xdfe8ff, stars: 1,
    background: 0x0a0d18, fog: { color: 0x101626, near: 9, far: 28 },
    hemi: { sky: 0xb8c8ff, ground: 0x10141e, strength: 0.4 }, dusk: { color: 0x9fb4ff, strength: 0.7 }, rim: { color: 0xc0d0ff, strength: 0.25 },
    fire: { color: 0xff9a50, strength: 12 }, lantern: { color: 0xcfe0ff, strength: 6 }, land: { ranges: [0x3a4668, 0x2c3656, 0x1e2744, 0x141b32], valley: 0x0c1220, river: 0x8090c0, pines: 0x6a78a0 }, weather: null,
  },
  {
    id: "spring-morning", name: "Spring morning", line: "Bright and green, the morning coming in.",
    sky: { top: [0.35, 0.58, 0.90], mid: [0.58, 0.76, 0.95], low: [0.92, 0.93, 0.82], hor: [1.0, 0.95, 0.80] }, sun: 0xfff6d0, stars: 0,
    background: 0x6f8f6a, fog: { color: 0x9fc29a, near: 12, far: 34 },
    hemi: { sky: 0xfff4d8, ground: 0x5a7a3a, strength: 0.9 }, dusk: { color: 0xfff0c8, strength: 1.2 }, rim: { color: 0xd8ffb0, strength: 0.3 },
    fire: { color: 0xffa050, strength: 8 }, lantern: { color: 0xfff0b0, strength: 4 }, land: { ranges: [0xb8cce0, 0x8fb0a0, 0x6a9a68, 0x4f8248], valley: 0x5f8a44, river: 0xc0e0ff, pines: 0x9ad070 }, weather: null,
  },
  {
    id: "ember-rain", name: "Ember rain", line: "A warm hearth, and rain falling past the opening.",
    sky: { top: [0.10, 0.09, 0.11], mid: [0.20, 0.18, 0.20], low: [0.30, 0.26, 0.25], hor: [0.36, 0.30, 0.27] }, sun: 0x8a7e78, stars: 0,
    background: 0x120c0a, fog: { color: 0x2a2220, near: 7, far: 24 },
    hemi: { sky: 0xffc890, ground: 0x2a1a14, strength: 0.45 }, dusk: { color: 0x6e7488, strength: 0.5 }, rim: { color: 0xff9060, strength: 0.25 },
    fire: { color: 0xff7a2a, strength: 20 }, lantern: { color: 0xffa050, strength: 8 }, land: { ranges: [0x4a4448, 0x3c3638, 0x2e2a2c, 0x221e20], valley: 0x1a1816, river: 0x6a6460, pines: 0x6a6660 }, weather: "rain",
  },
];

export const DEFAULT_STYLE = "dusk-hollow";

/* The figure's own light (round 3 build, six-faces-council relationship-creature; still-maker
   /mnt/project-files/between/lighting/r2/still2.html, look page r3/look.html). Only the player figures take it:
   kMirror, kWalk: the room capture on the figure, as envMapIntensity = k / the capture's own brightness;
   wrap: how far light bends past the body's edge (0 hard, 0.5 round 2); warm, cool, rim: the mirror's two sconces and
   the window behind you (SpotLights, penumbra 1, decay 2, out to `dist`), on only while you stand at the mirror;
   key: the soft light that travels with you while you walk (angle `keyAngle`, out to `keyDist`);
   edge, edgeMirror: the painted room's band edge (paint.js uEdge) walking and at the mirror.
   Values are candidate 3b from round 3 until his pick on lt-mirror-look-03; a style overrides only what differs. */
export const FIGURE_LIGHT = { kMirror: 0.5, kWalk: 1.0, wrap: 0.25, warm: 6, cool: 1.5, rim: 10, dist: 3.5, key: 32, keyAngle: 0.25, keyDist: 6, edge: 0.25, edgeMirror: 0.25 };
export const figureLightOf = s => ({ ...FIGURE_LIGHT, ...((s && s.figure) || {}) });

/** A style by id; anything unknown is the default, so an old room or a typo still opens. */
export const styleOf = id => STYLES.find(s => s.id === id) || STYLES[0]; // STYLES[0] is the default

const SKY = { top: "uTop", mid: "uMid", low: "uLow", hor: "uHor" };

/**
 * Sets a style on a scene's handles: { sky, sun, stars, lights: { hemi, dusk, rim, fire }, lanterns: [{ light }], base,
 * land: { ranges: [material], valley, river, pines }, rain, scene }. Every handle is optional; only values change, nothing is made or removed. `base` holds the strengths a
 * scene's own flicker reads each frame (hemi, fire, lantern). Returns the style it set.
 */
export function applyStyle(handles, styleOrId) {
  const s = typeof styleOrId === "string" ? styleOf(styleOrId) : styleOrId;
  const h = handles || {}, L = h.lights || {};
  if (h.sky && h.sky.uniforms) for (const [k, u] of Object.entries(SKY)) if (h.sky.uniforms[u]) h.sky.uniforms[u].value.set(...s.sky[k]);
  if (h.sun && h.sun.material) h.sun.material.color.setHex(s.sun);
  if (h.stars) { h.stars.opacity = s.stars; h.stars.visible = s.stars > 0; }
  if (h.scene) {
    if (h.scene.background && h.scene.background.setHex) h.scene.background.setHex(s.background);
    if (h.scene.fog) { h.scene.fog.color.setHex(s.fog.color); h.scene.fog.near = s.fog.near; h.scene.fog.far = s.fog.far; }
  }
  if (L.hemi) { L.hemi.color.setHex(s.hemi.sky); L.hemi.groundColor.setHex(s.hemi.ground); L.hemi.intensity = s.hemi.strength; }
  if (L.dusk) { L.dusk.color.setHex(s.dusk.color); L.dusk.intensity = s.dusk.strength; }
  if (L.rim) { L.rim.color.setHex(s.rim.color); L.rim.intensity = s.rim.strength; }
  if (L.fire) { L.fire.color.setHex(s.fire.color); L.fire.intensity = s.fire.strength; }
  for (const lt of h.lanterns || []) if (lt.light) { lt.light.color.setHex(s.lantern.color); lt.light.intensity = s.lantern.strength; }
  const land = h.land || {};
  (land.ranges || []).forEach((m, i) => { if (m && s.land.ranges[i] != null) m.color.setHex(s.land.ranges[i]); });
  for (const k of ["valley", "river", "pines"]) if (land[k]) land[k].color.setHex(s.land[k]);
  if (h.rain) h.rain.visible = s.weather === "rain";
  if (h.base) { h.base.hemi = s.hemi.strength; h.base.fire = s.fire.strength; h.base.lantern = s.lantern.strength; }
  return s;
}

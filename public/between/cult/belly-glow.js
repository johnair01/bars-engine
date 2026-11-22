// The belly glow on the cultivation figure (cultivated character T008, FR-010, ccb-qi-in-the-belly).
// Wendell's note on cc-sheet-glow-look-1: it only shows while the character introspects, and it is more than a brighter
// light: qi is collected, condensed and distilled, in layers and colours that change as it develops. So this is no wash over
// the robe. A small dense core (the distilled qi) sits at the dantian, and each layer reached adds one thin shell around it,
// tighter and cooler as the layers rise: gold, then amber-gold, then jade, then a pale violet-white at the ninth. It draws no
// number (FR-010).
//
// makeBellyGlow(scene, F, { k }) -> { set(layers, { pulse }), introspect(on), update(dt), strength, shown, dispose() }
//   F: the figure (X.F): its hips and spine01 bones place the glow each frame, so it rides a walking or seated figure.
//   Hidden until introspect(true); it fades in and out over about 0.6 s.
import * as THREE from "three";
import { glowStrength, LAYERS_PER_FLOOR } from "./belly-rules.js";

const V = () => new THREE.Vector3();
const wp = b => b.getWorldPosition(V());
// Shell colours by layer, 1..9: the qi is gold at first, turns jade, and ends a pale violet-white.
export const LAYER_COLORS = ["#ffcf6e", "#ffc860", "#ffd27a", "#d9d98a", "#9fe0a8", "#6fd8b8", "#7fd0e0", "#a9b8f2", "#e6d6ff"];
const TEX = {};
function disc() {
  if (TEX.disc) return TEX.disc;
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const cx = cv.getContext("2d");
  const rg = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.3, "rgba(255,255,255,0.7)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  cx.fillStyle = rg; cx.fillRect(0, 0, 128, 128);
  return (TEX.disc = mk(cv));
}
function ring() { // a thin bright ring with a soft inner fade: one shell of condensed qi
  if (TEX.ring) return TEX.ring;
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const cx = cv.getContext("2d");
  const rg = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(255,255,255,0)"); rg.addColorStop(0.86, "rgba(255,255,255,0.04)");
  rg.addColorStop(0.94, "rgba(255,255,255,1)"); rg.addColorStop(0.985, "rgba(255,255,255,0.1)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  cx.fillStyle = rg; cx.fillRect(0, 0, 256, 256);
  return (TEX.ring = mk(cv));
}
function mk(cv) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function makeBellyGlow(scene, F, { k = (F.stature || 1.75) / 1.75, up = 0.12, forward = 0.24 } = {}) {
  const sprite = (map, color, o, add = false) => new THREE.Sprite(new THREE.SpriteMaterial({ map, color: new THREE.Color(color), transparent: true, opacity: o, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }));
  const halo = sprite(disc(), LAYER_COLORS[0], 0), core = sprite(disc(), "#ffb23a", 0);
  const shells = Array.from({ length: LAYERS_PER_FLOOR }, (_, i) => sprite(ring(), LAYER_COLORS[i], 0));
  const light = new THREE.PointLight(new THREE.Color(LAYER_COLORS[0]), 0, 0.7 * k, 2);
  const G = new THREE.Group(); G.name = "bellyGlow"; G.add(halo, ...shells, core, light); scene.add(G);
  halo.renderOrder = 10; shells.forEach((s, i) => { s.renderOrder = 11 + i; }); core.renderOrder = 21;
  let layers = 0, strength = glowStrength(0), pulseT = -1, vis = 0, want = 0;
  const PULSE = 1.6, FADE = 0.6; // seconds

  function place() {
    const hips = wp(F.bones.hips), sp1 = wp(F.bones.spine01);
    // the figure's front, from the feet: ankle to ball of the foot points forward, whatever frame the figure is built in
    const fl = wp(F.bones.ballL).add(wp(F.bones.ballR)).sub(wp(F.bones.ankleL)).sub(wp(F.bones.ankleR));
    fl.y = 0; if (fl.lengthSq() < 1e-8) fl.set(0, 0, 1); fl.normalize();
    G.position.copy(hips).lerp(sp1, up).addScaledVector(fl, forward * k);
    light.position.copy(fl).multiplyScalar(0.05);
  }
  function draw(t = 0) {
    const s = pulseT >= 0 ? Math.sin(Math.PI * Math.min(1, pulseT / PULSE)) : 0; // 0 -> 1 -> 0 over the pulse
    const e = vis * vis * (3 - 2 * vis); // eased fade
    const top = layers > 0 ? LAYER_COLORS[layers - 1] : LAYER_COLORS[0];
    // the core is the distilled qi: small and dense, a little tighter as the layers rise
    core.material.opacity = e * Math.min(1, 0.75 + 0.2 * s); core.material.color.set(layers > 0 ? LAYER_COLORS[Math.min(layers, 4) - 1] : "#e8a64a");
    core.scale.setScalar((0.045 - 0.01 * (layers / LAYERS_PER_FLOOR) + 0.03 * s) * k);
    // a faint breath of colour round the core, never a wash over the robe
    halo.material.color.set(top);
    halo.material.opacity = e * (0.06 + 0.1 * (layers / LAYERS_PER_FLOOR) + 0.1 * s);
    halo.scale.setScalar((0.17 + 0.012 * layers + 0.05 * s) * k);
    // one thin shell per layer reached, each tighter inside the last as the qi condenses; it breathes slowly
    for (let i = 0; i < shells.length; i++) {
      const on = i < layers, sh = shells[i];
      const r = (0.2 - 0.0115 * i) * k * (1 + 0.025 * Math.sin(t * 1.4 + i * 0.9) + 0.06 * s);
      sh.scale.setScalar(r);
      sh.material.opacity = on ? e * (0.75 + 0.03 * i) : 0;
    }
    light.color.set(top);
    light.intensity = e * 0.1 * s;
  }
  let clock = 0;
  place(); draw();
  return {
    get strength() { return strength; },
    get shown() { return vis; },
    introspect(on) { want = on ? 1 : 0; },
    set(n, { pulse = false } = {}) { layers = Math.max(0, Math.min(LAYERS_PER_FLOOR, n | 0)); strength = glowStrength(layers); if (pulse) pulseT = 0; draw(clock); },
    pulseAt(t) { pulseT = t; draw(clock); }, // for stills: a frame part way through the pulse
    showNow(on = true) { want = vis = on ? 1 : 0; draw(clock); }, // for stills: no fade
    update(dt) {
      clock += dt;
      if (pulseT >= 0) { pulseT += dt; if (pulseT > PULSE) pulseT = -1; }
      vis += Math.sign(want - vis) * Math.min(Math.abs(want - vis), dt / FADE);
      place(); draw(clock);
    },
    dispose() { G.removeFromParent(); for (const s of [halo, core, ...shells]) s.material.dispose(); },
  };
}

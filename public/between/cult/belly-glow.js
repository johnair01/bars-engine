// The belly glow on the cultivation figure (cultivated character T008, FR-010, ccb-qi-in-the-belly).
// Wendell's answers on cc-sheet-glow-look-1 and qi-growth-pearl-rings-look-2: it shows only while the character introspects,
// and what shows is a pearl, the distilled qi, at the dantian, with one ring of light opened round it for each realm she has
// reached: gold, then jade, then a pale sky blue (the water glow, lightened; the aesthetic contract bars invented purples, so the
// violet in the look's picture is not used). Layers inside a realm brighten the pearl and swell it a little; the ninth brims.
// It draws no number (FR-010).
//
// makeBellyGlow(scene, F, { k }) -> { set(layers, { pulse, realm }), introspect(on), update(dt), strength, shown, dispose() }
//   F: the figure (X.F): its hips and spine01 bones place the glow each frame, so it rides a walking or seated figure.
//   realm 1..3 (default 1) is how many rings are open. Hidden until introspect(true); it fades in and out over about 0.6 s.
import * as THREE from "three";
import { glowStrength, LAYERS_PER_FLOOR, REALMS } from "./belly-rules.js";

const V = () => new THREE.Vector3();
const wp = b => b.getWorldPosition(V());
// Ring colours by realm, 1..3: gold, jade (the wood glow), pale sky (the water glow, lightened).
export const REALM_COLORS = ["#ffcf6e", "#27ae60", "#8fd0ff"];
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
  const halo = sprite(disc(), REALM_COLORS[0], 0), pearl = sprite(disc(), "#ffd98a", 0), lustre = sprite(disc(), "#fff4d6", 0);
  const rings = REALM_COLORS.map(c => sprite(ring(), c, 0));
  const light = new THREE.PointLight(new THREE.Color(REALM_COLORS[0]), 0, 0.7 * k, 2);
  const G = new THREE.Group(); G.name = "bellyGlow"; G.add(halo, ...rings, pearl, lustre, light); scene.add(G);
  halo.renderOrder = 10; rings.forEach((s, i) => { s.renderOrder = 11 + i; }); pearl.renderOrder = 21; lustre.renderOrder = 22;
  let layers = 0, realm = 1, strength = glowStrength(0), pulseT = -1, vis = 0, want = 0;
  const PULSE = 1.6, FADE = 0.6; // seconds
  const RING_R = [0.1, 0.15, 0.2]; // ring radii, tight round the pearl: the next realm opens one ring wider

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
    const f = layers / LAYERS_PER_FLOOR, brim = layers >= LAYERS_PER_FLOOR ? 1 : 0, lead = REALM_COLORS[realm - 1];
    // the pearl: dense and round, a little larger and warmer with each layer; at the ninth it brims
    pearl.material.opacity = e * Math.min(1, 0.7 + 0.25 * f + 0.1 * s);
    pearl.scale.setScalar((0.06 + 0.014 * f + 0.01 * brim + 0.025 * s) * k);
    lustre.material.opacity = e * (0.55 + 0.3 * f + 0.15 * s);
    lustre.scale.setScalar((0.03 + 0.008 * f) * k);
    // a faint breath of the newest ring's colour round the pearl, never a wash over the robe
    halo.material.color.set(lead);
    halo.material.opacity = e * (0.06 + 0.1 * f + 0.08 * brim + 0.1 * s);
    halo.scale.setScalar((0.15 + 0.1 * (realm - 1) + 0.03 * f + 0.05 * s) * k);
    // one ring per realm reached; the newest ring brightens as its layers fill, the earlier ones stay full
    for (let i = 0; i < rings.length; i++) {
      const on = i < realm, r = rings[i];
      r.scale.setScalar(RING_R[i] * 2 * k * (1 + 0.025 * Math.sin(t * 1.4 + i * 1.3) + 0.05 * s));
      r.material.opacity = on ? e * (i < realm - 1 ? 0.9 : 0.55 + 0.4 * f) : 0;
    }
    light.color.set(lead);
    light.intensity = e * 0.1 * s;
  }
  let clock = 0;
  place(); draw();
  return {
    get strength() { return strength; },
    get shown() { return vis; },
    introspect(on) { want = on ? 1 : 0; },
    set(n, { pulse = false, realm: rm = 1 } = {}) { layers = Math.max(0, Math.min(LAYERS_PER_FLOOR, n | 0)); realm = Math.max(1, Math.min(REALMS, rm | 0 || 1)); strength = glowStrength(layers); if (pulse) pulseT = 0; draw(clock); },
    pulseAt(t) { pulseT = t; draw(clock); }, // for stills: a frame part way through the pulse
    showNow(on = true) { want = vis = on ? 1 : 0; draw(clock); }, // for stills: no fade
    update(dt) {
      clock += dt;
      if (pulseT >= 0) { pulseT += dt; if (pulseT > PULSE) pulseT = -1; }
      vis += Math.sign(want - vis) * Math.min(Math.abs(want - vis), dt / FADE);
      place(); draw(clock);
    },
    dispose() { G.removeFromParent(); for (const s of [halo, pearl, lustre, ...rings]) s.material.dispose(); },
  };
}

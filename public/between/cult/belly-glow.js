// The belly glow on the cultivation figure (cultivated character T008, FR-010, ccb-qi-in-the-belly). Ported from the
// mountain-gate still (six-faces-council council/callsheets/stills/2026-11-06-cultivated-character-gate/make/gate.html):
// a warm halo, a small core and a point light a little below the navel, just in front of the robe. It brightens by layer
// and pulses once when a layer opens. It draws no number (FR-010).
//
// makeBellyGlow(scene, F, { k }) -> { set(layers, { pulse }), update(dt), strength, dispose() }
//   F: the figure (X.F): its hips and spine01 bones place the glow each frame, so it rides a walking or seated figure.
import * as THREE from "three";
import { glowStrength } from "./belly-rules.js";

const V = () => new THREE.Vector3();
const wp = b => b.getWorldPosition(V());
let TEX = null;
function texture() {
  if (TEX) return TEX;
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const cx = cv.getContext("2d");
  const rg = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(255,250,232,1)"); rg.addColorStop(0.18, "rgba(255,226,150,0.85)");
  rg.addColorStop(0.5, "rgba(255,190,90,0.28)"); rg.addColorStop(1, "rgba(255,170,60,0)");
  cx.fillStyle = rg; cx.fillRect(0, 0, 256, 256);
  TEX = new THREE.CanvasTexture(cv); TEX.colorSpace = THREE.SRGBColorSpace; return TEX;
}

export function makeBellyGlow(scene, F, { k = (F.stature || 1.75) / 1.75, color = "#ffd88a", up = 0.12, forward = 0.14 } = {}) {
  const gc = new THREE.Color(color), map = texture();
  const mat = o => new THREE.SpriteMaterial({ map, color: gc, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = new THREE.Sprite(mat(0.5)), core = new THREE.Sprite(mat(0.95));
  const light = new THREE.PointLight(gc, 0, 0.9 * k, 2);
  const G = new THREE.Group(); G.name = "bellyGlow"; G.add(halo, core, light); scene.add(G);
  for (const s of [halo, core]) s.renderOrder = 10;
  let strength = glowStrength(0), pulseT = -1;
  const PULSE = 1.6; // seconds: one swell that settles

  function place() {
    const hips = wp(F.bones.hips), sp1 = wp(F.bones.spine01);
    // the figure's front, from the feet: ankle to ball of the foot points forward, whatever frame the figure is built in
    const fl = wp(F.bones.ballL).add(wp(F.bones.ballR)).sub(wp(F.bones.ankleL)).sub(wp(F.bones.ankleR));
    fl.y = 0; if (fl.lengthSq() < 1e-8) fl.set(0, 0, 1); fl.normalize();
    G.position.copy(hips).lerp(sp1, up).addScaledVector(fl, forward * k);
    light.position.copy(fl).multiplyScalar(0.05);
  }
  function draw() {
    const s = pulseT >= 0 ? Math.sin(Math.PI * Math.min(1, pulseT / PULSE)) : 0; // 0 -> 1 -> 0 over the pulse
    const g = Math.min(1.3, strength + 0.45 * s);
    halo.material.opacity = 0.08 + 0.72 * Math.min(1, g);
    halo.scale.setScalar((0.1 + 0.32 * g) * k);
    core.material.opacity = 0.12 + 0.83 * Math.min(1, g);
    core.scale.setScalar((0.025 + 0.06 * g) * k);
    light.intensity = 1.6 * g * g;
  }
  place(); draw();
  return {
    get strength() { return strength; },
    set(layers, { pulse = false } = {}) { strength = glowStrength(layers); if (pulse) pulseT = 0; draw(); },
    pulseAt(t) { pulseT = t; draw(); }, // for stills: a frame part way through the pulse
    update(dt) { if (pulseT >= 0) { pulseT += dt; if (pulseT > PULSE) pulseT = -1; } place(); draw(); },
    dispose() { G.removeFromParent(); halo.material.dispose(); core.material.dispose(); },
  };
}

// The belly glow on the cultivation figure (cultivated character T008, FR-010, ccb-qi-in-the-belly).
// Wendell's answers on cc-sheet-glow-look-1 and qi-growth-pearl-rings-look-2: it shows only while the character introspects,
// and what shows is qi at the dantian in the form of her floor (qi-levels-forms-look-1, A): loose motes spiralling in on the
// lower floor, a dense pearl with bands inside on the middle floor, a clear bead with a halo on the upper floor. Each layer adds
// motes, bands or halo inside the form; the ninth brims. Gold on the lower and middle floors; the player's element shows on
// the upper (qi-levels-colour-look-1, B), passed as set(..., { element }). It draws no number (FR-010).
//
// makeBellyGlow(scene, F, { k }) -> { set(layers, { pulse, realm, element }), form, introspect(on), update(dt), strength, shown, dispose() }
//   F: the figure (X.F): its hips and spine01 bones place the glow each frame, so it rides a walking or seated figure.
//   realm 1..3 (default 1) is the floor, which picks the form. Hidden until introspect(true); it fades in and out over about 0.6 s.
import * as THREE from "three";
import { glowStrength, LAYERS_PER_FLOOR, REALMS, formFor, formColor } from "./belly-rules.js";

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
  const GOLD = REALM_COLORS[0];
  // Forms (qi-levels-forms-look-1, A): lower floor loose motes spiralling in, middle floor a dense pearl with bands inside,
  // upper floor a clear bead with a halo. Gold until the upper floor, where the player's element shows (colour row, B).
  const halo = sprite(disc(), GOLD, 0), pearl = sprite(disc(), "#ffd98a", 0), lustre = sprite(disc(), "#fff4d6", 0);
  const bands = [0, 1, 2].map(() => sprite(ring(), GOLD, 0));
  const MOTES = 36;
  const motes = Array.from({ length: MOTES }, (_, i) => ({ s: sprite(disc(), "#ffb52e", 0), a: (i / MOTES) * Math.PI * 2 * 3, p: (i * 0.618) % 1, sp: 0.18 + ((i * 7) % 5) * 0.03 }));
  const light = new THREE.PointLight(new THREE.Color(GOLD), 0, 0.7 * k, 2);
  const G = new THREE.Group(); G.name = "bellyGlow"; G.add(halo, ...bands, ...motes.map(m => m.s), pearl, lustre, light); scene.add(G);
  halo.renderOrder = 10; bands.forEach((s, i) => { s.renderOrder = 11 + i; }); motes.forEach(m => { m.s.renderOrder = 15; }); pearl.renderOrder = 21; lustre.renderOrder = 22;
  let layers = 0, realm = 1, element = null, strength = glowStrength(0), pulseT = -1, vis = 0, want = 0;
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
    const f = layers / LAYERS_PER_FLOOR, brim = layers >= LAYERS_PER_FLOOR ? 1 : 0;
    const form = formFor(realm), col = formColor(realm, element, GOLD);
    const isM = form === "motes", isP = form === "pearl", isB = form === "bead";
    // motes: each layer adds loose specks that spiral in toward the belly; the ninth is a full swirl that brims
    const nMotes = isM ? Math.round(MOTES * (0.25 + 0.75 * f)) : 0;
    motes.forEach((m, i) => {
      const on = i < nMotes, ph = (m.p + t * m.sp) % 1, r = (1 - ph) * 0.16 * k + 0.012 * k, a = m.a + ph * 5;
      m.s.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.9, 0.002);
      m.s.scale.setScalar((0.007 + 0.004 * Math.sin(ph * Math.PI)) * k * (1 + 0.5 * s));
      m.s.material.opacity = on ? e * Math.sin(ph * Math.PI) * (0.7 + 0.3 * f) : 0;
    });
    // the pearl: dense and round; each third of a floor's layers draws one band inside it; the ninth brims
    pearl.material.color.set(isB ? col : "#ffb52e");
    pearl.material.opacity = e * (isP ? Math.min(1, 0.9 + 0.1 * f) : isB ? 0.95 : isM ? (0.25 + 0.45 * f + 0.2 * s) : 0);
    pearl.scale.setScalar(isP ? (0.085 + 0.014 * f + 0.012 * brim + 0.02 * s) * k : isB ? 0.045 * k : (0.025 + 0.02 * f + 0.02 * brim) * k);
    lustre.material.opacity = e * (isB ? 1 : isP ? 0.7 + 0.3 * f : isM ? 0.2 + 0.4 * f : 0);
    lustre.material.color.set(isB ? "#ffffff" : "#fff4d6");
    lustre.scale.setScalar(isB ? 0.075 * k : (0.04 + 0.01 * f) * k);
    const nBands = isP ? Math.max(1, Math.ceil(layers / 3)) : isB ? 1 : 0;
    bands.forEach((b, i) => {
      b.scale.setScalar((0.075 + 0.035 * i + 0.01 * f) * k * (1 + 0.04 * Math.sin(t * 1.4 + i)));
      b.material.color.set(isB ? col : "#e89a14");
      b.material.opacity = i < nBands ? e * (isB ? 0.5 : 0.75 + 0.2 * f) : 0;
    });
    // halo: a soft glow round the pearl; on the bead it is the clear wide halo, in the player's element
    halo.material.color.set(isB ? col : GOLD);
    halo.material.opacity = e * (isB ? 0.45 + 0.25 * f : 0.14 + 0.12 * f + 0.14 * brim + 0.08 * s);
    halo.scale.setScalar((isB ? 0.3 + 0.04 * f : 0.18 + 0.03 * f + 0.05 * brim) * k * (1 + 0.05 * s));
    light.color.set(col);
    light.intensity = e * 0.1 * s;
  }
  let clock = 0;
  place(); draw();
  return {
    get strength() { return strength; },
    get shown() { return vis; },
    get form() { return formFor(realm); },
    introspect(on) { want = on ? 1 : 0; },
    // realm 1..3 picks the form; element is the player's element colour (CSS string), drawn on the upper floor only.
    set(n, { pulse = false, realm: rm = 1, element: el = null } = {}) { layers = Math.max(0, Math.min(LAYERS_PER_FLOOR, n | 0)); realm = Math.max(1, Math.min(REALMS, rm | 0 || 1)); element = el; strength = glowStrength(layers); if (pulse) pulseT = 0; draw(clock); },
    pulseAt(t) { pulseT = t; draw(clock); }, // for stills: a frame part way through the pulse
    showNow(on = true) { want = vis = on ? 1 : 0; draw(clock); }, // for stills: no fade
    update(dt) {
      clock += dt;
      if (pulseT >= 0) { pulseT += dt; if (pulseT > PULSE) pulseT = -1; }
      vis += Math.sign(want - vis) * Math.min(Math.abs(want - vis), dt / FADE);
      place(); draw(clock);
    },
    dispose() { G.removeFromParent(); for (const s of [halo, pearl, lustre, ...bands, ...motes.map(m => m.s)]) s.material.dispose(); },
  };
}

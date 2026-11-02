/* The obstacle at the grey edge, modelled (hollow interface build 2; positions hi4-obstacle-from-the-draw,
   hi4-overcome-becomes-story). Round 4 drew it as things in a place, not as fog: at A6 Pip's hut on the grey strip, with
   the hunters' three lanterns by the door and the door shut; at A8 the spirit made from your charge, in the roots. Each card
   the two of you sent draws one part (encounter-lines.js, 7 cards by 2 encounters), and only the drawn parts stand. A part
   that has given changes in place: the lanterns go downhill, the door opens with its light on the path, the shutters
   swing open, the embers rise. Overcome, the whole place answers (Pip's door open; the spirit settles and grins back).

   assets_here.py (2026-10-31): the paper lanterns are hollow.js `paperLantern`, reused; Pip's hut (set-pip-hut), the
   warden (char-warden-spirit) and the spirit from your charge (char-spirit-from-charge) are briefs with nothing built, so
   each here is a stand-in made in code, small and low, in the room kit's colours, to be swapped when those are built.

   createObstacle() -> { group, update(view, t, dt), anchor(card) (local point a card's thread runs to), box (local corners) }
   view: { enc, cards: [card, card], given: Set(card), overcome } */
import * as THREE from "three";
import { paperLantern } from "./hollow.js";

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
const ease = k => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const GROUND = -0.56;

function ground(color) {
  const g = new THREE.Group();
  const disc = mesh(new THREE.CircleGeometry(1.35, 28), new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.92 }), 0, GROUND, 0.1);
  disc.rotation.x = -Math.PI / 2; disc.scale.set(1, 0.62, 1); g.add(disc);
  return g;
}

/* ---------- A6: Pip's hut on the grey strip ---------- */
function buildA6() {
  const root = new THREE.Group(), parts = {};
  root.add(ground(0x6f6a72));
  const wall = M(0x7a6650), wood = M(0x4a3426), thatch = M(0x8a7a5a), patch = M(0xa89468);
  // the hut: low walls, a pitched roof with a patch, a step; the door is its own part (WAKE-DA-DIPLOMAT)
  const hut = new THREE.Group(); hut.position.set(0, 0, -0.3); root.add(hut);
  hut.add(mesh(new THREE.BoxGeometry(0.92, 0.5, 0.6), wall, 0, GROUND + 0.25, 0));
  const roof = mesh(new THREE.CylinderGeometry(0.02, 0.62, 0.36, 4, 1), thatch, 0, GROUND + 0.68, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.12, 1, 0.8); hut.add(roof);
  const pt = mesh(new THREE.BoxGeometry(0.16, 0.012, 0.13), patch, 0.18, GROUND + 0.66, 0.2); pt.rotation.x = -0.75; hut.add(pt);
  hut.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.14), M(0x8a8478), 0.12, GROUND + 0.025, 0.37)); // the step
  // the door, hinged on its left edge, with the light of the hut behind it
  const glow = mesh(new THREE.PlaneGeometry(0.2, 0.36), new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0.12, GROUND + 0.2, 0.301); hut.add(glow);
  const hinge = new THREE.Group(); hinge.position.set(0.02, GROUND + 0.2, 0.305); hut.add(hinge);
  const door = mesh(new THREE.BoxGeometry(0.2, 0.37, 0.025), wood, 0.1, 0, 0); hinge.add(door);
  hinge.add(mesh(new THREE.SphereGeometry(0.012, 6, 4), M(0xc9a060), 0.17, 0, 0.02));
  const path = mesh(new THREE.PlaneGeometry(0.34, 0.9), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, depthWrite: false }), 0.12, GROUND + 0.006, 0.82);
  path.rotation.x = -Math.PI / 2; hut.add(path);
  parts["WAKE-DA-DIPLOMAT"] = { obj: hinge, always: true, anchor: new THREE.Vector3(0.12, GROUND + 0.42, 0.0),
    set(k) { hinge.rotation.y = lerp(0, -1.35, k); path.material.opacity = 0.5 * k; } };
  // the shutters over the window, closed the way they were last winter
  const win = mesh(new THREE.PlaneGeometry(0.2, 0.17), new THREE.MeshBasicMaterial({ color: 0x2a2018 }), -0.24, GROUND + 0.3, 0.302); hut.add(win);
  const sh = [-1, 1].map(sx => { const h = new THREE.Group(); h.position.set(-0.24 + sx * 0.1, GROUND + 0.3, 0.31); h.add(mesh(new THREE.BoxGeometry(0.1, 0.18, 0.015), wood, -sx * 0.05, 0, 0)); hut.add(h); return [h, sx]; });
  parts["WAKE-GR-SAGE"] = { obj: sh[0][0], anchor: new THREE.Vector3(-0.24, GROUND + 0.4, 0.0),
    set(k) { for (const [h, sx] of sh) h.rotation.y = sx * lerp(0, 1.45, k); win.material.color.setHex(k > 0.5 ? 0xffc070 : 0x2a2018); } };
  // the empty water jar at Pip's step, on its side
  const jar = new THREE.Group(); jar.position.set(0.4, GROUND, 0.12); root.add(jar);
  const jp = []; for (let i = 0; i <= 8; i++) { const u = i / 8; jp.push(new THREE.Vector2(0.06 * (0.55 + Math.sin(u * Math.PI) * 0.6) * (u > 0.85 ? 0.75 : 1), u * 0.16)); }
  const jb = mesh(new THREE.LatheGeometry(jp, 12), M(0xa8603a)); jar.add(jb);
  const water = mesh(new THREE.CircleGeometry(0.042, 12), new THREE.MeshStandardMaterial({ color: 0x5a8fc4, emissive: 0x3a6fa4, emissiveIntensity: 0.6 }), 0, 0.145, 0); water.rotation.x = -Math.PI / 2; jar.add(water);
  parts["WAKE-GR-SHAMAN"] = { obj: jar, anchor: new THREE.Vector3(0.4, GROUND + 0.16, 0.12),
    set(k) { jb.rotation.z = lerp(1.35, 0, k); jb.position.set(lerp(0.07, 0, k), lerp(0.05, 0, k), 0); water.visible = k > 0.6; } };
  // the warden spirit circling the hut, that nobody mentions
  const warden = new THREE.Group(); root.add(warden);
  const wb = mesh(new THREE.IcosahedronGeometry(0.13, 1), M(0xa8b4c8, { emissive: 0x2a2838, emissiveIntensity: 0.5 }), 0, 0, 0); warden.add(wb);
  const tail = mesh(new THREE.ConeGeometry(0.05, 0.16, 6), M(0x8d8a9a, { transparent: true, opacity: 0.7 }), 0, -0.02, -0.12); tail.rotation.x = -Math.PI / 2; warden.add(tail);
  for (const sx of [-1, 1]) warden.add(mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), sx * 0.05, 0.03, 0.12));
  parts["WAKE-RA-SHAMAN"] = { obj: warden, anchor: new THREE.Vector3(),
    set(k, t) {
      const a = t * 0.7, circ = new THREE.Vector3(Math.sin(a) * 0.78, GROUND + 0.42 + Math.sin(t * 2) * 0.03, -0.3 + Math.cos(a) * 0.52);
      const sit = new THREE.Vector3(-0.32, GROUND + 0.14, 0.32);
      warden.position.lerpVectors(circ, sit, k); warden.rotation.y = lerp(a + Math.PI / 2, 0, k);
      tail.visible = k < 0.5; wb.material.emissive.setHex(k > 0.5 ? 0x3a8a80 : 0x2a2838);
      this.anchor.copy(warden.position).y += 0.1;
    } };
  // the hunters' camp, a little closer every night
  const camp = new THREE.Group(); root.add(camp);
  const tent = mesh(new THREE.ConeGeometry(0.22, 0.3, 4), M(0x9a8a6a), 0, 0.15, 0); tent.rotation.y = Math.PI / 4; camp.add(tent);
  camp.add(mesh(new THREE.PlaneGeometry(0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0x1a1210 }), 0, 0.08, 0.157));
  const fire = mesh(new THREE.ConeGeometry(0.045, 0.1, 6), new THREE.MeshBasicMaterial({ color: 0xffa040 }), 0.2, 0.05, 0.16); camp.add(fire);
  parts["WAKE-RA-SAGE"] = { obj: camp, anchor: new THREE.Vector3(),
    set(k, t) { camp.position.set(lerp(0.92, 1.35, k), lerp(GROUND, GROUND - 0.2, k), lerp(0.3, -0.75, k)); camp.scale.setScalar(lerp(1, 0.6, k)); fire.scale.y = 0.8 + Math.sin(t * 9) * 0.2; this.anchor.copy(camp.position).y += 0.3; } };
  // the hunters' three lanterns by Pip's door (hollow.js paperLantern, reused), on poles
  const lan = new THREE.Group(); root.add(lan);
  const LP = [[0.4, 0.34], [0.62, 0.22], [0.3, 0.52]];
  const lans = LP.map(([x, z], i) => { const l = paperLantern(0xffb860, 1.1); l.scale.setScalar(0.42); const pole = mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.2, 5), M(0x3e2c1e), 0, -0.1, 0); const g = new THREE.Group(); g.add(pole); l.position.y = 0; g.add(l); lan.add(g); return { g, x, z, i }; });
  parts["WAKE-DA-REGENT"] = { obj: lan, anchor: new THREE.Vector3(),
    set(k) {
      for (const L of lans) L.g.position.set(lerp(L.x, 1.05 + L.i * 0.14, k), lerp(GROUND + 0.2, GROUND - 0.08, k), lerp(L.z, -0.55 - L.i * 0.12, k));
      this.anchor.copy(lans[0].g.position).y += 0.26;
    } };
  // the hunters who will not say why they came: two hooded figures, backs turned, a wrapped bundle between them
  const hunters = new THREE.Group(); hunters.position.set(-0.9, GROUND, 0.25); root.add(hunters);
  const cloak = M(0x4a4038), hood = M(0x3a322c);
  const hs = [[-0.12, 0], [0.12, 0.06]].map(([x, z]) => { const h = new THREE.Group(); h.position.set(x, 0, z); h.add(mesh(new THREE.ConeGeometry(0.08, 0.3, 7), cloak, 0, 0.15, 0)); h.add(mesh(new THREE.SphereGeometry(0.055, 8, 6), hood, 0, 0.33, 0)); hunters.add(h); return h; });
  const bundle = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.07), M(0x6a5a40, { emissive: 0xffb050, emissiveIntensity: 0 }), 0, 0.1, 0.1); hunters.add(bundle);
  parts["WAKE-RA-CHALLENGER"] = { obj: hunters, anchor: new THREE.Vector3(-0.9, GROUND + 0.4, 0.25),
    set(k) { hunters.rotation.y = lerp(Math.PI, 0.35, k); bundle.material.emissiveIntensity = 1.4 * k; for (const h of hs) h.children[1].position.y = 0.33; } };
  return { root, parts };
}

/* ---------- A8: the spirit made from your own charge, in the roots ---------- */
function buildA8() {
  const root = new THREE.Group(), parts = {};
  root.add(ground(0x4a3a30));
  const rootMat = M(0x5a4030);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, r = mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.6, 5), rootMat, Math.sin(a) * 0.3, GROUND + 0.04, -0.1 + Math.cos(a) * 0.22); r.rotation.set(Math.PI / 2 - 0.12, 0, -a); root.add(r); }
  const spirit = new THREE.Group(); spirit.scale.setScalar(1.25); root.add(spirit);
  const bodyMat = M(0x5a3a6a, { emissive: 0x2a1238, emissiveIntensity: 0.6 });
  const body = mesh(new THREE.IcosahedronGeometry(0.26, 1), bodyMat, 0, 0, 0); body.scale.set(1, 1.15, 0.9); spirit.add(body);
  const eyes = [-1, 1].map(sx => { const e = mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa050 }), sx * 0.1, 0.08, 0.25); spirit.add(e); return e; });
  const grin = mesh(new THREE.TorusGeometry(0.1, 0.024, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd08a }), 0, -0.03, 0.262); grin.rotation.z = Math.PI; grin.visible = false; spirit.add(grin);
  const home = new THREE.Vector3(0, GROUND + 0.32, -0.1);
  let walk = 0, settle = 0;
  // the embers it hoards in the roots
  const embers = new THREE.Group(); root.add(embers);
  const em = Array.from({ length: 7 }, (_, i) => { const m = mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true }), 0, 0, 0); m.userData.a = i / 7 * Math.PI * 2; embers.add(m); return m; });
  parts["WAKE-GR-SHAMAN"] = { obj: embers, anchor: new THREE.Vector3(0.28, GROUND + 0.08, 0.22),
    set(k, t) { em.forEach((m, i) => { const a = m.userData.a; m.position.set(0.28 + Math.cos(a) * lerp(0.07, 0.5, k), GROUND + 0.04 + k * (0.5 + (i % 3) * 0.18) + Math.sin(t * 2 + i) * 0.02 * k, 0.22 + Math.sin(a) * lerp(0.05, 0.3, k)); m.material.opacity = lerp(1, 0.55, k); m.material.color.setHex(k > 0.5 ? 0xffd08a : 0xff8a3a); }); } };
  // the old hunger in its shape: its shadow, much bigger than it, on the dark behind
  const shadow = mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0x0c0810, transparent: true, opacity: 0.55, depthWrite: false }), 0, GROUND + 0.6, -0.55); shadow.scale.set(1, 1.5, 1); root.add(shadow);
  parts["WAKE-GR-SAGE"] = { obj: shadow, anchor: new THREE.Vector3(-0.32, GROUND + 0.9, -0.5),
    set(k) { const s = lerp(1, 0.45, k); shadow.scale.set(s, 1.5 * s, 1); shadow.position.y = GROUND + lerp(0.6, 0.35, k); shadow.material.opacity = lerp(0.55, 0.2, k); this.anchor.set(-0.32 * s - 0.05, GROUND + lerp(0.9, 0.5, k), -0.5); } };
  // what it does when no one looks: a small thing kept behind it, brought out
  const secret = mesh(new THREE.OctahedronGeometry(0.055, 0), new THREE.MeshStandardMaterial({ color: 0xb08ad0, emissive: 0x7a4aa0, emissiveIntensity: 1 }), 0, 0, 0); root.add(secret);
  parts["WAKE-RA-SHAMAN"] = { obj: secret, anchor: new THREE.Vector3(),
    set(k, t) { secret.position.set(lerp(0.2, 0.36, k) + spirit.position.x, lerp(GROUND + 0.28, GROUND + 0.1, k), lerp(-0.42, 0.3, k)); secret.rotation.y = t; this.anchor.copy(secret.position).y += 0.06; } };
  // the circle it keeps walking, worn into the ground
  const ring = mesh(new THREE.RingGeometry(0.58, 0.66, 40), new THREE.MeshBasicMaterial({ color: 0x2a1e18, transparent: true, opacity: 0.85, depthWrite: false }), 0, GROUND + 0.005, -0.05); ring.rotation.x = -Math.PI / 2; root.add(ring);
  parts["WAKE-RA-SAGE"] = { obj: ring, anchor: new THREE.Vector3(0.62, GROUND + 0.02, -0.05), walks: true,
    set(k) { ring.material.opacity = lerp(0.85, 0.12, k); walk = 1 - k; } };
  // the fight it picked with everything: bristles all round it
  const spikes = new THREE.Group(); spirit.add(spikes);
  const spMat = M(0xc0402a, { emissive: 0x902010, emissiveIntensity: 0.8 });
  const dirs = []; for (let i = 0; i < 14; i++) { const y = 1 - (i + 0.5) / 14 * 2, r = Math.sqrt(1 - y * y), a = i * 2.4; dirs.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  const sps = dirs.map(d => { const c = mesh(new THREE.ConeGeometry(0.035, 0.16, 5), spMat); c.position.copy(d).multiplyScalar(0.27); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); spikes.add(c); return c; });
  parts["WAKE-DA-REGENT"] = { obj: spikes, anchor: new THREE.Vector3(),
    set(k) { for (const c of sps) c.scale.set(1, lerp(1, 0.25, k), 1); spMat.color.setHex(k > 0.5 ? 0x8a6a5a : 0xc0402a); spMat.emissiveIntensity = lerp(0.8, 0.05, k); this.anchor.copy(spirit.position).y += 0.38; } };
  // the small spirits sheltering behind it
  const smalls = Array.from({ length: 3 }, (_, i) => { const s = mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9ad8cf, emissive: 0x3a8a80, emissiveIntensity: 0.8 }), 0, 0, 0); root.add(s); return s; });
  parts["WAKE-DA-DIPLOMAT"] = { obj: smalls[0], anchor: new THREE.Vector3(),
    set(k, t) { smalls.forEach((s, i) => { const bx = (i - 1) * 0.14, fx = (i - 1) * 0.42 + (i === 1 ? 0.5 : 0); s.position.set(lerp(bx, fx, k), GROUND + 0.06 + Math.abs(Math.sin(t * 3 + i)) * 0.04 * k, lerp(-0.45, 0.32, k)); s.visible = true; }); this.anchor.copy(smalls[0].position).y += 0.08; } };
  // the name it will not say: a blank tag on a cord above it, lit when it is said
  const tagTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 96; const x = c.getContext("2d"); x.fillStyle = "#efe2c4"; x.fillRect(0, 0, 64, 96); x.strokeStyle = "#9a5a8e"; x.lineWidth = 6; x.beginPath(); x.moveTo(18, 30); x.quadraticCurveTo(46, 40, 22, 56); x.quadraticCurveTo(48, 66, 32, 78); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const tag = new THREE.Group(); root.add(tag);
  tag.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), M(0x7a5236), 0, 0.11, 0));
  const card = mesh(new THREE.PlaneGeometry(0.1, 0.15), new THREE.MeshBasicMaterial({ color: 0x8a8070, side: THREE.DoubleSide }), 0, -0.07, 0); tag.add(card);
  parts["WAKE-RA-CHALLENGER"] = { obj: tag, anchor: new THREE.Vector3(),
    set(k, t) { tag.position.set(spirit.position.x - 0.32, GROUND + 0.88, spirit.position.z + 0.1); tag.rotation.z = Math.sin(t * 1.3) * 0.08; const lit = k > 0.5; if (card.userData.lit !== lit) { card.userData.lit = lit; card.material.map = lit ? tagTex : null; card.material.color.setHex(lit ? 0xffffff : 0x8a8070); card.material.needsUpdate = true; } this.anchor.copy(tag.position).y -= 0.06; } };
  function tick(t, overcomeK) {
    settle = overcomeK;
    const a = t * 0.55 * walk;
    spirit.position.set(home.x + Math.sin(t * 0.55) * 0.62 * walk, home.y + Math.sin(t * 1.6) * 0.015 * (1 - settle), home.z + (Math.cos(t * 0.55) * 0.62 - 0) * walk);
    spirit.rotation.y = walk > 0.01 ? t * 0.55 + Math.PI / 2 : lerp(spirit.rotation.y, 0, 0.1);
    body.material.color.setHex(settle > 0.5 ? 0x8a5a6a : 0x5a3a6a); body.material.emissive.setHex(settle > 0.5 ? 0x6a3a20 : 0x2a1238);
    for (const e of eyes) e.material.color.setHex(settle > 0.5 ? 0xffe2a8 : 0xffa050);
    grin.visible = settle > 0.5; void a;
  }
  return { root, parts, tick };
}

export function createObstacle() {
  const group = new THREE.Group();
  const sets = { a6: buildA6(), a8: buildA8() };
  for (const s of Object.values(sets)) { s.root.visible = false; group.add(s.root); for (const p of Object.values(s.parts)) p.k = 0; }
  let overK = 0, lastT = performance.now() / 1000;
  function update(view) {
    const t = performance.now() / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
    for (const [e, s] of Object.entries(sets)) s.root.visible = e === view.enc;
    const S = sets[view.enc]; if (!S) return;
    const drawn = new Set(view.cards.filter(Boolean)), given = view.given || new Set();
    overK += ((view.overcome ? 1 : 0) - overK) * Math.min(1, dt * 1.6);
    for (const [card, p] of Object.entries(S.parts)) {
      const on = drawn.has(card) || p.always;
      p.obj.visible = on;
      const want = given.has(card) || view.overcome ? 1 : 0;
      p.k += (want - p.k) * Math.min(1, dt * 1.4);
      if (!on && !p.walks) continue;
      if (p.walks && !drawn.has(card)) { p.obj.visible = false; p.set.call(p, 1, t); continue; }
      p.set.call(p, ease(Math.min(1, p.k)), t);
    }
    if (S.tick) S.tick(t, ease(overK));
  }
  const anchor = (enc, card) => { const S = sets[enc]; const p = S && S.parts[card]; return p ? p.anchor : new THREE.Vector3(0, 0.3, 0); };
  return { group, update, anchor, box: [[-1.35, GROUND, 1.45], [1.35, GROUND, 1.45], [-1.35, 0.95, -0.6], [1.35, 0.95, -0.6]] };
}

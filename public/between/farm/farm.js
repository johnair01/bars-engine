// BARs farm, slice one (bars-farm T004/T005, round 3 look). Rules live on the server (src/lib/between/farm.ts); this page draws the farm
// doc from GET /api/between/farm and sends one act at a time. Style: one toon ramp, from the stills' make/farm.js (council 2026-11-09-farm-3).
import * as THREE from 'three';

const COLS = 14, ROWS = 11, STEP = 0.9, SLOTS = COLS * ROWS, GROW = 7;
const Q = new URLSearchParams(location.search);
const pad = n => String(n).padStart(2, '0');
const localDay = () => { if (/^\d{4}-\d{2}-\d{2}$/.test(Q.get('today') || '')) return Q.get('today'); const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; const rr = (a, b) => a + (b - a) * rnd();
const sx = c => (c - (COLS - 1) / 2) * STEP, sz = r => (r - (ROWS - 1) / 2) * STEP;
const slotXZ = i => [sx(i % COLS), sz(Math.floor(i / COLS))];
const $ = id => document.getElementById(id);

const PAL = { grass: '#86b84f', grassDeep: '#6fa13f', mown: '#a9cf66', soil: '#7a4a2c', soilTop: '#8d5a35', soilWet: '#5a3722', weed: '#7d9a3a', weedDark: '#4f7a2e', weedDry: '#b5a24a',
  bark: '#7a5a3c', leafA: '#5f9e45', leafB: '#7cbb52', pod: '#f2c544', podHi: '#ffe9a0', seed: '#fff6d8', wood: '#b07c4c', woodDark: '#7c5232', hill: '#9cc76a', portal: '#ffd99a', skin: '#c98f63', wrap: '#e9dcc0', cloth: '#7a6a45', ring: '#fff2c0' };
const ramp = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 140, 200, 255]), 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: new THREE.Color(c), gradientMap: ramp, ...o });
const glow = (c, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), ...o });
const mesh = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };

// ---------- renderer, light, day and night from the player's local time (FR-012) ----------
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: !!Q.get('shot') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
const sun = new THREE.DirectionalLight('#fff4dc', 2.2); sun.position.set(-8, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); scene.add(sun);
const hemi = new THREE.HemisphereLight('#dff1ff', '#6a8a45', 1.0); scene.add(hemi);
function dayLight() {
  const h = Q.get('hour') != null ? +Q.get('hour') : new Date().getHours() + new Date().getMinutes() / 60;
  const k = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)), dusk = Math.max(0, 1 - Math.abs(k - 0.1) * 5) * (k < 0.35 ? 1 : 0);   // k: 0 at night, 1 at noon
  const sky = new THREE.Color('#1c2740').lerp(new THREE.Color('#cfe8f3'), Math.min(1, k * 1.6)).lerp(new THREE.Color('#f2b27a'), dusk * 0.6);
  scene.background = sky; scene.fog = new THREE.Fog(sky, 30, 70);
  sun.intensity = 0.25 + 2 * k; hemi.intensity = 0.35 + 0.7 * k; sun.position.x = -8 + 16 * ((h - 6) / 12);
}
dayLight();

// ---------- ground ----------
{ const g = new THREE.PlaneGeometry(120, 120, 120, 120); g.rotateX(-Math.PI / 2); const P = g.attributes.position, C = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), r = Math.hypot(x, z * 1.1); let y = r > 16 ? Math.pow((r - 16) / 10, 1.6) * 2.2 : 0; P.setY(i, y);
    c.set(PAL.grass).lerp(new THREE.Color(PAL.grassDeep), 0.6 * (0.5 + 0.5 * Math.sin(x * 0.7 + Math.sin(z * 0.9)))); if (Math.abs(x) < COLS * STEP / 2 && Math.abs(z) < ROWS * STEP / 2) c.lerp(new THREE.Color(PAL.mown), 0.3);
    if (r > 18) c.lerp(new THREE.Color(PAL.hill), Math.min(1, (r - 18) / 8)); C.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals(); const m = mesh(g, toon('#ffffff', { vertexColors: true }), false); m.name = 'ground'; scene.add(m); }
const groundPlane = new THREE.Plane(V(0, 1, 0), 0);
// trees and a fence line at the far edge
function tree(x, z, s = 1) { const G = new THREE.Group(); { const tr = mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 1.6 * s, 7), toon(PAL.bark)); tr.position.set(0, 0.8 * s, 0); G.add(tr); }
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.IcosahedronGeometry(rr(0.8, 1.15) * s, 2), toon([PAL.leafA, PAL.leafB, '#4f8a3a'][i % 3])); b.position.set(rr(-0.6, 0.6) * s, (1.9 + rr(0, 0.9)) * s, rr(-0.6, 0.6) * s); G.add(b); } G.position.set(x, 0, z); scene.add(G); }
for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + 0.8 * i / 8) + Math.PI; tree(Math.cos(a) * 12 + rr(-1, 1), Math.sin(a) * 9 - 1 + rr(-1, 1), rr(0.9, 1.4)); }
tree(-11, 2, 1.3); tree(11.5, 1, 1.2);
// the stream at the west edge, and the portal on its bank (level-designer role, 2026-11-09: "the portal and stream sit
// at the west edge; the portal is the entrance from the hollow"). The stills put the water there; the field code did not.
const STREAM_X = -7.6;
{ const pts = []; for (let z = -14; z <= 14; z += 2) pts.push(V(STREAM_X + Math.sin(z * 0.22) * 0.5, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts); const N = 90, pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = curve.getPoint(t), tan = curve.getTangent(t); const nx = -tan.z, nz = tan.x;
    pos.push(p.x + nx * 0.75, 0.02, p.z + nz * 0.75, p.x - nx * 0.75, 0.02, p.z - nz * 0.75);
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const water = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#62bfd6', roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.9 }));
  water.receiveShadow = true; water.name = 'stream'; scene.add(water);
  for (let i = 0; i < 14; i++) { const t = i / 13, p = curve.getPoint(t); const st = mesh(new THREE.IcosahedronGeometry(rr(0.12, 0.26), 0), toon('#9aa3a8')); st.position.set(p.x + rr(-1.1, 1.1), 0.06, p.z + rr(-0.6, 0.6)); scene.add(st); } }

// the portal back to the hollow, on the stream's bank at the west edge
const portal = new THREE.Group();
{ const curve = new THREE.CatmullRomCurve3([V(-1, 0, 0), V(-1.1, 1.2, 0), V(-.6, 2.2, 0), V(0, 2.5, 0), V(.6, 2.2, 0), V(1.1, 1.2, 0), V(1, 0, 0)]);
  portal.add(mesh(new THREE.TubeGeometry(curve, 40, 0.16, 8), toon(PAL.bark))); const inner = mesh(new THREE.CircleGeometry(1, 24), glow(PAL.portal, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }), false); inner.scale.set(0.95, 1.2, 1); inner.position.y = 1.25; portal.add(inner);
  portal.position.set(STREAM_X + 1.5, 0, 2.2); portal.rotation.y = Math.PI / 2; scene.add(portal); }

// ---------- the slots ----------
const slotGroup = new THREE.Group(); scene.add(slotGroup);
const tuft = (x, z, s = 1, dry = 0) => { const G = new THREE.Group(); const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) { const h = rr(0.08, 0.18) * s, b = mesh(new THREE.ConeGeometry(rr(0.022, 0.04) * s, h, 4), toon(rnd() < dry ? PAL.weedDry : rnd() < 0.5 ? PAL.weed : PAL.weedDark), false); b.position.set(rr(-0.1, 0.1) * s, h / 2, rr(-0.1, 0.1) * s); b.rotation.set(rr(-0.4, 0.4), rr(0, 6), rr(-0.4, 0.4)); G.add(b); }
  G.position.set(x, 0.02, z); return G; };   // low: never taller than the sprout (his round 3 note)
const slabGeo = new THREE.BoxGeometry(STEP * 0.86, 0.1, STEP * 0.86);
function leafy(h, n) { const G = new THREE.Group(); const st = mesh(new THREE.CylinderGeometry(0.02, 0.03, h, 6), toon(PAL.leafA)); st.position.y = h / 2; G.add(st);
  for (let i = 0; i < n; i++) { const l = mesh(new THREE.SphereGeometry(0.08, 8, 6), toon(i % 2 ? PAL.leafB : PAL.leafA)); l.scale.set(1.7, 0.3, 0.75); const a = i * 2.4; l.position.set(Math.cos(a) * 0.1, 0.1 + (h - 0.1) * (i / Math.max(1, n)), Math.sin(a) * 0.1); l.rotation.y = -a; l.rotation.z = 0.35; G.add(l); } return G; }
function plantMesh(p) { const d = p.tendedDays; const G = new THREE.Group();
  if (p.ripe) { const g = leafy(0.7, 6); G.add(g); const pod = mesh(new THREE.SphereGeometry(0.11, 14, 10), toon(PAL.pod, { emissive: new THREE.Color('#5a3f00') })); pod.scale.set(0.85, 1.25, 0.85); pod.position.y = 0.82; G.add(pod);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), glow(PAL.podHi, { transparent: true, opacity: 0.35, depthWrite: false })); halo.position.y = 0.82; G.add(halo); }
  else if (d === 0) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), glow(PAL.seed)); s.scale.set(.8, 1.2, .8); s.position.y = 0.14; G.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), glow('#fff2c0', { transparent: true, opacity: 0.35, depthWrite: false })); h.position.y = 0.14; G.add(h); }
  else G.add(leafy(0.14 + d * 0.08, 2 + d));
  return G; }
let FARM = null, SEL = null, selRing = null, first = false;
const slotObjs = {};
const weedSlots = (() => { const s = new Set(); while (s.size < 32) s.add(Math.floor(rnd() * SLOTS)); return s; })();   // wild tufts on untilled grass, so every slot reads as land to be tilled
function drawSlots() {
  for (const k in slotObjs) slotGroup.remove(slotObjs[k]); for (const k in slotObjs) delete slotObjs[k];
  for (let i = 0; i < SLOTS; i++) { const G = new THREE.Group(), [x, z] = slotXZ(i), s = FARM.slots[i]; G.position.set(x, 0, z);
    if (!s) { if (weedSlots.has(i)) G.add(tuft(rr(-0.2, 0.2), rr(-0.2, 0.2), rr(0.8, 1.2))); }
    else { const sl = mesh(slabGeo, toon(PAL.soil)); sl.position.y = 0.05; G.add(sl);
      for (let f = 0; f < 3; f++) { const r = mesh(new THREE.CapsuleGeometry(0.06, STEP * 0.55, 3, 8), toon(PAL.soilTop), false); r.rotation.z = Math.PI / 2; r.scale.set(1, 1, 0.55); r.position.set(0, 0.12, (f - 1) * 0.25); G.add(r); }
      if (s.plant) { const pm = plantMesh(s.plant); pm.position.y = 0.1; G.add(pm); }
      if (s.state === 'weeded') for (let t = 0; t < 4; t++) G.add(tuft(rr(-0.3, 0.3), rr(-0.3, 0.3), 1.1, 0.3)); }
    slotGroup.add(G); slotObjs[i] = G; }
  const done = Object.values(FARM.slots).filter(s => s.plant).length; $('stats').textContent = `${FARM.mana} mana · ${done} planted`;
}

// ---------- the cultivator: work clothes, a hoe, walking and a swing ----------
const avatar = new THREE.Group(); const arm = new THREE.Group(); let hoe;
{ const body = mesh(new THREE.CapsuleGeometry(0.17, 0.55, 4, 10), toon(PAL.wrap)); body.position.y = 0.85; avatar.add(body);
  const tunic = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.34, 10), toon(PAL.cloth)); tunic.position.y = 0.62; avatar.add(tunic);
  const head = mesh(new THREE.SphereGeometry(0.15, 14, 10), toon(PAL.skin)); head.position.y = 1.42; avatar.add(head);
  for (const k of [-1, 1]) { const leg = mesh(new THREE.CapsuleGeometry(0.06, 0.4, 3, 8), toon(PAL.wrap)); leg.position.set(k * 0.09, 0.28, 0); avatar.add(leg); }
  arm.position.set(0.2, 1.15, 0); hoe = new THREE.Group(); const shaft = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), toon(PAL.wood)); shaft.position.set(0, -0.2, 0.3); shaft.rotation.x = 0.9; hoe.add(shaft);
  const blade = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1), toon('#8a8f98')); blade.position.set(0, -0.62, 0.62); hoe.add(blade); arm.add(hoe);
  const a = mesh(new THREE.CapsuleGeometry(0.05, 0.3, 3, 8), toon(PAL.skin)); a.position.set(0, -0.1, 0.05); arm.add(a); avatar.add(arm); }
scene.add(avatar); avatar.position.set(0, 0, 6.6); avatar.rotation.y = Math.PI;
let goal = null, faceTo = null, swing = 0, bob = 0;
function walkTo(i) { const [x, z] = slotXZ(i); const d = V(avatar.position.x - x, 0, avatar.position.z - z); if (d.length() < 0.01) d.set(0, 0, 1); d.setLength(0.85); goal = V(x + d.x, 0, z + d.z); faceTo = V(x, 0, z); }

selRing = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.42, 28), glow(PAL.ring, { transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); selRing.rotation.x = -Math.PI / 2; selRing.visible = false; scene.add(selRing);

// ---------- camera: follows the avatar from behind and above; the deepen view moves in beside the plant ----------
let deep = null, camT = 0;
const camPos = V(0, 7, 13), camLook = V(0, 0.5, 2);
function frame(dt) {
  let wantP, wantL;
  if (deep != null) { const [x, z] = slotXZ(deep); const far = innerWidth < 700; wantP = V(x - (far ? 0.9 : 0.35), far ? 1.5 : 1.0, z + (far ? 5.2 : 2.6)); wantL = V(x - (far ? 0.3 : -0.25), 0.55, z); }
  else { const p = avatar.position; wantP = V(p.x * 0.6, 6.2, p.z + 7.5); wantL = V(p.x * 0.6, 0.4, p.z - 2); }
  const k = 1 - Math.pow(0.002, dt); camPos.lerp(wantP, k); camLook.lerp(wantL, k); camera.position.copy(camPos); camera.lookAt(camLook);
  const w = innerWidth, h = innerHeight; camera.aspect = w / h;
  if (deep != null && w > 700) camera.setViewOffset(w, h, w * 0.05, 0, w, h); else if (deep != null) camera.setViewOffset(w, h, 0, h * 0.26, w, h); else camera.clearViewOffset();   // the plant sits left of centre, clear of the card on the right
  camera.updateProjectionMatrix();
}
function resize() { renderer.setSize(innerWidth, innerHeight); } addEventListener('resize', resize); resize();

// ---------- the deepen view: the plant, the Protector beside it, a card for today's line ----------
let spiritP = null, spiritObj = null; const deepGroup = new THREE.Group(); scene.add(deepGroup);
const spiritForms = () => window.__oagSpiritForms ? Promise.resolve(window.__oagSpiritForms) : (spiritP = spiritP || new Promise(res => { const s = document.createElement('script'); s.src = '/ontology-game/cave/spirit-forms.js'; s.onload = () => res(window.__oagSpiritForms || null); s.onerror = () => res(null); document.head.appendChild(s); }));
function tag(x, y, z, lines) {   // a paper tag; its stake ends at the tag's bottom edge so it never crosses the words
  const c = document.createElement('canvas'); c.width = 320; c.height = 150; const g = c.getContext('2d'); g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, 320, 150); g.strokeStyle = '#b8261a'; g.lineWidth = 8; g.strokeRect(5, 5, 310, 140); g.fillStyle = '#2a1a12'; g.textAlign = 'center';
  lines.forEach((l, i) => { g.font = (i === 0 ? 'italic 40px' : 'bold 34px') + ' Georgia'; g.fillText(l, 160, (lines.length === 1 ? 88 : 64) + i * 48); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const H = 0.3, m = new THREE.Mesh(new THREE.PlaneGeometry(0.64, H), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false })); m.position.set(x, y, z);
  const bottom = y - H / 2, st = mesh(new THREE.CylinderGeometry(0.012, 0.012, bottom, 5), toon(PAL.woodDark), false); st.position.set(x, bottom / 2, z); const G = new THREE.Group(); G.add(m, st); return G; }
async function spirit(daemon, colour, x, z, hgt, hover = 0, stage = 'creature') {
  const SF = await spiritForms(); if (!SF) return null;
  try { const root = SF.buildForm(THREE, daemon, colour, { stage: 'gas' }); if (stage !== 'gas') await root.userData.unfold(stage, false);
    root.traverse(o => { if (o.isMesh && o.material && o.material.isMeshLambertMaterial) { const m = o.material; const n = toon('#ffffff', { color: m.color.clone(), vertexColors: m.vertexColors, transparent: m.transparent, opacity: m.opacity, side: m.side }); if (m.onBeforeCompile) n.onBeforeCompile = m.onBeforeCompile; o.material = n; } });
    root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(root), sz = bb.getSize(V()); const sc = hgt / Math.max(sz.y, 1e-3); root.scale.multiplyScalar(sc); root.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(root); root.position.set(x, hover - b2.min.y, z); root.lookAt(camera.position.x, root.position.y, camera.position.z); return root; } catch (e) { console.warn('spirit', e); return null; } }
async function openDeepen(i) {
  const s = FARM.slots[i]; if (!s || !s.plant) return; deep = i; SEL = i; renderCard(); const [x, z] = slotXZ(i);
  deepGroup.clear(); const sp = await spirit('protector', 0x4a78c8, x - 0.85, z + 0.2, 0.8); if (deep !== i) return;
  if (sp) { deepGroup.add(sp); const R = 0.62, bub = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 14), glow('#cfe8ff', { transparent: true, opacity: 0.18, depthWrite: false })); bub.position.set(x - 0.85, R * 0.95, z + 0.2); deepGroup.add(bub); }
  else say('The Protector could not be drawn here; the plant is still listening.');
}
function closeDeepen() { deep = null; deepGroup.clear(); renderCard(); }
// spirits in the field: a cloud over a patch gone to weeds, tagged, waiting for the player's line
async function fieldSpirits() { const w = Object.entries(FARM.slots).find(([, s]) => s.state === 'weeded'); if (!w) return; const [x, z] = slotXZ(+w[0]);
  const sp = await spirit('skeptic', 0xb89a3a, x, z, 1.0, 0.35, 'gas'); if (sp) deepGroup.add(sp); const t = tag(x + 0.9, 1.2, z - 0.2, [w[1].plant.line.slice(0, 18), 'the Skeptic']); t.lookAt(camera.position.x, 1.2, camera.position.z); t.rotation.x = 0; deepGroup.add(t); }

// ---------- the card and the acts ----------
const card = $('card'), cap = $('cap'); let capT;
function say(t, ms = 5000) { cap.textContent = t; cap.classList.add('on'); clearTimeout(capT); capT = setTimeout(() => cap.classList.remove('on'), ms); }
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function api(body) {
  const r = await fetch('/api/between/farm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ today: localDay(), ...body }) }); const j = await r.json().catch(() => ({}));
  if (!r.ok) { say(j.error || 'That did not work'); if (j.farm) { FARM = j.farm; drawSlots(); } return null; } FARM = j.farm; drawSlots(); return j; }
async function act(name, extra = {}) {
  if (name === 'till' || name === 'plant' || name === 'water') { swing = 1; }
  const j = await api({ act: name, i: SEL, ...extra }); if (!j) return; if (name === 'pick') say('Picked. A harvest BAR and one vibeulon.'); else if (j.mint) say('One vibeulon minted.'); renderCard(); }
function renderCard() {
  if (SEL == null) { card.hidden = true; return; } const s = FARM.slots[SEL], p = s && s.plant; card.hidden = false; card.className = 'card' + (deep != null ? ' deepen' : '');
  const inp = (id, ph) => `<div class="row"><input id="${id}" maxlength="280" placeholder="${ph}" aria-label="${ph}"></div>`; let h = '';
  if (!s) h = `<h2>Grass</h2><p>Swing the hoe to make this slot soil.</p><div class="row"><button id="b-till" ${FARM.mana < 5 ? 'disabled' : ''}>Till it · 5 mana</button><button class="alt" id="b-x">Close</button></div>`;
  else if (s.state === 'tilled') h = `<h2>Soil</h2><p>Plant a BAR as a seed, with one line (one word is enough).</p>${inp('f-bar', 'The BAR to plant')}${inp('f-line', 'What you want from it')}<div class="row"><button id="b-plant">Kneel and plant</button><button class="alt" id="b-x">Close</button></div>`;
  else if (s.state === 'weeded') h = `<h2>${esc(p.line)}</h2><p>Weeds have crept over it. Your ${p.tendedDays} tended days wait underneath.</p>${inp('f-line', 'What kept you away?')}<div class="row"><button id="b-reclear" ${FARM.mana < 1 ? 'disabled' : ''}>Clear the weeds · 1 mana</button><button class="alt" id="b-x">Close</button></div>`;
  else if (p.ripe) h = `<h2>${esc(p.line)}</h2><p>Full. Ready to pick.</p><div class="row"><button id="b-pick">Pick it</button><button class="alt" id="b-deep">Look closer</button><button class="alt" id="b-x">Close</button></div>`;
  else if (deep != null) h = `<div style="font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2c">A planted BAR, growing</div><h2 style="font-size:1.7rem;font-style:italic">${esc(p.line)}</h2><p>${p.tendedDays} of ${GROW} days. ${p.notes.length ? p.notes.map(n => `<i>${esc(n.line)}</i>`).join(', ') : ''}</p><b>What from today feeds this?</b>${inp('f-line', 'A line from your day')}<div class="row"><button id="b-aligned">Grow a leaf</button><button class="alt" id="b-ripe">It is done: ripen</button><button class="alt" id="b-x">Back to the field</button></div><p>The Protector is listening.</p>`;
  else h = `<h2>${esc(p.line)}</h2><p>${p.tendedDays} of ${GROW} days.</p><div class="row"><button id="b-water" ${FARM.mana < 1 ? 'disabled' : ''}>Water · 1 mana</button><button class="alt" id="b-deep">Look closer</button><button class="alt" id="b-x">Close</button></div>`;
  card.innerHTML = h; const on = (id, f) => { const b = $(id); if (b) b.onclick = f; }; const val = id => ($(id) ? $(id).value.trim() : '');
  on('b-x', () => { if (deep != null) closeDeepen(); else { SEL = null; selRing.visible = false; renderCard(); } }); on('b-deep', () => openDeepen(SEL)); on('b-till', () => act('till'));
  on('b-plant', () => { const bar = val('f-bar'), line = val('f-line'); if (!bar || !line) return say('A BAR and one line.'); act('plant', { barId: 'bar-' + bar.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Date.now().toString(36), line }); });
  on('b-water', () => act('water')); on('b-reclear', () => { const line = val('f-line'); if (!line) return say('One line about what kept you away.'); act('reclear', { line }); });
  on('b-ripe', () => { const line = val('f-line'); if (!line) return say('One line about what you did.'); act('ripen', { line }); });
  on('b-aligned', () => { const line = val('f-line'); if (!line) return say('One line from your day.'); act('water', { aligned: 'line:' + line.slice(0, 60) }); }); on('b-pick', () => act('pick'));
}

// ---------- input: tap a slot to walk to it and choose ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  if (deep != null) return; ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); const p = V(); if (!ray.ray.intersectPlane(groundPlane, p)) return;
  const c = Math.round(p.x / STEP + (COLS - 1) / 2), r = Math.round(p.z / STEP + (ROWS - 1) / 2); if (c < 0 || c >= COLS || r < 0 || r >= ROWS) { goal = V(Math.max(-6, Math.min(6, p.x)), 0, Math.max(-5, Math.min(8, p.z))); return; }
  SEL = r * COLS + c; selRing.visible = true; const [x, z] = slotXZ(SEL); selRing.position.set(x, 0.13, z); walkTo(SEL); renderCard(); });
$('homeBtn').onclick = () => { location.href = '/between/'; };

// ---------- loop ----------
const clock = new THREE.Clock();
function tick() { const dt = Math.min(0.05, clock.getDelta()); const p = avatar.position;
  if (goal) { const d = goal.clone().sub(p); d.y = 0; const L = d.length(); if (L < 0.05) { goal = null; if (faceTo) avatar.rotation.y = Math.atan2(faceTo.x - p.x, faceTo.z - p.z); } else { const st = Math.min(L, 2.6 * dt); p.addScaledVector(d.normalize(), st); avatar.rotation.y = Math.atan2(d.x, d.z); bob += dt * 10; } }
  avatar.children[0].position.y = 0.85 + (goal ? Math.sin(bob) * 0.03 : 0);
  if (swing > 0) { swing = Math.max(0, swing - dt * 2); arm.rotation.x = -Math.sin((1 - swing) * Math.PI) * 1.4; } else arm.rotation.x = 0;
  if (selRing.visible) selRing.scale.setScalar(1 + Math.sin(performance.now() / 300) * 0.06);
  frame(dt); renderer.render(scene, camera); requestAnimationFrame(tick); }

// ---------- first entry: the whole field from above; later, a short walk-in ----------
(async () => {
  const r = await fetch('/api/between/farm?today=' + localDay()); if (!r.ok) { $('loading').textContent = r.status === 401 ? 'Sign in to bars-engine to open your farm' : 'The farm could not open'; return; }
  const j = await r.json(); FARM = j.farm; first = j.first; drawSlots(); fieldSpirits();
  await api({ act: 'enter' });
  if (first) { camPos.set(0, 18, 14); camLook.set(0, 0, 0); say('Your own land. Every slot is grass until you till it.', 7000); avatar.position.set(0, 0, 6.6); setTimeout(() => { goal = V(0, 0, 5.2); }, 3500); }
  else { avatar.position.set(0, 0, 8.4); goal = V(0, 0, 6.2); }
  $('loading').classList.add('gone'); tick();
  if (Q.get('deepen') != null) openDeepen(+Q.get('deepen'));
})();
window.__farm = { act, api, get farm() { return FARM; }, select: i => { SEL = i; selRing.visible = true; const [x, z] = slotXZ(i); selRing.position.set(x, 0.13, z); walkTo(i); renderCard(); }, openDeepen };

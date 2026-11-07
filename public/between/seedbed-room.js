/* The seed bed by the stream (Six-faces-council bars-garden slice 1; stills round 2026-11-06-bars-garden-2, his A on
   bg-first-minute-look-1: "build slice 1 as drawn").

   The first minute in the hollow: you walk in with a BAR in your seed bag, kneel at the bed by the stream, rest both
   hands on your heart for three breaths (Integral Life Practice, the 1-Minute Module "What's Your Deepest Motivation?"),
   and write one line of what you most want from it on the seed. One mana of its element waters it. Left alone a week it
   frosts, and one touch wakes it; it never dies (bg2-frost-days A).

   The rules are seedbed.js; the store is /api/between/seedbed (the plant rides on the BAR's own seed record, mana sits in
   the homeroom's pouch). Every word goes through the one screen owner (voice.js). The BAR's words and the player's line
   are shown untouched; no number, count, streak or timer reaches the page (FR-007).

   Previews only: ?mana=demo puts one mana of each element on this page, never saved (as ?embers=demo does);
   ?seedbed=demo also brings a sample seed bag and bed, never saved, for a page with the store down (?room=standin). */
import * as THREE from "three";
import { isFrosted, canTend, tend as tendRule, plant as plantRule, stageOf, cleanIntent, cleanMana, INTENT_MAX, FEEL_WORD } from "./seedbed.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const EL_HEX = { wood: "#6fae5a", fire: "#e0663a", earth: "#c9a35a", metal: "#c8ccd4", water: "#4f8fd0" };
const BED = V(-2.85, 0, 1.55);                 // on the hollow floor, off the dais, left of the tea table, by the stream
const TO_SEAT = V(0.55, 0, 0.84).normalize();  // the side the player kneels on
const SEAT = V(BED.x + TO_SEAT.x * 0.62, 0, BED.z + TO_SEAT.z * 0.62);
const SLOTS = [[0.3, -0.18], [-0.32, -0.05], [0.05, 0.22], [-0.05, -0.32], [0.38, 0.14], [-0.4, 0.25], [0.18, 0.02]];
const NEAR = 1.7;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sample = () => {
  const t = Date.now(), d = 86400000;
  return {
    bag: [{ id: "demo-1", title: "Froze when asked", words: "I froze when Sam asked me for help.", element: "metal", at: new Date(t - 3 * d).toISOString() }],
    bed: [
      { id: "demo-w", title: "Laughed at dinner", words: "We laughed so hard at dinner.", maturity: "elaborated", plant: { bed: "hollow", element: "wood", tends: 4, plantedAt: new Date(t - 9 * d).toISOString(), tendedAt: new Date(t - 2 * d).toISOString(), intent: "I want more evenings like this." } },
      { id: "demo-s", title: "Missed the call", words: "I missed my sister's call again.", maturity: "context_named", plant: { bed: "hollow", element: "water", tends: 0, plantedAt: new Date(t - 12 * d).toISOString() } },
    ],
    mana: {},
  };
};

export function mount(B, opts = {}) {
  const demo = opts.preview && opts.demo === "demo";
  const manaDemo = opts.preview && (opts.mana === "demo" || demo);
  let S = demo ? sample() : { bag: [], bed: [], mana: {} }, loaded = demo, G = null, plantsG = null, glowT = null;
  let step = "", focus = null, reading = -1, said = "", line = null, busy = false, arc = null, breaths = null, heartOn = false;
  const mana = () => manaDemo ? { wood: 1, fire: 1, earth: 1, metal: 1, water: 1, ...cleanMana(S.mana) } : cleanMana(S.mana);

  async function load() {
    if (demo) return;
    try { const r = await fetch("/api/between/seedbed", { credentials: "same-origin", cache: "no-store" }); if (r.ok) { S = await r.json(); loaded = true; drawPlants(); } } catch {}
  }
  async function post(body) {
    if (demo || body.bar.startsWith("demo-")) return { ok: true, local: true };
    const r = await fetch("/api/between/seedbed", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.ok ? r.json() : { ok: false, why: ((await r.json().catch(() => ({}))).error) || "error" };
  }

  /* ---------- the bed, drawn once; the plants, drawn from the record ---------- */
  function glowTex() {
    if (glowT) return glowT;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (glowT = new THREE.CanvasTexture(cv));
  }
  const glow = (parent, p, s, c, o) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: c, opacity: o, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.copy(p); sp.scale.set(s, s, 1); parent.add(sp); return sp; };
  function build() {
    G = new THREE.Group(); G.name = "seedbed"; G.position.copy(BED); B.scene.add(G);
    const soil = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#6a4428", roughness: 1 }));
    soil.scale.set(1.25, 0.22, 1.0); G.add(soil);
    const furrow = new THREE.MeshStandardMaterial({ color: "#4a2e1a", roughness: 1 });
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9 - Math.abs(i - 1.5) * 0.18, 6), furrow); f.rotation.z = Math.PI / 2; f.rotation.y = 0.5; f.position.set(0, 0.095, (i - 1.5) * 0.16); G.add(f); }
    const pl = new THREE.PointLight("#ffcf86", 3.2, 3.4, 1.4); pl.position.set(0.15, 1.3, 0.45); G.add(pl);
    glow(G, V(0, 0.08, 0), 1.9, "#ffb050", 0.16);
    const r = i => { const a = Math.sin(i * 12.9898) * 43758.5453; return a - Math.floor(a); };
    for (let i = 0; i < 15; i++) { const a = i / 15 * Math.PI * 2, rr = 0.66 + r(i) * 0.05;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + r(i + 3) * 0.04), new THREE.MeshStandardMaterial({ color: i % 3 ? "#6d6052" : "#857565", roughness: 0.95 }));
      st.position.set(Math.cos(a) * rr * 1.18, 0.03, Math.sin(a) * rr * 0.95); st.scale.y = 0.7; G.add(st); }
    plantsG = new THREE.Group(); G.add(plantsG);
    // the kneeling place at the bed: the page's own sit pose, facing the soil (garden.js seatsNow via addSeat)
    B.addSeat(() => inHollow() ? [{ id: "bed", x: SEAT.x, z: SEAT.z, yaw: Math.atan2(BED.x - SEAT.x, BED.z - SEAT.z), floor: 0, top: 0.1 }] : []);
    drawPlants();
  }
  function sprout(at, el, stage, frost) {
    const h = 0.16 + stage * 0.09, g = new THREE.Group(); g.position.set(at[0], 0.1, at[1]);
    const col = new THREE.Color(EL_HEX[el]);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, h, 6), new THREE.MeshStandardMaterial({ color: frost ? "#c9d6de" : "#5f9a4a", roughness: 0.7 })); stem.position.y = h / 2; g.add(stem);
    for (let k = 0; k < Math.min(2 + stage, 5); k++) { const sgn = k % 2 ? 1 : -1;
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), new THREE.MeshStandardMaterial({ color: frost ? "#dfe9ef" : "#77b35c", roughness: 0.6 }));
      lf.scale.set(1.6, 0.25, 0.8); lf.position.set(sgn * 0.07, h * (0.45 + 0.15 * k), 0); lf.rotation.set(0, k * 1.1, sgn * 0.5); g.add(lf); }
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.045 + stage * 0.008, 12, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: frost ? 0.1 : 0.9, roughness: 0.4 })); bud.position.y = h + 0.02; g.add(bud);
    if (!frost) glow(g, V(0, h + 0.12, 0), 0.35, EL_HEX[el], 0.6);
    else for (let i = 0; i < 6; i++) glow(g, V(Math.cos(i) * 0.08, 0.05 + i * 0.05, Math.sin(i) * 0.08), 0.12, "#dff0ff", 0.4);
    plantsG.add(g); return g;
  }
  function seedMesh(at, el) {
    const g = new THREE.Group(); g.position.set(at[0], 0.13, at[1]);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshStandardMaterial({ color: "#e8d27a", emissive: EL_HEX[el], emissiveIntensity: 0.9, roughness: 0.4 })); m.scale.set(1, 1.35, 1); g.add(m);
    glow(g, V(0, 0, 0), 0.55, EL_HEX[el], 0.85); plantsG.add(g); return g;
  }
  function drawPlants() {
    if (!plantsG) return;
    plantsG.clear(); const now = Date.now();
    S.bed.forEach((b, i) => { const at = SLOTS[i % SLOTS.length];
      if (b.fresh) seedMesh(at, b.plant.element); else sprout(at, b.plant.element, stageOf(b.maturity), isFrosted(b.plant, now)); });
  }

  /* ---------- where you are ---------- */
  const inHollow = () => B.room && B.room().shell === "hollow";
  const meAt = () => B.meState && B.meState.pos;
  const nearBed = () => { const p = meAt(); return !!p && Math.hypot(p.x - BED.x, p.z - BED.z) < NEAR; };
  const kneeling = () => B.meState && B.meState.sitting && B.meState.seatWant === "bed";
  const subject = () => { const [x0, y0] = B.screenOf(V(BED.x, 0, BED.z)), [, y1] = B.screenOf(V(BED.x, 0.9, BED.z)), h = Math.abs(y0 - y1), w = Math.max(60, h * 1.6);
    return { l: x0 - w / 2, r: x0 + w / 2, t: Math.min(y0, y1), b: Math.max(y0, y1) }; };
  // when, in words: today, yesterday, a weekday within the week, or "a while ago"; never a count of days (FR-007)
  const dayOf = iso => { const t = Date.parse(iso || ""); if (!Number.isFinite(t)) return "a while ago";
    const a = new Date(t), n = new Date(), d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const back = Math.round((d0 - da) / 86400000);
    return back <= 0 ? "today" : back === 1 ? "yesterday" : back < 7 ? DAYS[a.getDay()] : "a while ago"; };
  const on = when => (when === "today" || when === "yesterday" || when === "a while ago" ? when : "on " + when);
  // the BAR's words in quotes, closing the sentence without a second stop
  const quoted = w => `“${w}”` + (/[.!?…]$/.test(w) ? "" : ".");
  const needsTend = () => S.bed.find(b => !b.fresh && canTend(b.plant, mana()).ok);

  /* ---------- the heart act: both hands on the chest over the sit (the stills' arms, lib.js hands) ---------- */
  function heart(on) {
    const body = B.meState && B.meState.body; if (!body || heartOn === on) return; heartOn = on;
    if (!on) { if (body._seedbedPose) { body.pose = body._seedbedPose; body._seedbedPose = null; } return; }
    const h = body.holder, qe = new THREE.Quaternion(), eu = new THREE.Euler();
    const P = { shoulderL: [1.0, 0.6, 0], shoulderR: [1.0, -0.6, 0], elbowL: [0, 0, 1.7], elbowR: [0, 0, -1.7] };
    const o = body.pose.bind(body); body._seedbedPose = body.pose;
    body.pose = (...a) => { o(...a); for (const [n, e] of Object.entries(P)) { const b = h.getObjectByName(n); if (b) { qe.setFromEuler(eu.set(...e, "XYZ")); b.quaternion.multiply(qe); } } };
  }
  function breathe(on) {
    if (breaths) { G.remove(breaths); breaths = null; }
    if (!on) return;
    breaths = new THREE.Group(); G.add(breaths);
    const s = SEAT.clone().sub(BED);
    for (let i = 0; i < 10; i++) { const a = i * 2.2; glow(breaths, V(s.x + Math.cos(a) * 0.25, 0.85 + i * 0.07, s.z + Math.sin(a) * 0.25), 0.12, "#ffe6b0", 0.55); }
  }
  function waterArc(el, slot) {
    if (arc) G.remove(arc); arc = new THREE.Group(); G.add(arc);
    const from = SEAT.clone().sub(BED).multiplyScalar(0.5).setY(0.52), to = V(slot[0], 0.26, slot[1]);
    for (let i = 0; i <= 22; i++) { const k = i / 22, p = from.clone().lerp(to, k); p.y += Math.sin(k * Math.PI) * 0.18;
      glow(arc, p, 0.05 + 0.05 * Math.sin(k * Math.PI), "#e8f0ff", 0.8); glow(arc, p, 0.16, EL_HEX[el], 0.25); }
    glow(arc, to, 0.4, "#cfe0ff", 0.6);
    const t0 = performance.now(); const fade = () => { if (!arc) return; const k = (performance.now() - t0) / 2600; arc.children.forEach(c => { c.material.opacity *= 0.985; }); if (k < 1) requestAnimationFrame(fade); else { G.remove(arc); arc = null; } }; requestAnimationFrame(fade);
  }

  /* ---------- the line, written on card paper (one line, no form) ---------- */
  function paper(el, onDone) {
    if (line) line.remove();
    line = document.createElement("div"); line.className = "seedline";
    line.innerHTML = `<style>.seedline{position:fixed;left:50%;top:22%;transform:translateX(-50%);width:min(320px,86vw);z-index:45;padding:22px 22px 16px;background:#f3e6c8;border:7px solid #b8261a;outline:2px solid #b8261a;outline-offset:-16px;box-shadow:0 10px 30px rgba(0,0,0,.55);color:#2a1a12;font:italic 400 20px/1.35 Georgia,serif;text-align:center}
      .seedline i{display:block;width:30px;height:30px;margin:0 auto 10px;border-radius:50%}
      .seedline textarea{width:100%;min-height:3.4em;border:0;background:transparent;resize:none;color:#2a1a12;font:inherit;text-align:center;outline:none}
      .seedline textarea::placeholder{color:#8b7560}</style>
      <i style="background:${EL_HEX[el]}"></i><textarea maxlength="${INTENT_MAX}" rows="3" aria-label="What you most want from this seed" placeholder="What I most want from this is…"></textarea>`;
    document.body.appendChild(line);
    const ta = line.querySelector("textarea"); setTimeout(() => ta.focus(), 50);
    ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onDone(ta.value); } });
    return () => ta.value;
  }
  const closePaper = () => { if (line) { line.remove(); line = null; } };

  /* ---------- the moments ---------- */
  function say(m, rank = 3) { const vo = B.voice; if (!vo) return; said = step; vo.say({ ...m, subject }, "seedbed", rank); }
  function quiet() { const vo = B.voice; if (vo) vo.quiet("seedbed"); said = ""; }
  function go(next, arg) { step = next; focus = arg !== undefined ? arg : focus; show(); }
  function standUp() { heart(false); breathe(false); closePaper(); step = ""; focus = null; quiet(); if (B.standUp) B.standUp(); }

  function show() {
    if (step === "near") {
      const seed = S.bag[0], due = needsTend(), plants = S.bed.filter(b => !b.fresh);
      const acts = [];
      if (seed) acts.push({ label: "Kneel and plant it", el: seed.element, on: () => kneel(() => go("heart", seed)) });
      if (due) acts.push({ label: `Water the ${due.plant.element} seed`, el: due.plant.element, on: () => kneel(() => water(due)) });
      if (plants.length) acts.push({ label: "Read a seed", quiet: true, on: () => { reading = (reading + 1) % plants.length; go("read", plants[reading]); } });
      if (!acts.length) acts.push({ label: "Just sit a while", quiet: true, on: () => kneel(() => go("sit")) });
      const head = seed ? (S.bag.length > 1 ? "Seeds rest in your bag." : "A seed rests in your bag.") : plants.length ? "Your seed bed by the stream." : "The soil by the stream is yours.";
      const sub = seed ? `This one is from ${dayOf(seed.at)}, ${FEEL_WORD[seed.element]}. The soil by the stream is yours.`
        : plants.length ? "What you planted waits here. Left alone it frosts, and one touch wakes it."
        : "A BAR you write lands in your bag as a seed. Bring one here to plant it.";
      say({ head, sub, actions: acts }, 2); return;
    }
    if (step === "read") { const b = focus;
      const frost = isFrosted(b.plant, Date.now());
      say({ head: b.plant.intent ? `“${b.plant.intent}”` : `“${b.words}”`, sub: (b.plant.intent ? `On the seed of ${quoted(b.words)} ` : "") + (frost ? "Frost on it. One touch of its own mana wakes it." : `Planted ${on(dayOf(b.plant.plantedAt))}.`),
        actions: [{ label: "Walk on", quiet: true, on: () => go("near") }] }, 2); return;
    }
    if (step === "heart") { heart(true); breathe(true);
      say({ head: "Both hands on your heart.", sub: "Three breaths. Then say, in one line, what you most want from this seed.",
        actions: [{ label: "Say it", el: focus.element, on: () => go("line") }, { label: "Plant it without a line", quiet: true, on: () => plantIt(undefined) }], down: { label: "Stand up", on: standUp } }); return;
    }
    if (step === "line") { heart(false); breathe(false);
      const get = paper(focus.element, v => plantIt(v));
      say({ head: "Say it in one line.", sub: `On the seed of ${quoted(focus.words)}`, actions: [{ label: "Write it on the seed", el: focus.element, on: () => plantIt(get()) }], down: { label: "Stand up", on: standUp } }); return;
    }
    if (step === "planted") { const b = focus;
      say({ head: b.plant.intent ? `“${b.plant.intent}”` : "Planted.", sub: `Written on the seed. It holds your ${FEEL_WORD[b.plant.element].replace(/^an? /, "")}, as you caught it.`,
        actions: [{ label: "Press the soil over it", el: b.plant.element, on: () => go(canTend(b.plant, mana()).ok ? "water" : "waits") }] }); return;
    }
    if (step === "water") { const b = focus;
      say({ head: `One mana of ${b.plant.element} waters it.`, sub: "Care you gave a friend is what this soil drinks.",
        actions: [{ label: "Water it", el: b.plant.element, on: () => water(b) }], down: { label: "Stand up", on: standUp } }); return;
    }
    if (step === "waits") { const b = focus;
      say({ head: "It waits for water.", sub: `Mana of ${b.plant.element} comes when you finish a friendcraft card with a friend. Until then it rests, and nothing is lost.`,
        actions: [{ label: "Stand up", on: standUp }] }); return;
    }
    if (step === "holds") { const b = focus;
      say({ head: "It holds what you wrote.", sub: `Your line, your ${FEEL_WORD[b.plant.element].replace(/^an? /, "")}, planted ${on(dayOf(b.plant.plantedAt))}. Come back when you like. Left alone it frosts, and one touch wakes it. It never dies.`,
        actions: [{ label: "Stand up", on: standUp }] }); return;
    }
    if (step === "sit") { say({ head: "The stream, the soil.", sub: "Nothing is owed here.", actions: [{ label: "Stand up", on: standUp }] }); return; }
    quiet();
  }

  function kneel(then) { if (kneeling()) { then(); return; } B.sitOn("bed", then); }

  async function plantIt(raw) {
    if (busy) return; busy = true; closePaper(); heart(false); breathe(false);
    const seed = focus, intent = cleanIntent(raw);
    const r = await post({ act: "plant", bar: seed.id, intent }).catch(() => ({ ok: false }));
    busy = false;
    if (!r.ok) { say({ head: "The soil did not take it.", sub: "Nothing was lost. Try again in a little while.", actions: [{ label: "Stand up", on: standUp }] }); return; }
    const p = r.plant || plantRule(null, { bed: "hollow", element: seed.element, intent }).plant;
    S.bag = S.bag.filter(b => b.id !== seed.id);
    const entry = { id: seed.id, title: seed.title, words: seed.words, maturity: "context_named", plant: p, fresh: true };
    S.bed.push(entry); drawPlants(); go("planted", entry);
  }
  async function water(b) {
    if (busy) return; busy = true;
    const local = tendRule(b.plant, mana());
    const r = await post({ act: "tend", bar: b.id }).catch(() => ({ ok: false }));
    busy = false;
    if (!r.ok || !local.ok) { go("waits", b); return; }
    b.plant = r.plant || local.plant; if (r.mana) S.mana = r.mana; else if (!manaDemo) S.mana = local.mana;
    const i = S.bed.indexOf(b); b.fresh = false; drawPlants(); waterArc(b.plant.element, SLOTS[i % SLOTS.length]); go("holds", b);
  }

  /* ---------- once a frame: build in the hollow, speak when near ---------- */
  let shown = false;
  function frame() {
    requestAnimationFrame(frame);
    if (!inHollow()) { if (G) G.visible = false; if (step) { step = ""; quiet(); } return; }
    if (!G) { build(); load(); }
    G.visible = true;
    const near = nearBed() || kneeling();
    if (!near && step) { heart(false); breathe(false); closePaper(); step = ""; quiet(); }
    if (near && !step && loaded) go("near");
    if (near !== shown) shown = near;
  }
  requestAnimationFrame(frame);
  return {
    at: () => [BED.x, BED.z], seat: () => [SEAT.x, SEAT.z],
    view: () => ({ step, bag: S.bag.map(b => b.id), bed: S.bed.map(b => ({ id: b.id, element: b.plant.element, intent: b.plant.intent || null, frost: isFrosted(b.plant, Date.now()) })), mana: mana(), kneeling: !!kneeling(), loaded }),
    go: (s, id) => { const b = S.bag.find(x => x.id === id) || S.bed.find(x => x.id === id) || S.bag[0]; go(s, b); },
    plant: raw => plantIt(raw), reload: load,
  };
}

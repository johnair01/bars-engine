// The trade deck, played (Six-faces-council council/callsheets/pipeline/money-block/game-frame.md). The parts above drew the
// deck; this file walks the captain on it and plays the trade hand (trade-hand.js). Tap where to walk; tap the crate, the
// spirit, the gangway, the crew bell, a studio boat, a boat at anchor, the tide post or the route book to go to it. Drag
// turns the view. ?build=1 assembles the deck part by part with each part's source (his note on mb-gate-look-3).
// ?demo=1 plays the sample chart without writing to this device.
const TH = window.__tradeHand;
const params = new URLSearchParams(location.search);
const DEMO = params.get("demo") === "1", BUILD = params.get("build") === "1";
const now = () => new Date().toISOString();
let S = (!DEMO && TH.store.get()) || TH.blank(now(), window.__tradeDeckChart);
const save = () => { if (!DEMO) TH.store.put(S); };
TH.deal(S, now()); TH.settleFog(S, now()); save();
const page = window.__tradeDeck = { ready: false, frames: 0, parts: PARTS.map((p) => p.id), build: BUILD, bubble: null, model: null };

// ---- page --------------------------------------------------------------------------------------------------------------
const rootEl = document.getElementById("deck-root");
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const bubble = el("div", "dk-bubble"); bubble.setAttribute("role", "status"); bubble.hidden = true; rootEl.appendChild(bubble);
const chip = el("div", "dk-chip"); rootEl.appendChild(chip);
const plate = el("div", "dk-plate"); rootEl.appendChild(plate);
function drawPlate() {
  const lit = !S.crate || S.crate.state === "waiting" ? [0, 1] : [2];
  plate.replaceChildren(...TH.SAY_BACK.map((c, i) => el("span", lit.includes(i) ? "lit" : "", c + " ")));
  chip.textContent = "◈ " + S.vibeulons;
}
drawPlate();

// ---- the captain -------------------------------------------------------------------------------------------------------
const TOP = DY + 0.5;
const player = { group: new THREE.Group(), pos: new THREE.Vector3(-1.1, TOP, 8.0), goal: null, then: null, mixer: null, acts: {}, walking: false };
player.group.position.copy(player.pos); player.group.rotation.y = Math.PI; scene.add(player.group);
new GLTFLoader().loadAsync("/between/m/player.glb").then((g) => {
  const obj = g.scene; obj.updateMatrixWorld(true);
  const box = new THREE.Box3(); obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.isSkinnedMesh) { o.computeBoundingBox(); box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else box.expandByObject(o); } });
  const k = 1.75 / Math.max(box.max.y - box.min.y, 0.01); obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
  player.group.add(obj); player.mixer = new THREE.AnimationMixer(obj);
  for (const n of ["Walk", "Idle"]) { const c = g.animations.find((a) => a.name === n); if (c) player.acts[n] = player.mixer.clipAction(c); }
  if (player.acts.Idle) player.acts.Idle.play(); page.model = "player.glb";
}).catch((e) => { add(new THREE.CapsuleGeometry(0.28, 1.1, 4, 8), glow(0xf2ede4, 0.6), 0, 0.85, 0, { parent: player.group }); page.model = "fallback: " + e.message; });
function setWalking(w) {
  if (w === player.walking) return; player.walking = w; const { Walk, Idle } = player.acts; if (!Walk) return;
  if (w) { Walk.reset().fadeIn(0.2).play(); if (Idle) Idle.fadeOut(0.2); } else { Walk.fadeOut(0.3); if (Idle) Idle.reset().fadeIn(0.3).play(); }
}
const onDeck = (x, z) => z < 13 && z > -13 && Math.abs(x) < 6.2 - Math.max(0, -z - 2) * 0.35;
const near = (v) => { const d = new THREE.Vector3(v.x - player.pos.x, 0, v.z - player.pos.z); const L = d.length(); if (L < 2.2) return null; d.setLength(L - 1.8); const p = player.pos.clone().add(d); return onDeck(p.x, p.z) ? p : null; };

// ---- live state the parts draw -----------------------------------------------------------------------------------------
const live = { sending: null, crew: false, ringing: 0, rowing: -1 };
const LEVEL = { stranger: 0, known: 0.33, trusted: 0.66, route: 1 };
function st(t) {
  const waiting = !!S.crate && S.crate.state === "waiting";
  return { t, waiting, turned: TH.tideTurned(S) && !!S.crate, spiritSide: waiting && S.crate.spiritSide, sending: live.sending, crew: live.crew || (S.crate && S.crate.state === "crew"),
    ringing: live.ringing > t, rowing: live.rowing, fog: S.fog, tide: TH.tideLine(S, now()).level, routes: S.routes.length,
    boatsOut: Math.min(5, S.boats.filter((b) => !b.back).length - (live.sending != null ? 1 : 0)),
    ports: [0, 1, 2, 3, 4, 5].map((i) => (S.ports[i] ? LEVEL[S.ports[i].standing] : -1)) };
}

// ---- talk --------------------------------------------------------------------------------------------------------------
let anchor = null;
function say(at, name, text, ...rows) {
  anchor = at; bubble.hidden = false; bubble.replaceChildren();
  if (name) bubble.appendChild(el("b", "", name));
  bubble.appendChild(el("p", "", text)); rows.forEach((r) => r && bubble.appendChild(r));
  page.bubble = text;
}
function hush() { bubble.hidden = true; anchor = null; page.bubble = null; }
const btn = (text, fn, quiet) => { const b = el("button", quiet ? "quiet" : "", text); b.type = "button"; b.addEventListener("click", (e) => { e.stopPropagation(); fn(); }); return b; };
const row = (...kids) => { const r = el("div", "dk-row"); r.append(...kids); return r; };
const field = (ph, big) => { const f = el(big ? "textarea" : "input", "dk-field"); f.placeholder = ph; if (big) f.rows = 2; f.addEventListener("pointerdown", (e) => e.stopPropagation()); return f; };
const portName = (id) => (S.ports.find((p) => p.id === id) || { name: "a port" }).name;
const done = () => { save(); drawPlate(); };
const crateAt = () => new THREE.Vector3(0, DY + 2.4, HZ);

const ACTS = {
  crate() {
    const c = S.crate;
    if (!c) {
      const pick = el("select", "dk-field"); S.ports.forEach((p) => pick.appendChild(Object.assign(el("option", "", p.name), { value: p.id })));
      const act = field("One money move, fifteen minutes"), ask = field("What it asks for (optional)");
      return say(crateAt(), null, S.moves.length ? "The hatch is clear for today. Tomorrow's crate is already chalked." : "The hatch is clear. Chalk tomorrow's crate?", pick, act, ask,
        row(btn("Chalk it", () => { if (!act.value.trim()) return act.focus(); TH.chalk(S, pick.value, act.value.trim(), ask.value.trim(), now()); done(); say(crateAt(), null, "Chalked. It will be on the hatch in the morning."); })));
    }
    if (c.state !== "waiting") return say(crateAt(), null, c.state === "sent" ? "Today's crate sailed. The tide has turned." : c.state === "sat" ? "You sat with today's crate. The tide has turned." : "The crew has today's crate. The tide has turned.");
    const b = TH.bounty(S, now());
    const head = portName(c.port) + (b ? " · it has waited, and pays " + (TH.PAY.crate + b) : "");
    if (c.presence == null) {
      return say(crateAt(), head, c.action + (c.ask ? " Ask: " + c.ask + "." : ""), el("p", "dk-q", "How here are you, right now?"),
        row(...[1, 2, 3, 4, 5].map((n) => btn(String(n), () => { TH.presence(S, n, now()); done(); ACTS.crate(); }, true))));
    }
    if (c.spiritSide) return ACTS.spirit();
    say(crateAt(), head, c.action + (c.ask ? " Ask: " + c.ask + "." : ""),
      row(btn("I sent it", () => send()), btn("Sit with it", () => sit(0), true), btn("Ring the crew bell", () => ACTS.bell(), true)));
  },
  spirit() {
    const at = PARTS.find((p) => p.id === "spirit").hit[0].pos.clone().add(new THREE.Vector3(0, 1.1, 0));
    const c = S.crate;
    if (!c || c.state !== "waiting") return say(at, "The spirit", "The deck is quiet. I'm still here.");
    if (c.spiritSide) return say(at, "The spirit", "I go far away when money comes up. Sit with me before you lift it?", row(btn("Sit with it", () => sit(0)), btn("Lift it anyway", () => { c.spiritSide = false; done(); ACTS.crate(); }, true)));
    say(at, "The spirit", "I'm the part of you that leaves when money comes up. I'll stay if you sit with me.", row(btn("Sit with it", () => sit(0), true)));
  },
  gangway() { if (S.crate && S.crate.state === "waiting") return say(new THREE.Vector3(-9, 0.6, -2.6), null, "The trade boat waits. When the crate is sent out in the world, carry it down.", row(btn("It's sent", () => send()))); say(new THREE.Vector3(-9, 0.6, -2.6), null, "The gangway is clear."); },
  bell() {
    const at = new THREE.Vector3(4.4, DY + 3.4, -0.4);
    if (!S.crate || S.crate.state !== "waiting") return say(at, "The crew bell", "The crew has nothing waiting from you.");
    const note = field("What should the crew do with it?", true);
    say(at, "The crew bell", "Hand today's crate to the crew with a note. It counts as off the deck.", note, row(btn("Ring it", () => {
      const c = S.crate, line = "Today's money move, handed to you: " + c.action + " (" + portName(c.port) + "). " + (note.value.trim() ? "Note: " + note.value.trim() : "");
      try { navigator.clipboard.writeText(line); } catch (e) { /* the line stays in the record */ }
      live.ringing = clock.elapsedTime + 1.6; live.crew = true; TH.release(S, "crew", now(), note.value.trim()); done();
      say(at, "The crew bell", "Rung. The note is copied, ready to paste to Claude. The tide has turned.");
    })));
  },
  studio(h) {
    const at = h.pos.clone().add(new THREE.Vector3(0, 3.6, 0));
    if (TH.tideTurned(S)) return say(at, "A studio boat", "The tide carries the studio boats today. Sail where you love to go.");
    say(at, "A studio boat", "The tide is in until today's crate is off. Row against it for one vibeulon?", row(btn("Row out", () => {
      const r = TH.rowAgainst(S, now()); if (!r.ok) return say(at, "A studio boat", "The hold has no vibeulon to row with yet. Today's crate pays three.");
      live.rowing = h.i; done(); say(at, "A studio boat", "Rowing out against the tide.");
    }, true)));
  },
  boat(h) {
    const out = S.boats.filter((b) => !b.back); const b = out[h.i]; if (!b) return;
    const at = h.pos.clone().add(new THREE.Vector3(0, 2.4, 0));
    const amt = field("Amount"); amt.inputMode = "decimal"; const no = field("What the no taught you");
    say(at, "A boat at anchor", "It carried " + b.action + " to " + portName(b.port) + ". What did it bring back?", amt,
      row(btn("Coin", () => { if (!(+amt.value > 0)) return amt.focus(); TH.logReturn(S, b.id, { kind: "coin", amount: +amt.value }, now()); done(); keep(b, at); })), no,
      row(btn("A no", () => { TH.logReturn(S, b.id, { kind: "lesson", line: no.value.trim() }, now()); done(); say(at, "The spirit", "I'll hold that one. Nothing of yours is any less."); }, true), btn("Still out", hush, true)));
  },
  tide() { const t = TH.tideLine(S, now()); say(new THREE.Vector3(8.6, 2.6, -9.5), "The tide post", "This month: " + money(t.coin) + (t.goal ? " of " + money(t.goal) + "." : ".")); },
  book() {
    const lines = TH.routeBook(S).filter((p) => p.routes.length).map((p) => el("p", "", p.port.name + ": " + p.routes.map((r) => r.action + (r.words ? " (“" + r.words + "”)" : "")).join("; ")));
    say(new THREE.Vector3(-4.4, DY + 2.6, 4.2), "The route book", lines.length ? "The routes that brought coin back:" : "No routes yet. A boat that comes back with coin writes the first page.", ...lines);
  },
  port(h) { const p = S.ports[h.i]; if (!p) return; const words = { stranger: "still in fog: no boat has reached it yet", known: "known: a boat has reached it", trusted: "trusted: coin has come back from it", route: "a standing route: coin came back twice" }; say(h.pos, p.name, words[p.standing] + "."); },
  stone(h) { say(PARTS.find((p) => p.id === "hatch").hit[1 + h.i].pos.clone().add(new THREE.Vector3(0, 0.8, 0)), null, ["Fire", "Metal", "Wood", "Water", "Earth"][h.i] + ": a charge stone. They glow while the crate waits."); },
};
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
function keep(b, at) {
  const words = field("The words that worked (optional)");
  say(at, "Coin came back", "Keep this as a route in the route book?", words, row(btn("Keep the route", () => { TH.keepRoute(S, b.id, words.value.trim(), now()); done(); say(at, null, "Kept. The route book has a new page."); }), btn("Not now", hush, true)));
}
function send() {
  const c = S.crate; if (!c || c.state !== "waiting") return;
  TH.release(S, "sent", now()); done(); hush(); live.sending = 0;
}
// The 3-2-1 with the spirit (Big Mind's three faces): look at it, talk to it, be it. The words stay on screen only.
function sit(step) {
  const at = PARTS.find((p) => p.id === "spirit").hit[0].pos.clone().add(new THREE.Vector3(0, 1.1, 0));
  const steps = ["Three. Look at it: what does the voice that leaves look like? Say it as “it”.", "Two. Talk to it: what does it want you to know?", "One. Be it: say “I am…” and let it speak."];
  if (step >= steps.length) { TH.release(S, "sat", now()); done(); return say(at, "The spirit", "Thank you for sitting with me. That burned into a vibeulon, and the tide has turned."); }
  const f = field("", true);
  say(at, "Sitting with the spirit", steps[step], f, row(btn(step < 2 ? "Next" : "Done", () => sit(step + 1)), btn("Rest here instead", hush, true)));
}

// ---- input: tap to walk or to go to a thing, drag to turn ---------------------------------------------------------------
let yaw = 0, drag = null;
const hits = () => PARTS.flatMap((p) => (p.hit || []).map((h) => ({ ...h, part: p })));
const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, z: p.z }; };
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, moved: false }; });
addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) yaw = drag.yaw - dx * 0.006; });
addEventListener("pointerup", (e) => {
  const d = drag; drag = null; if (!d || d.moved || BUILD) return;
  let best = null, bd = 64;
  hits().forEach((h) => { if (h.part.update && !h.part.group.visible) return; const s = toScreen(h.pos); if (s.z > 1) return; const dd = Math.hypot(s.x - e.clientX, s.y - e.clientY); if (dd < bd) { bd = dd; best = h; } });
  if (best) { const act = () => ACTS[best.kind](best); const to = near(best.pos); if (to && onDeck(best.pos.x, best.pos.z)) { player.goal = to; player.then = act; } else act(); return; }
  hush();
  const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const p = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP), p) && onDeck(p.x, p.z)) { player.goal = p; player.then = null; }
});
addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---- how the deck is built (?build=1): each part appears in turn, with its name and source -------------------------------
const cap = el("div", "dk-build"); cap.hidden = !BUILD; rootEl.appendChild(cap);
let buildStep = BUILD ? 0 : PARTS.length;
function showBuild() {
  PARTS.forEach((p, i) => { p.group.visible = i < buildStep; });
  if (!BUILD) return;
  const list = el("ol"); PARTS.forEach((p, i) => { const li = el("li", i < buildStep ? (i === buildStep - 1 ? "now" : "") : "later"); li.append(el("b", "", p.name), el("span", "", " " + p.from)); list.appendChild(li); });
  cap.replaceChildren(el("p", "", "How this deck is built: " + Math.min(buildStep, PARTS.length) + " of " + PARTS.length + " parts"), list,
    row(btn(buildStep < PARTS.length ? "Next part" : "Start again", () => { buildStep = buildStep < PARTS.length ? buildStep + 1 : 1; showBuild(); }), btn("Play the deck", () => { location.search = DEMO ? "?demo=1" : ""; }, true)));
}
if (BUILD) buildStep = 1;
showBuild();
if (BUILD) { const tick = setInterval(() => { if (buildStep >= PARTS.length) return clearInterval(tick); buildStep++; showBuild(); }, 1400); }

// ---- render ------------------------------------------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.setPixelRatio(PR);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth * PR, innerHeight * PR), 0.32, 0.4, 0.92));
composer.addPass(new OutputPass());
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (live.sending != null) { live.sending = Math.min(1, live.sending + dt / 7); if (live.sending >= 1) { live.sending = null; say(new THREE.Vector3(-9, 1.2, -2.6), null, "The boat is out in the fog. The tide has turned; the studio boats are free."); } }
  if (player.goal) {
    const d = new THREE.Vector3(player.goal.x - player.pos.x, 0, player.goal.z - player.pos.z), L = d.length();
    if (L < 0.08) { player.goal = null; setWalking(false); const then = player.then; player.then = null; if (then) then(); }
    else { setWalking(true); d.setLength(Math.min(L, dt * 2.6)); player.pos.add(d); player.group.rotation.y = Math.atan2(d.x, d.z); }
  }
  player.group.position.copy(player.pos);
  if (player.mixer) player.mixer.update(dt);
  const s = st(t); PARTS.forEach((p) => p.update && p.update(s));
  const focus = BUILD ? new THREE.Vector3(0.2, -0.4, -6) : new THREE.Vector3(player.pos.x * 0.5, -0.4, player.pos.z - 11);
  const eye = BUILD ? new THREE.Vector3(1.2, 5.0, 11.0) : focus.clone().add(new THREE.Vector3(Math.sin(yaw) * 19, 6.2, Math.cos(yaw) * 19));
  camera.position.lerp(eye, BUILD || page.frames === 0 ? 1 : 0.08);
  camera.lookAt(focus);
  if (anchor) { const p = toScreen(anchor); const w = bubble.offsetWidth, h = bubble.offsetHeight; bubble.style.transform = "translate(" + Math.round(Math.max(8, Math.min(innerWidth - w - 8, p.x - w / 2))) + "px," + Math.round(Math.max(8, Math.min(innerHeight - h - 90, p.y - h - 12))) + "px)"; }
  composer.render();
  page.frames++; if (page.frames > 2) page.ready = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// For checks (board/checks style): where a thing is on screen, and the trade hand's state.
page.where = (kind, i = 0) => { const h = hits().filter((x) => x.kind === kind)[i]; return h ? toScreen(h.pos) : null; };
page.state = () => JSON.parse(JSON.stringify(S));

// The money boat at its pier, played (Six-faces-council council/callsheets/pipeline/money-block/game-frame.md, Homeroom and
// Core loop; his A on mb-pier-look-1). The parts above drew the pier and the boat; this file walks the captain down the
// pier, across the plank and onto the boat's deck, where the crate is worked, and plays the trade hand (trade-hand.js).
// When the crate is sent the captain steps back onto the pier and the boat sails with it. Tap where to walk; tap the
// crate, the spirit, the plank, the crew bell, a studio boat, a boat at anchor, the tide post or the route book to go to
// it. Drag turns the view. ?build=1 assembles the deck part by part with each part's source (his note on mb-gate-look-3).
// ?demo=1 plays the sample chart without writing to this device; ?demo=return also brings a boat home at once.
// The return (his note on mb-return-build-look-1): a boat out a day or more sails home on its own when the player visits;
// its crate opens on one opportunity card from fixtures/trade-deck/opportunities.json, drawn in the app's card system.
const TH = window.__tradeHand, OPPS = window.__tradeDeckOpps;
const params = new URLSearchParams(location.search);
const DEMO = ["1", "return"].includes(params.get("demo")), BUILD = params.get("build") === "1";
const now = () => new Date().toISOString();
let S = (!DEMO && TH.store.get()) || TH.blank(now(), window.__tradeDeckChart);
const save = () => { if (!DEMO) TH.store.put(S); };
TH.deal(S, now()); TH.settleFog(S, now());
// A disposable sample opens at the returning boat for the board's look. It never writes the player's store.
if (params.get("demo") === "return") TH.release(S, "sent", now());
save();
const page = window.__tradeDeck = { ready: false, frames: 0, parts: PARTS.map((p) => p.id), build: BUILD, bubble: null, model: null, card: null };

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

// ---- where things stand at the pier (money pier round 1's make/stills.js placings) ---------------------------------------
const part = (id) => PARTS.find((p) => p.id === id);
const boatGrp = part("berth").group.children.find((c) => c.isGroup);
// Move a reused part to its place at the pier: `local` is a point in the part's own drawing, `world` where it lands.
function place(id, local, world, s = 1) {
  const g = part(id).group; g.scale.setScalar(s); g.position.set(world[0] - s * local[0], world[1] - s * local[1], world[2] - s * local[2]);
  g.updateMatrixWorld(true); (part(id).hit || []).forEach((h) => h.pos.applyMatrix4(g.matrixWorld));
}
place("tidepost", [8.6, -3.2, -9.5], [-1.15, -3.2, -12.6]);
place("lectern", [-4.4, DY, 4.2], [-0.95, PIER.y, -9.6], 0.85);
place("bell", [5.0, DY, -0.4], [BERTH.x + 1.25, -2.42, BERTH.z + 2.4], 0.55);
boatGrp.attach(part("bell").group); // the crew bell rides the boat's stern
const hitOf = (kind) => PARTS.flatMap((p) => p.hit || []).find((h) => h.kind === kind).pos;

// ---- the walkable ground: the pier, the plank, the boat's deck ------------------------------------------------------------
const BOAT_Y = BERTH.y - 0.35 + boatProto.userData.deckY, PLZ = BERTH.z + 1.6, PIER_EDGE = PIER.x + PIER.w / 2, BOAT_IN = BERTH.x - 1.5;
const PIER_END = new THREE.Vector3(PIER_EDGE - 0.4, PIER.y, PLZ), BOAT_END = new THREE.Vector3(BOAT_IN + 0.4, BOAT_Y, PLZ);
// the berth stands empty from the moment today's boat sails until tomorrow's crate is dealt
const berthEmpty = () => !!S.crate && S.crate.state === "sent" && live.sending == null;
const plankOut = () => !(live.sending > 0) && !berthEmpty();
function where(x, z) {
  if (Math.abs(x - PIER.x) < PIER.w / 2 - 0.2 && z < PIER.z0 - 0.3 && z > PIER.z1 + 0.3) return "pier";
  if (returnMoored()) {
    if (x <= -PIER.w / 2 + 0.3 && x >= RET.x + 1.1 && Math.abs(z - RET_Z) < 0.32) return "return-plank";
    const taper = Math.min(1, ((RET.z + 3.9) - z) / 1.8);
    if (z > RET.z - 3.0 && taper > 0 && Math.abs(x - RET.x) < 1.45 * taper) return "return-boat";
  }
  if (!plankOut()) return null;
  if (x >= PIER_EDGE - 0.3 && x <= BOAT_IN + 0.3 && Math.abs(z - PLZ) < 0.32) return "plank";
  const taper = Math.min(1, (z - (BERTH.z - 3.9)) / 1.8);
  if (z < BERTH.z + 3.0 && taper > 0 && Math.abs(x - BERTH.x) < 1.45 * taper) return "boat";
  return null;
}
// The west berth is independent of today's boat. It is walkable only after the returning boat moors.
const RET_Y = RET.y - 0.35 + boatProto.userData.deckY, RET_Z = RET.z - 1.6;
const RET_PIER = new THREE.Vector3(-PIER.w / 2 + 0.4, PIER.y, RET_Z);
const RET_END = new THREE.Vector3(RET.x + 1.1, RET_Y, RET_Z);
const returnMoored = () => !!live.ret && live.ret.come === 0 && !live.ret.leaving;
const onDeck = (x, z) => !!where(x, z);
const heightAt = (x, z) => { const w = where(x, z); if (w === "return-boat") return RET_Y; if (w === "return-plank") return PIER.y + (RET_Y - PIER.y) * Math.min(1, Math.max(0, (-x - PIER.w / 2) / (-(RET.x + 1.5) - PIER.w / 2))); if (w === "boat") return BOAT_Y; if (w === "plank") return PIER.y + (BOAT_Y - PIER.y) * Math.min(1, Math.max(0, (x - PIER_EDGE) / (BOAT_IN - PIER_EDGE))); return PIER.y; };
const side = (x, z) => { const w = where(x, z); if (w === "return-plank") return x > -2 ? "pier" : "return-boat"; return w === "plank" ? (x - PIER_EDGE < BOAT_IN - x ? "pier" : "boat") : w; };

// ---- the captain -------------------------------------------------------------------------------------------------------
const player = { group: new THREE.Group(), pos: new THREE.Vector3(0, PIER.y, 7.0), path: [], then: null, mixer: null, acts: {}, walking: false };
const aboard = () => side(player.pos.x, player.pos.z) === "boat";
// Walk to p, crossing the plank when p is on the other side of it.
function goTo(p, then = null) {
  const a = side(player.pos.x, player.pos.z), b = side(p.x, p.z);
  const via = [];
  if (a && b && a !== b) {
    if (a === "return-boat") via.push(RET_END, RET_PIER);
    if (a === "boat") via.push(BOAT_END, PIER_END);
    if (b === "return-boat") via.push(RET_PIER, RET_END);
    if (b === "boat") via.push(PIER_END, BOAT_END);
  }
  player.path = via.map((v) => v.clone()).concat([p]);
  player.then = then;
}
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
// Where to stand to work a thing: on the boat, between the plank and the thing; elsewhere, a step short of it.
const near = (v) => {
  if (Math.abs(v.x - BERTH.x) < 2.4 && v.z > BERTH.z - 5 && v.z < BERTH.z + 4) {
    if (!plankOut()) return null;
    const d = new THREE.Vector3(BOAT_END.x - v.x, 0, BOAT_END.z - v.z), L = d.length(); if (L < 1.1) return BOAT_END.clone();
    const p = new THREE.Vector3(v.x, 0, v.z).addScaledVector(d.normalize(), 1.0); return onDeck(p.x, p.z) ? p : BOAT_END.clone();
  }
  const d = new THREE.Vector3(v.x - player.pos.x, 0, v.z - player.pos.z); const L = d.length(); if (L < 2.2) return null; d.setLength(L - 1.8); const p = player.pos.clone().add(d); return onDeck(p.x, p.z) ? p : null;
};

// ---- live state the parts draw -----------------------------------------------------------------------------------------
// A boat out a day or more is already sailing home when the player arrives; ?demo=return brings the sample's boat at once.
const homeBoat = params.get("demo") === "return" ? S.boats.find((b) => !b.back) : BUILD ? null : TH.homeward(S, now());
const live = { sending: null, crew: false, ringing: 0, rowing: -1, ret: homeBoat ? { id: homeBoat.id, come: 1, open: 0, kind: null } : null };
const LEVEL = { stranger: 0, known: 0.33, trusted: 0.66, route: 1 };
function st(t) {
  const waiting = !!S.crate && S.crate.state === "waiting";
  return { t, waiting, turned: TH.tideTurned(S) && !!S.crate, spiritSide: waiting && S.crate.spiritSide, sending: live.sending, berthEmpty: berthEmpty(), crew: live.crew || (S.crate && S.crate.state === "crew"),
    ret: live.ret, returningIndex: live.ret ? S.boats.filter((b) => !b.back).findIndex((b) => b.id === live.ret.id) : -1, ringing: live.ringing > t, rowing: live.rowing, fog: S.fog, tide: TH.tideLine(S, now()).level, routes: S.routes.length,
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
const field = (ph, big) => { const f = el(big ? "textarea" : "input", "dk-field"); f.placeholder = ph; if (ph) f.setAttribute("aria-label", ph); if (big) f.rows = 2; f.addEventListener("pointerdown", (e) => e.stopPropagation()); return f; };
const portName = (id) => (S.ports.find((p) => p.id === id) || { name: "a port" }).name;
const done = () => { save(); drawPlate(); returnHint = null; }; // the frame puts a return hint back on the plate
const crateAt = () => hitOf("crate").clone().add(new THREE.Vector3(0, 1.6, 0));
const spiritAt = () => hitOf("spirit").clone().add(new THREE.Vector3(0, 1.1, 0));

const ACTS = {
  crate() {
    const c = S.crate;
    if (!c) {
      const pick = el("select", "dk-field"); S.ports.forEach((p) => pick.appendChild(Object.assign(el("option", "", p.name), { value: p.id })));
      const act = field("One money move, fifteen minutes"), ask = field("What it asks for (optional)");
      return say(crateAt(), null, S.moves.length ? "The hatch is clear for today. Tomorrow's crate waits in chalk." : "The hatch is clear. Chalk tomorrow's crate?", pick, act, ask,
        row(btn("Chalk it", () => { if (!act.value.trim()) return act.focus(); TH.chalk(S, pick.value, act.value.trim(), ask.value.trim(), now()); done(); say(crateAt(), null, "Chalked. It will be on the hatch in the morning."); })));
    }
    if (c.state !== "waiting") return say(crateAt(), null, c.state === "sent" ? "Today's crate sailed. The tide has turned." : c.state === "sat" ? "You sat with today's crate. The tide has turned." : "The crew has today's crate. The tide has turned.");
    const b = TH.bounty(S, now()), extra = +c.bonus || 0;
    const head = portName(c.port) + (b ? " · it has waited, and pays " + (TH.PAY.crate + b + extra) : extra ? " · a boat brought it, and it pays " + (TH.PAY.crate + extra) : "");
    if (c.presence == null) {
      return say(crateAt(), head, c.action + (c.ask ? " Ask: " + c.ask + "." : ""), el("p", "dk-q", "How present are you right now? 1 is far away, 5 is fully here."),
        row(...[1, 2, 3, 4, 5].map((n) => btn(String(n), () => { TH.presence(S, n, now()); done(); ACTS.crate(); }, true))));
    }
    if (c.spiritSide) return ACTS.spirit();
    say(crateAt(), head, c.action + (c.ask ? " Ask: " + c.ask + "." : ""),
      row(btn("I sent it", () => send()), btn("Sit with it", () => sit(0), true), btn("Ring the crew bell", () => ACTS.bell(), true)));
  },
  spirit() {
    const at = spiritAt();
    const c = S.crate;
    if (!c || c.state !== "waiting") return say(at, "The spirit", "Nothing waits on the hatch. I'm still here.");
    if (c.spiritSide) return say(at, "The spirit", "I go far away when money comes up. Sit with me before you lift it?", row(btn("Sit with it", () => sit(0)), btn("Lift it anyway", () => { c.spiritSide = false; done(); ACTS.crate(); }, true)));
    say(at, "The spirit", "I'm the voice that leaves when money comes up. I'll stay if you sit with me.", row(btn("Sit with it", () => sit(0), true)));
  },
  plank() {
    if (!plankOut()) return say(PIER_END.clone().add(new THREE.Vector3(0, 1.4, 0)), null, "The plank is in. The boat is out with today's crate, and comes back to the pier tomorrow.");
    hush(); goTo(aboard() ? new THREE.Vector3(PIER.x + 0.2, PIER.y, PLZ + 0.6) : BOAT_END.clone().add(new THREE.Vector3(0.5, 0, -0.4)));
  },
  bell() {
    const at = hitOf("bell").clone().add(new THREE.Vector3(0, 1.0, 0));
    if (!S.crate || S.crate.state !== "waiting") return say(at, "The crew bell", "The crew has nothing waiting from you.");
    const note = field("What should the crew do with it?", true);
    say(at, "The crew bell", "Hand today's crate to the crew with a note. It counts as off the hatch.", note, row(btn("Ring it", () => {
      const c = S.crate, line = "Today's money move, handed to you: " + c.action + " (" + portName(c.port) + "). " + (note.value.trim() ? "Note: " + note.value.trim() : "");
      try { navigator.clipboard.writeText(line); } catch (e) { /* the line stays in the record */ }
      live.ringing = clock.elapsedTime + 1.6; live.crew = true; TH.release(S, "crew", now(), note.value.trim()); done();
      say(at, "The crew bell", "The bell rang. I copied your note; paste it to Claude. The tide has turned.");
    })));
  },
  studio(h) {
    const at = h.pos.clone().add(new THREE.Vector3(0, 3.6, 0));
    if (TH.tideTurned(S)) return say(at, "A studio boat", "The tide carries the studio boats today. Sail where you love to go.");
    say(at, "A studio boat", "The tide is in until today's crate is off. Row against it for one vibeulon?", row(btn("Row out", () => {
      const r = TH.rowAgainst(S, now()); if (!r.ok) return say(at, "A studio boat", "The hold has no vibeulon to row with yet. Today's crate pays three.");
      live.rowing = h.i; done(); say(at, "A studio boat", "You row out against the tide.");
    }, true)));
  },
  boat(h) {
    const b = S.boats.filter((boat) => !boat.back)[h.i]; if (!b) return;
    const at = h.pos.clone().add(new THREE.Vector3(0, 2.4, 0));
    const out = Math.max(0, Math.floor((Date.parse(now()) - Date.parse(b.sentAt)) / 864e5));
    say(at, "A boat out at " + portName(b.port), "It carried “" + b.action + "”. " + (out < TH.HOME_AFTER_DAYS ? "It sailed today, and it sails home on its own once a day has passed." : "It sails home on its own; one boat comes in each time you visit."));
  },
  returnCrate() {
    if (!returnMoored() || live.ret.open) return;
    const b = S.boats.find((boat) => boat.id === live.ret.id && !boat.back); if (!b) return;
    const opp = TH.opportunity(S, b.id, OPPS); if (!opp) return departReturn();
    hush(); live.ret.open = 1; live.ret.kind = "opportunity"; showCard(opp);
  },
  // Coin is logged here, quietly, and never asked for at the return (his note on mb-return-build-look-1).
  tide(_, adding) {
    const at = hitOf("tide").clone().add(new THREE.Vector3(0, 2.6, 0)), t = TH.tideLine(S, now());
    const line = "This month: " + money(t.coin) + (t.goal ? " of " + money(t.goal) + "." : ".");
    if (!adding) return say(at, "The tide post", line, row(btn("Add coin", () => ACTS.tide(null, true), true)));
    const amt = field("Amount"); amt.type = "number"; amt.min = "0.01"; amt.step = "0.01"; amt.inputMode = "decimal"; amt.addEventListener("input", () => amt.setCustomValidity(""));
    const pick = el("select", "dk-field"); pick.setAttribute("aria-label", "Which port it came from"); S.ports.forEach((p) => pick.appendChild(Object.assign(el("option", "", p.name), { value: p.id })));
    say(at, "The tide post", line + " Coin that came in raises the water.", amt, pick, row(btn("Add it", () => {
      if (!(+amt.value > 0) || !Number.isFinite(+amt.value)) { amt.setCustomValidity("Enter an amount greater than zero."); amt.reportValidity(); return; }
      TH.addCoin(S, +amt.value, pick.value, now()); done(); ACTS.tide();
    }), btn("Not now", hush, true)));
  },
  book() {
    const lines = TH.routeBook(S).filter((p) => p.routes.length).map((p) => el("p", "", p.port.name + ": " + p.routes.map((r) => r.action + (r.words ? " (“" + r.words + "”)" : "")).join("; ")));
    say(hitOf("book").clone().add(new THREE.Vector3(0, 0.8, 0)), "The route book", lines.length ? "The routes that brought coin back:" : "No routes yet. A boat that comes back with coin writes the first page.", ...lines);
  },
  port(h) { const p = S.ports[h.i]; if (!p) return; const words = { stranger: "still in fog: no boat has reached it yet", known: "known: a boat has reached it", trusted: "trusted: coin has come back from it", route: "a standing route: coin came back twice" }; say(h.pos, p.name, words[p.standing] + "."); },
};
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
// ---- the opportunity card the returning crate opens on (bars-engine UI_COVENANT.md: a Cultivation Card) -----------------
// Element: the port's (opportunities.json "elements"). Altitude: satisfied, since it is a gift the port sent back.
// Stage: growing (full card: art window, name banner, description, stat block). Primary action in liminal purple.
const SIGIL = { wood: ["木", "Wood"], fire: ["火", "Fire"], earth: ["土", "Earth"], metal: ["金", "Metal"], water: ["水", "Water"] };
const ART = '<svg viewBox="0 0 160 84" aria-hidden="true" focusable="false"><defs><radialGradient id="opL" cx="50%" cy="58%" r="55%"><stop offset="0" stop-color="var(--el-glow)" stop-opacity=".9"/><stop offset="1" stop-color="var(--el-glow)" stop-opacity="0"/></radialGradient><linearGradient id="opB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient></defs><ellipse cx="80" cy="50" rx="78" ry="40" fill="url(#opL)"/><path d="M58 52 L48 2 L112 2 L102 52 Z" fill="url(#opB)" class="op-beam"/><path d="M54 52 L106 52 L104 80 L56 80 Z" fill="#7a4e30"/><path d="M56 52 L104 52 L103 58 L57 58 Z" fill="#ffd27a"/><path d="M66 52 v28 M94 52 v28" stroke="#5a3a24" stroke-width="5"/><path d="M54 52 L106 52 L114 30 L62 30 Z" fill="#9a6a44" stroke="#5a3a24" stroke-width="2" stroke-linejoin="round"/><g class="op-motes" fill="#ffe2a0"><circle cx="72" cy="36" r="2.4"/><circle cx="86" cy="24" r="1.8"/><circle cx="80" cy="12" r="2.2"/><circle cx="92" cy="40" r="1.6"/></g></svg>';
const card = el("article", "op-card"); card.hidden = true; card.setAttribute("aria-live", "polite"); rootEl.appendChild(card);
card.addEventListener("pointerdown", (e) => e.stopPropagation()); card.addEventListener("pointerup", (e) => e.stopPropagation());
function showCard(o) {
  const [sigil, label] = SIGIL[o.element] || SIGIL.earth;
  card.dataset.element = o.element; card.className = "op-card op-enter";
  card.setAttribute("aria-label", label + " element card, satisfied altitude, growing stage: " + o.title + ", from " + o.portName);
  const art = el("div", "op-art"); art.innerHTML = ART;
  const from = el("p", "op-from"); from.append(el("span", "op-sigil", sigil), el("span", "", label + " · from " + o.portName)); art.appendChild(from);
  const cost = el("div", "op-cost"); cost.append(el("b", "", "15"), el("span", "", "min")); cost.setAttribute("aria-label", "about fifteen minutes");
  const name = el("h2", "op-name"); name.append(el("i", "op-gem"), el("span", "", o.title));
  const well = el("div", "op-well"); well.append(el("p", "op-line", o.line), el("p", "op-act", o.action));
  const stats = el("div", "op-stats");
  const plus = el("p", "op-plus"); plus.append(el("b", "", "+" + o.bonus), el("span", "", " vibeulons"));
  stats.append(plus, el("p", "op-pay", "on top of the usual " + o.pay));
  const take = cardBtn("Take it aboard", () => {
    const r = TH.takeAboard(S, o, now()); if (!r) return; done();
    settle(r.today ? "It is aboard, and it waits on the hatch now. It pays " + (o.pay + o.bonus) + " when it is off." : "It is aboard, chalked for the next hatch. It pays " + (o.pay + o.bonus) + " when it is off.", true);
  });
  const drift = cardBtn("Let it drift", () => { TH.letDrift(S, o, now()); done(); settle("It drifts back out to sea. Another boat will bring another.", false); }, true);
  const moves = el("div", "op-moves"); moves.append(take, drift);
  card.replaceChildren(el("div", "op-grad"), cost, art, name, well, stats, moves);
  card.hidden = false; page.card = { title: o.title, action: o.action, bonus: o.bonus, element: o.element, state: "open" };
  try { navigator.vibrate?.([15, 5, 10]); } catch (e) { /* no haptics here */ }
  requestAnimationFrame(() => take.focus({ preventScroll: true }));
}
function cardBtn(text, fn, quiet) { const b = el("button", quiet ? "op-btn quiet" : "op-btn", text); b.type = "button"; b.addEventListener("click", (e) => { e.stopPropagation(); fn(); }); return b; }
function settle(text, taken) {
  card.classList.add(taken ? "op-taken" : "op-drift");
  const note = el("p", "op-settled", text); note.setAttribute("role", "status");
  card.querySelector(".op-moves").replaceWith(note);
  page.card.state = taken ? "aboard" : "drifted";
  if (live.ret) live.ret.open = taken ? 1 : 0.35;
  setTimeout(() => { card.classList.remove("op-enter"); card.classList.add("op-leave"); setTimeout(() => { card.hidden = true; page.card = null; departReturn(); }, 420); }, 2600);
}
function departReturn() {
  hush();
  if (!live.ret) return;
  goTo(RET_PIER.clone(), () => { if (live.ret) live.ret.leaving = true; });
}
function send() {
  const c = S.crate; if (!c || c.state !== "waiting") return;
  TH.release(S, "sent", now()); done(); hush(); live.sending = 0; // the boat waits at 0 until the captain is back on the pier
  if (aboard() || side(player.pos.x, player.pos.z) == null) goTo(new THREE.Vector3(PIER.x + 0.3, PIER.y, PLZ + 0.8));
}
// The 3-2-1 with the spirit (Big Mind's three faces): look at it, talk to it, be it. The words stay on screen only.
function sit(step) {
  const at = spiritAt();
  const steps = ["Three: look at it. What does the voice that leaves look like? Call it “it”.", "Two: talk to it. What does it want you to know?", "One: be it. Say “I am…” and let it speak."];
  if (step >= steps.length) { TH.release(S, "sat", now()); done(); return say(at, "The spirit", "Thank you for sitting with me. That minted a vibeulon, and the tide has turned."); }
  const f = field("", true);
  say(at, "Sitting with the spirit", steps[step], f, row(btn(step < 2 ? "Next" : "Done", () => sit(step + 1)), btn("Rest here instead", hush, true)));
}

// ---- input: tap to walk or to go to a thing, drag to turn ---------------------------------------------------------------
let yaw = 0, drag = null;
const hits = () => {
  const returningIndex = live.ret ? S.boats.filter((b) => !b.back).findIndex((b) => b.id === live.ret.id) : -1;
  const all = PARTS.flatMap((p) => (p.hit || []).filter((h) => h.kind !== "boat" || (h.i < S.boats.filter((b) => !b.back).length && h.i !== returningIndex)).map((h) => ({ ...h, part: p })));
  if (returnMoored()) {
    scene.updateMatrixWorld(true);
    all.push({ pos: window.__ret.crate.getWorldPosition(new THREE.Vector3()), kind: "returnCrate", part: part("returnBerth") });
  }
  return all;
};
const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, z: p.z }; };
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, moved: false }; });
addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) yaw = drag.yaw - dx * 0.006; });
addEventListener("pointerup", (e) => {
  const d = drag; drag = null; if (!d || d.moved || BUILD) return;
  let best = null, bd = 64;
  hits().forEach((h) => { if (h.part.update && !h.part.group.visible) return; const s = toScreen(h.pos); if (s.z > 1) return; const dd = Math.hypot(s.x - e.clientX, s.y - e.clientY); if (dd < bd) { bd = dd; best = h; } });
  if (best) { if (best.kind === "returnCrate") { goTo(new THREE.Vector3(RET.x + 0.5, RET_Y, RET.z - 0.7), () => ACTS.returnCrate()); return; } if (best.kind === "plank") return ACTS.plank(); const act = () => ACTS[best.kind](best); const to = near(best.pos); if (to) goTo(to, act); else act(); return; }
  hush();
  const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  // the boat's deck sits lower than the pier: try it first, then the pier and the plank
  for (const y of [BOAT_Y, RET_Y, PIER.y]) { const p = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), p) && where(p.x, p.z) && (y === PIER.y || where(p.x, p.z) === "boat" || where(p.x, p.z) === "return-boat")) { goTo(p); return; } }
});
addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

// ---- how the deck is built (?build=1): each part appears in turn, with its name and source -------------------------------
const cap = el("div", "dk-build"); cap.hidden = !BUILD; rootEl.appendChild(cap);
let buildStep = BUILD ? 0 : PARTS.length;
function showBuild() {
  PARTS.forEach((p, i) => { p.group.visible = i < buildStep; });
  if (!BUILD) return;
  const list = el("ol"); PARTS.forEach((p, i) => { const li = el("li", i < buildStep ? (i === buildStep - 1 ? "now" : "") : "later"); li.append(el("b", "", p.name), el("span", "", " " + p.from)); list.appendChild(li); });
  cap.replaceChildren(el("p", "", "How the pier and boat are built: " + Math.min(buildStep, PARTS.length) + " of " + PARTS.length + " parts"), list,
    row(btn(buildStep < PARTS.length ? "Next part" : "Start again", () => { buildStep = buildStep < PARTS.length ? buildStep + 1 : 1; showBuild(); }), btn("Play it", () => { location.search = DEMO ? "?demo=1" : ""; }, true)));
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
let returnHint = "";
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  // the boat casts off once the captain is back on the pier, and sails with the crate for seven seconds
  if (live.sending != null && !(live.sending === 0 && (aboard() || player.path.length))) { live.sending = Math.min(1, live.sending + dt / 7); if (live.sending >= 1) { live.sending = null; say(new THREE.Vector3(BERTH.x, -0.4, BERTH.z), null, "The boat is out in the fog. The tide has turned, and the studio boats are free."); } }
  if (live.ret && live.ret.come > 0 && !live.ret.leaving) live.ret.come = Math.max(0, live.ret.come - dt / 7);
  if (live.ret && live.ret.leaving) { live.ret.come = Math.min(1, live.ret.come + dt / 7); if (live.ret.come >= 1) live.ret = null; }
  const goal = player.path[0];
  if (goal) {
    const d = new THREE.Vector3(goal.x - player.pos.x, 0, goal.z - player.pos.z), L = d.length();
    if (L < 0.08) { player.path.shift(); if (!player.path.length) { setWalking(false); const then = player.then; player.then = null; if (then) then(); } }
    else { setWalking(true); d.setLength(Math.min(L, dt * 2.6)); player.pos.add(d); player.group.rotation.y = Math.atan2(d.x, d.z); }
  }
  player.pos.y = heightAt(player.pos.x, player.pos.z);
  player.group.position.copy(player.pos);
  if (player.mixer) player.mixer.update(dt);
  const homeFrom = live.ret ? portName((S.boats.find((b) => b.id === live.ret.id) || {}).port) : "";
  const hint = live.ret && !live.ret.leaving ? (page.card ? (page.card.state === "open" ? "The crate from " + homeFrom + " opened on a card." : "The boat heads back out to sea.") : live.ret.come > 0 ? "A boat is sailing home from " + homeFrom + "." : "Your boat is home from " + homeFrom + ", and its crate is glowing. Tap it to open it.") : "";
  if (hint !== returnHint) { returnHint = hint; if (hint) plate.textContent = hint; else drawPlate(); }
  const s = st(t); PARTS.forEach((p) => p.update && p.update(s));
  // a phone stands the camera further back, so the boat's stern stays in frame (money pier round 1, "not checked")
  const far = innerWidth / innerHeight < 0.8 ? 1.5 : 1;
  const focus = BUILD ? new THREE.Vector3(2.0, -2.2, -3.5) : new THREE.Vector3(player.pos.x * 0.5 + (live.ret ? -0.8 : 1.2), player.pos.y + 0.2, player.pos.z - 8);
  const eye = BUILD ? new THREE.Vector3(-5.0, 4.5, 12.0 * far) : focus.clone().add(new THREE.Vector3(Math.sin(yaw) * 15 * far, 5.6, Math.cos(yaw) * 15 * far));
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
page.live = () => ({ ret: live.ret ? { ...live.ret } : null, plate: plate.textContent });

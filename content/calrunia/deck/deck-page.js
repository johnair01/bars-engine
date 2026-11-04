// The money boat at its pier, played (Six-faces-council council/callsheets/pipeline/money-block/game-frame.md, Homeroom and
// Core loop; his A on mb-pier-look-1). The parts above drew the pier and the boat; this file walks the captain down the
// pier, across the plank and onto the boat's deck, where the crate is worked, and plays the trade hand (trade-hand.js).
// When the crate is sent the captain steps back onto the pier and the boat sails with it. Days later the player taps a boat
// at anchor and says it is back: it comes in out of the fog to the return berth on the pier's west side (return.js, his A
// on mb-return-look-1), the captain crosses its plank and opens its crate: coin, a no, or still out. Tap where to walk; tap the
// crate, the spirit, the plank, the crew bell, a studio boat, a boat at anchor, the tide post or the route book to go to
// it. Drag turns the view. ?build=1 assembles the deck part by part with each part's source (his note on mb-gate-look-3).
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

// ---- the walkable ground: the pier, the plank, the boat's deck, and the west plank and deck of a boat that came back ------
const BOAT_Y = BERTH.y - 0.35 + boatProto.userData.deckY, PLZ = BERTH.z + 1.6, PIER_EDGE = PIER.x + PIER.w / 2, BOAT_IN = BERTH.x - 1.5;
const PIER_END = new THREE.Vector3(PIER_EDGE - 0.4, PIER.y, PLZ), BOAT_END = new THREE.Vector3(BOAT_IN + 0.4, BOAT_Y, PLZ);
// the berth stands empty from the moment today's boat sails until tomorrow's crate is dealt
const berthEmpty = () => !!S.crate && S.crate.state === "sent" && live.sending == null;
const plankOut = () => !(live.sending > 0) && !berthEmpty();
// the return berth (return.js): its plank runs west from the pier to a boat moored with its bow toward the pier's root
const RPLZ = RET.z - 1.6, PIER_WEST = PIER.x - PIER.w / 2, RET_IN = RET.x + 1.5;
const RPIER_END = new THREE.Vector3(PIER_WEST + 0.4, PIER.y, RPLZ), RET_END = new THREE.Vector3(RET_IN - 0.4, BOAT_Y, RPLZ);
const retMoored = () => !!live.ret && live.ret.come === 0;
function where(x, z) {
  if (Math.abs(x - PIER.x) < PIER.w / 2 - 0.2 && z < PIER.z0 - 0.3 && z > PIER.z1 + 0.3) return "pier";
  if (retMoored() && x < PIER_WEST + 0.3) {
    if (x >= RET_IN - 0.3 && Math.abs(z - RPLZ) < 0.32) return "retplank";
    const tp = Math.min(1, (RET.z + 3.9 - z) / 1.8);
    if (z > RET.z - 3.0 && tp > 0 && Math.abs(x - RET.x) < 1.45 * tp) return "ret";
  }
  if (!plankOut()) return null;
  if (x >= PIER_EDGE - 0.3 && x <= BOAT_IN + 0.3 && Math.abs(z - PLZ) < 0.32) return "plank";
  const taper = Math.min(1, (z - (BERTH.z - 3.9)) / 1.8);
  if (z < BERTH.z + 3.0 && taper > 0 && Math.abs(x - BERTH.x) < 1.45 * taper) return "boat";
  return null;
}
const onDeck = (x, z) => !!where(x, z);
const heightAt = (x, z) => { const w = where(x, z); if (w === "boat" || w === "ret") return BOAT_Y; if (w === "retplank") return PIER.y + (BOAT_Y - PIER.y) * Math.min(1, Math.max(0, (PIER_WEST - x) / (PIER_WEST - RET_IN))); if (w === "plank") return PIER.y + (BOAT_Y - PIER.y) * Math.min(1, Math.max(0, (x - PIER_EDGE) / (BOAT_IN - PIER_EDGE))); return PIER.y; };
const side = (x, z) => { const w = where(x, z); return w === "plank" ? (x - PIER_EDGE < BOAT_IN - x ? "pier" : "boat") : w === "retplank" ? (PIER_WEST - x < x - RET_IN ? "pier" : "ret") : w; };

// ---- the captain -------------------------------------------------------------------------------------------------------
const player = { group: new THREE.Group(), pos: new THREE.Vector3(0, PIER.y, 7.0), path: [], then: null, mixer: null, acts: {}, walking: false };
const aboard = () => side(player.pos.x, player.pos.z) === "boat";
const onReturn = () => ["ret", "retplank"].includes(where(player.pos.x, player.pos.z));
// Walk to p, crossing a plank (or both, boat to boat by the pier) when p is on the other side of it.
const ENDS = { boat: [BOAT_END, PIER_END], ret: [RET_END, RPIER_END] }; // [the end aboard, the end on the pier]
function goTo(p, then = null) {
  const a = side(player.pos.x, player.pos.z), b = side(p.x, p.z), path = [];
  if (a && b && a !== b) { if (a !== "pier") path.push(...ENDS[a]); if (b !== "pier") path.push(ENDS[b][1], ENDS[b][0]); }
  player.path = path.map((v) => v.clone()).concat([p]);
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
  if (Math.abs(v.x - RET.x) < 2.4 && v.z > RET.z - 4 && v.z < RET.z + 5) {
    if (!retMoored()) return null;
    const d = new THREE.Vector3(RET_END.x - v.x, 0, RET_END.z - v.z), L = d.length(); if (L < 1.1) return RET_END.clone();
    const p = new THREE.Vector3(v.x, 0, v.z).addScaledVector(d.normalize(), 1.0); return where(p.x, p.z) === "ret" ? p : RET_END.clone();
  }
  if (Math.abs(v.x - BERTH.x) < 2.4 && v.z > BERTH.z - 5 && v.z < BERTH.z + 4) {
    if (!plankOut()) return null;
    const d = new THREE.Vector3(BOAT_END.x - v.x, 0, BOAT_END.z - v.z), L = d.length(); if (L < 1.1) return BOAT_END.clone();
    const p = new THREE.Vector3(v.x, 0, v.z).addScaledVector(d.normalize(), 1.0); return onDeck(p.x, p.z) ? p : BOAT_END.clone();
  }
  const d = new THREE.Vector3(v.x - player.pos.x, 0, v.z - player.pos.z); const L = d.length(); if (L < 2.2) return null; d.setLength(L - 1.8); const p = player.pos.clone().add(d); return onDeck(p.x, p.z) ? p : null;
};

// ---- live state the parts draw -----------------------------------------------------------------------------------------
// ret: the boat that came back, while it runs in, waits at the west berth and leaves ({ id, come, open, ajar, kind, leaveAt })
const live = { sending: null, crew: false, ringing: 0, rowing: -1, ret: null };
// boats still out at anchor, in the order the anchored boats are drawn: not the one sailing now, not the one in at the berth
const atAnchor = () => { const out = S.boats.filter((b) => !b.back && !(live.ret && live.ret.id === b.id)); return live.sending != null ? out.slice(0, -1) : out; };
const LEVEL = { stranger: 0, known: 0.33, trusted: 0.66, route: 1 };
function st(t) {
  const waiting = !!S.crate && S.crate.state === "waiting";
  return { t, waiting, turned: TH.tideTurned(S) && !!S.crate, spiritSide: waiting && S.crate.spiritSide, sending: live.sending, berthEmpty: berthEmpty(), crew: live.crew || (S.crate && S.crate.state === "crew"),
    ringing: live.ringing > t, rowing: live.rowing, fog: S.fog, tide: TH.tideLine(S, now()).level, routes: S.routes.length,
    boatsOut: Math.min(5, atAnchor().length), ret: live.ret,
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
    const b = TH.bounty(S, now());
    const head = portName(c.port) + (b ? " · it has waited, and pays " + (TH.PAY.crate + b) : "");
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
    const b = atAnchor()[h.i]; if (!b) return;
    const at = h.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), carried = "It carried “" + b.action.replace(/[.\s]+$/, "") + "” to " + portName(b.port) + ".";
    if (live.ret) return say(at, "A boat at anchor", carried + " One boat is already in at the far side of the pier. Open its crate first.");
    say(at, "A boat at anchor", carried + " Has it come back?", row(btn("She's back", () => { hush(); live.ret = { id: b.id, come: 1, open: 0, ajar: false, kind: null, leaveAt: null }; goTo(RPIER_END.clone().add(new THREE.Vector3(0.5, 0, 0.9))); }), btn("Still out", hush, true)));
  },
  // the crate of a boat that came back, opened aboard: what came back is answered the same way for coin and for a no
  retcrate() {
    const r = live.ret; if (!r || r.come > 0) return;
    const b = S.boats.find((x) => x.id === r.id); if (!b) return;
    const at = retCrateAt();
    if (r.kind) return say(at, null, r.kind === "coin" ? "The coin is logged on the tide post." : "The spirit holds that one.");
    r.ajar = true;
    const amt = field("Amount"); amt.inputMode = "decimal"; const no = field("What the no taught you (optional)");
    say(at, "Back from " + portName(b.port), "It carried “" + b.action.replace(/[.\s]+$/, "") + "”. What did it bring back?", amt,
      row(btn("Coin", () => { if (!(+amt.value > 0)) return amt.focus(); TH.logReturn(S, b.id, { kind: "coin", amount: +amt.value }, now()); done(); r.kind = "coin"; keep(b, at, () => leave(1.2)); })), no,
      row(btn("A no", () => { TH.logReturn(S, b.id, { kind: "lesson", line: no.value.trim() }, now()); done(); r.kind = "lesson"; say(at, "The spirit", "I'll hold that one. Nothing of yours is any less."); leave(3.5); }, true),
        btn("Still out", () => { r.ajar = false; hush(); leave(0); }, true)));
  },
  retplank() {
    if (!retMoored()) return;
    hush(); goTo(onReturn() ? new THREE.Vector3(PIER.x - 0.2, PIER.y, RPLZ + 0.6) : RET_END.clone().add(new THREE.Vector3(-0.5, 0, 0.4)));
  },
  tide() { const t = TH.tideLine(S, now()); say(hitOf("tide").clone().add(new THREE.Vector3(0, 2.6, 0)), "The tide post", "This month: " + money(t.coin) + (t.goal ? " of " + money(t.goal) + "." : ".")); },
  book() {
    const lines = TH.routeBook(S).filter((p) => p.routes.length).map((p) => el("p", "", p.port.name + ": " + p.routes.map((r) => r.action + (r.words ? " (“" + r.words + "”)" : "")).join("; ")));
    say(hitOf("book").clone().add(new THREE.Vector3(0, 0.8, 0)), "The route book", lines.length ? "The routes that brought coin back:" : "No routes yet. A boat that comes back with coin writes the first page.", ...lines);
  },
  port(h) { const p = S.ports[h.i]; if (!p) return; const words = { stranger: "still in fog: no boat has reached it yet", known: "known: a boat has reached it", trusted: "trusted: coin has come back from it", route: "a standing route: coin came back twice" }; say(h.pos, p.name, words[p.standing] + "."); },
};
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
function keep(b, at, then) {
  const words = field("The words that worked (optional)");
  say(at, "Coin came back", "Keep this as a route in the route book?", words, row(btn("Keep the route", () => { TH.keepRoute(S, b.id, words.value.trim(), now()); done(); say(at, null, "Kept. The route book has a new page."); if (then) then(); }), btn("Not now", () => { hush(); if (then) then(); }, true)));
}
const retCrateAt = () => RETURN.crate.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.6, 0));
// The boat that came back leaves the berth once the captain is back on the pier: logged boats sail off into the fog;
// a boat still out goes back to anchor.
function leave(delay) { if (live.ret) live.ret.leaveAt = clock.elapsedTime + delay; }
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
const hits = () => PARTS.flatMap((p) => (p.hit || []).map((h) => ({ ...h, part: p })));
const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, z: p.z }; };
canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, moved: false }; });
addEventListener("pointermove", (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) yaw = drag.yaw - dx * 0.006; });
addEventListener("pointerup", (e) => {
  const d = drag; drag = null; if (!d || d.moved || BUILD) return;
  let best = null, bd = 64;
  hits().forEach((h) => { if (h.part.update && !h.part.group.visible) return; if ((h.kind === "retcrate" || h.kind === "retplank") && !retMoored()) return; const s = toScreen(h.pos); if (s.z > 1) return; const dd = Math.hypot(s.x - e.clientX, s.y - e.clientY); if (dd < bd) { bd = dd; best = h; } });
  if (best) { if (best.kind === "plank") return ACTS.plank(); if (best.kind === "retplank") return ACTS.retplank(); const act = () => ACTS[best.kind](best); const to = near(best.pos); if (to) goTo(to, act); else act(); return; }
  hush();
  const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  // the boat's deck sits lower than the pier: try it first, then the pier and the plank
  for (const y of [BOAT_Y, PIER.y]) { const p = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), p) && where(p.x, p.z) && (y === PIER.y || ["boat", "ret"].includes(where(p.x, p.z)))) { goTo(p); return; } }
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
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  // the boat casts off once the captain is back on the pier, and sails with the crate for seven seconds
  if (live.sending != null && !(live.sending === 0 && (aboard() || player.path.length))) { live.sending = Math.min(1, live.sending + dt / 7); if (live.sending >= 1) { live.sending = null; say(new THREE.Vector3(BERTH.x, -0.4, BERTH.z), null, "The boat is out in the fog. The tide has turned, and the studio boats are free."); } }
  // the boat that came back: runs in from the fog for six seconds, moors, its lid lifts, and it leaves once the captain is ashore
  const r = live.ret;
  if (r) {
    if (r.come > 0 && r.leaveAt == null) { r.come = Math.max(0, r.come - dt / 6); if (r.come === 0) say(RETURN.crate.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.2, 0)), null, "She's in at the far side of the pier. Cross her plank and open the crate."); }
    const want = r.kind ? 1 : r.ajar ? 0.25 : 0; r.open += Math.sign(want - r.open) * Math.min(Math.abs(want - r.open), dt * 1.2);
    if (r.leaveAt != null && t >= r.leaveAt) {
      if (onReturn()) { if (!player.path.length) goTo(new THREE.Vector3(PIER.x - 0.3, PIER.y, RPLZ + 0.8)); }
      else { r.come = Math.min(1, r.come + dt / 7); if (r.come >= 1) live.ret = null; }
    }
  }
  const goal = player.path[0];
  if (goal) {
    const d = new THREE.Vector3(goal.x - player.pos.x, 0, goal.z - player.pos.z), L = d.length();
    if (L < 0.08) { player.path.shift(); if (!player.path.length) { setWalking(false); const then = player.then; player.then = null; if (then) then(); } }
    else { setWalking(true); d.setLength(Math.min(L, dt * 2.6)); player.pos.add(d); player.group.rotation.y = Math.atan2(d.x, d.z); }
  }
  player.pos.y = heightAt(player.pos.x, player.pos.z);
  player.group.position.copy(player.pos);
  if (player.mixer) player.mixer.update(dt);
  const s = st(t); PARTS.forEach((p) => p.update && p.update(s));
  // a phone stands the camera further back, so the boat's stern stays in frame (money pier round 1, "not checked")
  const far = innerWidth / innerHeight < 0.8 ? 1.5 : 1;
  // aboard a boat that came back, the view follows the captain onto it, so its crate stays in frame
  const focus = BUILD ? new THREE.Vector3(2.0, -2.2, -3.5) : new THREE.Vector3(onReturn() ? player.pos.x + 1.0 : player.pos.x * 0.5 + 1.2, player.pos.y + 0.2, player.pos.z - 8);
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
page.live = () => ({ ret: live.ret && { ...live.ret } });
page.atAnchor = () => atAnchor().length;

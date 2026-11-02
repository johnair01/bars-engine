/* The coin table: the I Ching in the nook and the hollow, for advice on coming closer to yourself or to someone you share
   a Between with (Six-faces-council pass bar-intake-2, brief "Coin table, build 2"; mechanic coin-table, proposed; art
   direction fb-look-01, his yes 2026-10-27: "the book on the shelf, coins on a low table by the hearth"). His note on
   bi-table-look-1 (2026-10-31): "The I Ching in the nook would be for giving people advice on how to connect with self or
   someone in a Between". Build 1's workorder seal is gone: work belongs to Lantern Harbour (bi-work-is-harbour).

   Sit at the low table and the coins ask who the toss is for: yourself, or one person you already share a Between with
   (inside a hollow, only its other person). Toss six times: each toss lays one line from the bottom up by the council's
   three-coin method (./iching/cast.js, checked against council/iching/cast.py), and the book names the hexagram, what it is
   becoming, a reading for connection, and one move in a lane and a suit (./iching/connection.js). Keep adds the move to
   the Between's next moves (your homeroom's private doc, `casts`); Let go returns the coins. One cast a sitting: no reroll
   until you stand and sit again. Touch the book and it reads at once, the whole cast in one breath.

   A cast is private (bi-cast-private): the coins fall only on your screen. In a hollow, a cast for its other person can be
   left face up on the table (a room item of kind `cast`); they see its lines when they come in, and sitting, they answer it
   with a turn: a card of the cast's suit from the /oracle deck, at the depth they choose, to say aloud when you next sit.

   Every word goes through the one screen owner (voice.js, hi-screen-owner) while you are at the table or the book.
   Previews (any host but bars-engine.vercel.app) write nothing, with a stand-in person when you share no Between:
   ?nook=1&coins=self sits you at the nook table with a cast for yourself, ?nook=1&coins=them with a cast for the stand-in,
   and ?room=first&coins=faceup (the hollow) opens with the stand-in's cast face up on the table, ready to answer. */
import * as THREE from "three";
import { castFromTosses, loadTable, lineOf, tossThree } from "./iching/cast.js";
import { SUITS, SELF, whoChoices, mayAsk, moveOf, keptEntry, faceUpItem, answerOf, cardFor, DEPTHS } from "./iching/connection.js";
import { LANE_NAMES } from "../calrunia/next-moves.js";
import { SHELLS } from "../calrunia/room-kit.js";

const TY = 0.32, TR = 0.34, SEAT_D = 0.62, PUSH_R = 0.5, NEAR_R = 1.25, BOOK_NEAR = 0.8, BOOK_LEAVE = 1.8;
const STAND_IN = { kind: "them", room: "stand-in", person: "stand-in", name: "Sam", standIn: true };
// a preview's fixed cast: lines 2 and 5 moving, so the reading shows where it is heading and the suit is Grow Up
const PREVIEW_TOSSES = [[2, 3, 3], [3, 3, 3], [2, 2, 3], [2, 3, 3], [2, 2, 2], [3, 3, 2]];
const DEPTH_NAMES = { easy: "Easy", medium: "Deeper", hard: "Deepest" };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hkey = () => Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
let readingsP = null, deckP = null;
const loadReadings = () => (readingsP ||= fetch("/between/iching/connection.json").then(r => r.json()));
const loadDeck = () => (deckP ||= fetch("/oracle/deck.json").then(r => r.json()).catch(() => null));

export function mount(B, opts = {}) {
  const preview = !!opts.preview;
  let table = null, place = null, builtFor = null, group = null;
  /* one sitting (or one visit to the book): who it is for, the tosses, the cast and its move, and what you did with it */
  let s = null;
  let near = null, flipping = null, mine = false, cardKey = "";
  const coins = [], marks = [];
  const localKept = {}, localItems = new Map(); // previews and a store that is down keep these on this page only
  const ids = () => (B.ids ? B.ids() : {}) || {};
  const down = () => preview || !ids().gardenId;
  const hereRoom = () => { const g = B.view && B.view().g; return g && g.kind !== "home" ? ids().gardenId : null; };

  /* ---------- where it stands: by the hearth, off the line the hearth's cushion sits on, toward the window (nook) or the shelf (hollow) ---------- */
  function placeFor(shell) {
    const h = B.anchors().hearth, hx = h[0], hz = h[2];
    const r = Math.hypot(hx, hz) || 1, dir = V(-hx / r, 0, -hz / r);           // from the hearth toward the room's middle
    const perp = shell === "nook" ? V(-dir.z, 0, dir.x) : V(-dir.z, 0, dir.x);   // nook: the window side; hollow: the shelf side
    if (shell === "nook" && perp.z > 0) perp.negate();                          // the nook's window is toward -z
    if (shell !== "nook" && perp.x < 0) perp.negate();                          // the hollow's shelf is toward +x
    // clear of the hearth's cushion and the kettle on its stone (on the hearth line at 1.55 m in the nook, 1.85 m in the hollow)
    const T = V(hx, 0, hz).addScaledVector(dir, shell === "nook" ? 1.25 : 1.3).addScaledVector(perp, shell === "nook" ? 1.1 : 0.95);
    const seat = T.clone().addScaledVector(dir, SEAT_D);
    const seatYaw = Math.atan2(T.x - seat.x, T.z - seat.z);
    let book, bookYaw, bookStand = null;
    if (shell === "nook") { // on the shelf, propped toward the room, as the still has it (fb-look-01, nook-book-coins)
      const sp = SHELLS.nook.spots.find(x => x.id === "shelf"), sh = V(...sp.at), sy = sp.face || 0.3, sr = V(Math.cos(sy), 0, -Math.sin(sy));
      book = sh.clone().addScaledVector(sr, -0.12).add(V(0, 0.05, 0.03)); bookYaw = sy;
      bookStand = sh.clone().setY(0).add(V(Math.sin(sy), 0, Math.cos(sy)).multiplyScalar(0.75));
    } else {                // the hollow's shelf unit is full of pots: a reading stand beside the table
      const at = T.clone().addScaledVector(perp, 0.75).addScaledVector(dir, 0.1); bookYaw = Math.atan2(-at.x, -at.z);
      book = at.clone().setY(1.0); bookStand = at.clone().add(V(Math.sin(bookYaw), 0, Math.cos(bookYaw)).multiplyScalar(0.7));
    }
    return { shell, T, dir, perp, seat, seatYaw, book, bookYaw, bookStand };
  }

  /* ---------- the things: a low table, three bronze coins, a cushion, the book ---------- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x7a5032, roughness: 0.85 }), darkWood = new THREE.MeshStandardMaterial({ color: 0x4f321e, roughness: 0.9 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0xa8743a, roughness: 0.5, metalness: 0.3, emissive: 0x5a300c, emissiveIntensity: 0.3 });
  const heads = new THREE.MeshStandardMaterial({ color: 0x5e3a18, roughness: 0.6, metalness: 0.2 });
  let coinGeo = null;
  function coinMesh() {
    if (!coinGeo) {
      const s = new THREE.Shape(); s.absarc(0, 0, 0.06, 0, Math.PI * 2, false);
      const h = new THREE.Path(), q = 0.016; h.moveTo(-q, -q); h.lineTo(-q, q); h.lineTo(q, q); h.lineTo(q, -q); h.closePath(); s.holes.push(h);
      coinGeo = new THREE.ExtrudeGeometry(s, { depth: 0.007, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1, curveSegments: 28 });
      coinGeo.rotateX(-Math.PI / 2); coinGeo.translate(0, -0.0035, 0);
    }
    const g = new THREE.Group(), m = new THREE.Mesh(coinGeo, bronze);
    // the heads side carries a darker ring, so a coin that lands reads as heads (3) or tails (2) from the cushion
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.028, 0.05, 24), heads); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.0062;
    g.add(m, ring); return g;
  }
  function book(pos, yaw) {
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = yaw;
    const cloth = new THREE.MeshStandardMaterial({ color: 0x2b4a78, roughness: 0.95 });
    const tex = (draw) => { const c = document.createElement("canvas"); c.width = 256; c.height = 320; draw(c.getContext("2d"), 256, 320); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const pageL = tex((c, w, h) => { c.fillStyle = "#f2e6cc"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(90,60,40,.28)"; c.lineWidth = 5;
      for (let x = w - 40; x > 30; x -= 34) for (let y = 40; y < h - 40; y += 26) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 12); c.stroke(); } });
    const pageR = tex((c, w, h) => { c.fillStyle = "#f4e9d0"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2418";
      [1, 0, 1, 1, 0, 1].forEach((solid, i) => { const y = 70 + i * 32; if (solid) c.fillRect(56, y, 144, 16); else { c.fillRect(56, y, 60, 16); c.fillRect(140, y, 60, 16); } }); });
    const half = (t, side) => {
      const hg = new THREE.Group(); hg.rotation.z = side * 0.16; g.add(hg);
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.27), cloth); cover.position.x = side * 0.1; hg.add(cover);
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.188, 0.018, 0.255), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 })); block.position.set(side * 0.096, 0.014, 0); hg.add(block);
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.186, 0.252), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissive: 0xfff0d0, emissiveMap: t, emissiveIntensity: 0.22 }));
      pg.rotation.x = -Math.PI / 2; pg.position.set(side * 0.096, 0.0235, 0); hg.add(pg);
    };
    half(pageL, -1); half(pageR, 1);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.27, 8), cloth); spine.rotation.x = Math.PI / 2; spine.position.y = -0.004; g.add(spine);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.002, 0.16), new THREE.MeshStandardMaterial({ color: 0xa0302a, roughness: 0.7 })); ribbon.position.set(0.01, 0.03, 0.2); g.add(ribbon);
    g.scale.setScalar(1.35); g.rotation.x = 0.55; // propped toward the room, as on a reading stand
    return g;
  }
  function build(shell) {
    if (group) B.scene.remove(group);
    place = placeFor(shell); builtFor = shell;
    group = new THREE.Group(); B.scene.add(group);
    const { T } = place;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR + 0.03, 0.06, 28), wood); top.position.copy(T).setY(TY - 0.03); group.add(top);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.4, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, TY - 0.06, 6), darkWood); leg.position.set(T.x + Math.cos(a) * TR * 0.65, (TY - 0.06) / 2, T.z + Math.sin(a) * TR * 0.65); group.add(leg); }
    table = top;
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.14, 20), new THREE.MeshStandardMaterial({ color: 0x8a3a70, roughness: 0.95 }));
    cushion.position.copy(place.seat).setY(0.07); cushion.rotation.y = place.seatYaw; group.add(cushion);
    coins.length = 0;
    [[-0.1, 0.05, 0.4], [0.06, 0.12, 1.1], [0.12, -0.06, 2.2]].forEach(([dx, dz, ry]) => { const c = coinMesh(); c.position.copy(T).add(V(dx, TY + 0.005, dz)); c.rotation.y = ry; group.add(c); coins.push({ m: c, rest: c.position.clone(), home: c.position.clone(), ry }); });
    const bk = book(place.book, place.bookYaw); group.add(bk); group.userData.book = bk;
    if (shell !== "nook") { // the reading stand
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.95, 8), darkWood); post.position.copy(place.book).setY(0.47); group.add(post);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), wood); lip.position.copy(place.book).setY(0.96); lip.rotation.y = place.bookYaw; lip.rotation.x = 0.4; group.add(lip);
    }
    const glow = new THREE.PointLight(0xffc890, 0.5, 1.6, 2); glow.position.copy(T).setY(0.9); group.add(glow);
    group.userData.table = top; group.userData.cushion = cushion;
    marksSig = ""; layMarks();
  }
  /* The lines on the table: your own as you toss them (only on your screen), or a cast left face up in this hollow, which
     both of you see. Short bars on the near side of the table, the bottom line nearest the cushion; moving lines amber. */
  let marksSig = "";
  function linesNow() {
    if (s && s.tosses.length && s.source === "table") return { lines: s.tosses.map(t => { const L = lineOf(t); return { yang: L.yang, moving: L.changing }; }), up: false };
    const fu = faceUp();
    if (fu && table && hexTable) {
      const h = hexTable.hexagrams.find(x => x.n === fu.it.n);
      if (h) return { lines: h.lines.map((b, i) => ({ yang: b === 1, moving: (fu.it.changing || []).includes(i + 1) })), up: true };
    }
    return { lines: [], up: false };
  }
  function layMarks() {
    if (!group) return;
    const now = linesNow(), sig = JSON.stringify(now);
    if (sig === marksSig) return;
    marksSig = sig;
    for (const m of marks) group.remove(m); marks.length = 0;
    const { T, seat } = place, toSeat = seat.clone().sub(T).setY(0).normalize(), side = V(toSeat.z, 0, -toSeat.x);
    now.lines.forEach((L, i) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: L.moving ? 0xf0c070 : now.up ? 0xe9dcc4 : 0x2a1a12, emissive: L.moving ? 0x804010 : now.up ? 0x403020 : 0x000000, roughness: 0.6 });
      const bar = (w, off) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, 0.016), mat); b.position.x = off; g.add(b); };
      if (L.yang) bar(0.2, 0); else { bar(0.085, -0.0575); bar(0.085, 0.0575); }
      g.position.copy(T).addScaledVector(toSeat, 0.22 - i * 0.032).addScaledVector(side, -0.1).setY(TY + 0.005);
      g.rotation.y = Math.atan2(side.x, side.z) - Math.PI / 2;
      group.add(g); marks.push(g);
    });
  }
  function coinsHome() { for (const c of coins) { c.rest.copy(c.home); c.m.position.copy(c.home); c.m.rotation.set(0, c.ry, 0); } }

  /* ---------- what the room knows: your Betweens, this hollow's face-up casts, your kept moves ---------- */
  let hexTable = null, readings = null, deck = null;
  function rooms() { const l = B.list && B.list(); return (l && l.gardens) || []; }
  function choices() {
    const here = hereRoom();
    if (here) { // inside a hollow: yourself, or this hollow's other person
      const g = B.view().g, me = ids().me, other = g && g.members && g.members[me] ? Object.keys(g.members).find(u => u !== me) : null;
      const r = rooms().find(x => x.id === here);
      const out = [SELF];
      if (other) out.push({ kind: "them", room: here, person: other, name: (r && r.who) || (B.nameOf ? B.nameOf(other) : "them") });
      return out;
    }
    const out = whoChoices(rooms());
    return out.length > 1 || !preview ? out : [SELF, STAND_IN];
  }
  function faceUp() { // the newest face-up cast on this hollow's table
    let best = null;
    const here = hereRoom();
    const items = here && B.view ? [...B.view().items.entries()] : [];
    for (const [id, it] of [...items, ...localItems]) if (it && it.kind === "cast" && it.status === "face-up" && (!best || it.at > best.it.at)) best = { id, it };
    return best;
  }
  const cardTitle = id => { const c = deck && deck.cards.find(x => x.id === id); return c ? c.title : "a card"; };
  const theirName = fu => fu.it.by === "stand-in" ? STAND_IN.name : (B.nameOf ? B.nameOf(fu.it.by) : "them");
  async function writeItem(id, kind, data) {
    if (id.startsWith("local-") || down()) {
      const cur = localItems.get(id);
      if (kind === "delete") localItems.delete(id); else localItems.set(id, kind === "set" ? data : { ...cur, ...data, answer: { ...(cur && cur.answer), ...(data.answer || {}) } });
      return;
    }
    await B.op("items/" + id, kind, data);
  }

  /* ---------- the sitting ---------- */
  function fresh(source) { return { source, who: null, tosses: [], cast: null, move: null, did: null, answering: null, card: null }; }
  function choose(w) {
    if (!s || s.who) return;
    if (!w.standIn && !mayAsk(w, w.kind === "them" && hereRoom() ? [{ id: w.room, phase: "between", person: w.person }] : rooms())) return;
    s.who = w; cardKey = "";
    if (s.source === "book") castAll();
  }
  function toss(fixed) {
    if (!s || !s.who || s.cast || flipping || s.tosses.length >= 6 || s.source !== "table") return;
    const t = fixed || tossThree();
    s.tosses.push(t);
    const { T } = place;
    flipping = { t0: performance.now() / 1000, dur: 0.95, coins: coins.map((c, k) => ({ c, from: c.rest.clone(), to: T.clone().add(V((k - 1) * 0.09 + (Math.random() - 0.5) * 0.04, TY + 0.005, (Math.random() - 0.5) * 0.08 - 0.06)), spin: 3 + k, up: t[k] === 3, yaw: Math.random() * 6 })) };
    if (s.tosses.length === 6) settle();
    cardKey = "";
  }
  function castAll(fixed) { // the book: the whole cast in one breath
    s.tosses = (fixed || Array.from({ length: 6 }, () => tossThree())).map(t => [...t]); settle();
  }
  function settle() {
    if (!hexTable || !readings) return;
    s.cast = castFromTosses(s.tosses, hexTable, "coin-table");
    s.move = moveOf(s.cast, s.who, readings);
    cardKey = "";
  }
  async function keep() {
    if (!s || !s.move || s.did) return;
    const id = "c" + hkey(), entry = keptEntry(s.move, Date.now());
    s.did = "kept"; cardKey = "";
    if (down() || s.who.standIn) { localKept[id] = entry; return; }
    try { await B.homeWrite({ casts: { [id]: entry } }); }
    catch (e) { s.did = null; cardKey = ""; if (B.toast) B.toast("That did not save. Check your connection and try again."); }
  }
  function letGo() { if (!s || !s.move || s.did) return; s.did = "let"; coinsHome(); cardKey = ""; }
  async function leaveFaceUp() {
    if (!s || !s.move || s.did || s.who.kind !== "them" || !(hereRoom() === s.who.room || (down() && s.who.standIn))) return;
    const local = down() || s.who.standIn, id = (local ? "local-" : "k") + hkey();
    s.did = "faceup"; s.faceId = id; cardKey = "";
    await writeItem(id, "set", { ...faceUpItem(s.move, ids().me || "you", Date.now()), history: { [hkey()]: { by: ids().me || "you", act: "left a cast face up on the coin table", at: Date.now() } } });
    marksSig = ""; layMarks();
  }
  async function takeBack(id) { await writeItem(id, "delete"); marksSig = ""; layMarks(); cardKey = ""; }
  async function startAnswer(fu) {
    deck = deck || await loadDeck();
    s.answering = fu; s.card = cardFor(deck, fu.it.suit, fu.id); cardKey = "";
  }
  async function answer(depth) {
    if (!s || !s.answering || !s.card) return;
    const fu = s.answering, me = ids().me || "you", a = answerOf(s.card, depth, Date.now());
    await writeItem(fu.id, "update", { answer: { [me]: a }, history: { [hkey()]: { by: me, act: "answered a cast on the coin table", at: Date.now() } } });
    s.answered = { depth, card: s.card }; s.answering = null; cardKey = "";
  }
  function end() { s = null; coinsHome(); marksSig = ""; layMarks(); cardKey = ""; }

  /* ---------- the words: one moment at a time, through the screen owner ---------- */
  const fallback = document.createElement("div"); fallback.className = "ct-card"; fallback.hidden = true; document.body.appendChild(fallback);
  const css = document.createElement("style");
  css.textContent = `.ct-card{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(120px + env(safe-area-inset-bottom));z-index:40;color:#f6ecdc;width:min(92vw,540px);display:grid;gap:8px;text-shadow:0 1px 3px #000}
  .ct-card b{font:400 22px Marcellus,Georgia,serif} .ct-card button{font:inherit;border-radius:999px;padding:7px 14px;border:1px solid rgba(255,255,255,.35);background:#2f8f86;color:#fff;cursor:pointer;margin:2px}
  .ct-label{position:fixed;z-index:30;transform:translate(-50%,-100%);font:600 .82rem Marcellus,Georgia,serif;color:#f3ece2;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap}`;
  document.head.appendChild(css);
  const label = document.createElement("div"); label.className = "ct-label"; document.body.appendChild(label);
  const voice = () => B.voice || null;
  function speak(m) {
    const v = voice();
    if (v) {
      if (v.holding() && !mine) return; mine = true;
      const down = (m.actions || []).find(a => a === close || a.label === "Not now");
      v.say(down ? { ...m, actions: m.actions.filter(a => a !== down), down: { on: down.on } } : m); return;
    }
    fallback.hidden = false; mine = true;
    const k = JSON.stringify([m.head, m.sub, m.foot, (m.actions || []).map(a => a.label)]); if (k === fallback._k) return; fallback._k = k;
    fallback.innerHTML = ""; const h = document.createElement("b"); h.textContent = m.head || ""; fallback.append(h);
    for (const t of [m.sub, m.foot]) if (t) { const p = document.createElement("div"); p.textContent = t; fallback.append(p); }
    (m.actions || []).forEach(a => { const b = document.createElement("button"); b.type = "button"; b.textContent = a.label + (a.sub ? " · " + a.sub : ""); b.onclick = a.on; fallback.append(b); });
  }
  function hush() { if (!mine) return; mine = false; const v = voice(); if (v) v.quiet(); fallback.hidden = true; fallback._k = ""; }
  fallback.addEventListener("pointerdown", e => e.stopPropagation());
  function boxOf(points) { // the screen box around some points: what the camera is looking at, never covered by words
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    for (const p of points) { const [x, y] = B.screenOf(p); l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
    return { l, t, r, b };
  }
  const tableBox = () => place && boxOf([place.T.clone().add(V(-TR, 0, -TR)), place.T.clone().add(V(TR, TY + 0.15, TR)), place.T.clone().add(V(TR, 0, -TR)), place.T.clone().add(V(-TR, TY + 0.15, TR))]);
  const bookBox = () => place && boxOf([place.book.clone().add(V(-0.2, -0.15, -0.2)), place.book.clone().add(V(0.2, 0.2, 0.2))]);
  const forName = w => w.kind === "self" ? "yourself" : w.name;
  const stand = { label: "Stand up", quiet: true, on: () => { B.standUp(); end(); } };
  const close = { label: "Close the book", quiet: true, on: () => { s.closed = true; cardKey = ""; } };
  /* one way back (Six-faces-council uu1-one-grammar): closing the book is putting it down, top right, so the screen
     owner draws it as m.down; the voiceless fallback keeps it as a button */
  function moment() {
    const atBook = s.source === "book", subject = atBook ? bookBox : tableBox, leave = atBook ? close : stand;
    if (s.answered) return { subject, head: "Answered", sub: `You drew ${s.answered.card.title} from ${s.answered.card.suit.name}: "${s.answered.card.prompts[s.answered.depth]}" Say it aloud to them when you next sit together.`, actions: [leave] };
    if (s.answering) {
      const fu = s.answering, c = s.card, nm = theirName(fu);
      if (!c) return { subject, head: `${nm} left this face up`, sub: `Their move: ${fu.it.line}`, actions: [leave] };
      return { subject, head: `${nm} left this face up`, sub: `Their move: ${fu.it.line} Answer it with a turn: ${c.title}, from ${c.suit.name}. Choose how deep, and say it aloud to them when you next sit together.`,
        actions: [...DEPTHS.map(d => ({ label: c.prompts[d], sub: DEPTH_NAMES[d], on: () => answer(d) })), { label: "Not now", quiet: true, on: () => { s.answering = null; s.card = null; cardKey = ""; } }] };
    }
    if (!s.who) {
      const fu = !atBook && faceUp(), me = ids().me || "you";
      const acts = [];
      if (fu && fu.it.by !== me && !(fu.it.answer && fu.it.answer[me])) acts.push({ label: `Answer ${theirName(fu)}'s cast`, sub: "They left it face up on the table", on: () => startAnswer(fu) });
      for (const w of choices()) acts.push({ label: w.kind === "self" ? "For yourself" : `For ${w.name}`, sub: w.kind === "self" ? "How to come closer to yourself" : w.standIn ? "A stand-in, on a preview" : "Someone you share a Between with", on: () => choose(w) });
      if (fu && fu.it.by === me) {
        const ans = Object.entries(fu.it.answer || {}).find(([u]) => u !== me);
        acts.push({ label: "Take your face-up cast back", quiet: true, on: () => takeBack(fu.id) });
        return { subject, head: "Who is this toss for?", sub: ans ? `They answered your cast with a turn: ${cardTitle(ans[1].card)}, ${DEPTH_NAMES[ans[1].depth].toLowerCase()}. Ask them for it when you next sit together.` : "Your last cast lies face up. They see it when they sit here.", actions: [...acts, leave] };
      }
      return { subject, head: "Who is this toss for?", sub: atBook ? "The book reads the whole cast at once." : "Only you see the coins. Nobody learns of a cast unless you show them.", actions: [...acts, leave] };
    }
    if (!s.move || flipping) {
      const n = s.tosses.length;
      if (n === 6) return { subject, head: `For ${forName(s.who)}`, sub: "The sixth line is falling.", actions: [] };
      return { subject, head: `For ${forName(s.who)}`, sub: n ? `Line ${n} of six is laid${lineOf(s.tosses[n - 1]).changing ? ", and it is moving" : ""}.` : "Toss three coins six times. The lines lay from the bottom up.",
        actions: [{ label: n ? `Toss for line ${n + 1}` : "Toss the coins", on: () => toss() }, leave] };
    }
    const m = s.move, suit = SUITS[m.suit];
    const head = `${m.n}. ${m.name}`;
    const heading = m.becomes ? ` Lines ${m.changing.join(" and ")} are moving: it is becoming ${m.becomes.name}. ${m.heading}` : "";
    if (s.did) {
      const said = { kept: `Kept. It waits in ${LANE_NAMES[m.lane]} among your next moves for a week.`, let: "Let go. The coins are back on the table.", faceup: `Left face up. ${m.who.name} sees its lines on the table and can answer it with a turn.` }[s.did];
      return { subject, head, sub: `${m.line} ${said}`, foot: atBook ? "" : "One cast a sitting. Stand and sit again to toss again.", actions: [leave] };
    }
    const acts = [{ label: m.line, sub: `Keep it · ${LANE_NAMES[m.lane]} · draw from ${suit.name} next`, on: keep }];
    if (m.who.kind === "them" && (hereRoom() === m.who.room || (down() && s.who.standIn && !hereRoom() && builtFor === "hollow"))) acts.push({ label: "Leave it face up", sub: `${m.who.name} sees it when they sit here`, on: leaveFaceUp });
    acts.push({ label: "Let it go", quiet: true, on: letGo });
    return { subject, head, sub: m.reading + heading, actions: acts };
  }

  function sittingHere() { const st = B.meState; return st.sitting && st.seatWant === "coins"; }
  function sit() { B.sitOn("coins"); }
  let bookUsed = false; // one reading a visit: the book reads again once you have walked away from it
  function openBook() { if ((s && s.source === "table") || bookUsed) return; s = fresh("book"); cardKey = ""; }
  /** A next move's "coins" walks you to the table and sits you. */
  function go() { if (place) { B.meState.target = place.seat.clone(); sit(); } }

  /* ---------- a tap on the table or the book ---------- */
  const ray = new THREE.Raycaster();
  let downAt = null;
  B.renderer.domElement.addEventListener("pointerdown", e => { downAt = { x: e.clientX, y: e.clientY }; });
  B.renderer.domElement.addEventListener("pointerup", e => {
    if (!group || !downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), B.camera);
    const hits = ray.intersectObjects([group], true); if (!hits.length) return;
    let o = hits[0].object, isBook = false; while (o) { if (o === group.userData.book) isBook = true; o = o.parent; }
    setTimeout(() => { if (isBook) { B.meState.target = place.bookStand.clone(); B.meState.keys.clear(); openBook(); } else sit(); }, 0); // after the room's own tap
  });

  /* ---------- each frame ---------- */
  function frame() {
    requestAnimationFrame(frame);
    const shell = B.room().shell;
    if (shell !== builtFor && (shell === "nook" || shell === "hollow")) { build(shell); end(); }
    if (!group) return;
    const me = B.meState.pos, t = performance.now() / 1000;
    const { T } = place, dx = me.x - T.x, dz = me.z - T.z, dist = Math.hypot(dx, dz);
    if (!sittingHere() && dist < PUSH_R && dist > 1e-4) { const k = PUSH_R / dist; me.x = T.x + dx * k; me.z = T.z + dz * k; } // round the table, never through it
    if (flipping) {
      const k = Math.min(1, (t - flipping.t0) / flipping.dur);
      for (const c of flipping.coins) {
        c.c.m.position.lerpVectors(c.from, c.to, k); c.c.m.position.y += Math.sin(k * Math.PI) * 0.42;
        c.c.m.rotation.set(k * Math.PI * 2 * c.spin + (c.up ? 0 : Math.PI) * k, c.yaw, 0);
      }
      if (k >= 1) { for (const c of flipping.coins) { c.c.rest.copy(c.to); c.c.m.rotation.set(c.up ? 0 : Math.PI, c.yaw, 0); } flipping = null; cardKey = ""; }
    }
    // a sitting starts when you sit at the table and ends when you stand; a visit to the book ends when you walk away
    if (sittingHere() && (!s || s.source !== "table")) s = fresh("table");
    if (s && s.source === "table" && !sittingHere() && !B.meState.seatWant) end();
    const awayFromBook = Math.hypot(me.x - place.bookStand.x, me.z - place.bookStand.z) > BOOK_LEAVE;
    if (s && s.source === "book" && (s.closed || awayFromBook)) { if (s.move) bookUsed = true; end(); }
    if (awayFromBook) bookUsed = false;
    if (s && s.who && s.tosses.length === 6 && !s.move) settle();
    layMarks();
    near = null;
    const bookD = Math.hypot(me.x - place.bookStand.x, me.z - place.bookStand.z);
    if (!sittingHere() && bookD < BOOK_NEAR && bookD < dist) near = "book";
    else if (dist < NEAR_R) near = "table";
    if (s) { const m = moment(); speak(m); if (voice()) voice().place(); } else hush();
    const fu = faceUp();
    const tableWords = near === "table" ? (fu ? "A cast lies face up · tap the table to sit" : "Tap the table to sit and toss") : fu ? "The coin table · a cast lies face up" : "The coin table";
    const at = near === "book" ? place.book.clone().setY(place.book.y + 0.35) : T.clone().setY(0.85);
    const v = at.clone().project(B.camera), [sx, sy] = B.screenOf(at);
    label.textContent = near === "book" ? "The book · tap it for a reading" : tableWords;
    label.hidden = !!s || v.z > 1 || sittingHere(); label.style.left = sx + "px"; label.style.top = sy + "px";
  }

  B.addSeat(() => (place && builtFor === B.room().shell ? [{ id: "coins", coins: true, x: place.seat.x, z: place.seat.z, yaw: place.seatYaw, floor: 0, top: 0.14 }] : []));
  (async function start() {
    while (!B.room || !["nook", "hollow"].includes(B.room().shell)) await new Promise(r => setTimeout(r, 250));
    build(B.room().shell); requestAnimationFrame(frame);
    [hexTable, readings, deck] = await Promise.all([loadTable(), loadReadings(), loadDeck()]);
    if (!opts.open) return;
    while (!B.meState.placed) await new Promise(r => setTimeout(r, 250)); // the page sets you down where you wake first
    await new Promise(r => setTimeout(r, 600));
    if (opts.open === "faceup") { // the stand-in left a cast for you face up on this hollow's table
      // the stand-in's move names whoever looks at the preview; on a real table it names the person it was tossed for
      const c = castFromTosses(PREVIEW_TOSSES, hexTable, "stand-in"), mv = moveOf(c, { kind: "them", room: "stand-in", name: "Wendell" }, readings);
      localItems.set("local-standin", faceUpItem(mv, "stand-in", Date.now()));
      marksSig = ""; layMarks();
    }
    B.meState.pos.copy(place.seat); sit(); // a preview opens at the table, not across the room
    setTimeout(() => { if (B.meState.seatWant !== "coins") { B.meState.pos.copy(place.seat); sit(); } }, 2500); // a skip that lands late can take the sit away
    if (opts.open === "self" || opts.open === "them") {
      while (!s) await new Promise(r => setTimeout(r, 200));
      choose(opts.open === "self" ? SELF : (choices().find(w => w.kind === "them") || STAND_IN));
      for (const tt of PREVIEW_TOSSES) { toss(tt); while (flipping) await new Promise(r => setTimeout(r, 120)); await new Promise(r => setTimeout(r, 250)); }
    }
  })().catch(e => console.warn("coin table:", e));
  return {
    toss, keep, letGo, leaveFaceUp, answer, choose, sit, go, openBook, end, choices,
    view: () => ({ shell: builtFor, near, sitting: sittingHere(), source: s && s.source, who: s && s.who && { kind: s.who.kind, room: s.who.room || null },
      tosses: s ? s.tosses.map(x => [...x]) : [], move: s && s.move && { n: s.move.n, lane: s.move.lane, suit: s.move.suit, line: s.move.line, becomes: s.move.becomes && s.move.becomes.n },
      did: s && s.did, faceUp: (faceUp() || {}).id || null, answered: !!(s && s.answered), kept: { ...localKept }, table: place && place.T.toArray(), seat: place && place.seat.toArray() }),
  };
}

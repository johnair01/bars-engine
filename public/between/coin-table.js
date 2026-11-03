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
   and ?room=first&coins=faceup (the hollow) opens with the stand-in's cast face up on the table, ready to answer.

   Build 3b, the spark at the table (pass bar-intake-3; his steer on bi-flirtcraft-door: "The work for flirtcraft starts in
   the nook. They learn about themselves and then the other and they invite the other into playing"). The toss can also be
   for someone you are drawn to: a spark you started, before they join. A Wake Up or Clean Up cast gives a move about
   yourself, Grow Up a move to learn about them, Show Up the invitation: the spark's link with his words, "Let's play
   together in this room I've made", and a button that copies or shares it. The table sends nothing. With no spark yet, the
   last choice, "Someone you are drawn to", opens the built Plant a spark sheet. ?door=flirtcraft (any host) is the
   Flirtcraft door: you land in the nook as everyone does and, once your first minute is done, walk to the table, whose
   first line says it reads for you or for someone you are drawn to. Preview: ?nook=1&coins=spark casts Show Up for a
   stand-in spark, so the invitation shows; ?nook=1&door=flirtcraft walks a newcomer with no spark to the table.

   The record book (Six-faces-council spec .specify/specs/record-book; his A on rb-new-page, 2026-11-02, and his A on
   rb-ad-look-1, 2026-11-03, the ink diary). "Who is this toss for?" is the book opened beside the coins: one page per
   person, a tab with each name on the fore-edge, a blank last page where you write a new name. Each page holds the casts
   you kept for that person, newest at the top, each its six lines in ink with its move beside it; nothing is counted.
   The book opens to the page last tossed for. Names live only in your homeroom (./iching/book.js, rules.ts homePageOk).
   On a named page steered to Flirtcraft, "Plant a spark for <name>" opens the built sheet with the name in it, and the
   spark is written onto the page. Preview: ?nook=1&book=1 sits you at the table with the book open on stand-in pages
   (yourself, a Between partner, two named pages, three casts kept on Jun's); add &games=flirtcraft for the spark step. */
import * as THREE from "three";
import { castFromTosses, loadTable, lineOf, tossThree } from "./iching/cast.js";
import { SUITS, SELF, PLANT, withPlant, INVITE_WORDS, MOVE_LANES, whoChoices, mayAsk, moveOf, keptEntry, faceUpItem, answerOf, cardFor, DEPTHS } from "./iching/connection.js";
import { SHELLS } from "../calrunia/room-kit.js";
import { leavesOf, castsOn, openAt, pageKeys, whoOf, lineOn, newPage, tabName, NAME_MAX } from "./iching/book.js";

const TY = 0.32, TR = 0.34, SEAT_D = 0.62, PUSH_R = 0.5, NEAR_R = 1.25, BOOK_NEAR = 0.8, BOOK_LEAVE = 1.8;
const STAND_IN = { kind: "them", room: "stand-in", person: "stand-in", name: "Sam", standIn: true };
const STAND_IN_SPARK = { kind: "spark", room: "stand-in-spark", name: "Robin", standIn: true };
// a preview's Show Up cast for the stand-in spark: only line 4 moving, so the move is the invitation
const SPARK_TOSSES = [[2, 3, 3], [2, 2, 3], [2, 3, 3], [2, 2, 2], [2, 3, 3], [2, 2, 3]];
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
  const localPages = {}; let localBookAt = null;  // the record book's pages and where it opens, on this page only
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
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.55), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); bk.add(hitBox); // a tap near the book counts
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
  /* The game the table plays (bi-door-look-1/-2, his note 2026-11-02): everyone starts at the general table; Flirtcraft's spark
     and door belong to a player enrolled in Flirtcraft, who can steer the same table toward any game they are enrolled in.
     The enrolment is the one /api/between already hands the page (`games`); a preview says it with &games=flirtcraft. */
  const GAME_NAMES = { general: "General", flirtcraft: "Flirtcraft", friendcraft: "Friendcraft", allyship: "Allyship" };
  function enrolled() { const l = B.list && B.list(); const g = preview ? (opts.games ? String(opts.games).split(",") : []) : (l && l.games) || []; return g.filter(x => GAME_NAMES[x] && x !== "general"); }
  let tableGame = "general";
  function steerTo(g) { tableGame = g === "general" || enrolled().includes(g) ? g : "general"; if (s && !s.who) cardKey = ""; }
  function rooms() { const l = B.list && B.list(); return (l && l.gardens) || []; }
  function choices() { // the spark is Flirtcraft's: it shows only when the table is steered to a game you are enrolled in
    const all = rawChoices();
    return tableGame === "flirtcraft" && enrolled().includes("flirtcraft") ? all : all.filter(w => w.kind !== "spark" && w.kind !== "plant");
  }
  function rawChoices() {
    const here = hereRoom();
    if (here) { // inside a hollow: yourself, or this hollow's other person, or the one your spark is toward
      const g = B.view().g, me = ids().me, other = g && g.members && g.members[me] ? Object.keys(g.members).find(u => u !== me) : null;
      const r = rooms().find(x => x.id === here);
      const out = [SELF];
      if (other) out.push({ kind: "them", room: here, person: other, name: (r && r.who) || (B.nameOf ? B.nameOf(other) : "them") });
      else if (g && g.phase === "spark" && g.startedBy === me && g.setup) out.push({ kind: "spark", room: here, name: String(g.setup.who || "them") });
      return out;
    }
    let out = whoChoices(rooms());
    if (preview && out.length === 1) out = opts.door ? [SELF] : [SELF, STAND_IN, STAND_IN_SPARK];
    // the last choice always plants one (the built sheet), so a toss can be for anyone you are drawn to, not only the first
    return withPlant(out);
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
  let doorWords = false; // the Flirtcraft door: the first sitting's first line names what the table is for
  function fresh(source) { const d = doorWords; doorWords = false; return { source, who: null, tosses: [], cast: null, move: null, did: null, answering: null, card: null, door: d, link: null, sent: false, at: null, leaf: null, draft: "" }; }
  function choose(w) {
    if (!s || s.who) return;
    if (w.kind === "plant") { B.standUp(); end(); if (B.openSheet) B.openSheet("setup"); return; }
    if (!w.standIn && !mayAsk(w, w.kind !== "self" && hereRoom() ? [w.kind === "spark" ? { id: w.room, phase: "spark", who: w.name } : { id: w.room, phase: "between", person: w.person }] : rooms())) return;
    s.who = w; cardKey = "";
    if (!s.leaf) s.leaf = leaves().find(l => l.key === (w.kind === "self" ? "self" : w.room)) || null;
    if (s.source === "book") castAll();
  }
  /* ---------- the record book: its pages, and turning to one ---------- */
  function homeNow() {
    const h = (B.home && B.home()) || {};
    return { ...h, pages: { ...(h.pages || {}), ...localPages }, casts: { ...(h.casts || {}), ...localKept }, bookAt: localBookAt || h.bookAt || null };
  }
  function leaves() { const here = hereRoom(); return leavesOf(here ? rawChoices() : choices(), homeNow(), { blank: !here }); }
  async function homeSave(data) { // the homeroom's private doc; a preview or a store that is down keeps it on this page
    if (down()) { Object.assign(localPages, data.pages || {}); if (data.bookAt) localBookAt = data.bookAt; return true; }
    try { await B.homeWrite(data); return true; } catch { if (B.toast) B.toast("That did not save. Check your connection and try again."); return false; }
  }
  /** Turning to a page is choosing who the toss is for. The blank page takes the name written on it first. */
  async function chooseLeaf(leaf) {
    if (!s || s.who || !leaf) return;
    if (leaf.kind === "blank") {
      const p = newPage(s.draft, Date.now()); if (!p) return;
      const pid = "p" + hkey();
      if (!(await homeSave({ pages: { [pid]: p }, bookAt: pid }))) return;
      leaf = { kind: "named", key: pid, pid, room: null, name: p.name };
    } else { localBookAt = leaf.key; if (!down()) B.homeWrite({ bookAt: leaf.key }).catch(() => {}); }
    s.leaf = leaf;
    if (leaf.kind === "named") { s.who = whoOf(leaf); cardKey = ""; if (s.source === "book") castAll(); return; }
    choose(leaf);
  }
  function turnTo(i) { if (!s || s.who) return; const n = leaves().length; s.at = Math.max(0, Math.min(n - 1, i)); bookSig = ""; cardKey = ""; if (!bookEl.hidden) drawBook(); }
  /* A spark planted from a named page (FR-007) is written onto that page once it appears in your rooms: the sheet takes you
     into the new room, so the page waits in this tab's session until then. */
  const PLANT_KEY = "rb-plant";
  function plantFor(leaf) {
    try { sessionStorage.setItem(PLANT_KEY, JSON.stringify({ pid: leaf.pid, name: leaf.name })); } catch {}
    B.standUp(); end();
    if (B.openSheet) { B.openSheet("setup"); setTimeout(() => { const i = document.getElementById("sWho"); if (i && !i.value) i.value = leaf.name; }, 0); }
  }
  let plantCheckAt = 0;
  function linkPlanted(t) {
    if (t - plantCheckAt < 2) return; plantCheckAt = t;
    let want = null; try { want = JSON.parse(sessionStorage.getItem(PLANT_KEY) || "null"); } catch {}
    if (!want || down()) return;
    const pages = homeNow().pages, taken = new Set(Object.values(pages).map(p => p && p.room).filter(Boolean));
    const r = rooms().find(x => x && x.phase === "spark" && !taken.has(x.id) && String(x.who || "") === want.name);
    if (!r || !pages[want.pid]) return;
    try { sessionStorage.removeItem(PLANT_KEY); } catch {}
    B.homeWrite({ pages: { [want.pid]: { room: r.id } } }).catch(() => {});
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
    if (s.move.invite) layLink(s);
  }
  /* The invitation: the spark's own link, laid on the table with his words. Only you see it until you send it yourself. */
  async function layLink(sit) {
    const room = sit.move.invite.room;
    try { sit.link = sit.who.standIn || down() ? location.origin + "/ontology-game/between?g=" + room + "&invite=preview" : await B.sparkUrl(room); }
    catch { sit.link = ""; }
    cardKey = "";
  }
  async function sendLink() {
    if (!s || !s.move || !s.move.invite) return;
    const text = INVITE_WORDS + "\n\n" + (s.link || "");
    try {
      if (!s.who.standIn && !down() && B.sparkLink) await B.sparkLink({ id: s.move.invite.room, name: s.who.name }, INVITE_WORDS); // the built "Send the link again" path
      else { let shared = false; if (navigator.share) { try { await navigator.share({ title: "The Between", text }); shared = true; } catch {} } if (!shared) await navigator.clipboard.writeText(text).catch(() => {}); }
      s.sent = true; cardKey = "";
      if (B.toast) B.toast(navigator.share ? "The link is ready to send." : "The link and your words are on your clipboard.");
    } catch { if (B.toast) B.toast("The link did not come. Go into the spark's room and use Invite."); }
  }
  async function keep() {
    if (!s || !s.move || s.did) return;
    // a named page's move is kept with {name} in it: the name lives only in the book's pages (FR-006)
    const stored = s.leaf && s.leaf.kind === "named" && s.cast ? moveOf(s.cast, whoOf(s.leaf, { store: true }), readings) : s.move;
    const id = "c" + hkey(), entry = pageKeys(keptEntry(stored, Date.now()), s.leaf);
    s.did = "kept"; cardKey = "";
    if (s.leaf) localBookAt = s.leaf.key;
    if (down() || s.who.standIn) { localKept[id] = entry; return; }
    try { await B.homeWrite({ casts: { [id]: entry }, ...(s.leaf ? { bookAt: s.leaf.key } : {}) }); }
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
  /* ---------- the open book (his pick A on rb-ad-look-1, the ink diary) ----------
     A spread over the table, the room blurred behind it as the camera comes down. The open page is the right-hand leaf,
     where the coins wait; the leaf before it faces it, as in any book. The fore-edge carries a tab per page. At phone width
     only the open leaf shows. Its words are ink on paper; the action and the way back stay the screen owner's. */
  const bookCss = document.createElement("style");
  bookCss.textContent = `.rb{position:fixed;inset:0;z-index:35;display:flex;justify-content:center;align-items:flex-start;padding-top:max(52px,7vh);background:rgba(14,6,4,.32);backdrop-filter:blur(12px) brightness(.62);-webkit-backdrop-filter:blur(12px) brightness(.62)}
  .rb[hidden]{display:none}
  .rb-book{--rb-serif:'EB Garamond',Georgia,serif;--ink:#34221a;--faint:#6a5442;--paper:#eee0c6;--edge:#cdba98;position:relative;display:flex;box-sizing:border-box;padding:8px;border-radius:12px;background:#5c281a;box-shadow:0 26px 60px rgba(0,0,0,.55);
    width:min(calc(100vw - 104px),calc((100dvh - max(52px,7vh) - 132px) * 1.45),1120px);aspect-ratio:1.45;animation:rb-in .45s cubic-bezier(.2,.7,.2,1)}
  .rb.one .rb-book{width:min(calc(100vw - 76px),calc((100dvh - max(52px,7vh) - 132px) * .74));aspect-ratio:.74}
  @keyframes rb-in{from{opacity:0;transform:translateY(18px) scale(.97)}}
  @media (prefers-reduced-motion:reduce){.rb-book{animation:none}}
  .rb-leaf{flex:1;min-width:0;position:relative;display:flex;flex-direction:column;box-sizing:border-box;padding:5.5% 6.5% 4%;background:var(--paper);color:var(--ink);overflow:hidden}
  .rb-leaf.l{box-shadow:inset -28px 0 26px -20px rgba(90,60,40,.5);cursor:pointer} .rb-leaf.r{box-shadow:inset 28px 0 26px -20px rgba(90,60,40,.5)}
  .rb.one .rb-leaf.l{display:none} .rb.one .rb-leaf.r{box-shadow:none}
  .rb-leaf.cover{background:radial-gradient(120% 90% at 30% 20%,#7a3a26,#4a1f14);cursor:default}
  .rb-name{margin:0;font:400 clamp(28px,3.3vw,46px)/1.1 Marcellus,var(--rb-serif);text-align:center;overflow-wrap:anywhere}
  .rb-rule{width:5.5em;height:1px;margin:.55em auto 1.3em;background:#a8927a}
  .rb-casts{list-style:none;margin:0;padding:0 .2em 0 0;flex:1 1 auto;min-height:0;overflow:auto;display:grid;gap:1.15em;align-content:start}
  .rb-cast{display:grid;grid-template-columns:52px 1fr;gap:16px;align-items:start}
  .rb-cast svg{width:52px;height:46px;margin-top:4px}
  .rb-cast small{display:block;font:400 14px/1.3 var(--rb-serif);color:var(--faint)}
  .rb-cast span{display:block;font:italic 400 clamp(15px,1.45vw,19px)/1.38 var(--rb-serif);text-wrap:pretty}
  .rb-write{margin:0;font:italic 400 clamp(18px,1.9vw,26px) var(--rb-serif);color:var(--faint);text-align:center}
  .rb-input{display:block;box-sizing:border-box;width:84%;margin:1.1em auto 0;padding:0 .08em;border:0;border-bottom:2px solid #96806a;border-radius:0;background:transparent;color:var(--ink);font:italic 400 clamp(38px,5vw,76px)/1.15 var(--rb-serif);caret-color:var(--ink)}
  .rb-input:focus{outline:none;border-bottom-color:var(--ink)} .rb-input::placeholder{color:transparent}
  .rb-coins{display:flex;justify-content:center;gap:clamp(10px,1.4vw,18px);margin-top:auto;padding-top:1em}
  .rb-coins svg{width:clamp(44px,5vw,66px);height:auto}
  .rb-only{margin:.9em 0 0;font:italic 400 14px var(--rb-serif);color:var(--faint);text-align:center}
  .rb-tabs{position:absolute;top:30px;bottom:30px;left:calc(100% - 8px);width:60px;display:flex;flex-direction:column;gap:10px}
  .rb-tab{flex:0 1 112px;min-height:32px;box-sizing:border-box;width:52px;padding:8px 0;border:2px solid var(--edge);border-left:0;border-radius:0 10px 10px 0;background:#ddcfae;color:var(--faint);
    font:400 17px/1 var(--rb-serif);writing-mode:vertical-rl;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;transition:width .2s,background .2s}
  .rb-tab:hover{background:#e6d8b9}
  .rb-tab[aria-current=page]{width:62px;background:var(--paper);color:var(--ink)}
  .rb-tab:focus-visible,.rb-turn:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
  .rb-turn{position:absolute;bottom:4px;width:44px;height:44px;border:0;background:none;color:var(--faint);display:grid;place-items:center;padding:0;cursor:pointer} .rb-turn svg{width:20px;height:20px}
  .rb-turn.next{right:4px} .rb-turn.prev{left:4px} .rb-turn[hidden]{display:none} .rb-turn:hover{color:var(--ink)}
  .rb ::selection{background:rgba(178,122,60,.35);color:var(--ink)}
  .rb-casts{scrollbar-width:thin;scrollbar-color:#b9a283 transparent;-webkit-mask-image:linear-gradient(#000 calc(100% - 22px),transparent);mask-image:linear-gradient(#000 calc(100% - 22px),transparent);padding-bottom:18px}
  .rb.one .rb-tab{flex:1 1 0;max-height:112px;padding:4px 0;font-size:13px;text-overflow:clip}`;
  document.head.appendChild(bookCss);
  const bookEl = document.createElement("div"); bookEl.className = "rb"; bookEl.hidden = true; document.body.appendChild(bookEl);
  let bookSig = "";
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const COIN = `<svg viewBox="0 0 66 66" aria-hidden="true"><circle cx="33" cy="33" r="30" fill="#b27a3c" stroke="#7a4f22" stroke-width="3"/><circle cx="33" cy="33" r="21" fill="none" stroke="#8a5a28" stroke-width="2" opacity=".6"/><rect x="25" y="25" width="16" height="16" fill="#eee0c6"/></svg>`;
  function hexSvg(n) { // the six lines in ink, the bottom line first (as the table lays them)
    const h = hexTable && hexTable.hexagrams.find(x => x.n === n); if (!h) return "";
    return `<svg viewBox="0 0 52 46" aria-hidden="true">${h.lines.map((v, i) => { const y = (5 - i) * 8.2; return v ? `<rect x="0" y="${y}" width="52" height="5" fill="#34221a"/>` : `<rect x="0" y="${y}" width="22" height="5" fill="#34221a"/><rect x="30" y="${y}" width="22" height="5" fill="#34221a"/>`; }).join("")}</svg>`;
  }
  const CHEV = d => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${d > 0 ? "M7 4l6 6-6 6" : "M13 4l-6 6 6 6"}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const hexName = n => { const h = hexTable && hexTable.hexagrams.find(x => x.n === n); return h ? h.name : ""; };
  function leafHtml(leaf, open, home) {
    if (!leaf) return `<div class="rb-leaf l cover" aria-hidden="true"></div>`;
    const side = open ? "r" : "l";
    if (leaf.kind === "blank") {
      return `<div class="rb-leaf ${side}"${open ? "" : ` data-turn="-1"`}><p class="rb-write">Write a name</p>${open ? `<input class="rb-input" maxlength="${NAME_MAX}" autocomplete="off" spellcheck="false" aria-label="Write a name" placeholder="A name">` : ""}${open ? `<div class="rb-coins">${COIN + COIN + COIN}</div><p class="rb-only">Only you read this book.</p>` : ""}</div>`;
    }
    const cs = castsOn(leaf, home);
    const list = cs.length ? `<ul class="rb-casts">${cs.map(c => `<li class="rb-cast">${hexSvg(c.n)}<div><small>${esc(hexName(c.n))}</small><span>${esc(lineOn(c, leaf))}</span></div></li>`).join("")}</ul>` : "";
    return `<div class="rb-leaf ${side}"${open ? "" : ` data-turn="-1"`}><h2 class="rb-name">${esc(leaf.name)}</h2><div class="rb-rule"></div>${list}${open ? `<div class="rb-coins">${COIN + COIN + COIN}</div><p class="rb-only">Only you read this book.</p>` : ""}</div>`;
  }
  function drawBook() {
    const L = leaves(), i = Math.min(s.at || 0, L.length - 1), home = homeNow(), one = innerWidth < 760;
    const sig = JSON.stringify([i, one, L.map(l => [l.key, l.name]), castsOn(L[i], home).map(c => c.id), i > 0 ? castsOn(L[i - 1], home).map(c => c.id) : 0, !!hexTable]);
    bookEl.hidden = false;
    if (sig === bookSig) return; bookSig = sig;
    bookEl.classList.toggle("one", one);
    bookEl.innerHTML = `<div class="rb-book" role="dialog" aria-label="Your record book">${leafHtml(i > 0 ? L[i - 1] : null, false, home)}${leafHtml(L[i], true, home)}
      <nav class="rb-tabs" aria-label="Pages">${L.map((l, k) => `<button type="button" class="rb-tab" data-at="${k}"${k === i ? ` aria-current="page"` : ""} aria-label="${l.kind === "blank" ? "A blank page" : esc(l.name)}">${esc(tabName(l, L.length))}</button>`).join("")}</nav>
      <button type="button" class="rb-turn prev" data-turn="-1" aria-label="Turn back a page"${i > 0 ? "" : " hidden"}>${CHEV(-1)}</button><button type="button" class="rb-turn next" data-turn="1" aria-label="Turn the page"${i < L.length - 1 ? "" : " hidden"}>${CHEV(1)}</button></div>`;
    const inp = bookEl.querySelector(".rb-input");
    if (inp) { inp.value = s.draft || ""; inp.addEventListener("input", () => { if (s) { s.draft = inp.value; cardKey = ""; } });
      inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter" && s) chooseLeaf(L[i]); });
      setTimeout(() => inp.focus({ preventScroll: true }), 60); }
  }
  bookEl.addEventListener("click", e => {
    const t = e.target.closest("[data-at],[data-turn]"); if (!t || !s) return;
    if (t.dataset.at != null) turnTo(+t.dataset.at); else turnTo((s.at || 0) + (+t.dataset.turn));
  });
  for (const ev of ["pointerdown", "pointerup", "wheel"]) bookEl.addEventListener(ev, e => e.stopPropagation());
  /* a swipe across the open leaf turns the page */
  let swipe = null;
  bookEl.addEventListener("touchstart", e => { const p = e.touches[0]; swipe = p ? { x: p.clientX, y: p.clientY, t: performance.now() } : null; }, { passive: true });
  bookEl.addEventListener("touchend", e => { const p = e.changedTouches[0], w = swipe; swipe = null; if (!w || !p || !s) return;
    const dx = p.clientX - w.x, dy = Math.abs(p.clientY - w.y); if (Math.abs(dx) > 60 && dy < Math.abs(dx) * 0.6 && performance.now() - w.t < 700) turnTo((s.at || 0) + (dx < 0 ? 1 : -1)); });
  addEventListener("keydown", e => { // the arrows turn the pages while the book is open (the room's own arrows would stand you up)
    if (bookEl.hidden || !s || /input|textarea|select/i.test(e.target.tagName || "")) return;
    const k = e.key; if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(k)) return;
    e.preventDefault(); e.stopPropagation();
    if (k === "ArrowRight" || k === "ArrowDown") turnTo((s.at || 0) + 1); else turnTo((s.at || 0) - 1); }, true);
  const bookRect = () => { const b = bookEl.querySelector(".rb-book"); if (!b) return null; const r = b.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right + 60, b: r.bottom }; };
  const voice = () => B.voice || null;
  function speak(m) {
    const v = voice();
    if (v) {
      if (v.holding() && !mine) return; mine = true;
      const down = (m.actions || []).find(a => a === close || a === closeStand || a.label === "Not now");
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
  const closeStand = { label: "Close the book", quiet: true, on: () => { B.standUp(); end(); } }; // at the table, closing the book is standing up
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
      const L = leaves(); if (s.at == null) s.at = openAt(L, homeNow()); s.at = Math.min(s.at, L.length - 1);
      const leaf = L[s.at], acts = [], away = atBook ? close : closeStand;
      if (leaf.kind === "blank") { const nm = newPage(s.draft, 0); if (nm) acts.push({ label: `${atBook ? "Read" : "Toss"} for ${nm.name}`, on: () => chooseLeaf(leaf) }); }
      else acts.push({ label: `${atBook ? "Read" : "Toss"} for ${leaf.kind === "self" ? "yourself" : leaf.name}`, on: () => chooseLeaf(leaf) });
      const flirt = tableGame === "flirtcraft" && enrolled().includes("flirtcraft");
      if (leaf.kind === "named" && !leaf.room && flirt && !preview) acts.push({ label: `Plant a spark for ${leaf.name}`, sub: "Their own room, to invite them when it feels right", quiet: true, on: () => plantFor(leaf) });
      else if (leaf.kind === "named" && !leaf.room && flirt) acts.push({ label: `Plant a spark for ${leaf.name}`, sub: "On a preview, the built sheet opens empty", quiet: true, on: () => { B.standUp(); end(); if (B.openSheet) B.openSheet("setup"); } });
      if (leaf.kind === "blank") for (const w of choices()) if (w.kind === "plant") acts.push(w.fresh ? { label: "Someone you are drawn to", sub: "Plant a spark for them first", quiet: true, on: () => choose(w) } : { label: "Someone else you are drawn to", sub: "Plant a spark for them, then toss", quiet: true, on: () => choose(w) });
      if (fu && fu.it.by !== me && !(fu.it.answer && fu.it.answer[me])) acts.push({ label: `Answer ${theirName(fu)}'s cast`, sub: "They left it face up on the table", on: () => startAnswer(fu) });
      if (fu && fu.it.by === me) acts.push({ label: "Take your face-up cast back", quiet: true, on: () => takeBack(fu.id) });
      for (const g of enrolled()) if (g !== tableGame) acts.push({ label: `Steer the table to ${GAME_NAMES[g]}`, sub: g === "flirtcraft" ? "Someone you are drawn to, a spark first" : `The ${GAME_NAMES[g]} table`, quiet: true, on: () => steerTo(g) });
      if (tableGame !== "general") acts.push({ label: "Back to the general table", quiet: true, on: () => steerTo("general") });
      const first = s.door ? "The table reads for you, or for someone you are drawn to. " : "";
      const ans = fu && fu.it.by === me && Object.entries(fu.it.answer || {}).find(([u]) => u !== me);
      const sub = ans ? `They answered your cast with a turn: ${cardTitle(ans[1].card)}, ${DEPTH_NAMES[ans[1].depth].toLowerCase()}. Ask them for it when you next sit together.` : first.trim();
      return { subject: bookRect, book: true, head: "", sub, actions: [...acts, away] };
    }
    if (!s.move || flipping) {
      const n = s.tosses.length;
      if (n === 6) return { subject, head: `For ${forName(s.who)}`, sub: "The sixth line is falling.", actions: [] };
      return { subject, head: `For ${forName(s.who)}`, sub: n ? `Line ${n} of six is laid${lineOf(s.tosses[n - 1]).changing ? ", and it is moving" : ""}.` : "Toss three coins six times. The lines lay from the bottom up.",
        actions: [{ label: n ? `Toss for line ${n + 1}` : "Toss the coins", on: () => toss() }, leave] };
    }
    const m = s.move, suit = SUITS[m.suit];
    const head = `${m.n}. ${m.name}`;
    const heading = m.becomes ? ` ${m.changing.length > 1 ? "Lines " + m.changing.join(" and ") + " are" : "Line " + m.changing[0] + " is"} moving: it is becoming ${m.becomes.name}. ${m.heading}` : "";
    if (s.did) {
      const said = { kept: s.leaf && s.leaf.kind === "named" ? `Kept on ${s.leaf.name}'s page in your book.` : `Kept on ${s.leaf && s.leaf.kind !== "self" ? s.leaf.name + "'s" : "your own"} page, and it waits in ${MOVE_LANES[keptEntry(m, 0).lane]} among your next moves for a week.`, let: "Let go. The coins are back on the table.", faceup: `Left face up. ${m.who.name} sees its lines on the table and can answer it with a turn.` }[s.did];
      const again = m.invite && !s.sent ? [{ label: "Copy or share the link", sub: "You send it yourself, when it feels right", on: sendLink }] : [];
      return { subject, head, sub: `${m.line} ${said}`, foot: atBook ? "" : "One cast a sitting. Stand and sit again to toss again.", actions: [...again, leave] };
    }
    if (m.invite) { // Show Up for a spark: the invitation, laid with the link; nothing leaves the table unless you send it
      const link = s.link === null ? "The link is coming." : s.link ? s.link : "The link did not come. Go into the spark's room and use Invite.";
      return { subject, head, sub: `${m.reading}${heading} ${m.line}`, foot: `"${INVITE_WORDS}" ${link}`,
        actions: [{ label: s.sent ? "Copy or share it again" : "Copy or share the link", sub: "Nothing is sent until you send it", on: sendLink },
          { label: "Keep it for later", sub: `${MOVE_LANES.invite} · waits among your next moves`, on: keep }, { label: "Let it go", quiet: true, on: letGo }] };
    }
    const acts = [{ label: m.line, sub: `Keep it · ${MOVE_LANES[m.lane]} · draw from ${suit.name} next`, on: keep }];
    if (m.who.kind === "them" && (hereRoom() === m.who.room || (down() && s.who.standIn && !hereRoom() && builtFor === "hollow"))) acts.push({ label: "Leave it face up", sub: `${m.who.name} sees it when they sit here`, on: leaveFaceUp });
    acts.push({ label: "Let it go", quiet: true, on: letGo });
    return { subject, head, sub: m.reading + heading, actions: acts };
  }

  function sittingHere() { const st = B.meState; return st.sitting && st.seatWant === "coins"; }
  function sit() { B.sitOn("coins"); }
  let bookUsed = false; // one reading a visit: the book reads again once you have walked away from it
  let bookWant = false; // a tap on the book while you are across the room: it opens when you have walked up to it
  /* A tap on the book is you asking for a reading: it puts down whatever sitting is open (the last person tossed for
     stays with that sitting, never with the book), and opens a fresh visit that asks who the reading is for. */
  function openBook() {
    if (s && s.source === "book" && !s.closed) return;
    if (sittingHere()) B.standUp();
    if (s) end();
    bookWant = false; bookUsed = false; s = fresh("book"); cardKey = "";
  }
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
    setTimeout(() => {
      if (!isBook) { bookWant = false; sit(); return; }
      if (sittingHere()) B.standUp();
      B.meState.target = place.bookStand.clone(); B.meState.keys.clear();
      if (Math.hypot(B.meState.pos.x - place.bookStand.x, B.meState.pos.z - place.bookStand.z) < BOOK_NEAR) openBook(); else bookWant = true; // opens on arrival, frame()
    }, 0); // after the room's own tap
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
    if (bookWant) { // walking up to the book after a tap on it
      if (B.meState.keys && B.meState.keys.size) bookWant = false; // you steered elsewhere
      else if (Math.hypot(me.x - place.bookStand.x, me.z - place.bookStand.z) < BOOK_NEAR) openBook();
    }
    if (s && s.who && s.tosses.length === 6 && !s.move) settle();
    layMarks();
    near = null;
    const bookD = Math.hypot(me.x - place.bookStand.x, me.z - place.bookStand.z);
    if (!sittingHere() && bookD < BOOK_NEAR && bookD < dist) near = "book";
    else if (dist < NEAR_R) near = "table";
    if (s) { const m = moment(); if (m.book) drawBook(); else if (!bookEl.hidden) { bookEl.hidden = true; bookSig = ""; } speak(m); if (voice()) voice().place(); }
    else { hush(); if (!bookEl.hidden) { bookEl.hidden = true; bookSig = ""; } }
    linkPlanted(t);
    const fu = faceUp();
    const tableWords = near === "table" ? (fu ? "A cast lies face up · tap the table to sit" : "Tap the table to sit and toss") : fu ? "The coin table · a cast lies face up" : "The coin table";
    const words = doorWords ? "The coin table · it reads for you, or for someone you are drawn to" : tableWords;
    const at = near === "book" ? place.book.clone().setY(place.book.y + 0.35) : T.clone().setY(0.85);
    const v = at.clone().project(B.camera), [sx, sy] = B.screenOf(at);
    label.textContent = near === "book" ? "The book · tap it for a reading" : words;
    label.hidden = !!s || v.z > 1 || sittingHere(); label.style.left = sx + "px"; label.style.top = sy + "px";
  }

  B.addSeat(() => (place && builtFor === B.room().shell ? [{ id: "coins", coins: true, x: place.seat.x, z: place.seat.z, yaw: place.seatYaw, floor: 0, top: 0.14 }] : []));
  (async function start() {
    while (!B.room || !["nook", "hollow"].includes(B.room().shell)) await new Promise(r => setTimeout(r, 250));
    build(B.room().shell); requestAnimationFrame(frame);
    [hexTable, readings, deck] = await Promise.all([loadTable(), loadReadings(), loadDeck()]);
    if (opts.door === "flirtcraft" && enrolled().includes("flirtcraft")) door(); // the door is for the enrolled only
    if (opts.book) { // the record book's stand-in pages: two names written on the blank page, three casts kept on Jun's
      const now = Date.now();
      Object.assign(localPages, { "stand-in-mara": { name: "Mara", room: null, at: now - 9e8 }, "stand-in-jun": { name: "Jun", room: null, at: now - 8e8 } });
      [46, 31, 61].forEach((n, k) => { const r = readings.readings.find(x => x.n === n);
        if (r) localKept["stand-in-jun-" + k] = { n, becomes: null, lane: r.lane, suit: "WU", room: null, page: "stand-in-jun", line: r.them, at: now - (k + 1) * 864e5 * 3 }; });
      localBookAt = "stand-in-jun";
    }
    if (!opts.open && !opts.book) return;
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
    if (opts.open === "spark" || opts.open === "who") tableGame = "flirtcraft"; // ?coins=who stops at "Who is this toss for?"
    if (opts.open === "self" || opts.open === "them" || opts.open === "spark") {
      while (!s) await new Promise(r => setTimeout(r, 200));
      choose(opts.open === "self" ? SELF : opts.open === "spark" ? STAND_IN_SPARK : (choices().find(w => w.kind === "them") || STAND_IN));
      for (const tt of opts.open === "spark" ? SPARK_TOSSES : PREVIEW_TOSSES) { toss(tt); while (flipping) await new Promise(r => setTimeout(r, 120)); await new Promise(r => setTimeout(r, 250)); }
    }
  })().catch(e => console.warn("coin table:", e));
  /* The Flirtcraft door: you wake in the nook like everyone (the first minute is the one orientation), then walk to the
     table, and its first line says what it is for. */
  async function door() {
    while (!B.meState.placed || builtFor !== "nook" || !place) await new Promise(r => setTimeout(r, 250));
    while (B.minuteOn && B.minuteOn()) await new Promise(r => setTimeout(r, 500));
    await new Promise(r => setTimeout(r, 700));
    if (B.room().shell !== "nook") return;
    tableGame = "flirtcraft"; doorWords = true; go();
  }
  return {
    toss, keep, letGo, leaveFaceUp, answer, choose, sit, go, openBook, end, choices, leaves, turnTo, chooseLeaf,
    write: name => { if (s && !s.who) { s.draft = String(name); bookSig = ""; cardKey = ""; } },
    view: () => ({ shell: builtFor, near, sitting: sittingHere(), source: s && s.source, who: s && s.who && { kind: s.who.kind, room: s.who.room || null },
      tosses: s ? s.tosses.map(x => [...x]) : [], move: s && s.move && { n: s.move.n, lane: s.move.lane, suit: s.move.suit, line: s.move.line, becomes: s.move.becomes && s.move.becomes.n },
      game: tableGame, enrolled: enrolled(),
      invite: !!(s && s.move && s.move.invite), link: s && s.link, sent: !!(s && s.sent), door: !!(s && s.door) || doorWords,
      book: s && !s.who && !bookEl.hidden ? { at: s.at, pages: leaves().map(l => l.kind === "blank" ? "" : l.name), draft: s.draft } : null, page: s && s.leaf ? s.leaf.key : null,
      did: s && s.did, faceUp: (faceUp() || {}).id || null, answered: !!(s && s.answered), kept: { ...localKept }, table: place && place.T.toArray(), seat: place && place.seat.toArray() }),
  };
}

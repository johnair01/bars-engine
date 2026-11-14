/* The hollow's games, mounted by garden.js (Six-faces-council .specify/specs/friendship-between-growth, "The hollow's games";
   FR-016 to FR-022; his A on bsp-games-look-1). Three games, one per door, each at its own place in the hollow and each there in
   every Between: Found lights at the jar shelf, Firefly lead on the dais, Lantern out at the mouth. The pair's own door's game is
   also set out on the low table the first time either enters (FR-017); pressing it walks you to its place. All of the words go
   through the one screen owner (voice.js). Nothing here shows a number, a count, a streak word or a score (FR-021).

   Previews only (FR-022): &game=found-lights|firefly-lead|lantern-out puts you at that game's place with a stand-in friend,
   &jars=<n> leaves that many jars from them, &calls=1 holds the threads up for tonight's three. Nothing a preview does is saved. */
import { GAMES, tableGame, COPY } from "./core.js";
import * as FL from "./found-lights.js";
import * as FF from "./firefly-lead.js";
import * as LO from "./lantern-out.js";

const CSS = `
.gm-form{box-sizing:border-box;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:45;width:min(92vw,420px);display:grid;gap:12px;padding:16px 16px 14px;border-radius:18px;background:rgba(18,11,8,.86);color:#f6ecdc;font:400 16px/1.4 var(--ui-body,system-ui,sans-serif);box-shadow:0 8px 30px rgba(0,0,0,.5)}
.gm-form .gm-q{font:400 22px/1.2 var(--ui-display,Georgia,serif)}
.gm-form input{font:inherit;min-height:48px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:inherit}
.gm-form input:focus-visible,.gm-form button:focus-visible{outline:3px solid var(--ui-accent,#5fc2ba);outline-offset:2px}
.gm-sw{display:flex;gap:10px;flex-wrap:wrap}
.gm-c{width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.35);cursor:pointer}
.gm-c.on{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.35)}
.gm-row{display:flex;gap:10px;flex-wrap:wrap}
.gm-go,.gm-quiet{font:700 15px/1 var(--ui-body,system-ui,sans-serif);min-height:48px;padding:0 20px;border-radius:24px;cursor:pointer;border:1px solid rgba(255,255,255,.35);color:#fff}
.gm-go{background:#2f8f86}.gm-quiet{background:transparent}
`;

export function mount(B, opts = {}) {
  const { THREE } = B;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const extra = {}, polls = new Map();
  const pokes = () => { B.pollSoon && B.pollSoon(); };
  const local = { items: new Map(), garden: null };            // a preview's own little Between (nothing is saved)
  const standinOn = !!opts.standin;
  const previewMode = !!opts.preview && !!opts.game || standinOn;
  const OTHER = "stand-in", YOU = "you";

  function realGarden() { const v = B.view(); return v && v.g && v.g.members && Object.keys(v.g.members).length >= 2 && v.g.members[B.ids().me] ? v : null; }
  const usingLocal = () => !realGarden();
  if (usingLocal() && previewMode) local.garden = { startedBy: YOU, members: { [YOU]: {}, [OTHER]: {} }, betweenSince: Date.now() - 3 * 864e5, door: opts.door || null };
  const ctx = {
    THREE, B, scene: B.scene, camera: B.camera, renderer: B.renderer, meState: B.meState, preview: !!opts.preview, standin: standinOn,
    extra,
    me: () => (usingLocal() ? YOU : B.ids().me),
    gardenId: () => (usingLocal() ? "preview" : B.ids().gardenId),
    g: () => (usingLocal() ? local.garden : B.view().g),
    other: () => { const g = ctx.g(); return g && g.members ? Object.keys(g.members).find(u => u !== ctx.me()) || null : null; },
    items: () => {
      const src = usingLocal() ? local.items : B.view().items;
      return [...src].filter(([, d]) => d).map(([id, d]) => ({ id, ...d }));
    },
    name: uid => (uid === OTHER ? "Your stand-in partner" : B.nameOf(uid)),
    hue: uid => { const g = ctx.g(); return g && g.startedBy === uid ? "#3e9e93" : "#8f3f78"; },
    now: () => Date.now(),
    player: () => (B.meState && B.meState.placed ? { x: B.meState.pos.x, z: B.meState.pos.z } : null),
    peerPos: uid => { const p = B.peers.get(uid); if (p) return { x: p.pos.x, z: p.pos.z }; const r = ctx.raw(uid); return r && typeof r.x === "number" ? { x: r.x, z: r.z } : null; },
    raw: uid => (uid === OTHER ? standinRaw() : B.rawPeers.get(uid) || null),
    write: async (path, op, data) => {
      if (usingLocal()) { const id = path.split("/")[1], cur = local.items.get(id); local.items.set(id, op === "set" ? data : { ...cur, ...data }); return; }
      return B.op(path, op, data);
    },
    poke: pokes,
    wantPoll: (key, ms) => { const was = B.gameFeel.poll; if (ms) polls.set(key, ms); else polls.delete(key); B.gameFeel.poll = polls.size ? Math.min(...polls.values()) : 0; if (B.gameFeel.poll && !was) B.pollSoon(); }, // the poll's pending wait (up to 5 s) is cut short the moment a hand goes up
    active: game => inHollow() && (previewMode || !usingLocal()) && (!focus || focus === game),
  };
  let focus = opts.game && GAMES.includes(opts.game) ? opts.game : null;
  const inHollow = () => !!(B.room && B.room().shell === "hollow");

  /* ---- the stand-in friend (previews): where they stand and what they point at ---- */
  const si = { x: 0.9, z: 1.4, pt: null };
  function standinRaw() { return { uid: OTHER, x: si.x, z: si.z, pt: si.pt, f: null }; }
  function standinMove(x, z) { si.x = x; si.z = z; const p = B.peers.get(OTHER); if (p) { p.pos.set(x, 0, z); p.tx = x; p.tz = z; } }

  B.gameFeel.extra = () => { const o = {}; for (const [k, f] of Object.entries(extra)) { const v = f(); if (v !== undefined) o[k] = v; } return o; };

  const mods = { "found-lights": FL.create(ctx), "firefly-lead": FF.create(ctx), "lantern-out": LO.create(ctx) };

  /* ---- the door's game on the low table (FR-017) ---- */
  const TABLE = { x: 0, z: 1.3 };
  const table = (() => {
    const g = new THREE.Group(); g.visible = false; B.scene.add(g);
    const dotTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffd08a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(0.7); g.add(halo);
    const prop = new THREE.Group(); g.add(prop);
    return { g, halo, prop, kind: "" };
  })();
  function setTableProp(game) {
    if (table.kind === game) return; table.kind = game;
    while (table.prop.children.length) table.prop.remove(table.prop.children[0]);
    const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
    if (game === "found-lights") { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.066, 0.13, 12), new THREE.MeshStandardMaterial({ color: 0xdfeef0, transparent: true, opacity: 0.4 })); table.prop.add(j); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.074, 0.06, 10), mat(0x3e9e93)); c.position.y = 0.09; table.prop.add(c); }
    else if (game === "firefly-lead") { for (const [x, c] of [[-0.07, 0x6fe0c8], [0.07, 0xe28fcf]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: c })); s.position.set(x, 0.05 + Math.abs(x) * 0.3, 0); table.prop.add(s); } }
    else { const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector2(0.09 * Math.sin(0.25 + u * (Math.PI - 0.5)) + 0.02, u * 0.2 - 0.1)); } table.prop.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 12), new THREE.MeshBasicMaterial({ color: 0xffc275, side: THREE.DoubleSide }))); }
  }
  const TABLE_KEY = "between.games.table.";
  const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const tableOn = () => {
    const g = ctx.g(); const game = tableGame(g);
    if (!game || !inHollow() || focus) return null;
    const played = ctx.items().some(i => (game === "found-lights" && i.kind === "jar" && i.by === ctx.me()) || (game === "firefly-lead" && i.kind === "dance") || (game === "lantern-out" && i.kind === "call"));
    if (played || lsGet(TABLE_KEY + ctx.gardenId() + "." + ctx.me())) return null;
    return game;
  };
  const PLACE = { "found-lights": () => { const v = FL_POINT(); return v; }, "firefly-lead": () => ({ x: 0.6, z: 0.2 }), "lantern-out": () => ({ x: 0.6, z: -2.8 }) };
  function FL_POINT() { const f = Math.atan2(-5.0, -0.4); return { x: 5.0 + Math.sin(f) * 1.2, z: 0.4 + Math.cos(f) * 1.2 }; }
  const WALK_WORD = { "found-lights": COPY.leave, "firefly-lead": COPY.raise, "lantern-out": COPY.which };

  /* ---- the screen owner ---- */
  let said = "", lastTick = 0;
  const subject = () => null;
  function speak() {
    const vo = B.voice; if (!vo) return;
    let m = null, owner = "";
    for (const game of ["firefly-lead", "found-lights", "lantern-out"]) { if (focus && focus !== game) continue; const x = mods[game].moment(); if (x) { m = x; owner = game; break; } }
    if (!m) {
      const tg = tableOn(), p = ctx.player();
      if (tg && p && Math.hypot(p.x - TABLE.x, p.z - TABLE.z) < 2.0) {
        m = { head: WALK_WORD[tg] === COPY.which ? COPY.which : WALK_WORD[tg], sub: "", soft: true, key: "table:" + tg, actions: [{ label: COPY.walkOn, on: () => { lsSet(TABLE_KEY + ctx.gardenId() + "." + ctx.me(), "1"); const t = PLACE[tg](); B.meState.target = new THREE.Vector3(t.x, 0, t.z); } }] };
        owner = "table";
      }
    }
    if (m && m.hold) { if (said !== "hold") { said = "hold"; vo.say({ hold: true }, "games", 4); } return; }
    const key = owner + ":" + (m ? m.key + "|" + (m.head || "") + "|" + (m.sub || "") + "|" + m.actions.map(a => a.label + (a.quiet ? "q" : "")).join(",") : "");
    if (key === said) return; said = key;
    if (!m) { vo.quiet("games"); return; }
    vo.say({ head: m.head, sub: m.sub, actions: m.actions, soft: true, subject }, "games", 2);
  }

  /* ---- previews: where &game= puts you, and what the stand-in friend does ---- */
  let pvDone = false, pvT0 = 0;
  function previewTick() {
    if (!opts.preview || !focus || !B.meState.placed) return;
    if (!pvDone) {
      pvDone = true; pvT0 = performance.now();
      const n = Math.max(0, Math.min(3, parseInt(opts.jars, 10) || 0));
      if (usingLocal() && focus === "found-lights") for (let k = 0; k < n; k++) local.items.set("jar-p" + k, { kind: "jar", by: OTHER, at: Date.now() - (k + 1) * 36e5, what: k === 1 ? "colour" : "line", text: k === 1 ? "#e8a33c" : "The dog next door learned to open the gate.", status: "left" });
      const at = focus === "found-lights" ? FL_POINT() : focus === "firefly-lead" ? { x: -0.7, z: 0.3 } : { x: 0.3, z: -2.7 };
      B.meState.pos.set(at.x, 0, at.z); B.meState.target = null; B.meState.yaw = focus === "found-lights" ? Math.atan2(-(5 - at.x), -(0.4 - at.z)) : focus === "firefly-lead" ? Math.PI * 0.5 : Math.PI;
      const lit = Math.max(0, Math.min(12, parseInt(opts.lit, 10) || 0));
      if (usingLocal() && focus === "lantern-out") for (let k = 0; k < lit; k++) local.items.set("call-p" + k, { kind: "call", by: OTHER, pair: [OTHER, YOU], day: -1 - k, place: (k * 5) % 12, at: Date.now() - (k + 1) * 864e5 });
      if (focus === "firefly-lead") standinMove(0.9, 0.4);
      if (focus === "lantern-out") { standinMove(1.2, -2.6); si.pt = null; }
      if (focus === "found-lights") standinMove(4.1, 2.6);
    }
    if (focus === "lantern-out" && ["walk", "float"].includes(mods["lantern-out"].view().state)) {   // the stand-in carries the lantern with you
      const t = mods["lantern-out"].view().state === "walk" ? { x: 1.9, z: -10.0 } : si; standinMove(si.x + (t.x - si.x) * 0.02, si.z + (t.z - si.z) * 0.02);
    }
    if (focus === "lantern-out" && !(mods["lantern-out"].view().state)) {
      // the stand-in looks at the boat once the player has had a moment, and the player agrees by pointing at the same
      if (performance.now() - pvT0 > 2500) si.pt = 2;
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    const T = performance.now() / 1000;
    try {
      const hollow = inHollow();
      if (!hollow) { if (said) { said = ""; B.voice && B.voice.quiet("games"); } polls.clear(); B.gameFeel.poll = 0; table.g.visible = false; return; }
      previewTick();
      for (const m of Object.values(mods)) m.frame(T);
      const tg = tableOn(); table.g.visible = !!tg; if (tg) { setTableProp(tg); table.g.position.set(TABLE.x + 0.18, 0.28 + 0.62 + 0.12 + Math.sin(T * 1.4) * 0.015, TABLE.z - 0.05); table.halo.material.opacity = 0.55 + 0.25 * Math.sin(T * 1.8); }
      speak();
    } catch (e) { console.error("games", e); }
  }
  requestAnimationFrame(frame);
  return {
    view: () => ({ focus, active: inHollow(), table: tableOn(), found: mods["found-lights"].view(), firefly: mods["firefly-lead"].view(), lantern: mods["lantern-out"].view(), standin: { ...si }, said, items: ctx.items().filter(i => ["jar", "dance", "call"].includes(i.kind)).length }),
    found: mods["found-lights"], firefly: mods["firefly-lead"], lantern: mods["lantern-out"], standin: { move: standinMove, point: k => { si.pt = k; }, state: si }, ctx, local,
  };
}

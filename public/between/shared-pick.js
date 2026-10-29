/* The shared pick at Chapter 1's hunters' choice and the hollow (Six-faces-council feature ch1-shared-pick,
   .specify/specs/ch1-shared-pick/). Seven stones lit in a ring round the hearth, one for each card of the Chapter 1 hand.
   Tap a stone and your avatar walks to it and lifts it; its light goes out on both screens. The one who started the
   garden picks first for the whole, the partner for the hunters; in the hollow the order turns, and each of you may lift
   your own hollow card instead, which goes to your own pouch and is never shown to the other. A pass is always a turn.

   The turn rule is the server's (src/lib/between/shared-pick.ts, through rules.ts mayWrite); `takeTurn` below mirrors it
   so the page can write the next pick, and a refused write (409, their pick or a lifted card) only shows its reason.
   A garden of one never sees the stones (sp-alone-keeps-the-hand). Once a garden holds a pick, every host shows it.
   Previews only: ?pick=a6 (with &skipHome=1 to open the room itself) opens the pick in a garden of two; with no partner in the garden it plays on this page alone
   with a stand-in partner who passes, and ?pick=a8 opens that rehearsal at the hollow, the A6 cards already lifted.
   Nothing the stand-in does is written anywhere. */
import * as THREE from "three";
import { isStone } from "./pick.js";

const WRITTEN = { "a6-whole": "WAKE-DA-REGENT", "a6-hunters": "WAKE-DA-DIPLOMAT", "a8-hollow": "WAKE-RA-CHALLENGER" };
const HOLLOW_CARD = WRITTEN["a8-hollow"];
const MOMENT_NAME = { "a6-whole": "the hunters' choice, for the whole", "a6-hunters": "the hunters' choice, for the hunters", "a8-hollow": "the hollow" };
const STAND_IN = "stand-in";
const RING_R = 1.75, STONE_R = 0.17, REACH = 0.85;

const keepsakeFor = face => {
  const f = ["shaman", "challenger", "regent", "architect", "diplomat", "sage"].includes(face) ? face.toUpperCase() : "SAGE";
  return f === "SHAMAN" || f === "CHALLENGER" ? `WAKE-DA-${f}` : `WAKE-RA-${f}`;
};
export const chapter1Hand = face => ["WAKE-GR-SHAMAN", "WAKE-GR-SAGE", "WAKE-RA-SHAMAN", keepsakeFor(face), "WAKE-DA-REGENT", "WAKE-DA-DIPLOMAT", "WAKE-RA-CHALLENGER"];
const turns = ([a, b]) => [{ moment: "a6-whole", by: a }, { moment: "a6-hunters", by: b }, { moment: "a8-hollow", by: b }, { moment: "a8-hollow", by: a }];
const taken = p => Object.keys(p.taken || {}).length + (p.passed || []).length + (p.own || []).length;
export function nextTurn(p) { const t = turns(p.order)[taken(p)]; return t ? { moment: t.moment, turn: t.by } : { moment: "done", turn: null }; }
export function takeTurn(p, me, act, at = Date.now()) {
  const entry = { by: me, moment: p.moment, at };
  const out = { ...p, taken: { ...(p.taken || {}) }, passed: [...(p.passed || [])], own: [...(p.own || [])] };
  if (act.lift) { out.taken[act.lift] = entry; out.pool = p.pool.filter(c => c !== act.lift); }
  else if (act.own) out.own.push(entry);
  else out.passed.push(entry);
  return { ...out, ...nextTurn(out) };
}
export const openPick = (opener, partner, face) => ({ v: 1, order: [opener, partner], moment: "a6-whole", turn: opener, pool: chapter1Hand(face), taken: {}, passed: [], own: [] });

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function mount(B, opts = {}) {
  const want = opts.open === "a6" || opts.open === "a8" ? opts.open : null;
  let cards = {}, local = null, built = false, walking = null, sending = false, panelKey = "";
  const group = new THREE.Group(), stones = new Map();
  fetch("/allyship-deck/allyship-deck.json").then(r => r.json()).then(d => { for (const c of d.cards || []) cards[c.id] = c; panelKey = ""; }).catch(() => {});

  const ids = () => B.ids();
  const g = () => B.view().g;
  const memberIds = x => (x && x.members ? Object.keys(x.members) : []);
  const pick = () => local || (g() && g().pick) || null;
  const title = id => (cards[id] && cards[id].title) || id;
  const who = uid => uid === ids().me ? "you" : uid === STAND_IN ? "your stand-in partner" : B.nameOf(uid);

  /* ---------- opening: a real pool for two, or the rehearsal on this page ---------- */
  function rehearse(at) {
    const me = ids().me || "you";
    let p = openPick(me, STAND_IN);
    if (at === "a8") { p = takeTurn(p, me, { lift: WRITTEN["a6-whole"] }); p = takeTurn(p, STAND_IN, { lift: WRITTEN["a6-hunters"] }); }
    local = p; standInSoon();
  }
  async function openReal() {
    const G = g(), me = ids().me, ms = memberIds(G);
    if (want === "a8" || ms.length !== 2 || !G.startedBy) return rehearse(want);
    if (G.pick && G.pick.moment !== "done") return; // already under way
    await B.op("garden/main", "update", { pick: openPick(G.startedBy, ms.find(m => m !== G.startedBy)) });
    B.poll();
    if (me) toast(G.startedBy === me ? "Seven stones are lit round the hearth. Yours is the first pick." : "Seven stones are lit round the hearth. They pick first.");
  }
  let opened = false;
  function maybeOpen() {
    if (opened || !want) return;
    const G = g();
    if (!G && !ids().gardenId) { opened = true; return rehearse(want); }
    if (!G) return;
    opened = true;
    // decide on the garden as the server holds it now, not as this page first drew it (a kept copy can predate the partner)
    Promise.resolve(B.poll()).catch(() => {}).then(() => openReal()).catch(() => rehearse(want));
  }
  function standInSoon() {
    if (!local || local.turn !== STAND_IN) return;
    setTimeout(() => { if (local && local.turn === STAND_IN) { local = takeTurn(local, STAND_IN, local.moment === "a8-hollow" ? { own: true } : { pass: true }); toast(local.moment === "done" ? "Your stand-in lifted their own hollow card. The pick is done." : "Your stand-in partner passed. Your pick."); panelKey = ""; } }, 1600);
  }

  /* ---------- the stones ---------- */
  function build() {
    if (built) return; built = true;
    const hand = chapter1Hand(null);
    for (let i = 0; i < 7; i++) {
      const lit = new THREE.MeshStandardMaterial({ color: 0x8a7a66, emissive: 0xffb45a, emissiveIntensity: 0.9, roughness: 0.6 });
      const m = new THREE.Mesh(new THREE.SphereGeometry(STONE_R, 14, 10), lit);
      m.scale.set(1, 0.55, 1);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc070, transparent: true, depthWrite: false, opacity: 0.7 }));
      halo.scale.setScalar(0.8);
      const s = new THREE.Group(); s.add(m, halo); group.add(s);
      stones.set(i, { g: s, m, halo, card: hand[i] });
    }
    B.scene.add(group);
  }
  let _glow = null;
  function glowTex() {
    if (_glow) return _glow;
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return (_glow = new THREE.CanvasTexture(c));
  }
  const hearth = () => new THREE.Vector3(...B.anchors().hearth);
  function stonePos(i) {
    const h = hearth(), out = h.clone().negate().setY(0).normalize(); // the ring opens toward the room's middle
    const a = Math.atan2(out.z, out.x) + (i - 3) * (Math.PI * 1.3 / 6);
    return new THREE.Vector3(h.x + Math.cos(a) * RING_R, 0.12, h.z + Math.sin(a) * RING_R);
  }
  function place(p) {
    const t = performance.now() / 1000;
    for (const [i, s] of stones) {
      if (p.pool && p.pool.length + Object.keys(p.taken || {}).length === 7) s.card = [...p.pool, ...Object.keys(p.taken || {})].sort((a, b) => chapterOrder(p, a) - chapterOrder(p, b))[i];
      const lit = p.pool.includes(s.card);
      s.g.position.copy(stonePos(i)).setY(0.12 + (lit ? Math.sin(t * 1.6 + i) * 0.02 : 0));
      s.m.material.emissiveIntensity = lit ? 0.9 : 0.0;
      s.m.material.color.setHex(lit ? 0x8a7a66 : 0x3c3833);
      s.halo.visible = lit; s.halo.material.opacity = 0.5 + Math.sin(t * 2 + i) * 0.15;
    }
  }
  // the stones keep the hand's order, so a lifted stone stays where it lay
  const chapterOrder = (p, id) => { const h = chapter1Hand(null); const i = h.indexOf(id); return i < 0 ? 3 : i; };

  /* ---------- a tap on a stone: walk there, then lift ---------- */
  function tap(ray) {
    const p = pick(); if (!p || !built) return false;
    const hits = [];
    for (const [i, s] of stones) { const at = s.g.position.clone().setY(0.2); if (ray.distanceToPoint(at) < 0.38) hits.push({ key: "stone:" + i, along: ray.origin.distanceTo(at), i }); }
    if (!hits.length) return false;
    hits.sort((a, b) => a.along - b.along);
    const h = hits[0]; if (!isStone(h.key)) return false;
    const s = stones.get(h.i), me = local ? (ids().me || "you") : ids().me;
    if (p.moment === "done") { toast("The pick is done. The log is below."); return true; }
    if (!p.pool.includes(s.card)) { toast(`${title(s.card)} has been lifted already.`); return true; }
    if (p.turn !== me) { toast(`It is ${who(p.turn)}'s pick. ${title(s.card)} is still lit.`); return true; }
    if (walking && walking.card === s.card && B.meState.pos.clone().setY(0).distanceTo(walking.at) < REACH + 0.35) { act({ lift: s.card }); return true; } // a second tap, standing by it, lifts it
    B.standUp();
    const at = s.g.position.clone().setY(0), dir = B.meState.pos.clone().sub(at).setY(0);
    B.meState.target = at.clone().add(dir.lengthSq() > 1e-4 ? dir.normalize().multiplyScalar(REACH * 0.7) : new THREE.Vector3(0, 0, REACH * 0.7));
    walking = { card: s.card, at };
    panelKey = "";
    return true;
  }
  async function act(a) {
    const p = pick(); if (!p || sending) return;
    const me = local ? (ids().me || "you") : ids().me;
    if (p.turn !== me) return toast(`It is ${who(p.turn)}'s pick.`);
    const next = takeTurn(p, me, a);
    walking = null; panelKey = "";
    if (local) { local = next; standInSoon(); if (a.lift) toast(`You lifted ${title(a.lift)}. Its light is out.`); return; }
    sending = true;
    try {
      await B.op("garden/main", "update", { pick: next });
      if (a.own) await B.op(`data/users/${me}/pouch`, "update", { hollow: { card: HOLLOW_CARD, at: Date.now() } });
      if (a.lift) toast(`You lifted ${title(a.lift)}. Its light is out on both screens.`);
    } finally { sending = false; B.poll(); }
  }

  /* ---------- the panel: whose pick, the card you stand by, pass, your own hollow card, the log ---------- */
  const panel = document.createElement("div");
  panel.id = "shared-pick";
  panel.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom));max-width:min(92vw,420px);background:rgba(20,16,24,.86);color:#f3e7d2;border:1px solid rgba(255,190,110,.45);border-radius:14px;padding:10px 14px;font:14px/1.4 system-ui,sans-serif;z-index:30;display:none";
  document.body.appendChild(panel);
  panel.addEventListener("click", e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const k = b.dataset.act;
    if (k === "pass") act({ pass: true });
    else if (k === "own") act({ own: true });
    else if (k === "lift" && walking) act({ lift: walking.card });
  });
  function render(p) {
    const me = local ? (ids().me || "you") : ids().me;
    const key = JSON.stringify([p, walking && walking.card, Object.keys(cards).length]);
    if (key === panelKey) return; panelKey = key;
    panel.style.display = "block";
    if (p.moment === "done") {
      const rows = turns(p.order).map(t => {
        const lift = Object.entries(p.taken || {}).find(([, e]) => e.by === t.by && e.moment === t.moment);
        const own = (p.own || []).some(e => e.by === t.by && e.moment === t.moment);
        const card = lift ? title(lift[0]) : own ? (t.by === me ? title(HOLLOW_CARD) + " (your own)" : "their own hollow card") : "passed";
        const fit = lift ? lift[0] === WRITTEN[t.moment] : own;
        return `<li>${esc(who(t.by))} at ${esc(MOMENT_NAME[t.moment])}: <b>${esc(card)}</b>${fit ? " ✓" : ""} <span style="opacity:.7">(written: ${esc(title(WRITTEN[t.moment]))})</span></li>`;
      }).join("");
      panel.innerHTML = `<div style="font-weight:600;margin-bottom:4px">The pick is done</div><ul style="margin:0;padding-left:18px">${rows}</ul>`;
      return;
    }
    const mine = p.turn === me, at = MOMENT_NAME[p.moment];
    let html = `<div style="font-weight:600">${mine ? "Your pick" : esc(who(p.turn)) + " picks"} · ${esc(at)}</div>`;
    if (p.moment === "a8-hollow" && taken(p) === 2) html += `<div style="opacity:.8">In the hollow the order turns: ${esc(who(p.turn))} first${mine ? "" : ""}.</div>`;
    if (mine && walking) {
      const c = cards[walking.card];
      html += `<div style="margin-top:6px"><b>${esc(title(walking.card))}</b>${c && c.primaryQuestion ? `<div style="opacity:.85">${esc(c.primaryQuestion)}</div>` : ""}</div>`;
      html += `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button data-act="lift" style="${BTN}">Lift it</button><button data-act="pass" style="${BTN2}">Pass</button></div>`;
    } else if (mine) {
      html += `<div style="opacity:.85;margin-top:4px">Walk to a lit stone to read its card. ${p.pool.length} still lit.</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">`;
      if (p.moment === "a8-hollow") html += `<button data-act="own" style="${BTN}">Lift your own hollow card</button>`;
      html += `<button data-act="pass" style="${BTN2}">Pass</button></div>`;
    } else html += `<div style="opacity:.85;margin-top:4px">${p.pool.length} stones still lit. Watch what they leave you.</div>`;
    panel.innerHTML = html;
  }
  const BTN = "background:#ffb45a;color:#21160c;border:0;border-radius:10px;padding:8px 14px;font:600 14px system-ui;min-height:40px";
  const BTN2 = "background:transparent;color:#f3e7d2;border:1px solid rgba(243,231,210,.5);border-radius:10px;padding:8px 14px;font:14px system-ui;min-height:40px";
  const toast = msg => (B.toast ? B.toast(msg) : null);

  function tick() {
    requestAnimationFrame(tick);
    maybeOpen();
    const p = pick();
    const G = g();
    const show = p && (local || (G && memberIds(G).length === 2 && G.kind !== "home"));
    if (!show) { group.visible = false; panel.style.display = "none"; return; }
    build(); group.visible = true; place(p); render(p);
    if (walking && !p.pool.includes(walking.card)) { walking = null; panelKey = ""; }
  }
  requestAnimationFrame(tick);
  return { tap, state: () => pick() && { ...pick(), local: !!local, walking: walking && walking.card }, act, stonesAt: () => [...stones.values()].map(s => ({ card: s.card, at: s.g.position.toArray(), lit: !!(pick() && pick().pool.includes(s.card)) })) };
}

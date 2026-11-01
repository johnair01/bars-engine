/* Letters from the nook, and the card you act on (Six-faces-council hollow-interface rounds 3 and 4; positions
   hi3-letters-from-the-nook, hi3-loop-and-win, hi3-card-goes-once, hi4-card-is-the-place, hi4-obstacle-from-the-draw,
   hi4-overcome-becomes-story; mechanic card-push-in). It replaces the stones of the shared pick.

   The encounter, as the player meets it:
     the letter arrives  your nook: the situation is the headline ("Pip has not come out in three days.")
     your hand           the seven Wake Up cards rise as a fan into the floor band; a card already in the Between is dim
     pulled up           the camera pushes in and the card fills the frame, the room dimmed behind it; its face shows the
                         question and what it can do in any Between; "Seal it and send" folds it into a letter that
                         leaves by the window
     the cards meet      the Between (or, from the nook, the window onto it): both letters open together, the obstacle
                         rises out of the grey with one part for each card, each card's thread running to its part
     pulled up again     your card fills the frame with three steps written against your part; you press one, apart
                         from your partner, and it lands when theirs does
     overcome, named     every part has given: the obstacle thins, the threads become one, and the headline is the
                         story's name (Tenagra's phrase), kept in the garden; told over tea it mints a vibeulon
   A step that answers nothing shows which part it missed, and the obstacle waits for one more step from whoever's part
   still stands.

   The rule is the server's (src/lib/between/shared-pick.ts through rules.ts mayWrite): one letter per player per
   encounter, sealed until both are in; one step per player per try, sealed the same way; the story kept by the server.
   Every word on the glass goes through the screen owner (voice.js). The lines are encounter-lines.js.

   The letters open only in a garden of two that holds them. Previews only: ?pick=a6 opens them in your Between of two
   (from the nook too); with no partner it plays on this page with a stand-in partner, and ?pick=a8 starts that
   rehearsal at the hollow with A6 already overcome. The rehearsal writes nothing to the store.

   Build 2 (hollow interface build 2, position hib2-beats-open-the-letters): in live rooms the beats open them. A6's
   letter arrives the first time the two of you stand in your room of two together (a few breaths, so it never lands on
   someone walking in); A8's arrives on a later visit, once A6's story is kept, again when you stand there together
   (it stands in for A7, the oath, which is not built). Once a letter has arrived, either of you answers it from the
   room or from your nook's window. */
import * as THREE from "three";
import { createObstacle } from "./obstacle.js";
import { HAND, ENCOUNTERS, NOOK, ORDER, elementOf, lineFor, encounterState, currentEncounter, obstacleLine } from "./encounter-lines.js";

const STAND_IN = "stand-in";
const EL = { wood: "#7fae5a", water: "#5a8fc4", fire: "#e0703a", metal: "#c9c3b5" };
const KEY = "between.letters.rehearsal";
// the obstacle's box is the place, the parts the two cards drew, and the two cards
// the grey edge each room looks out on: the hollow's open side, the nook's window (room-kit.js: the valley lies toward -z)
const EDGE = { hollow: { at: [0.2, 1.75, -4.4], cam: [0.2, 2.2, 4.6, 0.2, 1.35, -6], size: 1.7 }, nook: { at: [0.3, 1.4, -3.2], cam: [-0.15, 1.8, 2.2, 0.3, 1.25, -3.5], size: 0.7 } };

const css = `
#letters-hand { position: fixed; left: 0; right: 0; bottom: 0; height: 30%; z-index: 41; pointer-events: none; }
#letters-hand .lc { position: absolute; bottom: 4%; width: 96px; height: 138px; margin-left: -48px; border-radius: 10px; transform-origin: 50% 170%;
  background: linear-gradient(170deg, #2a1d17, #17110e); border: 1.5px solid rgba(255,214,160,.6); box-shadow: 0 6px 18px rgba(0,0,0,.6);
  padding: 12px 9px; box-sizing: border-box; font: 400 14px/1.2 "Marcellus", Georgia, serif; color: #f6ecdc; pointer-events: auto; cursor: pointer;
  transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .3s ease, filter .3s ease; text-align: left; }
#letters-hand .lc::before { content: ""; position: absolute; left: 9px; right: 9px; top: 6px; height: 3px; border-radius: 2px; background: var(--el); }
#letters-hand .lc small { position: absolute; left: 9px; right: 9px; bottom: 8px; font: italic 400 11px "Alegreya Sans", system-ui, sans-serif; color: #ffd08a; opacity: .85; }
#letters-hand .lc.gone { filter: brightness(.45) saturate(.6); cursor: default; }
#letters-hand.down .lc { transform: translateY(160%) !important; }
body.letters-dim #stage canvas { filter: brightness(var(--dimb, .4)) saturate(.8) blur(2.5px); transition: filter .5s ease; }
#letters-card { position: fixed; z-index: 42; left: 6%; right: 6%; top: var(--bt, 7%); bottom: var(--bb, 12%); perspective: 900px; pointer-events: none;
  --display: "Marcellus", Georgia, serif; --body: "Alegreya Sans", system-ui, sans-serif; color: #f6ecdc; }
#letters-card[hidden] { display: none; }
#letters-card .face { position: absolute; inset: 0; border-radius: 18px; transform: rotateX(4deg) rotateZ(-1.2deg); transform-origin: 50% 100%; pointer-events: auto;
  background: radial-gradient(120% 70% at 18% 6%, #4a3020 0%, #2a1c15 45%, #160f0c 100%); border: 2px solid rgba(255,214,160,.7);
  box-shadow: 0 0 0 6px rgba(20,12,8,.55), 0 0 60px rgba(255,170,90,.28), 0 24px 50px rgba(0,0,0,.75); padding: 30px 26px 20px; box-sizing: border-box;
  display: flex; flex-direction: column; overflow: hidden; transition: transform .55s cubic-bezier(.2,.8,.2,1), opacity .35s ease; }
#letters-card .face::before { content: ""; position: absolute; left: 22px; right: 22px; top: 14px; height: 5px; border-radius: 3px; background: var(--el); box-shadow: 0 0 12px var(--el); }
#letters-card .face::after { content: ""; position: absolute; inset: 9px; border-radius: 12px; border: 1px solid rgba(255,214,160,.18); pointer-events: none; }
#letters-card .kind { font: 600 11px var(--body); letter-spacing: .16em; text-transform: uppercase; opacity: .62; margin-top: 4px; }
#letters-card h2 { margin: 6px 0 0; font: 400 clamp(26px, 8vw, 33px)/1.08 var(--display); color: #fff3e2; }
#letters-card .q { margin-top: 12px; font: italic 400 clamp(16px, 4.8vw, 19px)/1.32 var(--body); color: #f1dcc0; }
#letters-card .against { margin-top: 14px; font: 400 14px/1.3 var(--body); color: #ffcf8f; }
#letters-card .lbl { margin-top: 14px; font: 600 11px var(--body); letter-spacing: .16em; text-transform: uppercase; opacity: .6; }
#letters-card .steps { margin-top: 8px; display: grid; gap: 2px; }
#letters-card .st { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: center; padding: 10px 0; border: 0; border-top: 1px solid rgba(255,214,160,.14);
  background: none; text-align: left; font: 500 clamp(15px, 4.4vw, 17.5px)/1.28 var(--body); color: #fff1de; cursor: pointer; }
#letters-card .st i { width: 30px; height: 30px; border-radius: 50%; background: radial-gradient(circle at 38% 32%, #f6b27a, #a9461f 70%); box-shadow: 0 0 0 2px rgba(255,214,160,.35), 0 3px 6px rgba(0,0,0,.6), inset 0 -3px 5px rgba(0,0,0,.35); }
#letters-card.preview .st { color: #e9d6bd; font-weight: 400; cursor: default; }
#letters-card.preview .st i { background: radial-gradient(circle at 38% 32%, #8a6a52, #4a3326 70%); box-shadow: 0 0 0 2px rgba(255,214,160,.2), inset 0 -3px 5px rgba(0,0,0,.35); }
#letters-card .st.up i { box-shadow: 0 0 0 2px #ffd08a, 0 0 18px rgba(255,180,100,.85), inset 0 -3px 5px rgba(0,0,0,.3); }
#letters-card .st.up { color: #fff; }
#letters-card .note { margin-top: auto; margin-bottom: 14px; font: italic 400 15px/1.35 var(--body); color: #cdb59a; }
#letters-card .send { margin-top: auto; display: flex; align-items: center; gap: 14px; font: 400 19px var(--display); color: #ffd9a3; background: none; border: 0; padding: 0; text-align: left; cursor: pointer; min-height: 48px; }
#letters-card .note + .send { margin-top: 0; }
#letters-card .send i { flex: none; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #f39a62, #b9481f 72%); box-shadow: 0 0 0 3px rgba(120,40,10,.4), 0 0 22px rgba(255,150,80,.55), inset 0 -4px 6px rgba(0,0,0,.35); }
#letters-card .send[disabled] { opacity: .45; cursor: default; }
#letters-card .send small { display: block; font: 400 13px/1.3 var(--body); color: #cdb59a; margin-top: 2px; }
#letters-card .back { position: absolute; right: 14px; top: 20px; background: none; border: 0; color: #cdb59a; font: 400 13px var(--body); padding: 8px; cursor: pointer; }
#letters-card.folding .face { transform: translateY(-38%) rotateX(70deg) scale(.18); opacity: 0; }
`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ss = { get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k) { try { sessionStorage.removeItem(k); } catch {} } };

/* The server's settle, for the rehearsal on this page (shared-pick.ts keeps the real one). */
function settleLocal(L) {
  const enc = currentEncounter(L); if (enc === "done") return L;
  const st = encounterState(L, enc); if (!st.overcome) return L;
  return { ...L, stories: { ...(L.stories || {}), [enc]: { name: st.story, cards: st.cards, at: Date.now() } } };
}
const fresh = (a, b) => ({ v: 2, order: [a, b], a6: { sent: {}, tries: {} }, a8: { sent: {}, tries: {} }, stories: {} });
const sentBy = (L, u) => ORDER.map(e => L && L[e] && L[e].sent && L[e].sent[u] && L[e].sent[u].card).filter(Boolean);
const deepMerge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === "object" && !Array.isArray(v) && o[k] && typeof o[k] === "object" ? deepMerge(o[k], v) : v; return o; };

export function mount(B, opts = {}) {
  const want = opts.open === "a6" || opts.open === "a8" ? opts.open : null;
  const voice = B.voice;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const handEl = document.createElement("div"); handEl.id = "letters-hand"; handEl.hidden = true; document.body.appendChild(handEl);
  const cardEl = document.createElement("div"); cardEl.id = "letters-card"; cardEl.hidden = true; document.body.appendChild(cardEl);
  let deck = {}; fetch("/allyship-deck/allyship-deck.json").then(r => r.json()).then(d => { for (const c of d.cards || []) deck[c.id] = c; dirty(); }).catch(() => {});
  const title = id => (deck[id] && deck[id].title) || id;
  const question = id => (deck[id] && deck[id].primaryQuestion) || "";
  const faceOf = id => { const f = String(id).split("-")[2] || ""; return f.charAt(0) + f.slice(1).toLowerCase(); };

  /* ---------- where the letters live: the rehearsal, this room, or (from the nook) your Between of two ---------- */
  let local = null, nook = null, sending = false, opened = false;
  const ids = () => B.ids();
  const me = () => (local ? local.me : ids().me);
  const g = () => B.view().g;
  const shell = () => (B.room().shell === "nook" ? "nook" : "hollow");
  const inHome = () => !!(g() && g().kind === "home") || shell() === "nook";
  const pairRoom = () => { const x = g(); return x && x.kind !== "home" && x.members && Object.keys(x.members).length === 2 ? x : null; };
  const myBetween = () => { const l = B.list && B.list(); return ((l && l.gardens) || []).find(r => r.person && r.phase !== "closed") || null; };
  function L() {
    if (local) return local.L;
    if (!inHome() && pairRoom()) return pairRoom().letters || null;
    return nook && nook.g ? nook.g.letters || null : null;
  }
  async function pollNook() {
    const r = myBetween(); if (!r || !inHome()) { nook = null; return; }
    try { const j = await B.api("/api/between/" + r.id + "/poll", {}); nook = { id: r.id, g: j.garden }; dirty(); } catch {}
  }
  setInterval(() => { if (!document.hidden && inHome() && !local) pollNook(); }, 6000);
  async function write(partial) {
    if (local) { local.L = settleLocal(deepMerge(local.L, partial)); ss.set(KEY, local); return; }
    if (!inHome() && pairRoom()) { await B.op("garden/main", "update", { letters: partial }); B.poll(); return; }
    if (nook) { const j = await B.api("/api/between/" + nook.id + "/doc", { path: "garden/main", op: "update", data: { letters: partial } }); nook.g = j.doc; }
  }
  async function openLetters() {
    if (local) return;
    const room = !inHome() ? pairRoom() : null;
    if (room) { if (!room.letters) await B.op("garden/main", "update", { letters: fresh(room.startedBy, Object.keys(room.members).find(m => m !== room.startedBy)) }).catch(() => {}); B.poll(); return; }
    await pollNook();
    if (nook && nook.g && !nook.g.letters) {
      const x = nook.g, other = Object.keys(x.members || {}).find(m => m !== x.startedBy);
      try { const j = await B.api("/api/between/" + nook.id + "/doc", { path: "garden/main", op: "update", data: { letters: fresh(x.startedBy, other) } }); nook.g = j.doc; } catch {}
    }
  }
  function rehearse(at) {
    const kept = ss.get(KEY);
    if (kept && kept.L && kept.at === at) { local = kept; return; }
    const u = ids().me || "you";
    let R = fresh(u, STAND_IN);
    if (at === "a8") {
      R = deepMerge(R, { a6: { sent: { [u]: { card: "WAKE-DA-REGENT", at: 1 }, [STAND_IN]: { card: "WAKE-DA-DIPLOMAT", at: 1 } }, tries: { 1: { [u]: { i: 0, at: 2 }, [STAND_IN]: { i: 0, at: 2 } } } } });
      R = settleLocal(R);
    }
    local = { me: u, at, L: R }; ss.set(KEY, local);
  }
  /* ---------- the beats, in live rooms: both of you here, for a few breaths ---------- */
  const VISIT = Date.now(), TOGETHER_MS = 6000;
  let togetherSince = 0, beatWriting = false;
  const partnerHere = room => { const o = Object.keys(room.members || {}).find(m => m !== ids().me); return !!o && [...(B.peers ? B.peers.values() : [])].some(p => p.uid === o); };
  // A8 waits for a later visit than the one that kept A6's story, and (in the room) for the two of you together
  function a8Waits(doc, inRoom) {
    if (local || !doc || currentEncounter(doc) !== "a8") return false;
    const E = doc.a8 || {}, any = Object.keys(E.sent || {}).length > 0;
    if (any) return false;
    const kept = doc.stories && doc.stories.a6, at = kept && kept.at;
    if (typeof at === "number" && at >= VISIT - 1000) return true;
    return inRoom ? !(togetherSince && performance.now() - togetherSince > TOGETHER_MS) : false;
  }
  function liveBeat() {
    if (local || want || !B.ready || !B.ready() || inHome()) { togetherSince = 0; return; }
    const room = pairRoom(); if (!room || room.phase === "closed" || room.phase === "spark") { togetherSince = 0; return; }
    if (!partnerHere(room)) { togetherSince = 0; return; }
    if (!togetherSince) togetherSince = performance.now();
    if (room.letters || beatWriting || performance.now() - togetherSince < TOGETHER_MS) return;
    // the A6 beat: the letters open, the one who started the room first (the server takes only this fresh doc)
    beatWriting = true;
    B.op("garden/main", "update", { letters: fresh(room.startedBy, Object.keys(room.members).find(m => m !== room.startedBy)) })
      .then(() => B.poll()).catch(() => {}).finally(() => { setTimeout(() => { beatWriting = false; }, 4000); dirty(); });
  }
  function maybeOpen() {
    liveBeat();
    if (opened || !want) return;
    if (!B.ready || !B.ready()) return;
    opened = true;
    const room = !inHome() ? pairRoom() : null, between = inHome() ? myBetween() : null;
    if (want === "a8" || (!room && !between)) return rehearse(want);
    ss.del(KEY);
    openLetters().then(dirty);
  }
  /* the stand-in partner of the rehearsal: sends a card of their own after yours, and takes a step that answers */
  let standInT = 0;
  function standIn() {
    if (!local || standInT) return;
    const R = local.L, enc = currentEncounter(R); if (enc === "done") return;
    const E = R[enc], s = encounterState(R, enc), mine = E.sent[local.me];
    let act = null;
    if (mine && !E.sent[STAND_IN]) {
      const used = sentBy(R, STAND_IN), pref = ["WAKE-DA-DIPLOMAT", "WAKE-RA-CHALLENGER", "WAKE-RA-SHAMAN", "WAKE-GR-SAGE", "WAKE-RA-SAGE", "WAKE-GR-SHAMAN", "WAKE-DA-REGENT"];
      const card = pref.find(c => c !== mine.card && !used.includes(c));
      act = { [enc]: { sent: { [STAND_IN]: { card, at: Date.now() } } } };
    } else if (s.both && s.need.includes(STAND_IN) && !s.stepping[STAND_IN] && (s.stepping[local.me] || !s.need.includes(local.me))) {
      const l = lineFor(enc, E.sent[STAND_IN].card), i = Math.max(0, l.steps.findIndex(x => x[2]));
      act = { [enc]: { tries: { [s.try]: { [STAND_IN]: { i, at: Date.now() } } } } };
    }
    if (!act) return;
    standInT = setTimeout(() => { standInT = 0; write(act).then(dirty); }, 1600);
  }

  /* ---------- the obstacle at the grey edge: the place, a part for each card, the two cards and their threads ---------- */
  const group = new THREE.Group(); group.visible = false; B.scene.add(group);
  // the obstacle itself: the place and the parts the two cards drew (obstacle.js; build 2 models round 4's drawing)
  let obPreview = null; // the stills check's look at every part of an encounter at once (obstacleAll)
  const ob = createObstacle(); ob.group.scale.setScalar(1.3); ob.group.position.set(0, 0.36, -0.2); group.add(ob.group);
  const cardTex = (id, mine) => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 368; const x = c.getContext("2d");
    const gr = x.createLinearGradient(0, 0, 0, 368); gr.addColorStop(0, "#3a271c"); gr.addColorStop(1, "#1a120e"); x.fillStyle = gr; x.fillRect(0, 0, 256, 368);
    x.strokeStyle = "#ffd08a"; x.lineWidth = 6; x.strokeRect(5, 5, 246, 358);
    x.fillStyle = EL[elementOf(id)]; x.fillRect(22, 18, 212, 9);
    x.fillStyle = "#fff1de"; x.font = "34px Marcellus, Georgia, serif";
    const words = title(id).split(" "); let line = "", y = 82;
    for (const w of words) { if (x.measureText(line + w).width > 210 && line) { x.fillText(line.trim(), 22, y); y += 40; line = ""; } line += w + " "; }
    x.fillText(line.trim(), 22, y);
    x.font = "600 16px system-ui"; x.globalAlpha = 0.6; x.fillText("WAKE UP", 22, y + 34); x.globalAlpha = 0.9;
    x.fillStyle = "#ffd08a"; x.font = "italic 22px system-ui"; x.fillText(mine ? "yours" : "your partner's", 22, 340);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const planes = [0, 1].map(i => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.63), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide }));
    m.position.set(i ? 0.66 : -0.66, -0.5, 1.45); m.rotation.z = i ? -0.14 : 0.16; m.userData.card = null; group.add(m); return m;
  });
  const threads = [0, 1].map(() => { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb46a, transparent: true, opacity: 0.85 })); group.add(l); return l; });
  function placeGroup(view) {
    const E = EDGE[shell()], [x, y, z] = E.at;
    group.position.set(x, y, z); group.scale.setScalar(E.size);
    const done = view.overcome, given = new Set(view.given || []);
    if (obPreview) { ob.update(obPreview); return; }
    ob.update({ enc: view.enc, cards: view.cards, given: new Set(view.order.filter(u => given.has(u)).map(u => view.cards[view.order.indexOf(u)])), overcome: done });
    view.order.forEach((u, i) => {
      const card = view.cards[i];
      if (card && planes[i].userData.card !== card + ":" + Object.keys(deck).length) {
        planes[i].material.map = cardTex(card, u === view.me); planes[i].material.needsUpdate = true; planes[i].userData.card = card + ":" + Object.keys(deck).length;
      }
      planes[i].visible = !!card;
      const a = planes[i].position.clone().add(new THREE.Vector3(0, 0.32, 0)), b = ob.group.position.clone().add(ob.anchor(view.enc, card).clone().multiplyScalar(ob.group.scale.x));
      threads[i].geometry.setFromPoints([a, b]); threads[i].visible = !!card;
      threads[i].material.color.setHex(done ? 0xffd08a : 0xffb46a);
    });
  }
  const V = new THREE.Vector3();
  function boxOf(pts) {
    const q = pts.map(p => { V.copy(p).applyMatrix4(group.matrixWorld); return B.screenOf(V); });
    const xs = q.map(v => v[0]), ys = q.map(v => v[1]);
    return { l: Math.max(0, Math.min(...xs)), r: Math.min(innerWidth, Math.max(...xs)), t: Math.max(0, Math.min(...ys)), b: Math.min(innerHeight, Math.max(...ys)) };
  }
  const obstacleBox = () => { group.updateMatrixWorld(); return boxOf([...ob.box.map(a => new THREE.Vector3(...a).multiplyScalar(ob.group.scale.x).add(ob.group.position)), ...planes.map(p => p.position.clone().add(new THREE.Vector3(0, -0.32, 0)))]); };
  const myPlaneBox = view => { const i = view.order.indexOf(view.me); group.updateMatrixWorld(); const p = planes[Math.max(0, i)].position; return boxOf([[-0.22, -0.32], [0.22, -0.32], [-0.22, 0.32], [0.22, 0.32]].map(([dx, dy]) => new THREE.Vector3(p.x + dx, p.y + dy, p.z))); };

  /* ---------- the camera is attention: compose the edge, push into the card ---------- */
  let camAnim = null, camHeld = false;
  function camTo(target, ms = 700) {
    const c = B.camera, from = [c.position.x, c.position.y, c.position.z], dir = new THREE.Vector3(); c.getWorldDirection(dir);
    const look = [from[0] + dir.x * 5, from[1] + dir.y * 5, from[2] + dir.z * 5], start = performance.now(), a0 = [...from, ...look];
    camAnim = { a0, target, start, ms }; camHeld = true;
  }
  function camTick() {
    if (!camAnim) return;
    const k = Math.min(1, (performance.now() - camAnim.start) / camAnim.ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    B.setCam(camAnim.a0.map((v, i) => v + (camAnim.target[i] - v) * e));
    if (k >= 1) camAnim = null;
  }
  function camRelease() { camAnim = null; if (camHeld) { B.setCam(null); camHeld = false; } }
  const pushCam = base => { const [x, y, z, lx, ly, lz] = base; return [x + (lx - x) * 0.32, y + (ly - y) * 0.32, z + (lz - z) * 0.32, lx, ly, lz]; };

  /* ---------- the hand: seven cards rising into the floor band ---------- */
  let handOpen = false, up = null, chosen = null, dismissed = "", folding = false;
  const acked = new Set(ss.get("between.letters.walkedOn") || []);
  const ackKey = enc => { const d = L(); return (d && d.order ? d.order.join("|") : "") + ":" + enc; };
  const ack = enc => { acked.add(ackKey(enc)); ss.set("between.letters.walkedOn", [...acked]); };
  function renderHand(view) {
    const used = view ? sentBy(view.L, view.me) : [];
    handEl.innerHTML = HAND.map((c, i) => {
      const t = (i - 3) / 3, gone = used.includes(c);
      return `<button type="button" class="lc${gone ? " gone" : ""}" data-card="${c}" style="--el:${EL[elementOf(c)]};left:${50 + t * 40}%;transform:translateY(${Math.abs(t) * 12}px) rotate(${t * 13}deg)">${esc(title(c))}${gone ? "<small>in the Between</small>" : ""}</button>`;
    }).join("");
  }
  handEl.addEventListener("click", e => {
    const b = e.target.closest("button[data-card]"); if (!b || b.classList.contains("gone")) return;
    pullUp(b.dataset.card, b.getBoundingClientRect());
  });
  /* the push-in: the card grows from where it lies (in the fan, or hanging at the grey edge) until it fills the frame */
  function pullUp(card, from) {
    const view = state(); if (!view) return;
    up = { card, where: view.mine ? "between" : "nook" }; chosen = null; handOpen = false; handEl.classList.add("down");
    renderCard(view, true);
    const face = cardEl.querySelector(".face");
    if (face && from) {
      const to = face.getBoundingClientRect();
      face.style.transition = "none";
      face.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
      face.style.transformOrigin = "0 0";
      face.getBoundingClientRect();
      face.style.transition = ""; face.style.transform = ""; face.style.transformOrigin = "";
    }
    document.body.classList.add("letters-dim"); document.body.style.setProperty("--dimb", shell() === "nook" ? ".55" : ".4");
    camTo(pushCam(EDGE[shell()].cam), 650);
    dirty();
  }
  function putDown() { up = null; chosen = null; cardEl.hidden = true; document.body.classList.remove("letters-dim"); dirty(); }
  cardEl.addEventListener("click", async e => {
    const view = state(); if (!view || !up) return;
    if (e.target.closest(".back")) { putDown(); if (!view.mine) { handOpen = true; handEl.classList.remove("down"); } return; }
    const s = e.target.closest(".st[data-i]");
    if (s && !cardEl.classList.contains("preview")) { chosen = +s.dataset.i; renderCard(view); return; }
    if (!e.target.closest(".send") || sending) return;
    sending = true;
    try {
      if (!view.mine) { // seal it and send: the card folds into a letter and leaves by the window
        folding = true; cardEl.classList.add("folding");
        await write({ [view.enc]: { sent: { [view.me]: { card: up.card, at: Date.now() } } } });
        await new Promise(r => setTimeout(r, 600));
        cardEl.classList.remove("folding"); folding = false; putDown();
      } else if (chosen != null) {
        await write({ [view.enc]: { tries: { [view.st.try]: { [view.me]: { i: chosen, at: Date.now() } } } } });
        putDown();
      }
    } catch (err) { B.toast && B.toast(err && err.message ? err.message : "That did not send. Try again in a moment."); }
    finally { sending = false; dirty(); }
  });
  function renderCard(view, force) {
    const card = up.card, enc = view.enc, l = lineFor(enc, card), between = !!view.mine;
    const steps = between ? (l ? l.steps.map(s => s[0]) : []) : NOOK[card] || [];
    const theirs = view.theirCard;
    const key = JSON.stringify([card, enc, between, chosen, Object.keys(deck).length, view.partnerStepped]);
    if (!force && cardEl.dataset.key === key) return;
    cardEl.dataset.key = key; cardEl.hidden = false;
    cardEl.className = between ? "" : "preview";
    cardEl.style.setProperty("--el", EL[elementOf(card)]);
    cardEl.style.setProperty("--bt", between ? "21%" : "6%"); cardEl.style.setProperty("--bb", between ? "9%" : "12%");
    const foot = between
      ? `<button type="button" class="send" ${chosen == null ? "disabled" : ""}><i></i><div>Take this step<small>It lands when your partner takes theirs.</small></div></button>`
      : `<div class="note">Your partner sends one of theirs. Where the two cards meet, the Between draws what you face together.</div><button type="button" class="send"><i></i><div>Seal it and send<small>It opens in the Between beside your partner's card.</small></div></button>`;
    cardEl.innerHTML = `<div class="face"><button type="button" class="back">Put it down</button><div class="kind">Wake Up · ${esc(faceOf(card))}</div><h2>${esc(title(card))}</h2>`
      + `<div class="q">${esc(question(card))}</div>`
      + (between ? `<div class="against">Against ${esc(l ? l.part : "the obstacle")}</div>` : `<div class="lbl">In the Between, you can</div>`)
      + `<div class="steps">${steps.map((s, i) => `<button type="button" class="st${i === chosen ? " up" : ""}" data-i="${i}"><i></i><span>${esc(s)}</span></button>`).join("")}</div>${foot}</div>`;
    if (between && theirs) voice.say({ subject: () => rectOf(cardEl.querySelector(".face")), foot: view.partnerStepped ? "Your partner has taken their step." : `Your partner is choosing a step from ${title(theirs)}.` });
    else voice.say({ subject: () => rectOf(cardEl.querySelector(".face")) });
  }
  const rectOf = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };

  /* ---------- the beat: what the player sees now, from the letters ---------- */
  function state() {
    const doc = L(); if (!doc || !doc.order) return null;
    const u = me(), enc = currentEncounter(doc);
    const last = ORDER.filter(e => doc.stories && doc.stories[e]).pop();
    // an overcome encounter stays on screen until you walk on from it; then the next one's letter arrives
    const showEnc = enc === "done" || (last && !acked.has(ackKey(last))) ? last : enc;
    if (showEnc === "a8" && a8Waits(doc, !inHome())) return null;
    const E = doc[showEnc] || {}, s = encounterState(doc, showEnc), i = doc.order.indexOf(u), other = doc.order[1 - i];
    const mineL = E.sent && E.sent[u], theirL = E.sent && E.sent[other];
    return { L: doc, enc: showEnc, done: enc === "done", me: u, other, order: doc.order, st: s, mine: mineL && mineL.card, theirsIn: !!theirL,
      theirCard: theirL && theirL.card, cards: s.cards, given: s.given, overcome: s.overcome,
      partnerStepped: !!(s.stepping && s.stepping[other]), stepped: !!(s.stepping && s.stepping[u]), story: doc.stories && doc.stories[showEnc] };
  }
  const dname = (v, u) => (u === v.me ? "You" : "Your partner");
  function beat(v) {
    const sit = ENCOUNTERS[v.enc].situation;
    if (v.overcome) {
      const lastStep = u => { for (let k = v.st.log.length - 1; k >= 0; k--) { const r = v.st.log[k].res[u]; if (r && r.ok) return r.i; } return null; };
      const landed = v.order.map((u, i) => { const l = lineFor(v.enc, v.cards[i]), s = lastStep(u); return [dname(v, u), l && s != null ? l.steps[s][1] : ""]; });
      return { key: "overcome:" + v.enc, cam: "edge", obstacle: true, say: { head: (v.story && v.story.name) || v.st.story, sub: `${ENCOUNTERS[v.enc].overcome} A story you can both name; told over tea, it mints a vibeulon.`, landed, actions: [{ label: "Walk on", quiet: true, on: () => { ack(v.enc); dirty(); } }] } };
    }
    if (!v.mine) {
      if (handOpen) return { key: "hand", hand: true, say: { head: "Send a question to the Between.", sub: v.theirsIn ? "Your partner's letter is already there. Yours opens beside it." : "Your partner sends one of theirs. You open them together.", actions: [{ label: "Close your hand", quiet: true, on: () => { handOpen = false; dirty(); } }] } };
      return { key: "arrived:" + v.enc, say: { head: sit, sub: v.theirsIn ? "Your partner has sent a card. Send one of yours, and the Between opens them together." : "Send a question to the Between, as a letter. Your partner sends one of theirs.", actions: [{ label: "Open your hand", on: () => { handOpen = true; dirty(); } }, { label: "Not now", quiet: true, on: () => { dismissed = "arrived:" + v.enc; dirty(); } }] } };
    }
    if (!v.st.both) return { key: "sent:" + v.enc, say: { head: `${title(v.mine)} is on its way.`, sub: "It opens in the Between beside your partner's card, when theirs is in.", actions: [{ label: "Walk on", quiet: true, on: () => { dismissed = "sent:" + v.enc; dirty(); } }] } };
    const lastTry = v.st.log[v.st.log.length - 1], needMe = v.st.need.includes(v.me);
    const part = u => { const l = lineFor(v.enc, v.cards[v.order.indexOf(u)]); return l ? l.part : "its part"; };
    const pull = { label: "Pull your card up", on: () => pullUp(v.mine, myPlaneBox(v) && toRect(myPlaneBox(v))) };
    const quietOn = k => ({ label: "Walk on", quiet: true, on: () => { dismissed = k; dirty(); } });
    if (v.stepped) return { key: "stepped:" + v.enc + v.st.try, cam: "edge", obstacle: true, say: { head: "Your step is taken.", sub: "It lands when your partner takes theirs.", actions: [quietOn("stepped:" + v.enc + v.st.try)] } };
    if (lastTry) {
      const missed = v.order.filter(u => lastTry.res[u] && !lastTry.res[u].ok);
      const who = missed.map(u => { const l = lineFor(v.enc, v.cards[v.order.indexOf(u)]); return `${dname(v, u)} ${l ? l.steps[lastTry.res[u].i][1] : ""}`; }).join(" ");
      const head = missed.length ? `${cap(part(missed[0]))} still ${missed.length > 1 ? "stand" : "stands"}.` : "The obstacle waits.";
      return { key: "missed:" + v.enc + v.st.try, cam: "edge", obstacle: true, say: { head, sub: `${who} It missed ${missed.map(part).join(" and ")}.${needMe ? "" : " Your part has given; your partner takes one more step."}`, actions: needMe ? [pull, quietOn("missed:" + v.enc + v.st.try)] : [quietOn("missed:" + v.enc + v.st.try)] } };
    }
    return { key: "meet:" + v.enc, cam: "edge", obstacle: true, say: { head: obstacleLine(v.enc, v.cards), sub: `Your ${title(v.mine)} and their ${title(v.theirCard)} drew it out of the grey.`, actions: [pull, quietOn("meet:" + v.enc)] } };
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const toRect = b => ({ left: b.l, top: b.t, width: b.r - b.l, height: b.b - b.t });

  /* ---------- the frame loop ---------- */
  let dirtyF = true; const dirty = () => { dirtyF = true; };
  let lastKey = "", holding = false;
  function tick() {
    requestAnimationFrame(tick);
    maybeOpen(); camTick();
    const v = state();
    if (!v || (v.done && acked.has(ackKey(v.enc)))) { group.visible = false; if (holding) { voice.quiet(); holding = false; camRelease(); } handEl.hidden = true; return; }
    if (local) standIn();
    const b = beat(v);
    group.visible = !!b.obstacle && v.st.both; if (group.visible) placeGroup(v);
    if (up) { if (dirtyF) renderCard(v); dirtyF = false; voice.place(); return; }
    handEl.hidden = !b.hand; if (b.hand) { if (dirtyF || handEl.classList.contains("down")) { renderHand(v); requestAnimationFrame(() => handEl.classList.remove("down")); } }
    if (dismissed === b.key) { if (holding) { voice.quiet(); holding = false; camRelease(); } return; }
    if (b.key !== lastKey) { lastKey = b.key; if (b.cam === "edge") camTo(EDGE[shell()].cam, 900); else camRelease(); }
    const subject = b.obstacle && group.visible ? obstacleBox : b.hand ? () => rectOf(handEl) : null;
    if (dirtyF || !holding) voice.say({ ...b.say, subject });
    else voice.place();
    holding = true; dirtyF = false;
  }
  requestAnimationFrame(tick);
  /* a tap on the cards at the grey edge brings the moment back after "Walk on" */
  function tap(ray) {
    if (!group.visible) return false;
    group.updateMatrixWorld();
    const c = new THREE.Vector3(); group.getWorldPosition(c);
    if (ray.distanceToPoint(c) > 2.6 * group.scale.x) return false;
    dismissed = ""; lastKey = ""; dirty(); return true;
  }
  return {
    tap,
    state: () => { const v = state(); return v && { enc: v.enc, done: v.done, mine: v.mine || null, theirs: v.theirCard || null, both: v.st.both, try: v.st.try, need: v.st.need, given: v.given, overcome: v.overcome, story: (v.story && v.story.name) || null, local: !!local, up: up && up.card, hand: handOpen }; },
    send: async card => { const v = state(); if (!v) return; await write({ [v.enc]: { sent: { [v.me]: { card, at: Date.now() } } } }); dirty(); },
    step: async i => { const v = state(); if (!v) return; await write({ [v.enc]: { tries: { [v.st.try]: { [v.me]: { i, at: Date.now() } } } } }); dirty(); },
    openHand: () => { handOpen = true; dismissed = ""; dirty(); }, pullUp: card => pullUp(card, null), choose: i => { chosen = i; dirty(); }, putDown,
    pollNook, obstacleBox, refresh: dirty, obstacleAll: (enc, given) => { obPreview = enc ? { enc, cards: HAND.slice(), given: new Set(given ? HAND : []), overcome: !!given } : null; for (const p of planes) p.visible = !enc; for (const t of threads) t.visible = !enc; }, walkOn: () => { const v = state(); if (v && v.overcome) ack(v.enc); dirty(); },
  };
}

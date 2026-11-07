/* The healing journey in the nook (Six-faces-council spec .specify/specs/healing-journey, slice 1, T006 to T009; his A on
   hj-homeroom-look-1, 2026-11-07). The rules are journey.js and nothing here decides one: the nook only draws them.

   What stands in the room, for a player whose journey has a program (anyone else sees nothing new):
   - the shelf: up to three carried objects as cloth bundles in their feeling's colour beside the I Ching book. A tap opens a
     card with the three acts (FR-003): open the diary, sit with it at the hearth, carry it on.
   - the diary (FR-004, FR-005): the built 3-2-1's questions word for word, the object's lines in its ink and the player's in
     their own, saved after every line, shut at any line without a warning, reopening on the same page. No model writes a line.
   - the woodpile by the hearth's left jamb (FR-008): one split log per move record, fsLogGeo from garden.js, never fewer,
     no number on the play surface.
   - furnishings (FR-006): a worked object leaves the shelf and stands in the room as a lamp, a plant or a tool.
   - the practice sheet (FR-009): the seven acts at the homeroom's furniture, each with how many times it was made. Never a
     total, never a streak, never what was written.
   Pages are refused by the store until the player has agreed to the storage rule (rules.ts journeyWrite). Until then the diary
   works and keeps its pages in this tab only, and says so. Previews write nothing: ?journey=demo stands a program, three
   objects and seven logs on this page only (&journey=diary opens the diary, &journey=pile30 thirty logs, &journey=none no logs). */
import * as THREE from "three";
import { SHELLS } from "../calrunia/room-kit.js";
import { DIARY, OPENERS, MOVES, MOVE_NAMES, FEELING_NAMES, countsByMove, logsOf, enrolled, shelfShown, furnishings, pileSlots, pageFor, newPage, diaryAt, nextVoice, withTurn, finishPage, withMove, dayOf } from "./journey.js";

/* The five feelings' colours (garden.js ELEMENTS and FEELS). `cloth` is the dyed cloth, `ink` the diary's ink, deepened to hold on paper. */
const FEEL = {
  wood: { light: 0x6fae5a, cloth: 0x3f7a34, ink: "#2f6a2a" },
  fire: { light: 0xe0663a, cloth: 0xb0401e, ink: "#b23a18" },
  earth: { light: 0xc9a35a, cloth: 0x9a7432, ink: "#7a5420" },
  metal: { light: 0xc8ccd4, cloth: 0x8a909c, ink: "#55585e" },
  water: { light: 0x4f8fd0, cloth: 0x2c5f9e, ink: "#1f4f96" },
};
const OWN_INK = "#2a1a12";
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const FURNISH_WORDS = { lamp: "a lamp", plant: "a plant", tool: "a tool" };

export function mount(B, opts = {}) {
  const demo = !!opts.open;
  let local = null; // a preview's doc (this page only)
  let mem = []; // pages held in this tab while the storage rule is not agreed
  let root = null, built = false, shelfGroup = null, pileGroup = null, furnGroup = null, deskGroup = null, pileN = -1, shelfSig = "", furnSig = "";
  let card = null, diaryOpen = null, diaryStep = null, sheetOpen = false, tab = 0;
  const ray = new THREE.Raycaster();

  const doc = () => (local || (B.journey && B.journey()) || {});
  const agreed = () => { const p = doc().program; return !!(p && p.agreedOn); };
  const on = () => demo ? !!local || true : enrolled(doc());
  const pagesNow = () => (local || agreed() ? doc().pages || [] : mem);
  const docNow = () => ({ ...doc(), pages: pagesNow() });

  /* every change to the journey goes through here: previews keep it on the page, a real player's goes to the store */
  async function write(patch) {
    if (local) { Object.assign(local, patch); return; }
    if (patch.pages && !agreed()) { mem = patch.pages; patch = { ...patch }; delete patch.pages; if (!Object.keys(patch).length) return; }
    try { await B.journeyWrite(patch); } catch (e) { B.toast("That did not save. It is still here; try again."); throw e; }
  }

  /* ---------- the things: bundle, log, furnishing ---------- */
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function clothTex(hex) {
    return canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = "#" + new THREE.Color(hex).getHexString(); c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) { c.fillStyle = `rgba(0,0,0,${0.04 + rnd() * 0.05})`; c.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 3) { c.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.03})`; c.fillRect(x, 0, 1, h); }
    });
  }
  /* A carried object: cloth gathered to a knot, a cord, a paper tag (the stills round's bundle, drawn here as written). */
  function bundle(feeling, k = 1) {
    const f = FEEL[feeling] || FEEL.water, g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: clothTex(f.cloth), roughness: 0.95, emissive: f.light, emissiveIntensity: 0.16 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), mat); body.scale.set(1.05, 0.78, 0.95); body.position.y = 0.078; g.add(body);
    const p = body.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.04) { const s = 1 - (y - 0.04) / 0.06 * 0.55; p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); } }
    body.geometry.computeVertexNormals();
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.04, 10), mat); neck.position.y = 0.155; g.add(neck);
    for (const [ry, rz] of [[0.3, 0.75], [0.3 + Math.PI, 0.7]]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), mat); ear.scale.set(0.7, 1.5, 0.5); ear.position.y = 0.175; ear.rotation.set(0, ry, rz); ear.translateY(0.025); g.add(ear); }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mat); knot.position.y = 0.178; g.add(knot);
    const cordM = new THREE.MeshStandardMaterial({ color: 0xd9c49a, roughness: 0.8 });
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 18), cordM); cord.rotation.x = Math.PI / 2; cord.position.y = 0.15; g.add(cord);
    const tagTex = canvasTex(96, 64, (c, w, h) => { c.fillStyle = "#efe2c4"; c.fillRect(0, 0, w, h); c.fillStyle = "#b9a888"; c.beginPath(); c.arc(12, h / 2, 5, 0, 7); c.fill();
      c.strokeStyle = f.ink; c.lineWidth = 3; c.lineCap = "round"; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(26, 18 + i * 13); for (let x = 26; x < 26 + 50 - i * 12; x += 6) c.lineTo(x, 18 + i * 13 + Math.sin(x * 0.7 + i) * 2); c.stroke(); } });
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xfff0d0, emissiveMap: tagTex, emissiveIntensity: 0.25 }));
    tag.position.set(0.055, 0.115, 0.07); tag.rotation.set(0.15, -0.5, 0.35); g.add(tag);
    g.scale.setScalar(k); return g;
  }
  /* The woodpile: log n takes the next slot of journey.js pileSlots, a half-offset stack against the hearth's left jamb. */
  function woodpile(n) {
    const g = new THREE.Group(); let s = 3; const r01 = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const LW = 0.152, LH = 0.118;
    for (const [c, l] of pileSlots(n)) {
      const r = 0.082 + r01() * 0.014, len = 0.42 + r01() * 0.07;
      const m = new THREE.Mesh(B.fsLogGeo(r, len), B.logMats);
      m.position.set((c + l / 2) * LW, 0.06 + l * LH, (r01() - 0.5) * 0.05);
      m.rotation.set(0, (r01() - 0.5) * 0.12, Math.PI / 2 + (r01() - 0.5) * 2.2);
      g.add(m);
    }
    return g;
  }
  /* A worked object stands in the room as a furnishing chosen by its feeling (FR-006): a lamp, a plant or a tool. */
  function furnishing(kind, feeling) {
    const f = FEEL[feeling] || FEEL.water, g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.9 }), glow = new THREE.MeshStandardMaterial({ color: f.cloth, emissive: f.light, emissiveIntensity: 0.7, roughness: 0.6 });
    if (kind === "lamp") {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.34, 8), wood); stem.position.y = 0.17; g.add(stem);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), glow); bulb.position.y = 0.4; g.add(bulb);
      const l = new THREE.PointLight(f.light, 0.35, 1.4, 1.8); l.position.y = 0.42; g.add(l);
    } else if (kind === "plant") {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.9 })); pot.position.y = 0.07; g.add(pot);
      for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.26, 6), glow); lf.position.y = 0.26; lf.rotation.set(0.4, i * 1.05, 0); lf.translateY(0.04); g.add(lf); }
    } else {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 6), wood); handle.position.y = 0.3; handle.rotation.z = 0.12; g.add(handle);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.035), glow); head.position.set(0.04, 0.6, 0); g.add(head);
    }
    return g;
  }
  /* the diary open on the coin table: leather, cream pages, a ribbon; the ink strokes are the count of lines, never letters */
  function diaryMesh(page) {
    const g = new THREE.Group(), cover = new THREE.MeshStandardMaterial({ color: 0x5a3a26, roughness: 0.8 });
    const PW = 0.18, PD = 0.245, f = FEEL[(page && page.feeling) || "water"], thread = page ? page.pass.thread : [];
    for (const side of [-1, 1]) {
      const hg = new THREE.Group(); hg.rotation.z = side * 0.07; g.add(hg);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.01, 0.008, PD + 0.014), cover); cv.position.x = side * (PW / 2 + 0.005); hg.add(cv);
      const block = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.004, 0.014, PD - 0.004), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 })); block.position.set(side * PW / 2, 0.011, 0); hg.add(block);
      const t = canvasTex(256, 340, (c, w, h) => { c.fillStyle = "#f2e6cc"; c.fillRect(0, 0, w, h); c.lineCap = "round"; c.lineWidth = 8;
        thread.slice(side < 0 ? 0 : 0, 12).forEach((ln, i) => { if ((side < 0) !== (ln.from === "it")) return; c.strokeStyle = ln.from === "it" ? f.ink : OWN_INK; const y = 40 + i * 22; c.beginPath(); c.moveTo(24, y); for (let x = 24; x < 24 + Math.min(200, 40 + ln.text.length * 3); x += 8) c.lineTo(x, y + Math.sin(x * 0.6 + i) * 2); c.stroke(); }); });
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.004, PD - 0.004), new THREE.MeshStandardMaterial({ map: t, color: 0x5a5a5a, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.62 }));
      pg.rotation.x = -Math.PI / 2; pg.position.set(side * PW / 2, 0.0185, 0); hg.add(pg);
    }
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, PD + 0.014, 8), cover); spine.rotation.x = Math.PI / 2; spine.position.y = -0.002; g.add(spine);
    return g;
  }

  /* ---------- where things stand ---------- */
  const shelfSpot = () => { const sp = SHELLS.nook.spots.find(x => x.id === "shelf"), sy = sp.face || 0.3; return { at: V(...sp.at), yaw: sy, right: V(Math.cos(sy), 0, -Math.sin(sy)), fwd: V(Math.sin(sy), 0, Math.cos(sy)) }; };
  function hearthAxes() { const h = B.hearthAt(), yaw = Math.atan2(-h.x, -h.z); return { h, yaw, x: V(Math.cos(yaw), 0, -Math.sin(yaw)), z: V(Math.sin(yaw), 0, Math.cos(yaw)) }; }
  const FURN_SPOTS = [[-0.1, -3.05], [0.8, -2.85], [1.55, -2.25], [-1.9, -0.85], [-2.55, 0.5], [1.9, -1.4]];

  function build() {
    const sc = B.scene;
    shelfGroup = new THREE.Group(); pileGroup = new THREE.Group(); furnGroup = new THREE.Group(); deskGroup = new THREE.Group();
    sc.add(shelfGroup, pileGroup, furnGroup, deskGroup);
    built = true;
  }
  function layShelf() {
    const sig = JSON.stringify(shelfShown(doc().pack).map(o => [o.id, o.feeling]));
    if (sig === shelfSig) return; shelfSig = sig;
    shelfGroup.clear();
    const s = shelfSpot();
    shelfShown(doc().pack).forEach((o, i) => {
      const b = bundle(o.feeling, 0.72);
      b.position.copy(s.at).addScaledVector(s.right, 0.17 + i * 0.12).addScaledVector(s.fwd, -0.03 + (i % 2) * 0.06);
      b.rotation.y = s.yaw - 0.3 + i * 0.5; b.userData.objectId = o.id; shelfGroup.add(b);
    });
  }
  function layPile() {
    const n = logsOf(doc().moves); if (n === pileN) return; pileN = n;
    pileGroup.clear(); if (!n) return;
    const a = hearthAxes(), w = woodpile(n);
    w.position.copy(a.h).addScaledVector(a.x, -0.98).addScaledVector(a.z, 0.02); w.position.y = 0; w.rotation.y = a.yaw + Math.PI; pileGroup.add(w);
  }
  function layFurnishings() {
    const list = furnishings(doc().pack), sig = JSON.stringify(list.map(o => [o.id, o.furnishing]));
    if (sig === furnSig) return; furnSig = sig; furnGroup.clear();
    list.forEach((o, i) => { const m = furnishing(o.furnishing, o.feeling), [x, z] = FURN_SPOTS[i % FURN_SPOTS.length]; m.position.set(x, 0, z); furnGroup.add(m); });
  }
  function layDiary() {
    deskGroup.clear(); if (!diaryOpen) return;
    const t = B.coins && B.coins.view().table; if (!t) return;
    const T0 = V(...t), sd = B.coins.view().seat, seat = V(...sd), to = seat.clone().sub(T0).setY(0).normalize();
    const pg = pagesNow().find(p => p.id === diaryOpen), obj = (doc().pack || []).find(o => pg && o.id === pg.objectId);
    const m = diaryMesh(pg && { ...pg, feeling: obj && obj.feeling }); m.position.copy(T0).setY(0.324).addScaledVector(to, 0.07); m.rotation.y = Math.atan2(to.x, to.z); deskGroup.add(m);
  }

  /* ---------- taps on a bundle ---------- */
  let downAt = null;
  B.renderer.domElement.addEventListener("pointerdown", e => { downAt = { x: e.clientX, y: e.clientY }; });
  B.renderer.domElement.addEventListener("pointerup", e => {
    if (!built || !downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8 || !shelfGroup.children.length) return;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), B.camera);
    const hits = ray.intersectObjects(shelfGroup.children, true); if (!hits.length) return;
    let o = hits[0].object; while (o && !o.userData.objectId) o = o.parent;
    if (o) openCard(o.userData.objectId);
  });

  /* ---------- the card and the diary: one fixed layer, ink on paper ---------- */
  const css = document.createElement("style");
  css.textContent = `.jn{position:fixed;inset:0;z-index:36;display:flex;justify-content:center;align-items:flex-end;pointer-events:none;font-family:"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif}
  .jn>*{pointer-events:auto}
  .jn-card{width:min(94vw,440px);margin-bottom:calc(14px + env(safe-area-inset-bottom,0px));padding:16px 18px 14px;border-radius:16px;background:#f3e8cf;color:${OWN_INK};box-shadow:0 10px 40px rgba(0,0,0,.5);border:1px solid #c9b58a;display:grid;gap:10px}
  .jn-card h2{font:400 1.3rem Marcellus,Georgia,serif;margin:0;display:flex;gap:9px;align-items:center}
  .jn-dot{width:14px;height:14px;border-radius:50%;flex:none}
  .jn-tag{font-size:.95rem;line-height:1.45;margin:0}.jn-tag i{font-style:normal;color:#6a5a44;display:block;font-size:.8rem;letter-spacing:.04em}
  .jn button{font:700 .9rem "Atkinson Hyperlegible",system-ui,sans-serif;border-radius:999px;padding:9px 15px;min-height:44px;border:1px solid #6a4a30;background:#6a4a30;color:#fbf2df;cursor:pointer}
  .jn button.q{background:transparent;color:#5a4630;border-color:#b8a47c}
  .jn-row{display:flex;flex-wrap:wrap;gap:8px}
  .jn-book{width:min(96vw,560px);max-height:62vh;margin-bottom:calc(8px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;border-radius:16px;background:#f2e6cc;color:${OWN_INK};box-shadow:0 10px 50px rgba(0,0,0,.6);border:8px solid #5a3a26;overflow:hidden}
  .jn-top{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px 6px;border-bottom:1px solid #d6c59d}
  .jn-top .nav{display:flex;gap:5px;flex-wrap:nowrap}
  .jn-top button{white-space:nowrap}
  .jn-top .nav button{min-height:36px;padding:4px 9px;font-size:.74rem}
  .jn-top>button{min-height:36px;padding:4px 11px;font-size:.78rem}
  .jn-top .nav button[aria-current=true]{background:#5a3a26;color:#fbf2df}
  .jn-top .nav button:not([aria-current=true]){background:transparent;color:#5a4630;border-color:#b8a47c}
  .jn-page{overflow:auto;padding:14px 16px 16px;display:grid;gap:11px}
  .jn-page h3{font:400 1.2rem Marcellus,Georgia,serif;margin:0}.jn-page .cap{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#6a5a44}
  .jn-page p{margin:0;line-height:1.5;font-size:.98rem}.jn-page .ask{color:#4a3a2a}
  .jn-page textarea,.jn-page input{font:1.05rem/1.55 "Atkinson Hyperlegible",system-ui,sans-serif;width:100%;box-sizing:border-box;background:repeating-linear-gradient(transparent 0 1.5em,#d9c9a2 1.5em calc(1.5em + 1px)) ,#f7eed9;border:1px solid #d6c59d;border-radius:8px;padding:9px 11px;resize:none}
  .jn-page .said{display:grid;gap:7px}.jn-page .line{padding:7px 11px;border-radius:12px;max-width:88%;line-height:1.45;font-size:1rem;background:#f7eed9;border:1px solid #d6c59d}
  .jn-page .line.me{justify-self:end;border-radius:12px 12px 3px 12px}.jn-page .line.it{border-radius:12px 12px 12px 3px}
  .jn-page .line small{display:block;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:#6a5a44;margin-bottom:2px}
  .jn-page .chips{display:flex;flex-wrap:wrap;gap:7px}.jn-page .chips button{background:#f7eed9;color:#4a3a2a;border-color:#d6c59d;font-weight:400;font-size:.84rem}
  .jn-note{font-size:.84rem;color:#6a5a44;margin:0}
  .jn-prac{position:fixed;left:12px;top:100px;z-index:34;font:700 .85rem "Atkinson Hyperlegible",system-ui,sans-serif;border-radius:999px;padding:8px 14px;min-height:40px;border:1px solid rgba(255,255,255,.25);background:rgba(30,20,12,.72);color:#f3e8cf;cursor:pointer;backdrop-filter:blur(6px)}
  .jn-moves{display:grid;gap:6px}.jn-moves li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;padding:7px 0;border-bottom:1px solid #d6c59d;list-style:none}
  .jn-moves ul{margin:0;padding:0}.jn-moves .n{font:400 1.2rem Marcellus,Georgia,serif;min-width:1.5em;text-align:right}
  .jn-moves .act{grid-column:1/3;display:flex;gap:7px;flex-wrap:wrap}.jn-moves .act button{min-height:36px;padding:4px 11px;font-size:.78rem}`;
  document.head.appendChild(css);
  root = document.createElement("div"); root.className = "jn"; document.body.appendChild(root);
  const prac = document.createElement("button"); prac.className = "jn-prac"; prac.type = "button"; prac.textContent = "Your practice"; prac.hidden = true;
  prac.addEventListener("click", () => { card = null; if (diaryOpen) closeDiary(); sheetOpen = !sheetOpen; draw(); });
  document.body.appendChild(prac);

  const objectOf = id => (doc().pack || []).find(o => o.id === id);
  const inkOf = o => (FEEL[o && o.feeling] || FEEL.water).ink;
  function openCard(id) { if (diaryOpen) return; sheetOpen = false; card = id; draw(); }
  function closeAll() { card = null; sheetOpen = false; closeDiary(); draw(); }
  function closeDiary() { diaryOpen = null; diaryStep = null; layDiary(); }

  /* the three acts (FR-003) */
  async function act(kind, id) {
    const o = objectOf(id); if (!o) return;
    if (kind === "diary") {
      let pg = pageFor(docNow(), id);
      if (!pg) { pg = newPage(id); await write({ pages: [...pagesNow(), pg] }); }
      card = null; diaryOpen = pg.id; diaryStep = diaryAt(pg.pass);
      layDiary(); draw();
    } else if (kind === "hearth") {
      card = null; draw();
      await write({ pack: (doc().pack || []).map(x => x.id === id ? { ...x, state: "held" } : x), moves: withMove(doc(), "hearth", false) });
      if (B.sitAtHearth) B.sitAtHearth();
      B.toast("It sat with you by the fire. A log for the pile.");
    } else { // carry it on: it stays in the pack, still with you
      card = null; draw(); await write({ pack: (doc().pack || []).map(x => x.id === id ? { ...x, state: "carried" } : x) });
      B.toast("You are carrying it on.");
    }
  }

  async function saveField(pageId, mut) { // every line is saved as it is written (FR-005)
    const pages = pagesNow().map(p => p.id === pageId ? { ...p, pass: mut(p.pass) } : p);
    await write({ pages });
  }
  async function closePage(pageId) {
    const next = finishPage(docNow(), pageId);
    await write({ pages: next.pages, pack: next.pack, moves: next.moves });
    const o = objectOf((next.pages.find(p => p.id === pageId) || {}).objectId);
    closeDiary(); draw();
    B.toast("It has a place in the room now" + (o && o.furnishing ? ": " + FURNISH_WORDS[o.furnishing] + "." : "."));
  }

  function diaryHtml() {
    const pg = pagesNow().find(p => p.id === diaryOpen); if (!pg) return "";
    const o = objectOf(pg.objectId) || {}, ink = inkOf(o), pass = pg.pass, name = pass.maskName.trim() || "it";
    const reach = { face: true, name: !!pass.faceCharge.trim(), talk: !!pass.maskName.trim(), be: !!pass.maskName.trim() };
    const nav = [["face", DIARY.face.title], ["talk", DIARY.name.title], ["be", DIARY.be.title]].map(([k, t]) => {
      const here = k === "face" ? diaryStep === "face" : k === "talk" ? diaryStep === "name" || diaryStep === "talk" : diaryStep === "be";
      return `<button type="button" data-step="${k === "talk" && pass.maskName.trim() ? "talk" : k === "talk" ? "name" : k}" aria-current="${here}"${reach[k === "talk" ? "name" : k] === false ? " disabled" : ""}>${DIARY[k === "talk" ? "name" : k].num} · ${t}</button>`; }).join("");
    let body = "";
    if (diaryStep === "face") body = `<div class="cap">${DIARY.face.caption}</div><h3>${DIARY.face.title}</h3><p class="ask">${DIARY.face.ask}</p>
      <textarea rows="5" data-f="face" style="color:${OWN_INK}" aria-label="Describe the charge in the third person" placeholder="${esc(DIARY.face.hint)}">${esc(pass.faceCharge)}</textarea>
      <div class="jn-row"><button type="button" data-save="face">Write it down</button></div>`;
    else if (diaryStep === "name") body = `<div class="cap">${DIARY.name.caption}</div><h3>${DIARY.name.title}</h3><p class="ask">${DIARY.name.ask}</p>
      <input data-f="name" maxlength="60" style="color:${ink}" aria-label="A name for the part" placeholder="${esc(DIARY.name.hint)}" value="${esc(pass.maskName)}">
      <div class="jn-row"><button type="button" data-save="name">Go on</button></div>`;
    else if (diaryStep === "talk") {
      const voice = diaryVoice || nextVoice(pass.thread);
      body = `<div class="cap">${DIARY.name.caption}</div><h3>${DIARY.name.title}: ${esc(pass.maskName)}</h3><p class="ask">${DIARY.talk.ask}</p>
      <div class="said">${pass.thread.map(l => `<div class="line ${l.from}" style="color:${l.from === "it" ? ink : OWN_INK};border-color:${l.from === "it" ? ink + "66" : "#d6c59d"}"><small>${l.from === "me" ? "me" : esc(pass.maskName)}</small>${esc(l.text)}</div>`).join("")}</div>
      ${pass.thread.length ? "" : `<div class="chips" aria-label="Openers, if you want one">${OPENERS.map(t => `<button type="button" data-opener="${esc(t)}">${esc(t)}</button>`).join("")}</div>`}
      <div class="jn-row" role="group" aria-label="Speaking as"><button type="button" class="${voice === "me" ? "" : "q"}" data-voice="me">me</button><button type="button" class="${voice === "it" ? "" : "q"}" data-voice="it" style="${voice === "it" ? `background:${ink};border-color:${ink}` : `color:${ink}`}">${esc(pass.maskName)}</button></div>
      <textarea rows="3" data-f="talk" style="color:${voice === "it" ? ink : OWN_INK}" aria-label="${voice === "me" ? "Say something to it" : "Answer as " + esc(pass.maskName)}" placeholder="${voice === "me" ? esc(DIARY.talk.meHint) : "Answer as " + esc(pass.maskName) + ", in its own words…"}">${esc(diaryDraft)}</textarea>
      <div class="jn-row"><button type="button" data-save="talk">Say it</button><button type="button" class="q" data-step="be">${DIARY.be.title}</button></div>`;
    } else body = `<div class="cap">${DIARY.be.caption}</div><h3>${DIARY.be.title}</h3><p class="ask">${DIARY.be.ask(pass.maskName)}</p>
      <textarea rows="5" data-f="be" style="color:${ink}" aria-label="Speak as it, in the first person" placeholder="${esc(DIARY.be.hint)}">${esc(pass.beVoice)}</textarea>
      <p class="ask">${DIARY.be.shift}</p>
      <textarea rows="3" data-f="shift" style="color:${OWN_INK}" aria-label="What shifted" placeholder="${esc(DIARY.be.shiftHint)}">${esc(pass.beShift)}</textarea>
      <div class="jn-row"><button type="button" data-save="be">Write it down</button><button type="button" class="q" data-done="1">Close the page</button></div>`;
    const keep = agreed() || local ? "" : `<p class="jn-note">These pages stay in this tab for now. They are not stored anywhere yet.</p>`;
    return `<div class="jn-book" role="dialog" aria-label="Your diary"><div class="jn-top"><div class="nav">${nav}</div><button type="button" class="q" data-shut="1">Shut the diary</button></div><div class="jn-page">${body}${keep}</div></div>`;
  }
  let diaryVoice = null, diaryDraft = "";

  function pracHtml() {
    const c = countsByMove(doc().moves);
    return `<div class="jn-card" role="dialog" aria-label="Your practice"><h2>Your practice</h2><p class="jn-tag">Each time you make one, a log lands on the pile. The pile stays.</p>
      <div class="jn-moves"><ul>${MOVES.map(m => `<li><span>${MOVE_NAMES[m]}</span><span class="n" aria-label="made ${c[m]} times">${c[m]}</span><div class="act"><button type="button" class="q" data-move="${m}">I made it</button><button type="button" class="q" data-move="${m}" data-life="1">I did it in my life</button></div></li>`).join("")}</ul></div>
      <div class="jn-row"><button type="button" class="q" data-shut="1">Close</button></div></div>`;
  }
  function cardHtml() {
    const o = objectOf(card); if (!o) return "";
    const f = FEEL[o.feeling] || FEEL.water;
    return `<div class="jn-card" role="dialog" aria-label="A carried object"><h2><span class="jn-dot" style="background:#${new THREE.Color(f.light).getHexString()}"></span>Something you carried: ${FEELING_NAMES[o.feeling] || o.feeling}</h2>
      <p class="jn-tag">${o.setOff ? `<i>what set it off</i>${esc(o.setOff)}` : ""}${o.body ? `<i style="margin-top:6px">where it sits in the body</i>${esc(o.body)}` : ""}</p>
      <div class="jn-row"><button type="button" data-act="diary">Open the diary</button><button type="button" data-act="hearth">Sit with it at the hearth</button><button type="button" class="q" data-act="carry">Carry it on</button></div>
      <div class="jn-row"><button type="button" class="q" data-shut="1">Put it back</button></div></div>`;
  }

  let sig = "";
  function draw() {
    const html = diaryOpen ? diaryHtml() : card ? cardHtml() : sheetOpen ? pracHtml() : "";
    const s = html; if (s === sig) return; sig = s;
    root.innerHTML = html;
    const q = (sel, fn) => root.querySelectorAll(sel).forEach(fn);
    q("[data-shut]", b => b.addEventListener("click", closeAll));
    q("[data-act]", b => b.addEventListener("click", () => act(b.dataset.act, card)));
    q("[data-move]", b => b.addEventListener("click", async () => { await write({ moves: withMove(doc(), b.dataset.move, b.dataset.life === "1") }); sig = ""; draw(); }));
    q("[data-step]", b => b.addEventListener("click", () => { diaryStep = b.dataset.step; sig = ""; draw(); }));
    q("[data-voice]", b => b.addEventListener("click", () => { const t = root.querySelector("[data-f=talk]"); diaryDraft = t ? t.value : ""; diaryVoice = b.dataset.voice; sig = ""; draw(); }));
    q("[data-opener]", b => b.addEventListener("click", () => { diaryDraft = b.dataset.opener; diaryVoice = "me"; sig = ""; draw(); }));
    q("[data-done]", b => b.addEventListener("click", () => closePage(diaryOpen)));
    q("[data-save]", b => b.addEventListener("click", async () => {
      const id = diaryOpen, v = k => { const e = root.querySelector(`[data-f=${k}]`); return e ? e.value.trim() : ""; }, kind = b.dataset.save;
      if (kind === "face") { const t = v("face"); if (!t) return; await saveField(id, p => ({ ...p, faceCharge: t })); diaryStep = "name"; }
      else if (kind === "name") { const t = v("name"); if (!t) return; await saveField(id, p => ({ ...p, maskName: t })); diaryStep = "talk"; }
      else if (kind === "talk") { const t = v("talk"); if (!t) return; const pass = pagesNow().find(p => p.id === id).pass, from = diaryVoice || nextVoice(pass.thread); await saveField(id, p => withTurn(p, t, from)); diaryDraft = ""; diaryVoice = from === "me" ? "it" : "me"; }
      else { const a = v("be"), s2 = v("shift"); await saveField(id, p => ({ ...p, beVoice: a || p.beVoice, beShift: s2 })); B.toast("Written down."); }
      sig = ""; draw();
    }));
    root.querySelectorAll("textarea,input").forEach(e => e.addEventListener("keydown", ev => ev.stopPropagation())); // the room's keys are not typed into the page
    q("[data-f]", e => { if (diaryOpen && e.dataset.f === "talk") e.focus(); });
  }

  function frame() {
    requestAnimationFrame(frame);
    const shell = B.room && B.room().shell;
    if (shell !== "nook") { prac.hidden = true; if (built) { shelfGroup.visible = pileGroup.visible = furnGroup.visible = deskGroup.visible = false; } return; }
    if (!on()) { prac.hidden = true; return; }
    if (!built) build();
    shelfGroup.visible = pileGroup.visible = furnGroup.visible = deskGroup.visible = true;
    prac.hidden = !!(diaryOpen || card) || (B.minuteOn && B.minuteOn());
    layShelf(); layPile(); layFurnishings(); layDiary(); draw();
  }

  (async function start() {
    while (!B.room || !["nook", "hollow"].includes(B.room().shell)) await new Promise(r => setTimeout(r, 250));
    if (demo) { // a stand-in program, three objects and seven logs, on this page only
      const o = opts.open, day = n => dayOf(new Date(Date.now() - n * 864e5)), mv = (m, n, life) => ({ move: m, on: day(n), at: new Date(Date.now() - n * 864e5).toISOString(), ...(life ? { life: true } : {}) });
      const seven = [mv("hearth", 6), mv("window", 5), mv("diary", 5), mv("hearth", 3), mv("floorboards", 3, true), mv("window", 1), mv("chair", 0)];
      const many = Array.from({ length: 30 }, (_, i) => mv(["hearth", "window", "diary", "workbench", "doorway", "floorboards", "chair"][i % 7], 29 - i));
      local = { program: { id: "demo", coachId: "demo-coach", startsOn: day(6), endsOn: day(-77), agreedOn: day(6), closedAt: null },
        pack: [{ id: "o-fire", feeling: "fire", setOff: "A promise that was not kept", body: "hot in my jaw", pickedOn: day(2), state: "carried" },
          { id: "o-metal", feeling: "metal", setOff: "A door I did not knock on", body: "cold in my stomach", pickedOn: day(2), state: "carried" },
          { id: "o-water", feeling: "water", setOff: "A song on the radio", body: "heavy behind my eyes", pickedOn: day(1), state: "carried" },
          ...(o === "furn" ? [{ id: "w1", feeling: "wood", pickedOn: day(5), state: "worked", furnishing: "plant" }, { id: "w2", feeling: "metal", pickedOn: day(5), state: "worked", furnishing: "tool" }, { id: "w3", feeling: "water", pickedOn: day(4), state: "worked", furnishing: "lamp" }, { id: "w4", feeling: "fire", pickedOn: day(4), state: "worked", furnishing: "lamp" }] : [])],
        pages: [], moves: o === "none" ? [] : o === "pile30" ? many : seven, places: [], learned: [] };
      if (o === "diary") {
        const pass = { subject: null, faceCharge: "They’re the kind of person who stands at the edge of a room and watches the door.", maskName: "The Lookout", beVoice: "", beShift: "", ownIt: { quality: "", move: "" },
          thread: [{ from: "me", text: "What do you want from me?" }, { from: "it", text: "To be told it is safe to sit down." }, { from: "me", text: "What would you have then?" }] };
        local.pages = [{ id: "pg-demo", objectId: "o-water", pass, startedOn: day(0), doneOn: null }];
        diaryOpen = "pg-demo"; diaryStep = "talk";
      }
    }
    requestAnimationFrame(frame);
  })().catch(e => console.warn("journey nook:", e));

  return {
    openCard, closeAll, act,
    view: () => ({ on: on(), logs: logsOf(doc().moves), counts: countsByMove(doc().moves), shelf: shelfShown(doc().pack).map(o => o.id), furnishings: furnishings(doc().pack).map(o => o.furnishing), diary: diaryOpen, step: diaryStep, card, sheet: sheetOpen, agreed: agreed() }),
  };
}

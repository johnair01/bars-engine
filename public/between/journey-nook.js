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
import { WAVE_STEPS } from "../calrunia/spirit-care.js";
import { DIARY, OPENERS, MOVES, MOVE_NAMES, FEELING_NAMES, countsByMove, logsOf, enrolled, shelfShown, furnishings, pileSlots, pageFor, newPage, diaryAt, nextVoice, withTurn, finishPage, withMove, dayOf, markSent } from "./journey.js";

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
const KQ = () => new URLSearchParams(location.search);
const FURNISH_WORDS = { lamp: "a lamp", plant: "a plant", tool: "a tool" };

export function mount(B, opts = {}) {
  const demo = !!opts.open;
  let local = null; // a preview's doc (this page only)
  let mem = []; // pages held in this tab while the storage rule is not agreed
  let root = null, built = false, shelfGroup = null, pileGroup = null, furnGroup = null, deskGroup = null, pileN = -1, shelfSig = "", furnSig = "";
  let card = null, diaryOpen = null, diaryStep = null;
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

  /* ---------- the hand, the tag and the diary: paper over the room (his note on hj-build-look-1, 2026-11-07) ----------
     Practice is a hand of seven cards fanned at the foot of the screen (mechanics card-turn and deck-draw), never a list: a
     tap lifts a card and turns it, its back walks the practice one step at a time and ends with "Lay a log". A carried
     object opens as its bundle's paper tag. The diary is one ruled page in a leather binding, his "beneficent Tom Riddle's
     Diary": its questions in its own hand, the player's lines in theirs, the object's in its feeling's ink. */
  if (!document.querySelector("link[data-jn-fonts]")) {
    const fl = document.createElement("link"); fl.rel = "stylesheet"; fl.dataset.jnFonts = "1";
    fl.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=Caveat:wght@400;600&display=swap";
    document.head.appendChild(fl);
  }
  const HAND = "'Caveat', 'Segoe Print', cursive", BOOK = "'Cormorant Garamond', Georgia, serif";
  const css = document.createElement("style");
  css.textContent = `.jn{position:fixed;inset:0;z-index:36;display:flex;justify-content:center;align-items:flex-end;pointer-events:none}
  .jn>*{pointer-events:auto}
  .jn ::selection{background:#e6cf9a}
  .jn button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .jn button:focus-visible,.jh button:focus-visible{outline:2px solid #e8b04a;outline-offset:3px;border-radius:4px}
  .jn .wr{font:italic 500 1.12rem/1.3 ${BOOK};color:#5a3a26;min-height:44px;display:inline-flex;align-items:center;gap:.45em;text-decoration:underline;text-decoration-color:#c9ae7c;text-underline-offset:5px;text-decoration-thickness:1px}
  .jn .wr:hover{text-decoration-color:#5a3a26}
  .jn .wr.big{font-weight:600;font-size:1.28rem;font-style:normal;text-decoration:none}
  .jn .wr:disabled{opacity:.45;cursor:default}
  /* the hand */
  .jh{position:fixed;left:50%;bottom:calc(60px + env(safe-area-inset-bottom,0px));z-index:34;width:0;height:0;pointer-events:none}
  .jh .c{background:none;border:0;padding:0;font:inherit;color:inherit;border-radius:0;position:absolute;left:calc(var(--w) / -2);bottom:calc(var(--h) * -.1);width:var(--w);height:var(--h);pointer-events:auto;
    transform-origin:50% 160%;transform:translateX(var(--x)) rotate(var(--r));transition:transform .28s cubic-bezier(.2,.8,.2,1),filter .28s;
    filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}
  .jh .c:hover,.jh .c:focus-visible{transform:translateX(var(--x)) rotate(var(--r)) translateY(calc(var(--h) * -.3));z-index:2}
  .jh{--w:96px;--h:136px;--gap:74px}
  @media (max-width:520px){.jh{--w:68px;--h:104px;--gap:53px}}
  .jcard{box-sizing:border-box;width:100%;height:100%;border-radius:9px;background:#f2e4c4 radial-gradient(120% 90% at 30% 10%,#f8eed6 0,#efdcb6 60%,#e2c999 100%);
    border:1px solid #b9995f;box-shadow:inset 0 0 0 3px #f6ead0,inset 0 0 0 4px #c8aa70;padding:5px;display:flex;flex-direction:column;gap:3px;color:#3a2616;text-align:center;overflow:hidden}
  .jcard svg.pic{width:100%;flex:1 1 auto;min-height:0;border-radius:5px;display:block}
  .jcard .nm{font:600 .86rem/1.02 ${BOOK};letter-spacing:.005em}
  .jcard .at{font:italic 500 .72rem/1 ${BOOK};color:#6a4a2c}
  .jcard .notch{display:flex;flex-wrap:wrap;justify-content:center;gap:1px 0;min-height:9px;max-height:19px;overflow:hidden}
  .jcard .notch i{display:block;width:5px;height:9px;margin-right:1px;background:linear-gradient(90deg,#8a5a30 0 45%,#c9935a 45% 100%);clip-path:polygon(0 12%,100% 0,100% 100%,0 88%);border-radius:1px}
  .jcard .notch i:nth-child(5n){margin-right:4px}
  @media (max-width:520px){.jh .jcard .nm{font-size:.62rem;line-height:1}.jh .jcard .at{font-size:.52rem}.jh .jcard{padding:3px}.jh .jcard .at{display:none}}
  /* the lifted card */
  .jl{perspective:1400px;margin-bottom:calc(18px + env(safe-area-inset-bottom,0px));width:min(92vw,340px);height:min(78vh,480px)}
  .jl .in{position:relative;width:100%;height:100%;transform-style:preserve-3d;animation:jturn .35s ease-in-out both}
  @keyframes jturn{from{transform:translateY(40px) rotateY(180deg)}to{transform:none}}
  .jl .face{position:absolute;inset:0;backface-visibility:hidden;filter:drop-shadow(0 16px 30px rgba(0,0,0,.55))}
  .jl .face.front{transform:rotateY(180deg)}
  .jl .jcard{padding:16px 18px 12px;gap:8px;text-align:left}
  .jl .head{display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center}
  .jl .head svg{width:64px;height:64px;border-radius:6px}
  .jl .head .nm{font-size:1.45rem;line-height:1.05}.jl .head .at{font-size:1rem;margin-top:3px}
  .jl .step{flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:4px 2px}
  .jl .step h4{font:600 1.05rem ${BOOK};margin:0;color:#6a4a2c}
  .jl .step p{font:500 1.3rem/1.38 ${BOOK};margin:0;color:#2e1d10;animation:jsoak .5s ease-out both}
  .jl .step p.small{font-size:1.08rem;font-style:italic;color:#5a3a26}
  .jl .dots{display:flex;gap:6px;justify-content:center}.jl .dots i{width:6px;height:6px;border-radius:50%;background:#d2b88a}.jl .dots i.on{background:#6a4a2c}
  .jl .foot{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;border-top:1px solid #d3b98a;padding-top:4px}
  .jl .log{display:inline-block;width:34px;height:16px;border-radius:8px/8px;background:linear-gradient(#a8743e,#6c4524);box-shadow:inset -6px 0 0 #d9a868,inset -7px 0 0 #8a5a30}
  .jl .objs{display:grid;gap:2px}
  .jfly{position:fixed;z-index:40;width:40px;height:18px;border-radius:9px;background:linear-gradient(#a8743e,#6c4524);box-shadow:inset -7px 0 0 #d9a868,0 4px 10px rgba(0,0,0,.4);pointer-events:none}
  @keyframes jsoak{from{opacity:0;filter:blur(2.5px)}to{opacity:1;filter:none}}
  /* the bundle's paper tag */
  .jt{position:relative;width:min(92vw,380px);margin-bottom:calc(18px + env(safe-area-inset-bottom,0px));filter:drop-shadow(0 14px 26px rgba(0,0,0,.55));animation:jswing .5s cubic-bezier(.2,.9,.3,1.2) both;transform-origin:8% 50%}
  @keyframes jswing{from{transform:translateY(30px) rotate(-6deg);opacity:0}to{transform:none;opacity:1}}
  .jt .tgp{background:#eedfbd radial-gradient(130% 120% at 70% 20%,#f6ead0 0,#ead8b0 55%,#dcc493 100%);clip-path:polygon(0 18%,11% 0,100% 0,100% 100%,11% 100%,0 82%);padding:18px 22px 16px 64px;color:#2e1d10;min-height:220px;display:grid;gap:6px}
  .jt .hole{position:absolute;left:22px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#3a2a1e;box-shadow:inset 0 0 0 3px #c9ad78,inset 0 2px 3px #000}
  .jt .cord{position:absolute;left:-40px;top:calc(50% - 2px);width:72px;height:4px;border-radius:2px;background:repeating-linear-gradient(60deg,#d9c49a 0 3px,#b39a6c 3px 6px);transform:rotate(-8deg);transform-origin:right center}
  .jt .seal{position:absolute;right:16px;bottom:14px;width:54px;height:54px;border-radius:47% 53% 50% 50%/52% 48% 52% 48%;box-shadow:inset 0 0 0 5px rgba(0,0,0,.12),inset 0 0 0 9px rgba(255,255,255,.12),inset -4px -6px 10px rgba(0,0,0,.3),0 2px 3px rgba(0,0,0,.35)}
  .jt h2{font:600 2rem/1 ${HAND};margin:0 64px 4px 0}
  .jt .lb{font:italic 500 .98rem/1.1 ${BOOK};color:#6a4a2c;margin:4px 0 0}
  .jt .hand{font:400 1.45rem/1.15 ${HAND};margin:0}
  .jt .acts{display:grid;justify-items:start;margin-top:8px}
  /* the diary */
  .jd{position:relative;width:min(96vw,560px);height:min(74vh,620px);margin-bottom:calc(10px + env(safe-area-inset-bottom,0px));border-radius:10px 14px 14px 10px;padding:12px 14px 12px 18px;box-sizing:border-box;
    background:#4a2e1e radial-gradient(140% 100% at 20% 0,#6b4630 0,#4a2e1e 55%,#331f14 100%);box-shadow:0 18px 60px rgba(0,0,0,.65),inset 0 0 0 2px #2a180e,inset 0 0 0 5px #5d3b26,inset 0 0 0 6px #2a180e;animation:jopen .4s ease-out both}
  @keyframes jopen{from{transform:translateY(24px) scale(.97);opacity:0}to{transform:none;opacity:1}}
  .jd .pg{position:relative;height:100%;border-radius:3px 6px 6px 3px;background-color:#f3e7cb;
    background-image:linear-gradient(90deg,rgba(90,58,38,.18),transparent 22px),linear-gradient(90deg,transparent 46px,#d9a9a0 46px,#d9a9a0 47px,transparent 47px),repeating-linear-gradient(#0000 0 31px,#c9d3dd 31px 32px),radial-gradient(120% 80% at 60% 30%,#f8eed8,#ecdcb9);
    background-attachment:local;box-shadow:inset 0 0 18px rgba(120,80,40,.25);overflow:auto;padding:30px 22px 64px 58px;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#c4a874 transparent;line-height:32px}
  .jd .rib{position:absolute;top:-2px;right:34px;display:flex;gap:6px;z-index:2}
  .jd .rib button{width:26px;height:58px;color:#f6ead0;font:600 1.05rem ${BOOK};display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px;box-sizing:border-box;clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);transition:height .25s ease-out;box-shadow:none}
  .jd .rib button[aria-current=true]{height:84px}
  .jd .rib button:disabled{opacity:.5;cursor:default}
  .jd .ask{font:italic 500 1.26rem/32px ${BOOK};color:#5a3a26;margin:0 76px 0 0}
  .jd h3{font:600 1.5rem/32px ${BOOK};color:#3a2616;margin:0 76px 0 0}
  .jd .ln{font:400 1.55rem/32px ${HAND};margin:0;white-space:pre-wrap;word-break:break-word}
  .jd .ln.soak{animation:jsoak .7s ease-out both}
  .jd .who{font:italic 500 .95rem/32px ${BOOK};color:#8a6a4a;margin-right:.4em}
  .jd textarea,.jd input{display:block;width:100%;box-sizing:border-box;border:0;outline:0;background:transparent;resize:none;padding:0;margin:0;font:400 1.55rem/32px ${HAND};caret-color:#5a3a26}
  .jd textarea::placeholder,.jd input::placeholder{color:#a08a6c;font-style:normal;opacity:1}
  .jd .tools{display:flex;flex-wrap:wrap;gap:0 18px;align-items:center}
  .jd .pencil{font:italic 400 1.02rem/32px ${BOOK};color:#8a7458;text-align:left}
  .jd .pencil:hover{color:#5a3a26}
  .jd .shut{position:absolute;left:58px;right:22px;bottom:0;padding:6px 0 8px;display:flex;justify-content:space-between;background:linear-gradient(#f3e7cb00,#f3e7cb 40%)}
  .jd .note{font:italic 500 .95rem/1.3 ${BOOK};color:#7a5a3a;margin:8px 0 0}
  @media (prefers-reduced-motion:reduce){.jl .in,.jt,.jd,.jd .ln.soak,.jl .step p{animation:none}.jh .c{transition:none}}`;
  document.head.appendChild(css);
  root = document.createElement("div"); root.className = "jn"; document.body.appendChild(root);
  const hand = document.createElement("div"); hand.className = "jh"; hand.setAttribute("role", "group"); hand.setAttribute("aria-label", "Your practice cards"); hand.hidden = true;
  document.body.appendChild(hand);

  /* Each practice is an act at its piece of furniture (pass healing-journey-4). The window's steps are the Hollow's WAVE,
     word for word (spirit-care.js). Steps marked `fresh` are new words and are flagged on the look for his eye. */
  const PRACTICE = {
    floorboards: { name: "Safe in this minute", at: "on the floorboards", fresh: true, steps: [
      "Stand on the floorboards. Feel them take your weight.",
      "Look slowly round the room, one thing at a time.",
      "Ask your body: is anything hurting me, right now, in this minute?",
      "If nothing is, say it to the part of you that keeps watch: in this minute, I am safe."] },
    window: { name: "WAVE", at: "at the window", steps: ["Open the window on a breath.", ...WAVE_STEPS.map(s => s.name + ". " + s.line)] },
    chair: { name: "The Interview", at: "in the visitor's chair", fresh: true, steps: [
      "Ask a voice you have met to come and sit in the visitor's chair.",
      "Ask it: who are you?",
      "Ask it: what is your job for me?",
      "Ask it: how do you do it, and what would help you do it well?",
      "Thank it for coming."] },
    workbench: { name: "Leave one task undone", at: "at the workbench", fresh: true, steps: [
      "Look at what today asks of you.",
      "Choose one thing that can wait.",
      "Set it down on the workbench and leave it there.",
      "Notice the voice that wants it done. Let it speak, and leave the task where it is."] },
    doorway: { name: "Give it back", at: "in the doorway", fresh: true, steps: [
      "Stand in the doorway.",
      "Name one thing you have been carrying that was someone else's.",
      "Give it back: this is yours, and I give it back to you.",
      "Call back one thing that was yours: this is mine, and I call it back."] },
    hearth: { name: "Rest", at: "at the hearth", fresh: true, steps: [
      "Sit down by the fire.",
      "There is nothing to fix here. Let what you carry sit beside you.",
      "Stay until you are ready to stand."] },
    diary: { name: "The 3-2-1", at: "in the diary", steps: [] },
  };
  /* small painted pictures of the furniture, one shared brush filter */
  const PICS = {
    floorboards: `<rect width="100" height="100" fill="#3c2a1c"/><path d="M0 46 L100 46 L100 100 L0 100Z" fill="#6e4a2c"/>${[0,1,2,3,4,5].map(i => `<path d="M${50 + (i - 2.5) * 6} 46 L${50 + (i - 2.5) * 34} 100" stroke="#3e2816" stroke-width="2"/>`).join("")}<path d="M0 64 L100 64 M0 82 L100 82" stroke="#5a3a22" stroke-width="1.5"/><ellipse cx="50" cy="74" rx="22" ry="7" fill="#f0c070" opacity=".45"/><path d="M20 46 L20 8 M80 46 L80 8" stroke="#2a1c12" stroke-width="5"/>`,
    window: `<rect width="100" height="100" fill="#3a2a20"/><rect x="18" y="10" width="64" height="72" fill="#9cc4e4"/><rect x="18" y="52" width="64" height="30" fill="#6f9a74"/><circle cx="64" cy="30" r="8" fill="#f6e2a0"/><path d="M50 10 V82 M18 46 H82" stroke="#5a3a22" stroke-width="5"/><rect x="18" y="10" width="64" height="72" fill="none" stroke="#6a4628" stroke-width="6"/><path d="M14 8 C26 30 22 60 12 88 L4 88 L6 8Z" fill="#a8443a"/><rect x="10" y="82" width="80" height="8" fill="#7a5232"/>`,
    chair: `<rect width="100" height="100" fill="#3a2a22"/><ellipse cx="50" cy="92" rx="36" ry="6" fill="#20160f"/><path d="M30 18 Q50 10 70 18 L68 56 L32 56Z" fill="#7a4e2c"/><rect x="28" y="54" width="44" height="10" rx="3" fill="#8a5a32"/><path d="M33 64 L30 92 M67 64 L70 92 M34 56 L34 64 M66 56 L66 64" stroke="#5a3820" stroke-width="5"/><rect x="32" y="48" width="36" height="9" rx="4" fill="#b8574a"/><path d="M38 22 L38 52 M50 18 L50 52 M62 22 L62 52" stroke="#5e3c22" stroke-width="3"/>`,
    workbench: `<rect width="100" height="100" fill="#352820"/><rect x="8" y="46" width="84" height="12" fill="#9a6a3a"/><path d="M14 58 V94 M86 58 V94 M14 80 H86" stroke="#6a4628" stroke-width="6"/><rect x="58" y="34" width="22" height="12" rx="2" fill="#e8d6b0"/><path d="M61 38 H76 M61 42 H72" stroke="#8a7458" stroke-width="1.5"/><path d="M20 44 L44 32" stroke="#6a4628" stroke-width="4"/><rect x="40" y="26" width="12" height="9" transform="rotate(-25 46 30)" fill="#8a8e96"/><path d="M8 20 H92" stroke="#4a3426" stroke-width="3"/>`,
    doorway: `<rect width="100" height="100" fill="#2e2219"/><path d="M26 96 V36 Q50 8 74 36 V96Z" fill="#f4d99a"/><path d="M26 96 V36 Q50 8 74 36 V96" fill="none" stroke="#7a5232" stroke-width="7"/><path d="M50 96 L60 92 L60 30 Q55 24 50 22Z" fill="#6a4628"/><path d="M30 96 L18 100 L82 100 L70 96Z" fill="#f4d99a" opacity=".5"/><circle cx="57" cy="62" r="2" fill="#d8b060"/>`,
    hearth: `<rect width="100" height="100" fill="#2e221c"/><path d="M10 96 V30 H90 V96 H70 V54 Q50 38 30 54 V96Z" fill="#7e7468"/><path d="M10 30 H90 V40 H10Z" fill="#5c4a3a"/>${[0,1,2,3].map(i => `<path d="M10 ${50 + i * 12} H30 M70 ${50 + i * 12} H90" stroke="#5e554c" stroke-width="1.5"/>`).join("")}<path d="M34 92 Q38 70 46 78 Q48 56 54 70 Q60 60 62 76 Q68 72 66 92Z" fill="#e8783a"/><path d="M42 92 Q46 78 50 84 Q54 74 58 92Z" fill="#f6c45a"/><rect x="32" y="90" width="36" height="5" fill="#4a2e1c"/>`,
    diary: `<rect width="100" height="100" fill="#352820"/><path d="M8 30 L50 36 L92 30 L92 82 L50 88 L8 82Z" fill="#4a2e1e"/><path d="M12 30 L50 36 L50 84 L12 78Z" fill="#f2e6cc"/><path d="M88 30 L50 36 L50 84 L88 78Z" fill="#ead9b6"/>${[0,1,2,3].map(i => `<path d="M18 ${44 + i * 9} Q30 ${42 + i * 9} 44 ${45 + i * 9}" stroke="#2f6a2a" stroke-width="1.6" fill="none"/><path d="M56 ${45 + i * 9} Q68 ${43 + i * 9} 82 ${44 + i * 9}" stroke="#2a1a12" stroke-width="1.6" fill="none"/>`).join("")}<path d="M66 30 V96 L70 90 L74 96 V31" fill="#a8443a"/>`,
  };
  const brush = `<defs><filter id="jbr" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter></defs>`;
  const pic = (m, cls = "pic") => `<svg class="${cls}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${brush}<g filter="url(#jbr)">${PICS[m]}</g></svg>`;
  const notches = n => `<span class="notch" aria-label="${n ? "made " + n + (n === 1 ? " time" : " times") : "not made yet"}">${"<i></i>".repeat(Math.min(n, 30))}</span>`;
  const RIB = { "3": "#8a2e24", "2": "#2c5f6e", "1": "#6a5a1e" };

  const objectOf = id => (doc().pack || []).find(o => o.id === id);
  const inkOf = o => (FEEL[o && o.feeling] || FEEL.water).ink;
  let lifted = null, liftStep = 0, soakAt = -1;
  function openCard(id) { if (diaryOpen) return; lifted = null; card = id; draw(); }
  function closeAll() { card = null; lifted = null; closeDiary(); draw(); }
  function closeDiary() { diaryOpen = null; diaryStep = null; layDiary(); }
  function lift(m) { card = null; if (diaryOpen) closeDiary(); lifted = m; liftStep = 0; sig = ""; draw(); }

  /* the three acts (FR-003) */
  async function act(kind, id) {
    const o = objectOf(id); if (!o) return;
    if (kind === "diary") {
      let pg = pageFor(docNow(), id);
      if (!pg) { pg = newPage(id); await write({ pages: [...pagesNow(), pg] }); }
      card = null; lifted = null; diaryOpen = pg.id; diaryStep = diaryAt(pg.pass);
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

  /* "Lay a log": the log leaves the card and lands on the pile by the hearth, then the move is written */
  function pileOnScreen() {
    const a = hearthAxes(), p = a.h.clone().addScaledVector(a.x, -0.98).setY(0.25).project(B.camera);
    const x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight, on = p.z < 1 && x > 0 && x < innerWidth && y > 0 && y < innerHeight;
    return on ? { x, y } : { x: innerWidth * 0.18, y: innerHeight * 0.55 };
  }
  async function layLog(move, life) {
    const from = root.querySelector("[data-lay]") || root.querySelector("[data-life]");
    const r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 120, width: 0, height: 0 }, to = pileOnScreen();
    const fly = document.createElement("div"); fly.className = "jfly"; document.body.appendChild(fly);
    const x0 = r.left + r.width / 2 - 20, y0 = r.top + r.height / 2 - 9, mx = (x0 + to.x) / 2, my = Math.min(y0, to.y) - 140;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    lifted = null; sig = ""; draw();
    const anim = still ? null : fly.animate([{ transform: `translate(${x0}px,${y0}px) rotate(0)` }, { transform: `translate(${mx}px,${my}px) rotate(200deg)`, offset: 0.5 }, { transform: `translate(${to.x - 20}px,${to.y - 9}px) rotate(350deg) scale(.6)`, opacity: 0.9 }], { duration: 750, easing: "cubic-bezier(.3,.1,.3,1)" });
    await write({ moves: withMove(doc(), move, !!life) });
    if (anim) await anim.finished.catch(() => {}); fly.remove();
    B.toast(life ? "Done out in your life. A log for the pile." : "A log for the pile.");
  }

  async function saveField(pageId, mut) { // every line is saved as it is written (FR-005)
    const pages = pagesNow().map(p => { if (p.id !== pageId) return p; const { sentAt, ...rest } = p; return { ...rest, pass: mut(p.pass) }; }); // a page written on again is no longer sent
    await write({ pages });
  }
  const SEND_WORDS = "Sending a page lets your coach read it, and means you agree they may act on what it says. Pages you do not send stay yours. Your coach deletes their copy when the program ends or if you stop meeting.";
  async function sendPage(pageId, sent) {
    const p = doc().program || {};
    if (sent && !p.sendAgreedOn) await write({ program: { ...p, sendAgreedOn: dayOf(new Date()) } });
    await write({ pages: markSent(docNow(), pageId, new Date().toISOString(), sent).pages });
    sig = ""; draw();
    B.toast(sent ? "Sent to your coach." : "Kept to yourself again.");
  }
  async function closePage(pageId) {
    const next = finishPage(docNow(), pageId);
    await write({ pages: next.pages, pack: next.pack, moves: next.moves });
    const o = objectOf((next.pages.find(p => p.id === pageId) || {}).objectId);
    closeDiary(); draw();
    B.toast("It has a place in the room now" + (o && o.furnishing ? ": " + FURNISH_WORDS[o.furnishing] + "." : "."));
  }

  function handHtml() {
    const c = countsByMove(doc().moves), n = MOVES.length;
    return MOVES.map((m, i) => { const k = i - (n - 1) / 2;
      return `<button type="button" class="c" data-lift="${m}" style="--x:calc(var(--gap) * ${k});--r:${(k * 6).toFixed(1)}deg" aria-label="${PRACTICE[m].name}, ${PRACTICE[m].at}. ${c[m] ? "Made " + c[m] + (c[m] === 1 ? " time" : " times") : "Not made yet"}">
        <span class="jcard">${pic(m)}<span class="nm">${PRACTICE[m].name}</span><span class="at">${PRACTICE[m].at}</span>${notches(c[m])}</span></button>`; }).join("");
  }
  function liftedHtml() {
    const m = lifted, P = PRACTICE[m], c = countsByMove(doc().moves)[m];
    const front = `<div class="face front"><div class="jcard">${pic(m)}<span class="nm" style="font-size:1.6rem">${P.name}</span><span class="at" style="font-size:1.05rem">${P.at}</span>${notches(c)}</div></div>`;
    let step = "", foot = "";
    if (m === "diary") {
      const shelf = shelfShown(doc().pack);
      step = `<div class="step"><p>Set something you carried on the table and open the diary. It writes back.</p>
        <div class="objs">${shelf.length ? shelf.map(o => `<button type="button" class="wr" data-diaryfor="${o.id}"><span class="jn-seal" style="width:14px;height:14px;border-radius:50%;background:#${new THREE.Color((FEEL[o.feeling] || FEEL.water).cloth).getHexString()}"></span>${esc(o.setOff || FEELING_NAMES[o.feeling] || "Something you carried")}</button>`).join("") : `<p class="small">Nothing is on the shelf yet. Bring something home from a walk.</p>`}</div></div>`;
      foot = `<button type="button" class="wr" data-shut="1">Put it back in the hand</button><span></span>`;
    } else {
      const last = liftStep >= P.steps.length - 1;
      step = `<div class="step"><div class="dots" aria-hidden="true">${P.steps.map((_, i) => `<i class="${i <= liftStep ? "on" : ""}"></i>`).join("")}</div>
        <p aria-live="polite" data-k="${liftStep}">${esc(P.steps[liftStep])}</p>
        ${last ? `<button type="button" class="wr big" data-lay="1"><span class="log" aria-hidden="true"></span>Lay a log</button>` : `<button type="button" class="wr big" data-next="1">Go on</button>`}</div>`;
      foot = `<button type="button" class="wr" data-shut="1">Put it back in the hand</button><button type="button" class="wr" data-life="1">I did this out in my life today</button>`;
    }
    const back = `<div class="face back"><div class="jcard"><div class="head">${pic(m)}<div><div class="nm">${P.name}</div><div class="at">${P.at}</div></div></div>${step}<div class="foot">${foot}</div></div></div>`;
    return `<div class="jl" role="dialog" aria-label="${P.name}"><div class="in">${front}${back}</div></div>`;
  }
  function tagHtml() {
    const o = objectOf(card); if (!o) return "";
    const f = FEEL[o.feeling] || FEEL.water, wax = "#" + new THREE.Color(f.cloth).getHexString(), hi = "#" + new THREE.Color(f.light).getHexString();
    return `<div class="jt" role="dialog" aria-label="Something you carried: ${FEELING_NAMES[o.feeling] || o.feeling}"><span class="cord" aria-hidden="true"></span><div class="tgp">
      <h2 style="color:${f.ink}">${FEELING_NAMES[o.feeling] || o.feeling}</h2>
      ${o.setOff ? `<p class="lb">what set it off</p><p class="hand">${esc(o.setOff)}</p>` : ""}
      ${o.body ? `<p class="lb">where it sits in the body</p><p class="hand">${esc(o.body)}</p>` : ""}
      <div class="acts"><button type="button" class="wr" data-act="diary">Open the diary on it</button><button type="button" class="wr" data-act="hearth">Sit with it at the hearth</button><button type="button" class="wr" data-act="carry">Carry it on</button><button type="button" class="wr" data-shut="1" style="color:#8a6a4a">Put it back on the shelf</button></div>
      </div><span class="hole" aria-hidden="true"></span><span class="seal" aria-hidden="true" style="background:radial-gradient(circle at 38% 34%,${hi},${wax} 55%,#0000 140%),${wax}"></span></div>`;
  }

  function diaryHtml() {
    const pg = pagesNow().find(p => p.id === diaryOpen); if (!pg) return "";
    const o = objectOf(pg.objectId) || {}, ink = inkOf(o), pass = pg.pass, named = !!pass.maskName.trim(), nm = esc(pass.maskName.trim() || "it");
    const ribs = [["3", "face", DIARY.face.title, true], ["2", named ? "talk" : "name", DIARY.name.title, !!pass.faceCharge.trim()], ["1", "be", DIARY.be.title, named]].map(([n, step, title, ok]) => {
      const here = n === "3" ? diaryStep === "face" : n === "2" ? diaryStep === "name" || diaryStep === "talk" : diaryStep === "be";
      return `<button type="button" data-step="${step}" aria-current="${here}" aria-label="${n}, ${title}"${ok ? "" : " disabled"} style="background:linear-gradient(90deg,${RIB[n]},${RIB[n]}dd 60%,${RIB[n]})">${n}</button>`; }).join("");
    const line = (text, who, color, i) => `<p class="ln${i === soakAt ? " soak" : ""}" style="color:${color}">${who ? `<span class="who">${who}</span>` : ""}${esc(text)}</p>`;
    let body = "";
    if (diaryStep === "face") body = `<h3>${DIARY.face.title}</h3><p class="ask">${DIARY.face.ask}</p>
      ${pass.faceCharge ? line(pass.faceCharge, "", OWN_INK, 0) : ""}
      <textarea rows="${pass.faceCharge ? 2 : 4}" data-f="face" style="color:${OWN_INK}" aria-label="Describe the charge in the third person" placeholder="${esc(DIARY.face.hint)}"></textarea>
      <div class="tools"><button type="button" class="wr" data-save="face">Set it down</button>${pass.faceCharge ? `<button type="button" class="wr" data-step="name">Turn the page</button>` : ""}</div>`;
    else if (diaryStep === "name") body = `<h3>${DIARY.name.title}</h3><p class="ask">${DIARY.name.ask}</p>
      <input data-f="name" maxlength="60" style="color:${ink}" aria-label="A name for the part" placeholder="${esc(DIARY.name.hint)}" value="${esc(pass.maskName)}">
      <div class="tools"><button type="button" class="wr" data-save="name">Set it down</button></div>`;
    else if (diaryStep === "talk") {
      const voice = diaryVoice || nextVoice(pass.thread), other = voice === "me" ? nm : "yourself";
      body = `<h3>${nm}</h3><p class="ask">${DIARY.talk.ask}</p>
      ${pass.thread.map((l, i) => line(l.text, l.from === "me" ? "" : "", l.from === "it" ? ink : OWN_INK, i)).join("")}
      <textarea rows="2" data-f="talk" style="color:${voice === "it" ? ink : OWN_INK}" aria-label="${voice === "me" ? "Say something to it" : "Answer as " + nm}" placeholder="${voice === "me" ? esc(DIARY.talk.meHint) : "Answer as " + nm + ", in its own words…"}">${esc(diaryDraft)}</textarea>
      <div class="tools"><button type="button" class="wr" data-save="talk">Set it down</button><button type="button" class="pencil" data-voice="${voice === "me" ? "it" : "me"}">write as ${other}</button><button type="button" class="pencil" data-step="be">on to ${DIARY.be.title.toLowerCase()}</button></div>
      ${pass.thread.length ? "" : `<div>${OPENERS.slice(0, 3).map(t => `<button type="button" class="pencil" style="display:block" data-opener="${esc(t)}">${esc(t)}</button>`).join("")}</div>`}`;
    } else body = `<h3>${DIARY.be.title}</h3><p class="ask">${DIARY.be.ask(pass.maskName)}</p>
      ${pass.beVoice ? line(pass.beVoice, "", ink, 0) : `<textarea rows="3" data-f="be" style="color:${ink}" aria-label="Speak as it, in the first person" placeholder="${esc(DIARY.be.hint)}"></textarea>`}
      <p class="ask">${DIARY.be.shift}</p>
      ${pass.beShift ? line(pass.beShift, "", OWN_INK, 1) : `<textarea rows="2" data-f="shift" style="color:${OWN_INK}" aria-label="What shifted" placeholder="${esc(DIARY.be.shiftHint)}"></textarea>`}
      <div class="tools">${pass.beVoice && pass.beShift ? "" : `<button type="button" class="wr" data-save="be">Set it down</button>`}<button type="button" class="wr" data-done="1">Close the page</button></div>`;
    const canSend = agreed() && !local && !(doc().program || {}).closedAt;
    const sendBlock = !canSend ? "" : pg.sentAt
      ? `<p class="note">Sent to your coach. <button type="button" class="pencil" data-send="0">keep it to myself again</button></p>`
      : `<details class="note"><summary>Send this page to my coach</summary><p>${SEND_WORDS}</p><button type="button" class="wr" data-send="1">${(doc().program || {}).sendAgreedOn ? "Send this page" : "I agree, send this page"}</button></details>`;
    const keep = agreed() || local ? "" : `<p class="note">These pages stay in this tab for now. They are not stored anywhere yet.</p>`;
    return `<div class="jd" role="dialog" aria-label="Your diary"><div class="rib">${ribs}</div><div class="pg">${body}${sendBlock}${keep}</div>
      <div class="shut" style="left:76px;right:36px;bottom:12px"><button type="button" class="pencil" data-shut="1">shut the diary</button><span></span></div></div>`;
  }
  let diaryVoice = null, diaryDraft = "";

  let sig = "";
  function draw() {
    const html = diaryOpen ? diaryHtml() : card ? tagHtml() : lifted ? liftedHtml() : "";
    if (html === sig) return; sig = html;
    root.innerHTML = html;
    const q = (sel, fn) => root.querySelectorAll(sel).forEach(fn);
    q("[data-shut]", b => b.addEventListener("click", closeAll));
    q("[data-act]", b => b.addEventListener("click", () => act(b.dataset.act, card)));
    q("[data-next]", b => b.addEventListener("click", () => { liftStep++; sig = ""; draw(); const n = root.querySelector("[data-next],[data-lay]"); if (n) n.focus(); }));
    q("[data-lay]", b => b.addEventListener("click", () => layLog(lifted, false)));
    q("[data-life]", b => b.addEventListener("click", () => layLog(lifted, true)));
    q("[data-diaryfor]", b => b.addEventListener("click", () => act("diary", b.dataset.diaryfor)));
    q("[data-step]", b => b.addEventListener("click", () => { diaryStep = b.dataset.step; soakAt = -1; sig = ""; draw(); }));
    q("[data-voice]", b => b.addEventListener("click", () => { const t = root.querySelector("[data-f=talk]"); diaryDraft = t ? t.value : ""; diaryVoice = b.dataset.voice; sig = ""; draw(); }));
    q("[data-opener]", b => b.addEventListener("click", () => { diaryDraft = b.dataset.opener; diaryVoice = "me"; sig = ""; draw(); }));
    q("[data-send]", b => b.addEventListener("click", () => sendPage(diaryOpen, b.dataset.send === "1")));
    q("[data-done]", b => b.addEventListener("click", () => closePage(diaryOpen)));
    q("[data-save]", b => b.addEventListener("click", async () => {
      const id = diaryOpen, v = k => { const e = root.querySelector(`[data-f=${k}]`); return e ? e.value.trim() : ""; }, kind = b.dataset.save;
      if (kind === "face") { const t = v("face"); if (!t) return; await saveField(id, p => ({ ...p, faceCharge: p.faceCharge ? p.faceCharge + "\n" + t : t })); soakAt = 0; }
      else if (kind === "name") { const t = v("name"); if (!t) return; await saveField(id, p => ({ ...p, maskName: t })); diaryStep = "talk"; soakAt = -1; }
      else if (kind === "talk") { const t = v("talk"); if (!t) return; const pass = pagesNow().find(p => p.id === id).pass, from = diaryVoice || nextVoice(pass.thread); await saveField(id, p => withTurn(p, t, from)); soakAt = pass.thread.length; diaryDraft = ""; diaryVoice = from === "me" ? "it" : "me"; }
      else { const a = v("be"), s2 = v("shift"); if (!a && !s2) return; await saveField(id, p => ({ ...p, beVoice: a || p.beVoice, beShift: s2 || p.beShift })); soakAt = a ? 0 : 1; }
      sig = ""; draw();
      const pgEl = root.querySelector(".pg"); if (pgEl) pgEl.scrollTop = pgEl.scrollHeight;
    }));
    root.querySelectorAll("textarea,input").forEach(e => e.addEventListener("keydown", ev => {
      ev.stopPropagation(); // the room's keys are not typed into the page
      if (ev.key === "Enter" && !ev.shiftKey && e.dataset.f !== "face" && e.dataset.f !== "be") { ev.preventDefault(); const s = root.querySelector("[data-save]"); if (s) s.click(); }
    }));
    q("[data-f]", e => { if (diaryOpen && (e.dataset.f === "talk" || e.dataset.f === "name")) e.focus({ preventScroll: true }); });
    const pgEl = root.querySelector(".pg"); if (pgEl && diaryStep === "talk") pgEl.scrollTop = pgEl.scrollHeight;
  }
  let handSig = "";
  function drawHand(show) {
    hand.hidden = !show; if (!show) return;
    const h = handHtml(); if (h === handSig) return; handSig = h; hand.innerHTML = h;
    hand.querySelectorAll("[data-lift]").forEach(b => b.addEventListener("click", () => lift(b.dataset.lift)));
  }

  function frame() {
    requestAnimationFrame(frame);
    const shell = B.room && B.room().shell;
    if (shell !== "nook") { drawHand(false); if (built) { shelfGroup.visible = pileGroup.visible = furnGroup.visible = deskGroup.visible = false; } return; }
    if (!on()) { drawHand(false); return; }
    if (!built) build();
    shelfGroup.visible = pileGroup.visible = furnGroup.visible = deskGroup.visible = true;
    drawHand(!(diaryOpen || card || lifted) && !(B.minuteOn && B.minuteOn()));
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
      if (o === "tag") card = "o-water";
      if (o && o.startsWith("card-")) { lifted = o.slice(5); liftStep = +(KQ().get("step") || 0); }
    }
    requestAnimationFrame(frame);
  })().catch(e => console.warn("journey nook:", e));

  return {
    openCard, closeAll, act, lift,
    view: () => ({ on: on(), logs: logsOf(doc().moves), counts: countsByMove(doc().moves), shelf: shelfShown(doc().pack).map(o => o.id), furnishings: furnishings(doc().pack).map(o => o.furnishing), diary: diaryOpen, step: diaryStep, card, lifted, liftStep, agreed: agreed() }),
  };
}

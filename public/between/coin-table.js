/* The coin table: the I Ching in the nook and the hollow, and the game that turns a card from his hand into a workorder
   (Six-faces-council pass bar-intake-1, brief "BAR intake, build 1"; mechanic coin-table, proposed; art direction
   fb-look-01, his yes 2026-10-27: "the book on the shelf, coins on a low table by the hearth").

   The book stands on the shelf (in the hollow, on a reading stand by the table): touch it and it gives a reading at once.
   Three coins lie on a low table by the hearth, a cushion before it. Sit and toss six times: each toss lays one line from
   the bottom up, by the council's three-coin method (./iching/cast.js, the port of council/iching/cast.py), and the
   hexagram and what it becomes are named. Lay a card from your hand on the table first and each line lights its game
   master, bottom up by altitude, who offers that line of the workorder with the council's answer marked; one tap keeps
   it. At the sixth line the card seals: the same write as Hand it to Claude, with the workorder beside it, through
   /api/board/saves as him, and a lantern carries it out the doorway.

   The coins never decide the work (bi-coins-inform): they set the reading and mark the lines still moving.
   Previews (any host but bars-engine.vercel.app) write nothing: ?nook=1&coins=bar lays the first BAR on the table and sits
   you at it; ?coins=cast opens at the sixth toss with the council's lines kept, ready to seal. */
import * as THREE from "three";
import { castFromTosses, loadTable, lineOf, tossThree } from "./iching/cast.js";
import { FACES, offers, workorder, sealSave, hand } from "./iching/workorder.js";

const TY = 0.32, TR = 0.34, SEAT_D = 0.62, PUSH_R = 0.5, NEAR_R = 1.25, BOOK_NEAR = 0.95;
const SAMPLE = { id: "ttv-cmvvan71s001412hdijdu74gg", do: "Put an I Ching into the Between space and the Nook", ttvDate: "2026-10-30" };
const BAR_TOSSES = [[2, 3, 3], [3, 3, 2], [2, 2, 3], [2, 3, 3], [3, 2, 2], [3, 3, 2]]; // hexagram 39, as the first workorder cast it
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function mount(B, opts = {}) {
  const preview = !!opts.preview;
  let table = null, place = null, builtFor = null, group = null;
  let tosses = [], kept = [], card = null, sealed = null, cast = null, myHand = null, handErr = "";
  let near = null, cardKey = "", flying = null, tossAnim = null;
  const coins = [], marks = [], embers = [];
  let cardMesh = null;

  /* ---------- where it stands: by the hearth, off the line the hearth's cushion sits on, toward the window (nook) or the shelf (hollow) ---------- */
  function placeFor(shell) {
    const h = B.anchors().hearth, hx = h[0], hz = h[2];
    const r = Math.hypot(hx, hz) || 1, dir = V(-hx / r, 0, -hz / r);           // from the hearth toward the room's middle
    const perp = shell === "nook" ? V(-dir.z, 0, dir.x) : V(-dir.z, 0, dir.x);   // nook: the window side; hollow: the shelf side
    if (shell === "nook" && perp.z > 0) perp.negate();                          // the nook's window is toward -z
    if (shell !== "nook" && perp.x < 0) perp.negate();                          // the hollow's shelf is toward +x
    const T = V(hx, 0, hz).addScaledVector(dir, shell === "nook" ? 1.35 : 1.3).addScaledVector(perp, shell === "nook" ? 0.75 : 0.85);
    const seat = T.clone().addScaledVector(dir, SEAT_D);
    const seatYaw = Math.atan2(T.x - seat.x, T.z - seat.z);
    let book, bookYaw, bookStand = null;
    if (shell === "nook") { // on the shelf, propped toward the room, as the still has it (fb-look-01, nook-book-coins)
      const sh = V(...B.anchors().shelf), sy = 0.3, sr = V(Math.cos(sy), 0, -Math.sin(sy));
      book = sh.clone().addScaledVector(sr, -0.12).add(V(0, 0.05, 0.03)); bookYaw = sy;
      bookStand = sh.clone().setY(0).add(V(Math.sin(sy), 0, Math.cos(sy)).multiplyScalar(0.75));
    } else {                // the hollow's shelf unit is full of pots: a reading stand beside the table
      const at = T.clone().addScaledVector(perp, 0.75).addScaledVector(dir, 0.1); bookYaw = Math.atan2(-at.x, -at.z);
      book = at.clone().setY(1.0); bookStand = at.clone().add(V(Math.sin(bookYaw), 0, Math.cos(bookYaw)).multiplyScalar(0.7));
    }
    return { shell, T, dir, perp, seat, seatYaw, book, bookYaw, bookStand };
  }

  /* ---------- the things: a low table, three bronze coins, a cushion, the book, six embers for the six game masters ---------- */
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
  function cardTexture(c) {
    const cv = document.createElement("canvas"); cv.width = 416; cv.height = 592; const x = cv.getContext("2d");
    x.fillStyle = "#efe4cc"; x.fillRect(0, 0, 416, 592); x.strokeStyle = "#b48a46"; x.lineWidth = 6; x.strokeRect(12, 12, 392, 568);
    x.fillStyle = "#5b3a24"; x.font = "italic 26px Marcellus, serif"; x.fillText("from Tap the Vein", 40, 70);
    x.font = "bold 34px Marcellus, serif"; let y = 150, ln = "";
    for (const w of String(c.do || "").split(/\s+/)) { if (x.measureText(ln + " " + w).width > 330 && ln) { x.fillText(ln, 40, y); y += 46; ln = w; if (y > 520) break; } else ln = ln ? ln + " " + w : w; }
    if (y <= 520) x.fillText(ln, 40, y);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function build(shell) {
    if (group) B.scene.remove(group);
    place = placeFor(shell); builtFor = shell;
    group = new THREE.Group(); B.scene.add(group);
    const { T } = place;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR + 0.03, 0.06, 28), wood); top.position.copy(T).setY(TY - 0.03); group.add(top);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.4, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, TY - 0.06, 6), darkWood); leg.position.set(T.x + Math.cos(a) * TR * 0.65, (TY - 0.06) / 2, T.z + Math.sin(a) * TR * 0.65); group.add(leg); }
    table = top;
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a3a70, roughness: 0.95 }));
    cushion.position.copy(place.seat).setY(0.1); cushion.rotation.y = place.seatYaw; group.add(cushion);
    coins.length = 0;
    [[-0.1, 0.05, 0.4], [0.06, 0.12, 1.1], [0.12, -0.06, 2.2]].forEach(([dx, dz, ry]) => { const c = coinMesh(); c.position.copy(T).add(V(dx, TY + 0.005, dz)); c.rotation.y = ry; group.add(c); coins.push({ m: c, rest: c.position.clone() }); });
    embers.length = 0;
    FACES.forEach((f, i) => { // six embers round the far rim, one per game master, dark until its line lays
      const a = place.seatYaw + Math.PI + (i - 2.5) * 0.38, p = T.clone().add(V(Math.sin(a) * (TR - 0.05), TY + 0.02, Math.cos(a) * (TR - 0.05)));
      const mat = new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: new THREE.Color(f.color), emissiveIntensity: 0.05, roughness: 0.6 });
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat); m.position.copy(p); group.add(m);
      embers.push({ m, mat, lit: 0 });
    });
    const bk = book(place.book, place.bookYaw); group.add(bk); group.userData.book = bk;
    if (shell !== "nook") { // the reading stand
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.95, 8), darkWood); post.position.copy(place.book).setY(0.47); group.add(post);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), wood); lip.position.copy(place.book).setY(0.96); lip.rotation.y = place.bookYaw; lip.rotation.x = 0.4; group.add(lip);
    }
    const glow = new THREE.PointLight(0xffc890, 0.5, 1.6, 2); glow.position.copy(T).setY(0.9); group.add(glow);
    group.userData.table = top; group.userData.cushion = cushion;
    layMarks(); layCard();
  }
  function layMarks() { // the lines laid so far, as short bars on the near side of the table, bottom line nearest you
    for (const m of marks) group.remove(m); marks.length = 0;
    const { T, seat } = place, toSeat = seat.clone().sub(T).setY(0).normalize(), side = V(toSeat.z, 0, -toSeat.x);
    tosses.forEach((t, i) => {
      const L = lineOf(t), g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: L.changing ? 0xf0c070 : 0x2a1a12, emissive: L.changing ? 0x804010 : 0x000000, roughness: 0.6 });
      const bar = (w, off) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, 0.016), mat); b.position.x = off; g.add(b); };
      if (L.yang) bar(0.2, 0); else { bar(0.085, -0.0575); bar(0.085, 0.0575); }
      g.position.copy(T).addScaledVector(toSeat, 0.22 - i * 0.032).addScaledVector(side, -0.1).setY(TY + 0.005);
      g.rotation.y = Math.atan2(side.x, side.z) - Math.PI / 2;
      group.add(g); marks.push(g);
    });
  }
  function layCard() {
    if (cardMesh) { group.remove(cardMesh); cardMesh = null; }
    if (!card || sealed) return;
    const g = new THREE.Group(), { T, seat } = place, toSeat = seat.clone().sub(T).setY(0).normalize(), side = V(toSeat.z, 0, -toSeat.x);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.185), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.8 })));
    const map = cardTexture(card), face = new THREE.Mesh(new THREE.PlaneGeometry(0.126, 0.181), new THREE.MeshStandardMaterial({ map, roughness: 0.7, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35 }));
    face.rotation.x = -Math.PI / 2; face.position.y = 0.0025; g.add(face);
    g.scale.setScalar(1.3); g.position.copy(T).addScaledVector(side, 0.13).addScaledVector(toSeat, 0.02).setY(TY + 0.004);
    g.rotation.y = Math.atan2(toSeat.x, toSeat.z) + Math.PI;
    group.add(g); cardMesh = g;
  }

  /* ---------- the page's own layer ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .ct-card{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:40;background:var(--glass);color:var(--glass-ink);backdrop-filter:blur(6px);border-radius:14px;padding:10px 14px;display:grid;gap:8px;width:min(92vw,540px);max-height:62vh;overflow:auto}
  .ct-card b{font-family:var(--display)} .ct-card .t{font-size:.88rem;color:var(--glass-muted)} .ct-card .row{display:flex;gap:8px;flex-wrap:wrap}
  .ct-card button,.ct-sheet button{font:inherit;border-radius:999px;padding:7px 14px;border:1px solid rgba(255,255,255,.35);background:#2f8f86;color:#fff;cursor:pointer}
  .ct-card button.q,.ct-sheet button.q{background:transparent;color:inherit;border-color:var(--line,rgba(255,255,255,.3))}
  .ct-card .opt{display:block;width:100%;text-align:left;border-radius:12px;background:rgba(255,255,255,.06);color:inherit;border:1px solid rgba(255,255,255,.18);padding:8px 10px;font-size:.9rem}
  .ct-card .opt.council{border-color:var(--fc);background:rgba(255,255,255,.1)} .ct-card .opt .mk{display:block;font-size:.76rem;color:var(--fc);margin-bottom:2px}
  .ct-hex{display:grid;gap:5px;justify-items:center;margin:2px 0} .ct-hex .ln{display:flex;gap:10px;align-items:center;height:12px}
  .ct-hex .bar{height:10px;border-radius:3px;background:#e9dcc4} .ct-hex .bar.full{width:120px} .ct-hex .bar.half{width:55px} .ct-hex .ln.empty .bar{background:rgba(255,255,255,.12)}
  .ct-hex .ln.moving .bar{background:#f0c070} .ct-hex .who{font-size:.72rem;width:72px;color:var(--glass-muted)} .ct-hex .ln .ch{font-size:.72rem;width:56px;color:#f0c070}
  .ct-scrim{position:fixed;inset:0;background:rgba(10,8,6,.55);z-index:50}
  .ct-sheet{position:fixed;z-index:51;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,600px);max-height:88vh;overflow:auto;background:var(--panel);color:var(--ink);border-radius:16px;padding:18px 18px 22px;font:15px/1.5 var(--body)}
  .ct-sheet h2{font-family:var(--display);margin:.2em 0 .3em} .ct-sheet h3{font-family:var(--display);font-size:1rem;margin:1em 0 .3em} .ct-sheet .muted{color:var(--muted);font-size:.86rem}
  .ct-sheet .foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px} .ct-sheet .pick{display:block;width:100%;text-align:left;margin:6px 0;border-radius:12px;background:var(--soft);color:var(--ink);border:1px solid var(--line)}
  .ct-label{position:fixed;z-index:30;transform:translate(-50%,-100%);font:600 .82rem var(--display);color:#f3ece2;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap}`;
  document.head.appendChild(css);
  const ui = document.createElement("div"); ui.className = "ct-card"; ui.hidden = true; document.body.appendChild(ui);
  const label = document.createElement("div"); label.className = "ct-label"; label.textContent = "The coin table"; document.body.appendChild(label);
  let scrim = null, dlg = null;
  function closeDlg() { if (scrim) scrim.remove(); if (dlg) dlg.remove(); scrim = dlg = null; cardKey = ""; }
  function openDlg(html) {
    closeDlg();
    scrim = document.createElement("div"); scrim.className = "ct-scrim"; scrim.onclick = closeDlg;
    dlg = document.createElement("section"); dlg.className = "ct-sheet"; dlg.setAttribute("role", "dialog"); dlg.innerHTML = html;
    dlg.addEventListener("pointerdown", e => e.stopPropagation()); dlg.addEventListener("keydown", e => e.stopPropagation());
    dlg.addEventListener("click", onAct);
    document.body.append(scrim, dlg);
    return dlg;
  }
  const readingHtml = c => `<h2>${c.n}. ${esc(c.name)} <span class="muted">${esc(c.cn)} (${esc(c.pinyin)})</span></h2>
    <p><b>${esc(c.shows)}</b></p><p class="muted">${esc(c.image)}</p><p>${esc(c.situation)}</p>
    ${c.becomes ? `<h3>Lines ${c.changing_lines.join(", ")} are moving. It becomes ${c.becomes.n}, ${esc(c.becomes.name)}</h3><p><b>${esc(c.becomes.shows)}</b></p><p>${esc(c.becomes.situation)}</p>` : `<p class="muted">No line is moving.</p>`}`;
  async function readBook() { // the skip: a whole cast at once, read straight from the book
    const tb = await loadTable(), c = castFromTosses(Array.from({ length: 6 }, () => tossThree()), tb, "book");
    openDlg(readingHtml(c) + `<p class="muted">Three coins, six times, read from the book at once. Sit at the coin table to lay the lines yourself.</p><div class="foot"><button type="button" data-ct="close">Close</button></div>`);
  }
  async function openHand() {
    if (preview) { openDlg(`<h2>Your hand</h2><p class="muted">A preview cannot read your hand. This one lays the first card handed from Tap the Vein, and seals nothing.</p><button type="button" class="pick" data-ct="lay:sample">${esc(SAMPLE.do)}</button><div class="foot"><button type="button" class="q" data-ct="close">Close</button></div>`); return; }
    if (!myHand) await fetchHand();
    if (!myHand) { openDlg(`<h2>Your hand</h2><p class="muted">${esc(handErr || "Your hand did not load.")}</p><div class="foot"><button type="button" class="q" data-ct="close">Close</button></div>`); return; }
    openDlg(`<h2>Lay a card from your hand</h2><p class="muted">The six game masters write its workorder as you toss. At the sixth line it seals and goes to the council.</p>
      ${myHand.length ? myHand.map((c, i) => `<button type="button" class="pick" data-ct="lay:${i}">${esc(c.do)}</button>`).join("") : `<p>Your hand is empty. Draw on the board, then come back.</p>`}
      <div class="foot"><button type="button" class="q" data-ct="close">Close</button></div>`);
  }
  async function fetchHand() {
    try {
      const r = await fetch("/api/board/saves?board=council", { credentials: "same-origin", cache: "no-store" });
      if (r.status === 401) { handErr = "Sign in to bars-engine as the board's owner to lay a card from your hand."; return; }
      if (!r.ok) { handErr = `Your hand did not load (${r.status}).`; return; }
      myHand = hand((await r.json()).docs);
    } catch (e) { handErr = "Your hand did not load (offline?)."; }
  }
  function lay(c) { card = c; sealed = null; tosses = []; kept = []; cast = null; layMarks(); layCard(); lightEmbers(); closeDlg(); sit(); }

  /* ---------- tossing ---------- */
  function pending() { return card && tosses.length > kept.length; }
  async function toss(fixed) {
    if (tossAnim || tosses.length >= 6 || pending()) return;
    const t = fixed || tossThree();
    tosses.push(t);
    const { T } = place;
    tossAnim = { t0: performance.now() / 1000, dur: 0.95, coins: coins.map((c, k) => ({ c, from: c.rest.clone(), to: T.clone().add(V((k - 1) * 0.09 + (Math.random() - 0.5) * 0.04, TY + 0.005, (Math.random() - 0.5) * 0.08 - 0.06)), spin: 3 + k, up: t[k] === 3, yaw: Math.random() * 6 })) };
    if (tosses.length === 6) cast = castFromTosses(tosses, await loadTable(), card ? card.id : "coin-table");
    cardKey = "";
  }
  function keep(k) {
    if (!pending()) return;
    const i = kept.length, o = offers(card, i).options[k]; if (!o) return;
    kept.push(o.text); lightEmbers(); cardKey = "";
  }
  function lightEmbers() { embers.forEach((e, i) => { e.lit = card && i < tosses.length ? 1 : 0; }); }
  function reset() { tosses = []; kept = []; cast = null; sealed = null; layMarks(); lightEmbers(); cardKey = ""; }

  async function seal() {
    if (!card || !cast || kept.length !== 6 || sealed) return;
    const wo = workorder(card, cast, kept), save = sealSave(card, wo);
    if (preview) sealed = { ok: true, preview: true, wo };
    else {
      try {
        const r = await fetch("/api/board/saves", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(save) });
        const j = await r.json().catch(() => ({}));
        sealed = r.ok ? { ok: true, wo } : { ok: false, err: j.error || String(r.status) };
      } catch (e) { sealed = { ok: false, err: "offline" }; }
    }
    if (sealed.ok) { layCard(); sendLantern(); if (myHand) myHand = myHand.filter(c => c.id !== card.id); }
    cardKey = "";
  }
  function sendLantern() { // a lantern carries the sealed card out the doorway (dispatch-lever)
    const a = B.anchors(), to = V(...a.portal).setY(1.6), from = place.T.clone().setY(TY + 0.1);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd6a0, transparent: true }));
    const l = new THREE.PointLight(0xffc070, 1.4, 3, 2); m.add(l); m.position.copy(from); B.scene.add(m);
    flying = { m, from, to, t0: performance.now() / 1000, dur: 3.2 };
  }

  /* ---------- the card under the screen: near the table, sat at it, near the book ---------- */
  function hexHtml() {
    let rows = "";
    for (let i = 5; i >= 0; i--) {
      const t = tosses[i], L = t && lineOf(t), f = FACES[i];
      rows += `<div class="ln ${t ? "" : "empty"} ${L && L.changing ? "moving" : ""}"><span class="who" style="color:${card ? f.color : "inherit"}">${card ? f.name : "line " + (i + 1)}</span>${!t || L.yang ? `<span class="bar full"></span>` : `<span class="bar half"></span><span class="bar half"></span>`}<span class="ch">${L ? (L.changing ? "moving" : "") : ""}</span></div>`;
    }
    return `<div class="ct-hex">${rows}</div>`;
  }
  function sittingHere() { const s = B.meState; return s.sitting && s.seatWant === "coins"; }
  function sit() { B.sitOn("coins"); }
  function showUi() {
    let key = "", html = "";
    const seated = sittingHere();
    if (seated || near === "table") {
      key = ["t", seated, card && card.id, tosses.length, kept.length, !!cast, sealed && sealed.ok, !!tossAnim, myHand && myHand.length].join(":");
      const head = card ? `<div><b>The coin table</b><div class="t">On the table: "${esc(card.do)}"</div></div>` : `<div><b>The coin table</b><div class="t">Three bronze coins. Toss them six times and the lines lay from the bottom up.${seated ? " Lay a card from your hand first and the six game masters write its workorder." : ""}</div></div>`;
      if (!seated) html = head + `<div class="row"><button type="button" data-ct="sit">Sit and toss</button><button type="button" class="q" data-ct="hand">Lay a card from your hand</button></div>`;
      else if (sealed && sealed.ok) html = `<div><b>Sealed</b><div class="t">${sealed.preview ? "A preview: nothing was written. On bars-engine.vercel.app this card goes to the council board as a With Claude card, carrying its workorder." : "The card left your hand for the council board, With Claude, carrying its workorder. The council picks it up within the hour."}</div></div><div class="row"><button type="button" data-ct="wo">Read the workorder</button><button type="button" class="q" data-ct="again">Toss again</button></div>`;
      else if (sealed && !sealed.ok) html = `<div><b>It did not seal</b><div class="t">${esc(sealed.err)}. The card is still in your hand.</div></div><div class="row"><button type="button" data-ct="seal">Try again</button></div>`;
      else if (pending()) {
        const o = offers(card, kept.length), moving = lineOf(tosses[kept.length]).changing;
        html = `<div style="--fc:${o.color}"><b style="color:${o.color}">Line ${o.line}: the ${o.name}</b><div class="t">${esc(o.asks)}${moving ? " The coins say this line is still moving: look again before you keep it." : ""}</div></div>`
          + o.options.map((op, k) => `<button type="button" class="opt ${op.council ? "council" : ""}" style="--fc:${o.color}" data-ct="keep:${k}">${op.council ? `<span class="mk">the council's answer</span>` : ""}${esc(op.text)}</button>`).join("") + hexHtml();
      } else if (cast) {
        html = `<div><b>${cast.n}. ${esc(cast.name)}</b><div class="t">${esc(cast.shows)}${cast.becomes ? ` Lines ${cast.changing_lines.join(", ")} are moving: it becomes ${cast.becomes.n}, ${esc(cast.becomes.name)}.` : ""}</div></div>${hexHtml()}`
          + `<div class="row">${card ? `<button type="button" data-ct="seal">Seal the card</button>` : ""}<button type="button" class="${card ? "q" : ""}" data-ct="reading">The reading</button><button type="button" class="q" data-ct="again">Toss again</button></div>`;
      } else html = head + hexHtml() + `<div class="row"><button type="button" data-ct="toss" ${tossAnim ? "disabled" : ""}>${tosses.length ? `Toss for line ${tosses.length + 1}` : "Toss the coins"}</button>${!card && !tosses.length ? `<button type="button" class="q" data-ct="hand">Lay a card from your hand</button>` : ""}</div>`;
    } else if (near === "book") {
      key = "book"; html = `<div><b>The book</b><div class="t">The I Ching, open. Touch it for a reading at once.</div></div><div class="row"><button type="button" data-ct="read">Read</button></div>`;
    }
    if (key === cardKey) return;
    cardKey = key; ui.hidden = !key || !!dlg; ui.innerHTML = html;
  }
  function onAct(e) {
    const b = e.target.closest("[data-ct]"); if (!b) return;
    const k = b.dataset.ct;
    if (k === "sit") sit(); else if (k === "hand") openHand(); else if (k === "toss") toss(); else if (k === "seal") seal();
    else if (k === "read") readBook(); else if (k === "close") closeDlg(); else if (k === "again") { if (sealed && sealed.ok) card = null; reset(); layCard(); }
    else if (k === "reading" && cast) openDlg(readingHtml(cast) + `<div class="foot"><button type="button" data-ct="close">Close</button></div>`);
    else if (k === "wo" && sealed && sealed.wo) openDlg(`<pre style="white-space:pre-wrap;font:13px/1.45 ui-monospace,monospace">${esc(sealed.wo.md)}</pre><div class="foot"><button type="button" data-ct="close">Close</button></div>`);
    else if (k.startsWith("keep:")) keep(+k.slice(5));
    else if (k.startsWith("lay:")) lay(k === "lay:sample" ? { ...SAMPLE } : myHand[+k.slice(4)]);
  }
  ui.addEventListener("click", onAct);
  ui.addEventListener("pointerdown", e => e.stopPropagation());

  /* ---------- a tap on the table or the book walks you there ---------- */
  const ray = new THREE.Raycaster();
  let down = null;
  B.renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
  B.renderer.domElement.addEventListener("pointerup", e => {
    if (!group || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), B.camera);
    const hits = ray.intersectObjects([group], true); if (!hits.length) return;
    let o = hits[0].object, isBook = false; while (o) { if (o === group.userData.book) isBook = true; o = o.parent; }
    setTimeout(() => { if (isBook) { B.meState.target = place.bookStand.clone(); B.meState.keys.clear(); } else sit(); }, 0); // after the room's own tap
  });

  /* ---------- each frame ---------- */
  function frame() {
    requestAnimationFrame(frame);
    const shell = B.room().shell;
    if (shell !== builtFor && (shell === "nook" || shell === "hollow")) build(shell);
    if (!group) return;
    const me = B.meState.pos, t = performance.now() / 1000;
    const { T } = place, dx = me.x - T.x, dz = me.z - T.z, dist = Math.hypot(dx, dz);
    if (!sittingHere() && dist < PUSH_R && dist > 1e-4) { const k = PUSH_R / dist; me.x = T.x + dx * k; me.z = T.z + dz * k; } // round the table, never through it
    if (tossAnim) {
      const k = Math.min(1, (t - tossAnim.t0) / tossAnim.dur);
      for (const c of tossAnim.coins) {
        c.c.m.position.lerpVectors(c.from, c.to, k); c.c.m.position.y += Math.sin(k * Math.PI) * 0.42;
        c.c.m.rotation.set(k * Math.PI * 2 * c.spin + (c.up ? 0 : Math.PI) * k, c.yaw, 0);
      }
      if (k >= 1) { for (const c of tossAnim.coins) { c.c.rest.copy(c.to); c.c.m.rotation.set(c.up ? 0 : Math.PI, c.yaw, 0); } tossAnim = null; layMarks(); lightEmbers(); cardKey = ""; }
    }
    for (const e of embers) { e.mat.emissiveIntensity += ((e.lit ? 2.2 + Math.sin(t * 3 + e.m.position.x * 9) * 0.3 : 0.05) - e.mat.emissiveIntensity) * 0.1; }
    if (flying) {
      const k = Math.min(1, (t - flying.t0) / flying.dur), e = k * k * (3 - 2 * k);
      flying.m.position.lerpVectors(flying.from, flying.to, e); flying.m.position.y += Math.sin(k * Math.PI) * 0.8;
      flying.m.material.opacity = k < 0.85 ? 1 : (1 - k) / 0.15;
      if (k >= 1) { B.scene.remove(flying.m); flying = null; }
    }
    near = null;
    if (dist < NEAR_R) near = "table";
    else if (place.bookStand && Math.hypot(me.x - place.bookStand.x, me.z - place.bookStand.z) < BOOK_NEAR) near = "book";
    showUi();
    const v = T.clone().setY(0.8).project(B.camera), [sx, sy] = B.screenOf(T.clone().setY(0.85));
    label.hidden = !!dlg || v.z > 1 || !!near || sittingHere(); label.style.left = sx + "px"; label.style.top = sy + "px";
  }

  B.addSeat(() => (place && builtFor === B.room().shell ? [{ id: "coins", coins: true, x: place.seat.x, z: place.seat.z, yaw: place.seatYaw, floor: 0, top: 0.2 }] : []));
  (async function start() {
    while (!B.room || !["nook", "hollow"].includes(B.room().shell)) await new Promise(r => setTimeout(r, 250));
    build(B.room().shell); requestAnimationFrame(frame);
    await loadTable();
    if (opts.open === "bar" || opts.open === "cast") {
      lay({ ...SAMPLE });
      if (opts.open === "cast") {
        const tb = await loadTable();
        tosses = BAR_TOSSES.map(x => [...x]); kept = tosses.map((_, i) => offers(card, i).options[0].text);
        cast = castFromTosses(tosses, tb, card.id);
        coins.forEach((c, k) => { c.rest.copy(T0().add(V((k - 1) * 0.09, TY + 0.005, -0.06))); c.m.position.copy(c.rest); c.m.rotation.set(BAR_TOSSES[5][k] === 3 ? 0 : Math.PI, k, 0); });
        layMarks(); lightEmbers(); cardKey = "";
      }
    }
  })().catch(e => console.warn("coin table:", e));
  const T0 = () => place.T.clone();
  return {
    toss, keep, seal, readBook, lay, sit, reset,
    view: () => ({ shell: builtFor, near, sitting: sittingHere(), card: card && card.id, tosses: tosses.map(x => [...x]), kept: kept.length, cast: cast && { n: cast.n, name: cast.name, changing: cast.changing_lines, becomes: cast.becomes && cast.becomes.n }, sealed: sealed && { ok: sealed.ok, preview: !!sealed.preview }, table: place && place.T.toArray(), seat: place && place.seat.toArray() }),
    workorder: () => sealed && sealed.wo,
  };
}

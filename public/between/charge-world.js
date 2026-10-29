/* Charge to world in the nook (Six-faces-council pass charge-to-world-1, placement ctw-in-the-nook).

   A map stand in your homeroom, by the window and the doorway out. Walk up to it and bring a charge (the six unpacking
   questions; the sample player's answers are filled in), and it unrolls into the episode: the Lazy Dungeon Master's
   eight-step sheet (../calrunia/episode-sheet.js, the port of council/tools/episode_sheet.py) and two panes rising over
   the map, one for each fantastic location that has been drawn (stills round 2026-10-28-ctw-locations-1). Walk up to a
   pane to read the place: its land and its three aspects, the brief the place generator builds from.

   It stands in every nook (garden.js mounts it; his yes on ctw-nook-look-1, 2026-10-29). Previews only: ?nook=1&ctw=episode
   brings the sample charge and walks you to the stand with the episode unrolled; ?ctw=sheet opens the six questions.
   Nothing is saved: the charge lives on this page. A real player's charge never goes into the repo (ctw-pilot). */
import * as THREE from "three";
import { read, sheet, locations, todo, canonical, LINES, LIFE_DOMAINS, QUADRANTS, SATISFACTION, DISTANCE, OBSTACLE, DISSATISFACTION, STRENGTH, VILLAINS } from "../calrunia/episode-sheet.js";

const STAND = new THREE.Vector3(0.95, 0, -2.0);
const YAW = Math.atan2(0 - STAND.x, 0.8 - STAND.z);           // the stand faces the middle of the room
const FRONT = new THREE.Vector3(Math.sin(YAW), 0, Math.cos(YAW));
const RIGHT = new THREE.Vector3(Math.cos(YAW), 0, -Math.sin(YAW));
const STAND_R = 0.42, NEAR_R = 1.15, PANE_NEAR = 1.0;
const STILLS = { encounter: "/between/ctw/unfinished-clearing.jpg", villain: "/between/ctw/scale-house.jpg" };
const QUESTIONS = {
  q1: "What do you want to create?", q2: "What will that get you?", q3: "What's life like now?",
  q4: "How does it feel to live here?", q5: "What would have to be true for someone to feel this way?",
  q6: "What reservation do you have about your creation?",
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = c => { const o = JSON.parse(JSON.stringify(c)); delete o.drafted; return canonical(o); };

export function mount(B, opts = {}) {
  let sample = null, charge = null, g = null, episode = null, built = false, sampleKept = true;
  const group = new THREE.Group(), panes = [];
  let near = null, cardKey = "";

  /* ---------- the stand: a root-wood stump, a map unrolled on it, a low ember under the lip ---------- */
  function buildStand() {
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 });
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.86, 10), wood);
    stump.position.y = 0.43;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x6b4b36, roughness: 0.85 }));
    top.position.y = 0.9; top.rotation.x = 0.18; // the near edge dips toward whoever reads it
    for (let i = 0; i < 4; i++) { // roots reaching into the moss
      const a = i * Math.PI / 2 + 0.4, root = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.5, 6), wood);
      root.position.set(Math.cos(a) * 0.38, 0.12, Math.sin(a) * 0.38); root.rotation.z = Math.cos(a) * 0.9; root.rotation.x = -Math.sin(a) * 0.9;
      group.add(root);
    }
    const map = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), new THREE.MeshBasicMaterial({ map: mapTexture(), transparent: true }));
    map.rotation.x = -Math.PI / 2 + 0.18; map.position.set(0, 0.955, 0);
    const rollMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.8 });
    for (const s of [-1, 1]) { const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.46, 8), rollMat); roll.rotation.x = Math.PI / 2; roll.position.set(s * 0.33, 0.96, 0); group.add(roll); }
    const glow = new THREE.PointLight(0xffb070, 0.9, 2.4, 2); glow.position.set(0, 1.3, 0.35);
    group.add(stump, top, map, glow);
    group.position.copy(STAND); group.rotation.y = YAW;
    group.userData.map = map;
    B.scene.add(group);
  }
  function mapTexture(lit) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 364; const x = c.getContext("2d");
    x.fillStyle = "#efe3c6"; x.fillRect(0, 0, 512, 364);
    x.strokeStyle = "rgba(90,60,40,.55)"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(40, 300); x.bezierCurveTo(140, 220, 220, 330, 300, 200); x.bezierCurveTo(360, 120, 430, 160, 470, 70); x.stroke();
    x.setLineDash([8, 8]); x.beginPath(); x.arc(256, 182, 140, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    if (lit) {
      x.fillStyle = "#3f7a3a"; for (let i = 0; i < 26; i++) { x.beginPath(); x.arc(70 + (i * 53) % 160, 230 + (i * 31) % 90, 9, 0, 7); x.fill(); }
      x.fillStyle = "#b98a2c"; x.fillRect(372, 70, 46, 40);
      x.fillStyle = "#5b3a24"; x.font = "bold 26px Marcellus, serif"; x.fillText(lit, 120, 46);
    } else { x.fillStyle = "rgba(90,60,40,.6)"; x.font = "italic 24px Marcellus, serif"; x.fillText("a map, still blank", 150, 190); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* ---------- the panes: one per drawn location, rising out of the map ---------- */
  function raisePanes() {
    for (const p of panes) group.remove(p.mesh);
    panes.length = 0;
    const locs = locations(charge, g).filter(l => l.role !== "road-home");
    locs.forEach((loc, i) => {
      const src = sampleKept && loc.drafted ? STILLS[loc.role] : null;
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide });
      if (src) new THREE.TextureLoader().load(src, t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; });
      else { mat.map = blankPane(loc); }
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.54), mat);
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.6), new THREE.MeshBasicMaterial({ color: 0xd9b98a, transparent: true, opacity: 0 }));
      frame.position.z = -0.005; mesh.add(frame);
      const side = i ? 1 : -1;
      mesh.position.set(side * 0.53, 0.95, 0.05); mesh.rotation.y = -side * 0.3; // toed in toward whoever stands at the map
      group.add(mesh);
      panes.push({ mesh, frame, mat, loc, src, side, t0: performance.now() / 1000 + i * 0.35 });
    });
    group.userData.map.material.map = mapTexture(g.environment); group.userData.map.material.needsUpdate = true;
  }
  function blankPane(loc) {
    const c = document.createElement("canvas"); c.width = 480; c.height = 270; const x = c.getContext("2d");
    x.fillStyle = "#2a231c"; x.fillRect(0, 0, 480, 270); x.fillStyle = "#e9dcc4"; x.font = "22px Marcellus, serif";
    x.fillText(loc.drafted ? loc.location : "a place still to draft", 24, 120); x.font = "16px sans-serif"; x.fillStyle = "#b8a990";
    x.fillText("not drawn yet", 24, 160);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const paneWorld = p => p.mesh.getWorldPosition(new THREE.Vector3());

  /* ---------- the page's own layer: a card when you stand near, the six questions, the sheet, a pane ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .ctw-card{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:40;background:var(--glass);color:var(--glass-ink);backdrop-filter:blur(6px);border-radius:14px;padding:10px 14px;display:grid;gap:8px;width:min(92vw,520px)}
  .ctw-card b{font-family:var(--display)} .ctw-card .t{font-size:.88rem;color:var(--glass-muted)} .ctw-card .row{display:flex;gap:8px;flex-wrap:wrap}
  .ctw-card button,.ctw-sheet button{font:inherit;border-radius:999px;padding:7px 14px;border:1px solid rgba(255,255,255,.35);background:#2f8f86;color:#fff;cursor:pointer}
  .ctw-card button.q,.ctw-sheet button.q{background:transparent;color:inherit;border-color:var(--line)}
  .ctw-scrim{position:fixed;inset:0;background:rgba(10,8,6,.55);z-index:50}
  .ctw-sheet{position:fixed;z-index:51;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,640px);max-height:88vh;overflow:auto;background:var(--panel);color:var(--ink);border-radius:16px;padding:18px 18px 22px;font:15px/1.5 var(--body)}
  .ctw-sheet h2{font-family:var(--display);margin:.2em 0 .4em} .ctw-sheet h3{font-family:var(--display);font-size:1rem;margin:1.1em 0 .3em}
  .ctw-sheet label{display:grid;gap:3px;margin:.45em 0;font-size:.9rem} .ctw-sheet input[type=text],.ctw-sheet select,.ctw-sheet textarea{font:inherit;padding:7px 9px;border-radius:9px;border:1px solid var(--line);background:var(--soft);color:var(--ink);width:100%;box-sizing:border-box}
  .ctw-sheet .checks{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.88rem} .ctw-sheet .checks label{display:flex;gap:5px;align-items:center;margin:0}
  .ctw-sheet .muted{color:var(--muted);font-size:.86rem} .ctw-sheet .err{color:var(--warn)} .ctw-sheet .foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;position:sticky;bottom:-22px;background:var(--panel);padding:10px 0}
  .ctw-sheet ul,.ctw-sheet ol{padding-left:1.2em} .ctw-sheet img{width:100%;border-radius:10px;display:block} .ctw-sheet code{font-size:.85em}
  .ctw-label{position:fixed;z-index:30;transform:translate(-50%,-100%);font:600 .82rem var(--display);color:#f3ece2;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap}`;
  document.head.appendChild(css);
  const card = document.createElement("div"); card.className = "ctw-card"; card.hidden = true; document.body.appendChild(card);
  const label = document.createElement("div"); label.className = "ctw-label"; label.textContent = "The map stand"; document.body.appendChild(label);
  let scrim = null, dlg = null;
  function closeDlg() { if (scrim) scrim.remove(); if (dlg) dlg.remove(); scrim = dlg = null; cardKey = ""; }
  function openDlg(html) {
    closeDlg();
    scrim = document.createElement("div"); scrim.className = "ctw-scrim"; scrim.onclick = closeDlg;
    dlg = document.createElement("section"); dlg.className = "ctw-sheet"; dlg.setAttribute("role", "dialog"); dlg.innerHTML = html;
    dlg.addEventListener("pointerdown", e => e.stopPropagation()); dlg.addEventListener("keydown", e => e.stopPropagation());
    document.body.append(scrim, dlg);
    return dlg;
  }

  const opt = (vals, cur) => vals.map(v => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("");
  const checks = (name, vals, cur) => `<div class="checks">${vals.map(v => `<label><input type="checkbox" name="${name}" value="${esc(v)}" ${cur.includes(v) ? "checked" : ""}>${esc(v)}</label>`).join("")}</div>`;
  function openCharge() {
    const c = charge || sample, q = k => c[k] || {};
    const feels = q("q2").feelings || [], w = (q("q4").weather || [{}])[0], folk = q("q3").townsfolk || [];
    const d = openDlg(`<h2>Bring a charge</h2>
      <p class="muted">The six questions. The sample player's answers are filled in; change any of them and the grammar redraws the episode. Nothing here is saved.</p>
      <h3>1. ${QUESTIONS.q1}</h3>
      <label>In their words<input type="text" name="words" value="${esc(q("q1").words)}"></label>
      <label>Where it lives (quadrant)<select name="quadrant">${Object.keys(QUADRANTS).map(k => `<option value="${k}" ${k === (q("q1").quadrant || "upper_right") ? "selected" : ""}>${esc(QUADRANTS[k][0])} (${QUADRANTS[k][1]})</option>`).join("")}</select></label>
      <label>Life domain<select name="domain">${opt(LIFE_DOMAINS, q("q1").domain)}</select></label>
      <label>The line it works<select name="line">${opt(LINES, c.line)}</select></label>
      <h3>2. ${QUESTIONS.q2}</h3>
      <label>The feeling when it is real<select name="feel1">${opt(Object.keys(SATISFACTION), feels[0])}</select></label>
      <label>And another (optional)<select name="feel2"><option value="">none</option>${opt(Object.keys(SATISFACTION), feels[1])}</select></label>
      <h3>3. ${QUESTIONS.q3}</h3>
      <label>How far it feels<select name="distance">${opt(Object.keys(DISTANCE), q("q3").distance)}</select></label>
      <div class="muted">What stands in the way</div>${checks("obstacles", Object.keys(OBSTACLE), q("q3").obstacles || [])}
      <label>Someone near (their role and name)<input type="text" name="folk1" value="${esc(folk[0] ? folk[0].role + ": " + folk[0].name : "")}"></label>
      <label>Someone else near<input type="text" name="folk2" value="${esc(folk[1] ? folk[1].role + ": " + folk[1].name : "")}"></label>
      <h3>4. ${QUESTIONS.q4}</h3>
      <label>This week<select name="week">${opt(Object.keys(DISSATISFACTION), w.feeling)}</select></label>
      <label>How strong<select name="strength">${opt(STRENGTH, w.strength)}</select></label>
      <h3>5. ${QUESTIONS.q5}</h3>
      <label>What has to be true (the key)<input type="text" name="key" value="${esc(Object.values(q("q5").keys || {})[0] || "")}"></label>
      <h3>6. ${QUESTIONS.q6}</h3>
      <div class="muted">The beliefs that come up</div>${checks("beliefs", Object.keys(VILLAINS), q("q6").beliefs || [])}
      <label>The loudest<select name="loudest">${opt(Object.keys(VILLAINS), q("q6").loudest)}</select></label>
      <label>Loudest when facing<select name="when"><option value="">any</option>${opt(Object.keys(OBSTACLE), q("q6").when)}</select></label>
      <label>What it hoards<input type="text" name="hoard" value="${esc(q("q6").hoard)}"></label>
      <p class="err" id="ctwErr" hidden></p>
      <div class="foot"><button type="button" data-ctw="unroll">Unroll the episode</button><button type="button" class="q" data-ctw="reset">The sample's answers</button><button type="button" class="q" data-ctw="close">Close</button></div>`);
    d.querySelector('[data-ctw="unroll"]').onclick = () => unroll(fromForm(d), d);
    d.querySelector('[data-ctw="reset"]').onclick = () => { charge = null; openCharge(); };
    d.querySelector('[data-ctw="close"]').onclick = closeDlg;
  }
  function fromForm(d) {
    const v = n => (d.querySelector(`[name="${n}"]`) || {}).value || "";
    const all = n => [...d.querySelectorAll(`[name="${n}"]:checked`)].map(x => x.value);
    const c = JSON.parse(JSON.stringify(sample));
    const person = s => { const [role, ...rest] = s.split(":"); return rest.length ? { role: role.trim(), name: rest.join(":").trim() } : { role: "friend", name: s.trim() }; };
    c.line = v("line");
    Object.assign(c.q1, { words: v("words"), quadrant: v("quadrant"), domain: v("domain") });
    c.q2.feelings = [v("feel1"), v("feel2")].filter(Boolean);
    Object.assign(c.q3, { distance: v("distance"), obstacles: all("obstacles"), townsfolk: [v("folk1"), v("folk2")].filter(s => s.trim()).map(person) });
    c.q4.weather = [{ feeling: v("week"), strength: v("strength") }];
    c.q5.keys = { [DISSATISFACTION[v("week")]]: v("key") };
    const beliefs = all("beliefs"), loudest = v("loudest");
    c.q6 = { ...c.q6, beliefs: beliefs.includes(loudest) ? beliefs : [loudest, ...beliefs], loudest, hoard: v("hoard") };
    if (v("when")) c.q6.when = v("when"); else delete c.q6.when;
    // The drafted text (secrets, names, the two stills) belongs to the sample's answers: changed answers leave gaps to draft.
    sampleKept = strip(c) === strip(sample);
    if (!sampleKept) delete c.drafted;
    return c;
  }
  async function unroll(c, d) {
    const r = await read(c);
    if (r.errors) { const e = d && d.querySelector("#ctwErr"); if (e) { e.hidden = false; e.innerHTML = r.errors.map(esc).join("<br>"); } return; }
    charge = c; g = r; episode = sheet(c, g);
    raisePanes(); closeDlg();
    walkTo(STAND.clone().addScaledVector(FRONT, 0.85));
  }
  function md(text) { // the sheet's Markdown: headings, lists, bold, italics, code
    const inline = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
    let html = "", list = null;
    for (const ln of text.split("\n")) {
      const li = ln.match(/^(- |\d+\. )(.*)/), want = li ? (li[1] === "- " ? "ul" : "ol") : null;
      if (list && list !== want) { html += `</${list}>`; list = null; }
      if (li) { if (!list) { html += `<${want}>`; list = want; } html += `<li>${inline(li[2])}</li>`; continue; }
      if (ln.startsWith("## ")) html += `<h3>${inline(ln.slice(3))}</h3>`;
      else if (ln.startsWith("# ")) html += `<h2>${inline(ln.slice(2))}</h2>`;
      else if (ln.trim()) html += `<p>${inline(ln)}</p>`;
    }
    return html + (list ? `</${list}>` : "");
  }
  function openSheet() {
    const gaps = todo(charge);
    const d = openDlg(md(episode) + (gaps.length ? `<p class="muted">Still to draft: ${esc(gaps.join(", "))}.</p>` : "")
      + `<div class="foot"><button type="button" data-ctw="charge">Change the charge</button><button type="button" class="q" data-ctw="close">Close</button></div>`);
    d.querySelector('[data-ctw="charge"]').onclick = openCharge; d.querySelector('[data-ctw="close"]').onclick = closeDlg;
  }
  function openPane(p) {
    const l = p.loc;
    const d = openDlg(`<h2>${esc(l.location)}</h2>${p.src ? `<img src="${p.src}" alt="${esc(l.location)}: ${esc(l.aspects.join("; "))}">` : `<p class="muted">Not drawn yet: this place is a brief until a stills round draws it.</p>`}
      <p class="muted">${esc(l.land)}. ${esc(l.purpose[0].toUpperCase() + l.purpose.slice(1))}.</p>
      <ul>${l.aspects.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
      <p class="muted">This place is an asset brief on the ${esc(l.line)} line. ${p.src ? "The frame is the round 1 blockout (look ctw-locations-look-1); on a yes the place generator builds it as a place you walk into." : ""}</p>
      <div class="foot"><button type="button" data-ctw="sheet">The episode sheet</button><button type="button" class="q" data-ctw="close">Close</button></div>`);
    d.querySelector('[data-ctw="sheet"]').onclick = openSheet; d.querySelector('[data-ctw="close"]').onclick = closeDlg;
  }
  card.addEventListener("click", e => {
    const b = e.target.closest("[data-ctw]"); if (!b) return;
    const k = b.dataset.ctw;
    if (k === "charge") openCharge(); else if (k === "sheet") openSheet(); else if (k.startsWith("pane:")) openPane(panes[+k.slice(5)]);
  });
  function showCard() {
    let key = "", html = "";
    if (near === "stand") {
      key = "stand" + (episode ? "1" : "0");
      html = episode
        ? `<div><b>The map stand</b><div class="t">The map shows the ${esc(g.environment)} under ${esc(g.weather)}. ${esc(g.villain[0].toUpperCase() + g.villain.slice(1))} waits on the ${esc(g.line)} line.</div></div><div class="row"><button type="button" data-ctw="sheet">Read the episode sheet</button><button type="button" class="q" data-ctw="charge">Change the charge</button></div>`
        : `<div><b>The map stand</b><div class="t">Bring a charge here and the map unrolls into an episode: the lands it makes and the places in them.</div></div><div class="row"><button type="button" data-ctw="charge">Bring a charge</button></div>`;
    } else if (near && near.startsWith("pane:")) {
      const p = panes[+near.slice(5)];
      key = near; html = `<div><b>${esc(p.loc.location)}</b><div class="t">${esc(p.loc.aspects[0])}</div></div><div class="row"><button type="button" data-ctw="${near}">Look into it</button></div>`;
    }
    if (key === cardKey) return;
    cardKey = key; card.hidden = !key || !!dlg; card.innerHTML = html;
  }

  /* ---------- walking: a tap on the stand or a pane walks you there; you stand at the stand, never inside it ---------- */
  function walkTo(p) { B.meState.target = p; B.meState.keys.clear(); }
  const ray = new THREE.Raycaster();
  let down = null;
  B.renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
  B.renderer.domElement.addEventListener("pointerup", e => {
    if (!built || !group.visible || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), B.camera);
    const hits = ray.intersectObjects([group], true);
    if (!hits.length) return;
    const pi = panes.findIndex(p => hits[0].object === p.mesh || hits[0].object === p.frame);
    const to = STAND.clone().addScaledVector(FRONT, 0.85);
    if (pi >= 0) to.addScaledVector(RIGHT, panes[pi].side * 0.45);
    setTimeout(() => walkTo(to), 0); // after the room's own tap, which aims at the floor behind
  });

  function frame() {
    requestAnimationFrame(frame);
    const inNook = B.room().shell === "nook";
    group.visible = inNook;
    if (!inNook) { label.hidden = true; card.hidden = true; near = null; cardKey = ""; return; }
    const me = B.meState.pos, dx = me.x - STAND.x, dz = me.z - STAND.z, dist = Math.hypot(dx, dz);
    if (dist < STAND_R + 0.25 && dist > 1e-4) { const k = (STAND_R + 0.25) / dist; me.x = STAND.x + dx * k; me.z = STAND.z + dz * k; }
    const t = performance.now() / 1000;
    for (const p of panes) { // rise out of the map, then float
      const k = Math.min(1, Math.max(0, (t - p.t0) / 1.4)), e = 1 - Math.pow(1 - k, 3);
      p.mesh.position.y = 0.95 + e * (0.82 + p.side * 0.04) + Math.sin(t * 0.8 + p.side) * 0.025 * e;
      p.mat.opacity = e; p.frame.material.opacity = e * 0.9;
    }
    near = null;
    if (dist < NEAR_R + 0.3) near = "stand";
    // at the stand, a step to one side is a step toward that side's pane
    const lateral = (me.x - STAND.x) * RIGHT.x + (me.z - STAND.z) * RIGHT.z;
    panes.forEach((p, i) => { const w = paneWorld(p); if (near === "stand" && Math.hypot(me.x - w.x, me.z - w.z) < PANE_NEAR && Math.abs(lateral) > 0.22 && Math.sign(lateral) === p.side) near = "pane:" + i; });
    showCard();
    const [sx, sy] = B.screenOf(STAND.clone().setY(episode ? 2.5 : 1.35));
    const v = STAND.clone().setY(1.2).project(B.camera);
    label.hidden = !!dlg || v.z > 1 || !!near; label.style.left = sx + "px"; label.style.top = sy + "px";
    label.textContent = episode ? "The map stand: " + g.environment : "The map stand";
  }

  (async function start() {
    sample = await fetch("/between/ctw/sample-player.json").then(r => r.json());
    // the room builds after the page loads; stand the map once the nook is up
    while (!B.room || B.room().shell !== "nook") await new Promise(r => setTimeout(r, 250));
    buildStand(); built = true; requestAnimationFrame(frame);
    if (opts.open === "episode") await unroll(JSON.parse(JSON.stringify(sample)), null);
    else if (opts.open === "sheet") { walkTo(STAND.clone().addScaledVector(FRONT, 0.85)); openCharge(); }
  })().catch(e => console.warn("charge to world:", e));
  return { stand: STAND, view: () => ({ near, episode: !!episode, sampleKept, panes: panes.map(p => p.loc.location), todo: charge ? todo(charge) : null }) };
}

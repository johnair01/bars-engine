/* The BAR written with a brush (ember-to-vibeulon FR-004, FR-005; Six-faces-council council/callsheets/ember-economy.md).
   Wendell, B on ee2-first-ember-look-1 (2026-11-04 05:30): "I want them to write it with a brush". His earlier note on
   ee2-gesture-look-1: "the embers affect the color of the ink". So at the Nook's hearth the player takes a blank strip
   from the shelf, dips the hearth's brush in a kept ember, and draws the mark themselves; the ink is that ember's colour
   (the move's starting element, council position ee2-ink-from-element). The vibeulon the BAR mints settles on its seal.
   The strip is a talisman card with a cinnabar frame and seal, as stills round 2026-11-04-ember-first-1 drew it; the
   brush on the shelf and the strips lying beside it are drawn here too, so garden.js only places them.

   Nothing here is scored: there is no right stroke, no count, and an ember's glow never shows. */

/** Each element's ink: `wet` while the stroke is laid (the ember's own light), `set` once it dries on talisman yellow. */
export const INK = {
  wood: { wet: "#a8e090", set: "#2f6a2a" },
  fire: { wet: "#ffb08a", set: "#c2401c" },
  earth: { wet: "#f0d590", set: "#7a5420" },
  metal: { wet: "#eef1f6", set: "#55585e" },
  water: { wet: "#a8d0ff", set: "#1f4f96" },
};
const PAPER = "#e8cf7a", CINNABAR = "#b8261a", W = 440, H = 690;
const ELEMENT_WORD = { wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water" };

/* ---------- on the shelf: three blank strips in a little fan, and the brush beside them ---------- */
function paperTex(THREE) {
  const c = document.createElement("canvas"); c.width = 110; c.height = 172; const x = c.getContext("2d");
  x.fillStyle = PAPER; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(150,110,40,${Math.random() * 0.06})`; x.fillRect(Math.random() * c.width, Math.random() * c.height, 2 + Math.random() * 3, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let stripTex = null;
/** The blank strips: talisman stock laid flat, a faint glow so they read in the shelf's shadow. */
export function stripsMesh(THREE) {
  if (!stripTex) stripTex = paperTex(THREE);
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(0.12, 0.19);
  const mat = new THREE.MeshStandardMaterial({ map: stripTex, color: 0xffffff, emissive: 0xe8cf7a, emissiveMap: stripTex, emissiveIntensity: 0.32, roughness: 0.95, side: THREE.DoubleSide });
  // propped a little toward the room, so they read past the book from the middle of the Nook
  [-0.12, 0, 0.12].forEach((a, i) => { const m = new THREE.Mesh(geo, mat); m.rotation.order = "YXZ"; m.rotation.x = -Math.PI / 2 + 0.55; m.rotation.y = a; m.position.set((i - 1) * 0.03, 0.05, -0.02 * i); g.add(m); });
  return g;
}
/** The hearth's brush: a bamboo handle with a dark tuft, laid across the shelf. `wet(hex)` tints its tip with an ember's ink. */
export function brushMesh(THREE) {
  const g = new THREE.Group();
  const bamboo = new THREE.MeshStandardMaterial({ color: 0xb08a4a, roughness: 0.7 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.22, 10), bamboo); handle.rotation.z = Math.PI / 2; g.add(handle);
  for (const x of [-0.05, 0.03]) { const n = new THREE.Mesh(new THREE.TorusGeometry(0.0092, 0.0018, 5, 12), bamboo); n.rotation.y = Math.PI / 2; n.position.x = x; g.add(n); }
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.5 })); ferrule.rotation.z = Math.PI / 2; ferrule.position.x = -0.12; g.add(ferrule);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.6, emissive: 0x000000 });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.045, 10), tipMat); tip.rotation.z = Math.PI / 2; tip.position.x = -0.152; g.add(tip);
  g.position.y = 0.01;
  g.userData.wet = hex => { if (hex) { tipMat.color.set(hex); tipMat.emissive.set(hex); tipMat.emissiveIntensity = 0.5; } else { tipMat.color.setHex(0x2a221c); tipMat.emissiveIntensity = 0; } };
  return g;
}

/* ---------- at the cloth: the strip, the brush and its ink ---------- */
const css = `
/* the room stays in view while you write (FR-005): the kneeling writer is seen on the left, the strip sits to the right
   (below on a phone) on a dark that fades into the room, never a full-screen backdrop */
.bw{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:flex-end;background:linear-gradient(90deg,rgba(12,8,6,0) 0%,rgba(12,8,6,0) 38%,rgba(20,12,8,.55) 62%,rgba(20,12,8,.82) 100%);padding:16px 4vw;box-sizing:border-box}
@media (max-aspect-ratio:1/1){.bw{align-items:flex-end;justify-content:center;background:linear-gradient(180deg,rgba(12,8,6,0) 0%,rgba(12,8,6,0) 42%,rgba(20,12,8,.6) 60%,rgba(20,12,8,.86) 100%);padding:12px 16px}.bw-strip{width:auto;height:min(30vh,250px)}.bw-in{gap:8px}}
.bw[hidden]{display:none}
.bw-in{display:flex;flex-direction:column;align-items:center;gap:12px;max-width:360px;width:100%;color:#f3e6cc;font:15px/1.4 Georgia,serif}
.bw-dip{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:44px}
.bw-dip p{margin:0;opacity:.85;font-style:italic}
.bw-ember{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,230,190,.25);background:radial-gradient(circle,var(--c) 0 30%,transparent 70%);cursor:pointer;padding:0}
.bw-ember[aria-pressed=true]{border-color:#f3e6cc;box-shadow:0 0 14px var(--c)}
.bw-strip{width:min(62vw,250px);aspect-ratio:${W}/${H};touch-action:none;border-radius:2px;box-shadow:0 10px 30px rgba(0,0,0,.55),0 0 40px rgba(255,190,110,.18);cursor:not-allowed}
.bw-strip.wet{cursor:crosshair}
.bw-mark{width:min(80vw,300px);background:rgba(20,12,8,.6);border:1px solid rgba(232,207,122,.4);border-radius:6px;color:#f3e6cc;font:inherit;padding:10px 12px}
.bw-mark::placeholder{color:rgba(243,230,204,.55)}
.bw-row{display:flex;gap:10px}
.bw-row button{font:inherit;border-radius:20px;padding:9px 18px;border:1px solid rgba(232,207,122,.5);background:rgba(40,24,14,.7);color:#f3e6cc;cursor:pointer;min-height:44px}
.bw-row button.set{background:${CINNABAR};border-color:${CINNABAR}}
.bw-row button:disabled{opacity:.45;cursor:default}
.bw-say{min-height:1.4em;margin:0;text-align:center}
.bw-coin{position:absolute;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 38% 35%,#ffe9a0,#e8b84a 45%,#8a5a10);box-shadow:0 0 16px rgba(255,200,90,.8);pointer-events:none}
.bw-coin::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;background:#5a3a10}
.bw-coin.fall{animation:bwFall 1.1s cubic-bezier(.3,.1,.4,1) forwards}
@keyframes bwFall{from{transform:translateY(-120px) scale(1.3);opacity:0}60%{opacity:1}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){.bw-coin.fall{animation:none}}
`;

/** The writing at the cloth. `write({ ember, mark })` saves it and resolves to `{ ink }`, or throws with a message. */
export function createBrushWrite({ write, onClose, onDip, onStroke, onSet } = {}) {
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement("div"); el.className = "bw"; el.hidden = true;
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Write a BAR with the brush");
  el.innerHTML = `<div class="bw-in">
    <div class="bw-dip" role="group" aria-label="Dip the brush in an ember"></div>
    <div style="position:relative"><canvas class="bw-strip" width="${W}" height="${H}" aria-label="The strip. Draw your mark on it with the brush."></canvas></div>
    <input class="bw-mark" maxlength="80" placeholder="What it is, in a few words" aria-label="What it is, in a few words">
    <p class="bw-say" aria-live="polite"></p>
    <div class="bw-row"><button type="button" class="back">Not now</button><button type="button" class="set" disabled>Set it down</button></div>
  </div>`;
  document.body.appendChild(el);
  const dip = el.querySelector(".bw-dip"), cv = el.querySelector("canvas"), cx = cv.getContext("2d"), markIn = el.querySelector(".bw-mark");
  const say = el.querySelector(".bw-say"), setBtn = el.querySelector(".set"), backBtn = el.querySelector(".back");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let s = null; // { embers, ember, strokes: [[x,y,w]...][], line, busy, done }

  function paper() {
    cx.fillStyle = PAPER; cx.fillRect(0, 0, W, H);
    let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 900; i++) { cx.fillStyle = `rgba(150,110,40,${rnd() * 0.05})`; cx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 6, 1); }
    cx.strokeStyle = CINNABAR; cx.lineWidth = 9; cx.strokeRect(18, 18, W - 36, H - 36); cx.lineWidth = 3; cx.strokeRect(32, 32, W - 64, H - 64);
  }
  function seal() { cx.fillStyle = CINNABAR; cx.fillRect(W / 2 - 34, H - 112, 68, 68); cx.fillStyle = PAPER; cx.fillRect(W / 2 - 22, H - 100, 44, 44); cx.fillStyle = CINNABAR; cx.fillRect(W / 2 - 12, H - 90, 24, 24); }
  function stroke(pts, color, glow) {
    if (pts.length < 1) return;
    cx.fillStyle = color; cx.shadowColor = glow || "transparent"; cx.shadowBlur = glow ? 16 : 0;
    for (let i = 0; i < pts.length; i++) { // a round brush laid as overlapping dabs, thicker where the hand slowed
      const [x, y, w] = pts[i], [px, py, pw] = pts[i - 1] || pts[i], d = Math.hypot(x - px, y - py), n = Math.max(1, Math.ceil(d / 3));
      for (let k = 1; k <= n; k++) { const t = k / n; cx.beginPath(); cx.arc(px + (x - px) * t, py + (y - py) * t, pw + (w - pw) * t, 0, Math.PI * 2); cx.fill(); }
    }
    cx.shadowBlur = 0;
  }
  function draw() {
    paper();
    const ink = s && s.ember ? INK[s.ember.el] : null;
    for (const [i, pts] of (s ? s.strokes : []).entries()) stroke(pts, ink ? ink.set : "#333", s.line === i && !reduce ? ink.wet : null);
    if (s && s.done) seal();
  }
  function hud() {
    if (!s) return;
    dip.innerHTML = s.embers.length ? s.embers.map(e => `<button type="button" class="bw-ember" data-id="${e.id}" style="--c:${e.light}" aria-pressed="${s.ember && s.ember.id === e.id}" aria-label="${ELEMENT_WORD[e.el]} ember, ${e.name}"></button>`).join("") : `<p>Keep an ember at the hearth first.</p>`;
    cv.classList.toggle("wet", !!s.ember);
    setBtn.disabled = !!(s.busy || s.done || !s.ember || !s.strokes.length || !markIn.value.trim());
    backBtn.textContent = s.done ? "Done" : "Not now";
  }
  dip.addEventListener("click", ev => {
    const b = ev.target.closest(".bw-ember"); if (!b || !s || s.done) return;
    s.ember = s.embers.find(e => e.id === b.dataset.id) || null;
    say.textContent = s.ember ? `The brush takes the ${ELEMENT_WORD[s.ember.el].toLowerCase()} ember's light.` : "";
    draw(); hud(); if (s.ember && onDip) onDip(s.ember);
  });
  const at = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
  let down = null;
  cv.addEventListener("pointerdown", ev => {
    if (!s || s.done || s.busy) return;
    if (!s.ember) { say.textContent = "Dip the brush in an ember first."; return; }
    cv.setPointerCapture(ev.pointerId); const [x, y] = at(ev); down = { t: performance.now(), x, y };
    s.strokes.push([[x, y, 9]]); s.line = s.strokes.length - 1; draw(); hud();
  });
  cv.addEventListener("pointermove", ev => {
    if (!down || !s) return;
    const [x, y] = at(ev), now = performance.now(), v = Math.hypot(x - down.x, y - down.y) / Math.max(1, now - down.t);
    const pts = s.strokes[s.line], w = Math.max(3, Math.min(15, 15 - v * 9)), pw = pts[pts.length - 1][2];
    pts.push([x, y, pw + (w - pw) * 0.35]); if (onStroke) onStroke({ ds: Math.hypot(x - down.x, y - down.y), press: (w - 3) / 12, down: true });
    down = { t: now, x, y }; draw();
  });
  const up = () => { if (!down || !s) return; down = null; s.line = -1; draw(); hud(); }; // the stroke dries to its set colour
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  markIn.addEventListener("input", hud);
  backBtn.addEventListener("click", () => close());
  el.addEventListener("keydown", ev => { if (ev.key === "Escape") close(); });
  setBtn.addEventListener("click", async () => {
    if (!s || setBtn.disabled) return;
    s.busy = true; hud(); say.textContent = "";
    try {
      await write({ ember: s.ember.id, mark: markIn.value.trim().slice(0, 80), demo: s.ember.demo });
      s.done = true; s.busy = false; draw(); hud(); if (onSet) onSet();
      const box = cv.getBoundingClientRect(), wrap = cv.parentElement.getBoundingClientRect();
      const coin = document.createElement("div"); coin.className = "bw-coin fall";
      coin.style.left = (box.left - wrap.left + box.width / 2 - 15) + "px"; coin.style.top = (box.top - wrap.top + box.height * (H - 78) / H - 15) + "px";
      cv.parentElement.appendChild(coin); s.coin = coin;
      say.textContent = "Your BAR. A vibeulon settled on its seal.";
    } catch (e) { s.busy = false; say.textContent = (e && e.message) || "It did not set. Try again in a moment."; hud(); }
  });

  /** Opens at the cloth. `embers`: the pouch's held embers as [{ id, el, name, light, demo }]. */
  function open(embers) {
    s = { embers, ember: embers.length === 1 ? embers[0] : null, strokes: [], line: -1, busy: false, done: false, coin: null };
    markIn.value = ""; say.textContent = s.ember ? `The brush takes the ${ELEMENT_WORD[s.ember.el].toLowerCase()} ember's light.` : embers.length ? "Dip the brush in an ember." : "";
    el.hidden = false; draw(); hud(); if (s.ember && onDip) onDip(s.ember); setTimeout(() => (s.ember ? cv : dip.querySelector("button") || backBtn).focus?.(), 0);
  }
  function close() { if (!s) return; const done = s.done; if (s.coin) s.coin.remove(); s = null; el.hidden = true; onClose && onClose(done); }
  return { open, close, get isOpen() { return !!s; }, get ember() { return s ? s.ember : null; }, el };
}

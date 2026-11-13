/* The road out (healing journey slice 2, T014): ported from the stills' make/road.js (Six-faces-council #1197) into a
   module the land mounts. A winding way from the arch into the clearing, warm edge stones, one stretch lit by the
   land's element, and a letter lying in the verge. Walking to the letter opens the pack tag (what set it off, where it
   sits in the body, which feeling; FR-014 order). "Put it in the pack" writes a pack object to sessionStorage
   `hj-pickup` and hangs the bundle on the back; journey-nook.js applies it when the nook next opens.
   "Leave it where it lay" writes nothing. The land has no store access, so nothing else is saved here.
   Usage: const road = mountRoad(THREE, L, { hang }); L = the land's context ({ scene, me }), hang = the Object3D the
   bundle rides on (the figure's bag/back). */

export const FEEL = {
  wood: { name: "joy", light: 0x6fae5a, cloth: 0x3f7a34, ink: "#2f6a2a" },
  fire: { name: "anger", light: 0xe0663a, cloth: 0xb0401e, ink: "#b23a18" },
  earth: { name: "calm", light: 0xc9a35a, cloth: 0x9a7432, ink: "#7a5420" },
  metal: { name: "fear", light: 0xc8ccd4, cloth: 0x8a909c, ink: "#55585e" },
  water: { name: "sadness", light: 0x4f8fd0, cloth: 0x2c5f9e, ink: "#1f4f96" },
};
export const PICKUP_KEY = "hj-pickup";
/* the winding stretch across the clearing (z 9.4 to -2.5) hands over, by z -7, to the path out of the ring, which
   runs along x = -0.25 (-z - 6.6) (land.js's clearingPath) to the Gatehouse at about z -15. The sine fades into the
   line, so the way and its slope stay continuous. */
const WIND = z => 0.5 * Math.sin((z - 6.24) * 0.6);
export const roadX = z => {
  if (z >= -2.5) return WIND(z);
  const u = Math.min(1, (-2.5 - z) / 4.5), t = u * u * (3 - 2 * u);
  return WIND(z) * (1 - t) + -0.25 * Math.max(0, -z - 6.6) * t;
};
export const Z0 = 9.4, Z1 = -14.6, HALF = 0.5, LIT = [4.2, 5.6], Z_LIGHTS = -2.5;
const LETTER_Z = 3.4, TAG_MAX = 140;

const TAG_CSS = `.hjt-veil{position:fixed;inset:0;z-index:50;background:rgba(8,10,9,.62);display:flex;align-items:flex-end;justify-content:center}
.hjt-veil .jt{position:relative;width:min(92vw,380px);margin-bottom:calc(18px + env(safe-area-inset-bottom,0px));filter:drop-shadow(0 14px 26px rgba(0,0,0,.55));transform-origin:8% 50%;animation:hjswing .5s cubic-bezier(.2,.9,.3,1.2) both}
@keyframes hjswing{from{transform:translateY(30px) rotate(-6deg);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.hjt-veil .jt{animation:none}}
.jt .tgp{background:#eedfbd radial-gradient(130% 120% at 70% 20%,#f6ead0 0,#ead8b0 55%,#dcc493 100%);clip-path:polygon(0 18%,11% 0,100% 0,100% 100%,11% 100%,0 82%);padding:18px 22px 16px 64px;color:#2e1d10;min-height:220px;display:grid;gap:6px}
.jt .hole{position:absolute;left:22px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#3a2a1e;box-shadow:inset 0 0 0 3px #c9ad78,inset 0 2px 3px #000}
.jt .cord{position:absolute;left:-40px;top:calc(50% - 2px);width:72px;height:4px;border-radius:2px;background:repeating-linear-gradient(60deg,#d9c49a 0 3px,#b39a6c 3px 6px);transform:rotate(-8deg);transform-origin:right center}
.jt h2{font:600 2rem/1 'Caveat','Segoe Print',cursive;margin:0 0 2px}
.jt .lb{font:italic 500 .98rem/1.1 'Cormorant Garamond',Georgia,serif;color:#6a4a2c;margin:4px 0 0}
.jt input{font:400 1.3rem/1.2 'Caveat','Segoe Print',cursive;color:#2e1d10;background:none;border:0;border-bottom:1px solid #c9ae7c;min-height:30px;padding:0 2px;width:100%;outline:none}
.jt input:focus{border-bottom-color:#6a4a2c}
.jt .wr{font:italic 500 1.12rem/1.3 'Cormorant Garamond',Georgia,serif;color:#5a3a26;min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-decoration-color:#c9ae7c;text-underline-offset:5px;background:none;border:0;padding:0;cursor:pointer}
.jt .wr[disabled]{opacity:.45;cursor:default}
.jt .seals{display:flex;gap:6px;margin:2px 0 4px}
.jt .seals .s{display:grid;justify-items:center;gap:2px;font:italic 500 .82rem/1 'Cormorant Garamond',Georgia,serif;color:#6a4a2c;background:none;border:0;padding:0;cursor:pointer;min-width:44px}
.jt .seals .w{width:40px;height:40px;border-radius:47% 53% 50% 50%/52% 48% 52% 48%;box-shadow:inset 0 0 0 4px rgba(0,0,0,.12),inset 0 0 0 7px rgba(255,255,255,.12),inset -3px -5px 8px rgba(0,0,0,.3),0 2px 3px rgba(0,0,0,.35)}
.jt .seals .on .w{transform:scale(.92);box-shadow:inset 0 3px 6px rgba(0,0,0,.55),inset 0 0 0 4px rgba(0,0,0,.2),0 0 0 3px #eedfbd,0 0 0 5px var(--ink,#1f4f96)}
.jt .seals .on{color:var(--ink,#1f4f96);font-weight:600}
.jt .acts{display:grid;justify-items:start;margin-top:4px}`;

const hex = n => "#" + n.toString(16).padStart(6, "0");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function mountRoad(THREE, L, { hang = null, onPick = null, onLeave = null } = {}) {
  const scene = L.scene;
  const canvasTex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function clothTex(h) {
    return canvasTex(128, 128, (c, w, hh) => {
      c.fillStyle = "#" + new THREE.Color(h).getHexString(); c.fillRect(0, 0, w, hh);
      for (let y = 0; y < hh; y += 3) { c.fillStyle = `rgba(0,0,0,${0.04 + rnd() * 0.05})`; c.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 3) { c.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.03})`; c.fillRect(x, 0, 1, hh); }
    });
  }
  /* the bundle, as journey-nook.js draws it */
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
    const cord = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 18), new THREE.MeshStandardMaterial({ color: 0xd9c49a, roughness: 0.8 })); cord.rotation.x = Math.PI / 2; cord.position.y = 0.15; g.add(cord);
    const tagTex = canvasTex(96, 64, (c, w, h) => { c.fillStyle = "#efe2c4"; c.fillRect(0, 0, w, h); c.fillStyle = "#b9a888"; c.beginPath(); c.arc(12, h / 2, 5, 0, 7); c.fill();
      c.strokeStyle = f.ink; c.lineWidth = 3; c.lineCap = "round"; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(26, 18 + i * 13); for (let x = 26; x < 26 + 50 - i * 12; x += 6) c.lineTo(x, 18 + i * 13 + Math.sin(x * 0.7 + i) * 2); c.stroke(); } });
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.04), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xfff0d0, emissiveMap: tagTex, emissiveIntensity: 0.25 }));
    tag.position.set(0.055, 0.115, 0.07); tag.rotation.set(0.15, -0.5, 0.35); g.add(tag);
    g.scale.setScalar(k); return g;
  }

  /* ground height: the terrain plane (160 m PlaneGeometry shaped by land.js groundH); grass, trees and roots never count */
  const ray = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0);
  let solids = null;
  function groundAt(x, z) {
    if (!solids) { solids = []; scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === "PlaneGeometry" && o.geometry.parameters.width === 160) solids.push(o); }); }
    ray.set(new THREE.Vector3(x, 4, z), DOWN); const hits = ray.intersectObjects(solids, false);
    return hits.length ? hits[0].point.y : 0.08;
  }

  /* ---------- the road ---------- */
  const road = new THREE.Group(); road.name = "hj-road"; scene.add(road);
  {
    const n = 240, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) { const z = Z0 + (Z1 - Z0) * i / n, x = roadX(z), dx = (roadX(z + 0.01) - x) / 0.01, nl = Math.hypot(1, dx);
      for (const s of [-1, 1]) { const px = x + s * HALF / nl, pz = z - s * HALF * dx / nl; pos.push(px, groundAt(px, pz) + 0.025, pz); uv.push(s < 0 ? 0 : 1, i / n * 24); } }
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = canvasTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "rgba(206,174,124,0)"); g.addColorStop(0.18, "rgba(206,174,124,.95)"); g.addColorStop(0.82, "rgba(206,174,124,.95)"); g.addColorStop(1, "rgba(206,174,124,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? "60,44,30" : "170,140,100"},${0.15 + rnd() * 0.2})`; c.fillRect(8 + rnd() * (w - 16), rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } });
    tex.wrapT = THREE.RepeatWrapping;
    road.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, depthWrite: false, emissive: 0x6a4a26, emissiveIntensity: 0.7 })));
  }
  {
    const warm = new THREE.MeshStandardMaterial({ color: 0x8c7a64, roughness: 0.85, emissive: 0xffa04a, emissiveIntensity: 0.3, flatShading: true });
    const wood = new THREE.MeshStandardMaterial({ color: 0x6f8a62, roughness: 0.85, emissive: FEEL.wood.light, emissiveIntensity: 0.4, flatShading: true });
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let z = Z0 - 0.2; z > Z1; z -= 0.42 + r() * 0.12) {
      const x = roadX(z), dx = (roadX(z + 0.01) - x) / 0.01, nl = Math.hypot(1, dx), lit = z > LIT[0] && z < LIT[1];
      for (const sd of [-1, 1]) { const rr = 0.055 + r() * 0.035, px = x + sd * (HALF + 0.04) / nl, pz = z - sd * (HALF + 0.04) * dx / nl;
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), lit ? wood : warm); m.scale.set(1.2, 0.62, 1); m.rotation.set(r(), r() * 6, r()); m.position.set(px, groundAt(px, pz) + rr * 0.35, pz); road.add(m); }
    }
    for (let z = Z0 - 1.2; z > Z_LIGHTS; z -= 2.4) { const lit = z > LIT[0] && z < LIT[1]; const pl = new THREE.PointLight(lit ? FEEL.wood.light : 0xffa860, lit ? 1.6 : 1.2, 2.8, 1.6); pl.position.set(roadX(z), 0.35, z); road.add(pl); }
    const pl = new THREE.PointLight(FEEL.wood.light, 1.8, 2.8, 1.6); pl.position.set(roadX(4.9), 0.4, 4.9); road.add(pl);
  }

  /* ---------- the letter in the verge ---------- */
  const LETTER = new THREE.Vector3(roadX(LETTER_Z) + 0.78, 0, LETTER_Z);
  const letter = new THREE.Group(); letter.name = "hj-letter"; scene.add(letter);
  {
    const tex = canvasTex(192, 128, (c, w, h) => { c.fillStyle = "#e9dfc9"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(90,70,50,.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, h * 0.52); c.lineTo(w, h * 0.48); c.stroke();
      c.strokeStyle = "rgba(60,45,35,.55)"; c.lineWidth = 2.2; for (let i = 0; i < 5; i++) { const y = 18 + i * 20 + (i > 2 ? 8 : 0); c.beginPath(); c.moveTo(18, y); for (let x = 18; x < 150 - (i % 3) * 22; x += 7) c.lineTo(x, y + Math.sin(x * 0.5 + i) * 1.6); c.stroke(); } });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.25, 4, 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xfff4e0, emissiveMap: tex, emissiveIntensity: 0.35 }));
    const pp = paper.geometry.attributes.position; for (let i = 0; i < pp.count; i++) pp.setZ(i, Math.abs(pp.getY(i)) * -0.18 + 0.016);
    paper.geometry.computeVertexNormals();
    paper.rotation.set(-Math.PI / 2 + 0.32, 0, 0.5); paper.position.y = 0.07; letter.add(paper);
    const glow = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, "rgba(255,252,240,.95)"); g.addColorStop(0.25, "rgba(255,248,230,.45)"); g.addColorStop(1, "rgba(255,248,230,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(255,255,250,.7)"; c.lineWidth = 2; c.beginPath(); c.moveTo(64, 14); c.lineTo(64, 114); c.moveTo(14, 64); c.lineTo(114, 64); c.stroke(); });
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glint.scale.setScalar(0.7); glint.position.set(0.04, 0.2, 0); letter.add(glint);
    const pl = new THREE.PointLight(0xfff6e6, 1.4, 1.8, 1.5); pl.position.set(0, 0.3, 0); letter.add(pl);
    const blade = new THREE.MeshStandardMaterial({ color: 0x4f6a30, roughness: 0.9, side: THREE.DoubleSide });
    let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.16 + r() * 0.14), blade); const a = r() * 6.28, d = 0.08 + r() * 0.18; b.position.set(Math.cos(a) * d, 0.09, Math.sin(a) * d); b.rotation.set(r() * 0.5 - 0.25, r() * 3, r() * 0.6 - 0.3); letter.add(b); }
    letter.position.set(LETTER.x, groundAt(LETTER.x, LETTER.z), LETTER.z);
  }

  /* ---------- the bundle on the pack, shown once the letter is picked up ---------- */
  let carried = null;
  function carry(feeling) {
    if (carried && carried.parent) carried.parent.remove(carried);
    carried = bundle(feeling, 1.9); carried.name = "hj-carried"; carried.position.set(0, 0.2, -0.02); carried.rotation.set(0.15, 0.3, 0);
    if (hang) hang.add(carried);
  }

  /* ---------- the tag card ---------- */
  let veil = null, taken = false;
  function close() { if (veil) { veil.remove(); veil = null; } }
  function card() {
    if (veil || taken) return;
    if (!document.getElementById("hjt-css")) { const st = document.createElement("style"); st.id = "hjt-css"; st.textContent = TAG_CSS; document.head.appendChild(st); }
    let pick = null;
    veil = document.createElement("div"); veil.className = "hjt-veil";
    const seals = Object.entries(FEEL).map(([k, f]) => `<button type="button" class="s" data-f="${k}" aria-pressed="false" style="--ink:${f.ink}"><span class="w" style="background:radial-gradient(circle at 38% 34%,${hex(f.light)},${hex(f.cloth)} 55%,#0000 140%),${hex(f.cloth)}"></span>${f.name}</button>`).join("");
    veil.innerHTML = `<div class="jt" role="dialog" aria-label="Something you found"><span class="cord" aria-hidden="true"></span><div class="tgp">
      <h2 data-h style="color:#6a4a2c">a letter</h2>
      <p class="lb">what set it off</p><input data-k="setOff" maxlength="${TAG_MAX}" aria-label="What set it off">
      <p class="lb">where it sits in the body</p><input data-k="body" maxlength="${TAG_MAX}" aria-label="Where it sits in the body">
      <p class="lb">which feeling is it</p><div class="seals" role="group" aria-label="Which feeling">${seals}</div>
      <div class="acts"><button type="button" class="wr" data-take disabled>Put it in the pack</button><button type="button" class="wr" data-leave style="color:#8a6a4a">Leave it where it lay</button></div>
      </div><span class="hole" aria-hidden="true"></span></div>`;
    const take = veil.querySelector("[data-take]"), h2 = veil.querySelector("[data-h]");
    veil.addEventListener("click", e => {
      const s = e.target.closest(".s");
      if (s) { pick = s.dataset.f; veil.querySelectorAll(".s").forEach(b => { const on = b === s; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
        h2.textContent = FEEL[pick].name; h2.style.color = FEEL[pick].ink; take.disabled = false; return; }
      if (e.target.closest("[data-leave]")) { close(); onLeave && onLeave(); return; }
      if (e.target.closest("[data-take]") && pick && !take.disabled) {
        const v = k => veil.querySelector(`[data-k="${k}"]`).value.trim().slice(0, TAG_MAX);
        const obj = { id: "hj-" + Date.now().toString(36), feeling: pick, setOff: v("setOff"), body: v("body"), pickedOn: new Date().toISOString().slice(0, 10), state: "carried" };
        try { sessionStorage.setItem(PICKUP_KEY, JSON.stringify(obj)); } catch (_) { /* private mode: the bundle is carried this visit only */ }
        taken = true; letter.visible = false; carry(pick); close(); onPick && onPick(obj);
      }
    });
    document.body.appendChild(veil);
  }

  return {
    road, letter, LETTER, roadX, FEEL,
    /* does a ground point lie on the road, with a verge of `pad` metres? Widens the clearing's walkable test. */
    onRoad(x, z, pad = 0.9) { return z < Z0 + 0.5 && z > Z1 - 0.5 && Math.abs(x - roadX(z)) < HALF + pad; },
    nearLetter(x, z, r = 1.1) { return !taken && Math.hypot(x - LETTER.x, z - LETTER.z) < r; },
    card, close, carry, get taken() { return taken; },
    show({ road: r = true, letter: l = !taken } = {}) { road.visible = r; letter.visible = l; },
  };
}

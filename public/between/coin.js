/* The coin turn at the hearth (spec .specify/specs/ember-to-vibeulon FR-010 to FR-012; mechanic canon/mechanics/coin-turn.yaml in
   Six-faces-council; look ee2-vibeulon-choose-look-1). The bare coin your BAR minted sits on a small brass turntable. Touch a filament
   spool to colour it, a material block to give it its surface; each touch turns the coin once in 0.5 s and the new face comes round at
   the half turn. Touch the coin to set it down: it drops toward the pouch and the turntable folds away. No words on the game layer.
   A coin made procedurally from the blank's measurements (no STL here): hex 34.6 mm corner to corner, 4 mm thick, 5.5 mm hole.
   Reduced motion: the coin changes in place and fades into the pouch. A later mint never opens this (the server copies the style). */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { COLORS, MATS, FILAMENT, SURFACE, ELEMENT, TURN, BODY, firstPick, touch, canSetDown, turnAt, ease, swapsAt } from "./coin-data.js";

const BRASS = "#b8914a", BRASS_LO = "#5e4520";
const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

function bodyGeometry() {
  const R = BODY.corner / 2, s = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? s.lineTo(R * Math.cos(a), R * Math.sin(a)) : s.moveTo(R, 0); }
  const h = new THREE.Path(); h.absarc(0, 0, BODY.hole / 2 + 1, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth: BODY.thick - 0.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 24 });
  g.rotateX(-Math.PI / 2); g.translate(0, 0.4, 0); // lies flat, top face up
  return g;
}
function bodyMaterial(color, mat) {
  const [a, b] = FILAMENT[color], m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(a).lerp(new THREE.Color(b), 0.5), envMapIntensity: 0.8, ...SURFACE[mat] });
  if (mat === "resin") { m.thickness = 4; m.ior = 1.5; m.attenuationColor = new THREE.Color(b); m.attenuationDistance = 6; }
  if (mat === "walnut") m.color = new THREE.Color("#5a3720").lerp(new THREE.Color(a), 0.25);
  if (mat === "porcelain") m.color = new THREE.Color("#ece6da").lerp(new THREE.Color(a), 0.12);
  return m;
}
function coinMesh(face) {
  const g = new THREE.Group(), body = new THREE.Mesh(bodyGeometry(), bodyMaterial(face.color, face.mat)); body.castShadow = body.receiveShadow = true; g.userData.body = body; g.add(body);
  // the ember's ring (from element) and the arrival element's inlay: only drawn when the coin has them (a coin made outside the Between shows the blank's chevrons)
  const top = BODY.thick + 0.02;
  if (face.ring && ELEMENT[face.ring]) { const r = new THREE.Mesh(new THREE.TorusGeometry(11.6, 0.7, 8, 96), new THREE.MeshStandardMaterial({ color: ELEMENT[face.ring], emissive: ELEMENT[face.ring], emissiveIntensity: 0.25, roughness: 0.5, toneMapped: false })); r.rotation.x = Math.PI / 2; r.position.y = top; g.add(r); }
  const bez = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 6), new THREE.MeshStandardMaterial({ color: face.tex && ELEMENT[face.tex] ? ELEMENT[face.tex] : "#6b6558", roughness: 0.5, toneMapped: face.tex ? false : true })); bez.position.set(0, top + 0.2, 13); g.add(bez);
  return g;
}
const brass = (r = 0.35) => new THREE.MeshPhysicalMaterial({ color: BRASS, metalness: 1, roughness: r });
const dark = () => new THREE.MeshPhysicalMaterial({ color: BRASS_LO, metalness: 1, roughness: 0.45 });
function spool(color) {
  const g = new THREE.Group(), [a, b] = FILAMENT[color];
  const fil = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 6.4, 40), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(a).lerp(new THREE.Color(b), 0.5), metalness: 0.45, roughness: 0.3, clearcoat: 0.35 })); g.add(fil);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.8, 32), dark()); f.position.y = s * 3.6; g.add(f); }
  g.rotation.z = Math.PI / 2; g.userData = { kind: "color", id: color }; return g;
}
function block(mat) {
  const g = new THREE.Group(), geo = new THREE.BoxGeometry(8.4, 8.4, 8.4, 4, 4, 4);
  const m = new THREE.Mesh(geo, bodyMaterial(mat === "silk" || mat === "resin" ? "pearl" : "violet", mat)); m.rotation.y = 0.5; g.add(m);
  if (mat === "walnut") m.material.color = new THREE.Color("#7a4c2a"); if (mat === "brass") m.material.color = new THREE.Color("#c9a24a"); if (mat === "matte") m.material.color = new THREE.Color("#56544f");
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 4, 12), brass()); pin.position.y = -6.2; g.add(pin);
  g.userData = { kind: "mat", id: mat }; return g;
}
const turntable = () => { const g = new THREE.Group(), p = new THREE.Mesh(new THREE.CylinderGeometry(27, 27.5, 2.6, 80), brass(0.42)); p.position.y = -1.6; g.add(p);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(14, 17, 4, 48), dark()); foot.position.y = -4.9; g.add(foot);
  for (const r of [9, 17, 23]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 6, 72), dark()); t.rotation.x = Math.PI / 2; t.position.y = -0.28; g.add(t); } return g; };

/* open: { gardenId, vibulonId?, face?, style?, demo?, onDone? }. With vibulonId the coin is that bare coin and setting down finishes it;
   without, the turn changes the style for the next coins. demo writes nothing (a preview). Resolves with the style set down, or null on Esc. */
export function openCoinTurn(opts = {}) {
  return new Promise(resolve => {
    const pick0 = firstPick(opts.style);
    let pick = { ...pick0 }, shown = { ...pick0 }, turning = null, leaving = null, done = false, hover = null;
    const root = document.createElement("div");
    root.id = "coinTurn"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Turn your coin");
    root.style.cssText = "position:fixed;inset:0;z-index:60;background:rgba(20,12,8,.78);touch-action:none;transition:opacity .4s";
    document.body.appendChild(root);
    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true }); rend.setPixelRatio(Math.min(2, devicePixelRatio || 1)); rend.toneMapping = THREE.ACESFilmicToneMapping; rend.shadowMap.enabled = true;
    rend.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block"; root.appendChild(rend.domElement);
    const pm = new THREE.PMREMGenerator(rend), sc = new THREE.Scene(); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    const key = new THREE.DirectionalLight("#ffd9b0", 2.4); key.position.set(-60, 120, 70); key.castShadow = true; sc.add(key);
    sc.add(new THREE.HemisphereLight("#ffe6cc", "#2a1408", 0.4));
    const table = turntable(); sc.add(table);
    const rails = new THREE.Group(); sc.add(rails); const items = [];
    COLORS.forEach((c, i) => { const s = spool(c); s.position.set(-36 - (i % 2) * 6, 3, -(i - 2.5) * 11); rails.add(s); items.push(s); });
    MATS.forEach((m, i) => { const b = block(m); b.position.set(36 + (i % 2) * 6, 4, -(i - 2.5) * 11); rails.add(b); items.push(b); });
    const pivot = new THREE.Group(); sc.add(pivot); let coin = null;
    const face = () => ({ ring: (opts.face && opts.face.ring) || null, tex: (opts.face && opts.face.tex) || null, color: shown.color, mat: shown.mat });
    const rebuild = () => { if (coin) { pivot.remove(coin); coin.traverse(o => { o.geometry && o.geometry.dispose(); }); } coin = coinMesh(face()); pivot.add(coin); };
    rebuild();
    const cam = new THREE.PerspectiveCamera(30, 1, 1, 1000), size = () => { const w = innerWidth, h = innerHeight; rend.setSize(w, h); cam.aspect = w / h; const d = Math.max(150, 130 / Math.min(1, cam.aspect) * 1.25); cam.position.set(0, d * 0.75, d * 0.8); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); };
    size(); addEventListener("resize", size);
    // the coin is in the hand before anything is asked: it rises onto the turntable
    const t0 = performance.now(); let raf = 0;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      const rise = reduced() ? 1 : Math.min(1, (now - t0) / 500);
      pivot.position.y = (1 - ease(rise)) * 14 + 1;
      if (turning) {
        const t = turnAt((now - turning.at) / 1000);
        pivot.rotation.y = (reduced() ? 0 : ease(t)) * Math.PI * 2;
        if (!turning.swapped && (reduced() || swapsAt(t))) { shown = { ...pick }; rebuild(); turning.swapped = true; }
        if (t >= 1) { pivot.rotation.y = 0; turning = null; }
      } else if (!leaving) pivot.rotation.y += 0.004;
      if (leaving) {
        const t = turnAt((now - leaving.at) / 1000, 0.6);
        if (reduced()) root.style.opacity = String(1 - t); else { pivot.position.y -= t * 22; pivot.position.x += t * 14; pivot.position.z += t * 40; root.style.opacity = String(1 - t * t); }
        table.visible = rails.visible = !(t > 0.2);
        if (t >= 1) return finish(leaving.style);
      }
      for (const it of items) it.scale.setScalar(it === hover ? 1.08 : (it.userData.kind === "color" ? pick.color : pick.mat) === it.userData.id ? 1.12 : 1);
      rend.render(sc, cam);
    };
    raf = requestAnimationFrame(frame);
    function finish(style) { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("keydown", onKey); rend.dispose(); root.remove(); resolve(style); if (opts.onDone) opts.onDone(style); }
    const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
    const hit = ev => { const r = rend.domElement.getBoundingClientRect(); pt.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, cam);
      const h = ray.intersectObjects([...items, pivot], true)[0]; if (!h) return null; let o = h.object; while (o && !(o.userData && o.userData.kind) && o !== pivot && o.parent) o = o.parent; return o; };
    rend.domElement.addEventListener("pointermove", ev => { hover = (() => { const o = hit(ev); return o && o.userData && o.userData.kind ? o : null; })(); rend.domElement.style.cursor = hover || hit(ev) ? "pointer" : "default"; });
    rend.domElement.addEventListener("click", ev => {
      if (leaving || done) return; const o = hit(ev); if (!o) return;
      if (o === pivot) return setDown();
      const next = touch(pick, o.userData.kind, o.userData.id); if (next === pick || (next.color === pick.color && next.mat === pick.mat)) return;
      pick = next; turning = { at: performance.now(), swapped: false };
    });
    // the accessible way to every touch, without words: a row of labelled buttons for keys and screen readers (visually hidden)
    const kb = document.createElement("div"); kb.style.cssText = "position:absolute;left:-9999px";
    [...COLORS.map(c => ["color", c]), ...MATS.map(m => ["mat", m]), ["down", "set it down"]].forEach(([k, id]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = k === "down" ? id : `${k} ${id}`;
      b.onclick = () => (k === "down" ? setDown() : (!leaving && (pick = touch(pick, k, id), turning = { at: performance.now(), swapped: false }))); kb.appendChild(b); }); root.appendChild(kb);
    const onKey = ev => { if (ev.key === "Escape" && !leaving) finish(null); }; addEventListener("keydown", onKey);
    async function setDown() {
      if (leaving || !canSetDown(pick)) return;
      let ok = true;
      if (!opts.demo) {
        try {
          const body = { color: pick.color, mat: pick.mat }; if (opts.vibulonId) body.vibulonId = opts.vibulonId;
          const res = await fetch(`/api/between/${opts.gardenId}/coin`, { method: "PUT", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          ok = res.ok || res.status === 409; // 409 face_set: the coin is already finished, nothing more to do
        } catch { ok = false; }
      }
      if (!ok) { root.animate && root.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 200 }); return; } // nothing kept; touch the coin to try again
      leaving = { at: performance.now(), style: { ...pick } };
    }
    if (opts.preview) window.__coinTurn = { pick: () => ({ ...pick }), shown: () => ({ ...shown }), touch: (k, id) => { pick = touch(pick, k, id); turning = { at: performance.now(), swapped: false }; }, setDown };
  });
}

export function mount(B, opts = {}) {
  const api = { open: (o = {}) => openCoinTurn({ gardenId: (B.ids && B.ids().gardenId) || null, ...o }) };
  // ?coin=demo (previews): a bare demo coin, nothing written
  if (opts.demo) setTimeout(() => api.open({ demo: true, preview: true, face: { ring: "fire", tex: "earth" } }), 1500);
  return api;
}

/* Found lights (Friendcraft's game at stage 1; canon/mechanics/found-lights.yaml; FR-018). Apart, across days: walk to the jar
   shelf by the hearth, set down a jar holding one thing that caught your eye today, and open the jar your friend left. A jar
   waits covered in its leaver's colour and never dims or spoils; opening it lifts the cloth and sends its motes once round the
   hollow. Six jars at once, three a side; the oldest opened jar moves to the lower shelf. */
import { JAR_OFFERED, JAR_SIDE_MAX, LINE_MAX, COPY, validColour, hash, rng } from "./core.js";

const SHELF = { x: 5.0, z: 0.4 }, FACE = Math.atan2(-5.0, -0.4);   // hollow.js: the shelf unit against the wall, facing the room
const TIER_UP = 0.79, TIER_LOW = 0.09, ZF = 0.19;
const SWATCH = ["#e0603c", "#e8a33c", "#e6d65a", "#6fb35a", "#3e9e93", "#4f7fcf", "#8f3f78", "#d87aa0"];
const TUNE = { lift: 0.4, circle: 2.5 };

export function create(X) {
  const { THREE, scene } = X;
  const G = new THREE.Group(); G.name = "found-lights"; G.position.set(SHELF.x, 0, SHELF.z); G.rotation.y = FACE; scene.add(G);
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const glass = new THREE.MeshStandardMaterial({ color: 0xdfeef0, transparent: true, opacity: 0.34, roughness: 0.15, depthWrite: false });
  const geoJar = new THREE.CylinderGeometry(0.058, 0.064, 0.125, 14), geoCloth = new THREE.CylinderGeometry(0.036, 0.074, 0.06, 12);
  const jars = new Map(); // item id -> { grp, cloth, glow, base, item, openT, motes }
  const reduce = !!(matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let form = null, shown = null, shownAt = 0, sig = "";

  const colourOf = it => it.what === "colour" && validColour(it.text) ? it.text : null;

  /* Which jar stands where: each friend has a side (whoever started on the left), newest three up top, older opened ones below. */
  function layout(items, g) {
    const first = g && g.startedBy, spots = new Map();
    const mine = { 0: [], 1: [] };
    for (const it of items) if (it.kind === "jar") mine[it.by === first ? 0 : 1].push(it);
    for (const side of [0, 1]) {
      const arr = mine[side].sort((a, b) => (b.at || 0) - (a.at || 0));
      arr.slice(0, JAR_SIDE_MAX).forEach((it, k) => spots.set(it.id, { x: (side === 0 ? -1 : 1) * (0.22 + k * 0.2), y: TIER_UP }));
      arr.slice(JAR_SIDE_MAX).filter(it => it.status === "opened").slice(0, 3).forEach((it, k) => spots.set(it.id, { x: (side === 0 ? -1 : 1) * (0.22 + k * 0.2), y: TIER_LOW }));
    }
    return spots;
  }

  function build(it, spot, hue) {
    const grp = new THREE.Group(); grp.position.set(spot.x, spot.y, ZF); G.add(grp);
    const jar = new THREE.Mesh(geoJar, glass); jar.position.y = 0.0625; grp.add(jar);
    const col = new THREE.Color(it.what === "colour" && colourOf(it) ? colourOf(it) : "#ffd89a");
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(0.34); glow.position.y = 0.07; grp.add(glow);
    const cloth = new THREE.Mesh(geoCloth, new THREE.MeshStandardMaterial({ color: hue, roughness: 0.95 })); cloth.position.y = 0.14; grp.add(cloth);
    const motes = [];
    for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(0.07); scene.add(sp); motes.push(sp); }
    return { grp, cloth, glow, motes, item: it, openT: null, seed: hash(it.id) };
  }

  function sync() {
    const items = X.items(), g = X.g();
    const key = JSON.stringify(items.filter(i => i.kind === "jar").map(i => [i.id, i.status, i.by, i.at])) + (g && g.startedBy);
    if (key === sig) return; sig = key;
    const spots = layout(items, g), want = new Set();
    for (const it of items) {
      if (it.kind !== "jar" || !spots.has(it.id)) continue;
      want.add(it.id);
      let j = jars.get(it.id);
      if (!j) { j = build(it, spots.get(it.id), new THREE.Color(X.hue(it.by))); jars.set(it.id, j); j.first = true; }
      const sp = spots.get(it.id); j.grp.position.set(sp.x, sp.y, ZF);
      const was = j.item; j.item = it;
      if (it.status === "opened" && !j.opened) { j.opened = true; if (was.status === "left" && !j.first) j.openT = performance.now() / 1000; else j.cloth.visible = false; } // the other phone sees the cloth lift if it is here when you open it
      j.first = false;
    }
    for (const [id, j] of jars) if (!want.has(id)) { G.remove(j.grp); for (const m of j.motes) scene.remove(m); jars.delete(id); }
  }

  /* what the card says, from where you stand */
  const shelfPoint = () => { const f = new THREE.Vector3(Math.sin(FACE), 0, Math.cos(FACE)); return { x: SHELF.x + f.x * 1.1, z: SHELF.z + f.z * 1.1 }; };
  function near() { const p = X.player(), s = shelfPoint(); return p && Math.hypot(p.x - s.x, p.z - s.z) < 1.9; }
  function waitingFor() { const me = X.me(); return X.items().filter(i => i.kind === "jar" && i.status === "left" && i.by !== me).sort((a, b) => a.at - b.at)[0] || null; }
  function mySide() { const me = X.me(), g = X.g(); const mine = X.items().filter(i => i.kind === "jar" && i.by === me).sort((a, b) => b.at - a.at).slice(0, JAR_SIDE_MAX); return mine; }
  const canLeave = () => mySide().filter(i => i.status === "left").length < JAR_SIDE_MAX;

  function open(it) {
    const j = jars.get(it.id), t = performance.now() / 1000;
    X.write("items/" + it.id, "update", { status: "opened", openedAt: X.now(), openedBy: X.me() });
    if (j) { j.openT = t; j.opened = true; }
    shown = it; shownAt = performance.now();
  }

  function leave() {
    if (form) return; if (!canLeave()) return;
    form = document.createElement("form"); form.className = "gm-form";
    const offered = JAR_OFFERED;
    form.innerHTML = `<label class="gm-q" for="gmLine">${COPY.leaveHead}</label>
      <input id="gmLine" type="text" maxlength="${LINE_MAX}" autocomplete="off" enterkeyhint="done">
      <div class="gm-sw" role="group" aria-label="colour">${SWATCH.map(c => `<button type="button" class="gm-c" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}</div>
      <div class="gm-row"><button type="submit" class="gm-go">${COPY.leave}</button><button type="button" class="gm-quiet" data-x>Put it down</button></div>`;
    let colour = null;
    form.addEventListener("click", e => {
      const c = e.target.closest("[data-c]"); if (c) { colour = colour === c.dataset.c ? null : c.dataset.c; for (const b of form.querySelectorAll(".gm-c")) b.classList.toggle("on", b.dataset.c === colour); form.querySelector("#gmLine").value = ""; }
      if (e.target.closest("[data-x]")) closeForm();
    });
    form.querySelector("#gmLine").addEventListener("input", () => { if (form.querySelector("#gmLine").value) { colour = null; for (const b of form.querySelectorAll(".gm-c")) b.classList.remove("on"); } });
    form.addEventListener("submit", e => {
      e.preventDefault(); const text = form.querySelector("#gmLine").value.trim();
      const base = { kind: "jar", by: X.me(), at: X.now(), status: "left" };
      let data = null;
      if (text && offered.includes("line")) data = { ...base, what: "line", text: text.slice(0, LINE_MAX) };
      else if (colour && offered.includes("colour")) data = { ...base, what: "colour", text: colour };
      if (!data) return;
      X.write("items/jar-" + X.me().slice(-6) + "-" + data.at.toString(36), "set", data); closeForm();
    });
    document.body.appendChild(form); setTimeout(() => form && form.querySelector("#gmLine").focus(), 50);
  }
  function closeForm() { if (form) { form.remove(); form = null; } }

  function moment() {
    if (!X.active("found-lights")) return null;
    if (form) return { hold: true, key: "form", actions: [] };
    if (shown && performance.now() - shownAt < 9000) {
      const it = shown, c = colourOf(it);
      return { head: it.what === "line" ? it.text : X.name(it.by) + (c ? "" : ""), sub: it.what === "line" ? "" : "", actions: [{ label: "Walk on", quiet: true, on: () => { shown = null; } }], soft: true, key: "shown:" + it.id, colour: c };
    }
    if (!near()) return null;
    const w = waitingFor();
    if (w) return { head: COPY.jarFor(X.name(w.by)), sub: "", actions: [{ label: COPY.open, on: () => open(w) }, ...(canLeave() ? [{ label: COPY.leave, quiet: true, on: leave }] : [])], soft: true, key: "wait:" + w.id };
    if (canLeave()) return { head: COPY.leaveHead, sub: "", actions: [{ label: COPY.leave, on: leave }], soft: true, key: "leave" };
    return null;
  }

  function frame(T) {
    sync();
    const t = performance.now() / 1000;
    const me = X.me();
    for (const [, j] of jars) {
      const it = j.item, waitingMe = it.status === "left" && it.by !== me;
      const col = it.status === "opened" ? 0.55 : waitingMe ? 0.2 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.6 + j.seed)) : 0.1;
      j.glow.material.opacity += (col - j.glow.material.opacity) * 0.08;
      if (j.openT !== null) {                     // the cloth lifts 0.4 s after the hand reaches the jar, then the motes circle the room
        const e = t - j.openT;
        if (e < TUNE.lift) j.cloth.position.y = 0.14;
        else { const u = Math.min(1, (e - TUNE.lift) / 0.5); j.cloth.position.y = 0.14 + u * 0.5; j.cloth.material.opacity = 1 - u; j.cloth.material.transparent = true; if (u >= 1) j.cloth.visible = false; }
        const r = rng(j.seed), span = TUNE.circle;
        j.motes.forEach((m, i) => {
          const a0 = r() * 6.28, h = 1.1 + r() * 1.3, rad = 2.4 + r() * 1.6, lag = i * 0.06 * (reduce ? 0 : 1);
          const u = (e - TUNE.lift - lag) / span;
          if (reduce || u < 0 || u > 1.2) { m.material.opacity = 0; return; }
          const k = Math.min(1, u), base = j.grp.getWorldPosition(new THREE.Vector3());
          const ang = a0 + k * 6.28, circ = new THREE.Vector3(Math.cos(ang) * rad * 0.9, h, Math.sin(ang) * rad * 0.9);
          const fromJar = Math.min(1, k * 5), toJar = Math.max(0, (k - 0.82) / 0.18);
          const pos = base.clone().lerp(circ, fromJar).lerp(base, toJar);
          m.position.copy(pos); m.material.opacity = 0.9 * Math.sin(Math.min(1, k) * Math.PI);
        });
        if (e > TUNE.lift + span + 1.4) { j.openT = null; for (const m of j.motes) m.material.opacity = 0; }
      }
    }
  }
  function dispose() { closeForm(); scene.remove(G); for (const [, j] of jars) for (const m of j.motes) scene.remove(m); }
  return { frame, moment, dispose, G, canLeave, near, view: () => ({ jars: [...jars.keys()], form: !!form, near: near() }), leave, open, _jars: jars };
}

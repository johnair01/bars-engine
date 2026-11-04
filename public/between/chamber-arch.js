/* The arch of cave stone under the nook's shelf (Six-faces-council block-metabolize, slice 2; stills round
   2026-11-02-block-chamber-3, frame "arch"; his steer on bm-chamber-look-3, "Mix of a and b").

   A low arch of the cave's own stone stands in the nook's wall under the shelf, beside the hearth (cave compost capacity 2:
   the portal from the nook to the cave). Behind it is the keeping chamber (land/chamber.js, /between/land.html?place=chamber),
   where every piece carried home from a block's room stands. Its veil is dim while the chamber is bare, warm once it keeps
   something, and cold, with the block's signs at it (block-room.js mountSigns), while a charge on the map stand is a
   season, because a season fills the chamber itself. Walk up to it and step through. garden.js mounts this in the nook. */
import * as THREE from "three";
import { kept } from "./kept.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function mount(B) {
  let G = null, at = null, veilM = null, light = null, card = null, label = null, cardKey = "", motes = [];
  function build() {
    const a = B.anchors(); if (!a || !a.hearth) return false;
    // the shelf's anchor is (0,0,0) until the store has answered and the shelf is mounted (or for good with the store down), which
    // stood the arch in the middle of the nook; the nook's own shelf spot (calrunia/room-kit.js SHELLS.nook) stands in until then
    const sh = a.shelf && (a.shelf[0] || a.shelf[2]) ? a.shelf : [-1.08, 0, -3.5];
    const P = V(sh[0], 0, sh[2]), out = P.clone().normalize(); at = out.clone().multiplyScalar(P.length() + 0.15);
    G = new THREE.Group(); G.name = "chamber-arch"; B.scene.add(G);
    const t = new THREE.TextureLoader().load("/ontology-game/cave/textures/wet_stone.jpg"); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1);
    const stone = new THREE.MeshStandardMaterial({ color: "#8a7a6e", map: t, roughness: 0.95 });
    const A = new THREE.Group(); A.position.copy(at); A.lookAt(0, 0, 0); G.add(A);
    let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const W = 0.62, Ht = 1.45;
    for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, Ht - W, 0.24), stone); post.position.set(sx * W, (Ht - W) / 2, 0); A.add(post);
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + rnd() * 0.05, 0), stone); r.position.set(sx * (W + 0.08), 0.15 + i * 0.3, 0.05); A.add(r); } }
    const arc = new THREE.Mesh(new THREE.TorusGeometry(W, 0.12, 6, 18, Math.PI), stone); arc.position.y = Ht - W; A.add(arc);
    const shp = new THREE.Shape(); shp.moveTo(-W + 0.1, 0); shp.lineTo(W - 0.1, 0); shp.lineTo(W - 0.1, Ht - W); shp.absarc(0, Ht - W, W - 0.1, 0, Math.PI, false); shp.lineTo(-W + 0.1, 0);
    veilM = new THREE.MeshBasicMaterial({ color: "#2b3440", transparent: true, opacity: 0.95 });
    const veil = new THREE.Mesh(new THREE.ShapeGeometry(shp, 16), veilM); veil.position.z = 0.02; A.add(veil);
    light = new THREE.PointLight("#ffb062", 0, 4, 1.6); light.position.copy(A.localToWorld(V(0, 0.9, 0.6))); G.add(light);
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: "#cfe8ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const base = A.localToWorld(V((rnd() - 0.5) * 1.0, 0.2 + rnd() * 1.1, 0.1 + rnd() * 0.6)); sp.position.copy(base); sp.scale.setScalar(0.05 + rnd() * 0.04); G.add(sp); motes.push({ sp, base, ph: rnd() * 6.28 }); }
    card = document.createElement("div"); card.className = "ctw-card"; card.hidden = true; document.body.appendChild(card);
    card.addEventListener("click", e => { if (e.target.closest("button")) step(); });
    label = document.createElement("div"); label.className = "ca-label"; label.textContent = "The arch · the keeping chamber"; label.hidden = true; document.body.appendChild(label);
    if (!document.getElementById("ca-style")) { const st = document.createElement("style"); st.id = "ca-style";
      st.textContent = ".ca-label{position:fixed;z-index:30;transform:translate(-50%,-100%);font:600 .82rem Marcellus,Georgia,serif;color:#f3ece2;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap}"; document.head.appendChild(st); }
    // a tap on the arch walks you to it, as a tap on the map stand does (a phone has no hover and no way to know to walk up); a tap
    // while you already stand at it steps through
    let down = null;
    B.renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
    B.renderer.domElement.addEventListener("pointerup", e => {
      if (!G || !G.visible || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
      ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), B.camera);
      if (!ray.intersectObject(G, true).length) return;
      if (cardKey) { step(); return; }
      const front = at.clone().setY(0).multiplyScalar(1 - 1.1 / Math.max(1.2, at.length())); B.meState.target = front; B.meState.keys.clear();
    });
    return true;
  }
  const ray = new THREE.Raycaster();
  const step = () => { if (B.ctw && B.ctw.stepThrough) B.ctw.stepThrough("/between/land.html?place=chamber"); else location.href = "/between/land.html?place=chamber"; };
  // what the arch says it holds: cold for a season on the map stand, warm once something is kept, dim when bare
  const mood = () => { const v = B.ctw && B.ctw.view ? B.ctw.view() : null, d = v && v.episode && v.block;
    return d && d.where === "chamber" ? "cold" : kept().length ? "warm" : "bare"; };
  /* a veil is the one flat plane in the room that lights itself (MeshBasicMaterial), so it has to read against the wall's dark:
     the bare one was #2b3440, the wall's own colour, and the arch read as a hole in the wall, not a way through */
  const COL = { cold: ["#3f86bd", "#6fa8ff", 4, 0.8], warm: ["#b3743c", "#ffb062", 3, 0.5], bare: ["#5b7490", "#8aa0b8", 1.2, 0.3] };
  let m = "", seen = 0;
  function frame() {
    requestAnimationFrame(frame);
    const inNook = B.room && B.room().shell === "nook";
    if (!G) { if (inNook && B.anchors && build()) seen = 1; else return; }
    G.visible = inNook; label.hidden = !inNook; if (!inNook) { card.hidden = true; cardKey = ""; cardVoice(""); return; }
    const T = performance.now() / 1000;
    if ((seen++ % 30) === 1 || !m) m = mood();
    const [veil, glow, li, mo] = COL[m];
    veilM.color.lerp(new THREE.Color(veil), 0.05); light.color.set(glow); light.intensity += (li + Math.sin(T * 2.1) * 0.4 - light.intensity) * 0.05;
    for (const x of motes) { x.sp.material.color.set(glow); x.sp.material.opacity = mo * (0.6 + 0.4 * Math.sin(T * 1.3 + x.ph)); x.sp.position.y = x.base.y + Math.sin(T * 0.7 + x.ph) * 0.08; }
    const me = B.meState && B.meState.pos, near = me && Math.hypot(me.x - at.x, me.z - at.z) < 1.5;
    const key = near ? m : "";
    // the name stands over the arch until you are close enough for its card to speak it
    if (near) label.hidden = true; else { const [lx, ly] = B.screenOf(V(at.x, 1.6, at.z)); label.style.left = lx + "px"; label.style.top = ly + "px"; label.hidden = !(lx > 0 && lx < innerWidth && ly > 0 && ly < innerHeight); }
    if (key === cardKey) return; cardKey = key; card.hidden = !key;
    if (!key) { cardVoice(""); return; }
    const text = m === "cold" ? "The cold comes from behind it: a season of it. It has filled the keeping chamber, over what you keep there."
      : m === "warm" ? "Behind it is the keeping chamber. What the cold left when your blocks cleared stands there, each on its own stone."
      : "Behind it is the keeping chamber, still bare. What the cold leaves when a block clears will stand there.";
    card.innerHTML = `<div><b>The arch of cave stone</b><div class="t">${text}</div></div><div class="row"><button type="button">Step through</button></div>`;
    cardVoice(key + ":" + card.innerHTML.length);
  }
  /* The card speaks through the one screen owner (voice.js; charge-world.js does the same for the map stand): a card of its own
     under the nook's near card and the map stand's was hidden by body.voiced-soft whenever one of them spoke, so standing at
     the arch showed nothing. Its name is the headline, its line sits under it, "Step through" is the seal. */
  let voiced = "";
  function cardVoice(k) {
    const vo = B.voice; if (!vo) return;
    if (k === voiced) return; voiced = k;
    if (!k) { vo.quiet("arch"); return; }
    import("./voice.js").then(v => {
      if (voiced !== k) return;
      const mo = v.panelMoment(card, () => card); if (!mo) { vo.quiet("arch"); return; }
      const [x0, y0] = B.screenOf(V(at.x, 0, at.z)), [, y1] = B.screenOf(V(at.x, 1.45, at.z)), h = Math.abs(y0 - y1), w = Math.max(40, h * 0.9);
      vo.say({ ...mo, soft: true, subject: () => ({ l: x0 - w / 2, r: x0 + w / 2, t: Math.min(y0, y1), b: Math.max(y0, y1) }) }, "arch", 2);
    });
  }
  requestAnimationFrame(frame);
  return { at: () => at ? [at.x, at.z] : null, view: () => ({ built: !!G, mood: m, near: !!cardKey }) };
}

/* The walk's story beats on the road (healing journey slice 3, T015 to T019), mounted by land.js behind ?road=1 after
   road.js. One module so land.js only asks four things of it: near(x, z) -> a card key, card(key) -> { key, html },
   act(verb), frame(dt, T). Placeholder asks stand where the story text is private; nothing here writes to storage
   except what road.js already writes, and words leave only by Copy. Usage: mountStory(THREE, L, road) with
   L = { scene, groundH, load(url), hang, figure() }. */

export const ASKS = {
  ember: ["First ask (placeholder).", "Second ask (placeholder).", "Third ask (placeholder)."],
  grey: ["First ask (placeholder).", "Second ask (placeholder).", "Third ask (placeholder)."],
};
export const MINE = ["Your first question (placeholder).", "Your second question (placeholder).", "Your third question (placeholder)."];
export const EMBER = { light: 0xe0663a, cloth: 0xb0401e, ink: "#b23a18" };
export const GREY = { light: 0xc8ccd4, cloth: 0x8a909c };
export const EMBER_Z = -10.2, DOOR_Z = -16.4, ROOM_D = 2.8;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const btn = (act, label) => `<button type="button" data-act="st:${act}">${label}</button>`;
const card = (title, text, ...b) => `<div><b>${title}</b><div class="t">${text}</div></div><div class="row">${b.join("")}</div>`;
const asks = a => `<ol class="asks" style="margin:.2em 0 0 1.1em;padding:0">${a.map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;

export function mountStory(THREE, L, road) {
  const scene = L.scene, rx = road.roadX;
  const S = { ember: "verge", box: "ground", crossed: false, asked: false, spoke: false, blank: "there", set: false, heard: false, mineDone: false, extra: 0 };
  try { S.extra = Math.max(0, Math.min(9, +(sessionStorage.getItem("hj-pack-n") || 0) || 0)); } catch (_) { /* no storage: the pack starts empty */ }
  const qs = new URLSearchParams(location.search);
  if (qs.get("pack")) S.extra = Math.max(S.extra, Math.min(9, +qs.get("pack") || 0));
  const coachHand = qs.get("coach") === "1";
  const part = (g, name) => { g.name = name; scene.add(g); return g; };
  const at = (g, x, z, y = 0) => g.position.set(x, L.groundH(x, z) + y, z);
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.4)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glow = (color, size, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sp.scale.set(size, size, 1); return sp; };

  /* how many things the pack holds: the grey letter, the ember envelope, the box (carried or set down), and any the nook
     reports in sessionStorage "hj-pack-n". Three, or ?coach=1 (the coach's hand), lights the Gatehouse (T015). */
  const packCount = () => (road.taken ? 1 : 0) + (S.ember === "carried" ? 1 : 0) + (S.box === "carried" || S.box === "set" ? 1 : 0) + S.extra;
  const lit = () => packCount() >= 3 || coachHand;

  /* ---------- the ember-sealed envelope, further along the verge (T016) ---------- */
  const EMBER_AT = new THREE.Vector3(rx(EMBER_Z) - 0.8, 0, EMBER_Z);
  const env = part(new THREE.Group(), "hj-ember-envelope");
  {
    const t = (() => { const c = document.createElement("canvas"); c.width = 192; c.height = 128; const x = c.getContext("2d");
      x.fillStyle = "#e9dfc9"; x.fillRect(0, 0, 192, 128); x.strokeStyle = "rgba(90,70,50,.4)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(96, 66); x.lineTo(192, 0); x.stroke();
      x.fillStyle = "#b0401e"; x.beginPath(); x.arc(96, 68, 16, 0, 7); x.fill(); x.strokeStyle = "rgba(255,190,120,.8)"; x.lineWidth = 2; x.beginPath(); x.arc(96, 68, 9, 0, 7); x.stroke();
      const k = new THREE.CanvasTexture(c); k.colorSpace = THREE.SRGBColorSpace; return k; })();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffe2b0, emissiveMap: t, emissiveIntensity: 0.4 }));
    paper.rotation.set(-Math.PI / 2 + 0.2, 0, -0.4); paper.position.y = 0.06; env.add(paper);
    const g = glow(EMBER.light, 0.9, 0.7); g.position.set(0, 0.22, 0); env.add(g);
    const pl = new THREE.PointLight(EMBER.light, 1.6, 2.6, 1.5); pl.position.set(0, 0.3, 0); env.add(pl);
    at(env, EMBER_AT.x, EMBER_AT.z);
  }

  /* ---------- small builders ---------- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 0.95 }), woodDark = new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 0.95 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x77746c, roughness: 1 });
  const box3 = (w, h, d, m, x, y, z, parent) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const paperTex = (lines, seal, ink = "#3a2a1c") => { const c = document.createElement("canvas"); c.width = 256; c.height = 176; const x = c.getContext("2d");
    x.fillStyle = "#eadfc6"; x.fillRect(0, 0, 256, 176);
    if (lines) { x.fillStyle = ink; for (let i = 0; i < lines; i++) x.fillRect(28, 38 + i * 30, 150 + (i % 2) * 40, 5); }
    else { x.strokeStyle = "rgba(90,70,50,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(128, 92); x.lineTo(256, 0); x.stroke(); }
    if (seal) { x.fillStyle = seal; x.beginPath(); x.arc(128, 96, 18, 0, 7); x.fill(); }
    const k = new THREE.CanvasTexture(c); k.colorSpace = THREE.SRGBColorSpace; return k; };
  const sheet = (tex, w = 0.44, d = 0.3) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; return m; };

  /* ---------- the Gatehouse: its light through the haze from the ember envelope on (T016, T015); the building (T017) ---------- */
  const GX = rx(DOOR_Z), gate = part(new THREE.Group(), "hj-gatehouse");
  const hazeLight = new THREE.PointLight(0xffd9a0, 0, 9, 1.4); hazeLight.position.set(GX, 2.0, DOOR_Z - 0.6); gate.add(hazeLight);
  const beacon = glow(0xffe0a8, 5.5, 0.18); beacon.position.set(GX, 2.1, DOOR_Z - 0.4); gate.add(beacon);
  const inner = new THREE.PointLight(0xffc27a, 0, 7, 1.6); inner.position.set(GX, 1.9, DOOR_Z - 1.2); gate.add(inner);
  const HW = 2.0, WH = 2.5, GY = L.groundH(GX, DOOR_Z) + 0.02, wallMats = [];
  const house = new THREE.Group(); house.position.set(GX, GY, DOOR_Z); gate.add(house);
  const wm = () => { const m = wood.clone(); m.transparent = true; wallMats.push(m); return m; };
  box3(2 * HW + 0.4, 0.7, ROOM_D + 0.4, stone, 0, -0.3, -ROOM_D / 2, house);                        // plinth, sunk into the slope
  box3(2 * HW, 0.06, ROOM_D, woodDark, 0, 0.03, -ROOM_D / 2, house);                                // floor
  const front = new THREE.Group(); house.add(front);
  box3(HW - 0.6, WH, 0.16, wm(), -(HW + 0.6) / 2, WH / 2, 0, front); box3(HW - 0.6, WH, 0.16, wm(), (HW + 0.6) / 2, WH / 2, 0, front);   // door gap 1.2 wide
  box3(1.2, WH - 2.0, 0.16, wm(), 0, 2.0 + (WH - 2.0) / 2, 0, front);                              // lintel
  box3(0.16, WH, ROOM_D, wm(), -HW, WH / 2, -ROOM_D / 2, house); box3(0.16, WH, ROOM_D, wm(), HW, WH / 2, -ROOM_D / 2, house);
  box3(2 * HW, WH, 0.16, wm(), 0, WH / 2, -ROOM_D, house);
  const roof = new THREE.Group(); house.add(roof);
  { const r = new THREE.Mesh(new THREE.BoxGeometry(2 * HW + 0.7, 0.14, ROOM_D + 0.8), woodDark); r.position.set(0, WH + 0.2, -ROOM_D / 2); r.rotation.x = 0.1; roof.add(r); }
  const door = new THREE.Group(); door.position.set(0.6, 0, 0.1); house.add(door);               // the door stands open, hinged on the right
  { const d = box3(1.2, 2.0, 0.07, woodDark, -0.6, 1.0, 0, door); door.rotation.y = -1.25; void d; }
  { const lan = new THREE.Group(); lan.position.set(-0.9, 2.15, 0.35); house.add(lan);
    box3(0.16, 0.22, 0.16, new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0xffc070, emissiveIntensity: 1.4 }), 0, 0, 0, lan); }
  const PLINTH = { x: GX + 1.15, z: DOOR_Z - 2.0 }, PROT = { x: GX - 1.15, z: DOOR_Z - 1.9 };
  const plinth = box3(0.6, 0.5, 0.6, stone, PLINTH.x - GX, 0.28, PLINTH.z - DOOR_Z, house);
  void plinth;
  /* the box: lies on the verge before the door until lifted, rests on the plinth when set down */
  const BOX_AT = { x: rx(-12.6) + 1.0, z: -12.6 };
  const chest = part(new THREE.Group(), "hj-box");
  { box3(0.46, 0.26, 0.32, wood, 0, 0.13, 0, chest); box3(0.48, 0.05, 0.34, woodDark, 0, 0.28, 0, chest); box3(0.06, 0.1, 0.04, new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.6, roughness: 0.4 }), 0, 0.2, 0.17, chest); }
  at(chest, BOX_AT.x, BOX_AT.z); chest.rotation.y = 0.5;
  /* the Protector: protector.glb, scaled to a person, turned to the door */
  const prot = part(new THREE.Group(), "hj-protector"); let mixer = null;
  prot.position.set(PROT.x, GY, PROT.z); prot.rotation.y = 0.5;
  const protFallback = () => { box3(0.5, 1.5, 0.4, new THREE.MeshStandardMaterial({ color: 0x6a5a48 }), 0, 0.75, 0, prot); };
  (async () => { try {
    const gl = await L.load("/between/m/protector.glb"), o = gl.scene, b = new THREE.Box3().setFromObject(o), k = 1.7 / Math.max(b.getSize(new THREE.Vector3()).y, 0.01);
    o.scale.setScalar(k); o.position.y = -b.min.y * k; o.traverse(m => { if (m.isMesh) m.frustumCulled = false; }); prot.add(o);
    const idle = gl.animations.find(a => /idle/i.test(a.name)) || gl.animations[0]; if (idle) { mixer = new THREE.AnimationMixer(o); mixer.clipAction(idle).play(); }
  } catch (e) { console.warn("protector", e); protFallback(); } })();

  /* ---------- home: the table with the player's envelope and the blank one (T018, T019), and the hearth seats (T018) ---------- */
  const TABLE = { x: 2.9, z: 3.0 }, SEATS = [{ x: -2.9, z: 3.0 }, { x: -2.9, z: 4.0 }], HEARTH = { x: -3.9, z: 3.5 };
  const home = part(new THREE.Group(), "hj-home");
  const table = new THREE.Group(); at(table, TABLE.x, TABLE.z); home.add(table);
  { box3(1.5, 0.07, 0.85, wood, 0, 0.76, 0, table); for (const [x, z] of [[-0.68, -0.36], [0.68, -0.36], [-0.68, 0.36], [0.68, 0.36]]) box3(0.07, 0.74, 0.07, woodDark, x, 0.37, z, table); }
  const mine = sheet(paperTex(3, "#2f5b8a")); mine.position.set(-0.35, 0.805, 0.02); mine.rotation.z = 0.08; table.add(mine);
  const blank = new THREE.Group(); blank.position.set(0.42, 0.805, -0.02); blank.rotation.y = -0.25; table.add(blank);
  const blankPaper = sheet(paperTex(0, null)); blank.add(blankPaper);
  const flap = new THREE.Group(); flap.position.set(0, 0.002, -0.15); blank.add(flap);
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.1), new THREE.MeshStandardMaterial({ color: 0xdfd2b4, roughness: 0.9, side: THREE.DoubleSide })); f.rotation.x = -Math.PI / 2; f.position.z = 0.05; flap.add(f); }
  const cord = new THREE.Group(); blank.add(cord); const cordM = new THREE.MeshStandardMaterial({ color: 0x9a3a2a, roughness: 0.7 });
  { box3(0.012, 0.012, 0.32, cordM, 0, 0.012, 0, cord); box3(0.46, 0.012, 0.012, cordM, 0, 0.014, 0, cord); const k = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), cordM); k.position.set(0, 0.025, 0); cord.add(k); }
  const tl = new THREE.PointLight(0xffd9a0, 0.5, 3, 1.6); tl.position.set(TABLE.x, GY + 1.4, TABLE.z); home.add(tl); tl.position.y = L.groundH(TABLE.x, TABLE.z) + 1.4;
  const hearth = new THREE.Group(); at(hearth, HEARTH.x, HEARTH.z); home.add(hearth);
  { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; box3(0.28, 0.2, 0.2, stone, Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55, hearth).rotation.y = -a; }
    box3(0.4, 0.06, 0.12, woodDark, 0, 0.08, 0, hearth).rotation.y = 0.6; box3(0.4, 0.06, 0.12, woodDark, 0, 0.1, 0, hearth).rotation.y = -0.7; }
  const fireG = glow(0xff9a48, 1.5, 0.55); fireG.position.set(0, 0.35, 0); hearth.add(fireG);
  const fireL = new THREE.PointLight(0xff9a48, 1.2, 5, 1.5); fireL.position.set(0, 0.5, 0); hearth.add(fireL);
  for (const s of SEATS) { const g = new THREE.Group(); at(g, s.x, s.z); home.add(g); const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.42, 10), wood); lg.position.y = 0.21; g.add(lg); }

  let lamp = 0, held = null, holdT = 0, cutT = 0, cutAnim = 0;
  const HOLD_S = 1.4;
  const dist = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);
  const inside = p => p.z < DOOR_Z - 0.3 && Math.abs(p.x - GX) < HW;

  function near(p) {
    if (S.ember === "verge" && dist(p, { x: EMBER_AT.x, z: EMBER_AT.z }) < 1.1) return "st:ember";
    if (S.box === "ground" && dist(p, BOX_AT) < 1.1) return "st:box";
    if (dist(p, PROT) < 1.7) return "st:protector";
    if (S.box === "carried" && dist(p, PLINTH) < 1.5) return "st:plinth";
    if (dist(p, TABLE) < 1.6) return "st:table";
    if (SEATS.some(s => dist(p, s) < 1.2)) return "st:seats";
    return null;
  }
  const sig = () => [S.ember, S.box, S.asked, S.mineDone, S.blank, S.spoke].join("");
  function cardFor(n) {
    if (n === "st:ember") return { key: n, html: card("An envelope with an ember seal", "It lies in the verge, warm to look at. The seal is the Protector's.", btn("ember-open", "Pick it up")) };
    if (n === "st:ember-asks") return { key: n, html: card("The Protector's seal", "Three asks, written inside. They are for the Gatehouse, not for you to answer here." + asks(ASKS.ember), btn("ember-take", "Put it in the pack"), btn("ember-leave", "Leave it where it lay")) };
    if (n === "st:box") return { key: n, html: card("A small box", "It sits at the edge of the road, latched. It is light enough to carry to the Gatehouse.", btn("box-lift", "Lift the box")) };
    if (n === "st:plinth") return { key: n, html: card("A stone plinth", "Square, waist high, empty. It is the right size for the box.", btn("box-set", "Set the box on it")) };
    if (n === "st:protector") {
      const body = S.asked ? "The Protector has said what it came to say. The answers are yours, to write at the table in the clearing." : "The Protector stands by the wall and waits until you are near. Then it asks, three times." + asks(ASKS.ember);
      return { key: n + sig(), html: card("The Protector", body, ...(S.asked ? [] : [btn("asked", "Listen to all three")])) };
    }
    if (n === "st:table") {
      const copied = S.mineDone ? "Copied." : "Copy";
      const cut = S.blank === "cut" ? "The cord lies cut on the wood. The envelope is open and blank (placeholder)." : "A second envelope, blank, tied with a cord. Hold the button to cut it.";
      return { key: n + sig(), html: `<div><b>The table</b><div class="t"><i>Your envelope</i>${asks(MINE)}<br>${cut}</div></div><div class="row">${btn("mine-copy", copied)}${S.blank === "cut" ? "" : `<button type="button" data-hold="cut" aria-label="Hold to cut the cord">Hold to cut the cord</button>`}</div>` };
    }
    if (n === "st:seats") return { key: n + sig(), html: card("Seats by the hearth", S.spoke ? "You sit a while. The hearth is warm, and nobody asks anything (placeholder)." : "Two seats face a small hearth. Nobody has used them yet.", ...(S.spoke ? [] : [btn("sit", "Sit by the hearth")])) };
    return null;
  }
  let sub = null;   // a second card for the same spot (the asks), shown until chosen
  const copyText = t => { try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t); } catch (_) { /* fall through */ }
    const a = document.createElement("textarea"); a.value = t; a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (_) { /* nothing to do */ } a.remove(); };
  function act(v) {
    if (v === "ember-open") sub = "st:ember-asks";
    else if (v === "ember-take") { S.ember = "carried"; env.visible = false; sub = null; }
    else if (v === "ember-leave") sub = null;
    else if (v === "box-lift") { S.box = "carried"; chest.visible = false; }
    else if (v === "box-set") { S.box = "set"; S.set = true; chest.visible = true; chest.position.set(PLINTH.x, GY + 0.53, PLINTH.z); chest.rotation.y = 0.2; }
    else if (v === "asked") S.asked = true;
    else if (v === "mine-copy") { S.mineDone = true; copyText(MINE.map((q, i) => `${i + 1}. ${q}`).join("\n")); }
    else if (v === "sit") S.spoke = true;
  }
  /* hold to cut (T019): the pointer or key held on the button for HOLD_S seconds cuts the cord; letting go starts over */
  function hold(verb, on) { held = on ? verb : null; if (!on) holdT = 0; }
  function frame(dt, T, p) {
    // the Gatehouse's light is only a glow through the haze until the ember envelope is picked up; a lit house is bright
    const want = lit() ? 1 : S.ember === "carried" || road.taken ? 0.45 : 0.18;
    lamp += (want - lamp) * Math.min(1, dt * 1.5);
    hazeLight.intensity = 3.2 * lamp; inner.intensity = 2.4 * lamp; beacon.material.opacity = 0.12 + 0.55 * lamp + Math.sin(T * 1.7) * 0.03;
    if (p) {
      const in_ = inside(p); if (in_) S.crossed = true;
      roof.visible = !in_; const wo = in_ ? 0.22 : 1; for (const m of wallMats) m.opacity += (wo - m.opacity) * Math.min(1, dt * 6);
    }
    fireL.intensity = 1.2 + Math.sin(T * 9) * 0.12 + Math.sin(T * 13.7) * 0.08; fireG.material.opacity = 0.5 + Math.sin(T * 8) * 0.06;
    if (mixer) mixer.update(dt);
    if (held === "cut" && S.blank !== "cut") {
      holdT += dt; const b = document.querySelector("#card [data-hold]"); if (b) b.style.setProperty("--p", Math.min(1, holdT / HOLD_S).toFixed(3));
      if (holdT >= HOLD_S) { S.blank = "cut"; held = null; holdT = 0; cutAnim = 0.0001; }
    }
    if (cutAnim > 0 && cutAnim < 1) { cutAnim = Math.min(1, cutAnim + dt * 1.6); cord.position.y = -0.04 * cutAnim; cord.rotation.z = 0.5 * cutAnim; cord.scale.setScalar(Math.max(0.01, 1 - cutAnim * 0.6)); flap.rotation.x = -1.9 * cutAnim; if (cutAnim >= 1) cord.visible = false; }
    if (S.blank === "cut" && cutAnim === 0) { cord.visible = false; flap.rotation.x = -1.9; }
  }
  /* what stops you: the table, the plinth, the Protector, the hearth stones; what lets you in: the door and the room */
  const blocked = (x, z) => (Math.abs(x - TABLE.x) < 0.85 && Math.abs(z - TABLE.z) < 0.5) || Math.hypot(x - PLINTH.x, z - PLINTH.z) < 0.4 || Math.hypot(x - PROT.x, z - PROT.z) < 0.4 || Math.hypot(x - HEARTH.x, z - HEARTH.z) < 0.7;
  return {
    S, lit, packCount, frame, act, hold, blocked, inside,
    near(p) { const n = near(p); if (n === "st:ember" && sub) return sub; if (n !== "st:ember") sub = null; return n; },
    card: n => cardFor(n),
    /* the corridor through the door and the room; the road itself is road.js's */
    walkable(x, z) { const dx = Math.abs(x - GX);
      if (z <= -14.4 && z >= DOOR_Z - 0.3) return dx < 0.62;
      return z < DOOR_Z - 0.3 && z > DOOR_Z - ROOM_D + 0.35 && dx < HW - 0.35; },
    show(on) { env.visible = on && S.ember === "verge"; gate.visible = on; home.visible = on; chest.visible = on && S.box !== "carried"; prot.visible = on; },
  };
}

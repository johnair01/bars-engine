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

  /* ---------- the Gatehouse: its light through the haze from the ember envelope on (T016, T015) ---------- */
  const GX = rx(DOOR_Z), gate = part(new THREE.Group(), "hj-gatehouse");
  const hazeLight = new THREE.PointLight(0xffd9a0, 0, 9, 1.4); hazeLight.position.set(GX, 2.0, DOOR_Z - 0.6); gate.add(hazeLight);
  const beacon = glow(0xffe0a8, 5.5, 0.18); beacon.position.set(GX, 2.1, DOOR_Z - 0.4); gate.add(beacon);
  let lamp = 0;
  /* the building comes in T017 */

  function near(p) {
    if (S.ember === "verge" && Math.hypot(p.x - EMBER_AT.x, p.z - EMBER_AT.z) < 1.1) return "st:ember";
    return null;
  }
  function cardFor(n) {
    if (n === "st:ember") return { key: n, html: card("An envelope with an ember seal", "It lies in the verge, warm to look at. The seal is the Protector's.", btn("ember-open", "Pick it up")) };
    if (n === "st:ember-asks") return { key: n, html: card("The Protector's seal", "Three asks, written inside. They are for the Gatehouse, not for you to answer here." + asks(ASKS.ember), btn("ember-take", "Put it in the pack"), btn("ember-leave", "Leave it where it lay")) };
    return null;
  }
  let sub = null;   // a second card for the same spot (the asks), shown until chosen
  function act(v) {
    if (v === "ember-open") sub = "st:ember-asks";
    else if (v === "ember-take") { S.ember = "carried"; env.visible = false; sub = null; }
    else if (v === "ember-leave") sub = null;
  }
  function frame(dt, T, p) {
    // the Gatehouse's light is only a glow through the haze until the ember envelope is picked up; a lit house is bright
    const want = lit() ? 1 : S.ember === "carried" || road.taken ? 0.45 : 0.18;
    lamp += (want - lamp) * Math.min(1, dt * 1.5);
    hazeLight.intensity = 3.2 * lamp; beacon.material.opacity = 0.12 + 0.55 * lamp + Math.sin(T * 1.7) * 0.03;
  }
  return {
    S, lit, packCount, frame, act, near(p) { const n = near(p); if (n === "st:ember" && sub) return sub; if (!n) sub = null; return n; },
    card: n => cardFor(n),
    walkable(x, z) { return false; },
    show(on) { env.visible = on && S.ember === "verge"; gate.visible = on; },
  };
}

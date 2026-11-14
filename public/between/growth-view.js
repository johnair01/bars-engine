/* The friendship Between's growth, drawn (Six-faces-council .specify/specs/friendship-between-growth, FR-004 to FR-008, FR-013).
   Mounted by garden.js. It reads the one thing growth.js returns and draws it as things in the hollow, never as a number:
     bowls     tea gathers in up to three bowls on the low table, the colour of the newest tea found
     pots      the mantel's pots are found one at a time; a found pot is lit, and glows once the first time it is seen
     cup       a covered cup on the table when one waits: "Mara left you a cup." and "Drink it"
     lantern   in the nook, a lantern at the door while something waits on you in a Between
   Pouring a cup while the other friend is in the Between feeds it at once; pouring alone leaves the cup covered (FR-007).
   Previews only: ?growth=<feeds>&kept=<days>&lapsed=<days>&cup=1 (read in garden.js growthOf) and ?nook=1&waiting=1. */
import { TEAS, newPot } from "./growth.js";
import { TABLE, DAIS_Y, paperLantern } from "./hollow.js";

const TEA_COLOUR = { hearth: 0xb3752d, smoke: 0x7d6e5b, green: 0x76964f, blossom: 0xcf8d90, moon: 0xb7c3d8 };
const TEA_NAME = { hearth: "The hearth pot", smoke: "The smoke pot", green: "The green pot", blossom: "The blossom pot", moon: "The moon pot" };
const SEEN_KEY = "between.growth.seen.";
export const COPY = {
  cupFor: name => `${name} left you a cup.`, drink: "Drink it", newPot: "A new pot is on the shelf.",
  waits: name => `${name} answered. Your turn waits at the table.`,
};

const CSS = `
.gr-cup{box-sizing:border-box;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:44;display:flex;align-items:center;gap:12px;padding:12px 14px 12px 18px;max-width:min(92vw,420px);border-radius:28px;background:rgba(26,16,24,.88);color:#f6ead8;border:1px solid rgba(255,255,255,.22);font:500 16px/1.25 var(--ui-body,system-ui,sans-serif)}
.gr-cup[hidden]{display:none}
.gr-cup button{font:700 15px/1 var(--ui-body,system-ui,sans-serif);min-height:48px;padding:0 20px;border-radius:24px;cursor:pointer;border:1px solid rgba(255,255,255,.35);color:#fff;background:#2f8f86}
.gr-cup button:focus-visible{outline:3px solid var(--ui-accent,#5fc2ba);outline-offset:2px}
`;

export function mount(B, opts = {}) {
  const { THREE } = B;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const bar = document.createElement("div"); bar.className = "gr-cup"; bar.hidden = true; bar.setAttribute("role", "status");
  bar.innerHTML = `<span class="gr-say"></span><button type="button" class="gr-drink">${COPY.drink}</button>`;
  document.body.appendChild(bar);
  const say = bar.querySelector(".gr-say"), drinkBtn = bar.querySelector(".gr-drink");

  /* ---------- the table: three bowls and a covered cup ---------- */
  const grp = new THREE.Group(); grp.position.set(TABLE.x, DAIS_Y + 0.285, TABLE.z); B.scene.add(grp);
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector2(0.05 + 0.055 * Math.sin(u * Math.PI * 0.5 + 0.3) * (1 + u * 0.35), u * 0.045)); }
  const bowlGeo = new THREE.LatheGeometry(pts, 16), bowlMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.7, side: THREE.DoubleSide });
  const bowls = [0, 1, 2].map(i => {
    const a = 2.35 + i * 0.62, b = new THREE.Group(); b.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    b.add(new THREE.Mesh(bowlGeo, bowlMat));
    const tea = new THREE.Mesh(new THREE.CircleGeometry(0.052, 16), new THREE.MeshStandardMaterial({ color: TEA_COLOUR.hearth, roughness: 0.25, emissive: TEA_COLOUR.hearth, emissiveIntensity: 0.18 }));
    tea.rotation.x = -Math.PI / 2; tea.position.y = 0.032; tea.visible = false; b.add(tea); b.userData.tea = tea; grp.add(b); return b;
  });
  const cup = new THREE.Group(); cup.position.set(0.26, 0, -0.18); cup.visible = false;
  cup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.036, 0.06, 14), bowlMat));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.012, 14), new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 0.8 })); lid.position.y = 0.036; cup.add(lid);
  grp.add(cup);

  /* ---------- the nook's door lantern ---------- */
  let lantern = null;
  function door() {
    if (lantern) return lantern;
    const a = B.anchors && B.anchors();
    if (!a || !a.portal) return null;
    lantern = new THREE.Group(); lantern.add(paperLantern(0xffb060, 1.4));
    lantern.position.set(a.portal[0] + 0.55, 1.5, a.portal[2]); lantern.visible = false;
    const l = new THREE.PointLight(0xffb060, 0, 3, 1.6); lantern.add(l); lantern.userData.light = l; B.scene.add(lantern);
    return lantern;
  }

  /* ---------- reading the Between and drawing it ---------- */
  let lastBowls = -1, glow = null, previewDrunk = false;
  const seenOf = gid => { try { return +(localStorage.getItem(SEEN_KEY + gid) || 0); } catch { return 0; } };
  const sawNow = (gid, n) => { try { localStorage.setItem(SEEN_KEY + gid, String(n)); } catch {} };
  function mineWaiting(V, me) {
    const out = [];
    for (const [id, it] of V.items) if (it && it.kind === "cup" && it.status === "poured" && it.by !== me) out.push([id, it]);
    return out;
  }
  function sync() {
    const V = B.view(), { me, gardenId } = B.ids();
    const g = V && V.g, here = !!opts.standin || (!!g && g.kind !== "home" && g.members && Object.keys(g.members).length >= 2);
    grp.visible = here;
    if (here) {
      const r = B.growth();
      // bowls (FR-004)
      const tea = TEAS[Math.min(r.potsFound, TEAS.length - 1)], col = TEA_COLOUR[tea];
      bowls.forEach((b, i) => { const t = b.userData.tea; t.visible = i < r.bowls; t.material.color.setHex(col); t.material.emissive.setHex(col); });
      lastBowls = r.bowls;
      // pots (FR-005): the first potsFound mantel pots are lit; the newest glows once, the first time this friend sees it
      const h = B.hollowHandles && B.hollowHandles(), pots = (h && h.pots) || [];
      pots.forEach((p, i) => {
        if (!p.userData.own) { p.material = p.material.clone(); p.userData.own = true; }
        const found = i < r.potsFound;
        p.material.emissive = p.material.emissive || new THREE.Color(0);
        p.material.emissive.setHex(found ? TEA_COLOUR[TEAS[i + 1]] : 0x000000);
        p.material.emissiveIntensity = found ? 0.35 : 0;
      });
      const seen = seenOf(gardenId);
      if (r.potsFound > seen) { glow = { i: r.potsFound - 1, t0: performance.now() }; sawNow(gardenId, r.potsFound); }
      // the covered cup (FR-007)
      const waiting = mineWaiting(V, me);
      if (opts.standin && !previewDrunk && new URLSearchParams(location.search).get("cup") === "1") waiting.push(["preview-cup", { by: "stand-in" }]);
      const mine = [...V.items.values()].some(it => it && it.kind === "cup" && it.status === "poured" && it.by === me);
      cup.visible = waiting.length > 0 || mine;
      if (waiting.length) { say.textContent = COPY.cupFor(B.nameOf(waiting[0][1].by)); bar.hidden = false; bar.dataset.id = waiting[0][0]; }
      else if (r.potsFound && newPot(r, V.items) && !bar.dataset.id) { say.textContent = COPY.newPot; bar.hidden = false; drinkBtn.hidden = true; }
      else { bar.hidden = true; delete bar.dataset.id; drinkBtn.hidden = false; }
      if (waiting.length) drinkBtn.hidden = false;
    } else { bar.hidden = true; }
    // the door lantern (FR-008): lit while a card or cup waits on me in any Between; previews: ?nook=1&waiting=1
    const L = (B.room && B.room().shell === "nook") ? door() : null;
    if (L) {
      const l = B.list && B.list(), lit = (opts.waiting) || !!(l && l.gardens && l.gardens.some(x => x.lit));
      L.visible = true; L.userData.light.intensity = lit ? 2.2 : 0;
      L.children[0].visible = lit;
    }
  }
  drinkBtn.addEventListener("click", async () => {
    const id = bar.dataset.id; if (!id) return;
    bar.hidden = true; delete bar.dataset.id;
    if (id === "preview-cup") { previewDrunk = true; B.toast("It feeds the Between."); sync(); return; }
    try { await B.op("items/" + id, "update", { status: "drunk", drunkBy: B.ids().me, drunkAt: Date.now() }); B.toast("It feeds the Between."); } catch { B.toast("The cup stays covered. Try again."); }
    sync();
  });
  setInterval(sync, 1000);
  (function frame() { // the newest found pot glows once
    requestAnimationFrame(frame);
    if (!glow) return;
    const h = B.hollowHandles && B.hollowHandles(), p = h && h.pots && h.pots[glow.i]; if (!p) { glow = null; return; }
    const t = (performance.now() - glow.t0) / 2400;
    if (t >= 1) { p.material.emissiveIntensity = 0.35; glow = null; return; }
    p.material.emissiveIntensity = 0.35 + Math.sin(t * Math.PI) * 1.1;
  })();

  /* Pouring a cup (FR-007): the pot's tea is poured from the kettle like the first. While the other friend is here it feeds at once;
     alone, it leaves a covered cup on the table for them. Called by garden.js teaPour. */
  function pick(V, me, r) {
    const mineCount = [...V.items.values()].filter(it => it && it.kind === "cup" && it.by === me).length;
    return newPot(r, V.items) ? TEAS[r.potsFound] : TEAS[(mineCount % (r.potsFound + 1))];
  }
  /* The colour of the tea the next pour makes, so the kettle's stream and the cup take the pot's own colour (tea.js tint). */
  function nextTea() {
    const V = B.view(), { me } = B.ids(); if (!V) return null;
    return TEA_COLOUR[pick(V, me, B.growth())] || null;
  }
  async function poured() {
    const V = B.view(), g = V && V.g;
    if (!opts.standin && (!g || g.kind === "home" || !g.members || Object.keys(g.members).length < 2)) return;
    const { me } = B.ids(), r = B.growth();
    const tea = pick(V, me, r);
    if (r.potsFound && tea !== TEAS[0]) B.toast(TEA_NAME[tea] + ".");
    const other = g && g.members ? Object.keys(g.members).find(m => m !== me) : "stand-in";
    const hereNow = B.peers && [...B.peers.values()].some(p => p.uid === other);
    const at = Date.now(), item = { kind: "cup", by: me, at, tea, status: hereNow ? "drunk" : "poured" };
    if (hereNow) { item.drunkBy = other; item.drunkAt = at; }
    try { await B.op("items/cup-" + at.toString(36), "set", item); } catch {}
    sync();
  }
  sync();
  return { sync, poured, nextTea };
}

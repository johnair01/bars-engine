/* The one screen owner (Six-faces-council hi-screen-owner; docs/interface-language.md, "a poster that moves through space
   and time"). A moment in the room asks it for a headline and an action, with the shot's subject; it projects the
   subject's box from the camera and puts the words in the largest quiet area of the frame: one headline, a line under it,
   the action rising into the floor band. Nothing it draws has a box behind it. While a moment holds the screen the
   standing row steps aside (body.voiced), and comes back when the moment ends.

   say({ subject, head, sub, actions, foot, landed })
     subject  () => { l, t, r, b } in screen pixels, or null: what the camera is looking at; never covered
     head     the one headline (Marcellus)            sub  one line under it
     actions  [{ label, sub?, on, quiet? }]: seals you press, in the floor band (or under the headline when the subject
              holds the floor)
     foot     a line at the very bottom, italic        landed  [[who, what]]: what two people did, beside each other
   quiet()  releases the screen.  marks()  the boxes of the words on the glass, for the stills check. */

const css = `
#voice { position: fixed; inset: 0; z-index: 40; pointer-events: none; color: #f6ecdc; --display: "Marcellus", Georgia, serif; --body: "Alegreya Sans", system-ui, sans-serif; }
#voice[hidden] { display: none; }
#voice .vw { position: absolute; left: max(16px, 7%); right: max(16px, 7%); transition: top .5s ease, bottom .5s ease, opacity .4s ease; }
#voice .vh { font: 400 24px/1.2 var(--display); text-shadow: 0 1px 3px #000, 0 0 18px rgba(0,0,0,.7); }
#voice .vs { margin-top: 10px; max-width: 34em; font: 400 15.5px/1.35 var(--body); opacity: .88; text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.8); }
#voice .va { position: absolute; left: max(16px, 7%); right: max(16px, 7%); display: grid; gap: 10px; pointer-events: auto; }
#voice .seal { display: flex; align-items: center; gap: 14px; background: none; border: 0; padding: 4px 0; color: #ffd9a3; text-align: left; font: 400 19px var(--display); cursor: pointer; text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.8); min-height: 48px; }
#voice .seal i { flex: none; width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #f39a62, #b9481f 72%); box-shadow: 0 0 0 3px rgba(120,40,10,.4), 0 0 22px rgba(255,150,80,.55), inset 0 -4px 6px rgba(0,0,0,.35); }
#voice .seal small { display: block; font: 400 13px/1.3 var(--body); color: #e2cdb2; margin-top: 2px; }
#voice .seal.quiet { font-size: 16px; color: #e9d9c0; min-height: 40px; }
#voice .seal.quiet i { width: 26px; height: 26px; margin: 0 9px; background: radial-gradient(circle at 40% 35%, #8a6a52, #4a3326 72%); box-shadow: 0 0 0 2px rgba(255,214,160,.25); }
#voice .vf { position: absolute; left: 8%; right: 8%; bottom: calc(4% + env(safe-area-inset-bottom, 0px)); text-align: center; font: italic 400 15px/1.3 var(--body); color: #e9d9c0; opacity: .85; text-shadow: 0 1px 3px #000; }
#voice .vl { position: absolute; left: max(16px, 7%); right: max(16px, 7%); bottom: calc(6% + env(safe-area-inset-bottom, 0px)); display: grid; gap: 12px; }
#voice .vl div { display: grid; grid-template-columns: 96px 1fr; gap: 10px; font: 400 15px/1.3 var(--body); text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.85); }
#voice .vl b { font: 400 15px var(--display); color: #ffd08a; }
#voice .vl span { padding-left: 12px; border-left: 2px solid #ffd08a; color: #fff3df; }
body.voiced .hud .bottom, body.voiced .hud .top, body.voiced #shared-pick { visibility: hidden; }
`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createVoice() {
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement("div"); root.id = "voice"; root.hidden = true; document.body.appendChild(root);
  let cur = null, key = "";
  root.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b || !cur) return;
    const a = (cur.actions || [])[+b.dataset.i]; if (a && a.on) a.on();
  });
  function say(m) {
    const k = JSON.stringify([m.head, m.sub, (m.actions || []).map(a => [a.label, a.sub, a.quiet]), m.foot, m.landed]);
    cur = m; document.body.classList.add("voiced"); root.hidden = false;
    if (k !== key) {
      key = k;
      root.innerHTML = `<div class="vw">${m.head ? `<div class="vh">${esc(m.head)}</div>` : ""}${m.sub ? `<div class="vs">${esc(m.sub)}</div>` : ""}</div>`
        + (m.actions && m.actions.length ? `<div class="va">${m.actions.map((a, i) => `<button type="button" class="seal${a.quiet ? " quiet" : ""}" data-i="${i}"><i></i><span>${esc(a.label)}${a.sub ? `<small>${esc(a.sub)}</small>` : ""}</span></button>`).join("")}</div>` : "")
        + (m.landed && m.landed.length ? `<div class="vl">${m.landed.map(([w, t]) => `<div><b>${esc(w)}</b><span>${esc(t)}</span></div>`).join("")}</div>` : "")
        + (m.foot ? `<div class="vf">${esc(m.foot)}</div>` : "");
    }
    place();
  }
  /* The largest quiet area: above the subject or below it. The headline takes it; the actions take the floor band
     unless the subject holds the floor, and then sit under the headline. */
  function place() {
    if (!cur) return;
    const H = innerHeight, W = innerWidth, box = cur.subject && cur.subject();
    const vw = root.querySelector(".vw"), va = root.querySelector(".va"), vl = root.querySelector(".vl"), vf = root.querySelector(".vf");
    const wordsH = vw ? vw.getBoundingClientRect().height : 0, actH = va ? va.getBoundingClientRect().height : 0;
    const floorTaken = (vl ? vl.getBoundingClientRect().height + 24 : 0) + (vf ? 40 : 0);
    const safeTop = Math.max(16, H * 0.07), floorTop = H - floorTaken - Math.max(18, H * 0.04);
    let top = safeTop, actTop = floorTop - actH;
    if (box && box.b > box.t && box.r > box.l && box.l < W && box.r > 0) {
      const above = Math.max(0, box.t - safeTop), below = Math.max(0, floorTop - box.b);
      if (above >= wordsH + 12 || above >= below) {
        top = safeTop;
        actTop = below >= actH + 12 ? floorTop - actH : Math.max(top + wordsH + 14, Math.min(box.t - actH - 10, floorTop - actH));
      } else {
        top = box.b + 14;
        actTop = Math.max(top + wordsH + 14, floorTop - actH);
      }
    }
    if (vw) vw.style.top = Math.round(top) + "px";
    if (va) va.style.top = Math.round(actTop) + "px";
  }
  function quiet() { cur = null; key = ""; root.hidden = true; root.innerHTML = ""; document.body.classList.remove("voiced"); }
  function marks() { return [...root.querySelectorAll(".vh, .vs, .seal, .vf, .vl b, .vl span")].map(e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }); }
  addEventListener("resize", place);
  return { say, quiet, place, marks, holding: () => !!cur };
}

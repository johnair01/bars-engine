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
   quiet()  releases the screen.  marks()  the boxes of the words on the glass, for the stills check.

   Build 2 (hollow interface build 2): more than one part of the room speaks through it, so each speaks as an owner and
   the screen goes to the one that matters most; the others wait and come back when it lets go.
     say(m, owner = "moment", rank = 3)   quiet(owner = "moment")
   rank 3 is a moment that holds the screen (the letters); rank 1 and 2 are what you stand near (garden.js's near card,
   the map stand), said with m.soft: the standing row stays, the words sit above it, and only the old pinned card and the
   room's hint step aside (body.voiced-soft).

   Unified UI build 1 (Six-faces-council unified-ui-1, Wendell's pick A, the poster, at Paper 17, Loud 92, Daylight 36):
   the colours, families and dials come from /ui/tokens.css (--ui-*). One way back, everywhere (uu1-one-grammar):
     m.down   { label?, on }: "Put it down", top right, 44 px; Escape and a swipe down do the same. It replaces the quiet
              "Not now", "Close your hand" and "Close the book". "Walk on" stays the one word for leaving a place.
   A seal is wax in its element's colour with a glow ring as loud as --ui-loud: action.el names the element (fire when
   it names none). */

const css = `
#voice { position: fixed; inset: 0; z-index: 40; pointer-events: none; color: var(--ui-ink, #f6ecdc); --display: var(--ui-display, "Marcellus", Georgia, serif); --body: var(--ui-body, "Atkinson Hyperlegible", system-ui, sans-serif); }
#voice[hidden] { display: none; }
#voice .vw { position: absolute; left: max(16px, 7%); right: max(16px, 7%); transition: top .5s var(--ui-ease, ease), bottom .5s var(--ui-ease, ease), opacity .4s ease; }
#voice .vh { font: 400 calc(24px + 8px * var(--ui-loud, 0)) / 1.16 var(--display); text-wrap: balance; text-shadow: 0 1px 3px #000, 0 0 18px rgba(0,0,0,.7); }
#voice .vs { margin-top: 10px; max-width: 34em; max-height: 8.2em; overflow: auto; pointer-events: auto; font: 400 16px/1.42 var(--body); opacity: .92; text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.8); }
#voice .va { position: absolute; left: max(16px, 7%); right: max(16px, 7%); display: grid; gap: 12px; pointer-events: auto; }
.uiseal { --sc: var(--ui-fire, #c1392b); --sg: var(--ui-fire-glow, #e8671a); }
.uiseal i { position: relative; flex: none; width: 44px; height: 44px; border-radius: 50%; }
.uiseal i::before { content: ""; position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 36% 30%, color-mix(in oklab, var(--sg) 78%, #fff) 0%, var(--sg) 24%, var(--sc) 62%, color-mix(in oklab, var(--sc) 55%, #000) 100%);
  box-shadow: 0 2px 3px rgba(0,0,0,.45), inset 0 -3px 5px rgba(0,0,0,.35);
  clip-path: polygon(98% 50%, 95% 63%, 91% 74%, 83% 84%, 73% 91%, 62% 96%, 50% 98%, 37% 96%, 26% 91%, 16% 84%, 8% 74%, 3% 63%, 2% 50%, 4% 37%, 9% 26%, 17% 16%, 26% 8%, 38% 3%, 50% 2%, 63% 4%, 74% 9%, 84% 17%, 92% 26%, 96% 38%); }
.uiseal i::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; pointer-events: none; opacity: var(--ui-glow, .67);
  box-shadow: 0 0 0 calc(2px + 3px * var(--ui-loud, .92)) color-mix(in oklab, var(--sg) 70%, transparent), 0 0 calc(10px + 22px * var(--ui-loud, .92)) var(--sg); }
.uiseal.quiet { --sc: #6b4a36; --sg: #9a7656; }
.uiseal.quiet i { width: 32px; height: 32px; margin: 0 6px; }
.uiseal.quiet i::after { opacity: .18; }
#voice .seal { display: flex; align-items: center; gap: 14px; background: none; border: 0; padding: 4px 0; color: #ffd9a3; text-align: left; font: 400 19px/1.15 var(--display); cursor: pointer; text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.8); min-height: 48px; }
#voice .seal small { display: block; font: 400 14px/1.3 var(--body); color: #e2cdb2; margin-top: 3px; }
#voice .seal.quiet { font: 700 15px/1.15 var(--body); color: #e9d9c0; min-height: 44px; }
#voice .vf { position: absolute; left: 8%; right: 8%; bottom: calc(4% + env(safe-area-inset-bottom, 0px)); text-align: center; font: italic 400 15px/1.3 var(--body); color: #e9d9c0; opacity: .9; text-shadow: 0 1px 3px #000; }
#voice .vl { position: absolute; left: max(16px, 7%); right: max(16px, 7%); bottom: calc(6% + env(safe-area-inset-bottom, 0px)); display: grid; gap: 12px; }
#voice .vl div { display: grid; grid-template-columns: 96px 1fr; gap: 10px; font: 400 15px/1.3 var(--body); text-shadow: 0 1px 3px #000, 0 0 12px rgba(0,0,0,.85); }
#voice .vl b { font: 400 15px var(--display); color: #ffd08a; }
#voice .vl span { padding-left: 12px; border-left: 2px solid #ffd08a; color: #fff3df; }
#ui-down { position: fixed; z-index: 46; top: calc(12px + env(safe-area-inset-top, 0px)); right: 12px; min-height: 44px; min-width: 44px; display: flex; align-items: center; gap: 8px;
  padding: 0 14px 0 10px; border: 0; border-radius: 22px; background: rgba(10,6,4,.5); color: var(--ui-ink, #f6ecdc); font: 700 14px/1 var(--ui-body, system-ui, sans-serif);
  letter-spacing: .01em; text-shadow: 0 1px 3px rgba(0,0,0,.9); cursor: pointer; }
#ui-down[hidden] { display: none; }
#ui-down svg { width: 22px; height: 22px; flex: none; }
#ui-down:focus-visible { outline: 3px solid var(--ui-accent, #5fc2ba); outline-offset: 2px; }
body.voiced-soft .hud .near, body.voiced-soft .hud .hint, body.voiced-soft .hud .next, body.voiced-soft #labels, body.voiced-soft .ctw-card, body.voiced-soft .ctw-label { visibility: hidden; }
body.voiced .hud .bottom, body.voiced .hud .top, body.voiced #labels, body.voiced .ctw-label, body.voiced .hint, body.voiced .near { visibility: hidden; }
`;
/* A pinned panel's words as a moment for the screen owner: its first bold is the headline, its line and any small notes
   the line under it, its buttons the seals (each presses the panel's own button, so every action keeps its handler).
   `live` finds the panel again when a seal is pressed, since the room may have redrawn it. */
export function panelMoment(el, live) {
  if (!el) return null;
  const b = el.querySelector("b"); if (!b) return null;
  const what = b.parentElement, tt = el.querySelector(".t");
  const extra = [...what.childNodes].filter(n => n !== b && n !== tt && !(n.nodeType === 1 && n.classList && n.classList.contains("t"))).map(n => n.textContent).join("").replace(/^\s*·\s*/, "").trim();
  const smalls = [...el.querySelectorAll(".row .small")].map(e => e.textContent.trim());
  const sub = [extra && extra.charAt(0).toUpperCase() + extra.slice(1) + (/[.!?]$/.test(extra) ? "" : "."), tt && tt.textContent.trim(), ...smalls].filter(Boolean).join(" ");
  const actions = [...el.querySelectorAll(".row button")].map((x, i) => ({ label: x.textContent.trim(), quiet: x.classList.length > 0,
    on: () => { const l = (live ? live() : el); const y = l && l.querySelectorAll(".row button")[i]; if (y) y.click(); } }));
  return { head: b.textContent.trim(), sub, actions };
}
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function createVoice() {
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement("div"); root.id = "voice"; root.hidden = true; document.body.appendChild(root);
  const downEl = document.createElement("button"); downEl.type = "button"; downEl.id = "ui-down"; downEl.hidden = true; document.body.appendChild(downEl);
  const DOWN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 9c3 5 11 5 14 0"/><path d="M12 14v6"/><path d="M8.5 17.5 12 21l3.5-3.5"/></svg>`;
  const putDown = () => { const d = cur && cur.down; if (d && d.on) d.on(); };
  downEl.addEventListener("click", putDown);
  addEventListener("keydown", e => {
    if (e.key !== "Escape" || !cur || !cur.down || e.defaultPrevented) return;
    const sheet = document.getElementById("sheet"); if (sheet && !sheet.hidden) return; // a sheet's own Escape comes first
    e.preventDefault(); putDown();
  });
  /* a swipe down puts it down: a finger that travels down 70 px or more, mostly straight, in under 700 ms */
  let sw = null;
  addEventListener("pointerdown", e => { sw = cur && cur.down && !cur.soft && e.pointerType !== "mouse" && !e.target.closest(".vs") ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; }, true);
  addEventListener("pointerup", e => {
    const s = sw; sw = null; if (!s || !cur || !cur.down) return;
    const dy = e.clientY - s.y, dx = Math.abs(e.clientX - s.x);
    if (dy >= 70 && dx < dy * 0.6 && performance.now() - s.t < 700) putDown();
  }, true);
  const owners = new Map(); // owner -> { m, rank, at }
  let cur = null, curOwner = null, key = "";
  root.addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b || !cur) return;
    const a = (cur.actions || [])[+b.dataset.i]; if (a && a.on) a.on();
  });
  const top = () => { let best = null; for (const [o, c] of owners) if (!best || c.rank > best[1].rank || (c.rank === best[1].rank && c.at > best[1].at)) best = [o, c]; return best; };
  function show() {
    const t = top();
    if (!t) { cur = null; curOwner = null; key = ""; root.hidden = true; root.innerHTML = ""; downEl.hidden = true; document.body.classList.remove("voiced", "voiced-soft"); return; }
    const [o, { m }] = t;
    const k = o + JSON.stringify([m.head, m.sub, (m.actions || []).map(a => [a.label, a.sub, a.quiet, a.el]), m.foot, m.landed, !!m.soft, m.down && (m.down.label || "Put it down")]);
    cur = m; curOwner = o; root.hidden = false;
    downEl.hidden = !m.down;
    if (m.down) { const w = m.down.label || "Put it down"; if (downEl.dataset.w !== w) { downEl.dataset.w = w; downEl.innerHTML = DOWN_ICON + esc(w); } }
    document.body.classList.toggle("voiced", !m.soft); document.body.classList.toggle("voiced-soft", !!m.soft);
    if (k !== key) {
      key = k;
      root.innerHTML = `<div class="vw">${m.head ? `<div class="vh">${esc(m.head)}</div>` : ""}${m.sub ? `<div class="vs">${esc(m.sub)}</div>` : ""}</div>`
        + (m.actions && m.actions.length ? `<div class="va">${m.actions.map((a, i) => `<button type="button" class="seal uiseal${a.quiet ? " quiet" : ""}" data-i="${i}"${a.el && !a.quiet ? ` style="--sc:var(--ui-${esc(a.el)});--sg:var(--ui-${esc(a.el)}-glow)"` : ""}><i></i><span>${esc(a.label)}${a.sub ? `<small>${esc(a.sub)}</small>` : ""}</span></button>`).join("")}</div>` : "")
        + (m.landed && m.landed.length ? `<div class="vl">${m.landed.map(([w, t]) => `<div><b>${esc(w)}</b><span>${esc(t)}</span></div>`).join("")}</div>` : "")
        + (m.foot ? `<div class="vf">${esc(m.foot)}</div>` : "");
    }
    place();
  }
  function say(m, owner = "moment", rank = 3) {
    const was = owners.get(owner);
    owners.set(owner, { m, rank, at: was && was.rank === rank ? was.at : performance.now() });
    show();
  }
  /* The largest quiet area: above the subject or below it. The headline takes it; the actions take the floor band
     unless the subject holds the floor, and then sit under the headline. A soft voice keeps the standing row, so its
     floor band ends where the row begins. */
  function place() {
    if (!cur) return;
    const H = innerHeight, W = innerWidth, box = cur.subject && cur.subject();
    const vw = root.querySelector(".vw"), va = root.querySelector(".va"), vl = root.querySelector(".vl"), vf = root.querySelector(".vf");
    const wordsH = vw ? vw.getBoundingClientRect().height : 0, actH = va ? va.getBoundingClientRect().height : 0;
    const floorTaken = (vl ? vl.getBoundingClientRect().height + 40 : 0) + (vf ? 40 : 0);
    let floorTop = H - floorTaken - Math.max(18, H * 0.04), safeTop = Math.max(16, H * 0.07);
    if (cur.soft) {
      const row = document.querySelector(".hud .tools"), bar = document.querySelector(".hud .top");
      const shown = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
      const r = shown(row) && row.getBoundingClientRect(), b = shown(bar) && [...bar.children].reduce((m, c) => Math.max(m, c.getBoundingClientRect().bottom), bar.getBoundingClientRect().bottom);
      if (r && r.height) floorTop = Math.min(floorTop, r.top - 10);
      if (b) safeTop = Math.max(safeTop, b + 12);
    }
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
  function quiet(owner = "moment") { if (owners.delete(owner)) show(); }
  function marks() { return [...root.querySelectorAll(".vh, .vs, .seal, .vf, .vl b, .vl span"), ...(downEl.hidden ? [] : [downEl])].map(e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }); }
  addEventListener("resize", place);
  return { say, quiet, place, marks, holding: () => !!cur && !cur.soft, owner: () => curOwner, owners: () => [...owners.keys()] };
}

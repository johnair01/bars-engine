/* The walk's Hollow (Six-faces-council hollow-demo, his A on hdw-route, hdw-audience and hdw-length, 2026-11-06).
   /between/walk/hollow is the walk's last stop: the stand-in room on any host, with Mara, the sample player whose charge made
   the four lands, across the low table. This guide names the one step in front of a newcomer in the page's hint line (one short
   line per stop, hdw-audience A), and once the lantern has landed in the valley it lays the end card. It reads the coin table's
   turns and the games' Lantern out state; it writes nothing, and nothing here is kept. */
const CSS = `
.wh-end{box-sizing:border-box;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:60;width:min(92vw,440px);display:grid;gap:12px;padding:18px 18px 16px;border-radius:18px;background:rgba(18,14,24,.9);color:#f6ecdc;box-shadow:0 12px 34px rgba(0,0,0,.5);opacity:0;transition:opacity .6s}
.wh-end.on{opacity:1}
.wh-end b{font:400 24px/1.2 var(--ui-display,Georgia,serif)}
.wh-end p{margin:0;font:400 16px/1.45 var(--ui-body,system-ui,sans-serif);color:#e8dccb}
.wh-row{display:flex;gap:10px;flex-wrap:wrap}
.wh-row button{font:700 15px/1 var(--ui-body,system-ui,sans-serif);min-height:48px;padding:0 20px;border-radius:24px;cursor:pointer;border:1px solid rgba(255,255,255,.35);color:#fff;background:transparent}
.wh-row button.go{background:#2f8f86;border-color:#2f8f86}
.wh-row button:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.wh-end{transition:none}}
`;

export const STEP_WORDS = {
  table: "The Hollow is the room two friends share. Mara sits across the low table: walk to it, sit, and draw a card from her deck.",
  mouth: "The card is kept in both your books. Now walk out to the hollow's mouth, past the rope fence, where the valley's calls wait.",
  lantern: "The lantern goes where you both look. Point at the same call as Mara.",
  carry: "The lantern lifts between you. Carry it out along the stones to the lookout, together.",
  end: "The lantern has landed, and that place in the valley stays lit.",
};

/** Which step the newcomer is on, from what the table and the mouth show. Pure, so the tests read it the same.
 * @param {{ turns?: { status?: string }[], lantern?: { mouth?: boolean, state?: string | null } | null }} [seen] */
export function walkStep(seen = {}) {
  const turns = seen.turns || [], lantern = seen.lantern || null;
  if (lantern && lantern.state === "done") return "end";
  if (lantern && lantern.state) return "carry";
  if (lantern && lantern.mouth) return "lantern";
  if (turns.some(t => t.status === "kept")) return "mouth";
  return "table";
}

export function mount(B) {
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  let step = "", endAt = 0, card = null;
  const read = () => {
    const turns = (B.coins && B.coins.turns && B.coins.turns()) || [];
    const lv = B.games && B.games.view && B.games.view().lantern;
    return walkStep({ turns, lantern: lv || null });
  };
  // while a card is on the table the coin table speaks; the hint line stays quiet then
  const inPlay = () => ((B.coins && B.coins.turns && B.coins.turns()) || []).some(t => ["open", "sealed", "asked", "waiting", "opened"].includes(t.status));
  function endCard() {
    if (card) return;
    card = document.createElement("div"); card.className = "wh-end"; card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "The end of the walk");
    card.innerHTML = `<b>The end of the walk</b><p>You woke in a nook, a stranger's charge made four lands, and a friend met you in the Hollow. That is the game: what you feel becomes a place, and you walk its places with friends.</p><div class="wh-row"><button type="button" class="go" data-wh="again">Walk it again</button><button type="button" data-wh="stay">Stay a while</button></div>`;
    for (const ev of ["pointerdown", "pointerup", "keydown", "wheel"]) card.addEventListener(ev, e => e.stopPropagation());
    card.addEventListener("click", e => {
      const b = e.target.closest("[data-wh]"); if (!b) return;
      if (b.dataset.wh === "again") location.href = "/between/walk";
      else { card.remove(); card = null; endAt = Infinity; const hint = document.querySelector("#hint"); if (hint) hint.style.visibility = ""; }
    });
    const hint = document.querySelector("#hint"); if (hint) hint.style.visibility = "hidden";   // the end card is the one line now
    document.body.appendChild(card); requestAnimationFrame(() => card && card.classList.add("on"));
    const go = card.querySelector(".go"); if (go) go.focus({ preventScroll: true });
  }
  setInterval(() => {
    let s; try { s = read(); } catch { return; }
    if (s !== step) { step = s; if (B.hud) B.hud(); if (s === "end" && !endAt) endAt = performance.now() + 2500; }
    if (endAt && performance.now() > endAt && endAt !== Infinity) endCard();
  }, 500);
  return {
    hint: () => (step === "table" && inPlay() ? "" : STEP_WORDS[step] || STEP_WORDS.table),
    view: () => ({ step, end: !!card }),
  };
}

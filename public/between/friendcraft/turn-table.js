/* The turn at the low table (Six-faces-council spec .specify/specs/friendcraft-deck-2, slice 2 of Friendcraft onboarding;
   his A on fo-deck-2-look-3, the glass with a path; steer: "The Slip should be a BAR"). Two friends who share a Between
   and are both in Friendcraft sit at its table. One draws from the other's deck: a light card turns face up and both
   write a line; a middle or deep card lies sealed under a paper band, and the drawer has three roads, each a place on the
   table: ask (the paper slip at the other's edge, which is also a BAR the drawer leaves), earn it together (the tea), or put
   it back (the deck). The owner alone opens a card for free, or says not today, even after tea. A turn both friends
   answered is kept as an ink page in both books.

   This module draws the table's cards over the scene and hands the coin table the moment it should speak (every word
   still goes through the one screen owner, voice.js, hi-screen-owner). One server route plays every move
   (POST /api/between/:gardenId/turn, src/lib/between/turn.ts holds the rules). No number, count, streak or score is ever
   drawn: the cost is bowls, the tea is bowls (keep list 5). A preview (?turn=light|sealed|asked|waiting|kept, &bowls=0..3,
   &as=owner) plays on this page only, with a stand-in friend. */
import { COST, DEPTH_NAMES, say } from "./deck.js";
import { bowls as teaOf } from "../growth.js";

const RATIO = 530 / 742; // the /oracle card back's shape: every card front keeps the deck's shape (his note on fo-deck-2-look-1)
const BACK = "/oracle/card-back-lite.png";
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BOWL = full => `<svg class="ft-bowl${full ? " full" : ""}" viewBox="0 0 22 15" aria-hidden="true"><path d="M1.5 3.5h19c0 6.2-4.2 10-9.5 10S1.5 9.7 1.5 3.5z" fill="${full ? "#f0c070" : "none"}" fill-opacity=".9" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const STATUS_ON_TABLE = new Set(["open", "sealed", "asked", "waiting", "opened"]);

export function mount(B, h) {
  const local = new Map(); // a preview's turns, on this page only
  let draft = "", sig = "", busy = false, lastKept = null;
  const css = document.createElement("style");
  css.textContent = `.ft{position:fixed;inset:0;z-index:33;pointer-events:none;--paper:#eee0c6;--ink:#34221a;--ember:#e8873f;font-family:'EB Garamond',Georgia,serif;opacity:0;transition:opacity .25s}
  .ft.on{opacity:1} .ft[hidden]{display:none}
  .ft-deck,.ft-slip,.ft-tea{position:absolute}
  .ft-tea,.ft-slip{top:min(26vh,214px)} .ft-tea{height:40px;align-items:center} .ft-deck{top:min(26vh,214px)}
  .ft-deck{left:16px;width:46px;aspect-ratio:${RATIO};border-radius:5px;background:#5c281a url(${BACK}) center/cover;box-shadow:0 3px 8px rgba(0,0,0,.5)}
  .ft-tea{right:16px;display:flex;gap:4px;color:#f6ecdc;filter:drop-shadow(0 1px 2px #000)} .ft-bowl{width:26px;height:18px}
  .ft-slip{left:50%;transform:translateX(-50%) rotate(-2deg);width:92px;height:40px;background:var(--paper);color:var(--ink);border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.5);display:grid;align-items:center;justify-items:start;padding-left:12px;box-sizing:border-box;font:italic 400 14px var(--ft-f,'EB Garamond',Georgia,serif);opacity:.9}
  .ft-slip::after{content:"";position:absolute;inset:0;border-radius:3px;background:linear-gradient(100deg,transparent 48%,rgba(90,60,40,.18) 50%,transparent 52%)}
  .ft-path{position:absolute;left:50%;top:calc(min(26vh,214px) + 42px);bottom:calc(50% + min(36vw,160px));width:0;border-left:3px dotted var(--ember);transform:translateX(-1.5px);opacity:.9}
  .ft-card{position:absolute;left:50%;top:46%;width:min(52vw,230px);aspect-ratio:${RATIO};transform:translate(-50%,-50%);border-radius:10px;box-shadow:0 14px 34px rgba(0,0,0,.55);overflow:hidden}
  .ft-card.slid{animation:ft-slide .7s cubic-bezier(.2,.7,.2,1)}
  @keyframes ft-slide{from{transform:translate(-120%,-190%) rotate(-12deg);opacity:.2}}
  @media (prefers-reduced-motion:reduce){.ft-card.slid{animation:none}}
  .ft-card.back{background:#5c281a url(${BACK}) center/cover}
  .ft-card.back::before{content:"";position:absolute;top:0;right:12%;width:14px;height:64px;background:#a0302a;clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%);z-index:2}
  .ft-card.front{background:var(--paper);color:var(--ink);padding:9% 9% 7%;box-sizing:border-box;display:flex;flex-direction:column;gap:8px}
  .ft-card.asked{top:calc(min(26vh,214px) - 14px);width:52px;transform:none;left:calc(50% + 16px);border-radius:6px;box-shadow:0 3px 8px rgba(0,0,0,.55)}
  .ft-card.asked::before{width:7px;height:30px}
  .ft-ribbon{font:italic 400 13px/1.25 'EB Garamond',Georgia,serif;color:#6a5442;border-bottom:1px solid #b9a283;padding-bottom:5px}
  .ft-words{font:italic 400 clamp(16px,4.6vw,21px)/1.35 'EB Garamond',Georgia,serif;text-wrap:pretty}
  .ft-said{font:400 14px/1.3 'EB Garamond',Georgia,serif;color:#6a5442;margin-top:auto} .ft-said b{font-weight:400;color:var(--ink)}
  .ft-band{position:absolute;left:-2%;right:-2%;top:38%;height:24%;background:var(--paper);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;box-shadow:0 2px 6px rgba(0,0,0,.45);z-index:1;font:400 15px Marcellus,Georgia,serif}
  .ft-band .ft-bowl{width:22px;height:15px;color:#8a6a4a}
  .ft-line{position:absolute;left:50%;transform:translateX(-50%);top:calc(50% + min(36vw,160px) + 18px);width:min(86vw,420px);pointer-events:auto}
  .ft-line textarea{display:block;width:100%;box-sizing:border-box;resize:none;border:0;border-bottom:2px solid #f0d9ad;background:rgba(20,10,6,.35);border-radius:6px 6px 0 0;color:#fbf2e0;font:italic 400 20px/1.3 'EB Garamond',Georgia,serif;padding:8px 10px;caret-color:#fbf2e0}
  .ft-line textarea:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px} .ft-line textarea::placeholder{color:rgba(251,242,224,.0)}
  .ft-line p{margin:0 0 4px 2px;font:italic 400 15px/1.3 'EB Garamond',Georgia,serif;color:#f0d9ad;text-shadow:0 1px 3px #000}`;
  document.head.appendChild(css);
  const el = document.createElement("div"); el.className = "ft"; el.hidden = true; document.body.appendChild(el);
  el.addEventListener("input", e => { if (e.target.matches("textarea")) draft = e.target.value; });
  for (const ev of ["keydown", "keyup", "pointerdown", "pointerup", "wheel"]) el.addEventListener(ev, e => e.stopPropagation());

  const me = () => (h.ids().me || "you");
  const other = () => (h.other ? h.other() : null);
  const otherName = () => (h.otherName ? h.otherName() : "your friend");
  const gid = () => h.ids().gardenId;

  /** The turn and spend items on this table: the room's own, or a preview's. */
  function items() {
    const out = new Map();
    if (h.preview || !gid()) { for (const [k, v] of local) out.set(k, v); return out; }
    const its = B.view && B.view().items;
    if (its) for (const [k, v] of its) if (v && (v.kind === "turn" || v.kind === "spend" || v.kind === "cast")) out.set(k, v);
    return out;
  }
  const turns = () => [...items()].filter(([, t]) => t && t.kind === "turn").map(([id, t]) => ({ id, ...t }));
  const tea = () => (h.preview && h.opts.bowls != null && h.opts.bowls !== "" ? Math.max(0, Math.min(3, +h.opts.bowls || 0)) : teaOf(Object.fromEntries(items())));

  /** The one turn to attend to: what waits on me as the card's owner, then my own card on the table. */
  function focus() {
    const m = me(), ts = turns();
    const mineToAnswer = ts.find(t => t.owner === m && (t.status === "asked" || t.status === "opened"));
    if (mineToAnswer) return mineToAnswer;
    const lineWait = ts.find(t => t.owner === m && t.status === "open" && t.lines && t.lines[t.by] && !t.lines[m]);
    if (lineWait) return lineWait;
    const mine = ts.filter(t => t.by === m && STATUS_ON_TABLE.has(t.status));
    return mine.find(t => t.status === "open" || t.status === "sealed") || mine.find(t => t.status === "waiting") || mine.find(t => t.status === "opened") || mine[0] || null;
  }
  const canDraw = () => !focus() || (focus().by === me() && ["asked", "waiting", "opened"].includes(focus().status));

  /** Plays one move: the server's route, or a stand-in's rules on a preview. */
  async function act(name, t) {
    if (busy) return; busy = true;
    try {
      if (h.preview || !gid()) localMove(name, t);
      else {
        const j = await B.api("/api/between/" + gid() + "/turn", { do: name, turn: t && t.id, words: name === "line" ? draft : undefined });
        if (B.poll) B.poll();
        if (name === "line") { draft = ""; if (j && j.turn && j.turn.status === "kept") { lastKept = j.turn.id; if (B.toast) B.toast(say("kept", otherName())); } }
      }
      if (name === "draw") slide = true;
    } catch (e) { if (B.toast) B.toast((e && e.message) || "That did not go through."); }
    finally { busy = false; sig = ""; if (h.refresh) h.refresh(); }
  }
  let slide = false;
  function localMove(name, t) {
    const m = me(), o = other() || "stand-in";
    if (name === "draw") { const id = "local-" + Date.now().toString(36); local.set(id, { kind: "turn", by: m, owner: o, goal: "g", depth: "light", status: "open", words: "Ask me what I had for breakfast, then listen to the whole answer.", goalText: "Someone who asks how I really am", lines: {}, at: Date.now() }); return; }
    const cur = local.get(t.id); if (!cur) return;
    const set = patch => local.set(t.id, { ...cur, ...patch });
    if (name === "ask") set({ status: "asked" });
    else if (name === "earn") set({ status: "waiting" });
    else if (name === "open") { if (tea() < COST[cur.depth]) throw new Error("There is not tea enough on the table yet."); set({ status: "opened" }); local.set("s-" + t.id, { kind: "spend", by: m, turn: t.id, bowls: COST[cur.depth] }); }
    else if (name === "offer") set({ status: "open", words: "Stay when I am hard to be around.", goalText: "Someone who asks how I really am" });
    else if (name === "notToday") { set({ status: "notToday" }); local.delete("s-" + t.id); }
    else if (name === "back") { set({ status: "back" }); local.delete("s-" + t.id); }
    else if (name === "line") {
      const w = draft.replace(/\s+/g, " ").trim(); if (!w) throw new Error("Write a few words first.");
      const lines = { ...cur.lines, [m]: { words: w, at: Date.now() } };
      // the walk's Hollow (hollow-demo): Mara, the stand-in, writes her line back, so a newcomer sees a turn kept
      if (h.opts.turn === "walk") { const o = cur.by === m ? cur.owner : cur.by; if (!lines[o]) lines[o] = { words: o === cur.owner ? "Cold toast on the garage step, and the radio on. Thank you for asking." : "I would love to be asked.", at: Date.now() + 1 }; }
      const both = lines[cur.by] && lines[cur.owner];
      set(both ? { lines, status: "kept", keptAt: Date.now() } : { lines }); draft = "";
      if (both) { lastKept = t.id; if (B.toast) B.toast(say("kept", otherName())); }
    }
  }

  /** The moment the coin table speaks while a turn is in play, or null. `leave` is the table's own way to stand. */
  function momentFor(subject, leave) {
    const t = focus(); if (!t) return null;
    const m = me(), n = otherName(), go = (name, label, extra = {}) => ({ label, on: () => act(name, t), ...extra });
    const isOwner = t.owner === m, depth = DEPTH_NAMES[t.depth] || "";
    if (isOwner) {
      if (t.status === "asked" || t.status === "opened") {
        const from = t.goalText || (t.forYou && t.forYou.goalText) || "";
        return { subject, head: say("asked", n), sub: from ? `It came from the goal: "${from}"` : "", actions: [go("offer", say("offer", n)), go("notToday", say("notToday", n), { quiet: true }), leave] };
      }
      return { subject, head: say("lineOwner", n), sub: `${n}'s line: "${t.lines[t.by].words}"`, actions: [{ label: "Set my line down", on: () => act("line", t) }, leave] };
    }
    const label = x => say(x, n);
    if (t.status === "sealed") return { subject, head: `${depth} card from ${n}'s deck`, sub: label("sealed"), actions: [go("ask", label("askRoad"), { sub: "A paper slip waits for them" }), go("earn", label("earn"), { sub: "The tea on the table opens it, if they say yes" }), go("back", label("back"), { quiet: true }), leave] };
    const more = drawAction() ? [drawAction()] : []; // a card set aside does not hold the next draw
    if (t.status === "asked") return { subject, head: `${depth} card from ${n}'s deck`, sub: label("sees"), actions: [...more, go("back", label("back"), { quiet: true }), leave] };
    if (t.status === "waiting") {
      const enough = tea() >= COST[t.depth];
      return { subject, head: `${depth} card from ${n}'s deck`, sub: enough ? "The tea on the table is enough." : "It waits on the table until there is tea enough.", actions: [...(enough ? [go("open", label("openTea"))] : []), ...more, go("back", label("back"), { quiet: true }), leave] };
    }
    if (t.status === "opened") return { subject, head: `${depth} card from ${n}'s deck`, sub: `Waiting for ${n}'s yes.`, actions: [...more, go("back", label("back"), { quiet: true }), leave] };
    // open: the drawer's line
    const mine = t.lines && t.lines[m];
    if (!mine) return { subject, head: label("lineDrawer"), sub: `"${t.words}"`, actions: [{ label: "Set my line down", on: () => act("line", t) }, leave] };
    return { subject, head: label("sees"), sub: `Your line: "${mine.words}"`, actions: [{ label: "Change my line", quiet: true, on: () => { draft = mine.words; sig = ""; } }, leave] };
  }

  /** The action that draws a card, shown when no turn of mine is face up or sealed. */
  function drawAction() {
    if (!canDraw()) return null;
    return { label: say("draw", otherName()), sub: "One card, at random, from everything they wrote", on: () => act("draw", null) };
  }

  /** Draws (or hides) the cards over the scene for the turn in play. */
  function sync(visible) {
    let t = visible ? focus() : null;
    if (t && !t.words && t.owner === me() && t.forYou) t = { ...t, words: t.forYou.words, goalText: t.forYou.goalText }; // the owner sees her own card, read by the server for her alone
    const asked = visible ? turns().filter(x => x.by === me() && x.status === "asked" && (!t || x.id !== t.id)) : [];
    const key = JSON.stringify([!!t, t && [t.id, t.status, t.words, t.lines], asked.map(x => x.id), tea(), draft === "" ? 0 : 1, slide]);
    if (key === sig) return; sig = key;
    if (!t && !asked.length) { el.classList.remove("on"); el.hidden = true; el.innerHTML = ""; return; }
    const m = me(), n = otherName(), parts = [];
    const bowlsHtml = Array.from({ length: 3 }, (_, i) => BOWL(i < tea())).join("");
    parts.push(`<div class="ft-deck" aria-hidden="true"></div><div class="ft-tea" role="img" aria-label="Tea on the table">${bowlsHtml}</div>`);
    const showSlip = (t && (t.status === "sealed" || t.status === "asked") && t.by === m) || asked.length;
    if (showSlip) parts.push(`<div class="ft-slip">${esc(n)}</div>`);
    if (t && t.status === "sealed" && t.by === m) parts.push(`<div class="ft-path"></div>`);
    for (const a of asked) parts.push(`<div class="ft-card back asked" aria-hidden="true"></div>`);
    if (t) {
      const sealed = !t.words, sl = slide ? " slid" : "";
      if (t.status === "asked" && t.by === m) parts.push(`<div class="ft-card back asked" aria-hidden="true"></div>`);
      else if (sealed) parts.push(`<div class="ft-card back${sl}" role="img" aria-label="A sealed ${esc((DEPTH_NAMES[t.depth] || "").toLowerCase())} card"><div class="ft-band"><span>${esc(DEPTH_NAMES[t.depth] || "")}</span><span style="display:flex;gap:3px">${Array.from({ length: COST[t.depth] || 0 }, () => BOWL(false)).join("")}</span></div></div>`);
      else {
        const said = ["by", "owner"].map(k => t.lines && t.lines[t[k]] ? `<div class="ft-said"><b>${esc(t[k] === m ? "You" : n)}:</b> ${esc(t.lines[t[k]].words)}</div>` : "").join("");
        parts.push(`<div class="ft-card front${sl}">${t.goalText ? `<div class="ft-ribbon">${esc(t.goalText)}</div>` : ""}<div class="ft-words">${esc(t.words)}</div>${said}</div>`);
      }
      const needsLine = t.status === "open" && !(t.lines && t.lines[m]) && (t.by === m || (t.lines && t.lines[t.by]));
      const changing = t.status === "open" && t.lines && t.lines[m] && draft !== "";
      if (needsLine || changing) parts.push(`<div class="ft-line"><textarea rows="2" maxlength="140" autocomplete="off" aria-label="${esc(t.by === m ? say("lineDrawer", n) : say("lineOwner", n))}">${esc(draft)}</textarea></div>`);
    }
    el.innerHTML = parts.join(""); el.hidden = false; requestAnimationFrame(() => el.classList.add("on")); slide = false;
  }

  /** A preview's table: `?turn=light|sealed|asked|waiting|kept` seats a turn in that state with a stand-in friend. */
  function seed(kind) {
    const m = me(), o = other() || "stand-in", owner = h.opts.as === "owner", by = owner ? o : m, ow = owner ? m : o, now = Date.now();
    const base = { kind: "turn", by, owner: ow, goal: "g", seed: 1, lines: {}, at: now - 6e4 };
    const goalText = "Someone who asks how I really am";
    if (kind === "light") local.set("t1", { ...base, depth: "light", status: "open", words: "Ask me what I had for breakfast, then listen to the whole answer.", goalText, lines: owner ? { [by]: { words: "I would love to be asked.", at: now } } : {} });
    else if (kind === "sealed") local.set("t1", { ...base, depth: "deep", status: "sealed" });
    else if (kind === "asked") local.set("t1", { ...base, depth: "deep", status: "asked", ...(owner ? { goalText } : {}) });
    else if (kind === "waiting") local.set("t1", { ...base, depth: "middle", status: "waiting" });
    else if (kind === "kept") local.set("t1", { ...base, depth: "light", status: "kept", words: "Ask me what I had for breakfast, then listen to the whole answer.", goalText, lines: { [by]: { words: "I will, tomorrow.", at: now - 2e4 }, [ow]: { words: "That would mean a lot.", at: now - 1e4 } }, keptAt: now - 1e4, bar: "local" });
    if (kind === "kept") lastKept = "t1";
    sig = "";
  }

  /** The kept turns, shaped for the book's ink pages. */
  function kept() {
    return turns().filter(t => t.status === "kept" && t.words).map(t => ({ id: t.id, by: t.by, owner: t.owner, goal: t.goal, depth: t.depth, words: t.words, goalText: t.goalText || "", at: t.keptAt || t.at,
      lines: [t.by, t.owner].filter(u => t.lines && t.lines[u]).map(u => ({ by: u, words: t.lines[u].words })) }));
  }
  return { focus, momentFor, drawAction, sync, seed, kept, tea, turns };
}

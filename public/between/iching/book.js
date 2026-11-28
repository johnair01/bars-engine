/* The record book (Six-faces-council spec .specify/specs/record-book; his A on rb-new-page, 2026-11-02, and his A on
   rb-ad-look-1, 2026-11-03: the ink diary). The book on the nook's shelf holds one page per person you toss for: yourself,
   each person you share a Between with, each spark you started, each name you wrote on the blank page; then one blank page.
   Choosing who a toss is for is turning to their page. Each page holds only the name and the casts you kept for them,
   newest at the top: no counts, no streaks, no dates (the Game frame keeps It and Its out).

   Where a name lives: only in your homeroom's private doc, `pages` (rules.ts homePageOk). A kept cast never carries a name;
   it names the room it was for, or the page (`page`), or neither when it was for yourself. Plain module, no three.js and no
   fetch, so every rule here has a test (src/lib/between/__tests__/record-book.test.ts). */
import { whoChoices } from "./connection.js";
import { deckLeaves, BLANK_GOAL } from "../friendcraft/deck.js";

/** The kept turns of the Between(s) you sit in, as ink pages: the card's words, the goal it came from, both lines, the
    drawer's first, newest first (Six-faces-council spec .specify/specs/friendcraft-deck-2 FR-011). `turns` are roomSummary's
    `turns` (or a hollow's own kept turn items); `nameOf` gives a friend's name. No date, no count.
    @param {any[]} turns  @param {(uid: string) => string} [nameOf] */
export function turnLeaves(turns, nameOf = u => "them") {
  return (turns || []).filter(t => t && t.id && typeof t.words === "string" && t.words)
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .map(t => ({ kind: "turn", key: "turn-" + t.id, tid: t.id, goal: t.goal || null, depth: t.depth || null, name: t.words, words: t.words,
      goalText: t.goalText || "", bar: t.bar || null, coins: t.coins || [], lines: (t.lines || []).map(l => ({ by: l.by, name: nameOf(l.by), words: l.words })) }));
}

export const BLANK = { kind: "blank", key: "blank", name: "" };
/** The longest name a page takes (rules.ts holds the same). */
export const NAME_MAX = 40;

/** A new named page: its name, no room yet (a spark stays optional and can come later, his A on rb-new-page). */
export function newPage(name, at) {
  const n = String(name || "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  if (!n) return null;
  return { name: n, room: null, at };
}

/** The leaves of the book, in order: yourself, each Between, each spark, each named page (oldest first), then one blank
    page. `choices` are the table's who-choices (connection.js whoChoices, or a hollow's own two). A named page that got a
    spark (its `room`) takes that spark's place and keeps its casts; a spark that became a Between keeps its page because a
    page for a room is keyed by the room. In a hollow (`blank: false`) the book holds only the hollow's pages.
    A player enrolled in Friendcraft passes their deck (`o.deck`, an empty one included): their goal pages come first,
    oldest first, then one blank goal leaf, then the rest as above (Six-faces-council spec .specify/specs/friendcraft-deck
    FR-005). Goal pages are in the nook's book only.
    @param {any[]} choices  @param {any} home  @param {{ blank?: boolean, deck?: any, turns?: any[], nameOf?: (uid: string) => string }} [o] */
export function leavesOf(choices, home, o = {}) {
  const pages = (home && home.pages && typeof home.pages === "object") ? home.pages : {};
  const named = Object.entries(pages).filter(([, p]) => p && typeof p.name === "string" && p.name)
    .sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
  const byRoom = new Map(named.filter(([, p]) => p.room).map(([pid, p]) => [p.room, pid]));
  const out = [];
  if (o.blank !== false && o.deck && typeof o.deck === "object") out.push(...deckLeaves(o.deck), { ...BLANK_GOAL });
  if (o.turns && o.turns.length) out.push(...turnLeaves(o.turns, o.nameOf));   // kept turns after the goal pages, in the nook and the hollow
  for (const w of choices || []) {
    if (!w || w.kind === "plant") continue;
    if (w.kind === "self") { out.push({ ...w, key: "self", name: "Yourself" }); continue; }
    const pid = byRoom.get(w.room) || null;
    out.push({ ...w, key: w.room, pid, name: w.name });
  }
  const shown = new Set(out.map(l => l.room).filter(Boolean));
  if (o.blank !== false) {
    for (const [pid, p] of named) {
      if (p.room && shown.has(p.room)) continue;   // it is the spark's or the Between's page now
      // a page whose spark the table does not show now (the general table hides sparks) stays a page, with its casts
      out.push({ kind: "named", key: pid, pid, room: p.room || null, name: p.name });
    }
    out.push({ ...BLANK });
  }
  return out;
}

/** The book from your room list (spec FR-011): `here` is the hollow you stand in, or null in the nook.
    @param {any[]} rooms  @param {any} home  @param {string | null} [here]  @param {any} [deck] a Friendcraft player's deck */
export function pagesOf(rooms, home, here = null, deck = null) {
  return leavesOf(whoChoices(rooms, here), home, { blank: !here, deck });
}

/** Does this kept cast belong on this leaf? A cast for yourself names no room and no page; a cast for a person names
    their room, or their page, or (a move about yourself from their page) the page it was tossed on. */
export function onLeaf(cast, leaf) {
  if (!cast || !leaf || leaf.kind === "blank") return false;
  if (leaf.kind === "self") return cast.lane === "yourself" && !cast.room && !cast.page;
  return (!!leaf.room && (cast.room === leaf.room || cast.page === leaf.room)) || (!!leaf.pid && cast.page === leaf.pid);
}

/** The casts kept on one leaf, newest first, each with its id. Nothing is counted. */
export function castsOn(leaf, home) {
  const all = home && home.casts && typeof home.casts === "object" ? home.casts : {};
  return Object.entries(all).filter(([, c]) => c && typeof c.at === "number" && onLeaf(c, leaf))
    .map(([id, c]) => ({ id, ...c })).sort((a, b) => b.at - a.at);
}

/** The page the book opens to: the one last tossed for (`bookAt`), or yourself on a first sitting (FR-002). */
export function openAt(leaves, home) {
  const at = home && home.bookAt;
  const i = at ? leaves.findIndex(l => l.key === at || (l.pid && l.pid === at)) : -1;
  return i >= 0 ? i : 0;
}

/** What Keep adds to a kept cast so it lands on its page (FR-006): `page` for a named page, or for a move about yourself
    tossed on someone's page; never a name. */
export function pageKeys(entry, leaf) {
  if (!leaf || leaf.kind === "self" || leaf.kind === "blank") return entry;
  if (leaf.kind === "named") return { ...entry, room: null, page: leaf.pid };
  if (!entry.room) return { ...entry, page: leaf.room };
  return entry;
}

/** What the who-choice of a leaf is for the table's move (connection.js moveOf): a named page reads as someone, by name.
    For the store (`o.store`), a named page's move keeps `{name}` where the name goes, so the name lives only in `pages`
    and the page fills it in when it is read (`lineOn`). */
export function whoOf(leaf, o = {}) {
  if (!leaf || leaf.kind === "self") return { kind: "self" };
  if (leaf.kind === "named") return { kind: "named", pid: leaf.pid, room: null, name: o.store ? "{name}" : leaf.name };
  return leaf;
}

/** A kept move's words on its page, with the page's name where a named page's move left `{name}`. */
export const lineOn = (cast, leaf) => String((cast && cast.line) || "").replace(/\{name\}/g, (leaf && leaf.name) || "them");

/** The name on each tab of the fore-edge: the whole name up to ten tabs, then initials so twenty still fit. */
export function tabName(leaf, count) {
  if (!leaf || leaf.kind === "blank") return "";
  if (leaf.kind === "goalblank") return "New";
  if (leaf.kind === "turn") return "Kept";
  return count > 10 ? leaf.name.split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase() : leaf.name;
}

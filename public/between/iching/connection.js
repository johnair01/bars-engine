/* The coin table's advice on connection (Six-faces-council pass bar-intake-2, brief "Coin table, build 2"; his note on
   bi-table-look-1: "The I Ching in the nook would be for giving people advice on how to connect with self or someone in a
   Between"). Plain module, no three.js and no fetch, so every rule here has a test
   (src/lib/between/__tests__/coin-connection.test.ts).

   You choose who the toss is for: yourself, or one person you already share a Between with, and nobody else
   (bi-cast-private). The cast (./cast.js) names a hexagram; connection.json beside this file holds one reading per
   hexagram, written for coming closer, ending in one move. The move goes to one of the Between's three lanes
   (public/calrunia/next-moves.js: yourself, the Between, your partner) with a suit of the /oracle deck to draw from next
   (bi-cast-to-a-move). No AI: the same tosses for the same person always give the same move.

   The suit follows where the cast is moving (the lower trigram is the inner one, the upper the outer):
     no line moving            Wake Up   notice what is real between you
     moving only in lines 1-3  Clean Up  own your part
     moving only in lines 4-6  Show Up   do it together
     moving in both            Grow Up   expand the view */

export const SUITS = {
  WU: { code: "WU", name: "Wake Up", domain: "Notice what is real between you" },
  CU: { code: "CU", name: "Clean Up", domain: "Own your part" },
  GU: { code: "GU", name: "Grow Up", domain: "Expand the view" },
  SU: { code: "SU", name: "Show Up", domain: "Do it together" },
};
export const SELF = { kind: "self" };

/** The suit for a cast: from which lines are moving (changing_lines, 1 = bottom). */
export function suitOf(cast) {
  const ch = (cast && cast.changing_lines) || [];
  if (!ch.length) return "WU";
  const inner = ch.some(i => i <= 3), outer = ch.some(i => i >= 4);
  return inner && outer ? "GU" : inner ? "CU" : "SU";
}

/** Who a toss can be for: yourself, then each person you share an open Between with (from the page's own room list,
    rules.ts roomSummary). Inside a room, only that room's person. Nobody outside your Betweens can be named. */
export function whoChoices(rooms, here = null) {
  const out = [SELF];
  for (const r of rooms || []) {
    if (!r || r.phase !== "between" || !r.person) continue;
    if (here && r.id !== here) continue;
    out.push({ kind: "them", room: r.id, person: r.person, name: r.who ? String(r.who) : "them" });
  }
  return out;
}

/** May this toss be for `who`? Only yourself, or a room in your own list with that person in it. */
export function mayAsk(who, rooms) {
  if (!who || who.kind === "self") return true;
  return whoChoices(rooms).some(w => w.kind === "them" && w.room === who.room && w.person === who.person);
}

const byN = (readings, n) => (readings && readings.readings || []).find(r => r.n === n) || null;

/** The reading and the one move for a cast, for `who`. */
export function moveOf(cast, who, readings) {
  const r = byN(readings, cast.n);
  if (!r) throw new Error("no connection reading for hexagram " + cast.n);
  const self = !who || who.kind === "self";
  const b = cast.becomes ? byN(readings, cast.becomes.n) : null;
  return {
    n: cast.n, name: cast.name, becomes: cast.becomes ? { n: cast.becomes.n, name: cast.becomes.name } : null,
    changing: [...(cast.changing_lines || [])],
    reading: r.reading, heading: b ? b.reading : null,
    line: self ? r.self : r.them.replace(/\{name\}/g, who.name || "them"),
    lane: self ? "yourself" : r.lane,
    suit: suitOf(cast),
    who: self ? SELF : { kind: "them", room: who.room, name: who.name },
  };
}

/** What Keep writes to your homeroom's private doc: `casts.<id>`. The person's name is not stored, only the room. */
export function keptEntry(move, at) {
  return { n: move.n, becomes: move.becomes ? move.becomes.n : null, lane: move.lane, suit: move.suit,
    room: move.who.kind === "them" ? move.who.room : null, line: move.line, at, done: null };
}

/** A cast left face up on the table in a hollow you share (bi-cast-private): a room item only its tosser writes. */
export function faceUpItem(move, by, at) {
  return { kind: "cast", by, at, status: "face-up", n: move.n, becomes: move.becomes ? move.becomes.n : null,
    changing: move.changing, suit: move.suit, line: move.line, answer: {} };
}

/** The other person's answer: a turn from the cast's suit, at the depth they choose, said aloud when you next sit. */
export const DEPTHS = ["easy", "medium", "hard"];
export function answerOf(card, depth, at) {
  if (!card || !DEPTHS.includes(depth)) throw new Error("a card and a depth");
  return { card: card.id, depth, at };
}

/** The card a face-up cast offers its answerer: one card of the cast's suit, the same for the same cast. */
export function cardFor(deck, suit, seed) {
  const cards = ((deck && deck.cards) || []).filter(c => c.suit && c.suit.code === suit);
  if (!cards.length) return null;
  let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return cards[h % cards.length];
}

/** Words a reading must never use: the table is not for work (bi-work-is-harbour). The test runs every reading through it. */
export const WORK_WORDS = /\b(tasks?|deadlines?|teams?|boards?|projects?|meetings?|boss(es)?|clients?|colleagues?|managers?|workorders?|work orders?|offices?|jobs?|careers?|sprints?|deliverables?|shipping|ship it)\b/i;
export const workFree = text => !WORK_WORDS.test(String(text || ""));

/** Your kept moves that are still open (not done, not let go, under a week old), newest first. */
export function openCasts(home, now = Date.now()) {
  const all = home && home.casts && typeof home.casts === "object" ? home.casts : {};
  return Object.entries(all).filter(([, c]) => c && !c.done && typeof c.at === "number" && now - c.at < 7 * 864e5)
    .map(([id, c]) => ({ id, ...c })).sort((a, b) => b.at - a.at);
}

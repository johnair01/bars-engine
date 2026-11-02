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
     moving in both            Grow Up   expand the view

   Build 3b (pass bar-intake-3, his steer on bi-flirtcraft-door: "They learn about themselves and then the other and they
   invite the other into playing"): a toss can also be for someone you are drawn to who has not joined, one of the sparks
   you started. Its move follows his order by suit: Wake Up and Clean Up, a move about yourself; Grow Up, a move to learn
   about them, by curiosity and never pursuit; Show Up, the invitation, the spark's own link with his words. */

export const SUITS = {
  WU: { code: "WU", name: "Wake Up", domain: "Notice what is real between you" },
  CU: { code: "CU", name: "Clean Up", domain: "Own your part" },
  GU: { code: "GU", name: "Grow Up", domain: "Expand the view" },
  SU: { code: "SU", name: "Show Up", domain: "Do it together" },
};
export const SELF = { kind: "self" };
/** The table's last choice when you have no spark yet: it opens the built Plant a spark sheet (garden.js "setup"). */
export const PLANT = { kind: "plant" };
/** His words on the invitation (bi-flirtcraft-door, 2026-10-31). The table lays them with the link; you send it by hand. */
export const INVITE_WORDS = "Let's play together in this room I've made";
/** Where a spark's move goes, by suit (bi-door-order): yourself, then them, then the invitation. */
export const SPARK_LANE = { WU: "yourself", CU: "yourself", GU: "them", SU: "invite" };
/** Every lane a move can name, for the words on the table. */
export const MOVE_LANES = { yourself: "Yourself", between: "The Between", partner: "Your partner", them: "Getting to know them", invite: "The invitation" };
/** The next-moves lane a kept move lives in (public/calrunia/next-moves.js has three): a spark's moves toward them wait
    in the Between lane, with the spark's room, so the move takes you back to it. */
export const nextLaneOf = lane => (lane === "them" || lane === "invite" ? "between" : lane);

/** The suit for a cast: from which lines are moving (changing_lines, 1 = bottom). */
export function suitOf(cast) {
  const ch = (cast && cast.changing_lines) || [];
  if (!ch.length) return "WU";
  const inner = ch.some(i => i <= 3), outer = ch.some(i => i >= 4);
  return inner && outer ? "GU" : inner ? "CU" : "SU";
}

/** Who a toss can be for: yourself, then each person you share an open Between with (from the page's own room list,
    rules.ts roomSummary). Inside a room, only that room's person. Nobody outside your Betweens can be named.
    @param {any[]} rooms  @param {string | null} [here] */
export function whoChoices(rooms, here = null) {
  const out = [SELF];
  for (const r of rooms || []) {
    if (!r || r.phase !== "between" || !r.person) continue;
    if (here && r.id !== here) continue;
    out.push({ kind: "them", room: r.id, person: r.person, name: r.who ? String(r.who) : "them" });
  }
  if (here) return out;
  // your sparks: a room you started toward someone who has not joined (in your own list, a spark has nobody else in it)
  for (const r of rooms || []) {
    if (!r || r.phase !== "spark" || r.person || r.personStarted) continue;
    out.push({ kind: "spark", room: r.id, name: r.who ? String(r.who) : "them" });
  }
  return out;
}

/** May this toss be for `who`? Only yourself, a room in your own list with that person in it, or a spark you started. */
export function mayAsk(who, rooms) {
  if (!who || who.kind === "self") return true;
  if (who.kind === "spark") return whoChoices(rooms).some(w => w.kind === "spark" && w.room === who.room);
  return whoChoices(rooms).some(w => w.kind === "them" && w.room === who.room && w.person === who.person);
}

/** The line a Show Up cast lays for a spark: the invitation, sent by hand or not at all. */
export const inviteLine = name => `When it feels right, send ${name} the link to the room you made, with these words: "${INVITE_WORDS}".`;

const byN = (readings, n) => (readings && readings.readings || []).find(r => r.n === n) || null;

/** The reading and the one move for a cast, for `who`. */
export function moveOf(cast, who, readings) {
  const r = byN(readings, cast.n);
  if (!r) throw new Error("no connection reading for hexagram " + cast.n);
  const self = !who || who.kind === "self";
  const b = cast.becomes ? byN(readings, cast.becomes.n) : null;
  if (who && who.kind === "spark") {
    const suit = suitOf(cast), lane = SPARK_LANE[suit], name = who.name || "them";
    if (lane !== "invite" && !(r.drawn && r.drawn[lane])) throw new Error("no drawn line for hexagram " + cast.n);
    return {
      n: cast.n, name: cast.name, becomes: cast.becomes ? { n: cast.becomes.n, name: cast.becomes.name } : null,
      changing: [...(cast.changing_lines || [])], reading: r.reading, heading: b ? b.reading : null,
      line: lane === "invite" ? inviteLine(name) : r.drawn[lane].replace(/\{name\}/g, name),
      lane, suit, who: { kind: "spark", room: who.room, name },
      invite: lane === "invite" ? { room: who.room, words: INVITE_WORDS } : null,
    };
  }
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
  const lane = nextLaneOf(move.lane); // a move about yourself names no room (rules.ts homeCastOk), even for a spark
  return { n: move.n, becomes: move.becomes ? move.becomes.n : null, lane, suit: move.suit,
    room: lane !== "yourself" && (move.who.kind === "them" || move.who.kind === "spark") ? move.who.room : null, line: move.line, at, done: null };
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
/** Words a move toward someone you are drawn to must never use: the table is not a pickup manual (pass bar-intake-3,
    Challenger). The test runs every `drawn` line and the invitation through it. */
export const PURSUIT_WORDS = /\b(make (them|him|her|\{name\})|get (them|him|her|\{name\}) to|convinc\w*|win|wins|winning|won over|chas\w*|pressur\w*|persuad\w*)\b/i;
export const pursuitFree = text => !PURSUIT_WORDS.test(String(text || ""));

/** Your kept moves that are still open (not done, not let go, under a week old), newest first. */
export function openCasts(home, now = Date.now()) {
  const all = home && home.casts && typeof home.casts === "object" ? home.casts : {};
  return Object.entries(all).filter(([, c]) => c && !c.done && typeof c.at === "number" && now - c.at < 7 * 864e5)
    .map(([id, c]) => ({ id, ...c })).sort((a, b) => b.at - a.at);
}

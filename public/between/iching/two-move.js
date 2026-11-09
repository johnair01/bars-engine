/* The I Ching two-move card (Six-faces-council spec .specify/specs/iching-two-move, his rulings ic2-which-trigram B and
   ic2-moog-reach A). A cast hexagram offers two slips: the inner move from its lower trigram and the outer move from its
   upper trigram. Each slip names the one good of that trigram's pair the charge is short of, a one-line move and the
   good's overdone side. Plain module, no three.js and no fetch, so every rule has a test
   (src/lib/between/__tests__/two-move.test.ts). The same hexagram and charge always give the same slips: with no model
   the sixteen stock lines below word them (FR-007; Wendell reviews them on the build's look).

   The trigram pairs mirror TRIGRAM_RELATIONAL_PAIR2 (src/lib/creator-scene-grid-deck/archetype-trigram-polarities.ts);
   a test keeps the two in step. The move lines are written fresh. They are never Anthony and Moog's words and never the
   card's words (FR-004); the card view credits the translation. The table is the King Wen order of hexagrams.json, never
   getHexagramStructure in iching-struct.ts (FR-001). */

export const PAIRS = {
  Heaven: ["Spark", "Restraint"],
  Earth: ["Nurture", "Self-nurture"],
  Thunder: ["Breakthrough", "Timing"],
  Wind: ["Subtle", "Direct"],
  Water: ["Venture", "Anchor"],
  Fire: ["Clarify", "Tact"],
  Mountain: ["Pause", "Proceed"],
  Lake: ["Widen", "Deepen"],
};

/** hexagrams.json spells the trigrams in lower case: "heaven", "earth", "thunder", "wind", "water", "fire", "mountain", "lake". */
const NAME = t => (t ? String(t)[0].toUpperCase() + String(t).slice(1).toLowerCase() : "");

/** The sixteen stock lines, one per good: the move (under 20 words) and its overdone side (starts with the good's name). */
export const STOCK = {
  Spark: { move: "Make the first rough version today, ugly on purpose: a sketch, a draft line, a dialled number.", overdone: "Spark starts five things and finishes none of them." },
  Restraint: { move: "Cut the last thing you added to this, and see whether anyone misses it.", overdone: "Restraint keeps trimming until nothing is left to grow." },
  Nurture: { move: "Ask the person nearest this what would make their week easier, then do exactly that.", overdone: "Nurture tends their feelings while the work they asked for waits." },
  "Self-nurture": { move: "Put a block on tomorrow's calendar with your name on it, and refuse the first request for it.", overdone: "Self-nurture closes the door on the people counting on you." },
  Breakthrough: { move: "Send the message you drafted and never sent; if there is none, write it and send it now.", overdone: "Breakthrough forces open what would have opened by itself next week." },
  Timing: { move: "Pick the date you will act on this, and name the sign that will tell you it is time.", overdone: "Timing keeps moving the date and calls the delay patience." },
  Subtle: { move: "Shift a habit instead of making an announcement: where you sit, when you arrive, what you bring.", overdone: "Subtle hints so softly that nobody knows anything changed." },
  Direct: { move: "Say the sentence you have been rehearsing, to the person it is for, in your first minute together.", overdone: "Direct says the true thing and leaves before they can answer." },
  Venture: { move: "Raise the question about this you fear has a bad answer, and hear the answer through.", overdone: "Venture chases the risk for the rush and forgets what it came for." },
  Anchor: { move: "List three things about this that will still be true next month, and decide from those.", overdone: "Anchor holds the old plan after the facts have changed." },
  Clarify: { move: "Finish this sentence on paper: \"I will know this worked when...\" Keep the first ending.", overdone: "Clarify rewrites the goal again instead of starting on it." },
  Tact: { move: "Before you raise this, name aloud what the other person got right, then make your point.", overdone: "Tact wraps the hard part so well that they never find it." },
  Pause: { move: "Sit for ten minutes without your phone, and notice the first worry that surfaces.", overdone: "Pause stays seated long after the rest has done its work." },
  Proceed: { move: "Do the next step on your list before noon, without checking with anyone first.", overdone: "Proceed walks past the warning signs because the plan said go." },
  Widen: { move: "Tell this to someone who knows nothing about it, and take their first question seriously.", overdone: "Widen gathers so many views that your own goes missing." },
  Deepen: { move: "Choose the part of this that stung most, and give it a full written page by itself.", overdone: "Deepen circles the same wound after it has stopped teaching." },
};

/** FNV-1a: a small, stable hash for the deterministic pick. */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** The hexagram's [lower, upper] trigram names, from hexagrams.json (`table.hexagrams`, King Wen order). */
export function trigramsOf(table, n) {
  const h = table && table.hexagrams && table.hexagrams[n - 1];
  if (!h || h.n !== n) throw new Error("no hexagram " + n);
  return [NAME(h.lower), NAME(h.upper)];
}

/** Which of a trigram's two goods the charge is short of: a named `short` good first, then a named player polarity
    (`polarity.a` / `polarity.b` read first, `ic2-conscious-first`; the pole they privilege is the one they are NOT short
    of), then a stable pick from the charge text.
    @param {string} trigram @param {{ text?: string, short?: string, polarity?: { a: string, b: string, over?: string } }} charge @param {number} n @param {string} side */
export function shortOf(trigram, charge, n, side) {
  const [a, b] = PAIRS[trigram], c = charge || {};
  const want = x => (x ? String(x).trim().toLowerCase() : "");
  const s = want(c.short);
  if (s === a.toLowerCase()) return a;
  if (s === b.toLowerCase()) return b;
  const p = c.polarity;
  if (p && p.over) {
    const o = want(p.over);
    if (o === a.toLowerCase()) return b;
    if (o === b.toLowerCase()) return a;
  }
  return hash(`${n}|${side}|${want(c.text)}`) % 2 === 0 ? a : b;
}

function slipOf(side, trigram, good) {
  const [a, b] = PAIRS[trigram], other = good === a ? b : a, st = STOCK[good];
  return { side, trigram, good, otherGood: other, move: st.move, overdone: st.overdone };
}

/** The two slips for a cast hexagram on a charge: `inner` from the lower trigram, `outer` from the upper (FR-002, FR-003).
    @param {any} table hexagrams.json parsed @param {number} n @param {{ text?: string, short?: string, polarity?: { a: string, b: string, over?: string } }} charge */
export function twoMovesFor(table, n, charge) {
  const [lower, upper] = trigramsOf(table, n);
  return [slipOf("inner", lower, shortOf(lower, charge, n, "inner")), slipOf("outer", upper, shortOf(upper, charge, n, "outer"))];
}

/** The no-model track: turn a slip to the other good of its pair (the player's own choice of the good they are short of). */
export function turnSlip(slip) {
  return slipOf(slip.side, slip.trigram, slip.otherGood);
}

/** What the charge's record keeps when a slip is taken (FR-006): the lean. */
export function leanOf(hexagram, slip) {
  return { hexagram, side: slip.side, trigram: slip.trigram, good: slip.good };
}

/** The provenance snapshot a taken slip carries on its BAR seed (FR-008); immutable once written. */
export function snapshotOf(hexagram, slip, chargeId, drawnAt) {
  return { source: "iching-two-move", hexagram, side: slip.side, trigram: slip.trigram, good: slip.good, chargeId: chargeId || null, drawnAt: drawnAt || new Date().toISOString() };
}

/** One draw per charge until its spirit is met (FR-005): of the casts kept on a page, the one still holding an open slip
    (it has a lean, is not done, and is under a week old, the same window as openCasts), or null. The page is closed to a
    new toss while it returns one. @param {Array<{ lean?: unknown, done?: number | null, at?: number }>} casts the page's casts, newest first */
export function openSlip(casts, now = Date.now()) {
  return (casts || []).find(c => c && c.lean && !c.done && typeof c.at === "number" && now - c.at < 7 * 864e5) || null;
}

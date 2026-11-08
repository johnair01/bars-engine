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
  Spark: { move: "Start the small thing you have been waiting to feel ready for, and stop after ten minutes.", overdone: "Spark rushes past the care the thing needs." },
  Restraint: { move: "Leave one thing alone today that you would normally add to, and see what stays good without you.", overdone: "Restraint held too long stalls everything new." },
  Nurture: { move: "Do one small thing today that helps someone else's work or rest, and ask for nothing back.", overdone: "Nurture turns into tending their reaction instead of your own." },
  "Self-nurture": { move: "Take one hour that is only yours, and spend it on what you actually need, not what you owe.", overdone: "Self-nurture becomes absence when someone needs you there." },
  Breakthrough: { move: "Do the one thing you keep circling, now, before you have a better reason.", overdone: "Breakthrough breaks what only needed another day." },
  Timing: { move: "Name the moment that would be right, and wait for it on purpose instead of by default.", overdone: "Timing waits so long that nobody is prepared." },
  Subtle: { move: "Change one small thing in how you show up, and watch what shifts without announcing it.", overdone: "Subtle goes so quiet nobody notices the change." },
  Direct: { move: "Say the plain sentence out loud to one person, with no setup.", overdone: "Direct turns blunt and leaves no room for their answer." },
  Venture: { move: "Take one real step into the unknown part, and write down what you find there.", overdone: "Venture runs ahead of the ground under it." },
  Anchor: { move: "Name the one thing you can count on right now, and stand on it before you move.", overdone: "Anchor becomes staying put because it feels safe." },
  Clarify: { move: "Write down in one sentence what you actually want from this, then check it against what you did.", overdone: "Clarify keeps sharpening when it is time to act." },
  Tact: { move: "Choose what to leave unsaid today, and say the rest kindly.", overdone: "Tact smooths over what needed to be said." },
  Pause: { move: "Stop for ten minutes with nothing in your hands, and notice what you were carrying.", overdone: "Pause becomes avoiding the next thing." },
  Proceed: { move: "Take the next step you already know, without asking anyone whether it is allowed.", overdone: "Proceed pushes through what was asking you to look." },
  Widen: { move: "Ask one person outside your usual circle what they see in this.", overdone: "Widen spreads you across more than you can hold." },
  Deepen: { move: "Stay with one part of this for a full hour, and go further into it than is comfortable.", overdone: "Deepen digs in so far you lose sight of the rest." },
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

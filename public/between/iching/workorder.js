/* The workorder the coin table writes (Six-faces-council pass bar-intake-1, "The workorder" in
   council/callsheets/bar-intake.md). Plain module, no three.js, so it has a test (src/lib/between/__tests__/coin-table.test.ts).

   Six tosses, six lines, bottom up by altitude: each line is one game master writing one line of the workorder. Each
   offers the council's answer, marked, and two others; one tap keeps one. The coins never choose the answer: they set
   the reading and mark the lines still moving (bi-coins-inform), which the table shows as "still moving, look again". */

export const FACES = [
  { key: "shaman", name: "Shaman", asks: "Where does the body meet it?", color: "#6fd0d0" },
  { key: "challenger", name: "Challenger", asks: "What would break it, and what is the smallest test?", color: "#e8896f" },
  { key: "regent", name: "Regent", asks: "What stays as it is?", color: "#e0c25a" },
  { key: "architect", name: "Architect", asks: "Where does it run?", color: "#9fb2c8" },
  { key: "diplomat", name: "Diplomat", asks: "What is the first minute?", color: "#6fc795" },
  { key: "sage", name: "Sage", asks: "What does the record already say?", color: "#a99ae0" },
];

/* The council's answers already written for a card, by step id: the first workorder, written by hand in the shape this
   table makes (council/workorders/ttv-cmvvan71s001412hdijdu74gg.md, "The six lines"). */
export const KNOWN = {
  "ttv-cmvvan71s001412hdijdu74gg": {
    project: "The Between", face: "Architect",
    why: "Wendell can carry any idea he catches at Tap the Vein to a card the council picks up, by tossing coins in his nook instead of writing a brief.",
    lines: [
      "His avatar walks to the low table by the nook's hearth, sits, and tosses three coins with a tap; the book on the shelf opens a reading at once for the skip.",
      "A cast that decides the work would break it: the coins set the reading and which line is still moving, and the answer on each line is his. Smallest test: one real BAR through the table, sealed, and found on the council board.",
      "Everything he said yes to on fb-look-01 (book on the shelf, coins on a low table by the hearth), the cushion fixes of #466, and the With Claude route that already carries a handed card to a thread.",
      "bars-engine's Between page, the nook and the hollow; the council's coin method and readings ported and checked line for line against cast.py.",
      "He wakes in the nook, walks past the map stand to the hearth, sees three coins and a card from his hand on the low table, sits, and taps six times; at the sixth the card seals and a lantern carries it out.",
      "fb-iching-book-coins, fb-book-coins-both, fb-look-01 (his yes, 2026-10-27), the iching-casting spec, the feature request move, ctw-in-the-nook.",
    ],
  },
};

/* What each game master offers for a card nobody has written lines for yet: the first is the council's answer. */
const GENERIC = [
  [ "Something he walks to and touches in the Between, with his avatar.", "Something he holds and taps on his phone, in one screen.", "Something he hears or says aloud, with no screen." ],
  [ "It breaks if it pulls him out of flow: gate it inside the flow. Smallest test: one real use, found where it should land.", "It breaks if someone already built it: check the tool ladder first.", "It breaks if it needs his steering to finish: name the one thing only he can do." ],
  [ "Everything built and said yes to near it stays; this adds, it does not replace.", "It stands apart: nothing old is touched.", "It replaces an older piece, named in a Steer card first." ],
  [ "In the Between on bars-engine.", "On the Council Board.", "In the council repo, as a tool or a doc." ],
  [ "The first minute is him moving: a walk, a sit, a tap.", "The first minute is one tap from the board.", "The first minute is a look he opens from the board." ],
  [ "The record has footing for it: the thread reads it before building.", "Nothing in the record yet: it starts fresh.", "The record says no to part of it: the thread names which part on the board." ],
];

/** What the game master of line i (0 = bottom) offers for this card: the council's answer first, marked. */
export function offers(card, i) {
  const known = card && KNOWN[card.id];
  const list = known ? [known.lines[i], ...GENERIC[i].slice(1)] : GENERIC[i];
  return { ...FACES[i], line: i + 1, options: list.map((text, k) => ({ text, council: k === 0 })) };
}

const short = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };

/** The workorder for a card, its cast and the six kept lines (strings, bottom up). */
export function workorder(card, cast, kept, at = new Date().toISOString()) {
  if (!card || !cast || kept.length !== 6 || kept.some(k => !k)) throw new Error("a card, its cast and six kept lines");
  const known = KNOWN[card.id] || {};
  const front = {
    project: known.project || "From Tap the Vein",
    face: known.face || "Architect",
    why: known.why || `Wendell keeps the idea "${short(card.do, 90)}" without working on it tonight; the council carries it.`,
    next: `Claude builds it: ${short(card.do, 140)}`,
    needs: "nothing until the look",
    move: "Claude Takes It",
  };
  const castOut = { n: cast.n, name: cast.name, cn: cast.cn, pinyin: cast.pinyin, shows: cast.shows, tosses: cast.tosses, changing: cast.changing_lines,
    becomes: cast.becomes ? { n: cast.becomes.n, name: cast.becomes.name, shows: cast.becomes.shows } : null };
  const lines = FACES.map((f, i) => ({ face: f.name, line: kept[i], moving: cast.changing_lines.includes(i + 1) }));
  const md = [
    `# Workorder: ${short(card.do, 80)}`, "",
    `Sealed at the coin table, ${at.slice(0, 10)} (step \`${card.id}\`).`, "",
    "## The BAR, in his words", "",
    `- Caught${card.ttvDate ? ` at Tap the Vein, ${card.ttvDate}` : ""}: "${card.do}".`, "",
    "## Front", "",
    `- Project and face: ${front.project}, held by the ${front.face}.`, `- Why: ${front.why}`, `- Next step: ${front.next}`,
    `- Needs from him: ${front.needs}.`, `- Recommended move: ${front.move}.`, "",
    "## Inside", "", "### The cast", "",
    `Three coins at the table: hexagram ${cast.n}, ${cast.name} (${cast.cn}, ${cast.pinyin}). Shows: "${cast.shows}"` +
      (cast.becomes ? ` Changing lines ${cast.changing_lines.join(", ")}; it becomes hexagram ${cast.becomes.n}, ${cast.becomes.name}: "${cast.becomes.shows}"` : " No changing lines."), "",
    "### The six lines (one game master each, bottom up, by altitude)", "",
    ...lines.map((l, i) => `${i + 1}. ${l.face}: ${l.line}${l.moving ? " (still moving)" : ""}`), "",
  ].join("\n");
  return { front, cast: castOut, lines, md, at };
}

/** The write that seals the card: what Hand it to Claude writes, with the workorder beside it (board/template.html hdWrite). */
export function sealSave(card, wo) {
  const text = `Sealed at the coin table: hexagram ${wo.cast.n}, ${wo.cast.name}. ${wo.front.next}`;
  return { board: "council", collection: "steps", docId: card.id, mode: "update",
    data: { aiBack: { text, automate: false, at: wo.at, from: "coin-table", workorder: wo }, inHand: null } };
}

/** A card in his hand, from GET /api/board/saves?board=council: the board's hdHeld (board/template.html), less the
    stDep/stSup closings, which need the whole board: held, not done or retired, not discarded for now, not handed, not
    blocking. */
export function hand(docs, now = new Date().toISOString()) {
  const steps = (docs && docs.steps) || {};
  const blocking = s => s.blocking && !s.aiBack;
  return Object.entries(steps)
    .filter(([, s]) => s && s.inHand && !s.done && !s.retired && !(s.discardedUntil && s.discardedUntil > now) && !s.aiBack && !blocking(s))
    .map(([id, s]) => ({ id, do: s.do, ttvDate: s.ttv && s.ttv.date, inHand: s.inHand }))
    .sort((a, b) => String(b.inHand).localeCompare(String(a.inHand)));
}

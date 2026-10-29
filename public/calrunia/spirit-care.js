/* Spirit care: what a check-in's ember does for a spirit (the council's spirit-care sim, Between rooms part 4).
   A check-in is a W.A.V.E. walked through, and it leaves an ember of the feeling that was here. Given to a spirit, the
   ember feeds it. Satisfaction runs 1 to 10 and starts at 7: each act of care adds one, and every third day nobody tends
   it takes one away. Vitality starts at 100: each untended day takes 5, each act of care gives 20. A spirit low in
   satisfaction (3 or less) is unsettled, never corrupted. Nothing here dies: that waits for a later round.
   Plain module, no three.js, so the caves and Big Mind can take it as it is. */

// The seven steps, word for word from the Cave of Lessons (content/ontology-game/cave/cave.js, WAVE).
export const WAVE_STEPS = [
  { id: "welcome", name: "Welcome", line: "Let whatever's here be here for a moment, without needing it to be different yet." },
  { id: "acknowledge", name: "Acknowledge", line: "Admit that it's here. You don't have to like it." },
  { id: "allow", name: "Allow", line: "Let it take up as much of you as it's taking. You don't have to make it smaller." },
  { id: "accept", name: "Accept", line: "Let it be here without fighting it." },
  { id: "appreciate", name: "Appreciate", line: "Find what it's been trying to do for you." },
  { id: "validate", name: "Validate", line: "Your body has the right to feel this, whatever it is." },
  { id: "exhale", name: "Exhale", line: "Is this feeling in alignment with what you actually want right now?" },
];

export const CARE = { sat: 7, satMin: 1, satMax: 10, vit: 100, vitMin: 0, vitMax: 100, unsettled: 3, perCare: 1, ownElement: 2, vitPerCare: 20, vitPerDay: 5, satDays: 3 };
const DAY = 864e5;
const num = (v, d) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** A spirit's care as stored ({ sat, vit, at }), with the starting values for anything missing. `at` is the last tending. */
export function careOf(care) {
  const c = care && typeof care === "object" ? care : {};
  return { sat: clamp(Math.round(num(c.sat, CARE.sat)), CARE.satMin, CARE.satMax), vit: clamp(num(c.vit, CARE.vit), CARE.vitMin, CARE.vitMax), at: num(c.at, null) };
}

/** How the spirit is at `at`: its care after the untended days, and a word for it (thriving, dimming or unsettled). */
export function careNow(care, at = Date.now()) {
  const c = careOf(care);
  const days = c.at == null ? 0 : Math.max(0, Math.floor((at - c.at) / DAY));
  const sat = clamp(c.sat - Math.floor(days / CARE.satDays), CARE.satMin, CARE.satMax);
  const vit = clamp(c.vit - days * CARE.vitPerDay, CARE.vitMin, CARE.vitMax);
  const word = sat <= CARE.unsettled ? "unsettled" : sat <= 5 || vit < 50 ? "dimming" : "thriving";
  return { sat, vit, days, word };
}

/** The care a spirit has after being given an ember of `emberFeel` (an element, wood to water) at `at`. An ember of the
    spirit's own element feeds it twice over. The result is what to store. */
export function feed(care, emberFeel, spiritElement, at = Date.now()) {
  const n = careNow(care, at);
  const own = !!emberFeel && !!spiritElement && String(emberFeel).toLowerCase() === String(spiritElement).toLowerCase();
  return { sat: clamp(n.sat + (own ? CARE.ownElement : CARE.perCare), CARE.satMin, CARE.satMax), vit: clamp(n.vit + CARE.vitPerCare, CARE.vitMin, CARE.vitMax), at };
}

/** The words a player reads for each care word. */
export const CARE_WORDS = { thriving: "Thriving", dimming: "Dimming, and glad of company", unsettled: "Unsettled. It has gone a while untended" };

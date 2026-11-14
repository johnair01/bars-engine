/* What a tap in the room lands on (Six-faces-council pt1-cushion-first, playtest 1 of 2026-10-28: the player tried to sit and
   the taps landed on the spark). Every thing the tap's ray passes close to is a hit { key, along }, along being how far down
   the ray it is. The nearest hit wins, except that a seat takes the tap ahead of anything standing over it or in front of it
   (the spark, a spirit curled beside the cushion, a placed item), so sitting is always the first move a cushion offers.
   Pure: no three.js, no DOM, so the rule reads the same here and in the tests. */
export const isSeat = key => typeof key === "string" && key.startsWith("seat:");
const first = isSeat;

export function pickTap(hits) {
  let best = null;
  for (const h of hits || []) {
    if (!h) continue;
    if (!best) { best = h; continue; }
    const s = first(h.key), bs = first(best.key);
    if (s !== bs ? s : h.along < best.along) best = h;
  }
  return best;
}

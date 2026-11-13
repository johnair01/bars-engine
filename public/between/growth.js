/* The tea on the Between's low table (Six-faces-council spec .specify/specs/friendcraft-deck-2 FR-009, to the contract of
   .specify/specs/friendship-between-growth/spec.md). Only `isFeed` and `bowls` are built here; the growth build adds the cup,
   the lantern, the spirit and the creature to the same two names. There is no stored count: bowls are read from the
   Between's own items, so both friends read the same tea (fbg-one-record). Plain module, no fetch, so every rule has a test
   (src/lib/between/__tests__/growth-feed.test.ts). */

export const BOWLS_MAX = 3;

const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = v => typeof v === "number" && Number.isFinite(v);

/** The items as a list of [id, item], whether they arrive as the poll's map or as a list. */
function entries(items) {
  if (Array.isArray(items)) return items.map((it, i) => [it && it.id != null ? String(it.id) : String(i), it && it.data ? it.data : it]);
  return isObj(items) ? Object.entries(items) : [];
}

/**
 * What one item feeds the Between, or null. A cast the other friend answered feeds at that answer's time; a turn both
 * friends answered (status kept) feeds at its `keptAt`. A cup writes nothing yet, so it is not here.
 * @returns {{ kind: "answer" | "turn", by: string[], at: number } | null}
 */
export function isFeed(item) {
  if (!isObj(item)) return null;
  if (item.kind === "cast" && isObj(item.answer)) {
    const answered = Object.entries(item.answer).filter(([u, a]) => u !== item.by && isObj(a) && isNum(a.at));
    if (!answered.length) return null;
    const [u, a] = answered.sort((x, y) => y[1].at - x[1].at)[0];
    return { kind: "answer", by: [u], at: a.at };
  }
  if (item.kind === "turn" && item.status === "kept" && isNum(item.keptAt)) {
    return { kind: "turn", by: [item.by, item.owner], at: item.keptAt };
  }
  return null;
}

/** Tea on the table, 0 to 3: each answer and turn feed fills one bowl, up to three; each spend empties what it took. */
export function bowls(items) {
  let fed = 0, spent = 0;
  for (const [, it] of entries(items)) {
    if (isFeed(it)) fed++;
    else if (isObj(it) && it.kind === "spend" && isNum(it.bowls)) spent += it.bowls;
  }
  return Math.max(0, Math.min(BOWLS_MAX, fed) - spent);
}

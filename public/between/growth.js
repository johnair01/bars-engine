/* The friendship Between grows from play (Six-faces-council .specify/specs/friendship-between-growth, FR-001 to FR-006).
   One pure module: it reads the Between's shared items and spirits and returns { feeds, health, kept, growth, potsFound, bowls }.
   No three.js, no DOM, no clock but the `now` it is given, no private doc, so both friends compute the same Between and
   garden.js, sky-qi.js and the server's roomSummary read the one thing. Nothing here is stored: health, kept days, growth and
   the bowls are four readings of the items and spirits that already exist (fbg-one-record), so nothing can drift.
   Nothing it returns is ever drawn as a number (FR-013). */

import { betweenDay, DAY_MS, gameFeed } from "./games/core.js";

/** Growth at which the shelf's pots 1..4 are found (the Regent may retune). */
export const POTS = [3, 8, 15, 25];
/** The kettle's first tea, then one per pot. */
export const TEAS = ["hearth", "smoke", "green", "blossom", "moon"];
/** The two forms the Between already draws; a new form waits on a stills round. */
export const FORM_OF = { wood: "fox", fire: "fox", earth: "tortoise", metal: "tortoise", water: "tortoise" };
/** Feeds that fill a bowl of tea (FR-004). Games feed the light and the growth but pour no tea. */
export const BOWL_KINDS = ["answer", "turn", "cup"];
export const FEED_DAYS = 7;
export const BOWLS_MAX = 3;
export const KEPT_LIFT = 0.3;

const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const isNum = v => typeof v === "number" && Number.isFinite(v);
const listOf = x => x instanceof Map ? [...x.values()] : Array.isArray(x) ? x : isObj(x) ? Object.values(x) : [];
const uniq = a => [...new Set(a.filter(Boolean))];

/** The one list a feed is read from. Friendcraft slice 2 adds its turn kind here and nowhere else (the `turn` case).
    Returns { kind, by: [uid, ...], at } or null. `by` names everyone who took part, so a day is kept when the two of them did. */
export function isFeed(item) {
  if (!isObj(item)) return null;
  if (item.kind === "cast" && isObj(item.answer)) {
    const answers = Object.entries(item.answer).filter(([uid, a]) => uid !== item.by && isObj(a) && isNum(a.at));
    if (!answers.length) return null;
    const last = answers.reduce((m, e) => e[1].at > m[1].at ? e : m);
    return { kind: "answer", by: uniq([item.by, last[0]]), at: last[1].at };
  }
  if (item.kind === "turn" && item.status === "kept" && isNum(item.keptAt)) { // friendcraft slice 2: a turn both friends answered is kept at its keptAt
    return { kind: "turn", by: uniq([item.by, item.owner]), at: item.keptAt };
  }
  if (item.kind === "turn" && isObj(item.answer)) { // a turn answered by both, before it is marked kept
    const answers = Object.entries(item.answer).filter(([, a]) => isObj(a) && isNum(a.at));
    if (answers.length < 2) return null;
    return { kind: "turn", by: uniq(answers.map(e => e[0])), at: Math.max(...answers.map(e => e[1].at)) };
  }
  if (item.kind === "cup" && item.status === "drunk" && item.drunkBy && isNum(item.drunkAt)) return { kind: "cup", by: uniq([item.by, item.drunkBy]), at: item.drunkAt };
  if (item.kind === "lantern" && isObj(item.yes)) {
    const ys = Object.entries(item.yes).filter(([k, v]) => k !== item.by && isNum(v));
    if (!ys.length) return null;
    return { kind: "lantern", by: uniq([item.by, ys[0][0]]), at: Math.min(...ys.map(e => e[1])) };
  }
  const g = gameFeed(item);
  return g && isNum(g.at) ? { kind: g.kind, by: uniq(g.by), at: g.at } : null;
}

/** A spirit woken at a hollow's hearth is a feed (FR-002). */
function spiritFeed(sp) {
  return isObj(sp) && sp.hearth === true && sp.fromEmber === true && isNum(sp.at) ? { kind: "spirit", by: uniq([sp.owner]), at: sp.at } : null;
}

const isSpend = it => isObj(it) && it.kind === "spend" && isNum(it.at);

/** What the light has always read (garden.js satisfaction): agreements held and offerings received or kept. */
function built(items) {
  let agreed = 0, fed = 0;
  for (const it of items) {
    if (!isObj(it)) continue;
    if (it.kind === "agreement" && it.status === "agreed") agreed++;
    else if (it.kind === "lantern") { if (isObj(it.yes) && Object.entries(it.yes).some(([k, v]) => k !== it.by && isNum(v))) fed++; }
    else if (it.kind !== "agreement" && (it.status === "received" || it.status === "kept")) fed++;
  }
  return { agreed, fed };
}

/** Kept days (FR-006): the run of Between days, ending today or yesterday, on which both members took part; one missed day inside
    a run is forgiven once per run. Also returns the run that last held, for the settle after a lapse. */
export function keptRun(keptSet, today) {
  const runFrom = start => {
    let d = start, n = 0, forgiven = false;
    while (d >= 0) {
      if (keptSet.has(d)) { n++; d--; }
      else if (!forgiven && n > 0 && keptSet.has(d - 1)) { forgiven = true; d--; }
      else break;
    }
    return n;
  };
  if (keptSet.has(today)) return { kept: runFrom(today), lapsed: 0 };
  if (keptSet.has(today - 1)) return { kept: runFrom(today - 1), lapsed: 0 };
  const days = [...keptSet].filter(d => d < today - 1);
  if (!days.length) return { kept: 0, lapsed: 0 };
  const last = Math.max(...days);
  return { kept: 0, lapsed: today - 1 - last, was: runFrom(last) };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Reads the Between. `items` and `spirits` may be a Map, an array or an object of docs.
 * @param {{ items?: any, spirits?: any, garden?: any, members?: any[], now?: number }} [arg] */
export function read({ items = [], spirits = [], garden = {}, members = [], now = 0 } = {}) {
  const its = listOf(items), sps = listOf(spirits);
  const feeds = [...its.map(isFeed), ...sps.map(spiritFeed)].filter(Boolean).sort((a, b) => a.at - b.at);
  const growth = feeds.length;
  const potsFound = POTS.filter(p => growth >= p).length;
  // bowls: each answer, turn or cup pours one, a spend empties one, in the order they happened, never above three (FR-004)
  const pours = feeds.filter(f => BOWL_KINDS.includes(f.kind)).map(f => ({ at: f.at, d: 1 }));
  const spends = its.filter(isSpend).map(s => ({ at: s.at, d: -1 }));
  let bowls = 0;
  for (const e of [...pours, ...spends].sort((a, b) => a.at - b.at || b.d - a.d)) bowls = clamp(bowls + e.d, 0, 3);
  // kept days (FR-006)
  const ids = members.length ? members : uniq(feeds.flatMap(f => f.by));
  const today = betweenDay(garden, now);
  const dayParts = new Map();
  for (const f of feeds) {
    if (f.at > now) continue;
    const d = betweenDay(garden, f.at);
    if (!dayParts.has(d)) dayParts.set(d, new Set());
    for (const u of f.by) dayParts.get(d).add(u);
  }
  const keptSet = new Set([...dayParts].filter(([, s]) => ids.length >= 2 && ids.every(u => s.has(u))).map(([d]) => d));
  const run = keptRun(keptSet, today);
  const lift = run.kept > 0 ? Math.min(run.kept, 7) * KEPT_LIFT : Math.max(0, Math.min(run.was || 0, 7) * KEPT_LIFT - run.lapsed * KEPT_LIFT);
  // health: the built inputs, the feeds of the last seven days (a lit lantern is already in the built inputs), the kept lift
  const { agreed, fed } = built(its);
  const feeds7 = feeds.filter(f => f.kind !== "lantern" && f.at <= now && now - f.at < FEED_DAYS * DAY_MS).length;
  const health = clamp(Math.round(3 + Math.min(agreed, 4) * 1.2 + Math.min(fed, 8) * 0.6 + Math.min(feeds7, 10) * 0.35 + lift), 1, 10);
  return { feeds, health, kept: run.kept, growth, potsFound, bowls };
}

/** The tea of the newest found pot, or the kettle's first: TEAS[potsFound]. */
export const teaOf = potsFound => TEAS[clamp(potsFound, 0, TEAS.length - 1)];

/** A new pot is on the shelf until someone pours from it (FR-005): the newest found pot has no cup poured of its tea. */
export function newPot(r, items) {
  if (!r.potsFound) return false;
  const tea = TEAS[r.potsFound];
  return !listOf(items).some(it => isObj(it) && it.kind === "cup" && it.tea === tea);
}

/** Previews only (FR-014): a stand-in Between with `feeds` feeds, the last `kept` days kept and `lapsed` days since. */
export function standIn({ feeds = 0, kept = 0, lapsed = 0, now = 0, me = "you", them = "them" } = {}) {
  const startedAt = now - 30 * DAY_MS, items = new Map();
  let i = 0;
  const put = (at, who) => { items.set("s" + i, { kind: "cast", by: who === me ? them : me, at: at - 1, status: "face-up", answer: { [who]: { card: "c" + i, depth: "easy", at } } }); i++; };
  const top = now - lapsed * DAY_MS;
  let left = feeds;
  for (let d = 0; d < kept && left > 1; d++) { put(top - d * DAY_MS - 3600e3, me); put(top - d * DAY_MS - 1800e3, them); left -= 2; }
  for (let k = 0; left > 0; k++, left--) put(startedAt + (k + 1) * 3600e3 * 5, k % 2 ? me : them);
  return { items, garden: { startedAt, betweenSince: startedAt }, members: [me, them], now };
}

/** Tea on the table from a bare item list or map, 0 to BOWLS_MAX (friendcraft slice 2's reading, kept for turn-table.js and the
    server's turn route): each bowl-kind feed fills one bowl, each spend empties the bowls it names (a spend with no count empties one). */
export function bowls(items) {
  let fed = 0, spent = 0;
  for (const it of listOf(items)) {
    const d = isObj(it) && isObj(it.data) && it.kind == null ? it.data : it;
    const f = isFeed(d);
    if (f) { if (BOWL_KINDS.includes(f.kind)) fed++; }
    else if (isObj(d) && d.kind === "spend") spent += isNum(d.bowls) ? d.bowls : 1;
  }
  return Math.max(0, Math.min(BOWLS_MAX, fed) - spent);
}

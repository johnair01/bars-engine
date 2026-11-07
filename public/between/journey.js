/* The healing journey's rules (Six-faces-council spec .specify/specs/healing-journey, slice 1, T004). Plain module, no
   three.js and no database, so every rule has a test (src/lib/between/__tests__/journey.test.ts). The nook draws what
   this says; src/lib/between/rules.ts guards the document it reads.
   His rulings: a move counts because it was made, never for its content (hj-moves); the pile never shrinks and nothing
   shows a streak, a score or a missed day on the play surface (hj-woodpile); closing deletes the pages and keeps the
   world (hj-weekly-practice). The document is data/users/<player id>/journey; `moves` keeps no text. */

/* The seven acts at the homeroom's furniture, in the order of the spec's contract. */
export const MOVES = ["floorboards", "window", "chair", "workbench", "doorway", "hearth", "diary"];
export const FEELINGS = ["wood", "fire", "earth", "metal", "water"];
export const OBJECT_STATES = ["carried", "held", "worked", "left"];
export const PLACE_STATES = ["dark", "lit", "ajar", "befriended"];
/* The pack's size that lights the next place (hj-pack-calls). */
export const PACK_LIGHTS_PLACE = 3;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400000;
const arr = (v) => (Array.isArray(v) ? v : []);
const real = (m) => !!m && typeof m === "object" && MOVES.includes(m.move);

/* One log per move record, always (hj-log-per-making): no daily cap, no decay, no removal. A record naming no real
   move is not a making and adds no wood. */
export function logsOf(moves) { return arr(moves).filter(real).length; }

/* How many times each move was made, all seven present (a move never made reads 0). "I did it in my life" counts
   toward the same move, so it is one number per move. Never a total of the person (FR-009). */
export function countsByMove(moves) {
  const out = {};
  for (const m of MOVES) out[m] = 0;
  for (const r of arr(moves)) if (real(r)) out[r.move] += 1;
  return out;
}

/* The program's days from startsOn to endsOn inclusive, each with the moves made that day. The coach reads "made" or
   "not made" (FR-010); no streak, no warning, no count of the missed. */
export function daysOf(moves, startsOn, endsOn) {
  if (!DAY.test(String(startsOn)) || !DAY.test(String(endsOn))) return [];
  const from = Date.parse(startsOn + "T00:00:00Z"), to = Date.parse(endsOn + "T00:00:00Z");
  if (!(to >= from)) return [];
  const byDay = {};
  for (const r of arr(moves)) if (real(r) && DAY.test(String(r.on))) (byDay[r.on] ||= []).push(r.move);
  const days = [];
  for (let t = from; t <= to; t += DAY_MS) {
    const on = new Date(t).toISOString().slice(0, 10);
    const made = byDay[on] || [];
    days.push({ on, made, didMake: made.length > 0 });
  }
  return days;
}

/* How steady a move is at a meeting (hj-steady-bands): 1 to 2 offered, 3 to 6 steady, 7 or more sure, never made "learn".
   A band draws an action; it never gates one (mechanical claim). */
export function steadiness(count) {
  const n = Math.floor(Number(count));
  if (!(n >= 1)) return "learn";
  return n >= 7 ? "sure" : n >= 3 ? "steady" : "offered";
}

/* The next place shows its light on three objects in the pack, or when the coach opens it for the session. Its light
   never waits on how an earlier meeting ended (hj-pack-calls). An object the player left on the road was never picked up. */
export function placeLit(pack, coachOpened) {
  if (coachOpened === true) return true;
  return arr(pack).filter((o) => o && OBJECT_STATES.includes(o.state) && o.state !== "left").length >= PACK_LIGHTS_PLACE;
}

/* A worked object leaves the shelf and becomes a furnishing chosen by its feeling (FR-006). */
const FURNISHING = { wood: "plant", fire: "lamp", earth: "plant", metal: "tool", water: "lamp" };
export function furnishingOf(feeling) { return FURNISHING[feeling] || null; }

/* Pages are readable only while the program stands: agreed to, not closed, not past its end date (FR-002, FR-011).
   `today` is "YYYY-MM-DD". */
export function pagesReadable(program, today) {
  if (!program || typeof program !== "object") return false;
  if (!program.agreedOn || program.closedAt) return false;
  if (DAY.test(String(program.endsOn)) && DAY.test(String(today)) && today > program.endsOn) return false;
  return true;
}

/* Close the program by the coach's hand (FR-011). Returns the document with its pages gone and the world kept
   (pack, moves, places, learned), and the removed pages so the route can offer the player their copy first. */
export function close(doc, at) {
  const src = doc && typeof doc === "object" ? doc : {};
  const pages = arr(src.pages);
  const stamp = typeof at === "string" ? at : new Date().toISOString();
  const program = { ...(src.program || {}), closedAt: (src.program && src.program.closedAt) || stamp };
  const world = { ...src, program, pages: [] };
  return { doc: world, pages };
}

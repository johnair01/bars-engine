/* The focus sit at the hearth (council pass integral-octalysis2, his yes on io-focus-sit-look-1, 2026-10-25).
   Sat by the fire, you lay one, two or three sticks on it: that is the length of the sit, and no timer shows; the stack is the
   clock. The hearth spirit tends the fire while you are away. Back early, the fire has banked to coals and the sit costs only
   itself; the ember you sat with goes back to the satchel as it was. A sit that runs its length raises that ember one state,
   dissatisfied to satisfied (io-focus-sit-is-care). The clock is the wall clock, so a phone put down still counts.
   Pure: no three.js, no DOM, so the rules read the same here and in the tests. */
import { careNow as spiritCareNow, feed as spiritFeed } from "../calrunia/spirit-care.js";
export const FOCUS_MINUTES = [10, 25, 45]; // one stick, two, three (a guess the pass names as unchecked)
export const FOCUS_SETTLE_MS = 7000;        // after the last stick or choice, the sit settles in
export const MINUTE_MS = 60000;

/* How long a sit of this many sticks runs, in minutes; nothing laid is no sit. */
export function focusMinutes(sticks) {
  const n = Math.max(0, Math.min(FOCUS_MINUTES.length, Math.floor(+sticks || 0)));
  return n ? FOCUS_MINUTES[n - 1] : 0;
}

/* A sit begun at t0 (ms) with this many sticks: how far it has come (0..1), whether it is done, and ms left. */
export function focusProgress(sit, nowMs, minuteMs = MINUTE_MS) {
  const dur = focusMinutes(sit && sit.sticks) * minuteMs;
  if (!sit || !dur || !Number.isFinite(sit.t0)) return { k: 0, done: false, left: 0, dur: 0 };
  const el = Math.max(0, nowMs - sit.t0);
  return { k: Math.min(1, el / dur), done: el >= dur, left: Math.max(0, dur - el), dur };
}

/* Coming back to the page or touching the room during a sit: a sit still running banks the fire and asks; one whose time
   has passed while you were away is simply done (the fire did the work). */
export function focusOnReturn(sit, nowMs, minuteMs = MINUTE_MS) {
  if (!sit || sit.step !== "sit") return sit ? sit.step : null;
  return focusProgress(sit, nowMs, minuteMs).done ? "done" : "banked";
}

/* The one ember on the hearth's lip warms from its dissatisfied tint toward its satisfied one as the sit runs. An ember that
   has risen before starts satisfied. Returns 0..1, the satisfied share of the tint. */
export function emberWarmth(sit, nowMs, minuteMs = MINUTE_MS, risen = false) {
  if (risen) return 1;
  const p = focusProgress(sit, nowMs, minuteMs);
  return p.done ? 1 : p.k * 0.85; // the last step of the warming is the rise itself, at the end
}

/* The hearth spirit's story (spec focus-sit-world-growth, FR-006 to FR-008): five fragments, one for each channel, told root to
   crown. A finished sit tells the fragment of the channel of the ember it sat with (no ember is earth) if that one is untold;
   otherwise it tells nothing new. Nothing else gates a fragment: no timer, day or count. */
export const FRAGMENT_ORDER = ["earth", "fire", "wood", "metal", "water"];
export function fragmentFor(emberFeel, told) {
  const c = FRAGMENT_ORDER.includes(emberFeel) ? emberFeel : "earth";
  return told && told[c] ? null : c;
}
/* What a finished sit adds to the homeroom doc's `hearth`: one more sit, its time, and the fragment it told (if any). */
export function hearthRecord(cur, channel, at) {
  const sits = Math.max(0, Math.floor(+(cur && cur.sits) || 0)) + 1;
  return channel ? { sits, at, told: { [channel]: at } } : { sits, at };
}

/* The first chapter (spec focus-sit-world-growth, FR-003, FR-016 to FR-020): the hearth comes alive over four cares, one a visit.
   What it draws is a pure function of `hearth.care`; the stage never falls, and a sit never moves it. */
export const CARES = ["sweep", "wood", "log", "turn"];   // the care each stage below 4 offers
export const HEARTH_K = [0, 0, 0.17, 0.5, 1];            // the fire's strength at each stage (round 3's cams.json)
export function stageOf(home) {                          // reads `stage`, then #606's `care`; a fire already lit reads as 4 (FR-020)
  const h = home && home.hearth, c = h && Number.isInteger(h.stage) ? h.stage : h && Number.isInteger(h.care) ? h.care : null;
  if (c != null) return Math.max(0, Math.min(4, c));
  return home && ((home.minute && home.minute.ember) || home.oriented) ? 4 : 0;
}
export function hearthStage(care) {
  const c = Math.max(0, Math.min(4, Math.floor(+care || 0)));
  return { care: c, stage: c, k: HEARTH_K[c], coal: c >= 1, woke: Math.min(c, 3), alive: c === 4, offer: c < 4 ? CARES[c] : null, sit: c >= 2 };
}
export function careOffered(care, caredThisVisit) { return care < 4 && !caredThisVisit ? CARES[care] : null; }

/* The hearth spirit (FR-024): fire's own element, fed through spirit-care.js. Its care lives in `hearth.spirit`; a hearth never fed
   keeps no record and does not dim. The word draws the glow and eyes only (FR-025), never a meter. */
export const SPIRIT_ELEMENT = "fire";
export const SPIRIT_GLOW = { thriving: 1, dimming: 0.6, unsettled: 0.35 };
export function spiritWord(home, nowMs) {
  const sp = home && home.hearth && home.hearth.spirit;
  return sp ? spiritCareNow(sp, nowMs).word : "thriving";
}
export function spiritGlow(home, nowMs) { return SPIRIT_GLOW[spiritWord(home, nowMs)]; }
/* The spirit's care after being fed an ember of this feel (fire feeds twice over); what to store as `hearth.spirit`. */
export function spiritFed(home, emberFeel, nowMs) {
  const sp = home && home.hearth && home.hearth.spirit;
  return spiritFeed(sp || null, emberFeel, SPIRIT_ELEMENT, nowMs);
}

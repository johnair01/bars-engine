/* The focus sit at the hearth (council pass integral-octalysis2, his yes on io-focus-sit-look-1, 2026-10-25).
   Sat by the fire, you lay one, two or three sticks on it: that is the length of the sit, and no timer shows; the stack is the
   clock. The hearth spirit tends the fire while you are away. Back early, the fire has banked to coals and the sit costs only
   itself; the ember you sat with goes back to the satchel as it was. A sit that runs its length raises that ember one state,
   dissatisfied to satisfied (io-focus-sit-is-care). The clock is the wall clock, so a phone put down still counts.
   Pure: no three.js, no DOM, so the rules read the same here and in the tests. */
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

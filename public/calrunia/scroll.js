/* The scroll (six-faces-council homeroom kit, Still B "the invitation", approved 2026-10-24 with no notes). An invitation is a
   paper scroll you seal: you take a blank one from your shelf (the first minute gives the first), choose when from a row of
   chips (tonight, tomorrow eve, this weekend, pick a day; a day is picked on a small calendar drawn on the paper), write one
   line in your hand and press the seal, your mark in your colour. It rolls up and leaves through the doorway on a gust of
   leaves, and lands on the other person's shelf sealed. Breaking the seal unrolls it; three ribbons answer it, and No asks
   no reason. Yes opens the doorway between your two rooms; the other two roll it back up and it stays on the shelf as a
   keepsake.

   No new table: a scroll is the room's existing sit invitation (rules.ts invitationsWrite, br-invite-two-kinds), kept in the
   shared room's garden/main as invitations[id] = { by, kind: "sit", when, note, at, answer, answeredAt }. The shelf reads the
   room summaries GET /api/between already sends (rules.ts roomSummary: `invitations` waiting, `keepsakes` answered).
   Plain module, no DOM: garden.js draws it; src/lib/between/__tests__/scroll.test.ts checks it. */

/** The When chips, in the still's order and words. */
export const WHEN_CHIPS = [
  ["tonight", "tonight"],
  ["tomorrow", "tomorrow eve"],
  ["weekend", "this weekend"],
  ["day", "pick a day"],
];
/** The hour each chip means, local time: an evening, or a weekend afternoon. */
export const EVENING = 19, TOMORROW_EVE = 18, WEEKEND = 15;

const at = (d, h) => { const x = new Date(d); x.setHours(h, 0, 0, 0); return x.getTime(); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/**
 * The time a chip stands for, as the invitation's `when` (ms). `day` is { y, m, d } (month from 0) for "pick a day".
 *   tonight   today at seven; past seven, within the next half hour
 *   tomorrow  tomorrow at six
 *   weekend   the coming Saturday at three; on Saturday after three, Sunday; on Sunday after three, the next Saturday
 *   day       that day at seven
 * @param {string} chip @param {number} [now] @param {{ y: number, m: number, d: number } | null} [day]
 * @returns {number | null}
 */
export function whenFor(chip, now = Date.now(), day = null) {
  const today = new Date(now);
  if (chip === "tonight") { const t = at(today, EVENING); return now < t ? t : Math.ceil((now + 1) / 18e5) * 18e5; }
  if (chip === "tomorrow") return at(addDays(today, 1), TOMORROW_EVE);
  if (chip === "weekend") {
    const dow = today.getDay(), three = at(today, WEEKEND);
    if (dow === 6) return now < three ? three : at(addDays(today, 1), WEEKEND);
    if (dow === 0 && now < three) return three;
    return at(addDays(today, (6 - dow + 7) % 7 || 7), WEEKEND);
  }
  if (chip === "day") {
    if (!day || ![day.y, day.m, day.d].every(Number.isInteger)) return null;
    const t = new Date(day.y, day.m, day.d, EVENING, 0, 0, 0).getTime();
    return t >= at(today, 0) ? t : null;
  }
  return null;
}

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * How the paper says when, in the reader's words: "tonight", "tomorrow evening", "this Saturday", "on Thursday the 30th",
 * "whenever you can" for none.
 * @param {number | null | undefined} when @param {number} [now]
 */
export function whenWords(when, now = Date.now()) {
  if (typeof when !== "number" || !Number.isFinite(when)) return "whenever you can";
  const w = new Date(when), n = new Date(now);
  if (sameDay(w, n)) return w.getHours() >= 17 ? "tonight" : "today";
  if (sameDay(w, addDays(n, 1))) return w.getHours() >= 17 ? "tomorrow evening" : "tomorrow";
  const days = Math.round((at(w, 12) - at(n, 12)) / 864e5);
  if (days > 1 && days < 7) return (w.getDay() === 6 || w.getDay() === 0 ? "this " : "on ") + DOW[w.getDay()];
  if (days < 0) return "on " + DOW[w.getDay()] + " " + MON[w.getMonth()] + " " + w.getDate();
  return "on " + DOW[w.getDay()] + " " + MON[w.getMonth()] + " " + w.getDate();
}

/**
 * The small calendar drawn on the paper: this month and the next, as weeks of days from Sunday. Each day is
 * { y, m, d, past, today } or null for a blank square. Days before today cannot be picked.
 * @param {number} [now] @param {number} [months]
 */
export function calendar(now = Date.now(), months = 2) {
  const n = new Date(now), out = [];
  for (let k = 0; k < months; k++) {
    const first = new Date(n.getFullYear(), n.getMonth() + k, 1), y = first.getFullYear(), m = first.getMonth();
    const len = new Date(y, m + 1, 0).getDate(), cells = Array(first.getDay()).fill(null);
    for (let d = 1; d <= len; d++) {
      const day = new Date(y, m, d);
      cells.push({ y, m, d, past: day.getTime() < at(n, 0), today: sameDay(day, n) });
    }
    while (cells.length % 7) cells.push(null);
    const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    out.push({ y, m, name: MON[m], weeks });
  }
  return out;
}

/** The one line in your hand: kept short, like the invitation's note (rules.ts NOTE_MAX is 280; a scroll's line is 120). */
export const LINE_MAX = 120;
export const cleanLine = s => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, LINE_MAX);

/**
 * The invitation a sealed scroll writes into the shared room (rules.ts invitationsWrite accepts exactly these keys).
 * @param {string} me @param {number | null} when @param {string} line @param {number} [t]
 */
export function sealedInvitation(me, when, line, t = Date.now()) {
  return { by: me, kind: "sit", when: typeof when === "number" && Number.isFinite(when) ? when : null, note: cleanLine(line), at: t };
}

/**
 * What answering a scroll does. Yes opens the doorway between the two rooms (the room's sit invitation, said yes to, as
 * today); Another time and No roll it back up, and it stays on the shelf as a keepsake. No asks no reason.
 * @param {"yes"|"later"|"no"} answer
 */
export function answerOutcome(answer) {
  if (answer === "yes") return { ok: true, write: "yes", doorway: true, keepsake: false, rollUp: false, line: "The doorway between your rooms opens." };
  if (answer === "later" || answer === "no") return { ok: true, write: answer, doorway: false, keepsake: true, rollUp: true, line: "It rolls back up and stays on your shelf." };
  return { ok: false };
}
/** The ribbons, in the still's order: the answer each writes, and its words. */
export const RIBBONS = [["yes", "Yes"], ["later", "Another time"], ["no", "No"]];

/**
 * What stands on your shelf, from GET /api/between's room summaries: scrolls that arrived sealed (waiting for your answer),
 * and keepsakes (ones you answered another time or no). The blank scroll is the first minute's (first-minute.js scrollGiven).
 * Newest first. A closed room's scrolls are gone with it.
 * @param {any[]} rooms
 */
export function shelfScrolls(rooms) {
  const sealed = [], keepsakes = [];
  for (const r of Array.isArray(rooms) ? rooms : []) {
    if (!r || r.phase === "closed") continue;
    const from = { room: r.id, name: r.personName || r.who || null, style: r.style || null, started: !!r.personStarted };
    for (const inv of r.invitations || []) sealed.push({ ...from, id: inv.id, when: inv.when ?? null, note: inv.note || "", at: inv.at ?? null });
    for (const k of r.keepsakes || []) keepsakes.push({ ...from, id: k.id, when: k.when ?? null, note: k.note || "", answer: k.answer, at: k.at ?? null });
  }
  const newest = (a, b) => (b.at || 0) - (a.at || 0);
  return { sealed: sealed.sort(newest), keepsakes: keepsakes.sort(newest) };
}

/** Who a blank scroll can go to: each open room with a second person in it. */
export function sendable(rooms) {
  return (Array.isArray(rooms) ? rooms : []).filter(r => r && r.phase !== "closed" && r.phase !== "spark" && r.person);
}

/** A seal's mark: the first letter of a name, or a small star for none. */
export const markOf = name => { const c = String(name || "").trim().charAt(0); return c ? c.toUpperCase() : "✶"; };

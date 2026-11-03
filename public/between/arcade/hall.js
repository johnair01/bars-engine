/* The Infinite Arcade hall's engine (council spec .specify/specs/infinite-arcade-hall/, FR-012, task T004).

   Pure functions over one plain object, the Hall: no drawing, no audio, no clock. Every function returns a new Hall and
   leaves the one it was given alone, so the page can keep the last good state. The drawing is ./arcade.js.

   What the Hall holds (FR-010): the purse's coins; what the player knows of each cabinet (unknown, glimpsed, known);
   the ticket waiting in each cabinet's tray; the line of kept tickets at the prize counter, each with its optional word;
   a count of tickets let go, which the play surface never shows; and which cabinet the player is inside, if any.
   Nothing here counts spend, streaks or time. `seated` is the bench's running seconds toward the next coin: it lives
   only while the page is open and save() leaves it out.

   The ask cabinet (FR-008): its round ends when the player says the ask is sent, and its ticket waits in the tray until
   the player comes back and says what came back. A yes, a no and silence pay the same ticket in the same colour
   (position ah-every-answer-pays). The ask's own words stay on this device, in this record, and nowhere else. */
import { CABINETS } from "./cabinets.js";

export const KEY = "oag.arcade.v1";
export const FULL = 3;               // three coins a visit
export const SIT_SECONDS = 20;       // one coin per 20 s on the bench (position ah-rest-pays)
export const ANSWERS = ["yes", "no", "silence"];
const KNOW = ["unknown", "glimpsed", "known"];

const cab = id => CABINETS.find(c => c.id === id) || null;
const clampCoins = n => Math.max(0, Math.min(FULL, Math.floor(Number(n) || 0)));
const word = w => String(w ?? "").trim().split(/\s+/)[0]?.slice(0, 24) || "";

/* A new visit: a full purse unless a saved record says otherwise. A saved record that will not parse is a new visit. */
export function newVisit(saved) {
  let s = null;
  if (typeof saved === "string" && saved) { try { s = JSON.parse(saved); } catch { s = null; } }
  else if (saved && typeof saved === "object") s = saved;
  /** @type {Record<string, string>} */
  const known = {};
  for (const c of CABINETS) { const k = s && s.known && s.known[c.id]; known[c.id] = KNOW.includes(k) ? k : "unknown"; }
  /** @type {Record<string, any>} */
  const tray = {};
  if (s && s.tray) for (const [id, t] of Object.entries(s.tray)) if (cab(id) && t && typeof t === "object") tray[id] = { ...t, cabinet: id };
  return {
    v: 1,
    coins: s ? clampCoins(s.coins) : FULL,
    known,
    tray,
    line: s && Array.isArray(s.line) ? s.line.filter(t => t && cab(t.cabinet)).map(t => ({ cabinet: t.cabinet, colour: cab(t.cabinet).colour, word: word(t.word) })) : [],
    letGo: s ? Math.max(0, Math.floor(Number(s.letGo) || 0)) : 0,
    inside: s && cab(s.inside) ? s.inside : null,
    seated: 0,
  };
}

/* The player has seen a cabinet's screen up close: unknown becomes glimpsed. */
export function glimpse(hall, id) {
  if (!cab(id) || hall.known[id] !== "unknown") return hall;
  return { ...hall, known: { ...hall.known, [id]: "glimpsed" } };
}

/* A coin can go in when the player holds the pass, has a coin, is not already inside a game, and the cabinet's game has
   a route (an unbuilt game takes no coin: position ah-no-stand-in). A ticket still in the cabinet's tray is taken first,
   kept or let go, and the ask's waiting ticket holds that cabinet until the player says what came back. */
export function canDrop(hall, id, pass = true) {
  const c = cab(id);
  return !!(pass && c && c.route && hall.coins > 0 && !hall.inside && !hall.tray[id]);
}

/* The drop: one coin out of the purse, the cabinet known, the player inside it. */
export function drop(hall, id, pass = true) {
  if (!canDrop(hall, id, pass)) return hall;
  return { ...hall, coins: hall.coins - 1, known: { ...hall.known, [id]: "known" }, inside: id };
}

/* Back out of the screen. A round always pays a ticket, a round left early too (FR-006). The ask's ticket, when the
   player says the ask is sent, waits in the tray for what comes back; an ask left before it was sent pays at once.
   Coming back from a cabinet the player was not inside pays nothing. */
/** @param {any} hall @param {string} id @param {{ early?: boolean, ask?: { to?: string, what?: string } | null }} [opts] */
export function returnFrom(hall, id, { early = false, ask = null } = {}) {
  if (!cab(id) || hall.inside !== id) return hall;
  const t = id === "ask" && !early
    ? { cabinet: id, waiting: true, ...(ask ? { ask: { to: String(ask.to || "").slice(0, 80), what: String(ask.what || "").slice(0, 280) } } : {}) }
    : { cabinet: id };
  return { ...hall, inside: null, tray: { ...hall.tray, [id]: t } };
}

/* What came back from the ask: any answer turns the waiting ticket into a ticket like any other, the same colour. */
export function answer(hall, a) {
  const t = hall.tray.ask;
  if (!t || !t.waiting || !ANSWERS.includes(a)) return hall;
  const { waiting, ask, ...rest } = t;
  return { ...hall, tray: { ...hall.tray, ask: { ...rest, answer: a } } };
}

/* A ticket in the tray that can be taken now (a waiting ask cannot). */
export function ticketAt(hall, id) {
  const t = hall.tray[id];
  return t && !t.waiting ? t : null;
}

/* Keep it: the ticket hangs on the prize counter's line in its cabinet's colour, with one optional word. */
export function keep(hall, id, w) {
  const t = ticketAt(hall, id);
  if (!t) return hall;
  const tray = { ...hall.tray }; delete tray[id];
  return { ...hall, tray, line: [...hall.line, { cabinet: id, colour: cab(id).colour, word: word(w) }] };
}

/* Let it go: the ticket drops into the change machine's hopper. Only a count stays. */
export function letGo(hall, id) {
  if (!ticketAt(hall, id)) return hall;
  const tray = { ...hall.tray }; delete tray[id];
  return { ...hall, tray, letGo: hall.letGo + 1 };
}

/* The bench: seconds seated add up, and each 20 pays a coin, up to a full purse. */
export function sit(hall, seconds) {
  if (hall.coins >= FULL) return { ...hall, seated: 0 };
  let seated = hall.seated + Math.max(0, Number(seconds) || 0), coins = hall.coins;
  while (seated >= SIT_SECONDS && coins < FULL) { seated -= SIT_SECONDS; coins += 1; }
  return { ...hall, coins, seated: coins >= FULL ? 0 : seated };
}

/* Back from melting a block in the change machine: the purse is full, as sitting fills it (ah-rest-pays). */
export function melted(hall) { return { ...hall, coins: FULL, seated: 0 }; }

/* The purse's hang at the hip, 0 (empty, flat) to 1 (full, low and round). The page draws this; it never prints it. */
export function weight(hall) { return clampCoins(hall.coins) / FULL; }

/* The record for localStorage oag.arcade.v1. The bench's running seconds are left out. */
export function save(hall) {
  const { seated, ...rest } = hall;
  return JSON.stringify(rest);
}

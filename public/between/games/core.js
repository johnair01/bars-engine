/* The hollow's games, the pure part (Six-faces-council .specify/specs/friendship-between-growth, "The hollow's games",
   FR-016 to FR-022; his A on bsp-games-look-1). No three.js and no DOM, so rules.ts and the tests read it as well as the page.

   Three games, one per door, each unlocked at stage 1 and never replacing another:
     found-lights  (Friendcraft)  apart, across days     a jar on the shelf          canon/mechanics/found-lights.yaml
     firefly-lead  (Flirtcraft)   together, live         nothing, unless both kept   canon/mechanics/firefly-lead.yaml
     lantern-out   (Allyship)     together, one sitting  a lit place in the valley   canon/mechanics/lantern-out.yaml
   Nothing here counts, scores or names who did more (FR-021). */

export const DAY_MS = 864e5;

/** The Between's own day (FR-006): whole days since the Between began, which is the 24 hours from `betweenSince`. */
export function betweenDay(garden, now) {
  const since = garden && typeof garden.betweenSince === "number" ? garden.betweenSince : garden && typeof garden.startedAt === "number" ? garden.startedAt : now;
  return Math.max(0, Math.floor((now - since) / DAY_MS));
}

/* ---------- the door (FR-016) ---------- */
export const DOORS = ["friendcraft", "flirtcraft", "allyship"];
/** The door a relationship kind came through; the spark's form offers these kinds (garden.js REL_KINDS). Anything else has none. */
export function doorOfKind(kind) {
  return kind === "Friendship" ? "friendcraft" : kind === "Romance or flirting" ? "flirtcraft" : kind === "Allyship" ? "allyship" : null;
}
export const GAME_OF_DOOR = { friendcraft: "found-lights", flirtcraft: "firefly-lead", allyship: "lantern-out" };
export const GAMES = ["found-lights", "firefly-lead", "lantern-out"];
/** Which game is set out on the table the first time, and which wait at their places (FR-017). A Between with no door sets none out. */
export function tableGame(garden) {
  const d = garden && garden.door;
  return d && GAME_OF_DOOR[d] ? GAME_OF_DOOR[d] : null;
}

/* ---------- small seeded random ---------- */
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- Found lights (FR-018) ---------- */
export const JAR_KINDS = ["sound", "colour", "photo", "line"];
export const JAR_OFFERED = ["line", "colour"]; // what the leave sheet offers today; sound and photo wait on a place to keep them
export const JAR_SIDE_MAX = 3;                 // three a side, six at once
export const LINE_MAX = 140;
const HEX = /^#[0-9a-f]{6}$/i;
export const validColour = c => typeof c === "string" && HEX.test(c);

/* ---------- Lantern out (FR-020) ---------- */
/** The valley's twelve fixed places: four houses, four bridges, four boats, in metres from the hollow's middle (the mouth is toward -z). */
export const KINDS = ["house", "bridge", "boat"];
export const CALL_WORDS = { house: "A house with its lamp out", bridge: "Someone alone on the bridge", boat: "A boat with no light" };
export const PLACES = [
  { kind: "house", x: -26, z: -34 }, { kind: "house", x: -9, z: -46 }, { kind: "house", x: 12, z: -40 }, { kind: "house", x: 28, z: -52 },
  { kind: "bridge", x: -17, z: -52 }, { kind: "bridge", x: -2, z: -33 }, { kind: "bridge", x: 21, z: -31 }, { kind: "bridge", x: 6, z: -58 },
  { kind: "boat", x: -31, z: -48 }, { kind: "boat", x: -13, z: -60 }, { kind: "boat", x: 3, z: -48 }, { kind: "boat", x: 33, z: -42 },
];
export const KEPT_PLACES = 12;
/** A night's three calls: one place of each kind, seeded by the Between's id and its day, so both friends see the same three (FR-020). */
export function callsFor(gardenId, day) {
  const r = rng(hash(`${gardenId}|calls|${day}`));
  return KINDS.map(kind => { const idx = PLACES.map((p, i) => (p.kind === kind ? i : -1)).filter(i => i >= 0); return idx[Math.floor(r() * idx.length)]; });
}
/** Which places are lit and which have dimmed to a small warm window, from the call items (newest KEPT_PLACES stay lit). */
export function litPlaces(items) {
  const calls = items.filter(i => i && i.kind === "call" && Number.isInteger(i.place)).sort((a, b) => (b.at || 0) - (a.at || 0));
  const lit = new Set(), window = new Set();
  calls.forEach((c, i) => { if (i < KEPT_PLACES) lit.add(c.place); });
  for (const c of calls) if (!lit.has(c.place)) window.add(c.place);
  return { lit: [...lit], window: [...window] };
}

/* ---------- Firefly lead (FR-019) ---------- */
export const DANCE_MIN_MS = 30000;   // a dance both held for 30 s writes the item
export const DANCE_MAX_MS = 180000;  // a dance ends itself after three minutes
export const POLL_LIVE_MS = 250;     // both hands up
export const POLL_REST_MS = 2500;
export const TRAIL_S = 1.2, CROSS_M = 0.25, DELAY_MS = 300, FLIES = 120;
export const MAX_PATH_POINTS = 24;   // a stream's points in one poll
/** The finger's path as the server keeps it: at most MAX_PATH_POINTS of [x, y, z, t], clamped to the room, numbers only. */
export function cleanPath(p) {
  if (!Array.isArray(p)) return [];
  const n = v => (typeof v === "number" && Number.isFinite(v) ? v : null), out = [];
  for (const q of p.slice(-MAX_PATH_POINTS)) {
    if (!Array.isArray(q) || q.length < 4) continue;
    const x = n(q[0]), y = n(q[1]), z = n(q[2]), t = n(q[3]);
    if (x === null || y === null || z === null || t === null) continue;
    out.push([Math.round(Math.max(-8, Math.min(8, x)) * 100) / 100, Math.round(Math.max(0, Math.min(4, y)) * 100) / 100, Math.round(Math.max(-8, Math.min(8, z)) * 100) / 100, Math.round(t)]);
  }
  return out;
}

/** The one list a feed is read from for the games (FR-018 to FR-020; growth.js `isFeed` calls this once it lands). */
export function gameFeed(item) {
  if (!item || typeof item !== "object") return null;
  if (item.kind === "jar" && item.status === "opened") return { kind: "jar", by: [item.by, item.openedBy].filter(Boolean), at: item.openedAt || item.at };
  if (item.kind === "dance" && Array.isArray(item.pair)) return { kind: "dance", by: item.pair, at: item.at };
  if (item.kind === "call" && Array.isArray(item.pair)) return { kind: "call", by: item.pair, at: item.at };
  return null;
}

/* ---------- the words (all of it shown to a player; voice_lint clean; FR-021: no digit) ---------- */
export const COPY = {
  leave: "Leave a jar", leaveHead: "What caught your eye today?", open: "Open it", raise: "Raise a hand", lower: "Lower your hand to rest",
  which: "Which one tonight?", carry: "Carry it together", walkOn: "Walk on",
  jarFor: name => `${name} left you a jar.`,
};

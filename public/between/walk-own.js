/* The newcomer's own walk (Six-faces-council hdw-oix-4, his A "Claude takes it", 2026-11-16).
   Early in the walk the newcomer leaves one true thing they want, in their own words, and taps the one wall in the way.
   Mara's card in the Hollow answers that wall. The walls are the episode sheet's obstacle table, so the map and the card
   speak the same terrain. The two answers live in this tab's sessionStorage ("walk-own") and nowhere else. */
import { OBSTACLE } from "../calrunia/episode-sheet.js";

export const KEY = "walk-own";
export const MAX_WANT = 140;

/** Mara's light card and her line back, one pair per wall. One short line each, no digit. */
const CARDS = {
  time: { words: "Tell me which hour is yours, and I will keep it free.", back: "A river does not have to be crossed in one go. I will wait on this bank with you." },
  money: { words: "Sit with me and say what the wall is made of, then we count only what is true.", back: "Walls look taller from alone. I will stand at the foot of it with you." },
  "a person": { words: "Say who is behind the door, and what you would knock to say.", back: "A closed house is still a house. I will walk up the path with you." },
  health: { words: "Tell me what the climb asks of your body, and where we can rest.", back: "We take the steep part slowly. I will carry the lantern while you breathe." },
  "a place": { words: "Name the border, and what waits on the far side of it.", back: "Borders have gates. I will help you look for the one that opens." },
  "a skill": { words: "Show me the gap in the bridge, and I will hold one end while you test it.", back: "Nobody built a bridge in one try. I will hand you the next plank." },
  "a duty": { words: "Say what the toll is, and who collects it.", back: "A toll road is still a road. I will pay half the first one with you." },
};
export const WALLS = Object.keys(OBSTACLE).map(k => ({ key: k, terrain: OBSTACLE[k] }));
export const PROMPT = "Leave one true thing of yours first.";

const clean = s => String(s || "").replace(/\s+/g, " ").trim().slice(0, MAX_WANT);

/** The saved own want and wall, or null when the newcomer walked in some other way. */
export function own() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return v && v.want && OBSTACLE[v.wall] ? { want: clean(v.want), wall: v.wall } : null;
  } catch (e) { return null; }
}
export function keep(want, wall) {
  const w = clean(want);
  if (!w || !OBSTACLE[wall]) return null;
  try { sessionStorage.setItem(KEY, JSON.stringify({ want: w, wall })); } catch (e) { /* the walk goes on with today's card */ }
  return { want: w, wall };
}

/** Mara's card for this wall, with the newcomer's want as its ribbon. A missing or unknown wall gives null (today's card). */
export function cardFor(wall, want) {
  const c = CARDS[wall];
  return c ? { words: c.words, back: c.back, goalText: clean(want) } : null;
}
export const cap = t => t ? t[0].toUpperCase() + t.slice(1) : "";

/* The Infinite Arcade hall's cabinets, as data (spec .specify/specs/infinite-arcade-hall/, FR-002, T001; position
   ah-cabinets-from-types). A port of the TYPES table in bars-engine tools/blender-cloud/content/arcade/arrival.py
   (branch of bars-engine #420, round 3 of the arcade arrival), which builds the cabinets in Blender at render time and
   has no glTF export. The numbers are copied unchanged, in metres and degrees:

     w, d       width along the corridor, depth          base, top   the lower body's top (hand height), the upper body's top
     scr        screen width, height, centre height, tilt back from vertical in degrees (90: face up)
     marq       marquee height (0: none)                 players, buttons   per cabinet, per player

   Task T005 of the spec (council .specify/specs/infinite-arcade-hall/), carried over from the stills round
   council/callsheets/stills/2026-11-03-arcade-hall-3/make/cabinets.js unchanged but for the routes and today's pick. */

export const TYPES = {
  cocktail: { w: 0.62, d: 0.80, base: 0.76, top: 0.76, scr: [0.46, 0.345, 0.0, 90], marq: 0, players: 2, buttons: 2 },
  cabaret: { w: 0.58, d: 0.66, base: 0.92, top: 1.58, scr: [0.36, 0.27, 1.27, 12], marq: 0.14, players: 1, buttons: 3 },
  candy: { w: 0.86, d: 0.88, base: 0.74, top: 1.56, scr: [0.62, 0.465, 1.13, 24], marq: 0.0, players: 2, buttons: 6 },
  upright: { w: 0.80, d: 0.84, base: 1.0, top: 1.95, scr: [0.56, 0.42, 1.40, 12], marq: 0.24, players: 2, buttons: 3 },
  vertical: { w: 0.70, d: 0.82, base: 1.0, top: 2.06, scr: [0.42, 0.56, 1.47, 12], marq: 0.22, players: 1, buttons: 2 },
  deluxe: { w: 1.04, d: 0.88, base: 1.0, top: 2.30, scr: [0.88, 0.495, 1.64, 6], marq: 0.30, players: 2, buttons: 4 },
};
// arrival.py's CH1_TYPE: round 1's upright, screen square-on (SCR_W, SCR_H, SCR_Z = 0.62, 0.465, 1.36)
export const CH1_TYPE = { w: 0.86, d: 0.75, base: 1.0, top: 1.95, scr: [0.62, 0.465, 1.36, 0], marq: 0.24, players: 2, buttons: 3 };

// arrival.py's layout: cabinet fronts at x = +-AISLE, one every PITCH (a 0.86 m cabinet and a gap of about 0.45 m)
export const AISLE = 1.5, PITCH = 1.3, BACK_WALL = AISLE + 0.95;
export const SCREEN_HUES = ["#3fd6c4", "#e0569a", "#f0a640", "#7a8cff", "#59d873", "#c86bff"];
export const BODY = ["#3a2e52", "#2e3350", "#4a2f48", "#33284a"];

/* Slice 1's lit cabinets (FR-002) and the Chapter 1 cabinet. `slot` counts cabinets down the corridor from the alcove
   (0 is the first pair), `side` -1 is left looking down the corridor. The lantern table is the one type the TYPES table
   does not hold as written: the spec asks for "a sit-down cabinet, round screen set flat", so it takes the candy
   cabinet's body and stool and lays a round screen back at 58 degrees (`round: true`, `tilt`), drawn as a table seen
   from the stool. Colours are the cabinet's ticket colour on the prize counter's line (FR-007). */
export const CABINETS = [
  { id: "ask", type: "vertical", gameType: "chance", name: "The Ask", route: "/between/land.html?place=ask-desk", colour: "#e0569a", side: -1, slot: 1 },
  { id: "lantern", type: "candy", gameType: "skill", name: "Lantern Table", route: null, colour: "#f0a640", side: 1, slot: 2, round: true, tilt: 58 },
  { id: "between", type: "cocktail", gameType: "passion", name: "The Between", route: "/ontology-game/between", colour: "#3fd6c4", side: -1, slot: 3 },
  { id: "chapter-1", type: "ch1", gameType: "mix", name: "Chapter 1", route: null, colour: "#f2c55c", side: -1, slot: 22 },
];

// today's game: the one marquee the hall points at, by light (FR-003). Chosen by the date, cycling the cabinets that
// take a coin today, so the lamp never hangs over a cabinet that reads "Lit soon".
export const byId = id => CABINETS.find(c => c.id === id) || null;
export function todaysCabinet(date = new Date(), list = CABINETS.filter(c => c.gameType !== "mix" && c.route)) {
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 864e5);
  return list[((day % list.length) + list.length) % list.length];
}

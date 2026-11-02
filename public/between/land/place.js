/* The place generator's first walkable build (Six-faces-council charge-to-world, build 3).

   A fantastic location from the episode sheet (../../calrunia/episode-sheet.js `locations()`, the port of
   council/tools/episode_sheet.py) is an asset brief: a land from its element, three aspects, a seed. plan() reads that
   brief into what the land page builds: the land's environment, the weather over it, and one piece per aspect. An aspect
   no piece builds yet is listed in `unbuilt`, never drawn by a stand-in, so the page can say what is still a brief.

   Pure data in, data out: the test (src/lib/between/__tests__/land-place.test.ts) runs it on the sample player's
   Unfinished Clearing. The drawing is ./land.js. */

/* Each land's environment, from its element (world grammar: forest for Wood, mountain for Fire, plains for Earth, cave
   for Metal, sea for Water). Only the forest is built so far. */
export const LANDS = { wood: "forest" };   // the Scale-House stands on the forest's edge, so it is a Wood land too

/* Pieces the land page can build, and the words in an aspect that ask for each. First match wins. */
export const PIECES = [
  { id: "instrument-ring", match: /instrument/i, what: "nine trees in a ring, an instrument grown into each" },
  { id: "music-bar", match: /bar of music|music that loops|loops and stops/i, what: "a staff hung in the air, looping round the clearing and stopping mid-phrase" },
  { id: "sounding-stump", match: /stump/i, what: "the wide stump at the middle, which answers a note" },
  // the Scale-House (build 4, ./scale-house.js)
  { id: "weight-hut", match: /stacked brass weights|weights beside a broken/i, what: "a round hut of stacked brass weights, and the footbridge beside it missing its middle planks" },
  { id: "amber-air", match: /amber|smelling of oil/i, what: "the forest's dusk gone thick and gold, lamps of oil at the door" },
  { id: "toolbag-balance", match: /balance/i, what: "a brass balance in the doorway, its pans free to take what you set in them" },
];

const WEATHER = [[/rain|storm/i, "rain"], [/fog|mist|haze/i, "mist"], [/snow/i, "snow"]];

export function slug(name) { return String(name || "").toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

/* loc: one entry of locations(charge, g); weather: g.weather (the week's, over the near land). */
export function plan(loc, weather = "") {
  const pieces = [], unbuilt = [];
  for (const a of loc.aspects || []) {
    const p = PIECES.find(p => p.match.test(a));
    if (p && !pieces.some(q => q.id === p.id)) pieces.push({ id: p.id, aspect: a, what: p.what });
    else unbuilt.push(a);
  }
  const w = WEATHER.find(([re]) => re.test(weather));
  return {
    id: slug(loc.location),
    name: loc.location,
    land: LANDS[loc.element] || null,
    element: loc.element,
    line: loc.line,
    seed: (loc.state && loc.state.seed) || "0",
    weather: w ? w[1] : "clear",
    pieces, unbuilt,
  };
}

/* The sheet's strong start (step 2), as plain sentences: what the page says as you step through. */
export function strongStart(sheetMd) {
  const m = String(sheetMd).match(/## 2\. Strong start[^\n]*\n([\s\S]*?)(\n## |$)/);
  if (!m) return [];
  return m[1].split("\n").map(s => toYou(s.replace(/\*\(drafted\)\*/g, "").replace(/\*/g, "").trim())).filter(Boolean);
}

/* The sheet is the game master's, about "the player"; the land says it to you. */
export function toYou(s) {
  return String(s)
    .replace(/\b([Tt])he player's\b/g, (_, t) => t === "T" ? "Your" : "your")
    .replace(/\b([Tt])he player (\w+?)(?:(?<=sh|ch|x|ss)es|s)\b/g, (_, t, v) => (t === "T" ? "You " : "you ") + v)
    .replace(/\b([Tt])he player\b/g, (_, t) => t === "T" ? "You" : "you")
    .replace(/\btheir\b/g, "your").replace(/\bTheir\b/g, "Your");
}

/* The secrets the sheet ties to this place's pieces (step 4 is tied to no place; a secret naming a piece's thing is
   the one this place can reveal). */
export function secretsHere(sheetMd, p) {
  const m = String(sheetMd).match(/## 4\. Secrets[^\n]*\n([\s\S]*?)(\n## |$)/);
  if (!m) return [];
  const words = { "instrument-ring": /instrument|song/i, "music-bar": /hum|mid-bar|played to its end/i, "sounding-stump": /stump/i,
    "weight-hut": /Scale-House|bridge/i, "toolbag-balance": /scale reads|toolbag|carries the bag/i };
  const ids = p.pieces.map(x => x.id);
  return m[1].split("\n").filter(l => l.startsWith("- ")).map(l => toYou(l.slice(2).replace(/\*\(drafted\)\*/g, "").trim()))
    .filter(s => ids.some(id => words[id] && words[id].test(s)));
}

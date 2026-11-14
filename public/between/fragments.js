/* The hearth spirit's five fragments (spec focus-sit-world-growth, T006). His words: the five lines are the ones he said yes
   to on io-fragments-look-2 (2026-11-04 23:32 UTC); change them only by his look. Each line is one sentence or two short ones,
   under 90 characters, no digit. A picture is drawn in the fire from points (pure here, so the tests can read them); garden.js
   gathers the fire's own sparks into the points, so no image file loads. `subject` is the picture's brief, kept for the next
   person who redraws it. Pure: no three.js, no DOM. */
export const FRAGMENT_SECONDS = 6;   // the flames gather, hold, and fade back to fire

export const FRAGMENTS = {
  earth: { line: "Before this hearth, it was one coal, carried a long way in two cupped hands.",
    subject: "Two cupped hands drawn in low flame hold the spirit's glow as the coal. The sparks stay still." },
  fire: { line: "The night it came, the wind tried to take it. It held on until the wood caught.",
    subject: "The flames bend hard to one side, as if by wind. The glow stays low at their root while sparks stream off downwind." },
  wood: { line: "Its first keeper sang to it each evening. It still answers a song with a crackle.",
    subject: "One flame rises tall, branching like a young tree. Sparks lift off its tips in a slow beat, like a tune." },
  metal: { line: "It learned to tell a cold coat from a heavy pack.",
    subject: "The flames part into an open eye with the spirit's glow as its pupil. One spark drifts in from the edge." },
  water: { line: "It kept this fire for every keeper before you. Tonight, you are the keeper.",
    subject: "A line of small fires goes away into the dark like far hearths, each dimmer than the last. This fire is nearest. Their sparks rise to meet above it." },
};

const arc = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * (i / (n - 1)); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const line = (x0, y0, x1, y1, n) => Array.from({ length: n }, (_, i) => [x0 + (x1 - x0) * (i / (n - 1)), y0 + (y1 - y0) * (i / (n - 1))]);

/* The points of a picture, in a box from -1 to 1 on both sides, y up. Each is [x, y, glow]: glow 1 is the spirit's own light,
   0 is flame or spark. */
export function pictureDots(name) {
  const d = (pts, g = 0) => pts.map(([x, y]) => [x, y, g]);
  switch (name) {
    case "earth": return [
      ...d(arc(-0.1, 0.05, 0.55, 0.5, Math.PI * 1.02, Math.PI * 1.98, 26)), ...d(arc(0.1, 0.05, 0.55, 0.5, Math.PI * 1.02, Math.PI * 1.98, 26)),
      ...d(line(-0.66, 0.0, -0.58, 0.28, 5)), ...d(line(0.66, 0.0, 0.58, 0.28, 5)),
      ...d(arc(0, 0.05, 0.14, 0.14, 0, Math.PI * 2, 12), 1), [0, 0.05, 1]];
    case "fire": {
      const out = [];
      for (const [bx, h] of [[-0.35, 0.8], [0, 1.1], [0.32, 0.7]]) for (let i = 0; i < 18; i++) { const t = i / 17; out.push([bx + 0.75 * t * t * h, -0.6 + 1.3 * h * t, 0]); }
      for (let i = 0; i < 14; i++) out.push([0.45 + i * 0.045, 0.5 - i * 0.03 + ((i * 7) % 5) * 0.03, 0]);
      return [...out, ...d(arc(0, -0.55, 0.16, 0.1, 0, Math.PI * 2, 10), 1)];
    }
    case "wood": return [
      ...d(line(0, -0.7, 0, 0.1, 14)), ...d(line(0, 0.0, -0.4, 0.55, 8)), ...d(line(0, 0.0, 0.4, 0.55, 8)),
      ...d(line(0, 0.1, -0.12, 0.8, 8)), ...d(line(0, 0.1, 0.14, 0.78, 8)), ...d(line(0, -0.25, -0.34, 0.15, 6)), ...d(line(0, -0.25, 0.34, 0.15, 6)),
      [-0.4, 0.62, 0], [0.4, 0.62, 0], [-0.14, 0.9, 0], [0.16, 0.88, 0], ...d(arc(0, -0.62, 0.14, 0.09, 0, Math.PI * 2, 8), 1)];
    case "metal": return [
      ...d(Array.from({ length: 24 }, (_, i) => { const u = i / 23; return [-0.8 + 1.6 * u, 0.34 * Math.sin(Math.PI * u)]; })),
      ...d(Array.from({ length: 24 }, (_, i) => { const u = i / 23; return [-0.8 + 1.6 * u, -0.34 * Math.sin(Math.PI * u)]; })),
      ...d(arc(0, 0, 0.13, 0.13, 0, Math.PI * 2, 14), 1), [0, 0, 1], [0.95, 0.38, 0]];
    case "water": {
      const out = [];
      for (let k = 0; k < 5; k++) {
        const x = 0.62 - k * 0.3, y = -0.35 + k * 0.1, s = 0.2 - k * 0.025;
        out.push(...d(arc(x, y, s, s * 1.4, 0, Math.PI * 2, 8), k === 0 ? 1 : 0));
      }
      for (let i = 0; i < 12; i++) out.push([0.62 - i * 0.11, 0.35 + 0.2 * Math.sin(i), 0]);
      return out;
    }
    default: return [];
  }
}

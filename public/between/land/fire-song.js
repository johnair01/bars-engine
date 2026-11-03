/* The Friends' Fire song as pure functions: no drawing, no audio, no network (spec ctw-friends-fire FR-002 to FR-005,
   FR-008). Ported from the council's reel round 2 engine (six-faces-council
   council/callsheets/stills/2026-11-03-ctw-friends-fire-reel-2/make/engine.js), which Wendell answered "It lands, build
   from it" on ctw-fire-reel-look-2. Degrees 0..4 are the stump's five seals (a major pentatonic); 0 is home. Times are
   seconds. A refused move returns the song unchanged with `refused` set to the reason. */

export const FEEL = {
  sealResponse: 0.15,   // s from press to sound
  entryBeats: 1,        // Oriel starts this many beats after the hand-over
  silence: 1.5,         // s of quiet between Oriel's last note and any laugh
  bpmMin: 60, bpmMax: 110, bpmDefault: 84,
  holdBeats: 2,         // the home note is held this long
  keep: 5,              // Oriel carries at most the last five notes you played
};
export const BAR = [0, 1, 2, 1, 3, 2, 4, 3];   // the old bar: it stops on 3, unresolved
export const HOME = 0;
// His m09 stone on reel round 1: before the move goes into Oriel's hand you tag the energy that would block you. Each
// channel's lead state. The tag changes no note and no time.
export const BLOCKS = { fire: "Frustration", wood: "Craving", water: "Despair", metal: "Anxiety", earth: "Apathy" };

export const newSong = (o = {}) => ({ block: null, bar: (o.bar || BAR).slice(), stump: (o.stump || []).slice(), played: [], handedOver: false, handedAt: null, passed: false, refused: null });
const refuse = (song, why) => Object.assign({}, song, { refused: why });
const ok = song => Object.assign({}, song, { refused: null });

export function play(song, degree, t) {
  if (song.handedOver) return refuse(song, "the song is already in Oriel's hands");
  if (song.passed) return refuse(song, "you chose to listen tonight");
  if (!Number.isInteger(degree) || degree < 0 || degree > 4) return refuse(song, "there are five seals, 0 to 4");
  return Object.assign(ok(song), { played: song.played.concat([{ degree, t }]) });
}
export function tagBlock(song, channel) {
  if (song.handedOver) return refuse(song, "Oriel already has it");
  if (song.passed) return refuse(song, "you chose to listen tonight");
  if (!BLOCKS[channel]) return refuse(song, "the five energies are fire, wood, water, metal and earth");
  return Object.assign(ok(song), { block: channel });
}
export function handOver(song, t = 0) {
  if (song.passed) return refuse(song, "you chose to listen tonight");
  if (song.handedOver) return refuse(song, "Oriel already has it");
  if (!song.block) return refuse(song, "name the energy that would block you first");
  return Object.assign(ok(song), { handedOver: true, handedAt: t });
}
export function pass(song, t = 0) {
  if (song.handedOver) return refuse(song, "Oriel already has it");
  if (song.passed) return refuse(song, "already listening");
  return Object.assign(ok(song), { passed: true, handedAt: t });
}
export const move = (song, m) => m.move === "play" ? play(song, m.degree, m.t) : m.move === "tag" ? tagBlock(song, m.channel)
  : m.move === "handOver" ? handOver(song, m.t) : m.move === "pass" ? pass(song, m.t) : refuse(song, "no such move");

/* beats per minute: the median gap between your notes, held to 60..110; 84 for one note or none */
export function tempo(song) {
  const ts = song.played.map(p => p.t);
  if (ts.length < 2) return FEEL.bpmDefault;
  const gaps = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
  const m = gaps.length % 2 ? gaps[(gaps.length - 1) / 2] : (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2;
  return Math.min(FEEL.bpmMax, Math.max(FEEL.bpmMin, 60 / Math.max(m, 1e-6)));
}
/* Oriel's ending. After a pass it is the bar's own cadence. Otherwise Oriel starts on the last note you played (else the
   last stump note, else the bar's last note), plays your notes back from there, most recent first, and settles home. */
export function ending(song) {
  if (song.passed) return [song.bar[song.bar.length - 1], 2, 1, HOME];
  const src = song.played.length ? song.played.map(p => p.degree) : song.stump.length ? song.stump.slice() : [song.bar[song.bar.length - 1]];
  const out = src.slice(-FEEL.keep).reverse();
  while (out.length < 3) { const c = out[out.length - 1]; out.push(c > 0 ? c - 1 : 1); }
  out.push(HOME);
  return out;
}
/* which of Oriel's notes are yours coming back, which are passing tones, and which is home */
export function kinds(song) {
  if (song.passed) return ["bar", "bar", "bar", "home"];
  const n = song.played.length ? Math.min(song.played.length, FEEL.keep) : 1, e = ending(song);
  return e.map((d, i) => i < n ? "yours" : i === e.length - 1 ? "home" : "passing");
}
/* the scene's clock from the hand-over (or pass) on; null until one of them has happened */
export function timeline(song) {
  if (!song.handedOver && !song.passed) return null;
  const bpm = song.passed ? FEEL.bpmDefault : tempo(song), beat = 60 / bpm;
  const notes = []; let t = song.handedAt + FEEL.entryBeats * beat;
  if (song.passed) { for (const d of song.bar.slice(0, -1)) { notes.push({ degree: d, t, who: "oriel", part: "bar", kind: "bar" }); t += beat; } }
  const e = ending(song), ks = kinds(song);
  e.forEach((d, i) => { notes.push({ degree: d, t, who: "oriel", part: "ending", kind: ks[i] }); t += (i === e.length - 1 ? FEEL.holdBeats : 1) * beat; });
  return { bpm, beat, notes, end: t, laughAt: t + FEEL.silence };
}
/* what the fire is doing at time t; never a grade */
export function phaseAt(song, t) {
  const tl = timeline(song);
  if (!tl) return { phase: song.played.length ? "playing" : "ready" };
  const first = tl.notes[0].t;
  if (t < first) return { phase: "handed", wait: first - t };
  if (t < tl.end) { let i = 0; tl.notes.forEach((n, k) => { if (n.t <= t) i = k; }); return { phase: "oriel", index: i, note: tl.notes[i] }; }
  if (t < tl.laughAt) return { phase: "silence", left: tl.laughAt - t };
  return { phase: "laugh" };
}
/* the stump's notes from sessionStorage "ctw-song" (or a ?song=1,3,0,4 preview seed), as seals 0..4 */
export function stumpNotes(raw) {
  let v = raw;
  if (typeof v === "string") { try { v = v.includes("[") ? JSON.parse(v) : v.split(","); } catch { v = []; } }
  return Array.isArray(v) ? v.map(n => Math.round(+n)).filter(n => Number.isInteger(n) && n >= 0 && n <= 4).slice(0, 6) : [];
}

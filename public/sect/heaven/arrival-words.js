// The founder's two-line arrival card and the sheet's later lines (Wendell's B on bhq-arrival-1, 2026-11-21: "Home face and
// quest now, the rest later"). No imports, so a test reads it. Every line names its thing; no AI reads the player's words.
// Home face and quest are asked at arrival; shadow and myth are asked by the spirits on the altar walk, one per spirit.
// Every line can be skipped (position bhq-intake-skippable). The sheet lives in this tab's sessionStorage ('hq-sheet') and goes nowhere else.
export const MAX_CHARS = 140;
export const FACES = [
  ['Shaman', 'You feel the room before you speak.'],
  ['Architect', 'You build the structure that holds people.'],
  ['Challenger', 'You test what is true and push on it.'],
  ['Regent', 'You keep the promises and the order.'],
  ['Diplomat', 'You carry people across to each other.'],
  ['Sage', 'You see the whole and say it plainly.'],
];
export const ARRIVAL = {
  open: 'The founder stands on the dais. Two lines start your character sheet.',
  face: 'Which face do you lead with most days?',
  quest: 'What is one thing you want to do while you are here? Write it in your own words.',
  questLabel: 'Your quest, in your own words',
  keep: 'Write it on my sheet',
  skip: 'Skip this line',
  later: 'Shadow and myth come later, from the spirits on the altar walk.',
  done: 'The founder writes it on your sheet.',
};
/** What a spirit asks for next, after its quote: the first sheet line still blank. Shadow first, then myth. Pure. */
export const SPIRIT_ASKS = {
  shadow: { ask: 'What does this voice think it protects you from?', label: 'What the voice protects you from', keep: 'Write it on my sheet' },
  myth: { ask: 'What story does this voice tell about who you are?', label: 'The story the voice tells', keep: 'Write it on my sheet' },
};
export const SPIRIT_SKIP = 'Walk on';

/** One line as the player typed it: trimmed, one line, at most MAX_CHARS. Pure. */
export const clean = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
/** The sheet as stored: only the four known keys, cleaned, empties dropped; face must be one of FACES. Pure. */
export function sheet(o) {
  const r = {}; const s = o && typeof o === 'object' ? o : {};
  if (FACES.some(f => f[0] === s.face)) r.face = s.face;
  for (const k of ['quest', 'shadow', 'myth']) { const v = clean(s[k]); if (v) r[k] = v; }
  return r;
}
/** The first of shadow, myth that the sheet does not hold yet, or '' when both are written. Pure. */
export const nextAsk = sh => { const s = sheet(sh); return !s.shadow ? 'shadow' : !s.myth ? 'myth' : ''; };

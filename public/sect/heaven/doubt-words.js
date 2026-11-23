// The doubt card, the quest slip and the spirit cards (step 2 of the Heaven quest demo, plan heaven-quest-demo 2026-11-17).
// His answers on hq-spirits-1 (B: the spirits speak the player's own doubts) and hq-source-1 (A: Integral Life Practice).
// No imports, so a test reads it. Every line names its thing; no AI wrote or reads the player's sentences.
export const MAX_LINES = 4, MAX_CHARS = 140;
export const DOUBT = {
  ask: 'What does that voice say to you? Write it the way it says it.',
  more: 'What else does it say to you? Write the next line the way it says it.',
  label: 'The voice, in its own words',
  one: "That's the one", all: "That's all of them", another: 'Another line', later: 'Not now',
};
export const SLIP = {
  hand: 'Take this slip down the altar walk. A spirit waits there for each line you wrote.',
  steps: ['Face the voice.', 'Talk to the voice.', 'Be the voice.'],
  source: 'The three steps are from Integral Life Practice, by Wilber, Patten, Leonard and Morelli.',
  take: 'Take the slip',
  hint: "Walk out of the hall's north doors and down the altar walk.",
};
export const SPIRIT = { caption: 'You wrote this.', walk: 'Walk on' };

/** One sentence as the player typed it: trimmed, one line, at most MAX_CHARS. Pure. */
export const clean = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
/** The sentences to keep: cleaned, empties dropped, at most MAX_LINES. Pure. */
export const keep = list => (Array.isArray(list) ? list : []).map(clean).filter(Boolean).slice(0, MAX_LINES);
/** The prompt at a count of lines already written. Pure. */
export const promptAt = n => (n > 0 ? DOUBT.more : DOUBT.ask);

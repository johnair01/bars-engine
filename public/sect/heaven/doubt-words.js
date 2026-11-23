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
export const SPIRIT = { caption: 'You wrote this.', walk: 'Walk on', begin: 'Face it', resume: 'Go on', other: 'You are working with another voice. Walk on, or finish there first.' };

// Step 3 (plan heaven-quest-demo): the 3-2-1 at the chosen spirit, one line at a time, the player writing every line.
// The steps are Integral Life Practice's Face it, Talk to it, Be it, as block-room.js stands them; "it" is the doubt voice
// the player wrote, quoted back on the first step. voice says whose words the line is: 'you' the player, 'it' the voice.
export const STAND_NAMES = { face: 'Face it', talk: 'Talk to it', be: 'Be it' };
export const STAND_ORDER = ['face', 'talk', 'be'];
export const STEP = { say: 'Say it', enough: 'That is enough here', later: 'Not now', you: 'You', it: 'The voice' };
export const NEED = {
  ask: 'Does the voice have what it needs from you?',
  gift: g => `As the voice, you said it gives you: “${g}”.`,
  yes: 'Yes, it has what it needs', no: 'Not yet',
  met: 'The voice has what it needs. It gathers into a person and walks up the altar walk toward the founder\'s hall. Follow it.',
};
/** The three stands' steps for one doubt line. Pure. */
export function stepsFor(line) {
  const q = clean(line);
  return {
    face: [
      { voice: 'you', ask: `Say where the voice sits when it says “${q}”: in your body, or in this place.`, hint: 'It sits in…' },
      { voice: 'you', ask: 'Say what the voice looks like. Its size, its colour, its weight.', hint: 'It looks…' },
      { voice: 'you', ask: 'Say what the voice is doing to you.', hint: 'It is…' }],
    talk: [
      { voice: 'you', ask: 'Ask the voice what it wants from you.', hint: 'What do you want?' },
      { voice: 'it', ask: 'Answer as the voice would.', hint: 'I want…' },
      { voice: 'you', ask: 'Ask the voice what it needs from you.', hint: 'What do you need from me?' },
      { voice: 'it', ask: 'Answer as the voice would.', hint: 'I need…' }],
    be: [
      { voice: 'it', ask: 'Stand where the voice stands and say what you are.', hint: 'I am…' },
      { voice: 'it', ask: 'As the voice, say what you have been trying to do for this person.', hint: 'I have been trying to…' },
      { voice: 'it', ask: 'As the voice, say what you give back now.', hint: 'What I give you is…' }],
  };
}


/** One sentence as the player typed it: trimmed, one line, at most MAX_CHARS. Pure. */
export const clean = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
/** The sentences to keep: cleaned, empties dropped, at most MAX_LINES. Pure. */
export const keep = list => (Array.isArray(list) ? list : []).map(clean).filter(Boolean).slice(0, MAX_LINES);
/** The prompt at a count of lines already written. Pure. */
export const promptAt = n => (n > 0 ? DOUBT.more : DOUBT.ask);

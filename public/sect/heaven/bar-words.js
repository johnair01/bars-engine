// The Elder's BAR card and the return visit (step 4 of the Heaven quest demo, 2026-11-21). No imports, so a test reads it.
// Positions: bhq-tried-is-report, bhq-named-endings, bhq-smaller-move-counts, bhq-who-stays-local. Every ending is a report
// the player makes; none carries a penalty. Board bhq-overnight-1 (A): a guest signs in for anything past tonight.
export const MAX_SENTENCE = 280;
export const BAR = {
  title: 'Tonight, before you sleep',
  offer: 'The voice you faced has what it needs from you. Before you sleep, do one act in your own life. Write it as a sentence: what you will do, who it reaches, by when, and what it costs you.',
  hint: 'Tonight I will… for… by… It costs me…',
  who: 'Write a role such as “my sister” where a name would go.',
  take: 'Take the BAR', later: 'Not now',
  label: 'The act you will do tonight',
  heldGuest: 'You hold the BAR in this tab. Closing the tab ends it. To keep it for tomorrow, and have me ask how it went, sign in.',
  heldSaved: 'The BAR is in your satchel. Come back after you try it and tell me what happened.',
  local: 'Only this sentence is saved. The voice you faced and your three-two-one stay in this tab.',
  localGuest: 'When you sign in, only this sentence is saved. The voice you faced and your three-two-one stay in this tab.',
  signIn: 'Sign in to keep it', walk: 'Walk on',
  saveFail: 'The BAR could not be saved just now. It stays in this tab. Try signing in again.',
};
export const RETURN = {
  ask: 'What happened when you tried it?',
  you: 'You wrote:',
  tried: 'I tried it', smaller: 'I tried a smaller move', chose: 'I chose not to', nothing: 'Nothing changed',
  line: { tried: 'In one line, what happened?', smaller: 'What smaller move did you make? You may leave this blank.' },
  hint: { tried: 'What happened was…', smaller: 'I did…' },
  save: 'Tell the Elder',
  thanks: {
    tried: 'Thank you. That is the report, and it is enough.',
    smaller: 'A smaller move counts as trying. Thank you for telling me.',
    'chose-not': 'Choosing not to is an answer too. Thank you for telling me.',
    'nothing-changed': 'Nothing changed is something to know. Thank you for telling me.',
  },
  fail: 'The report could not be saved just now. Try again from the Elder.',
};
export const DONE = { line: 'You told me what happened. The altar walk is open whenever you want to walk it again.', credit: 'The three steps are from Integral Life Practice, by Wilber, Patten, Leonard and Morelli.' };
export const ENDING_KEY = { tried: 'tried', smaller: 'smaller', chose: 'chose-not', nothing: 'nothing-changed' };

/** The sentence as typed: one line, trimmed, at most MAX_SENTENCE. Pure. */
export const sentence = t => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, MAX_SENTENCE);
/** The report line as typed. Only "tried" needs one. Pure. */
export const reportLine = (ending, t) => { const l = String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, 2000); return { ok: ending !== 'tried' || !!l, line: l }; };
/** Which card the Elder shows for a quest state and a sign-in fact. Pure. */
export function barCardFor(quest, signedIn) {
  if (quest === 'met') return 'offer';
  if (quest === 'taken') return signedIn ? 'return' : 'held';
  if (quest === 'tried') return 'done';
  return null;
}

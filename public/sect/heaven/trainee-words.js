// The trainee walk's words, in one place with no imports so a test can read them (build 2026-11-17).
// One line per Elder, ten words or fewer, a future act. Keyed by the court the Elder keeps (layout.js COURTS order).
export const LINES = {
  challenger: 'The trial yard opens at dawn. Come for a test.',
  architect: 'A bench in the practice halls is yours to try.',
  regent: 'Your name goes in the record today. Keep it honest.',
  diplomat: 'The circle meets after supper. Bring one true thing.',
  sage: 'The library opens to anyone who brings one question.',
};
export const SENSATIONS = ['Tension', 'Constriction', 'Strength', 'Numbness'];

/** The Shaman Elder's read-back (his C on tw-readback-look-1, 2026-11-17). Pure. */
export function readBack(want) {
  const w = String(want || '').trim();
  return (w ? `We heard you: ${w}. ` : 'We heard you. ') + 'The sect names you Initiate. Your first work waits at the heart stone.';
}
export const entryLine = want => (want ? `You came wanting ${want}. ` : '') + "The Elders are waiting in the founder's hall.";
/** The stone's one answer after the scan. Pure. */
export function stoneLine(n) {
  return n ? `The stone glows once for ${n === 1 ? 'the sensation' : `the ${n} sensations`} you named. Your team felt it too.` : 'The stone glows once. Noticing nothing is a fair place to start. Your team felt it too.';
}
export const TEAM = 'You and two students make a team of three. Your team meets at the spring at dawn. Bring the bucket.';

/** The end card's line. Pure. */
export const endLine = want => (String(want || '').trim() ? `You came wanting ${String(want).trim()}. ` : '') + 'The Heaven sect named you Initiate, its first rank. You carried the bucket to the heart stone. Your team of three meets at the spring at dawn.';

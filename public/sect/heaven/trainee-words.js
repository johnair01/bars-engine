// The trainee walk's words, in one place with no imports so a test can read them (build 2026-11-17).
// One line per Elder, ten words or fewer, a future act. Keyed by the court the Elder keeps (layout.js COURTS order).
export const LINES = {
  challenger: 'The trial yard opens at dawn. Come for a test.',
  architect: 'A bench in the practice halls is yours to try.',
  regent: 'Your name goes in the record today. Keep it honest.',
  diplomat: 'The circle meets after supper. Bring one true thing.',
  sage: 'The library opens to anyone who brings one question.',
};
// The guided climb (Wendell's note on tw-build-look-1, 2026-11-19): the walk starts at the great court and a series of
// small quests, one waymark each, leads the player up the mountain like a tour. `hint` shows while the player walks to
// the stop, `said` is what is said on arrival. `key` is also the `?stop=` value that lands a player there (the hook a
// farm quest notice uses). The last stop hands over to the Elders' walk at the crown court.
export const CLIMB = [
  { key: 'bell', hint: 'Walk to the bronze bell.', said: 'Every student starts at the bronze bell. Now take the stone stair at the back of the court.' },
  { key: 'stair', hint: "Take the stone stair at the court's back edge.", said: 'The stair climbs the ridge in flights. Climb to the first landing.' },
  { key: 'landing', hint: 'Climb to the first landing of the stair.', said: 'Students carry water up this stair every dawn. Climb on to the gate at the top.' },
  { key: 'gate', hint: 'Climb to the gate at the top of the stair.', said: 'Past this gate a bridge crosses the saddle to the winding road.' },
  { key: 'bridge', hint: 'Cross the bridge.', said: 'The winding road circles the crag. Follow it up to the crown.' },
  { key: 'road', hint: 'Follow the winding road up the crag.', said: 'The crown gate is ahead. The founder\'s hall stands behind it.' },
  { key: 'crown', hint: 'Walk through the crown gate.', said: '' },
];
/** The card before the climb. Pure. */
export const climbIntro = want => (String(want || '').trim() ? `You came wanting ${String(want).trim()}. ` : '') + "The Elders wait in the founder's hall, at the top of the mountain. A student by the bronze bell will start you on the way up.";
export const CLIMB_KEYS = CLIMB.map(c => c.key);

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

/** The last card's one line and its one link (ch1-last-card-1, his A 2026-11-22). Pure. */
export const PATREON_LINE = 'The story goes on with patrons from 9 December.';
export const PATREON_URL = 'https://www.patreon.com/wendell_britt';

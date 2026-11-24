// The wayfarers on the guided climb (Wendell's B on tw-build-look-2, 2026-11-19: "more NPCs walking around on the path up
// that can be talked to for more information about the Heaven sect"). No imports, so a test reads it. Deterministic: no AI.
// Every line names its thing and states only what the sect world already holds (layout.js courts, trainee-words.js ranks).
// Keyed by the climb stop each stands beside; `open` is what is said first, each ask is [reply seal, answer].
export const WAYFARERS = {
  landing: {
    open: 'I carry water up this stair every dawn. Initiates carry a bucket to the heart stone.',
    asks: [
      ['Who keeps the courts?', 'Six Elders keep six courts: the trial yard, the practice halls, the record hall, the circle, the library and the hearth cave.'],
      ['Why water?', 'The heart stone glows once for each sensation a new student names. The bucket is how a student reaches it.'],
    ],
  },
  gate: {
    open: 'Anyone may pass this gate. The Elders receive new students in the founder\'s hall at the top.',
    asks: [
      ['What do the Elders teach?', 'One Elder keeps the trial yard, one the practice halls, one the record, one the circle, one the library, and one the hearth.'],
      ['What is past the gate?', 'A bridge crosses the saddle to the winding road. The road circles the crag up to the crown gate.'],
    ],
  },
  bridge: {
    open: 'The wind crosses the saddle both ways. I am walking down to the bronze bell.',
    asks: [
      ['What is the first rank?', 'Initiate. The sect names you one at the heart stone, and your team of three meets at the spring at dawn.'],
      ['Why the bell?', 'Every student starts at the bronze bell in the great court, then takes the stone stair.'],
    ],
  },
  road: {
    open: 'I rest here before the last bend. The winding road circles the crag up to the crown gate.',
    asks: [
      ['What waits at the crown?', 'The crown gate opens on the founder\'s hall. The Elders are waiting there for you.'],
      ['How far is the crown?', 'The crown gate is ahead. The founder\'s hall stands behind it.'],
    ],
  },
};
export const WAYFARER_KEYS = Object.keys(WAYFARERS);

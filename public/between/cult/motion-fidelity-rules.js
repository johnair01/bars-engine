// The rules of the fidelity gate: the numbers that make a walk read as a walk, and how a figure is judged against
// the capture measured beside it. No imports, so the same rules run in the browser (against the lab page) and in a
// plain node test.
//   import { compare, BANDS } from '/between/cult/motion-fidelity-rules.js';
const r3 = x => Math.round(x * 1e3) / 1e3;
const r2 = x => Math.round(x * 100) / 100;

// the metrics one figure or one capture reports
export function summarise(frames) {
  const pelvis = frames.map(f => f.pelvisHeight);
  const lean = frames.map(f => f.lean);
  const knee = frames.map(f => f.kneeFold);
  const lift = [0, 1].map(i => Math.max(...frames.map(f => f.toeY[i])));
  const reach = [0, 1].map(i => Math.max(...frames.map(f => f.reach[i])));
  return {
    pelvisTravel: +(Math.max(...pelvis) - Math.min(...pelvis)).toFixed(4),
    pelvisHeight: +(pelvis.reduce((a, b) => a + b, 0) / pelvis.length).toFixed(4),
    leanMean: +(lean.reduce((a, b) => a + b, 0) / lean.length).toFixed(2),
    leanMin: Math.min(...lean), leanMax: Math.max(...lean),
    leanRange: +(Math.max(...lean) - Math.min(...lean)).toFixed(2),
    kneeFold: Math.min(...knee),                       // the most folded knee over the cycle
    kneeFoldMean: +(knee.reduce((a, b) => a + b, 0) / knee.length).toFixed(2),
    footLift: +(lift.reduce((a, b) => a + b, 0) / 2).toFixed(4),
    footReach: +(reach.reduce((a, b) => a + b, 0) / 2).toFixed(3),
  };
}

// the bands, relative to the capture measured on the same frame.
// walk: the capture folds its swing knee to 105 degrees and leans 1-5 degrees, and the pelvis moves 24 mm.
// run: the capture folds to 85 degrees, leans 9-13 degrees, and the pelvis moves 96 mm.
export const BANDS = {
  walk: {
    kneeFold: { rule: 'atMost', slack: 20, label: 'the swing knee folds', unit: 'deg',
      says: 'the knee bends at least as much as the capture does' },
    leanRange: { rule: 'atLeast', of: 0.4, label: 'the torso lean moves', unit: 'deg',
      says: 'the lean changes with the weight, at least 40% as much as the capture' },
    leanMean: { rule: 'within', slack: 6, label: 'the torso leans like the capture', unit: 'deg',
      says: 'the mean lean is within 6 degrees of the capture' },
    pelvisTravel: { rule: 'atMost', of: 1.8, label: 'the pelvis stays level', unit: 'm',
      says: 'the hips move at most 1.8 times as much as the capture' },
    footLift: { rule: 'within', of: [0.6, 1.6], label: 'the foot lifts', unit: 'm',
      says: 'the foot lifts between 0.6 and 1.6 times the capture' },
    footReach: { rule: 'within', of: [0.7, 1.4], label: 'the foot comes down near where it left', unit: 'm',
      says: 'the foot reaches between 0.7 and 1.4 times the capture' },
  },
  run: {
    kneeFold: { rule: 'atMost', slack: 20, label: 'the swing knee folds', unit: 'deg',
      says: 'the knee bends at least as much as the capture does' },
    leanRange: { rule: 'atLeast', of: 0.4, label: 'the torso lean moves', unit: 'deg',
      says: 'the lean changes with the weight, at least 40% as much as the capture' },
    leanMean: { rule: 'within', slack: 4, label: 'the torso leans like the capture', unit: 'deg',
      says: 'the mean lean is within 4 degrees of the capture' },
    pelvisTravel: { rule: 'atMost', of: 1.8, label: 'the pelvis stays level', unit: 'm',
      says: 'the hips move at most 1.8 times as much as the capture' },
    footLift: { rule: 'within', of: [0.6, 1.6], label: 'the flight lifts the foot', unit: 'm',
      says: 'the foot lifts between 0.6 and 1.6 times the capture' },
    footReach: { rule: 'within', of: [0.7, 1.4], label: 'the stride lands near where it took off', unit: 'm',
      says: 'the foot reaches between 0.7 and 1.4 times the capture' },
  },
};

// compare a measured figure with a measured capture. Returns one check per band, each with the numbers.
export function compare(kind, figure, capture, bands = BANDS) {
  const set = bands[kind] || bands.walk, checks = [];
  for (const [name, band] of Object.entries(set)) {
    const f = figure[name], c = capture[name];
    let pass, limit;
    if (band.rule === 'atMost' && band.of !== undefined) { limit = r3(c * band.of); pass = f <= limit; }
    else if (band.rule === 'atMost') { limit = r2(c + band.slack); pass = f <= limit; }
    else if (band.rule === 'atLeast' && band.of !== undefined) { limit = r2(c * band.of); pass = f >= limit; }
    else if (band.rule === 'within' && Array.isArray(band.of)) { limit = [r3(c * band.of[0]), r3(c * band.of[1])]; pass = f >= limit[0] && f <= limit[1]; }
    else if (band.rule === 'within') { limit = [r2(c - band.slack), r2(c + band.slack)]; pass = f >= limit[0] && f <= limit[1]; }
    else throw new Error('unknown band rule ' + band.rule);
    checks.push({ name, label: band.label, says: band.says, unit: band.unit, figure: f, capture: c, limit, pass });
  }
  return { kind, pass: checks.every(c => c.pass), checks };
}

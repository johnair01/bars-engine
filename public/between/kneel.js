/* The kneel, as one verb word (council canon/mechanics/verb-word.yaml: kneel, floor, slowly, earth). Plain module, no
   three.js, so the pose has a test (src/lib/between/__tests__/kneel.test.ts). It names no body: kneelPose takes a body's
   own measured lengths and returns where hips, knees, ankles and feet go, in the body's frame (l: her left, y: up,
   f: forward, metres from the midpoint of the standing feet on the floor), so no body carries its own numbers.

   Drawn and approved in the council's animation-language rounds 5 to 7 (make/kneel.html; Wendell's A on al-look-5 and on
   al-look-7). Beats 1 and 2 follow Carnegie Mellon capture 23_03 every 0.1 s, mirrored so the left knee goes down first.
   Beats 3 to 5 follow the dojo order of sitting in seiza. Round 7 (his note on al-look-6: "humans dont kneel like that
   they'd fall over. They'd lean back while trying to hold their back straight as they sink"): from the lunge the hips sink
   back on an arc about the knees while the chest tips back with the spine held straight.

   Not drawn: the skirt over the thighs, and toe bend (the rig has no toe bones). */

export const WORD = Object.freeze({ verb: "kneel", target: "floor", manner: "slowly", element: "earth" });
export const DURATION = 4.0;                          // seconds, "slowly"; beat 5 holds the rest
export const BEATS = [
  [0.5, "Chest leads", "hips still high"],
  [1.9, "Left knee down first", "left foot back"],
  [2.6, "Right knee joins, she sinks", "chest back, spine straight"],
  [3.3, "Toes flatten", "the feet roll onto their insteps"],
  [4.0, "Rest, tall", "hands on the thighs"],
];

/* CMU 23_03, every 0.1 s from 0 to 2.0 s. hip: hip joints' height over standing; lean: chest from vertical, degrees;
   kneeB: back knee's height over standing; ankB: back ankle's height over the standing hip height. */
export const CAP = {
  hip: [1.0, 0.998, 0.983, 0.963, 0.948, 0.931, 0.905, 0.869, 0.814, 0.758, 0.707, 0.679, 0.659, 0.625, 0.585, 0.557, 0.538, 0.525, 0.515, 0.507, 0.507],
  lean: [10.5, 15.4, 19.9, 26.5, 33.1, 38.0, 40.9, 43.1, 43.3, 42.1, 42.1, 44.8, 46.0, 43.5, 39.9, 37.7, 35.1, 34.2, 33.5, 33.2, 31.9],
  kneeB: [1.0, 0.987, 0.959, 0.936, 0.928, 0.914, 0.869, 0.794, 0.686, 0.58, 0.504, 0.477, 0.454, 0.4, 0.34, 0.338, 0.357, 0.293, 0.203, 0.193, 0.181],
  ankB: [0.099, 0.1, 0.102, 0.125, 0.16, 0.211, 0.252, 0.264, 0.237, 0.222, 0.21, 0.205, 0.204, 0.203, 0.205, 0.202, 0.2, 0.193, 0.2, 0.2, 0.207],
};
export const cap = (k, t) => {
  const a = CAP[k], x = Math.min(a.length - 1, Math.max(0, t * 10)), i = Math.floor(x), j = Math.min(a.length - 1, i + 1);
  return a[i] + (a[j] - a[i]) * (x - i);
};

export const CALM = 0.45;        // a calm kneel leans less than the capture, who reaches toward someone
export const LEAN_BACK = -0.19;  // radians, about 11 degrees back as she sinks, the spine held straight
const SINK = 0.80, SEIZA = 0.46; // hip joint over the knee, in thighs: mid-sink (toes tucked), and seiza

const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const lerp = (a, b, x) => a + (b - a) * x;
const unit = (v) => { const n = Math.hypot(v.l, v.y, v.f) || 1; return { l: v.l / n, y: v.y / n, f: v.f / n }; };
const mix = (a, b, x) => unit({ l: lerp(a.l, b.l, x), y: lerp(a.y, b.y, x), f: lerp(a.f, b.f, x) });
const root = (a, b) => Math.sqrt(Math.max(1e-6, a * a - b * b));

/* The contact heights a body starts from; a caller measures them on the body (knee joint over the floor when the kneecap
   rests on it, ankle joint with toes tucked and with the foot flat) and passes them in G, as kneel.html did. */
export function defaultContacts(dims) {
  return { kneeY: 0.06 * dims.thigh / 0.4, ankT: 0.20 * dims.H, ankF: 0.62 * dims.A0 };
}

/* dims: { H: hip-joint height standing, thigh, shin, hw: hip width, A0: ankle height standing, K0: knee height standing,
   foot0: { L, R } standing foot directions in the body frame, G: contact heights (defaultContacts) }. */
export function kneelPose(dims, t) {
  const { H, thigh, shin, hw, A0, K0 } = dims, G = dims.G || defaultContacts(dims);
  const foot0 = dims.foot0 || { L: { l: 0, y: -0.1, f: 1 }, R: { l: 0, y: -0.1, f: 1 } };
  const kR2 = shin + A0, hip2y = cap("hip", 1.9) * H, hip2f = 0.04 - root(thigh, Math.min(thigh * 0.98, hip2y - kR2));
  const behind = (kn, ay) => kn.f - root(shin, Math.min(shin * 0.999, kn.y - ay));
  const S = { L: 1, R: -1 }, out = { K: {}, A: {}, foot: {}, hands: 0 };
  const tuck = unit({ l: 0, y: -1, f: 0.28 }), flat = (s) => unit({ l: -S[s] * 0.16, y: 0.02, f: -1 });
  if (t <= 1.9) {
    // beats 1 and 2: the capture's timing. Hips and chest from 23_03; the left (back) knee falls at the capture's rate.
    const hy = cap("hip", t) * H, e = sm(0, 1, (1 - cap("hip", t)) / (1 - cap("hip", 1.9)));
    out.hip = { l: 0, y: hy, f: hip2f * e };
    out.lean = (cap("lean", t) - CAP.lean[0]) * CALM * Math.PI / 180;
    const ky = Math.max(G.kneeY, cap("kneeB", t) * K0);
    const kn = { y: ky, f: out.hip.f - root(thigh, Math.min(thigh * 0.999, hy - ky)) * 0.35 };
    const k = sm(1.5, 1.9, t), ay = Math.max(A0, A0 + (cap("ankB", t) - CAP.ankB[0]) * H) * (1 - k) + G.ankT * k;
    out.K.L = { l: hw / 2, ...kn }; out.A.L = { l: hw / 2, y: ay, f: behind(kn, ay) };
    out.foot.L = mix(foot0.L, tuck, sm(0.3, 1.2, t));
    out.A.R = null; out.K.R = { l: -hw / 2, y: kR2, f: 0.3 }; out.foot.R = foot0.R;
    return out;
  }
  // beats 3 to 5: from the lunge the hips sink straight back on an arc about the knees while the chest tips back with the
  // spine held straight, which keeps her weight over the shins and the tucked toes behind the knees.
  const l2 = kneelPose(dims, 1.9), kneesF = l2.K.L.f;
  const e3 = sm(1.9, 2.6, t), e4 = sm(2.6, 3.3, t), e5 = sm(3.3, 4.0, t);
  const r0 = Math.hypot(l2.hip.y - G.kneeY, l2.hip.f - kneesF), a0 = Math.atan2(l2.hip.y - G.kneeY, l2.hip.f - kneesF);
  const aS = Math.PI - Math.asin(SINK), a1 = Math.PI - Math.asin(SEIZA);
  const ang = lerp(lerp(a0, aS, e3), a1, e4), rad = lerp(r0, thigh, e3);
  out.hip = { l: 0, y: G.kneeY + rad * Math.sin(ang), f: kneesF + rad * Math.cos(ang) };
  out.lean = lerp(lerp(l2.lean, LEAN_BACK, sm(0, 0.75, e3)), LEAN_BACK * 0.45, e4) * (1 - e5);
  const ay = lerp(G.ankT, G.ankF, e4) + 0.09 * Math.sin(Math.PI * e4);   // the foot rolls over its toes, so the ankle lifts as it turns
  for (const s of ["L", "R"]) {
    const kn = { l: S[s] * hw / 2 * 0.9, y: G.kneeY, f: kneesF };
    const A = { l: kn.l, y: ay, f: behind(kn, ay) };
    if (s === "R" && e3 < 1) { // the right knee comes down beside the left; its foot swings back under it, lifted clear
      const K1 = l2.K.R, A1 = { l: -hw / 2, y: A0, f: 0 }, w = e3;
      out.K.R = { l: lerp(K1.l, kn.l, w), y: lerp(K1.y, kn.y, w), f: lerp(K1.f, kn.f, w) };
      out.A.R = { l: lerp(A1.l, A.l, w), y: lerp(A1.y, A.y, w) + 0.06 * Math.sin(Math.PI * w), f: lerp(A1.f, A.f, w) };
      out.foot.R = mix(foot0.R, tuck, sm(0.2, 1, w));
      continue;
    }
    out.K[s] = kn; out.A[s] = A; out.foot[s] = mix(tuck, flat(s), e4);
  }
  out.hands = e5 * 0.6 + e4 * 0.4;
  return out;
}

/* The Between keeps its own time (Wendell, uu-between-clock A, 2026-11-02: "Claude takes it: its own time"). Both players
   stand under one sky: no clock, time zone or time of day reaches it. Its light comes from the Between's health, as
   ba-qi-is-light (2026-10-21) has it: practice raises qi as the hollow's light and weather, never as a meter or a currency
   (uu-weather-follows-qi). A tended, fed Between brightens: the sky lifts, the sun stands higher in the opening, fewer stars
   show. A neglected one dims toward night: the sun sinks, more stars come out. The room style the two of them agreed on
   (public/calrunia/room-styles.js) is the sky's colour; qi only lifts or lowers it, so dusk stays dusk.

   qiOf reads the same health the creature and the motes read (garden.js `look`): satisfaction 1..10 from agreements held
   and offerings fed, and `stale` when nobody has tended it for STALE_DAYS. Every input is shared room state, so both
   players compute the same number. Nothing here reads Date or the hour. */

export const QI = { stale: 0.12, spark: 0.4, low: 0.25, high: 1 };

/** The Between's qi, 0..1, from its health. A closed or unknown Between reads as a spark. */
export function qiOf(look = {}) {
  const { phase = "spark", stale = false, sat = 3 } = look;
  if (stale) return QI.stale;
  if (phase === "spark") return QI.spark;
  const s = Math.max(1, Math.min(10, Number(sat) || 1));
  return QI.low + (QI.high - QI.low) * (s - 1) / 9;
}

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** What the sky shows at a qi, from the style's own values (`base`). qi 0.5 gives the style back unchanged. Below it the
    sky darkens toward night and the sun sinks behind the ridge; above it the sky opens and lightens and the sun climbs. */
export function skyAt(base, qi) {
  const q = clamp(qi);
  const tint = c => c.map(v => clamp(q < 0.5 ? v * (0.3 + 1.4 * q) : v + (1 - v) * 0.3 * (q - 0.5) * 2));
  const rise = q - 0.5;
  return {
    sky: { top: tint(base.sky.top), mid: tint(base.sky.mid), low: tint(base.sky.low), hor: tint(base.sky.hor) },
    stars: base.stars > 0 ? clamp(base.stars * (1.6 - 1.2 * q), 0, 1) : 0, // a style with no stars (morning) keeps none
    sunY: base.sunY + rise * 8,                                  // the sun disc: about -0.6 dim to 7.4 bright, around the drawn 3.4
    sunDir: [base.sunDir[0], base.sunDir[1] + rise * 0.3, base.sunDir[2]], // the sky's own glow follows the disc
    sun: base.sun ? base.sun.map(v => clamp(v + (1 - v) * Math.max(0, rise) * 1.6)) : null, // the disc stays brighter than the sky round it
    dusk: base.dusk * (0.55 + 0.9 * q),
  };
}

const U = { top: "uTop", mid: "uMid", low: "uLow", hor: "uHor" };

/** Binds to buildHollow's handles. Call rebase() after a room style is applied, and step(dt, qi) once a frame. */
export function makeQiSky(handles) {
  const h = handles || {}, sky = h.sky && h.sky.uniforms, L = h.lights || {};
  // a style never moves the sun, so where it stands is read once, before qi moves it
  const sunY = h.sun ? h.sun.position.y : 3.4, sunDir = sky && sky.uSun ? sky.uSun.value.toArray() : [0.18, 0.05, -1];
  let base = null, k = null;
  /** Reads the style's values. Only call it right after applyStyle has set them, or it reads qi's own changes back. */
  function rebase() {
    base = {
      sky: Object.fromEntries(Object.entries(U).map(([n, u]) => [n, sky && sky[u] ? sky[u].value.toArray() : [0, 0, 0]])),
      stars: h.stars ? h.stars.opacity : 0,
      sunY, sunDir, sun: h.sun && h.sun.material ? h.sun.material.color.toArray() : [1, 0.81, 0.53],
      dusk: L.dusk ? L.dusk.intensity : 0,
    };
    if (k != null) put(k);
  }
  function put(q) {
    const s = skyAt(base, q);
    if (sky) for (const [n, u] of Object.entries(U)) if (sky[u]) sky[u].value.set(...s.sky[n]);
    if (h.stars) { h.stars.opacity = s.stars; h.stars.visible = s.stars > 0; }
    if (h.sun) { h.sun.position.y = s.sunY; h.sun.lookAt(0, 0, 0); if (s.sun && h.sun.material) h.sun.material.color.setRGB(...s.sun); }
    if (sky && sky.uSun) sky.uSun.value.set(...s.sunDir).normalize();
    if (L.dusk) L.dusk.intensity = s.dusk;
  }
  function step(dt, qi) {
    if (!base) rebase();
    const q = clamp(qi);
    if (k == null) k = q; else k += (q - k) * Math.min(1, dt * 0.35); // a slow turn of weather, about ten seconds
    put(k);
    return k;
  }
  return { rebase, step, get qi() { return k; } };
}

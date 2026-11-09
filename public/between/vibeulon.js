/* The vibeulon tile: Wendell's printed coin (vibeulon/physical-2026-11-07), a hexagonal tile with a round hole through it,
   a chevron texture in six wedges, a raised ring round the hole, blue-violet with a magenta sheen. Drawn in code, no asset.
   Copied from the fo3-ad3 prototype's `VIB()` (Six-faces-council, friendcraft-slice3-ad3). */
let vibN = 0;
/** The glow a coin takes from the feeling it was minted with (the five elements; the colours are this game's own). */
export const FEEL_GLOW = { wood: "rgba(150,190,90,.85)", fire: "rgba(240,120,60,.85)", earth: "rgba(214,170,80,.85)", metal: "rgba(200,210,225,.85)", water: "rgba(90,150,230,.85)" };
export const glowOf = feel => FEEL_GLOW[feel] || "rgba(190,150,255,.8)";
/** @param {string} glow a CSS colour for the halo  @param {number} [size] pixels */
export function VIB(glow, size = 44) {
  const k = "vb" + (vibN++), R = 46, c = 50, pt = a => [c + R * Math.cos(a), c + R * Math.sin(a)];
  const V = [0, 1, 2, 3, 4, 5].map(i => pt(i * Math.PI / 3));
  const P = a => a.map(q => q[0].toFixed(2) + "," + q[1].toFixed(2)).join(" ");
  let clips = "", hatch = "";
  for (let i = 0; i < 6; i++) {
    const a = V[i], b = V[(i + 1) % 6], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    [[a, m, a], [m, b, b]].forEach(([p1, p2, along], j) => {
      const id = `${k}c${i}${j}`;
      clips += `<clipPath id="${id}"><polygon points="${P([[c, c], p1, p2])}"/></clipPath>`;
      const ang = Math.atan2(along[1] - c, along[0] - c) * 180 / Math.PI;
      let ls = ""; for (let y = -60; y <= 60; y += 3.4) ls += `M-60 ${y}H60`;
      hatch += `<g clip-path="url(#${id})"><path transform="translate(${c} ${c}) rotate(${ang + (j ? -32 : 32)})" d="${ls}" stroke="#2a1f8f" stroke-width="1.1" opacity=".55"/></g>`;
    });
  }
  return `<span class="rb-restcoin rb-vib" style="--glow:${glow};width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><defs>
    <linearGradient id="${k}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3ee0"/><stop offset=".35" stop-color="#8b46d6"/><stop offset=".6" stop-color="#3f52e8"/><stop offset="1" stop-color="#a04bd0"/></linearGradient>
    <mask id="${k}m"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="50" r="15" fill="#000"/></mask>${clips}</defs>
    <g mask="url(#${k}m)"><polygon points="${P(V.map(q => [q[0], q[1] + 4]))}" fill="#22186e"/>
    <polygon points="${P(V)}" fill="url(#${k}g)" stroke="#3a2aa8" stroke-width="1.2"/>${hatch}
    <circle cx="50" cy="50" r="23" fill="url(#${k}g)"/><circle cx="50" cy="50" r="23" fill="none" stroke="#d65ad8" stroke-width="1.6" opacity=".9"/>
    <circle cx="50" cy="50" r="15.8" fill="none" stroke="#1a1460" stroke-width="2.4"/>
    <path d="M${P([V[3], V[4], V[5]]).replace(/ /g, " L")}" fill="none" stroke="#e7b6ff" stroke-width="1" opacity=".6"/></g></svg></span>`;
}

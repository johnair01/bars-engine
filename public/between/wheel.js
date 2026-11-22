/* The Alchemy Wheel, slice 1 (six-faces-council pass 2026-11-20-alchemy-wheel-ad, frame A "the instrument").
   Seated at the fire, the Wheel stands at eye height over the hearth: five lenses around a brass ring in the generate
   (sheng) order read from the shared charge engine, the control (ke) star across its face, and three notches per lens
   for dissatisfied, neutral and satisfied. The ember you hold or sit with lights its own lens at its own notch.
   Drawn as SVG from the cycles, so an arrow can never point the wrong way. No routes or cards yet (slice 2). */
import { CYCLES } from "../calrunia/charge-engine.js";

const EL = { joy: "wood", anger: "fire", neutrality: "earth", fear: "metal", sadness: "water" };
const NAME = { joy: "Joy", anger: "Anger", neutrality: "Neutrality", fear: "Fear", sadness: "Sadness" };
const SAT = { joy: "Bliss", anger: "Triumph", neutrality: "Peace", fear: "Wonder-Excitement", sadness: "Poignance" };
const FRAME = { wood: "#4a7c59", fire: "#c1392b", earth: "#b5651d", metal: "#8e9aab", water: "#1a3a5c" };   // tokens.css --ui-<el>
const GLOW = { wood: "#27ae60", fire: "#e8671a", earth: "#d4a017", metal: "#bdc3c7", water: "#1a7a8a" };    // --ui-<el>-glow
const BRASS = "#b8914a", BRASS_HI = "#e6c98a", INK = "#f6ecdc";
const ELEMENT_CHANNEL = Object.fromEntries(Object.entries(EL).map(([c, e]) => [e, c]));

/** The five channels in generate order, starting from Joy. */
export function ringOrder() {
  const out = ["joy"];
  while (out.length < 5) out.push(CYCLES.sheng[out[out.length - 1]]);
  return out;
}

/** The Wheel as an SVG string. `element` is the lit ember's element (or null); `level` 0, 1 or 2 is its state. */
export function wheelSvg({ element = null, level = 0 } = {}) {
  const lit = element ? ELEMENT_CHANNEL[element] : null;
  const order = ringOrder(), R = 112, C = 150, r = 30;
  const at = i => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [C + R * Math.cos(a), C + R * Math.sin(a)]; };
  const pos = Object.fromEntries(order.map((c, i) => [c, at(i)]));
  const toward = ([x1, y1], [x2, y2], d) => { const L = Math.hypot(x2 - x1, y2 - y1); return [x1 + ((x2 - x1) / L) * d, y1 + ((y2 - y1) / L) * d]; };
  const arrow = (from, to, cls) => { const [a, b] = [toward(pos[from], pos[to], r + 4), toward(pos[to], pos[from], r + 8)]; return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}" marker-end="url(#wh-${cls})"/>`; };
  const sheng = order.map(c => arrow(c, CYCLES.sheng[c], "gen")).join("");
  const ke = order.map(c => arrow(c, CYCLES.ke[c], "ctl")).join("");
  const lens = order.map(c => {
    const [x, y] = pos[c], el = EL[c], on = c === lit;
    const nx = x >= C ? x + r + 6 : x - r - 15;   // outward from the centre, clear of the arrows
    const notches = [0, 1, 2].map(n => `<rect x="${nx.toFixed(1)}" y="${(y + 10 - n * 10).toFixed(1)}" width="9" height="6" rx="1.5" fill="${on && n === level ? GLOW[el] : on && n < level ? FRAME[el] : "#3a2a1c"}" stroke="${BRASS}" stroke-width="0.8"/>`).join("");
    return `<g class="wh-lens${on ? " on" : ""}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 5}" fill="#2b1e16" stroke="${BRASS}" stroke-width="3"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#wh-g-${el})" opacity="${lit && !on ? 0.45 : 1}"/>
      ${on ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 9}" fill="none" stroke="${GLOW[el]}" stroke-width="2" opacity="0.8"><animate attributeName="opacity" values="0.35;0.9;0.35" dur="2.4s" repeatCount="indefinite"/></circle>` : ""}
      ${notches}
      <text x="${x.toFixed(1)}" y="${(y + r + 20).toFixed(1)}" text-anchor="middle" class="wh-name">${NAME[c]}</text>
      ${on && level === 2 ? `<text x="${x.toFixed(1)}" y="${(y + r + 33).toFixed(1)}" text-anchor="middle" class="wh-sat">${SAT[c]}</text>` : ""}
    </g>`;
  }).join("");
  const grads = Object.keys(FRAME).map(el => `<radialGradient id="wh-g-${el}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${GLOW[el]}"/><stop offset="1" stop-color="${FRAME[el]}"/></radialGradient>`).join("");
  return `<svg viewBox="-14 -8 336 326" role="img" aria-label="The Alchemy Wheel${lit ? `: your ember is in ${NAME[lit]}, ${["dissatisfied", "neutral", "satisfied"][level]}` : ""}">
    <defs>${grads}
      <marker id="wh-gen" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${BRASS_HI}"/></marker>
      <marker id="wh-ctl" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${BRASS}" opacity="0.6"/></marker>
    </defs>
    <style>.gen{stroke:${BRASS_HI};stroke-width:2.2}.ctl{stroke:${BRASS};stroke-width:1;opacity:.55}.wh-name{font:13px Marcellus,Georgia,serif;fill:${INK}}.wh-sat{font:11px Marcellus,Georgia,serif;fill:${BRASS_HI}}</style>
    <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${BRASS}" stroke-width="10" opacity="0.35"/>
    ${ke}${sheng}${lens}
  </svg>`;
}

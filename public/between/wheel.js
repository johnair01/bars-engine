/* The Alchemy Wheel, slice 2 (six-faces-council pass 2026-11-20-alchemy-wheel-ad, frame A "the instrument").
   Seated at the fire, the Wheel stands at eye height over the hearth: five lenses around a brass ring in the generate
   (sheng) order read from the shared charge engine, the control (ke) star across its face, and three notches per lens
   for dissatisfied, neutral and satisfied. The ember you hold or sit with lights its own lens at its own notch.
   Slice 2 adds: tap a lens to name a satisfaction you are reaching for, the routeOptions roads light up across the
   Wheel's arrows, and the move card for the path is dealt below it. Drawn as SVG from the cycles, so an arrow can
   never point the wrong way. */
import { CYCLES } from "../calrunia/charge-engine.js";

const EL = { joy: "wood", anger: "fire", neutrality: "earth", fear: "metal", sadness: "water" };
const NAME = { joy: "Joy", anger: "Anger", neutrality: "Neutrality", fear: "Fear", sadness: "Sadness" };
const SAT = { joy: "Bliss", anger: "Triumph", neutrality: "Peace", fear: "Wonder-Excitement", sadness: "Poignance" };
const FRAME = { wood: "#4a7c59", fire: "#c1392b", earth: "#b5651d", metal: "#8e9aab", water: "#1a3a5c" };   // tokens.css --ui-<el>
const GLOW = { wood: "#27ae60", fire: "#e8671a", earth: "#d4a017", metal: "#bdc3c7", water: "#1a7a8a" };    // --ui-<el>-glow
const BRASS = "#b8914a", BRASS_HI = "#e6c98a", INK = "#f6ecdc";
export const ELEMENT_CHANNEL = Object.fromEntries(Object.entries(EL).map(([c, e]) => [e, c]));
const CHANNEL_ORDER = ["joy", "anger", "neutrality", "fear", "sadness"];

/** The five channels in generate order, starting from Joy. */
export function ringOrder() {
  const out = ["joy"];
  while (out.length < 5) out.push(CYCLES.sheng[out[out.length - 1]]);
  return out;
}

/** A cell: channel + satisfaction state (0 = dissatisfied, 1 = neutral, 2 = satisfied). */
export class Cell {
  constructor(channel, state) { this.channel = channel; this.state = state; }
}
export function cellKey(c) { return `${c.channel}:${c.state}`; }

/** Steps between cells, derived from move-table.json (the one move table). */
const MOVES = [
  // transcend — same channel, dissatisfied→neutral→satisfied
  { id: "wood_transcend", family: "transcend", from: { channel: "joy", state: 0 }, lands: { channel: "joy", state: 1 }, name: "Commit to Growth" },
  { id: "wood_transcend", family: "transcend", from: { channel: "joy", state: 1 }, lands: { channel: "joy", state: 2 }, name: "Commit to Growth" },
  { id: "fire_transcend", family: "transcend", from: { channel: "anger", state: 0 }, lands: { channel: "anger", state: 1 }, name: "Achieve Breakthrough (Triumph)" },
  { id: "fire_transcend", family: "transcend", from: { channel: "anger", state: 1 }, lands: { channel: "anger", state: 2 }, name: "Achieve Breakthrough (Triumph)" },
  { id: "earth_transcend", family: "transcend", from: { channel: "neutrality", state: 0 }, lands: { channel: "neutrality", state: 1 }, name: "Stabilize Coherence" },
  { id: "earth_transcend", family: "transcend", from: { channel: "neutrality", state: 1 }, lands: { channel: "neutrality", state: 2 }, name: "Stabilize Coherence" },
  { id: "metal_transcend", family: "transcend", from: { channel: "fear", state: 0 }, lands: { channel: "fear", state: 1 }, name: "Step Through (Wonder-Excitement)" },
  { id: "metal_transcend", family: "transcend", from: { channel: "fear", state: 1 }, lands: { channel: "fear", state: 2 }, name: "Step Through (Wonder-Excitement)" },
  { id: "water_transcend", family: "transcend", from: { channel: "sadness", state: 0 }, lands: { channel: "sadness", state: 1 }, name: "Reclaim Meaning" },
  { id: "water_transcend", family: "transcend", from: { channel: "sadness", state: 1 }, lands: { channel: "sadness", state: 2 }, name: "Reclaim Meaning" },
  // generative — sheng channel, raises one state
  { id: "wood_fire", family: "generative", from: { channel: "joy", state: 0 }, lands: { channel: "anger", state: 1 }, name: "Declare Intention" },
  { id: "wood_fire", family: "generative", from: { channel: "joy", state: 1 }, lands: { channel: "anger", state: 2 }, name: "Declare Intention" },
  { id: "fire_earth", family: "generative", from: { channel: "anger", state: 0 }, lands: { channel: "neutrality", state: 1 }, name: "Integrate Gains" },
  { id: "fire_earth", family: "generative", from: { channel: "anger", state: 1 }, lands: { channel: "neutrality", state: 2 }, name: "Integrate Gains" },
  { id: "earth_metal", family: "generative", from: { channel: "neutrality", state: 0 }, lands: { channel: "fear", state: 1 }, name: "Reveal Stakes" },
  { id: "earth_metal", family: "generative", from: { channel: "neutrality", state: 1 }, lands: { channel: "fear", state: 2 }, name: "Reveal Stakes" },
  { id: "metal_water", family: "generative", from: { channel: "fear", state: 0 }, lands: { channel: "sadness", state: 1 }, name: "Deepen Value" },
  { id: "metal_water", family: "generative", from: { channel: "fear", state: 1 }, lands: { channel: "sadness", state: 2 }, name: "Deepen Value" },
  { id: "water_wood", family: "generative", from: { channel: "sadness", state: 0 }, lands: { channel: "joy", state: 1 }, name: "Renew Vitality" },
  { id: "water_wood", family: "generative", from: { channel: "sadness", state: 1 }, lands: { channel: "joy", state: 2 }, name: "Renew Vitality" },
  // control — ke channel, raises one stage but never reaches satisfied
  { id: "wood_earth", family: "control", from: { channel: "joy", state: 0 }, lands: { channel: "neutrality", state: 1 }, name: "Consolidate Energy" },
  { id: "wood_earth", family: "control", from: { channel: "joy", state: 1 }, lands: { channel: "neutrality", state: 1 }, name: "Consolidate Energy" },
  { id: "fire_metal", family: "control", from: { channel: "anger", state: 0 }, lands: { channel: "fear", state: 1 }, name: "Temper Action" },
  { id: "fire_metal", family: "control", from: { channel: "anger", state: 1 }, lands: { channel: "fear", state: 1 }, name: "Temper Action" },
  { id: "earth_water", family: "control", from: { channel: "neutrality", state: 0 }, lands: { channel: "sadness", state: 1 }, name: "Reopen Sensitivity" },
  { id: "earth_water", family: "control", from: { channel: "neutrality", state: 1 }, lands: { channel: "sadness", state: 1 }, name: "Reopen Sensitivity" },
  { id: "metal_wood", family: "control", from: { channel: "fear", state: 0 }, lands: { channel: "joy", state: 1 }, name: "Activate Hope" },
  { id: "metal_wood", family: "control", from: { channel: "fear", state: 1 }, lands: { channel: "joy", state: 1 }, name: "Activate Hope" },
  { id: "water_fire", family: "control", from: { channel: "sadness", state: 0 }, lands: { channel: "anger", state: 1 }, name: "Mobilize Grief" },
  { id: "water_fire", family: "control", from: { channel: "sadness", state: 1 }, lands: { channel: "anger", state: 1 }, name: "Mobilize Grief" },
];

function stepsFrom(cell) {
  const s = cell.state;
  const next = Math.min(s + 1, 2); // every move raises at most one satisfaction stage
  return MOVES.filter(m => m.from.channel === cell.channel && m.from.state === s)
    .map(m => ({ family: m.family, lands: m.lands, name: m.name, moveId: m.id }));
}

/** Every lawful way from `from` to `target` channel at satisfaction — ported from route-finder.ts. */
export function routeOptions(from, target, options = {}) {
  const maxLength = options.maxLength ?? 8;
  const goal = { channel: target, state: 2 };
  const goalKey = cellKey(goal);
  const found = new Map();
  const seenDepth = new Map();
  const queue = [{ cell: from, steps: [], depth: 0 }];
  while (queue.length) {
    const { cell, steps, depth } = queue.shift();
    if (depth >= maxLength) continue;
    for (const step of stepsFrom(cell)) {
      const nextSteps = [...steps, step];
      const seqKey = nextSteps.map(s => `${cellKey(s.lands)}:${s.family}`).join(">");
      if (found.has(seqKey)) continue;
      if (cellKey(step.lands) === goalKey) {
        found.set(seqKey, { from, steps: nextSteps, length: nextSteps.length, lands: step.lands });
        continue;
      }
      const prevDepth = seenDepth.get(cellKey(step.lands));
      if (prevDepth !== undefined && prevDepth <= nextSteps.length) continue;
      seenDepth.set(cellKey(step.lands), nextSteps.length);
      queue.push({ cell: step.lands, steps: nextSteps, depth: depth + 1 });
    }
  }
  return [...found.values()].sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    const ai = CHANNEL_ORDER.indexOf(a.steps[0]?.lands.channel ?? "");
    const bi = CHANNEL_ORDER.indexOf(b.steps[0]?.lands.channel ?? "");
    return ai - bi;
  });
}

/** Every satisfaction channel reachable from `from`, with shortest length and route count. */
export function reachableTargets(from, options = {}) {
  const out = [];
  for (const channel of CHANNEL_ORDER) {
    const routes = routeOptions(from, channel, options);
    if (routes.length === 0) continue;
    out.push({ channel, shortest: routes[0].length, routes: routes.length });
  }
  return out;
}

/** True when no lawful road from `from` reaches `target` at satisfied within the cap. */
export function isUnreachable(from, target, options = {}) {
  return routeOptions(from, target, options).length === 0;
}

/** The Wheel as an SVG string. `element` is the lit ember's element; `level` 0,1,2 its state.
    `target` is the channel the player named (tap a lens). `roads` is the set of channel pairs
    whose arrows should glow (from routeOptions results). `card` is a dealCard result to display below. */
export function wheelSvg({ element = null, level = 0, target = null, roads = [], card = null } = {}) {
  const lit = element ? ELEMENT_CHANNEL[element] : null;
  const order = ringOrder(), R = 112, C = 150, r = 30;
  const at = i => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [C + R * Math.cos(a), C + R * Math.sin(a)]; };
  const pos = Object.fromEntries(order.map((c, i) => [c, at(i)]));
  const toward = ([x1, y1], [x2, y2], d) => { const L = Math.hypot(x2 - x1, y2 - y1); return [x1 + ((x2 - x1) / L) * d, y1 + ((y2 - y1) / L) * d]; };
  const arrow = (from, to, cls, glow = false) => {
    const [a, b] = [toward(pos[from], pos[to], r + 4), toward(pos[to], pos[from], r + 8)];
    const g = glow ? ` stroke="${GLOW[EL[to] || EL[from]]}" stroke-width="3" opacity="0.9"` : "";
    return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}"${g} marker-end="url(#wh-${cls})"/>`;
  };
  // Build road set from routeOptions results: each route's steps give (from.channel, to.channel) pairs
  const roadSet = new Set();
  for (const route of roads) {
    let prev = route.from;
    for (const step of route.steps) {
      if (prev) roadSet.add(`${prev.channel}:${step.lands.channel}`);
      prev = step.lands;
    }
  }
  const sheng = order.map(c => arrow(c, CYCLES.sheng[c], "gen", roadSet.has(`${c}:${CYCLES.sheng[c]}`))).join("");
  const ke = order.map(c => arrow(c, CYCLES.ke[c], "ctl", roadSet.has(`${c}:${CYCLES.ke[c]}`))).join("");
  const lens = order.map(c => {
    const [x, y] = pos[c], el = EL[c], on = c === lit, tg = c === target;
    const nx = x >= C ? x + r + 6 : x - r - 15;
    const notches = [0, 1, 2].map(n => `<rect x="${nx.toFixed(1)}" y="${(y + 10 - n * 10).toFixed(1)}" width="9" height="6" rx="1.5" fill="${on && n === level ? GLOW[el] : on && n < level ? FRAME[el] : "#3a2a1c"}" stroke="${BRASS}" stroke-width="0.8"/>`).join("");
    const tap = tg ? ` data-target="${c}"` : "";
    return `<g class="wh-lens${on ? " on" : ""}${tg ? " target" : ""}"${tap} data-lens="${c}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 5}" fill="#2b1e16" stroke="${BRASS}" stroke-width="3"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#wh-g-${el})" opacity="${lit && !on ? 0.45 : 1}"/>
      ${on ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 9}" fill="none" stroke="${GLOW[el]}" stroke-width="2" opacity="0.8"><animate attributeName="opacity" values="0.35;0.9;0.35" dur="2.4s" repeatCount="indefinite"/></circle>` : ""}
      ${notches}
      <text x="${x.toFixed(1)}" y="${(y + r + 20).toFixed(1)}" text-anchor="middle" class="wh-name">${NAME[c]}</text>
      ${on && level === 2 ? `<text x="${x.toFixed(1)}" y="${(y + r + 33).toFixed(1)}" text-anchor="middle" class="wh-sat">${SAT[c]}</text>` : ""}
    </g>`;
  }).join("");
   const grads = Object.keys(FRAME).map(el => `<radialGradient id="wh-g-${el}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${GLOW[el]}"/><stop offset="1" stop-color="${FRAME[el]}"/></radialGradient>`).join("");
   const svg = `<svg viewBox="-14 -8 336 326" role="img" aria-label="The Alchemy Wheel${lit ? `: your ember is in ${NAME[lit]}, ${["dissatisfied", "neutral", "satisfied"][level]}` : ""}${target ? `, reaching for ${NAME[target]}` : ""}">
     <defs>${grads}
       <marker id="wh-gen" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${BRASS_HI}"/></marker>
       <marker id="wh-ctl" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${BRASS}" opacity="0.6"/></marker>
     </defs>
     <style>.gen{stroke:${BRASS_HI};stroke-width:2.2}.ctl{stroke:${BRASS};stroke-width:1;opacity:.55}.wh-name{font:13px Marcellus,Georgia,serif;fill:${INK}}.wh-sat{font:11px Marcellus,Georgia,serif;fill:${BRASS_HI}}.wh-lens{cursor:pointer}.wh-lens.target circle:first-of-type{stroke:${BRASS_HI}}.target{filter:drop-shadow(0 0 8px ${BRASS_HI})}</style>
     <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${BRASS}" stroke-width="10" opacity="0.35"/>
     ${ke}${sheng}${lens}
   </svg>`;
   // The move card is real HTML: it sits BELOW the svg, not inside it (a <div> does not render in SVG).
   const cardHtml = card
     ? `<div class="wh-card" role="status">
          <div class="wh-card-name">${card.name}</div>
          <div class="wh-card-family">${card.family}</div>
          <div class="wh-card-to">reaching ${card.satisfiedName}</div>
        </div>`
     : "";
   return svg + cardHtml;
}

/** Deal the move card for the chosen route: the first step's move, named and family-labelled. */
export function dealCard(fromChannel, fromLevel, targetChannel) {
  const routes = routeOptions({ channel: fromChannel, state: fromLevel }, targetChannel);
  if (routes.length === 0) return null;
  const first = routes[0].steps[0];
  const m = MOVES.find(mv => mv.from.channel === first.lands.channel && mv.from.state === first.lands.state && mv.lands.channel === first.lands.channel && mv.lands.state === first.lands.state);
  return {
    route: routes[0],
    name: first.name,
    family: first.family,
    from: { channel: fromChannel, level: fromLevel },
    to: { channel: targetChannel, level: 2 },
    satisfiedName: SAT[targetChannel],
  };
}

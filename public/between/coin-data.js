/* The coin turn's plain data and rules (spec .specify/specs/ember-to-vibeulon FR-010 to FR-013; mechanic canon/mechanics/coin-turn.yaml
   in Six-faces-council). No three.js here, so a test can read it. The colour and material ids mirror src/lib/economy/coin-face.ts. */
export const COLORS = ["violet", "copper", "jade", "rose", "pearl", "night"];
export const MATS = ["silk", "matte", "brass", "walnut", "resin", "porcelain"];
/* Each colour is two filaments the silk shades between (council vibeulon-choose-1). */
export const FILAMENT = { violet: ["#4a1aa8", "#1d36c8"], copper: ["#7a2e10", "#c8852a"], jade: ["#0c5040", "#2a8f68"], rose: ["#7a1440", "#c24a68"], pearl: ["#8a8ea0", "#d8dae4"], night: ["#151318", "#2a2630"] };
/* The surface each material gives the body (three MeshPhysicalMaterial parameters). */
export const SURFACE = {
  silk: { metalness: 0.45, roughness: 0.3, clearcoat: 0.35 }, matte: { metalness: 0, roughness: 0.85 }, brass: { metalness: 1, roughness: 0.3 },
  walnut: { metalness: 0, roughness: 0.75 }, resin: { metalness: 0, roughness: 0.12, clearcoat: 0.8, transmission: 0.45 }, porcelain: { metalness: 0, roughness: 0.35, clearcoat: 1 },
};
/* The ember's element colours (src/lib/ui/card-tokens.ts ELEMENT_TOKENS). */
export const ELEMENT = { wood: "#2ecc71", fire: "#e8671a", earth: "#d4a017", metal: "#e3e7ec", water: "#2980b9" };
/* The feel numbers, set by canon/mechanics/coin-turn.yaml: a touch turns the coin once in TURN seconds. */
export const TURN = 0.5, BUDGET = 30;
/* The coin's body, millimetres: hex 34.6 corner to corner, 4 thick, a 5.5 hole. */
export const BODY = { corner: 34.6, thick: 4, hole: 5.5 };

export const isColor = v => COLORS.includes(v);
export const isMat = v => MATS.includes(v);
/* A style, or null when it is not a valid pair. */
export const asStyle = s => (s && isColor(s.color) && isMat(s.mat) ? { color: s.color, mat: s.mat } : null);
/* The turn: 0 to 1 over TURN seconds; the new colour comes round at the half turn (t >= 0.5). */
export const turnAt = (elapsed, turn = TURN) => Math.min(1, Math.max(0, elapsed / turn));
export const ease = t => t * t * (3 - 2 * t);
export const swapsAt = t => t >= 0.5;
/* What a touch does to the pick: touching the picked one again changes nothing (any touch can be undone by another). */
export const touch = (pick, kind, id) => (kind === "color" && isColor(id) ? { ...pick, color: id } : kind === "mat" && isMat(id) ? { ...pick, mat: id } : pick);
/* A coin may be set down once both are chosen; a coin with a style already set down asks for nothing (FR-011). */
export const canSetDown = pick => !!(pick && isColor(pick.color) && isMat(pick.mat));
export const firstPick = style => asStyle(style) || { color: "violet", mat: "silk" };

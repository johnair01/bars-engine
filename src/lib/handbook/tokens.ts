/**
 * Handbook design tokens — exact values from the Digital Reader handoff.
 * Mirrors the Oracle feature's `cardLayout.ts` (exported color/type constants).
 * The reader and the print export both read from here ("author once, render twice").
 */

export const COLOR = {
  paper: "#efe7d6",
  paperHi: "#f4eee0",
  chip: "#efe6d2",
  ink: "#211d17",
  body: "#33302a",
  muteInk: "#6a5e44",
  cinnabar: "#a8402e",
  gold: "#c8a35a",
  goldLt: "#e7c98a",
  lacquer: "#0a0d14",
  midnight: "#11162a",
  card: "#0e1320",
  steel: "#8a93a6",
  steelLt: "#aab2c2",
  parchOnDark: "#cdd4dc",
  // House accents
  provisioners: "#8f3b2d",
  weavers: "#a9743f",
  linekeepers: "#a8402e",
  lanternbearers: "#9a7b3f",
  // Element / Nation
  fire: "#c2502e",
  water: "#2b8ca0",
  wood: "#5a9e4f",
  metal: "#9aa4b2",
  earth: "#b0863f",
  pine: "#33463b",
} as const;

export const FONT = {
  display: "'Cormorant Garamond', Georgia, serif", // headings / titles (600)
  body: "'EB Garamond', Georgia, serif", // body copy
  label: "'Marcellus', Georgia, serif", // buttons, move names, plate labels
  hand: "'Caveat', cursive", // signature, asides
  mono: "'Spline Sans Mono', ui-monospace, monospace", // kickers, tags, folios
  seal: "'Ma Shan Zheng', serif", // 護 chop
} as const;

/**
 * MTGOA Design System — Tokens
 *
 * Canonical source: "MTGOA Game — Claude Code Migration Brief" (Design System Tokens).
 * These values are the single source of truth for the game aesthetic. They are
 * consumed by tailwind.config.js (as theme colors) so that components style
 * exclusively through Tailwind classes — never inline styles.
 */

export const colors = {
  // Surfaces (dark-mode game theme)
  bg: "#0d0d1a",
  surf: "#16182e",
  card: "#1c1f38",
  border: "#2e3258",
  accent: "#8b7ff5",
  text: "#f0f0f8",
  dim: "#c8c8e0",
  muted: "#8888aa",

  // Channel colors (Wuxing five elements)
  wood: "#27ae60",
  fire: "#c0392b",
  earth: "#d4a017",
  metal: "#8e8e93",
  water: "#2980b9",

  // Card-type colors
  emotional: "#5ba8e0",
  relational: "#4ec994",
  cognitive: "#b07fe8",
  action: "#e06060",

  // Superpower colors
  Strategist: "#e67e22",
  Connector: "#27ae60",
  Storyteller: "#8e44ad",
  Alchemist: "#2980b9",
  Disruptor: "#c0392b",
  "Escape Artist": "#d4a017",
} as const;

export const typography = {
  cardTitle: { fontSize: "13px", fontWeight: 700, lineHeight: 1.3 },
  cardBody: { fontSize: "12px", lineHeight: 1.6 },
  cardMeta: { fontSize: "10px", fontWeight: 600 },
  label: {
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
  },
  tag: { fontSize: "10px", fontWeight: 600, letterSpacing: "0.8px" },
} as const;

export const spacing = {
  cardPad: "10px 10px",
  cardRadius: "10px",
  sectionGap: "12px",
} as const;

export type ColorToken = keyof typeof colors;

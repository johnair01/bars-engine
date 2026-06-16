import type { Config } from "tailwindcss";
import { colors } from "./design-system/tokens";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: colors.bg,
        surf: colors.surf,
        card: colors.card,
        border: colors.border,
        accent: colors.accent,
        text: colors.text,
        dim: colors.dim,
        muted: colors.muted,
        // Channels (Wuxing)
        wood: colors.wood,
        fire: colors.fire,
        earth: colors.earth,
        metal: colors.metal,
        water: colors.water,
        // Card types
        emotional: colors.emotional,
        relational: colors.relational,
        cognitive: colors.cognitive,
        action: colors.action,
        // Superpowers
        strategist: colors.Strategist,
        connector: colors.Connector,
        storyteller: colors.Storyteller,
        alchemist: colors.Alchemist,
        disruptor: colors.Disruptor,
        "escape-artist": colors["Escape Artist"],
      },
      borderRadius: {
        card: "10px",
      },
      fontSize: {
        "card-title": ["13px", { lineHeight: "1.3", fontWeight: "700" }],
        "card-body": ["12px", { lineHeight: "1.6" }],
        "card-meta": ["10px", { fontWeight: "600" }],
      },
      letterSpacing: {
        label: "0.8px",
      },
    },
  },
  plugins: [],
};

export default config;

# Mastering the Game of Allyship (MTGOA)

A digital card game about increasing the capacity for **mutual satisfaction over
time**. This is the migration of the working Claude.ai artifact (~900-line single
file, stress-tested on the Priya encounter) into a proper project structure.

Stack: **Vite + React 18 + TypeScript + Tailwind CSS** with shadcn/ui-style base
components. Game state is a single `useReducer` state machine. The data layer is
fully separated from the UI; no inline styles (all aesthetic flows through design
tokens → Tailwind).

> Canonical design sources (Google Drive): *MTGOA — Core Architecture*,
> *MTGOA — NPC Test Suite*, *MTGOA — Claude Code Migration Brief*. Those documents
> are the source of truth; this code implements them.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
npm run typecheck  # tsc --noEmit
npm test           # vitest — engine Verification Quest
```

## Project structure

Mirrors the Migration Brief's target architecture (`.js` → `.ts`/`.tsx`, CRA
entry → Vite):

```
mtgoa-game/
  design-system/
    tokens.ts            # colors / typography / spacing (Brief § Design System)
    theme.ts             # element → channel color/class maps
  tailwind.config.ts     # consumes tokens (single source of truth)
  src/
    data/                # DATA LAYER (no UI imports)
      channels.ts        # Wuxing elements + generative cycle
      superpowers.ts     # six player archetypes
      domains.ts         # four domains
      milestones.ts      # milestone pool + Show Up target
      moves.ts           # card primitives + the six canonical counter moves
      npcs.ts            # eight NPCs (Priya fully authored) + Six Faces
    engine/              # PURE GAME ENGINE (no React)
      rules.ts           # tunable constants (canonical vs provisional, flagged)
      bars.ts            # BAR economy
      alchemy.ts         # channel generation, metabolize, exile
      deckBuilder.ts     # starting deck by superpower
      combat.ts          # NPC turn logic, shadow activation, conversion
      gameState.ts       # the useReducer state machine
      __tests__/         # engine smoke test (Verification Quest)
    api/                 # AI integration points (graceful fallback)
      client.ts          # transport + model config (claude-opus-4-8)
      intake.ts          # #1 Applied Mode intake
      npcGenerator.ts    # #2 NPC generation
      resolution.ts      # #3 resolution narrative
    components/          # presentational components (+ ui/ shadcn-style primitives)
    screens/             # ModeSelect / SuperpowerSelect / Encounter / Domain / End
    hooks/useGame.ts     # binds the reducer to React
    App.tsx              # phase → screen router
```

## What's canonical vs. provisional

Everything traceable to the design docs is encoded faithfully and **not** invented:

- **Canonical:** the Wuxing channel system + generative cycle; the four BAR types
  and their functions; the six Superpowers (channels, shadows, synergy bonuses);
  the four Domains; the Six Faces; all eight NPC six-question profiles, milestones,
  and forest seeds; **Priya's complete light/shadow decks** (effects + counters);
  the stress system, contagion deltas, shadow-activation bands, conversion
  threshold (3 of 6), and the Show Up victory target (10). The design-system tokens.

- **Provisional** (clearly flagged in code via `provisional: true` or `PROVISIONAL`
  comments, and never presented as final balance): the full tiered *player* move
  catalog with channel costs/effects (this lived in the artifact, not the docs);
  the exact metabolize/exile channel costs (docs say "matching"/"higher" without
  numbers); and the seven non-Priya NPC decks (generated from channels until
  authored). A couple of loop edge cases (rupture/exhaustion definitions) are
  marked `INTERP` where the docs are thin.

If you have the original ~900-line artifact, dropping its exact player-card
definitions into `src/data/moves.ts` is the cleanest way to replace the
provisional set.

## AI integration

Three Claude API call-sites (Migration Brief § AI Integration Points), all
**optional** and degrading gracefully:

1. **Intake** — Applied Mode six-question conversation → structured game config.
2. **NPC generation** — situation seed → full NPC profile (the 8 NPCs are the cache).
3. **Resolution narrative** — 2–3 sentence emotional payoff after a resolution.

This is a browser SPA, so the Anthropic key must never ship to the client. The
`api/` modules POST to a configurable same-origin backend proxy
(`VITE_AI_ENDPOINT`) that holds the key and calls the Anthropic SDK server-side.
With no endpoint configured, the game runs entirely on canonical data plus
deterministic fallbacks. Default model: `claude-opus-4-8` (swappable in
`api/client.ts`).

## Build order status (Migration Brief)

Done in this pass: design system (1), data-layer extraction (2), reducer state
machine (3), NPC turn AI (4), full NPC roster (6), superpower → encounter → domain
flow (7), end/reflection screen (10/11). Resolution API call (5) is wired with a
fallback. Remaining: Applied Mode intake UI (8), deck/collection viewer (9),
game→real-world bridge text (12), and replacing provisional cards with the
artifact's canonical catalog.

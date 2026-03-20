# Prompt: 321 Suggest Name (Grammar + NPC / Daemon Bridge)

**Use this prompt when implementing or extending 321 Suggest Name.**

## Context

- **Baseline**: Deterministic 6-face name grammar (MTG-style); no AI for default path.
- **Resonance**: Players click Suggest repeatedly — each click uses an **`attempt`** index so names vary (still deterministic per `(charge, mask, attempt)`).
- **NPC teaching**: On **accept** or **edit** of the final name, merge bounded metadata into **`Player` rows with `creatorType: 'agent'`** that match the session’s nation/archetype (and optional keys).
- **Daemons**: Link daemons from 321 to session/name; **Phase 8** — high-level daemons graduate to NPCs (see spec + NSPE).

## Prompt text

> Implement per [.specify/specs/321-suggest-name/tasks.md](../specs/321-suggest-name/tasks.md) in order. Extend `deriveShadowName(charge, mask, attempt?)` and `Shadow321Runner` for multi-suggest. Add schema + server merge for matching NPCs. Deferred: daemon→NPC promotion with thresholds.

## Checklist

- [ ] Phase 5: `attempt` in TS + Python grammar; UI increments attempt per click
- [ ] Phase 6: `Shadow321Session` stores `finalShadowName`, `nameResolution`
- [ ] Phase 7: `Npc321InnerWorkMerge` (or equivalent) + `merge321NameIntoMatchingNpcs`
- [ ] Phase 8: Daemon fields + promotion path (optional second PR)
- [ ] `npm run build`, `npm run check`; backend `make check`

## Reference

- Spec: [.specify/specs/321-suggest-name/spec.md](../specs/321-suggest-name/spec.md)
- Plan: [.specify/specs/321-suggest-name/plan.md](../specs/321-suggest-name/plan.md)
- Tasks: [.specify/specs/321-suggest-name/tasks.md](../specs/321-suggest-name/tasks.md)
- Related: [NPC & Simulated Player Content Ecology](../specs/npc-simulated-player-content-ecology/spec.md), [Shadow Name Library](../specs/shadow-name-library/spec.md)

# Backlog Prompt: Player Main Tabs — Move-Oriented IA (Six-Face Analysis)

## Role

You are a Spec Kit / BARS agent. Complete **Phase 0** of [.specify/specs/player-main-tabs-move-oriented-ia/spec.md](../specs/player-main-tabs-move-oriented-ia/spec.md): fill [`SIX_FACE_ANALYSIS.md`](../specs/player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md) using the **six Game Master faces** (shaman, regent, challenger, architect, diplomat, sage) for **Now** (`/`), **Vault** (`/hand` + `/bars`, `/wallet`, `/daemons`, `/capture`), and **Play** (`/adventures`).

## Objective

Produce an analysis artifact that maps each surface to the **game loop** (charge → metabolize → quest/thread/campaign → visible impact) and yields a **gap → move placement → priority** table. Do **not** implement UI in Phase 0 unless tasks.md is updated.

## Prompt

> Read `src/components/NavBar.tsx` for NOW / VAULT / PLAY routing. For each tab, walk the main `page.tsx` and child routes; then complete `SIX_FACE_ANALYSIS.md` with six subsections per tab. Add a synthesis table (gaps, which of the four moves should own the fix, proposed subpage/affordance, P0/P1/P2). Cross-check [vault-page-experience](../specs/vault-page-experience/spec.md) so Vault nested rooms stay compatible. Optional: call `sage_consult` only for final synthesis after drafts exist.

## Checklist

- [ ] Route inventory (Now, Vault cluster, Play)
- [ ] Six-face sections for each tab (18 subsections total + synthesis)
- [ ] Priority table + P0 recommendation
- [ ] Update `plan.md` if analysis changes phased rollout
- [ ] Check off Phase 0 tasks in `tasks.md` when done

## References

- [.cursor/rules/game-master-agents.mdc](../../.cursor/rules/game-master-agents.mdc)
- [game-loop-bars-quest-thread-campaign](../specs/game-loop-bars-quest-thread-campaign/spec.md)

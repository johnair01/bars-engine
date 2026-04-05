# Spec Kit Prompt: Generated spoke CYOA pipeline (GSCP)

**Use this prompt when implementing the hub-spoke **generated** CYOA journey: opening context + fortune + milestone + fundraising → four-move + charge → six GM faces (cultivation sifu) → **generated** passages → terminal BAR + nursery at terminal → hub.

## Spec kit

- **Spec:** [.specify/specs/generated-spoke-cyoa-pipeline/spec.md](../specs/generated-spoke-cyoa-pipeline/spec.md)
- **Plan:** [.specify/specs/generated-spoke-cyoa-pipeline/plan.md](../specs/generated-spoke-cyoa-pipeline/plan.md)
- **Tasks:** [.specify/specs/generated-spoke-cyoa-pipeline/tasks.md](../specs/generated-spoke-cyoa-pipeline/tasks.md)
- **Backlog ID:** **1.73 GSCP** — [BACKLOG.md](../BACKLOG.md)

## Constraints

- **Game Master faces** (canonical only): **Shaman, Challenger, Regent, Architect, Diplomat, Sage** — see `src/lib/quest-grammar/types.ts`, `.cursorrules`.
- **Validate** generated graphs with **UGA** (`validateFullAdventurePassagesGraph` or documented adapter) before binding to players.
- **Honest** milestone / fundraising — no fabricated progress (BBMT alignment).
- **Vault / compost** when BAR emission would exceed caps (CHS / VPE patterns).

## Prompt text

> Implement **GSCP** per **spec.md**, **plan.md**, and **tasks.md**. Wire **generation** into v1 (not template-only). Terminal node must **emit charge-parameterized achievement BAR**, run **SMB nursery plant** for `(campaignRef, spokeIndex)` with UI at terminal, and **return to hub**. Reuse `AdventurePlayer` / passage APIs where possible; add server actions for generate + validate + persist. Follow fail-fix: `npm run build`, `npm run check` after substantive edits.

## Related specs

- [campaign-hub-spoke-landing-architecture](../specs/campaign-hub-spoke-landing-architecture/spec.md) (CHS)
- [spoke-move-seed-beds](../specs/spoke-move-seed-beds/spec.md) (SMB)
- [unified-cyoa-graph-authoring](../specs/unified-cyoa-graph-authoring/spec.md) (UGA)

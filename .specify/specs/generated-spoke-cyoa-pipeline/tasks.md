# Tasks: Generated spoke CYOA pipeline

## Conventions

- [ ] = pending, [x] = done (update as you ship).
- **GM faces:** only **Shaman, Challenger, Regent, Architect, Diplomat, Sage** (`src/lib/quest-grammar/types.ts`).

---

## T1 — Spec & backlog

- [x] Add **BACKLOG.md** row (**1.73 GSCP**) linking here.
- [x] Add backlog prompt: `.specify/backlog/prompts/generated-spoke-cyoa-pipeline.md`.

---

## T2 — Input/output contracts

- [ ] Define **TypeScript types** for `GeneratedSpokeInputs` and `GeneratedSpokeOutput` (passage nodes + terminal action ids).
- [ ] Map **four moves** to existing enums (`IntakeMoveType` / quest grammar — align names).
- [ ] Document **BAR emit** fields: `campaignRef`, `spokeIndex`, `moveType`, `gmFace`, `chargeExcerpt` / full charge handling.

---

## T3 — Opening beat (FR1)

- [ ] Reuse or compose **milestone** UI from BBMT on the **first** screen of the generated flow or **merge** landing + first generator screen (product choice).
- [ ] Wire **fundraising** block from `Instance` (same honesty as hub/event pages).
- [ ] Display **fortune** (hexagram + spoke) from existing hub state / query params.

---

## T4 — Move + charge (FR2)

- [ ] UI: four-move selection **before** or **as first interactive** step of generated content.
- [ ] Integrate **charge capture** (short path); persist to **generator input** and **BAR parameterization**.

---

## T5 — Face picker + signature copy (FR3)

- [ ] UI: six-face grid or list with **signature move** one-liner + **signature BAR** framing per face (content JSON or markdown in repo).
- [ ] Pass **face** into generator and **BAR** emit action.

---

## T6 — Generator + validation (FR4)

- [ ] Implement **generateSpokeCyoa** (server action or internal module): calls model with **structured output**.
- [ ] **Validate** output with UGA validator; on failure, **retry once** with repair prompt or fall back to **safe stub** graph (documented).
- [ ] Persist validated graph → **Adventure** + **Passage** rows OR session-scoped store (per plan decision).

---

## T7 — Terminal: BAR + nursery + return (FR5)

- [ ] Terminal passage triggers **achievement BAR** with **charge-parameterized** title/body (length limits, PII policy).
- [ ] **Same flow** calls **nursery plant** for `(campaignRef, spokeIndex)` — UI at terminal (confirm SMB action used).
- [ ] **Hub return** link/button; clear **PlayerAdventureProgress** or mark run **completed** to avoid resume bugs.

---

## T8 — Vault / compost (FR6)

- [ ] Before BAR emit, check vault caps; show **compost modal** if blocked (reuse VPE patterns).

---

## T9 — QA

- [ ] Manual script: hub → spoke 0/1 → full path → verify BAR metadata + kernel + hub.
- [ ] Add **cert** or **npm run test:** slice if stable.

---

## T10 — Docs

- [ ] Link from `docs/BRUISED_BANANA_PROGRESS.md` or campaign runbook if BB-scoped.
- [ ] Update **registry** / route annotations if new routes.

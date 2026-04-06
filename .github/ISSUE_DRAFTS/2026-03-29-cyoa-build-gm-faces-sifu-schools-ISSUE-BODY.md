## Summary

Players should assemble a **CYOA** from typed inputs: **emotional vector** (ideally from daily check-in, with a **gate** if missing), **four-move spine** (Wake Up / Clean Up / Grow Up / Show Up), **Game Master face**, optional **face move**, **narrative template** (Epiphany Bridge, Kotter, roller coaster — third path must be implemented or explicitly mapped), and **campaign context** (type, phase / Kotter-style state, gather resources, etc.). Much exists in parallel pipelines; this issue tracks **one ontology**, **one build contract**, and **wiring** hub/spoke and APIs to it.

**Cultivation Sifu** are the **voices** offered in **`/shadow/321`** — **derived from** the six **canonical** Game Master faces (not a seventh category). Vibe: **Pokémon gym leaders**. Future **schools**: **per nation**, a **distinct roster of Sifu**, each tied to **element** and **emotion**, expressing **developmental levels** in that nation’s fiction — with **multiple NPCs** able to map to the **same** `GameMasterFace` at different tiers. Mechanical key stays **`GameMasterFace`**; Sifu/NPC are **instances**.

**Mid-spoke CYOA persistence (product decision):** **Option B — Checkpoint + revalidate.** Persist passage/progress, but on resume **re-run branch eligibility** from the **current** emotional-alchemy snapshot so visible choices stay honest when the player’s state changed.

---

## How we execute this issue: WAVE (delivery framework)

We use the same **four-move spine** as our **internal process** for research → alignment → depth → ship. **Show Up** means **implementation against a written spec**, not open-ended coding.

### Wake Up — research phase

**Intent:** Know the territory before we build. What do we need to learn, and **what knowledge must live in the repo** (specs, diagrams, ADRs, typed contracts) so this issue — or a future feature request — can be solved without rediscovering context?

**Outcomes to capture:**

- **Inventory:** CYOA entry points (hub/spoke, Twine, 321, APIs), where template strings and faces live today.
- **Gaps:** What is duplicated, unnamed, or inconsistent between pipelines?
- **Repo artifacts:** Checklist of docs/types/routes that must exist for implementers (e.g. single `CyoaBuild` shape, template registry location, hub state merge rules).
- **Exit:** Research notes or **Wake Up** section in the spec — enough that **Clean Up** can name the *real* problem.

### Clean Up — emotional vector & throughput (the “true” issue)

**Intent:** Name **where players are** emotionally and **where they want to be**. Tie this work to **emotional alchemy** and the **WAVE move** this issue is **solving for**, so we optimize for **emotional throughput** — not only data plumbing.

**Outcomes:**

- Explicit **current → desired** emotional framing for the player journey this contract enables.
- Which **alchemy / four-move** beat this issue unlocks (e.g. clarity at threshold, unblock, integrate).
- Design choices (check-in gate, revalidation on resume) justified in **throughput** terms, not only technical terms.

### Grow Up — six faces, Integral levels, Kotter maturity

**Intent:** Problems must be addressed at **all relevant developmental levels** or **conflict shows up at the level that was left out**. The **six Game Master faces** map to **Integral / Spiral** levels (see `.agent/context/game-master-sects.md`). **Kotter** gives **campaign / change** maturity: how does this work **advance the project** through its **Kotter-model goals** (urgency, coalition, vision, etc.) and **phase state**?

**Outcomes:**

- **Face coverage:** For each major design decision, which face’s “job” is served (e.g. Regent = phase/rules, Architect = templates/compile, Diplomat = weave to collective)?
- **Kotter link:** How the unified CYOA build + campaign snapshot supports **staged change** and **gather-resources** context without orphaning narrative.
- **Sage / masking:** Where counsel or `effectiveFace` vs `portraysFace` applies so we don’t split the ontology.

### Show Up — implementation

**Intent:** **There / when / steps** — concrete execution against the spec: APIs, persistence, hub consumer, tests, fail-fix. No scope drift; PRs trace to **Grow Up** decisions and **Acceptance criteria** below.

---

## Canonical vocabulary (non-negotiable)

The only Game Master **face** identifiers are: **Shaman, Challenger, Regent, Architect, Diplomat, Sage** (`GameMasterFace` in `src/lib/quest-grammar/types.ts`; see `.agent/context/game-master-sects.md`). Do not introduce alternate “face” enums in APIs.

---

## Goals

1. **Single CYOA build contract (DTO + persistence)** — emotional vector ref or snapshot; move spine; `gameMasterFace`; optional `gmFaceMoveId` per `.specify/specs/game-master-face-moves/spec.md`; narrative `templateId` from a **central registry**; campaign snapshot (phase, domain, gather resources, etc.).

2. **Narrative template registry** — one source of truth for Epiphany Bridge, Kotter, roller coaster (implement third grammar or document mapping). No orphaned template strings across DB, Twine, and API.

3. **NPC / Sifu ↔ face alignment** — any voice that functions as a GM for a beat resolves to **`portraysFace: GameMasterFace`**. Display names (including **Cultivation Sifu** and nation-specific gym leaders) are **presentation**; routing, grammar, and face moves use the **enum**.

4. **321 / Cultivation Sifu** — choices in `/shadow/321` resolve to **face** (+ optional `sifuId` when roster exists). Sifu are **face-derived**, not a parallel ontology.

5. **Schools & nations (spec + future implementation)** — spec: nation → roster of Sifu → `portraysFace` + element, emotion, tier; many NPCs → one face. Full gameplay loop may be follow-up issues.

6. **Hub/spoke handoff** — entering a spoke merges `Instance.campaignHubState` (and related) with the CYOA build payload so landing, alchemy, and quest generation do not use stale defaults. Align with `.specify/specs/campaign-hub-spoke-landing-architecture/spec.md`.

7. **Mid-spoke persistence** — implement **Option B** per hub spec (checkpoint + revalidate on resume from current alchemy).

---

## Non-goals

- Replacing all Twine content in one PR.
- Adding Game Master faces beyond the canonical six.
- Implementing full schools feature in the first slice unless explicitly scoped.

---

## References

- `.agent/context/game-master-sects.md`
- `src/lib/quest-grammar/types.ts` — `GameMasterFace`, `FACE_META`
- `.specify/specs/game-master-face-moves/spec.md`
- `.specify/specs/campaign-hub-spoke-landing-architecture/spec.md`
- `.agent/context/emotional-alchemy-interfaces.md` — WAVE paths, moves ↔ throughput
- Draft / history: `.github/ISSUE_DRAFTS/2026-03-29-cyoa-build-gm-faces-sifu-schools.md`

---

## Acceptance criteria

- [ ] Spec under `.specify/specs/` covering: `CyoaBuild` (or agreed name), template registry, `portraysFace`, Sifu/nation model, and **Option B** persistence behavior for spokes.
- [ ] **WAVE sections** reflected in spec: Wake (research/repo knowledge), Clean (throughput / alchemy move), Grow (faces + Kotter maturity), Show (implementation checklist).
- [ ] APIs / DB use `GameMasterFace` (or documented migration from legacy strings).
- [ ] 321 /shadow documented as resolving to face (+ optional Sifu id).
- [ ] Child tasks or linked issues for: API routes, Prisma if needed, hub spoke consumer, roller coaster resolution.

---

## Open questions

- **Roller coaster:** implement as third grammar branch vs map to existing curve — pick one and document.
- **Nation schema:** where element, emotion, and nation bind (existing models vs new tables) — list in spec.
- **Sifu tiers:** linear badges vs parallel Sifu per domain within a nation.
- **Sage masking:** runtime `effectiveFace` vs `portraysFace` documented for NPCs that channel another face.

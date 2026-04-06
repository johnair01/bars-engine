# [DRAFT] CYOA build contract, GM faces, Cultivation Sifu, schools & hub/spoke alignment

**Status:** **GitHub:** [issue #36](https://github.com/johnair01/bars-engine/issues/36) — body maintained in **`2026-03-29-cyoa-build-gm-faces-sifu-schools-ISSUE-BODY.md`** (includes **WAVE delivery framework**). Re-sync with `gh issue edit 36 --body-file …ISSUE-BODY.md`.

**Status (legacy):** Older content below may lag; prefer **ISSUE-BODY** for the full text.

**Product decisions locked in this doc**

- **Mid-spoke CYOA persistence:** **Option B — Checkpoint + revalidate.** Persist passage/progress, but on resume **re-run branch eligibility** from the **current** emotional-alchemy snapshot so visible choices stay honest when the player’s state changed. (Not session-only A; not “resume only if entry snapshot matches” C.)

---

## Title (for GitHub)

**CYOA build contract, narrative template registry, GM faces ↔ NPC/Sifu, schools/nations — hub/spoke alignment**

## Labels (suggested)

`spec`, `quest-grammar`, `campaign`, `cyoa`, `backlog` — adjust to repo conventions.

---

## Summary

Players should assemble a **CYOA** from typed inputs: **emotional vector** (ideally from daily check-in, with a **gate** if missing), **four-move spine** (Wake Up / Clean Up / Grow Up / Show Up), **Game Master face**, optional **face move**, **narrative template** (Epiphany Bridge, Kotter, roller coaster — third path must be implemented or explicitly mapped), and **campaign context** (type, phase / Kotter-style state, gather resources, etc.). Much exists in parallel pipelines; this issue tracks **one ontology**, **one build contract**, and **wiring** hub/spoke and APIs to it.

**Cultivation Sifu** are the **voices** offered in **`/shadow/321`** — **derived from** the six **canonical** Game Master faces (not a seventh category). Vibe: **Pokémon gym leaders**. Future **schools**: **per nation**, a **distinct roster of Sifu**, each tied to **element** and **emotion**, expressing **developmental levels** in that nation’s fiction — with **multiple NPCs** able to map to the **same** `GameMasterFace` at different tiers. Mechanical key stays **`GameMasterFace`**; Sifu/NPC are **instances**.

**Persistence:** Team chooses **Option B** for spoke CYOA — save progress, **revalidate** choices on resume against current alchemy (see hub/spoke spec tension).

---

## Canonical vocabulary (non-negotiable)

The only Game Master **face** identifiers are: **Shaman, Challenger, Regent, Architect, Diplomat, Sage** (`GameMasterFace` in `src/lib/quest-grammar/types.ts`; see `.agent/context/game-master-sects.md`). Do not introduce alternate “face” enums in APIs.

---

## Goals

1. **Single CYOA build contract (DTO + persistence)**  
   Composed from: emotional vector ref or snapshot; move spine; `gameMasterFace`; optional `gmFaceMoveId` per [game-master-face-moves](.specify/specs/game-master-face-moves/spec.md); narrative `templateId` from a **central registry**; campaign snapshot (phase, domain, gather resources, etc.).

2. **Narrative template registry**  
   One source of truth for Epiphany Bridge, Kotter, roller coaster (implement third grammar or document mapping). No orphaned template strings across DB, Twine, and API.

3. **NPC / Sifu ↔ face alignment**  
   Any voice that functions as a GM for a beat resolves to **`portraysFace: GameMasterFace`**. Display names (including **Cultivation Sifu** and nation-specific gym leaders) are **presentation**; routing, grammar, and face moves use the **enum**.

4. **321 / Cultivation Sifu**  
   Document and implement: choices in `/shadow/321` resolve to **face** (+ optional `sifuId` when roster exists). Sifu are **face-derived**, not parallel ontology.

5. **Schools & nations (spec + future implementation)**  
   Spec: nation → roster of Sifu → `portraysFace` + element, emotion, tier; many NPCs → one face. Full gameplay loop may be follow-up issues.

6. **Hub/spoke handoff**  
   Entering a spoke **merges** `Instance.campaignHubState` (and related) with the CYOA build payload so landing, alchemy, and quest generation do not use stale defaults. Align with [campaign-hub-spoke-landing-architecture](.specify/specs/campaign-hub-spoke-landing-architecture/spec.md).

7. **Mid-spoke persistence (decided)**  
   **Option B:** checkpoint + **revalidate** on resume from current alchemy snapshot (not A session-only; not C tolerance-lock unless later scoped).

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
- Prior draft context: `.github/ISSUE_DRAFTS/` (this file)

---

## Acceptance criteria

- [ ] Spec under `.specify/specs/` covering: `CyoaBuild` (or agreed name), template registry, `portraysFace`, Sifu/nation model, and **Option B** persistence behavior for spokes.
- [ ] APIs / DB use `GameMasterFace` (or documented migration from legacy strings).
- [ ] 321 /shadow documented as resolving to face (+ optional Sifu id).
- [ ] Child tasks or linked issues for: API routes, Prisma if needed, hub spoke consumer, roller coaster resolution.

---

## Open questions (remaining)

- **Roller coaster:** implement as third grammar branch vs map to existing curve — pick one and document.
- **Nation schema:** where element, emotion, and nation bind (existing models vs new tables) — list in spec.
- **Sifu tiers:** linear badges vs parallel Sifu per domain within a nation.
- **Sage masking:** runtime `effectiveFace` vs `portraysFace` documented for NPCs that channel another face.

---

## Create the GitHub issue from the CLI (local)

Install [GitHub CLI](https://cli.github.com/), `gh auth login`, then from repo root:

```bash
gh issue create \
  --title "CYOA build contract, narrative template registry, GM faces ↔ NPC/Sifu, schools/nations — hub/spoke alignment" \
  --body-file .github/ISSUE_DRAFTS/2026-03-29-cyoa-build-gm-faces-sifu-schools-ISSUE-BODY.md
```

**Issue body only (for paste or `gh`):** `2026-03-29-cyoa-build-gm-faces-sifu-schools-ISSUE-BODY.md` — use this file with `--body-file` so the issue does not include draft metadata.

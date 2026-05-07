---
type: spec
title: "Integral design — 321 / Vault / bars-engine bridge"
created: 2026-05-07
last_reviewed: 2026-05-07
tags:
  - integral-design
  - bars-engine
  - obsidian
  - 321
  - testing
aliases:
  - integral-design-321-vault-bridge
---

# Integral design — 321 / Vault / bars-engine bridge

**Purpose:** Run a single integral design pass on the agreed priority (notebook and game hold hands), lock an implementation plan with **test gates**, and link to the **live Cursor canvas** artifact used during execution.

**Practice:** Outcome before mechanism; contract before UI; deterministic tests before shipping; six-face pass before scope creep.

---

## Live artifact (Cursor Canvas)

Open beside chat (persists gate checklist in a sidecar next to the canvas source):

`~/.cursor/projects/Users-wendellbritt-The-Library/canvases/321-vault-bridge-integral-design.canvas.tsx`

In Cursor: open that file from the project’s **canvases** folder so the canvas compiles. Click rows on **Gate checklist** to cycle pending → in progress → completed.

---

## Related vault and engine sources

- [[KEYTERM-SHADOW-PROCESS]] — shadow practice context
- [[07 Book OS/07 Book OS/SPEC_321_BARS_ENGINE_BRIDGE]] — approved light bridge (URL seed + Obsidian `SHADOW_SEEDS` path)
- [[tap-the-vein-pipeline-gap-analysis]] — full arc Tap the Vein → 321 → artifact (daemon section Phase 2)
- [[metabolize-learnings-obsidian-sync-spec]] — vault write paths and sync behavior
- [[KEYTERM-LEARNING-LOOP]] — where design sessions feed the loop
- bars-engine (separate repo): `.specify/specs/321-bar-draft-experience/spec.md` (**BDE**), `.specify/specs/321-shadow-process/spec.md`, `.specify/backlog/BACKLOG.md` rows **BDE**, **CFB**, **COG**

---

## 1. Cast statement (outcome language)

> After shadow work, a person can land their truth in the game **without** feeling like they filed taxes, and can **change their mind** before anything is final.

If a design proposal cannot trace to this sentence, defer it.

---

## 2. AQAL snapshot (this slice)

| Quadrant | “Good” | Engineering / test |
|----------|--------|---------------------|
| UL — interior-individual | Safety, dignity, no shame from UI | Short composed BAR body; full 321 as collapsible source (BDE); `/privacy` path per `specs/backlog.md` when in scope |
| UR — exterior-individual | URLs, files, saves work | `?seed=` round-trip + max length; optional `SHADOW_SEEDS` parse; `createCustomBar` / draft flow |
| LL — interior-collective | Shared vocabulary with vault | Golden tests on `deriveBarDraftFrom321`; later EA keyterm sync from `wuxing.ts` (separate track) |
| LR — exterior-collective | Deployable, observable | No `process.cwd()` for user content roots; cert/blob path if touching feedback |

---

## 3. Six-face pass → test anchor

| Face | Question | Test anchor |
|------|----------|-------------|
| Regent | What is v1? | Ship order: Phase 0–2 before full Obsidian ingestion if schedule tight |
| Architect | What is the stable contract? | Golden fixtures for draft derivation; documented `BarDraftFrom321` fields |
| Sage | What are we teaching? | Copy review: title not required above fold; domain required in quick path |
| Shaman | Does momentum survive? | E2E + manual ritual: back from create-BAR without losing artifact step |
| Challenger | Where does this lie? | Oversize `seed`, hostile decode, markdown edge cases in `SHADOW_SEEDS` |
| Witness | What falsifies “shipped well”? | Example: “Users still paste from Apple Notes” → add telemetry or interview prompt |

---

## 4. Phased plan with test gates

| Phase | Deliverable | Gate (must pass before next) |
|-------|-------------|------------------------------|
| **0** | `deriveBarDraftFrom321` (or v2 of derive) per BDE: short `body`, `systemTitle`, `bodySource`, curated `tags`, `moveType` | **100%** golden fixture tests (3–5 fixtures: minimal, long text, unicode, missing domain) |
| **1** | URL seed: read `?seed=` / `from=zo`, bounded payload | Unit tests: encode/decode, max length, error UX; smoke: land on `/shadow/321` with draft visible |
| **2** | BDE quick path UI + **reversible dispatch** (BDE P5) | Playwright (or existing E2E): happy path + back + documented refresh/logout behavior |
| **3** | `SHADOW_SEEDS` inbox: env `SHADOW_SEEDS_ROOT`, parse `.md` | Parser tests on fixture files; when env unset, feature off without 500 |
| **4** | Backlog hygiene | `npm run sage:backlog-assess` + `compost:backlog`; reconcile CHS / EIP / PMEL status rows |

**MVP stop line:** Phases **0–2**. Phase **3** when full text capture beats URL limits in production.

---

## 5. First week sketch

| Day | Focus | Done when |
|-----|--------|-----------|
| 1 | Fixtures + derive + tests | Phase 0 gate green |
| 2 | Query param read + sanitize + tests | Phase 1 gate green |
| 3–4 | Quick create UI + reversible state | Phase 2 gate green |
| 5 | E2E + ritual QA note in `01 Daily Notes/LOGS/` | Demo-ready |

---

## 6. Session prompts (integral practice)

Use between coding blocks:

1. **Polarity:** Name one tension (e.g. speed vs sacredness). What are we explicitly *not* optimizing this week?
2. **Mechanism check:** Rewrite any sentence that contains “URL” or “Blob” into the **outcome sentence** above.
3. **Challenger-only veto:** One scope item to kill or defer.
4. **Witness falsifier:** What observation would prove we were wrong about the design?

---

## Revision

Update `last_reviewed` when the canvas gate checklist reaches “Phase 2” complete or when bridge spec changes.

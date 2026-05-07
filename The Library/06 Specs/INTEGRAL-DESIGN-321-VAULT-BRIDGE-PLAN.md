---
type: spec
title: "Integral design — 321 / Vault / bars-engine bridge"
created: 2026-05-07
last_reviewed: 2026-05-07
ouroboros_pass: 2026-05-07
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

`~/.cursor/projects/<your-workspace-slug>/canvases/321-vault-bridge-integral-design.canvas.tsx`

Example slug on one machine: `Users-wendellbritt-The-Library`. In Cursor: open that file from the project **canvases** folder so the canvas compiles. Click rows on **Gate checklist** to cycle pending → in progress → completed.

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
| **1** | URL seed: read `?seed=` / `from=zo`, bounded payload — **producer encodes, consumer validates** (Zo or client builds; bars-engine decodes + caps + sanitizes) | Unit tests: encode/decode, max length, error UX; hostile string fixtures; smoke: land on `/shadow/321` with draft visible |
| **2** | BDE quick path UI + **reversible dispatch** (BDE P5) | Playwright **or** scripted ritual QA + Witness log: happy path + back + documented refresh / logout / new tab / private mode |
| **3** | `SHADOW_SEEDS` inbox: env `SHADOW_SEEDS_ROOT`, parse `.md` | Parser tests on fixture files; when env unset, feature off without 500; **gate:** Obsidian sync path verified for devices you actually use (or scope ingestion to ops desktop explicitly) |
| **4** | Backlog hygiene | `npm run sage:backlog-assess` + `compost:backlog`; reconcile CHS / EIP / PMEL status rows |

**MVP stop line:** Phases **0–2**. Phase **3** when full text capture beats URL limits **and** the file-sync path is real for the operator (not “Obsidian exists somewhere”).

---

## 5. First week sketch

| Day | Focus | Done when |
|-----|--------|-----------|
| 1 | Fixtures + derive + tests | Phase 0 gate green |
| 2 | Query param read + sanitize + tests | Phase 1 gate green |
| 3 | Quick create UI (primary body, domain required, advanced gating) | Core quick path renders; validation tests |
| 4 | Reversible dispatch + session edge cases | Back returns to artifact grid; matrix doc for refresh / logout / new tab |
| 5 | E2E **or** ritual QA note in `01 Daily Notes/LOGS/` (Witness) — prefer E2E when harness exists | Demo-ready; log falsifiers if telemetry not built yet |

---

## 6. Session prompts (integral practice)

Use between coding blocks:

1. **Polarity:** Name one tension (e.g. speed vs sacredness). What are we explicitly *not* optimizing this week?
2. **Mechanism check:** Rewrite any sentence that contains “URL” or “Blob” into the **outcome sentence** above.
3. **Challenger-only veto:** One scope item to kill or defer.
4. **Witness falsifier:** What observation would prove we were wrong about the design?

---

## 7. Ouroboros interview (Socratic pass)

**Method:** Same loop spirit as bars-engine Ouroboros — *Interview → clarify assumptions → fold back into spec* (see `bars-engine/CLAUDE.md` Ouroboros section: ambiguity down, ontological precision). This pass was run **in chat** against this document; conclusions are merged into sections above and captured below.

### 7.1 Question log

| # | Question | Answer |
|---|----------|--------|
| Q1 | Who is “v1” for first? | **Stewards / you** ship first; copy and tests still target a **naive player** so we do not ship “works on my machine” language. |
| Q2 | Can any 321 text become a BAR **without** an explicit “yes”? | **No (INV-1).** URL or file content is **draft only** until the player submits create-BAR (or named terminal action). |
| Q3 | Who owns URL encoding? | **Producer encodes, consumer validates (INV-2).** Zo (or other client) builds a bounded `seed`; bars-engine decodes, enforces max size, sanitizes for display/storage. |
| Q4 | What if Obsidian is on one device and the game on another? | **Phase 3 is not automatic.** MVP is Phases **0–2**. Ship `SHADOW_SEEDS` only when the **sync path is true** for real devices, or scope ingestion to **ops desktop** explicitly. |
| Q5 | What silent failures are missing from the plan? | sessionStorage / private mode / logout / new tab / double-submit — Phase 2 gate must name **expected loss** vs **bug**. |
| Q6 | Is Playwright mandatory for Phase 2? | **No.** Gate = Playwright **or** scripted **ritual QA** + written Witness log until harness lands; preference order documented. |
| Q7 | Is telemetry required for the Witness falsifier? | **No.** A short user interview or session transcript counts for MVP evidence. |
| Q8 | Machine-specific canvas path? | Vault path is canonical; canvas path is **replace `<your-workspace-slug>`** per machine. |

### 7.2 Invariants

1. **INV-1** — No durable BAR row from bridge input without **explicit** player submit.
2. **INV-2** — Treat `seed` and parsed markdown as **untrusted** until validated and sanitized for UI.
3. **INV-3** — `SHADOW_SEEDS_ROOT` (or any user-content root) **must not** silently resolve to `process.cwd()` or other accidental relative paths.

### 7.3 Risk register

| Risk | Mitigation |
|------|------------|
| Cross-device Obsidian / game split | Defer Phase 3 or narrow to ops-only ingestion; MVP 0–2 |
| Injection via `seed` or markdown | Sanitize + fixture tests with hostile payloads |
| `BarDraftFrom321` drift from BDE spec | Golden fixtures live in repo next to derive; vault links commit or file path |

### 7.4 Definition of done (tight)

| Phase | Done means |
|-------|------------|
| **0** | All golden fixtures green in CI; contract type matches BDE spec (or documented delta filed in bars-engine backlog). |
| **1** | Decode + cap + sanitize covered by tests; manual smoke: open URL with seed → draft visible, no console errors. |
| **2** | Quick path matches BDE P2–P4; reversible dispatch matches BDE P5 **or** documented exceptions; ritual QA or E2E complete. |
| **3** | Parser fixtures green; env unset returns safe no-op; **plus** device/sync statement signed off in one line in this vault note. |

---

## Revision

Update `last_reviewed` when the canvas gate checklist reaches “Phase 2” complete, when `ouroboros_pass` is run again, or when [[07 Book OS/07 Book OS/SPEC_321_BARS_ENGINE_BRIDGE]] changes materially.

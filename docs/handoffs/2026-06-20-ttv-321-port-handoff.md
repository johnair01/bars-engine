# Handoff: Tap the Vein + 321 → bars-engine Port

**Date:** 2026-06-20
**From:** This chat
**To:** Claude Code (or any future agent picking this up)
**Spec:** `docs/plans/2026-06-20-tap-the-vein-321-port-to-bars-engine-spec.md`

---

## What you are building

A full port of the Tap the Vein (TTV) daily free-write practice and the 321 Shadow process from zo.computer (zo.space) into bars-engine. zo.space routes stay live for the user's personal practice. bars-engine gets a new product surface that serves its own users.

## What the user has already decided

All decisions are captured in §1 of the spec. Read that first. The seven load-bearing ones:

1. **Full port, no bridge.** New data lives in bars-engine Prisma tables. zo.space stays up.
2. **Drop the 321 manuscript flow.** Manuscript editing is personal; users don't get it.
3. **TTV → BAR is the new primary flow.** Player dumps free-write, gets 3–5 BAR candidates, picks which to save, optional free-write provenance attached.
4. **Provenance = Shape 1.** `TtvEntry` is a separate row + table. `Bar.ttvEntryId` is an optional FK.
5. **LLM pass = Mix.** 1–2 extracts + 2–3 forks per call. Total 3–5 candidates.
6. **750-word minimum for daily-practice TTV.** Lower floor for ad-hoc BAR creation.
7. **$5/day LLM budget hard cap.** SMS alert at $4. This is bars-engine's own ledger and quota policy, separate from the Council's quota tooling.

## What you are NOT building (deferred)

- LLM provider selection (research memo required first)
- Custom-model fine-tuning pipeline
- Migration of any data from zo.space or the vault
- The 321 manuscript flow
- Morning pages lineage UI (separate design thread)

## Phased build order

**Phase 1 (must ship first):**
- Prisma migration: `TtvEntry`, `Deck`, `DeckCard`, `Bar.ttvEntryId` FK
- Seed: import `The Library/The Library/03 BARs/321-deck/core-deck.json` into new tables (verify path with `ls` first)
- `/api/tap-the-vein/entry` (POST, GET)
- `/api/tap-the-vein/distill` (LLM + deterministic fallback + budget guard)
- `/api/tap-the-vein/review` (multi-select save with optional provenance)
- `/bars/tap-the-vein` and `/bars/tap-the-vein/review` pages
- Cost guard: `runtime/bars_llm_ledger.jsonl`, `runtime/BARS_LLM_QUOTA.md`, `scripts/bars-llm-quota.sh`
- Deterministic fallback unit tests
- Mock LLM provider tests
- End-to-end smoke test

**Phase 2 (after Phase 1 ships):**
- 321 session API + page
- 321 deck draw API + page
- 6-face GM distill helper
- Per-move phrase extractor

**Phase 3 (research, separate from build):**
- LLM provider research memo
- Custom-model fine-tuning thread

## Files

Full list in spec §6. Highlights:
- 4 new page routes, ~8 new API routes
- 3 new Prisma models, 1 FK added
- 1 new cost-guard subsystem (3 files)
- 1 new prompt module
- 1 new deterministic-fallback module + tests

## Verification

Per workspace `AGENTS.md` Verification Gate:
- L1: route integrity (curl 200, no errors)
- L2: API contract (valid payload → 200; invalid → 400; budget → 429)
- L3: round-trip (TtvEntry row, distill result, Bar row with FK all present)
- L4: manual browser walk-through

**Critical test:** the budget guard must trigger fallback in CI without spending real money. Set `BARS_LLM_QUOTA_DAILY_USD=0.01` in the test env, fire 3 calls, verify the 2nd returns 429 and the 3rd (fallback path) succeeds.

## Open questions (some of these I don't have answers to yet)

1. LLM provider pick — Phase 1 ships behind `LLM_PROVIDER` env var defaulting to `"mock"`.
2. Deck seed file path — verify with `ls "The Library/The Library/03 BARs/321-deck/"` before starting the seed.
3. `Bar.ttvEntryId` is hard FK with `onDelete: SetNull` in this spec. If a non-TTV BAR ever needs to attach a free-write, we'd need a soft pointer instead. Phase 1 ships hard FK.
4. The 6-face GM distill shape — reuses the `gm-casting-ritual` skill pattern. Phase 2 will resolve the actual shape.

## What not to do

- Do not modify any zo.space route. They stay live.
- Do not modify the Council's `model_ledger.jsonl`, `MODEL_QUOTA.md`, or `check_model_quota.sh`. bars-engine has its own.
- Do not touch any manuscript file.
- Do not migrate data from `The Library/03 BARs/321/`. That data is the user's personal practice; it stays where it is.
- Do not skip the deterministic fallback tests. They are the floor; without them the LLM provider is a single point of failure.

## How to start

1. Read the spec end-to-end. **All 10 sections.** Especially §1 (decisions) and §5 (phases).
2. Create a branch in bars-engine.
3. Start with the Prisma migration. Schema is in spec §3.3.
4. Build the deterministic fallback first, with tests. It is the simpler path and exercises the data flow.
5. Wire the LLM call second, behind `LLM_PROVIDER=mock` for now.
6. Wire the cost guard third. This is the load-bearing piece for the budget.
7. Build the pages last. Server first, then UI.

## When in doubt

Stop and ask the user. They have opinions. Don't guess; don't pad; don't re-design.

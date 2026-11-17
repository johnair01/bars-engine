# Implementation Plan: One BAR, one farm journey

**Branch**: `codex/bar-farm-loop` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

## Summary

Join the BAR send-to-farm, parcel/satchel, five-move farm path, and optional crop work around one source BAR identity. First prove the data contract across the open PRs. Then integrate the smallest end-to-end path, followed by phone-width visual verification. Keep this integration in its own branch; do not rewrite the authors' open branches.

## Technical Context

**Language/Version**: TypeScript, Next.js app; plain JavaScript farm view  
**Primary Dependencies**: existing BAR, Between farm, and founder-gate modules in PRs #732, #823, #802  
**Storage**: existing `BetweenPrivate` farm and seeds documents; exact canonical write owner to be determined from source  
**Testing**: Vitest for transition/race behavior; local-first server and browser walkthrough  
**Target Platform**: web, including phone width  
**Project Type**: web app integration  
**Constraints**: preserve the ruled five-move mapping and ownership; no false real-act record  
**Scale/Scope**: one BAR and one player path first, plus retries, concurrent take, legacy/plain seeds

## Research and integration order

1. Read the actual heads of #732, #823 and #802 and record the shape of each seed, every write owner, and the dependency graph in [research.md](research.md). PR descriptions alone are insufficient proof.
2. Run the cheapest local walkthrough against a temporary integration stack. Record the first failing transition before changing code.
3. Decide one canonical seed identity and state projection. Preserve #732's spec/PR lifecycle status separately from farm location/path. Treat parcel, satchel and plot as locations of one item.
4. Integrate in dependency order: send → parcel/take → ruled pickup/open/clear → plant/tend/harvest → crop metadata and source links. Keep each stage demonstrable.
5. Verify retries and two-tab races in local-first test data, then capture phone-width states. Ask the Board only for a genuinely unresolved product choice, with a concrete example and image.

## Project Structure

```text
.specify/specs/bar-farm-journey/  spec, plan, research, tasks, walkthrough record
src/lib/bar-to-work/               BAR seed identity and lifecycle
src/lib/between/                   farm transitions and crop data
src/app/api/bars/[id]/send-to-farm/ send entry point
src/app/api/between/farm/           farm reads and writes
public/between/farm/               player-facing farm
```

## Council contract (plan)

primitives: One player-authored thing persists across places; five farm verbs carry the five moves ruled in `farm-seed-item`.
footing: `ffm-look-1` answered A; `farm-world-write-look-3` pending; no new ruling for the integration join.
tier: Footed; an integration of already authorized parts; basis `ffm-look-1` and the open PRs. Escalate a new player-facing choice.
scout: Repo source and local-first walkthrough, before building.
skills: pending Council face pass; no skill is claimed as run in this draft.

## Constitution check

| Article | Verdict | Why |
|---|---|
| 1 Questions go to the board | pass | Unresolved compost, watering or act-verification choices will get concrete Board rows. |
| 2 The player comes first | pass | One understandable seed journey and next action are acceptance criteria. |
| 3 Primitives and footing | pass | Reuses BAR, seed, parcel and farm; preserves `ffm-look-1`. |
| 4 Ontology invariants | pending | Council face review must test the complete object mapping. |
| 5 Cheapest proof first | pass | Source trace and local walkthrough precede new implementation. |
| 6 Tool before build | pass | Existing APIs and routes are reused. |
| 7 Something to see | pending | Phone-width look required before ready. |
| 8 Reserved items | pass | No manuscript copy or reserved assets are changed in the spec. |
| 9 One session, one piece | pass | This branch owns the joins; source PRs retain their own changes. |
| 10 Transcend and include | pass | Existing seed states and plain seeds must continue working. |

## Signed

No Council stage is represented as signed yet.

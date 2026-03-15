# Sage Backlog Assessment

**Date**: Sunday, March 15, 2026

## App Direction (Summary)

BARs Engine: quests as kernels, vibeulons, emotional alchemy, Bruised Banana campaign, Game Master faces, 4 moves (Wake/Clean/Grow/Show), allyship domains. Version management for quests; campaign deck = backlog.

## Compost (Archive / Deprecate)

Items that no longer align with current direction or have been fully superseded:


**Recommendation**: Move superseded items to an `ARCHIVED.md` or remove from main table. Keep a short reference for traceability.

## Merge (Consolidate)

Candidates for consolidation:

- **Avatar cluster** (AVS, AW, AX, AY, BG, BH, BJ): Avatar System Strategy (AVS) bundles these. Mark superseded items as folded into AVS.
- **Transformation pipeline** (ED, EE, EF, EG, EZ, EH, EI, FK, FL, FO, FN): Narrative Transformation Engine and downstream. Consider a single "Transformation Pipeline v0" meta-spec.
- **Campaign/RACI cluster** (GA, GB, GC, GH, GJ, GK): BAR Response, Quest Stewardship, Event Campaign, Campaign Playbook, Campaign Invitation. Share RACI/role resolution. Merge into phased "Campaign Engine" spec.
- **Onboarding quest generation** (DJ, DK): Already sequenced. DK cert depends on DJ. Keep as-is.

## Develop (Prioritize for Next Phase)

High-leverage items aligned with app direction:

1. **AVS** — Avatar System Strategy (deps met). Unifies avatar work.
2. **AZ** — Book-to-Quest Library. PDF ingestion, Quest Library, Grow Up. No deps.
3. **EJ** — Admin Agent Forge. 3-2-1 Forge, distortion gate, vibeulon routing. No deps.
4. **EM** — CYOA Certification Quests. Quality gate for onboarding.
5. **DL** — Campaign Map Phase 1. Extends gameboard; Layer 1–3.
6. **DQ/DT** — Flow Simulator CLI. Bruised Banana fixtures; simulation harness.

## Watch Out

- Done/Superseded items live in [ARCHIVE.md](.specify/backlog/ARCHIVE.md). Main backlog shows only actionable work (~45 Ready). Run `npm run compost:backlog` to re-compost after marking items Done.
- Some Ready items have unmet deps; verify before starting.

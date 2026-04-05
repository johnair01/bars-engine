# Backlog Audit: Most Impactful to Implement or Spec

**Date**: 2025-03-06  
**Scope**: All Ready items in BACKLOG.md; items needing specs; certification feedback gaps

---

## Executive Summary

**~50 Ready items** remain. This audit ranks them by impact (user-facing, launch-blocking, certification, infra robustness) and identifies **3 items needing specs** before implementation.

**Top 5 to implement now**: BJ (Avatar Overwrite), DU (Prisma P6009), AW (Avatar Visibility), DW (Quest Library Wave Routing), AZ (Book-to-Quest Library).

**Top 3 to spec first**: Y (Bruised Banana House Instance), k-space doc link mismatch, Charge Capture UX (GD) if not yet scoped.

---

## Tier 1: High Impact — Implement Soon

| ID | Item | Why High Impact | Deps |
|----|------|-----------------|-----|
| **0.9 BJ** | [Avatar Overwrite, Transparency, and Size Fix](.specify/specs/avatar-overwrite-transparency-fix/spec.md) | Emergent: nation/archetype overwrite breaks avatar display; ChatGPT prompts for sprite generation | BB |
| **0.57 DU** | [Prisma P6009 Response Size Fix](.specify/specs/prisma-p6009-response-size-fix/spec.md) | listBooks over-fetches extractedText; can cause production errors on large books | AZ |
| **37 AW** | [Avatar Visibility + Cert Report Issue](.specify/specs/avatar-visibility-and-cert-report-issue/spec.md) | Cert feedback: avatar not visible in report; blocks certification flow | AV |
| **40.12 DW** | [Quest Library Wave Routing](.specify/specs/quest-library-wave-routing/spec.md) | Routes book quests by moveType (EFA, Dojo, Discovery, Gameboard); auto-assign on approve | AZ, BN |
| **40 AZ** | [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md) | Core Grow Up path; PDF ingestion; many sub-fixes done; main flow may need polish | — |

---

## Tier 2: Bruised Banana / Launch — Spec or Implement

| ID | Item | Why | Gap |
|----|------|-----|-----|
| **21 Y** | Bruised Banana House Instance | House coordination blocker; instance, recurring quests, house state | **No spec** — ANALYSIS.md exists; need formal spec |
| **0.47 DJ** | [Onboarding Quest Generation Unblock](.specify/specs/onboarding-quest-generation-unblock/spec.md) | Admin-side quest gen in onboarding; I Ching step, feedback, skeleton | Has spec |
| **0.48 DK** | [Cert Onboarding Quest Generation Unblock](.specify/specs/cert-onboarding-quest-generation-unblock/spec.md) | Verification quest for DJ | Has spec |
| **0.49 DL** | [Campaign Map Phase 1](.specify/specs/campaign-map-phase-1/spec.md) | Gameboard UI: Phase Header, Domain Regions, Field Activity | Has spec |

---

## Tier 3: Avatar Chain — Fix Display & Quality

| ID | Item | Deps |
|----|------|-----|
| 38 AX | [Avatar Click-to-Enlarge + Admin Sprite Viewer](.specify/specs/avatar-enlarge-and-admin-sprite-view/spec.md) | AW |
| 39 AY | [Avatar Sprite Quality Process](.specify/specs/avatar-sprite-quality-process/spec.md) | AU |
| 42 BG | [Avatar Gallery Preview and Sprite Stacking Fix](.specify/specs/avatar-gallery-preview-and-stacking/spec.md) | BB |
| 43 BH | [Avatar Stacking Fix and Base-Only Preview](.specify/specs/avatar-stacking-base-preview/spec.md) | BB |

---

## Tier 4: Charge / 321 / Felt Experience — High User Value

| ID | Item | Why |
|----|------|-----|
| **1.12 GD** | [Charge Capture UX + Micro-Interaction v0](.specify/specs/charge-capture-ux-micro-interaction/spec.md) | "Felt charge → BAR in <10s"; 3–5 taps; core charge flow |
| **1.14 GF** | [Singleplayer Charge Metabolism](.specify/specs/singleplayer-charge-metabolism/spec.md) | 321 → quest/bar/fuel; friction subquest; tetris key-unlock |
| **0.71 EJ** | [Admin Agent Forge](.specify/specs/admin-agent-forge/spec.md) | Admin 3-2-1 Forge; distortion gate; friction mint |

---

## Tier 5: Campaign / Event / Invitation

| ID | Item | Why |
|----|------|-----|
| 1.15 GG | [Custom Portal Onboarding Flow v0](.specify/specs/custom-portal-onboarding/spec.md) | Invite token → 5-scene questionnaire → createCampaignPlayer |
| 1.18 GJ | [Campaign Playbook System v0](.specify/specs/campaign-playbook-system/spec.md) | Living strategy doc per campaign; Kotter; export; deck |
| 1.19 GK | [Campaign Invitation System v0](.specify/specs/campaign-invitation-system/spec.md) | Invite actors with roles; RACI; send/accept/decline |

---

## Tier 6: Transformation / Narrative Engine (Longer Horizon)

| ID | Item | Chain |
|----|------|-------|
| 0.65 ED | Narrative Transformation Engine v0 | CM, BY |
| 0.66 EE | Transformation Move Library v1 | ED |
| 0.67 EF | Nation Move Profiles v0 | EE |
| 0.68 EG | Archetype Move Styles v0 | EE |
| 0.98 FK | Transformation Move Registry v0 | ED, EE |
| 0.99 FL | Transformation Encounter Geometry v0 | FK |
| 1.00 FM | BAR → Quest Generation Engine v0 | BY, DM |

---

## Items Needing Specs (Create Before Implement)

| Item | Current State | Action |
|------|---------------|--------|
| **Y — Bruised Banana House Instance** | Backlog entry only; ANALYSIS.md in bruised-banana-house-integration | Create `.specify/specs/bruised-banana-house-instance/spec.md` from ANALYSIS.md |
| **k-space-librarian-quest STEP_3** | "Doc link mismatch: links to any doc regardless of question" — separate spec | Create `k-space-doc-link-fix` spec |
| **0.40 DC — Branched Path Orientation** | Phase 1 done; Phase 2 scope unclear | Review spec; add Phase 2 tasks if needed |

---

## Certification Feedback — Open Items

| Source | Issue | Spec |
|--------|-------|------|
| k-space-librarian-quest STEP_3 | Doc link mismatch | Create spec |
| cert-twine-authoring-ir-v1 STEP_4 | In-editor preview; filter; template support | [cert-twine-authoring-preview-filter-template](.specify/specs/cert-twine-authoring-preview-filter-template/spec.md) |
| cert-admin-onboarding-flow-api-v1 STEP_2 | Convergence node naming | [cert-admin-onboarding-convergence-node-naming](.specify/specs/cert-admin-onboarding-convergence-node-naming/spec.md) — EA done; verify if same |

---

## Recommended Order

### This Sprint (Quick Wins)
1. **BJ** — Avatar Overwrite (emergent, fixes display)
2. **DU** — Prisma P6009 (infra robustness)
3. **AW** — Avatar Visibility (cert)

### Next Sprint (Feature Completion)
4. **DW** — Quest Library Wave Routing
5. **Y** — Create spec first, then implement Phase 1 (instance + basic house state)

### Medium Term
6. **GD** — Charge Capture UX
7. **DJ/DK** — Onboarding Quest Generation
8. **DL** — Campaign Map Phase 1

---

## Reference

- [BACKLOG.md](BACKLOG.md)
- [bruised-banana-house-integration/ANALYSIS.md](../specs/bruised-banana-house-integration/ANALYSIS.md)
- [BACKLOG_AUDIT_DEFTNESS_API_FIRST.md](BACKLOG_AUDIT_DEFTNESS_API_FIRST.md)

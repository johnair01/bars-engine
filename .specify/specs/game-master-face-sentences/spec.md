# Spec: Game Master Face Sentences

## Purpose

Define one sentence per game master face (Shaman, Challenger, Regent, Architect, Diplomat, Sage) that sends players into the CYOA story at that particular altitude.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. The choices are structurally the same but translated for the appropriate face; quests output are connected to that developmental level.

**Extends**: [Campaign Onboarding Feature Merge](../campaign-onboarding-feature-merge/spec.md), [2-Minute Ride Story Bridge](../two-minute-ride-story-bridge/spec.md)

**Strategic context**: [Unified Onboarding Campaign Plan](.cursor/plans/unified_onboarding_campaign_12029a4e.plan.md)

## Conceptual Model (Game Language)

- **Faces** = 6 game master faces (altitude/interpretive lens) — Shaman, Challenger, Regent, Architect, Diplomat, Sage
- **Immediate user needs** = Understanding / Connecting / Acting (developmental lens; maps to move + domain)
- **Face sentence** = One sentence that frames the entry into the CYOA at that altitude; anchors: residency, Wendell's technology, journey beginning

## User Story

**As a player**, when I choose a game master face at Center_ChooseLens (or equivalent), I want a sentence that invites me into the Bruised Banana story at that altitude — so the same choices (Understanding/Connecting/Acting, nations, playbooks, domains) feel translated for my interpretive lens, and my post-signup quests align with that developmental level.

**Acceptance**:
1. Each face has a canonical sentence displayed when the player selects that face.
2. The sentence sends the player into the CYOA at that altitude (residency + Wendell's technology framed per face).
3. Subsequent CYOA copy (BB_Intro, BB_Developmental_Q1, etc.) can be translated per face via templates.
4. Quest assignment uses face completion flags (`completed_shaman`, etc.) to assign face-aligned quests.

## Face Sentences (Canonical)

| Face | Color | Sentence |
|------|-------|----------|
| **Shaman** | Magenta | "Enter through the mythic threshold: the residency as ritual space, Wendell's technology as a bridge between worlds. Your journey begins in belonging." |
| **Challenger** | Red | "Enter through the edge: the residency as a proving ground, Wendell's technology as a lever. Your journey begins in action." |
| **Regent** | Amber | "Enter through the order: the residency as a house with roles and rules, Wendell's technology as a tool for the collective. Your journey begins in structure." |
| **Architect** | Orange | "Enter through the blueprint: the residency as a project to build, Wendell's technology as an advantage. Your journey begins in strategy." |
| **Diplomat** | Green | "Enter through the weave: the residency as a relational field, Wendell's technology as a connector. Your journey begins in care." |
| **Sage** | Teal | "Enter through the whole: the residency as one expression of emergence, Wendell's technology as part of the flow. Your journey begins in integration." |

## Functional Requirements

- **FR1**: Each face choice at Center_ChooseLens (or BB-integrated equivalent) MUST display or lead to its canonical face sentence before the player continues into the CYOA.
- **FR2**: When a player selects a face, the system MUST set `$active_face` (or equivalent campaign state) so subsequent nodes can resolve face-specific copy.
- **FR3**: Face-specific copy MAY use template syntax (e.g. `{{faceCopy.intro}}`) resolved against `$active_face`. Same graph, translated text per face.
- **FR4**: Quest assignment MUST use face completion flags (`completed_shaman`, `completed_challenger`, etc. in storyProgress) to assign face-aligned quests when available.
- **FR5**: Face sentences MUST be stored in a single source of truth (e.g. seed data, config, or Passage content) so they can be edited without code changes.

## Non-Functional Requirements

- Face sentences are content, not logic; editable by admins or content authors.
- No breaking changes to existing Center_ChooseLens or Path_*_Start flows when face sentences are added.
- Verification quest step: Confirm face sentence (or face choice) appears in flow when 6 Faces are integrated into BB.

## Out of Scope (v1)

- Full translation of all BB nodes per face (Phase 2 of unified onboarding)
- Localization of face sentences to other languages

## Reference

- Wake-up Center_ChooseLens: [content/campaigns/wake_up/Center_ChooseLens.json](../../content/campaigns/wake_up/Center_ChooseLens.json)
- Path_*_Start (sets $active_face): [content/campaigns/wake_up/Path_Sh_Start.json](../../content/campaigns/wake_up/Path_Sh_Start.json), etc.
- Campaign API: [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Unified plan: [.cursor/plans/unified_onboarding_campaign_12029a4e.plan.md](../../.cursor/plans/unified_onboarding_campaign_12029a4e.plan.md) (Cursor plan)

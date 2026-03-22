# Spec: BAR → Quest Generation Engine v0

## Purpose

Convert BARs (player inspiration artifacts) into structured, reviewable quest opportunities. The engine turns intention, insight, and field signals into actionable quests inside the campaign without requiring admins to hand-author every quest.

## Core Design Principles

1. BARs are inspiration artifacts, not quests.
2. Quest generation is structured, not improvisational.
3. Emotional alchemy logic is resolved canonically (grammar service), not hardcoded.
4. Generated quests are reviewable by admins in v0.
5. Generation is phase-aware and campaign-aware.
6. Output is metabolizable—publishable into the runtime system.

## Pipeline Stages

1. **Intake** — BAR creation event or explicit generation request
2. **Eligibility Check** — Validate BAR meets minimum requirements
3. **Interpretation** — Convert BAR into structured quest-generation proposal
4. **Emotional Alchemy Resolution** — Call canonical grammar service
5. **Quest Proposal Construction** — Generate structured proposal object
6. **Admin Review** — Approve, reject, edit, or defer
7. **Publication** — Publish approved quests to campaign and optionally Twine IR

## BAR Eligibility

A BAR is eligible when:

- `status` = active
- `title` and `content` (description) present
- `allyshipDomain` or `intended_impact_domain` present
- Not already converted to quest (unless repeat allowed)
- Campaign phase allows new quest intake

## Quest Types (v0)

| Type | Description |
|------|-------------|
| resource | Funding, donation, patron, practical support |
| coordination | Collaboration, organizing action |
| awareness | Public signal, invitation, storytelling |
| action | Concrete task or gameplay move |
| reflection | Meaning-making, interpretive move |

## API Endpoints

- `POST /bars/:bar_id/generate-quest-proposal` — Generate proposal from BAR
- `GET /quest-proposals?status=pending` — List pending proposals
- `POST /quest-proposals/:proposal_id/review` — Approve/reject/defer/edit
- `POST /quest-proposals/:proposal_id/publish` — Publish to campaign

## Emotional Alchemy Integration

- `POST /emotional-alchemy/resolve-move` (or equivalent canonical service)
- Request: player_id, campaign_id, source_context_tags, desired_outcome_tags, player_context
- Response: move_id, move_name, player_facing_copy, admin_metadata
- On failure: proposal created with `emotional_alchemy.status = unresolved`; admin can still approve

## Dependencies

- [Transformation Move Registry](../transformation-move-registry/spec.md)
- [Quest Grammar](../quest-grammar-compiler/spec.md)
- [Starter Quest Generator](../starter-quest-generator/spec.md)
- Emotional Alchemy / First Aid tooling

## Campaign phase (T4.1)

When a BAR has `campaignRef`, the engine resolves **`Instance.kotterStage`** (1–8) by matching `Instance.slug` or `Instance.campaignRef`. Personal BARs (no ref) use stage **1**. Stage **1** maps to the stable key **`phase_1_opening_momentum`** (Kotter “Urgency” / opening momentum). Emotional move resolution uses `resolveMoveForContext` with `campaignPhase` = Kotter stage so later stages rotate among domain-preferred moves. Proposal JSON stores `kotterStage` and `campaignPhaseKey` under the emotional-alchemy blob for admin review.

## Non-Goals (v0)

- Full autonomous publication without admin review
- BAR clustering across players
- Multi-BAR quest synthesis
- Automatic `.twee` round-trip import
- Reputation-weighted interpretation

## Reference

- Architecture: [docs/architecture/bar-quest-generation-engine.md](../../../docs/architecture/bar-quest-generation-engine.md)

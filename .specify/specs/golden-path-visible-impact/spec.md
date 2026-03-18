# Spec: Golden Path Visible Impact

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Architect + Sage priority 5.

## Purpose

Show what changed in the campaign when a quest is completed: who benefited, what progress was made, what opened next. Currently completion shows vibeulon reward only; no campaign impact display.

**Practice**: Deftness Development — extend completion flow, API-first.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Storage | New `CampaignProgressEvent` or extend completion response with impact text |
| Source | Template-based for v0: "Your action helped X" / "2 setup helpers confirmed" — from quest metadata or instance config |
| Display | Show on completion modal or post-completion card |
| Trigger | When completeQuest succeeds; append impact to response |

## API Contracts

### completeQuest (extend existing)

**New output**: `{ ..., campaignImpact?: string, nextQuestId?: string }`

- After marking complete: generate or fetch campaignImpact text
- Optionally suggest nextQuestId from thread
- Return in response for UI to display

## Functional Requirements

### FR1: Campaign impact text

- Add template or config: "Your action contributed to {{ campaignName }}. {{ impactPhrase }}."
- impactPhrase from quest metadata, instance config, or default: "Progress recorded."
- For v0: deterministic template; no AI

### FR2: completeQuest extension

- Extend `completeQuest` in `src/actions/quest-engine.ts` to return campaignImpact
- Include nextQuestId if thread has next quest

### FR3: Completion UI

- On quest completion: show campaign impact card below vibeulon reward
- "What changed: {{ campaignImpact }}"
- If nextQuestId: show "Suggested next: [quest title]" link

## Out of Scope (v0)

- Per-quest custom impact (admin-editable)
- Campaign progress analytics

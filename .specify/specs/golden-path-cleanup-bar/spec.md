# Spec: Golden Path Cleanup → BAR + Next Action

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Shaman priority 4.

## Purpose

Make EFA and 321 produce a BAR draft and "next smallest honest action" when player applies cleanup to questing. Currently EFA produces vibeulons only; 321 can create BAR but not a clear next-action bridge.

**Practice**: Deftness Development — extend existing flows, deterministic fallbacks.

## Design Decisions

| Topic | Decision |
|-------|----------|
| EFA | When `applyToQuesting` true: create BAR draft (CustomBar with status draft or metadata) and extract/suggest next_action |
| 321 | When output is quest-related: produce BAR draft + next_action in metadata |
| Next action | Store in BAR metadata as `nextAction?: string` or in NextActionBridge (see golden-path-next-action-bridge) |
| BAR draft | Create CustomBar with `sourceType: 'cleanup'` or metadata; link to questId |

## API Contracts

### completeEmotionalFirstAidSession (extend existing)

**New output when applyToQuesting**: `{ barDraft?: { id, nextAction? }, ... }`

- If applyToQuesting: create BAR from session summary; extract or prompt for next_action
- Return barDraft in response

### createQuestFrom321Metadata / persist321Session (extend)

**New**: When 321 produces BAR or quest, include `nextAction` in metadata.

- Add nextAction to BAR metadata when creating from 321
- Template or simple extraction: "What is the next smallest honest action?" — player can edit

## Functional Requirements

### FR1: EFA → BAR draft

- Extend `completeEmotionalFirstAidSession` in `src/actions/emotional-first-aid.ts`
- When applyToQuesting: create CustomBar from session (stuckBefore, stuckAfter, relief) with moveType or metadata indicating cleanup source
- Add optional `nextAction` field to BAR metadata (JSON or new column)
- Return barDraft in response for UI to show "Your next smallest honest action: X"

### FR2: 321 → BAR + next action

- Extend 321 flow to populate nextAction when creating BAR from shadow belief
- Add "next smallest honest action" prompt or template in 321 output step
- Persist nextAction in BAR metadata

### FR3: UI bridge

- After EFA/321: show "Suggested next action: {{ nextAction }}" with option to apply to quest (links to next-action-bridge)

## Out of Scope (v0)

- AI extraction of next_action from free text
- Full NextActionBridge UI (separate spec)

# Spec: Golden Path Next Action Bridge

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Architect + Shaman priority 3.

## Purpose

Link a BAR to a quest as "next smallest honest action." BAR is created but not attached to quest. Add NextActionBridge (questId, barId, nextAction) or equivalent so the micro-action is visible on the quest.

**Practice**: Deftness Development — API-first, extend schema.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Model | New `NextActionBridge` table: id, questId, barId, nextAction (text), createdAt |
| Or | Add to CustomBar: `linkedQuestId String?`, `nextActionText String?` — simpler |
| API | `linkBarToQuestAsNextAction(barId, questId, nextAction)` server action |
| UI | On quest detail: show "Your next action: X" when bridge exists; allow set from BAR |

## API Contracts

### linkBarToQuestAsNextAction (Server Action)

**Input**: `barId: string`, `questId: string`, `nextAction: string`  
**Output**: `Promise<{ success: true } | { error: string }>`

- Create NextActionBridge or update CustomBar
- One bridge per quest (replace if exists)
- Revalidate path

### getNextActionForQuest (data fetch)

**Input**: `questId: string`  
**Output**: `{ barId, nextAction } | null`

## Functional Requirements

### FR1: Schema

- Option A: New model `NextActionBridge { id, questId, barId, nextAction, createdAt }`
- Option B: Add to CustomBar `linkedQuestId String?`, `nextActionText String?`
- Run `npm run db:sync`

### FR2: linkBarToQuestAsNextAction Server Action

- Create in `src/actions/quest-engine.ts` or new file
- Validate bar and quest exist; player has access

### FR3: Quest Detail UI

- Fetch and display "Your next action: {{ nextAction }}" when bridge exists
- Add "Set next action" from BAR (when BAR has nextAction from cleanup)

## Out of Scope (v0)

- Multiple next actions per quest
- AI suggestion of next action

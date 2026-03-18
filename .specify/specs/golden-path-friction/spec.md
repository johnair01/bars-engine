# Spec: Golden Path Friction

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Shaman + Challenger priority 6, 9.

## Purpose

Store friction_type when player says "I'm stuck"; normalize friction as expected, not failure; surface "I'm stuck" more prominently. Currently QuestDetailModal has collapsed "Feeling stuck?" with EFA link; no friction_type stored.

**Practice**: Deftness Development — API-first, deterministic.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Friction types | confusion, fear, overwhelm, avoidance, other |
| Storage | Add `frictionType String?`, `frictionRecordedAt DateTime?` to PlayerQuest |
| API | `recordQuestFriction(questId, frictionType)` server action |
| UI | Surface "I'm stuck" more prominently — expand by default or primary placement |

## API Contracts

### recordQuestFriction (Server Action)

**Input**: `questId: string`, `frictionType: 'confusion' | 'fear' | 'overwhelm' | 'avoidance' | 'other'`  
**Output**: `Promise<{ success: true } | { error: string }>`

- Find PlayerQuest for current player + questId
- Set frictionType, frictionRecordedAt = now
- Revalidate path

## Functional Requirements

### FR1: Schema

- Add to PlayerQuest: `frictionType String?`, `frictionRecordedAt DateTime?`
- Run `npm run db:sync`

### FR2: recordQuestFriction Server Action

- Create in `src/actions/quest-engine.ts` or new `src/actions/friction.ts`
- Validate frictionType enum

### FR3: QuestDetailModal — Friction prominence

- Move "Feeling stuck?" / "I'm stuck" to more prominent placement (e.g. above fold, not collapsed)
- Add friction type selector (confusion, fear, overwhelm, avoidance, other) when recording
- Call recordQuestFriction on selection
- Normalize copy: "Friction is part of play. What kind of stuck?" or similar

## Out of Scope (v0)

- AI-driven friction detection
- Friction analytics dashboard

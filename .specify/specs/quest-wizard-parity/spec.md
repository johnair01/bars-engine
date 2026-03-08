# Spec: Quest Wizard Parity

## Purpose

Align the manual Quest Wizard with the automatic (quest grammar) flow so manually created quests achieve the same quality and metadata as grammatically generated ones. Require move + domain, add scope/reward/success criteria, and optional BAR type on completion.

**Practice**: Deftness Development — API-first, deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Move + Domain | Required for non-gameboard quests. Gameboard can inherit from parent (optional in wizard). |
| Scope | Personal (self), Personal (assign), Collective. Maps to visibility (private/public). |
| Reward | Configurable 1–5 vibeulons. |
| Success criteria | Dedicated field; appended to description as "**Success looks like:** ..." |
| BAR on completion | Optional: None, Insight BAR, Vibe BAR. Stored in completionEffects; quest-engine spawns BAR on completion. |

## API Contracts

### createQuestFromWizard (extended)

**Input**: `{ title, description, successCriteria?, category, visibility, reward, moveType, allyshipDomain, barTypeOnCompletion?, ... }`

**Output**: `{ success: true, questId, visibility, warning? } | { error: string }`

- Validates `moveType` and `allyshipDomain` when not gameboard.
- Appends `successCriteria` to description.
- Stores `barTypeOnCompletion` in completionEffects when 'insight' or 'vibe'.

### processCompletionEffects (quest-engine, extended)

- Parses `barTypeOnCompletion` from completionEffects JSON.
- When 'insight' or 'vibe', creates CustomBar for completer with type from barTypeOnCompletion.

## Functional Requirements

### FR1: Move + Domain required

- Non-gameboard: moveType and allyshipDomain required in step 1; validate before publish.
- Gameboard: optional in step 3 (inherit from parent).

### FR2: Scope selector

- Personal (self): private, creator completes.
- Personal (assign): private, assign to another (future: player picker).
- Collective: public, anyone can claim; costs 1 vibeulon.

### FR3: Configurable reward

- Reward input 1–5; default 1. Clamped in createQuestFromWizard.

### FR4: Success criteria

- "What does success look like?" textarea in step 2.
- Appended to description as "**Success looks like:** {text}".

### FR5: BAR type on completion

- Optional: None, Insight BAR, Vibe BAR.
- Stored in completionEffects. Quest-engine spawns BAR for completer on completion.

## Verification Quest

- **ID**: `cert-quest-wizard-parity-v1`
- **Steps**: Create quest with move, domain, scope, reward, success criteria; verify CustomBar has moveType, allyshipDomain; complete quest with barTypeOnCompletion; verify BAR created.

## References

- [src/components/quest-creation/QuestWizard.tsx](../../src/components/quest-creation/QuestWizard.tsx)
- [src/actions/create-bar.ts](../../src/actions/create-bar.ts)
- [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts)

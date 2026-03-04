# Spec: Quest Grammar Allyship Unpacking (Certification Feedback)

## Purpose

Redesign the Quest Grammar unpacking form for the allyship campaign context. Certification feedback (cert-quest-grammar-v1 STEP_1, 2026-03-03) requested: predefined experience options, simplified life-state choices, multi-select reservations, move-based aligned action, and quest-type output per move.

## Root cause

- Current UnpackingForm uses open-ended questions (Q1–Q6) with dropdowns for feelings. Feedback requests **allyship-specific** options: experience types (Gather Resource, Skillful Organizing, Raise Awareness, Direct Action), life states (Flowing, Stalled, Neutral), and aligned action as one of the 4 basic moves (Wake Up, Clean Up, Grow Up, Show Up).
- Reservations should support **multiple selections** plus short text for context.
- Each move selection should produce a quest of that particular type.

## Feedback source

> "What experience are you trying to create" since we know this is an allyship campaign We can essentially have people choose from the various options
>
> Gather Resource, Skillful Organizing, Raise Awareness, Direct Action
>
> Whats life like right now? Flowing, Stalled, Neutral. How far do you feel from your creation?
>
> reservations should be multiple options. You can choose multiple reservations. And give more context with a short test field
>
> aligned action will be one of the 4 basic moves. wake Up, Clean Up, Grow Up, Show Up.
>
> Each of these will produce a quest of that particular type

## User story

**As a Campaign Owner** (or admin), I want the Quest Grammar unpacking form to use allyship-specific options (experience types, life states, move-based aligned action) with multi-select reservations, so the generated quests align with the 4-move framework and produce the right quest type per move.

## Functional requirements

- **FR1**: Experience question MUST offer dropdown: Gather Resource, Skillful Organizing, Raise Awareness, Direct Action (allyship campaign options).
- **FR2**: "What's life like right now?" MUST offer dropdown: Flowing, Stalled, Neutral, plus a short text field: "How far do you feel from your creation?"
- **FR3**: Reservations MUST support multi-select (multiple options) plus a short text field for additional context.
- **FR4**: Aligned action MUST be a dropdown: Wake Up, Clean Up, Grow Up, Show Up (4 basic moves).
- **FR5**: Each move selection MUST produce a quest of that particular type (quest type maps to move).
- **FR6**: Preserve mobile-first, CYOA-style, and emotional-tone design from quest-grammar-cert-feedback.

## Non-functional requirements

- May require new `UnpackingAnswers` shape or a variant type for allyship mode.
- `compileQuest` (or a variant) must accept the new input and map move → quest type.
- Coexist with or supersede the current 6-question model; clarify whether this is a new mode or replacement.

## Reference

- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl) (2026-03-03 01:03)
- Quest: cert-quest-grammar-v1, passage: STEP_1
- Related: [quest-grammar-cert-feedback](../quest-grammar-cert-feedback/spec.md), [quest-grammar-compiler](../quest-grammar-compiler/spec.md), [campaign-kotter-domains](../campaign-kotter-domains/spec.md) (4 moves)
- UnpackingForm: [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx)
- compileQuest: [src/lib/quest-grammar/compileQuest.ts](../../src/lib/quest-grammar/compileQuest.ts)

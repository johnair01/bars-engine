# Spec: Quest Grammar Cert Feedback (Certification Feedback)

## Purpose

Address feedback reported during cert-quest-grammar-v1 STEP_1: (1) Report Issue page reverts to dashboard after 4–5 seconds; (2) Unpacking form needs mix of dropdowns + short responses, mobile-first, choose-your-own-adventure model with emotional tone; (3) Generated nodes are nonsensical—need AI-assisted generation, fractal node subsections, admin edit layer, and deterministic structure that produces correct BARs and quests.

## Root cause

- **Report Issue redirect**: Same class as cert-feedback-stability / cert-existing-players-v1-feedback—FEEDBACK passage or revalidation triggers navigate-away. May affect cert quest modal flow.
- **Form UX**: Current UnpackingForm uses all textareas; feedback requests dropdowns for some questions and short-response fields. Admin tool should follow mobile-first, CYOA, and emotional-tone design.
- **Node quality**: Heuristic-based compileQuest produces templated output that reads as "nonsense"; needs AI prompt to transform user input into coherent story. Fractal subsections, admin edit, and deterministic BAR/quest output are enhancements.

## User story

**As a Campaign Owner** (or tester), I want the Quest Grammar unpacking flow to stay stable when reporting issues, use a mix of dropdowns and short responses with mobile-first CYOA feel, and produce grammatical nodes that I can edit before publishing, so the oneshot campaign flow is usable and the output makes sense.

## Functional requirements (deft, API-focused)

### FR1: Report Issue stability (API contract)

- **Contract**: `logCertificationFeedback` MUST NOT call `revalidatePath` or `router.refresh()`. Callers (TwineQuestModal, PassageRenderer) MUST pass `skipRevalidate: true` to `advanceRun`/`revertRun` when target/current passage is FEEDBACK.
- **Implementation**: Verify `logCertificationFeedback` has no revalidation. Ensure cert-quest-grammar play context (TwineQuestModal, CampaignReader/PassageRenderer) uses existing skipRevalidate + sessionStorage pattern. Add `logCertificationFeedback` to any call path that might trigger revalidation; if none, document as verified.
- **Acceptance**: User stays on FEEDBACK passage while typing and after submit; no navigate-away.

### FR2: Unpacking form config (deterministic, single source of truth)

- **Contract**: Export `UNPACKING_QUESTIONS` from `src/app/admin/quest-grammar/unpacking-constants.ts` with shape `{ key, label, type, options? }[]`. Type per question: `experience` | `multiselect` | `lifeState` | `short` | `move` | `model` | `segment` | etc. UnpackingForm and GenerationFlow MUST render from this config; no duplicated question definitions.
- **Implementation**: Consolidate QUESTIONS/STEPS into unpacking-constants; UnpackingForm and GenerationFlow import and iterate. Deterministic: no AI for form structure.
- **Acceptance**: Form uses dropdowns (experience, lifeState, move, model, segment), multiselect (q2, q4, q6), short input (q5). Mobile-first classes (min-h-44px, touch-manipulation) applied via shared `baseInputClass`.

### FR3: Node prose enrichment (deft AI layer)

- **Contract**: `compileQuest(input)` remains deterministic—structure (beats, nodes, choices) only. `compileQuestWithAI(input)` is the opt-in AI path: calls compileQuest, then enriches node 0–3 prose via `generateObjectWithCache`. Env `QUEST_GRAMMAR_AI_ENABLED` gates AI; when false, return error. No schema changes.
- **Implementation**: compileQuestWithAI already exists; verify it preserves heuristic structure and only replaces prose. Ensure UnpackingForm/GenerationFlow surface "Generate with AI" as primary CTA when QUEST_GRAMMAR_AI_ENABLED=true; heuristic compile as fallback.
- **Acceptance**: Heuristic output available; AI enrichment opt-in and cached. Admin can compile → preview → optionally enrich with AI → edit → publish.

### FR4 (stretch, deferred)

- Fractal node subsections, admin edit layer—schema-heavy; spec when ready.

## Non-functional requirements

- Preserve existing compileQuest structure and segment variants.
- No schema changes for FR1–FR3.
- Deft: deterministic where possible; AI only for prose enrichment, gated by env.

## Reference

- Feedback source: [.feedback/cert_feedback.jsonl](../../.feedback/cert_feedback.jsonl)
- Quest: cert-quest-grammar-v1, passage: STEP_1
- Related: [quest-grammar-compiler](../quest-grammar-compiler/spec.md), [cert-feedback-stability](../cert-feedback-stability/spec.md), [cert-existing-players-v1-feedback](../cert-existing-players-v1-feedback/spec.md)
- UnpackingForm: [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx)
- unpacking-constants: [src/app/admin/quest-grammar/unpacking-constants.ts](../../src/app/admin/quest-grammar/unpacking-constants.ts)
- compileQuest: [src/lib/quest-grammar/compileQuest.ts](../../src/lib/quest-grammar/compileQuest.ts)

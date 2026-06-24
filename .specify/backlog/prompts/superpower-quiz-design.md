# Spec Kit Prompt: Superpower Quiz Design

## Role
You are a Spec Kit agent responsible for the deterministic, anti-extractive quiz
that assigns one of 7 superpowers + orientation for the Mobility Quest campaign.

## Objective
Build a small, evidence-based, offline quiz instrument (item bank + pure scorer +
honest result copy) that feeds the campaign intake — scoped so it doesn't become a
sprawling personality engine. Grounded in
[RESEARCH_quiz-construction.md](../../specs/superpower-quiz-design/RESEARCH_quiz-construction.md).

## Prompt (API-First)
> Implement per
> [.specify/specs/superpower-quiz-design/spec.md](../../specs/superpower-quiz-design/spec.md).
> **API-first / deterministic**: author the ~12-item forced-choice bank and the
> pure `scoreQuiz(answers): QuizResult` (percent-of-max normalize → rank 7 →
> margin → primary/secondary → fixed tie-break) with tests, before any UI. No AI.

## Requirements
- **Mechanics**: quasi-ipsative forced-choice situational items, multi-weighted
  options; deterministic scoring; primary+secondary+margin; fixed tie-break.
- **Copy**: falsifiable, behavioral, shadow-bearing descriptions; lens-not-verdict
  framing; mechanism disclosure; Barnum self-check.
- **Ethics/UX**: no Barnum levers, no dark patterns (no email gate before results),
  WCAG-accessible, mobile-first.
- **Persistence**: none here (parent campaign spec owns per-campaign storage).
- **Verification**: `cert-superpower-quiz-v1`.

## Checklist (API-First Order)
- [ ] Item bank + scoreQuiz + tests (determinism, ties, normalization)
- [ ] Falsifiable shadow-bearing descriptions + Barnum check
- [ ] Map QuizResult → SuperpowerRoutingResult (parent wires UI)
- [ ] cert seeded; `npm run build` && `npm run check` green

## Deliverables
- [x] .specify/specs/superpower-quiz-design/spec.md
- [x] .specify/specs/superpower-quiz-design/plan.md
- [x] .specify/specs/superpower-quiz-design/tasks.md
- [x] .specify/specs/superpower-quiz-design/RESEARCH_quiz-construction.md
- [x] .specify/backlog/prompts/superpower-quiz-design.md

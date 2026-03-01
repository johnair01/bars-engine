---
name: cert-feedback-triage
description: Triages certification feedback from .feedback/cert_feedback.jsonl into Spec Kit specs, backlog prompts, and BACKLOG.md entries. Use when the user asks to process reported issues, triage cert feedback, create spec kits from feedback, or resolve issues submitted by the app.
---

# Certification Feedback Triage

Turns player-reported issues from certification quests into actionable Spec Kits and backlog items.

## When to Use

- User asks to "process reported issues," "triage cert feedback," "create spec kits from feedback," or "resolve issues submitted by the app"
- User wants to address issues from `.feedback/cert_feedback.jsonl`
- User asks to "create spec kits for new cert feedback"

## Workflow

### 1. Read Recent Feedback

```bash
tail -n 50 .feedback/cert_feedback.jsonl
```

Parse entries: `questId`, `passageName`, `feedback`, `timestamp`, `playerName`.

### 2. Filter Unresolved

Cross-reference with [.specify/backlog/BACKLOG.md](../../.specify/backlog/BACKLOG.md) Certification Feedback table. Skip issues already marked `[x] Fixed`.

### 3. Group and Deduplicate

- Merge similar feedback (e.g. multiple reports of same issue)
- Cluster by quest + passage or by theme (links, feedback UX, progress indicator, etc.)

### 4. Create Spec Kit per Issue (or Cluster)

For each new issue, create:

| Artifact | Path | Purpose |
|----------|------|---------|
| Spec | `.specify/specs/[kebab-name]/spec.md` | Purpose, user story, FRs |
| Plan | `.specify/specs/[kebab-name]/plan.md` | Architecture, file impacts |
| Tasks | `.specify/specs/[kebab-name]/tasks.md` | Checklist, verification |
| Prompt | `.specify/backlog/prompts/[kebab-name].md` | Agent prompt for implementation |

Follow patterns from [market-clear-filters](.specify/specs/market-clear-filters/spec.md) and [certification-feedback-multi-report](.specify/specs/certification-feedback-multi-report/spec.md).

### 5. Update Backlog

- Add row to Objective Stack (assign next ID, e.g. AK, AL)
- Add row to Certification Feedback table with status `[ ] Ready → [prompt-name](prompts/prompt-name.md)`
- Mark urgent items at top (Priority 0)

## Spec Structure (Feedback-Driven)

```markdown
# Spec: [Short Title] (Certification Feedback)

## Purpose
Fix [issue] reported during [questId]. Feedback: "[excerpt]"

## Root cause
[Technical explanation if known]

## User story
**As a tester**, I want [desired outcome] so that [benefit].

## Functional requirements
- **FR1**: [Specific requirement]
- **FR2**: ...

## Reference
- Feedback source: .feedback/cert_feedback.jsonl
- Quest: [questId], passage: [passageName]
```

## Naming Conventions

- Spec slug: `kebab-case` (e.g. `cert-feedback-stability`, `cert-quest-links`)
- Backlog prompt: same as spec slug
- Backlog ID: next letter (AJ, AK, AL...)

## Reference

- Feedback format: [docs/CERTIFICATION_FEEDBACK.md](../../docs/CERTIFICATION_FEEDBACK.md)
- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](../spec-kit-translator/SKILL.md)
- Existing feedback specs: [market-clear-filters](.specify/specs/market-clear-filters/), [certification-feedback-multi-report](.specify/specs/certification-feedback-multi-report/)

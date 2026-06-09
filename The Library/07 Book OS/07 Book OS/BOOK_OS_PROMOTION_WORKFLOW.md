---
type: spec
aliases:
  - MTGOA Promotion Workflow
  - Book OS Promotion Workflow
tags:
  - mtgoa
  - book-os
  - canon
  - workflow
created: 2026-05-08
review: 2026-05-15
---

# Book OS Promotion Workflow

## Purpose

This note defines two things:

1. The current canonical MTGOA note set in Obsidian
2. The promotion path from proposal to canon

This is the operational layer under [[OBSIDIAN_CANON_RULE]].

## Canonical Note Set

### Governance Canon

These notes currently own the rules of the system:

- [[OBSIDIAN_CANON_RULE]] — authority rule
- [[BOOK_OS_PROMOTION_WORKFLOW]] — promotion path
- [[SPEC_BOOK_EDITING_PROCESS]] — editing session process

### Book-State Canon

These notes currently own the state of the book project:

- [[MTGOA_BOOK_WORK_TRACKER]] — current sequencing, blockers, what happens next
- [[DEVELOPMENTAL_ISSUES_TRACKER]] — deeper structural and editorial problems
- [[PERSONAL_OPS]] — session-level operational notes when relevant to the book

### Voice Canon

These notes currently own voice calibration:

- [[WENDELL_VOICE_PROFILE]]
- [[WENDELL_VOICE_AGENT_GUIDE]]
- [[VOICE_MATRIX_BY_FACE]]

### Chapter-Text Canon

Current state:

- One canonical Obsidian chapter note now exists for each chapter
- Front-matter canon is still distributed across existing Book OS notes
- Chapter text still largely exists in workspace export files under `manuscripts/chapters/`
- Those files are no longer treated as co-equal canon
- Promotion of chapter text into the Obsidian chapter notes is still pending

Operational consequence:

- Do not treat workspace chapter files as authority on manuscript meaning if they conflict with Obsidian decisions
- New approved manuscript changes should be promoted into the Obsidian chapter notes first

## Promotion Path

### Truth States

1. **Proposal**
Agent draft, analysis, rewrite, patch, or recommendation

2. **Approved**
Wendell has consciously said yes to the write

3. **Canonical**
The approved change is written into Obsidian

4. **Derived**
Exports, workspace copies, trackers, app surfaces, or other downstream artifacts are regenerated from canon

### Minimal Ritual

1. Agent produces a proposal
2. Wendell consciously approves the write
3. The approved content is written to the relevant Obsidian note
4. Downstream exports or mirrors are updated as needed
5. If an export disagrees later, Obsidian wins

## Write Rules

- No canonical manuscript write without Wendell's conscious approval
- If approval is absent, the output remains proposal-only
- Do not edit downstream exports as if they are canon
- If a downstream file must change, treat it as regeneration or mirror maintenance

## Current Priority

The next custodial step is to instantiate chapter-text canon in Obsidian:

1. Promote current chapter text into the chapter-note set
2. Treat `manuscripts/chapters/` as export-only after migration
3. Define front-matter canon notes if Chapter 0 and intro materials remain distributed

## Related

- [[INDEX]]
- [[OBSIDIAN_CANON_RULE]]
- [[MTGOA_BOOK_WORK_TRACKER]]
- [[DEVELOPMENTAL_ISSUES_TRACKER]]
- [[CHAPTER_0_INFINITE_ARCADE]]
- [[CHAPTER_1_SHAMAN]]
- [[CHAPTER_2_SHAMAN]]
- [[CHAPTER_3_CHALLENGER]]
- [[CHAPTER_4_REGENT]]
- [[CHAPTER_5_ARCHITECT]]
- [[CHAPTER_6_DIPLOMAT]]
- [[CHAPTER_7_SAGE]]
- [[CHAPTER_8_PLAYER]]

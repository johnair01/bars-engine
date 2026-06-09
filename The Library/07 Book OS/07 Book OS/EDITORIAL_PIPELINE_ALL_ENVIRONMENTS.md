---
type: spec
aliases:
  - MTGOA Editorial Pipeline
  - Editorial Pipeline All Environments
tags:
  - mtgoa
  - book-os
  - editorial
  - workflow
created: 2026-05-09
review: 2026-05-16
---

# Editorial Pipeline — All Environments

## Purpose

This is the shared editorial pipeline for MTGOA across Obsidian, workspace, Claude/Codex, and zo.

It answers:

1. what note to read first
2. where canon lives
3. how an edit moves from proposal to canonical text
4. how other environments can follow the trail

## Core Rule

For manuscript content and editorial state, Obsidian is canonical.

No canonical write happens without Wendell's conscious approval.

If approval is absent, output is a proposal, not canon.

See:
- [[OBSIDIAN_CANON_RULE]]
- [[BOOK_OS_PROMOTION_WORKFLOW]]

## Environment Roles

| Environment | Role |
|---|---|
| Obsidian | Canonical text, editorial state, workflow notes, chapter notes |
| `workspace/The Library/manuscripts` | Export surface, verification surface, git history, derived markdown |
| Claude / Codex / agents | Proposal, analysis, rewrite suggestions, structured editing help |
| zo / app surfaces | Intake, capture, optional approval or publishing interface |

## Read Order Before Any Edit

For a chapter edit, read in this order:

1. Chapter canon note
2. Current tracker
3. Developmental issues tracker if the chapter has structural problems
4. Chapter-specific unpacking or support note
5. Voice guidance if voice is part of the edit

For Chapter 0 specifically:

1. [[CHAPTER_0_INFINITE_ARCADE]]
2. [[MTGOA_BOOK_WORK_TRACKER]]
3. [[DEVELOPMENTAL_ISSUES_TRACKER]]
4. [[CH0_UNPACKING]]
5. [[WENDELL_VOICE_PROFILE]]
6. [[WENDELL_VOICE_AGENT_GUIDE]]

## The Pipeline

### Stage 1 — Intake

Ask:
- what chapter or section are we editing?
- is this a planning move, review move, or generation move?
- what specific problem are we solving?

Primary references:
- [[SPEC_BOOK_EDITING_PROCESS]]
- [[06_EDITING_REFERENCE]]

Output:
- named edit target
- named reason for edit

### Stage 2 — Wake Up / Editorial Intake

Run the WAVE intake and section questions.

Minimum:
- reader experience target
- current reader dissatisfaction
- what truth/move the section must deliver
- what reservation blocks reception

Primary references:
- [[SPEC_BOOK_EDITING_PROCESS]]
- [[06_EDITING_REFERENCE]]
- [[IDEAL_READER_FEEDBACK_PROMPT]] when the edit needs reader-trust, sequence, or acceptance feedback
- chapter-specific unpacking note

Output:
- 1-3 concrete editorial intentions

### Stage 3 — Proposal

An agent or Wendell drafts the change.

Possible proposal surfaces:
- agent response
- temporary workspace draft
- staging text in Obsidian note
- zo capture surface

Rule:
- proposal is not canon
- downstream files are not edited as if they are authority

Output:
- a candidate edit

### Stage 4 — Approval

Wendell consciously approves the write.

This can be explicit in conversation or direct steering while editing.

Without approval:
- stop at proposal
- do not mark canon updated

Output:
- approved write state

### Stage 5 — Canonical Write

Write the approved change into the Obsidian chapter note.

Update:
- chapter note state if needed
- process trail if the edit changes stage or authority
- tracker if the edit changes project state

Output:
- canonical Obsidian text updated

### Stage 6 — Derived Export

If needed, regenerate or update the workspace export in `manuscripts/`.

Rule:
- Obsidian writes first
- export follows
- if Obsidian and export disagree, Obsidian wins

Output:
- derived markdown or mirror updated

### Stage 7 — Verification

Verify:
- canonical note written
- export written if touched
- process trail updated
- tracker reflects the new state

Minimum checks:
- `wc -c`
- readback of changed canonical note
- readback of derived artifact if changed

Output:
- explicit verification level

## Trail Requirements

Every meaningful edit should leave a trail visible from multiple environments.

Minimum trail:

1. chapter canon note shows current state
2. tracker shows session impact if status changed
3. workspace export path is named in the chapter note
4. promotion workflow remains the reference for authority

Optional:
- session note in Book OS
- git commit in `manuscripts/` after export update
- ideal reader readback note using [[IDEAL_READER_FEEDBACK_PROMPT]] before accepting major chapter changes

## Current Notes You Need For Chapter 0

- [[CHAPTER_0_INFINITE_ARCADE]]
- [[CH0_UNPACKING]]
- [[MTGOA_BOOK_WORK_TRACKER]]
- [[DEVELOPMENTAL_ISSUES_TRACKER]]
- [[SPEC_BOOK_EDITING_PROCESS]]
- [[06_EDITING_REFERENCE]]
- [[WENDELL_VOICE_PROFILE]]
- [[WENDELL_VOICE_AGENT_GUIDE]]

## What This Replaces

This replaces the older implicit schema where:
- workspace chapter markdown acted like source of truth
- process lived partly in memory
- environments inferred authority differently

Now the route is:

proposal -> Wendell approval -> Obsidian canon -> derived export -> verification

## Related

- [[INDEX]]
- [[OBSIDIAN_CANON_RULE]]
- [[BOOK_OS_PROMOTION_WORKFLOW]]
- [[SPEC_BOOK_EDITING_PROCESS]]
- [[CHAPTER_0_INFINITE_ARCADE]]

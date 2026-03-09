# Spec: K-Space Librarian — Report to Library Skill Link (Certification Feedback)

## Purpose

Fix the K-Space Librarian quest STEP_3 feedback: when a doc exists, the link should direct players to the "report to the library" skill/guide rather than directly to the library request modal. This teaches the skill and empowers players to use it, instead of bypassing the flow.

## Root cause

- Currently the quest links to the Library Request modal or request form directly.
- Feedback: "Give people the report to the library skill instead of linking to the library request itself."
- Players should learn the skill (how to report, when to report) before being taken to the request UI.

## User story

**As a player** completing the K-Space Librarian quest, I want to be directed to the "report to the library" skill/guide (documentation or tutorial) rather than straight to the request form, so I understand how and when to use the library reporting flow.

## Functional requirements

- **FR1**: When the K-Space Librarian quest provides a doc link, also surface the "report to the library" skill—e.g. link to skill documentation or a short guide.
- **FR2**: The primary CTA or link should emphasize the skill (how to report) over the raw request form.
- **FR3**: If a doc exists, the flow should be: skill/guide → then optionally request form. Not: request form only.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl
- Quest: k-space-librarian-quest, passage: STEP_3 (Mar 4 2026)
- Related: [k-space-librarian](../k-space-librarian/spec.md), doc link mismatch (separate spec)

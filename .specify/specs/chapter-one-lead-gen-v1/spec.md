# Spec: Chapter One Lead Gen V1

## Purpose

Make the Mastering Allyship Chapter 1 lead magnet launchable today without adding a new external email platform.

The V1 funnel uses the existing app stack:

- public opt-in at `/mastering-allyship/chapter-1`
- `FunnelSignup` persistence
- Resend delivery through the existing email service
- an honest in-app read path while the polished PDF/design pass is completed
- an admin lead review/export path for manual follow-up and upsells

This spec extends the existing `library-to-live-launch-funnel` work and stays compatible with the `book-launch-paywall` Gumroad/deliverable direction.

## Requirements

- A visitor can submit email and optional name without logging in.
- A valid opt-in creates a `FunnelSignup` row with source `mastering-allyship-chapter-1`.
- The visitor never receives or sees a dead `/chapter-one.pdf` link.
- The delivery email and post-submit state point to the same live Chapter 1 read path.
- Resend remains the delivery provider for V1; unconfigured email returns a manual-follow-up state after persistence.
- Admins can review recent Chapter 1 leads and copy/export a CSV for follow-up.
- A Claude/design handoff exists for the polished Chapter 1 PDF/reader artifact.
- The funnel copy bridges to the full book, the $22 Allyship Deck, the Dojo, 1:1 work, and future cohort without promising automated drip emails.

## Acceptance Criteria

- `/mastering-allyship/chapter-1` renders publicly.
- `/mastering-allyship/chapter-1/read` renders publicly and is the canonical Chapter 1 delivery URL until the PDF exists.
- `ChapterOneLeadForm`, `sendChapterOneEmail`, and related copy use the canonical delivery URL.
- `/admin/launch-leads` shows counts, recent rows, and a CSV-ready export for the Chapter 1 funnel.
- The design handoff documents layout, typography, visual needs, export target, and app wiring.
- Focused validation includes launch funnel readiness and route/type checks where practical.

## Out Of Scope

- Mailchimp, ConvertKit, or another external ESP.
- A full multi-email nurture automation.
- Final PDF production if the design handoff remains the chosen same-day artifact.

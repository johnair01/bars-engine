---
title: Backlog to Editorial Schema Bridge
date: 2026-06-04
status: draft-for-schema-ingest
purpose: Fold current MTGOA backlog items into the emerging finishing/editorial schema
related:
  - MTGOA_BOOK_WORK_TRACKER
  - CH6_PROSE_RHYTHM_PASS_2026-06-04
  - CH5_CH8_ENERGY_LANGUAGE_READBACK_2026-06-04
  - APPENDIX_TERMS_ENERGY_ECOLOGY_AUDIT_2026-06-04
  - SPEC_COUNCIL_OF_JOANNES_PUNCH_UP_ENGINE_2026-06-02
---

# Backlog to Editorial Schema Bridge

## Purpose

Convert the current loose backlog into the new editorial finishing schema.

This is not a new work queue by itself. It is an import bridge: each item should become either an acceptance gate, an editorial lane, a local chapter ticket, or a parked item.

## Schema Buckets

| Bucket | Meaning | Use When |
|---|---|---|
| Acceptance Gate | Book should not ship until this is true | The issue affects trust, integrity, continuity, or source standards |
| Editorial Lane | Repeatable pass across multiple chapters | The same kind of edit applies across the manuscript |
| Local Chapter Ticket | Scoped edit/readback in one chapter or surface | The issue is concrete and bounded |
| Parked / Not Now | Preserve the note but do not let it drive finishing | The issue is valid but not on the critical path |

## Backlog Migration Table

| Backlog Item | New Schema Bucket | Chapter / Surface | Acceptance Test | Priority | Notes |
|---|---|---|---|---|---|
| Fix stale tracker note: Ch0 currently says "fuel budget" in the handoff, but accepted terminology is **personal energy economy** | Local Chapter Ticket | `MTGOA_BOOK_WORK_TRACKER.md`; Book OS tracker; manuscript mirror tracker | Trackers use **personal energy economy** for Ch0 and reserve **Energy Ecology** for Ch2 field-level frame | P0 | Tiny but important. Prevents the new schema from ingesting the wrong term. |
| Ch6 focused readback after prose rhythm pass | Acceptance Gate | Ch6 Diplomat | Cost/capacity language reads as native Diplomat prose; no repeated `This is a costly move`; no return to point-scoring | P0 | Follows `CH6_PROSE_RHYTHM_PASS_2026-06-04`. |
| Confirm Ch7 "game" language after rebase | Local Chapter Ticket | Ch7 Sage | Ch7 consistently prefers game / view / escape / completion language where intended; no accidental reversion to old altitude/color vocabulary except source-attribution footnotes | P0 | Rebase preserved newer game-language direction; deserves a readback. |
| Tracker cleanup / stale P0 queue cleanup | Acceptance Gate | All tracker surfaces | Trackers no longer list superseded work as active: Ch6 reorder, Ch0 rewrite, old gap-analysis language, stale next-focus items | P0 | Current tracker still includes historical P0 items that may be superseded. Confirm before deleting or marking superseded. |
| Source integrity standard | Acceptance Gate | Whole manuscript | Each chapter has 2-3 direct quotes where useful; remaining source use is paraphrase/inline; citations are accurate and not ornamental | P0 | This is the academic-integrity floor. Should become a schema-wide acceptance rule. |
| Ch0 / Ch1 trust and onboarding acceptance | Acceptance Gate | Ch0, Ch1 | Reader understands why allyship, why mastery, why game; Ch1 teaches how to use the book humanely; no compression cuts load-bearing onboarding | P0 | Ch1 latest readbacks suggest pause-worthy. Ch0 may need only light compression and one callback. |
| Ch0 Ticket benevolence callback | Local Chapter Ticket | Ch0 | Add or confirm callback: "A real ticket is not private profit. It is the return of capacity: more life in you, more agency in them, more truth in the field." | P1 | Already named as a future Ch0 note. Do this only when returning to Ch0. |
| Ch0 light compression | Local Chapter Ticket | Ch0 | Reduce Token/Ticket density and repeated game-frame justification without cutting tutorial object, micro-moves, or BAR door | P1 | Do not reopen the full Ch0 onboarding debate. |
| Hedge / rhythm pass | Editorial Lane | Whole manuscript, starting Ch8 then Ch7 | Hedges reduced without flattening voice; chapter still sounds human and situated | P1 | Tracker marks Ch8 highest hedge ratio, Ch7 second. |
| Comedic / Council of Joannes punch-up | Editorial Lane | Whole manuscript | Each chapter has sharpened pressure where the ideal reader is obeying the Council; comedy clarifies without contempt | P1 | Council is author-side antagonist system, not usually named in manuscript. Use `SPEC_COUNCIL_OF_JOANNES_PUNCH_UP_ENGINE_2026-06-02`. |
| Source integration pass | Editorial Lane | Whole manuscript | Source material is woven into the argument without becoming academic wallpaper; direct quotes are limited and purposeful | P1 | Pair with source integrity acceptance gate. |
| Chapter-level continuity readbacks | Editorial Lane | Whole manuscript | Each pass produces a verdict: stable, needs local ticket, or escalates to acceptance gate | P1 | Prevents endless editing by forcing verdicts. |
| Appendix C pruning / organization | Parked / Not Now | Appendix C | Only revisit if glossary becomes reader-confusing or final production requires a hard limit | P3 | User has explicitly accepted that Appendix C can be as long as it needs to be. |
| Major Ch1 compression | Parked / Not Now | Ch1 | Do not run unless later readback finds reader fatigue outweighs onboarding trust | P3 | Current readbacks say Ch1 is strong enough to pause. |
| New framework expansion | Parked / Not Now | Whole manuscript | Any new framework must replace or clarify existing load-bearing architecture, not add more furniture | P3 | Finishing schema should resist attractive expansions. |

## Recommended Ingest Order

1. Import the **P0 acceptance gates** first.
2. Convert the tracker cleanup into a tiny immediate ticket.
3. Run Ch6 focused readback and Ch7 game-language readback.
4. Then schedule P1 editorial lanes:
   - source integration
   - hedge/rhythm
   - comedy/Council punch-up
5. Leave parked items out of the active finishing board unless an acceptance gate reactivates them.

## Stop Condition

The finishing schema should stop adding new lanes when every active item answers one of these:

- Does this protect reader trust?
- Does this protect source/integrity?
- Does this make the prose more playable?
- Does this remove contradiction or stale architecture?

If an item does none of those, park it.


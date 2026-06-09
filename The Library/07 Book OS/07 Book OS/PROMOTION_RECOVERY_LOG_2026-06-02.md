# Promotion Recovery Log — 2026-06-02

## Summary

Book OS manuscript promotion recovery completed on 2026-06-02.

The recovery resolved the split-brain state between Book OS chapter containers and `manuscripts/chapters/` exports. For this pass only, the current manuscript export files were treated as source inputs and promoted into Book OS chapter containers.

No manuscript prose was rewritten during this pass.

## Context

- Obsidian sync issue suspected: newly created specs synced, but modifications to existing chapter files did not reliably appear across environments.
- Book OS chapter containers were stale or staging in this workspace.
- `CHAPTER_1_SHAMAN.md` through `CHAPTER_8_PLAYER.md` were 41-line staging shells.
- `CHAPTER_0_INFINITE_ARCADE.md` held an older promoted snapshot from 2026-05-08.
- Current manuscript exports were promoted into Book OS as recovery source.

## Backups

Backups created before promotion:

- `CHAPTER_0_INFINITE_ARCADE_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_1_SHAMAN_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_2_SHAMAN_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_3_CHALLENGER_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_4_REGENT_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_5_ARCHITECT_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_6_DIPLOMAT_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_7_SAGE_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_8_PLAYER_backup_2026-06-02_pre-promotion-recovery.md`

## Promoted Files

| Chapter | Book OS target | Source export |
|---|---|---|
| Ch0 | `CHAPTER_0_INFINITE_ARCADE.md` | `manuscripts/chapters/ch0-infinite-arcade/CHAPTER0_DRAFT.md` |
| Ch1 | `CHAPTER_1_SHAMAN.md` | `manuscripts/chapters/ch1-SHAMAN/CHAPTER1_FULL_DRAFT.md` |
| Ch2 | `CHAPTER_2_SHAMAN.md` | `manuscripts/chapters/ch2-SHAMAN/CHAPTER2_SHAMAN_FULL_DRAFT.md` |
| Ch3 | `CHAPTER_3_CHALLENGER.md` | `manuscripts/chapters/ch3-CHALLENGER/CHAPTER3_CHALLENGER_FULL_DRAFT.md` |
| Ch4 | `CHAPTER_4_REGENT.md` | `manuscripts/chapters/ch4-REGENT/CHAPTER4_REGENT_FULL_DRAFT.md` |
| Ch5 | `CHAPTER_5_ARCHITECT.md` | `manuscripts/chapters/ch5-ARCHITECT/CHAPTER5_ARCHITECT_FULL_DRAFT.md` |
| Ch6 | `CHAPTER_6_DIPLOMAT.md` | `manuscripts/chapters/ch6-diplomat/CHAPTER6_DIPLOMAT_FULL_DRAFT_MASTER.md` |
| Ch7 | `CHAPTER_7_SAGE.md` | `manuscripts/chapters/ch7-sage/CHAPTER7_SAGE_FULL_DRAFT.md` |
| Ch8 | `CHAPTER_8_PLAYER.md` | `manuscripts/chapters/ch8-player/CHAPTER8_PLAYER_FULL_DRAFT.md` |

## Preserved Pending Work

Ch2 proposal left pending/unapplied:

- `manuscripts/editorial_reports/PROPOSAL_CH2_WB1_WB6_PASS_2026-05-29.md`

## Tracker Updates

- `manuscripts/MTGOA_BOOK_WORK_TRACKER.md` updated with canon recovery note.
- `DEVELOPMENTAL_ISSUES_TRACKER.md` Issue 18 marked closed.

## Post-Recovery Rule

After this pass, Book OS chapter containers are treated as chapter-text canon. `manuscripts/chapters/` is treated as an export / verification surface.

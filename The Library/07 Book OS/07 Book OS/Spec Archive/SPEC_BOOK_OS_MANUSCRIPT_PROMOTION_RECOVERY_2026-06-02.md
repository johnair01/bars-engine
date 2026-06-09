---
type: spec
aliases:
  - Book OS Manuscript Promotion Recovery
  - MTGOA Promotion Recovery 2026-06-02
tags:
  - mtgoa
  - book-os
  - canon
  - promotion
  - recovery
created: 2026-06-02
review: 2026-06-09
status: draft
---

# SPEC: Book OS Manuscript Promotion Recovery

## Purpose

Resolve the split-brain state between Book OS chapter containers and the manuscript export folder.

The intended architecture is clear in [[OBSIDIAN_CANON_RULE]] and [[BOOK_OS_PROMOTION_WORKFLOW]]:

- Obsidian / Book OS chapter notes are canon.
- `manuscripts/chapters/` is an export and verification surface.
- Approved manuscript text should live in the Book OS chapter containers first.

The current filesystem state does not match that architecture:

- `CHAPTER_1_SHAMAN.md` through `CHAPTER_8_PLAYER.md` are still staging shells.
- `CHAPTER_0_INFINITE_ARCADE.md` contains an older promoted snapshot from 2026-05-08.
- The most complete current chapter text lives in `manuscripts/chapters/`.
- The May 29 editorial work exists in manuscript exports and manuscript specs, but has not been reconciled into Book OS chapter canon.

This spec defines the recovery pass that promotes the current manuscript exports into Book OS chapter containers while preserving provenance and known pending work.

---

## Authority

This recovery pass is authorized by the existing canon rule:

- [[OBSIDIAN_CANON_RULE]]
- [[BOOK_OS_PROMOTION_WORKFLOW]]
- [[MTGOA_BOOK_WORK_TRACKER]]

No prose should be rewritten during this pass. This is a promotion and reconciliation operation, not an editorial revision.

---

## Source of Truth for This Pass

For this recovery pass only, the current manuscript export files are the source inputs to be promoted into Book OS:

| Chapter | Book OS target | Manuscript export source |
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

After this pass, Book OS becomes the canonical home for chapter text. The manuscript export files become derived surfaces again.

---

## Required Backups

Before modifying any Book OS chapter note, create a same-folder backup:

`CHAPTER_N_FACE_backup_2026-06-02_pre-promotion-recovery.md`

Examples:

- `CHAPTER_0_INFINITE_ARCADE_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_1_SHAMAN_backup_2026-06-02_pre-promotion-recovery.md`
- `CHAPTER_6_DIPLOMAT_backup_2026-06-02_pre-promotion-recovery.md`

Do not overwrite an existing backup. If a backup already exists, verify it is non-empty and continue.

---

## Promotion Procedure

For each chapter container:

1. Preserve the existing YAML frontmatter structure where possible.
2. Change frontmatter:
   - `state: canonical`
   - `authority: canonical`
   - `review: 2026-06-09`
   - add `promoted: 2026-06-02`
   - keep `export_surface` pointing at the manuscript export source
3. Update `## Canonical Status`:
   - State that the current manuscript export has been promoted into Book OS canon on 2026-06-02.
   - State that future manuscript edits should land in Book OS first.
4. Keep `## Export Surface`.
5. Replace the previous staging shell text under `## Manuscript Text` with:
   - `### Snapshot Provenance`
   - source path
   - promotion date
   - note that this was a recovery promotion after an Obsidian sync issue
   - full manuscript export text
6. Add or preserve `## Related` with:
   - [[BOOK_OS_PROMOTION_WORKFLOW]]
   - [[OBSIDIAN_CANON_RULE]]
   - [[MTGOA_BOOK_WORK_TRACKER]]
   - chapter-specific connected notes where applicable

Do not apply new editorial changes during this procedure.

---

## Known Manuscript Work to Preserve

These changes already exist in `manuscripts/chapters/` and should be carried into Book OS by promotion:

### Ch0

- WB-2 "Two Readings" inoculation added near the front.
- "Not enough" line changed to "not where the game is played."
- Connected notes:
  - `manuscripts/SPEC_WHOLEBOOK_IDEAL_READER_FIXES_2026-05-29.md`
  - `manuscripts/chapters/ch0-infinite-arcade/SPEC_CH0_IDEAL_READER_FIXES_2026-05-29.md`

### Ch1

- WB-10/WB-11 Shadow / distortion / cost terminology pass.
- WB-6 compression of the five Emotional Channels preview table.
- WB-1 external action added: "Try It Now: The Second Move -- Say It Out Loud."
- Connected notes:
  - `manuscripts/editorial_reports/PROPOSAL_CH1_WB1_WB6_PASS_2026-05-29.md`
  - `manuscripts/SPEC_WB10_WB11_TERMINOLOGY_SEQUENCING_PROPOSAL_2026-05-29.md`

### Ch2

- Current export should be promoted as-is.
- Important: `PROPOSAL_CH2_WB1_WB6_PASS_2026-05-29.md` exists, but the Ch2 WB-1/WB-6 pass is not applied to the export.
- Mark Ch2's related section with the proposal as pending/unapplied.

### Ch4

- Polarity Encounter inserted: Honor ↔ Reform.
- Connected notes:
  - polarity-map notes in `manuscripts/sources/integral-design/chapter-polarities/`
  - `manuscripts/editorial_reports/STRUCTURAL_CONSISTENCY_AUDIT_2026-05-29.md`

### Ch6

- Care ↔ Impact polarity integrated into Close with Honest Terms.
- `/polarity` app capture prompt added.
- Connected notes:
  - `manuscripts/editorial_reports/STRUCTURAL_CONSISTENCY_AUDIT_2026-05-29.md`

### Ch7

- WB-2 "Two Readings" callback revised to assume the test was introduced earlier.
- Connected notes:
  - `manuscripts/SPEC_WHOLEBOOK_IDEAL_READER_FIXES_2026-05-29.md`

### Appendix A

Appendix A is not a chapter container, but it should be noted in the tracker:

- `manuscripts/appendices/APPENDIX_A_FOUR_ALLYSHIP_DOMAINS.md` received a major depth pass.
- This is connected to `DEVELOPMENTAL_ISSUES_TRACKER.md` Issue 15.

---

## Tracker Updates

Update [[MTGOA_BOOK_WORK_TRACKER]] after chapter promotion:

- Mark Ch0-Ch8 chapter text as promoted into Book OS canon.
- Note that `manuscripts/chapters/` is now export-only after recovery promotion.
- Preserve the Ch2 open item:
  - Ch2 WB-1/WB-6 proposal exists but is pending/unapplied.
- Preserve the next editorial sequence:
  - Ch2 WB-1/WB-6 fork decision
  - remaining WB-1 bounded external action passes
  - WB-6 de-densification passes
  - WB-4 / WB-8 hygiene pass

If tracker and manuscript exports disagree after this pass, Book OS wins.

---

## Optional Promotion Log

Create a short session log if useful:

`PROMOTION_RECOVERY_LOG_2026-06-02.md`

It should record:

- Obsidian sync issue suspected: `zo.computer` stopped connecting to this Mac's folder.
- Book OS chapter containers were stale/staging in this workspace.
- Manuscript exports were promoted into Book OS as recovery source.
- Backups created before promotion.
- Ch2 proposal left pending.

---

## Verification

After the promotion pass:

1. Confirm all 9 chapter notes exist.
2. Confirm every chapter note has:
   - `state: canonical`
   - `authority: canonical`
   - `promoted: 2026-06-02`
   - `review: 2026-06-09`
   - `## Manuscript Text`
   - `### Snapshot Provenance`
   - full manuscript text, not a staging placeholder
   - `## Related`
3. Confirm old shell backups exist and are non-empty.
4. Confirm Ch1-Ch8 are no longer 41-line shells.
5. Confirm Ch2 still records the pending/unapplied WB-1/WB-6 proposal.
6. Confirm [[MTGOA_BOOK_WORK_TRACKER]] reflects the promotion.

Suggested checks:

```bash
wc -l "The Library/07 Book OS/07 Book OS"/CHAPTER_*.md
rg -n "state: canonical|promoted: 2026-06-02|Promotion pending|pending/unapplied|Snapshot Provenance" "The Library/07 Book OS/07 Book OS"/CHAPTER_*.md
find "The Library/07 Book OS/07 Book OS" -name "*backup_2026-06-02_pre-promotion-recovery.md"
```

---

## Acceptance Criteria

- [ ] All 9 Book OS chapter containers contain full manuscript text.
- [ ] All 9 old Book OS chapter containers have backups.
- [ ] All chapter containers have canonical frontmatter and recovery provenance.
- [ ] Ch2's unapplied proposal status is explicit.
- [ ] Tracker is updated.
- [ ] No manuscript prose is rewritten during the recovery pass.
- [ ] After recovery, Book OS is treated as chapter-text canon and manuscript exports as derived.

---

## Stop Conditions

Stop and ask Wendell before proceeding if:

- A Book OS chapter note contains newer prose than the manuscript export.
- A June 1 promoted container appears during the pass.
- A manuscript export is missing or clearly truncated.
- The target chapter note has unexpected content outside the staging shell that looks author-written.

---

## Related

- [[OBSIDIAN_CANON_RULE]]
- [[BOOK_OS_PROMOTION_WORKFLOW]]
- [[MTGOA_BOOK_WORK_TRACKER]]
- [[DEVELOPMENTAL_ISSUES_TRACKER]]
- [[SPEC_BOOK_EDITING_PROCESS]]

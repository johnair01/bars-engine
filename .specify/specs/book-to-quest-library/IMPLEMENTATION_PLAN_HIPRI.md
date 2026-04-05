# High-priority implementation plan — Book / Quest Library spine (AZ + DU + DW slice)

**Goal**: Ship the smallest vertical slice that connects PDF→book→library threads to **player pull** and **wave routing data**, without blocking on SI, DX (campaign), or full NC.

## Order of work

| Phase | Item | Outcome |
|-------|------|---------|
| **P0** | DU (verify) | `listBooks` excludes `extractedText`; admin try/catch — **done in repo**; no extra work unless audit finds other huge `findMany`. |
| **P1** | **AZ Phase 4** | `getQuestLibraryContent`, `pullFromLibrary` server actions + `/library/quests` UI — **primary deliverable**. |
| **P2** | **DW minimal** | `CustomBar.questPool` + set on **approve** from `moveType` (`efa`/`dojo`/`discovery`/`gameboard`) + `getQuestsByPool` for future surfaces. |
| **P3** | NC thin slice | `QuestThread.npcCoachId` + list/bind APIs — **after** P1 stable (spec: npc-coach-system). |
| **P4** | SI | Extend existing source-ingestion + bar-candidate path; full schema only when queries require it. |
| **P5** | DX (40.13) | TOC fallback + summary/leverage before full CYOA graph. |

## Deferred (same direction, less scope)

- Four polished pool UIs — tag data first, one consumer later.
- Full NPC codex workflow — seed 1–2 coaches after P1.
- Full SI disposition graph — curation on existing BAR path first.

## Verification

- `npm run db:sync` after schema changes
- `npm run check` && `npm run build`

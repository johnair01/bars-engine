# Tasks: Book CYOA campaign

## Spec kit

- [x] `spec.md`, `plan.md`, `tasks.md`
- [x] `BACKLOG.md` row + `npm run backlog:seed`

## Phase A — MtGoA Chapter 1 backer demo

- [ ] Confirm **Chapter 1** passage outline + quest IDs with steward (TOC boundary) — **v1 uses steward-authored demo copy in seed;** tighten against published TOC when available
- [x] Seed **`Adventure`** (`campaignRef=mtgoa-chapter-1-demo`, slug `mtgoa-chapter-1`) + **`Passage`** graph (`MTGOA_CH1_*`); valid `choices`; `metadata.passageType` — `npm run seed:mtgoa-ch1`
- [x] Wire **chapter-1 library quest**: seeded `CustomBar` + `QuestAdventureLink` + `Passage.linkedQuestId` on practice passage
- [x] Set **`QuestThread.adventureId`** in seed script
- [x] **API contracts:** `src/actions/book-cyoa-campaign.ts` — `linkLibraryThreadToAdventure`, `ensurePlayerAdventureProgress`, `startQuestFromBookPassage` (wraps `takeQuest`)
- [ ] **Manual E2E:** passage → quest assign → complete → return/handoff; Vault/BAR if required by content
- [x] **Runbook** — [docs/runbooks/BOOK_CYOA_MTGOA_CHAPTER1_DEMO.md](../../../docs/runbooks/BOOK_CYOA_MTGOA_CHAPTER1_DEMO.md)
- [ ] `npm run check` (if application code changed)

## Phase B — Templates for additional books

- [ ] Document **`AdventureTemplate`** slot pattern + mapping to passage types / four moves
- [ ] Authoring guide for stewards (`nodeId`, `choices`, `metadata`, domain/move tags on bars)

## Phase C — Optional

- [ ] Cert quest `cert-book-cyoa-allyship-ch1-v1` + `package.json` seed script (mirror other cert seeds)
- [ ] Consider UGA validator hook when saving Passages in admin

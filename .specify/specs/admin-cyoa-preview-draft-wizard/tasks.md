# Tasks: Admin CYOA Preview, DRAFT-Only, New Passage Form

## Phase 1: Preview API

- [x] **Play page**: Read `searchParams.preview`; if `preview=1` and admin, load adventure without status filter
- [x] **Adventures API**: Add `getCurrentPlayer` + admin check; if `preview=1` and admin, skip ACTIVE check (bruised-banana + generic paths)
- [x] **AdventurePlayer**: Add `isPreview` prop; append `?preview=1` to fetch when true
- [x] **Admin page**: Show Preview when `passages.length > 0`; link to `/adventure/[id]/play?preview=1`

## Phase 2: DRAFT-Only

- [x] **quest-grammar.ts**: Replace all `status: 'ACTIVE'` with `status: 'DRAFT'` in adventure-creation paths
- [x] **appendQuestToAdventure**: After append, `db.adventure.update({ where: { id: adventureId }, data: { status: 'DRAFT' } })`

## Phase 3: createPassage API + linkFrom

- [x] **actions.ts**: Extend `createPassage` schema to accept optional `linkFrom` (JSON string)
- [x] Implement after/branch logic: create passage, then update from-passage choices per linkFrom

## Phase 4: ChoiceBuilder + Form Enhancement

- [x] **ChoiceBuilder**: New shared component; props: `choices`, `onChange`, `targetOptions`; rows with text + target dropdown; add/remove
- [x] **CreatePassageForm**: Add Connect from (passage + mode); replace JSON textarea with ChoiceBuilder; pass passages from page
- [x] **EditPassageForm**: Replace JSON textarea with ChoiceBuilder
- [x] **Create page**: Fetch passages; pass to CreatePassageForm

## Phase 5: Verify

- [x] `npm run build` && `npm run check`
- [ ] Manual: Preview DRAFT adventure; create passage (after, branch, standalone)

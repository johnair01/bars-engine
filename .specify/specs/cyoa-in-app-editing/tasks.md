# Tasks: In-App CYOA Editing

## Phase 1: Campaign page DB preference
- [x] Modify `src/app/campaign/page.tsx` to query Adventure `wake-up` (ACTIVE); use startNodeId when set; fallback to file

## Phase 2: Adventure startNodeId edit
- [x] Add `updateAdventureStartNode` server action in `src/app/admin/adventures/actions.ts`
- [x] Create `StartNodeForm` component in `src/app/admin/adventures/[id]/StartNodeForm.tsx`
- [x] Replace static Start Node display with form in Adventure detail page

## Phase 3: Passage edit page
- [x] Create `src/app/admin/adventures/[id]/passages/[passageId]/edit/page.tsx`
- [x] Create `EditPassageForm` and `updatePassage` action

## Phase 4: Wake-Up migration
- [x] Create `scripts/seed-wake-up-adventure.ts`
- [x] Add `npm run seed:wake-up` to package.json

## Verification
- Run `npm run seed:wake-up` (requires DATABASE_URL)
- Open `/campaign` — should load from DB
- Admin → Adventures → wake-up → Edit passage → changes on /campaign
- Edit startNodeId in Adventure settings → campaign starts at new node

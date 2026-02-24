# Task Breakdown: Admin Validation Quests

## Phase 1: Twine Content Generation
- [x] Create `content/stories/admin_tests/the-quick-mint.json` with a 2-passage structure (Start -> End).
- [x] Create `content/stories/admin_tests/the-labyrinth.json` with at least 4 passages and multiple branches.
- [x] Create `content/stories/admin_tests/the-resurrection-loop.json` with clear descriptive text.

## Phase 2: Seed Script Construction
- [x] Create `scripts/seed-admin-tests.ts`.
- [x] Implement file loading for the 3 JSON files.
- [x] Implement `upsert` logic for `TwineStory`.
- [x] Implement `upsert` logic for `CustomBar` linking to the stories.

## Phase 3: Final Verification
- [x] Run `npx tsx scripts/seed-admin-tests.ts` to execute the seed.
- [x] Verify the quests appear in the app and can be executed.

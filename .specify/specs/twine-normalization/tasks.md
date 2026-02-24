# Task Breakdown: Twine JSON Normalization

## Phase 1: The Pipeline
- [x] In `src/lib/schemas.ts`, define `CanonicalTwineStory` interfaces.
- [x] Create and export `normalizeTwineStory(rawJson: any): CanonicalTwineStory`.

## Phase 2: Implementation
- [x] Update `scripts/seed-admin-tests.ts` to call `normalizeTwineStory` on raw JSON before upserting into the DB.
- [x] Update `src/actions/twine.ts` (`getOrCreateRun`) to normalize JSON at runtime to catch any legacy DB rows.
- [x] Remove all fallback logic from `PassageRenderer.tsx`, restoring it to its clean original state but strictly typed.

## Phase 3: Verification
- [x] Run the seed script to overwrite existing corrupted test rows.
- [x] Verify "The Labyrinth" renders correctly on the frontend.

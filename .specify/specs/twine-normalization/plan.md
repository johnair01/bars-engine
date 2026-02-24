# Implementation Plan: Twine JSON Normalization

## Architecture Strategy
We will introduce a strict `CanonicalTwineStory` type and a normalization function (`normalizeTwineStory`). All incoming JSON (whether seeded directly or imported from HTML) will be aggressively piped through this function before being saved to the database or accessed by the UI.

## Component Design

### 1. `src/lib/schemas.ts` Updates
- **Canonical Schema:** Define `CanonicalPassageSchema` and `CanonicalStorySchema` with strict requirements (`cleanText` must exist, links must have `label` and `target`).
- **Normalization Function:** Export `normalizeTwineStory(rawJson: any)`. This function will iterate through passages, mapping `text` to `cleanText` (if missing), and map various link text properties (`text`, `name`) down to `label`.

### 2. `src/actions/twine.ts` Updates
- Intercept the `story.parsedJson` in `getOrCreateRun` and run it through `normalizeTwineStory`. (This acts as a runtime safeguard in case old data exists).

### 3. `src/app/adventures/[id]/play/PassageRenderer.tsx` Updates
- Strip out the deep `||` fallback logic (`{passage.cleanText || passage.text}`).
- Rely purely on the Canonical Schema interface properties. 

### 4. Database Seed Script
- Update `scripts/seed-admin-tests.ts` to push the raw JSON through `normalizeTwineStory` *before* inserting it into the database. This guarantees the DB state is canonical from the start.

## Verification Plan
1. Reset the DB seed data.
2. Visit Labyrinth and verify text displays properly without UI fallbacks.

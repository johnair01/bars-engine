# I Ching Canonical — Quality Control Process

## Overview

Before hexagram content is seeded into `Bar` and used by quest generation, casting ritual, and campaign portals, run QC to ensure consistency and effectiveness.

## 1. Automated validation

```bash
npm run validate:iching
```

**Checks:**
- **Structure**: 64 entries, ids 1–64, required fields present
- **Uniqueness**: Names must be unique (blocking)
- **Tones**: Duplicate tones reported as warnings (portal flavor benefits from distinct tags)
- **Placeholders**: No `[Model refused]` or `[add manually]` text
- **Length**: Very short text (<50 chars) flagged

**Output:** Issues (fail) + warnings (informational) + cross-reference table vs Wilhelm/Baynes names.

## 2. Human review (recommended)

| Step | Action |
|------|--------|
| **Spot-check** | Open 3–5 random hexagrams in `content/iching-canonical.json` and verify text matches the card image |
| **Tone refinement** | If duplicate tones appear, edit to make them distinct (e.g. "Overcoming obstacles" → "Initial obstacles" vs "Biting through" vs "Oppression") |
| **Quest smoke test** | After seeding, generate a quest from a hexagram and confirm the AI uses the oracle text coherently |

## 3. Seed integration

Once QC passes:

1. Update `src/lib/seed-utils.ts` to read `content/iching-canonical.json` and upsert `Bar` records
2. Run `npm run db:seed`
3. Verify campaign portals and casting ritual display correct names/tone

## 4. Ongoing maintenance

- **Re-ingest**: If you get new card images, run `npm run ingest:iching` then `npm run validate:iching`
- **Manual edits**: Edit `content/iching-canonical.json` directly; re-run validation before re-seeding

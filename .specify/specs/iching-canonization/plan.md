# I Ching Canonization — Implementation Plan

## Phase 0: Source selection

1. **Choose canonical source**: Legge (public domain) or Wilhelm/Baynes (common names). Recommend Legge for license clarity; can map to Wilhelm names for display if preferred.
2. **Extract content**: For each hexagram 1–64, obtain:
   - Name (King Wen / Wilhelm style)
   - Tone (one-word or short phrase)
   - Text (advice/interpretation from translation)

## Phase 1: Content file

1. Create `content/iching-canonical.json`:
   ```json
   [
     { "id": 1, "name": "The Creative", "tone": "Strength", "text": "..." },
     ...
   ]
   ```
2. Populate from Legge or chosen source. Script can fetch from sacred-texts or use manual extraction.

## Phase 2: Seed integration

1. Update `runSeed` in `src/lib/seed-utils.ts`:
   - Read `content/iching-canonical.json`
   - For each entry, `prisma.bar.upsert` with id, name, tone, text
   - Fallback: if file missing, keep current placeholder (or fail loudly)
2. Run `npm run db:seed` to apply.

## Phase 3: Verification

1. Campaign lobby: verify 8 portals show distinct names
2. Casting ritual: verify hexagram display
3. Quest generation: verify `hexagramText` in prompt context

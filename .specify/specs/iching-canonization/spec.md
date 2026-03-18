# I Ching Canonization — BLOCKER

## Purpose

Establish a canonical I Ching source for all 64 hexagrams so that:
- Hexagram names, tones, and advice are unique and meaningful
- Campaign portals, casting ritual, and quest generation use consistent content
- Hexagram → CYOA pipeline has proper oracle context

**This spec blocks**: Hexagram content updates, hexagram portal → CYOA pipeline.

---

## Requirements

### FR1: Canonical source

Choose one primary translation for the 64 hexagrams:
- **Legge** (1882, public domain): King Wen names in Legge romanization; available at sacred-texts.com
- **Wilhelm/Baynes** (1950): Widely used; "The Creative", "The Receptive", etc.
- **Other**: Specify if different

### FR2: Content format per hexagram

Each hexagram (id 1–64) must have:
- **name**: Unique display name (e.g. "The Creative", "Khien")
- **tone**: Short thematic tag (e.g. "Strength", "Receptive")
- **text**: Advice/interpretation — unique per hexagram, 1–3 paragraphs

### FR3: Seed/migration

- Create `content/iching-canonical.json` or equivalent with all 64 entries
- Update `src/lib/seed-utils.ts` (or add migration) to populate `Bar` from canonical source
- Idempotent: re-run does not duplicate; updates if source changes

### FR4: Verification

- Campaign portals display unique names and flavor
- Casting ritual shows unique name, tone, text
- Quest grammar receives unique `hexagramText` for AI context

### Related docs

- **Integration plan:** `INTEGRATION_PLAN.md` — seed integration + verification checklist
- **QC process:** `QC_PROCESS.md` — validation before seeding

---

## Reference

- Legge transliterations: https://interglacial.com/~sburke/stuff/legge_yijing_transliterations.html
- Sacred Texts I Ching: https://www.sacred-texts.com/ich/
- Current seed: `src/lib/seed-utils.ts` lines 29–40 (placeholder Bar #1–64)
- Bar model: `prisma/schema.prisma` — `Bar { id, name, tone, text }`

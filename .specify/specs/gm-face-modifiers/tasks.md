# Tasks: GM Face Modifiers

## Phase 1: Schema

- [x] **1.1** Add `GmFaceModifier` model to `prisma/schema.prisma`:
  - face (String, unique)
  - anomalyStyle (String)
  - contactVoice (String) — JSON descriptor
  - interpretationPressure (String) — low|medium|high
  - responseStyle (String) — JSON descriptor
  - artifactAffinity (String)
  - createdAt, updatedAt
  - @@map("gm_face_modifiers")

- [x] **1.2** Run `npm run db:sync` — schema push + Prisma client regenerate

## Phase 2: Seed

- [x] **2.1** Create `scripts/seed-gm-face-modifiers.ts`:
  - Import `./require-db-env` first (ensures DATABASE_URL set)
  - Import `db` from `../src/lib/db`
  - Import `GAME_MASTER_FACES` from `../src/lib/quest-grammar/types`
  - For each face: `db.gmFaceModifier.upsert({ where: { face }, create: {...}, update: {...} })`
  - Use seed data from plan.md (anomalyStyle, contactVoice, interpretationPressure, responseStyle, artifactAffinity per face)
  - Log success/failure

- [x] **2.2** Add `"seed:gm-face-modifiers": "tsx scripts/seed-gm-face-modifiers.ts"` to package.json scripts

- [x] **2.3** Run `npm run seed:gm-face-modifiers` — verify 6 rows created

## Phase 3: Service

- [x] **3.1** Create `src/lib/gm-face-modifiers/index.ts`:
  - Import `db` from `@/lib/db` and `GameMasterFace` from `@/lib/quest-grammar/types`
  - Export `async function getGmFaceModifier(face: GameMasterFace): Promise<GmFaceModifier | null>`
  - Use `db.gmFaceModifier.findUnique({ where: { face } })`
  - Re-export `GmFaceModifier` type from `@prisma/client`

- [x] **3.2** Verify: call `getGmFaceModifier('architect')` in a test or script — returns record with anomalyStyle "patterned"

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] No linter errors in new files
- [x] Seed is idempotent (run twice, same result)

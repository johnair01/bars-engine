# Plan: GM Face Modifiers

## Summary

Add `GmFaceModifier` Prisma model, seed script, and service. One row per Game Master face with modulation metadata (anomaly style, contact voice, etc.). No UI in v0.

---

## Implementation Order

### Phase 1: Schema

1. **`prisma/schema.prisma`**
   - Add model:
     ```prisma
     model GmFaceModifier {
       id                    String   @id @default(cuid())
       face                  String   @unique // shaman|challenger|regent|architect|diplomat|sage
       anomalyStyle          String   // numinous|provocative|official|patterned|social|subtle
       contactVoice          String   // JSON descriptor
       interpretationPressure String // low|medium|high
       responseStyle         String   // JSON descriptor
       artifactAffinity      String   // memory_entry|quest_hook|obligation|orientation|relationship_update|contemplation
       createdAt             DateTime @default(now())
       updatedAt             DateTime @updatedAt

       @@map("gm_face_modifiers")
     }
     ```
   - Run `npm run db:sync` (per .cursorrules)

### Phase 2: Seed

2. **`scripts/seed-gm-face-modifiers.ts`**
   - Import `./require-db-env` first, then `db` from `../src/lib/db`, `GAME_MASTER_FACES` from `../src/lib/quest-grammar/types`
   - For each face: upsert by `face` with default values from spec table
   - Use `db.gmFaceModifier.upsert({ where: { face }, create: {...}, update: {...} })`

3. **`package.json`**
   - Add script: `"seed:gm-face-modifiers": "tsx scripts/seed-gm-face-modifiers.ts"`

### Phase 3: Service

4. **`src/lib/gm-face-modifiers/index.ts`**
   - Export `getGmFaceModifier(face: GameMasterFace): Promise<GmFaceModifier | null>`
   - Use `prisma.gmFaceModifier.findUnique({ where: { face } })`
   - Re-export Prisma `GmFaceModifier` type

---

## File Impacts

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` — add GmFaceModifier |
| Create | `scripts/seed-gm-face-modifiers.ts` |
| Edit | `package.json` — add seed script |
| Create | `src/lib/gm-face-modifiers/index.ts` |

---

## Seed Data (6 faces)

| face | anomalyStyle | contactVoice | interpretationPressure | responseStyle | artifactAffinity |
|------|--------------|--------------|-------------------------|--------------|------------------|
| shaman | numinous | {"tone":"mythic","style":"ritual"} | medium | {"style":"initiation"} | memory_entry |
| challenger | provocative | {"tone":"taunting","style":"daring"} | high | {"style":"testing"} | quest_hook |
| regent | official | {"tone":"authority","style":"jurisdiction"} | high | {"style":"assertion"} | obligation |
| architect | patterned | {"tone":"puzzle","style":"map"} | medium | {"style":"orientation"} | orientation |
| diplomat | social | {"tone":"empathic","style":"inviting"} | low | {"style":"relational"} | relationship_update |
| sage | subtle | {"tone":"quiet","style":"minimal"} | low | {"style":"contemplation"} | contemplation |

---

## Verification

- [ ] `npm run db:sync` succeeds
- [ ] `npm run seed:gm-face-modifiers` runs; 6 rows in gm_face_modifiers
- [ ] `getGmFaceModifier('architect')` returns record
- [ ] `npm run build` and `npm run check` pass

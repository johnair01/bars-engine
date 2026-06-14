# Tasks: BARS v1 — BAR Intake (Capture → Keep → Tune)

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). Check off as you go.
> Run `npm run build` + `npm run check` after each phase (fail-fix).

## Phase 1 — Foundation (server, no migration) — ✅ done (6f62d3d)
- [x] T1.1 Confirm `mergeSeedMetabolization` / `serializeSeedMetabolization` shapes in
      `src/lib/bar-seed-metabolization/parse.ts`.
- [x] T1.2 In `createPlayerBar` (`src/actions/bars.ts`) add to `create({data})`:
      `nation: fieldTint ?? null` + `seedMetabolization` = `{ maturity:'captured', soilKind:'holding_pen' }`.
- [x] T1.3 Same stamp in `createBarForUpload`.
- [x] T1.4 `npm run check` passes; round-trip test confirms stored stamp parses to
      `maturity:'captured'` + element tint persists. (Also: keep threshold lowered 3→1 char.)

## Phase 2 — Capture reskin (`/bars/create`) — ✅ done (6f62d3d)
- [x] T2.1 Rebuilt `CreateBarFormPage` + `page.tsx` as cultivation-surface quick-capture
      (`.cultivation-card` + `card-tokens`); submit logic preserved.
- [x] T2.2 Locked provenance chip: `<time> · <time-of-day>` (client-derived from now; createdAt auto).
- [x] T2.3 Optional 5-sigil field-tint row (火 水 木 金 土) → sets `nation` + tints card live.
- [x] T2.4 Photo + inspiration (`socialLinks[]`) affordances preserved behind the media toggle.
      ⚠️ Photo Blob upload path unverified locally (no `BLOB_READ_WRITE_TOKEN`); code unchanged.
- [x] T2.5 CTA exactly **"Keep · tune later"**, disabled until ≥1 char or a photo.
- [x] T2.6 Kept confirmation ("A seed is on the board") → "To the board" `/bars`; secondary "Tune now →".
- [x] T2.7 `npm run check` passes (0 errors); route serves 200 with new copy.

## Phase 3 — Tune gate (`/bars/[id]/tune`)
- [ ] T3.1 Add `tuneBar(barId, patch)` to `src/actions/bars.ts` per spec contract; owner-guard +
      type ∈ {'bar','charge_capture'}; `revalidatePath` x3.
- [ ] T3.2 Advance maturity via `updateBarSeedMaturity` **imported from
      `src/actions/bar-seed-metabolization.ts`** (C1); forward-clamp only.
- [ ] T3.3 New `src/app/bars/[id]/tune/page.tsx` + `TuneBarClient.tsx`: live `CultivationCard`
      (`data-element`/`data-altitude`), maturity ladder, 4 channel chip groups, optimistic + reconcile.
- [ ] T3.4 Add fully-tuned gate to `growQuestFromBar()` (keep nation/archetype guard).
- [ ] T3.5 `npm run build` + `npm run check`.

## Phase 4 — Wire & dogfood
- [ ] T4.1 Board + detail show maturity dot; "tune now" affordance from board.
- [ ] T4.2 Graduate affordance appears only when ready → routes into the quest.
- [ ] T4.3 Smoke test the full Capture → Keep → Tune → graduate loop.

## Phase 5 — Open Up (C2/C3) — own slice
- [ ] T5.1 Add `'openUp'` to `PersonalMoveType` (`src/lib/quest-grammar/types.ts:129`).
- [ ] T5.2 Update `ALL_WAVE_MOVES` (`compileQuestCore.ts:81`), `VALID_STAGES`
      (`archetype-wave.ts:13`), `deriveBarDraftFrom321.ts` unions+mapper, `JourneyStage`
      (`daoe/types.ts:81`).
- [ ] T5.3 Add 5th glyph to `src/lib/ui/move-icons.ts`; update any move-enumerating UI.
- [ ] T5.4 Update schema comments `prisma/schema.prisma:2867, 3473`.
- [ ] T5.5 Mirror union changes in `packages/bars-core/src/quest-grammar/` (C3).
- [ ] T5.6 Update `.agent/context/emotional-alchemy-ontology.md` (Open stage + rows).
- [ ] T5.7 Add liminal-accented Open Up chip to Tune; order Wake·Open·Clean·Grow·Show.
- [ ] T5.8 `npm run build` + `npm run check` (watch quest compilation).

## Phase 6 — Stories composer (the one migration) — own slice
- [ ] T6.1 Add `captureDesign String?` to `model CustomBar` in `prisma/schema.prisma`.
- [ ] T6.2 `npx prisma migrate dev --name add_capturedesign_to_custombar`; commit
      `prisma/migrations/…` with `schema.prisma`.
- [ ] T6.3 `npm run db:sync`; `npm run db:record-schema-hash`.
- [ ] T6.4 `saveCaptureDesign(barId, design)` in `src/actions/bars.ts` (owner-guarded; no maturity change).
- [ ] T6.5 Composer component: port "V1 · live" canvas from `BARS Intake and Decks.dc.html`
      (drag by %, recolor, resize 11–46, background swap).
- [ ] T6.6 Image export (satori/`@vercel/og` or `html-to-image`, 1080×1350 / 1080×1920); no `public/` writes.
- [ ] T6.7 Video export fast-follow; feed `captureDesign` to MPC face + deck entry.
- [ ] T6.8 `npm run build` + `npm run check`.

## Phase 7 — Decks / Print / QR — staged
- [ ] T7.1 Deck authoring/browsing; publish gated to vetted-author allow-list.
- [ ] T7.2 MPC export 822×1122 px @ 300 dpi; front = `CultivationCard`/`captureDesign`; back = QR.
- [ ] T7.3 QR round-trip via existing `/bar/share/<token>` + `claimBarShareExternal`.

## Verification quest (required — UX feature)
- [ ] T8.1 Twine story (one passage per step) + `CustomBar` `cert-bars-intake-tune-v1`
      (`isSystem:true`, `visibility:'public'`).
- [ ] T8.2 Idempotent `scripts/seed-cert-bars-intake-tune.ts` + npm script `seed:cert:bars-intake-tune`.
- [ ] T8.3 Narrative framed toward the Bruised Banana residency (front door for guests).

## Backlog
- [ ] T9.1 Add this spec to `.specify/backlog/BACKLOG.md`; run `npm run backlog:seed`.

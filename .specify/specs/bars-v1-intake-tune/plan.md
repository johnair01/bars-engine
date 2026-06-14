# Plan: BARS v1 — BAR Intake (Capture → Keep → Tune)

> Implement per [spec.md](./spec.md). API-first: define/extend the actions before UI.
> Corrections C1–C3 from `design/.../RECONCILIATION.md` are folded in.

## Architectural strategy

The engine already has the spine (intake route, create actions, `CustomBar` with every channel
column, BSM state machine). This is **reskin + wire**, not new infrastructure. Build server-side
first (maturity stamp, `tuneBar`), then the two screens, then the wider slices. Only Phase 5 touches
Prisma.

## File impact map

### Phase 1 — Foundation (server, no migration)
- `src/actions/bars.ts` — in `createPlayerBar` + `createBarForUpload`, add to the `create({data})`
  payload: `nation: fieldTint ?? null` and `seedMetabolization` from
  `mergeSeedMetabolization({ maturity:'captured', soilKind:'holding_pen' })`.
- `src/lib/bar-seed-metabolization/parse.ts` — reuse `mergeSeedMetabolization`/`serialize` (no change
  expected; verify shape).

### Phase 2 — Capture reskin
- `src/app/bars/create/page.tsx` + `src/components/CreateBarForm.tsx` (and/or `CreateBarFormPage`)
  — rebuild as cultivation-surface quick-capture; keep submit logic intact. Add provenance chip,
  optional field-tint sigil row, "Keep · tune later" CTA.
- New: a Kept confirmation (lightweight interstitial or toast-then-redirect) → `/bars`, secondary
  "Tune now →".
- Styling via `src/styles/cultivation-cards.css` + `src/lib/ui/card-tokens.ts`. Tailwind layout only.

### Phase 3 — Tune gate
- `src/actions/bars.ts` — add `tuneBar()` (contract in spec). Import `updateBarSeedMaturity` from
  `src/actions/bar-seed-metabolization.ts` (**C1**).
- New route `src/app/bars/[id]/tune/page.tsx` (server) + `TuneBarClient.tsx` (client) with live
  `CultivationCard` preview, maturity ladder, four channel chip groups (optimistic + reconcile).
- `src/actions/bars.ts` `growQuestFromBar()` — add fully-tuned gate alongside the existing
  nation/archetype guard.
- Evolve `src/components/bars/BarCardFace.tsx` for `data-element` / `data-altitude` if needed.

### Phase 4 — Open Up (C2/C3 — wider than README §7 implies)
- `src/lib/quest-grammar/types.ts:129` — add `'openUp'` to `PersonalMoveType`.
- `src/lib/quest-grammar/compileQuestCore.ts:81` (`ALL_WAVE_MOVES`),
  `src/lib/quest-grammar/archetype-wave.ts:13` (`VALID_STAGES`),
  `src/lib/quest-grammar/deriveBarDraftFrom321.ts:13,38,53` (unions + mapper).
- `src/lib/daoe/types.ts:81` — `JourneyStage` parallel union.
- `src/lib/ui/move-icons.ts` — 5th glyph; `src/components/dashboard/OrientationCompass.tsx` if it
  enumerates moves.
- `prisma/schema.prisma:2867, 3473` — update `// wakeUp | cleanUp | growUp | showUp` comments.
- `packages/bars-core/src/quest-grammar/` — mirror the union changes (duplicate tree, **C3**).
- `.agent/context/emotional-alchemy-ontology.md` — add Open stage + move rows.
- Order everywhere: **Wake · Open · Clean · Grow · Show**.

### Phase 5 — Stories composer (the only migration)
- `prisma/schema.prisma` `model CustomBar` — add `captureDesign String?`.
- `src/actions/bars.ts` — `saveCaptureDesign(barId, design)` (owner-guarded; no maturity change).
- New composer component (port "V1 · live" canvas from `BARS Intake and Decks.dc.html`): drag by %,
  recolor, resize (11–46), background swap.
- Export: image (satori/`@vercel/og` or `html-to-image`) → video fast-follow → MPC face/deck feed.

### Phase 6 — Decks / Print / QR (staged)
- Deck authoring/browsing; publish action gated to vetted author allow-list.
- MPC export (822×1122 @ 300 dpi). Reuse `/bar/share/<token>` + `claimBarShareExternal` for QR.

### Verification quest
- Twine passages (one per step) + `CustomBar` (`isSystem:true`, `visibility:'public'`, id
  `cert-bars-intake-tune-v1`); idempotent seed script `scripts/seed-cert-bars-intake-tune.ts`;
  npm script `seed:cert:bars-intake-tune`. Reference `scripts/seed-cyoa-certification-quests.ts`.

## Trade-offs & risks
- **Open Up blast radius (C2/C3)**: a union edit touches quest compilation + a duplicated tree. Ship
  Phase 4 as its own slice with `npm run check` after each file; do not bundle with the core loop.
- **Duplicate quest-grammar**: confirm which tree is authoritative before editing; land in both to
  avoid drift.
- **Export in serverless**: no `public/` writes — render to Blob or return the buffer.

## Build order (matches handoff Blocks 1–5)
1. Foundation (~1.5h) → 2. Capture reskin (~2h) → 3. Tune gate (~2.5h) →
4. Wire/polish/dogfood (~1h) → [Open Up slice] → [Stories slice] → [Decks/Print/QR].

## Verification per phase
- After each phase: `npm run build` and `npm run check` (fail-fix).
- After Phase 5 schema edit: `npx prisma migrate dev --name add_capturedesign_to_custombar`,
  commit migration, `npm run db:sync`, `npm run db:record-schema-hash`.

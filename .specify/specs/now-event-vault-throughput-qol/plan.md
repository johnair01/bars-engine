# Plan: NOW / Event / Vault throughput QOL (NEV)

## Phase 1 — Schema + charge lifecycle

1. Prisma: `Shadow321Session.chargeSourceBarId` (optional string, no FK to avoid migration ordering issues — optional index later).
2. `persist321Session`: persist field; archive charge when outcome metabolizes and id set.
3. `createQuestFrom321Metadata`, `fuelSystemFrom321`, `awakenDaemonFrom321`: thread optional charge id.
4. `growQuestFromBar`: archive `charge_capture` after quest mint.
5. `getTodayCharge`: `archivedAt: null`.

## Phase 2 — UI (NOW + Vault)

1. `OrientationCompass`: raise contrast (border, bg, label colors, reduce “fade” on inactive quadrants).
2. `src/app/hand/page.tsx`: CTA → `/bars/create`, label/description match Create BAR intent.
3. `src/app/page.tsx`: add Residency events link adjacent to compass / handbook line.

## Phase 3 — Event page IA + bingo modals

1. `event/page.tsx`: move `BruisedBananaApr2026EventBlocks` below Wake Up section.
2. Wrap dense sections (e.g. fundraiser, Show Up) in `<details>` with sensible summaries.
3. New client component: modal shell + `PartyMiniGameGridInteractive`; replace inline grids in `BruisedBananaApr2026EventBlocks`.

## Phase 4 — Verification

1. Extend `scripts/seed-cyoa-certification-quests.ts` with `cert-now-event-vault-qol-v1`.
2. `npm run seed:cert:now-event-vault-qol` script in `package.json`.

## File impact

| Area | Files |
|------|--------|
| Schema | `prisma/schema.prisma`, new `prisma/migrations/*_charge_source_on_321_session/` |
| Actions | `charge-metabolism.ts`, `charge-capture.ts`, `bars.ts`, `daemons.ts` |
| 321 UI | `shadow/321/page.tsx`, `Shadow321Runner.tsx`, `Shadow321Form.tsx` |
| Dashboard | `OrientationCompass.tsx`, `page.tsx` |
| Vault | `hand/page.tsx` |
| Event | `event/page.tsx`, `BruisedBananaApr2026EventBlocks.tsx`, new `PartyMiniGameInModal.tsx` |
| Seeds | `seed-cyoa-certification-quests.ts`, `package.json` |

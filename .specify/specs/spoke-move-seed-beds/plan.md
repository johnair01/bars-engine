# Plan: Spoke move seed beds

Implement per [.specify/specs/spoke-move-seed-beds/spec.md](./spec.md).

## Phase 1 — Contracts + data + one spoke slice

1. **Schema decision** — Prefer normalized table e.g. `SpokeMoveBed` (`campaignRef`, `spokeIndex`, `moveType`) + `SpokeMoveBedKernel` (`bedId`, `campaignKernelBarId`, `role: 'anchor' | 'additional'`, `lineageParentId` nullable for future C). Alternative: JSON blob on `Instance` — document trade-off in tasks; choose one before UI.
2. **Provenance** — Link **spoke BAR** to `(campaignRef, spokeIndex, moveType)` via existing hub journey fields + emit BAR id (extend `storyProgress` or `PlayerAdventureProgress.stateData` / new `SpokeBarCompletion` row).
3. **Gate spoke completion** — Align portal adventure flow: **commit progress** only after successful `emitBarFromPassage` (or equivalent) for that spoke attempt; document interaction with resume.
4. **Server actions** — Implement `getSpokeMoveBeds`, `plantKernelFromBar`, `adminReassignBedAnchor` (or extend `campaign-bar.ts` with namespaced exports).
5. **Nursery UI** — Minimal page: `/campaign/[ref]/spoke/[n]/seeds` or section on [`/campaign/landing`](../campaign-hub-spoke-landing-architecture/spec.md) — four columns or tabs; list kernels; plant picker (vault BARs).
6. **Quality gate** — Server-side validation on kernel title/description from BAR.
7. **Verification quest** — `cert-spoke-move-seed-beds-v1` + npm script.

## Phase 2 — Scale + C hooks

- Hub links to nursery per spoke; deep links; optional lineage UI.
- Spec revision for **interpretation C** when forest/versioning is scheduled.

## File impacts (expected)

- `prisma/schema.prisma` (if new tables)
- `src/actions/campaign-bar.ts` — extend or sibling `spoke-move-seeds.ts`
- `src/app/campaign/...` — nursery route(s)
- `src/components/campaign/` — `SpokeMoveBedGrid` or similar
- `src/app/adventure/[id]/play/AdventurePlayer.tsx` — completion gate hooks (coordinate with CHS)
- `scripts/seed-cyoa-certification-quests.ts` — cert entry

## Related work (already shipped / parallel)

- Hub orientation UX and hub context strip (CHS player experience).
- `campaign_kernel` + watering pipeline (existing).

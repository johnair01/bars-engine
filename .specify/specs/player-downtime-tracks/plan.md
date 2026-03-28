# Plan — Player downtime tracks

Implement per [spec.md](./spec.md). **Catalog + escalation rules** first, **persistence**, **minimal board UI**, **verification quest**.

## Phase 1 — Domain layer

1. **`src/lib/downtime-tracks/catalog.ts`** — default track definitions (ids, labels, quadrant).
2. **`src/lib/downtime-tracks/escalation.ts`** — pure function: `activeCount → strain or cost`.
3. **`src/lib/downtime-tracks/outcomes.ts`** — map (track × strain) → outcome band + flavor strings (deterministic v0).

## Phase 2 — Persistence

1. Choose: **`PlayerDowntimeCycle`** model **or** JSON column on `Player` — prefer **table** if querying by instance for stewards later.
2. Migration + `npm run db:sync`.

## Phase 3 — Actions + API

1. **`src/actions/downtime-tracks.ts`**: `getDowntimeBoard`, `submitDowntimeCycle`.
2. Optional **`GET`** handler for external tools — defer unless needed.

## Phase 4 — UI

1. **`src/app/hand/`** section or **`/campaign/...`** surface: **DowntimeBoard** client + server wrapper.
2. UI Covenant: cultivation-cards, single primary CTA per section.

## Phase 5 — Integration

1. Optional: on submit, **create BAR** draft or **append quest thread** — behind flag `instance.features.downtimeEmitsBar`.

## File impact (expected)

| File | Change |
|------|--------|
| `src/lib/downtime-tracks/*` | New |
| `src/actions/downtime-tracks.ts` | New |
| `prisma/schema.prisma` | New model or field |
| `src/components/downtime/*` | New |
| `src/app/hand/page.tsx` or campaign route | Wire section |

## Out of scope (defer)

- Real dice / DC 5–20 simulation
- Bardic-inspiration-style resource locks tied to rest rules
- PvP or competitive downtime

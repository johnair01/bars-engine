# Plan: BAR Response + Threading Model v0 (RACI)

## Phase 1 — Schema
- Add `intent`, `raciRole`, `parentResponseId`, `depth` to `BarResponse`
- `npm run db:sync`

## Phase 2 — Library
- `src/lib/bar-raci.ts`: `RACI_INTENTS`, `intentToRaciRole()`, types (`BarIntent`, `RaciRole`, `BarThreadNode`, `BarRoles`)

## Phase 3 — Actions
- `src/actions/bar-responses.ts`: `respondToBar`, `getBarThread`, `getBarRoles`

## File impacts
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 4 fields to `BarResponse` |
| `src/lib/bar-raci.ts` | New — RACI logic + types |
| `src/actions/bar-responses.ts` | New — 3 server actions |

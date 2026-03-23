# Tasks: BAR Response + Threading Model v0 (RACI)

## Phase 1: Schema

- [x] **GA-1.1** Add `intent String?`, `raciRole String?`, `parentResponseId String?`, `depth Int @default(0)` to `BarResponse` in `prisma/schema.prisma`
- [x] **GA-1.2** Self-referential relation: `parentResponse BarResponse?` + `replies BarResponse[]`
- [x] **GA-1.3** `npm run db:sync`

## Phase 2: Library

- [x] **GA-2.1** `src/lib/bar-raci.ts` — `BarIntent` union type, `RaciRole` type, `intentToRaciRole()`, `RACI_INTENTS` constant
- [x] **GA-2.2** `BarThreadNode` and `BarRoles` types exported from same file

## Phase 3: Actions

- [x] **GA-3.1** `src/actions/bar-responses.ts` — `respondToBar(input)`: create/update response, derive raciRole, enforce depth ≤ 1
- [x] **GA-3.2** `getBarThread(barId)` — bar + depth-0 responses with depth-1 replies
- [x] **GA-3.3** `getBarRoles(barId)` — RACI-mapped participant lists

## Verification

- [x] `npx tsc --noEmit` passes
- [x] `npx eslint` passes on modified files

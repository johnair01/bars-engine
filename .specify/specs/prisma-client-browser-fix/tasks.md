# Tasks: Prisma Client Browser Fix

## Phase 1: API + Server Action

- [x] Add `compileQuestWithPrivilegingAction(input: QuestCompileInput): Promise<SerializableQuestPacket | { error: string }>` to `src/actions/quest-grammar.ts`
- [x] Import `compileQuestWithPrivileging` from `@/lib/quest-grammar/compileQuest`; call it; strip `telemetryHooks`; return packet or `{ error }`

## Phase 2: Client Wiring

- [x] **UpgradeQuestToCYOAFlow**: Uses action; no lib import of `compileQuestWithPrivileging`
- [x] **GenerationFlow**: Same — uses `compileQuestWithPrivilegingAction`

## Phase 3: Module Split (FR3 — no client imports lib that uses db)

- [x] Create `compileQuestCore.ts` with pure `compileQuest` (no db)
- [x] Update `compileQuest.ts` to only export `compileQuestWithPrivileging` (server-only)
- [x] Update `index.ts`: export `compileQuest` from `compileQuestCore`; remove `compileQuestWithPrivileging` from index
- [x] Update `buildQuestPromptContext.ts`, `actions/quest-grammar.ts`, `__tests__/compileQuest.test.ts` imports

## Phase 4: Verify

- [x] `npm run build` && `npm run check`
- [x] `npm run test:quest-grammar` — all tests pass
- [ ] Manual: Compile & preview (Upgrade flow); Generate step (Quest Grammar flow) — no Prisma browser error

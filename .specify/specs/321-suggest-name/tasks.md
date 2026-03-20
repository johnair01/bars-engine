# Tasks: 321 Suggest Name — Grammar + NPC / Daemon Bridge

## Phase 1–4: Name grammar (baseline)

- [x] Create `src/lib/shadow-name-grammar.ts` with 6-face vocab
- [x] Implement `deriveShadowName(chargeDescription, maskShape): string`
- [x] Port grammar to Python; deterministic primary path
- [x] Frontend instant suggest; API timeout for consumers
- [x] `npm run build` + `npm run check`
- [ ] Manual: single suggest fast; same input = same name **before** attempt feature

## Phase 5: Multi-suggest (attempt / variant)

- [x] Add optional `attempt` parameter to `deriveShadowName` (default `0`); document hash mixing (`shadowNameHashPayload`)
- [x] Mirror in `backend/app/shadow_name_grammar.py`
- [x] `Shadow321Runner`: track `suggestionAttempt`, increment on Suggest Name; pass to `deriveShadowName`
- [x] Reset `suggestionAttempt` when `chargeDescription` or `maskShape` changes (`useEffect`)
- [x] Tests: `npm run test:shadow-name-grammar`; `backend/tests/test_shadow_name_grammar.py`
- [x] API: `ShamanSuggestShadowNameRequest.attempt`, `suggestShadowName(..., attempt)` in `agents.ts`

## Phase 6: Persist resolution on `Shadow321Session`

- [x] Prisma: `finalShadowName`, `nameResolution`, `suggestionCount` (+ migration `20260317120000_shadow_321_session_name_resolution`)
- [x] `computeShadow321NameFields` in `src/lib/shadow321-name-resolution.ts`; `shadow321Name` on `Shadow321SessionInput`
- [x] `Shadow321Runner` / `Shadow321Form` / create-bar-from-321 → `persist321Session` / `createQuestFrom321Metadata` / `fuelSystemFrom321`
- [ ] Link row to existing `ShadowNameFeedback` if helpful for SNL backlog (optional)

## Phase 7: NPC merge (inner work → matching NPCs)

- [x] Prisma: `Npc321InnerWorkMerge` + FKs + `@@unique([shadow321SessionId, npcPlayerId])` + migration `20260421120000_npc_321_inner_work_merges`
- [x] `resolve321MatchNationArchetype` + `merge321NameIntoMatchingNpcs` in `src/actions/npc321-inner-work-merge.ts`
- [x] Wired from `persist321Session` when `shadow321Name` set (non-blocking on failure)
- [x] Privacy: `truncateChargeExcerpt` (q1 only, max 200); optional `alignedAction` / `moveType` caps in `metadataKeys`
- [ ] Run `npx tsx scripts/with-env.ts "npx prisma migrate deploy"` then verify: `seed-simulated-players` + complete 321 with same nation/archetype as an agent
- [x] Debug script: `npm run report:npc321-merges` / `npm run report:npc321-merges -- --limit 50`; or `npx tsx scripts/with-env.ts "npx tsx scripts/report-npc321-merges.ts"` when `.env.local` isn’t loaded in the shell
- [ ] Optional: admin UI to list `npc_321_inner_work_merges`

## Phase 8: Daemon ↔ NPC bridge (after Phase 7)

- [x] Prisma: `Daemon.shadow321SessionId`, `innerWorkDigest`, `promotedToPlayerId` (unique) + migration `20260421130000_daemon_321_phase8`
- [x] `getDaemonNpcPromotionMinLevel()` — `src/lib/daemon-npc-constants.ts` (`DAEMON_NPC_PROMOTION_MIN_LEVEL`, default **5**)
- [x] `awakenDaemonFrom321` — `persist321Session` outcome `daemon_awakened` → create daemon with session + digest; **Shadow321Runner** artifact path
- [x] `maybePromoteDaemonToNpc`, `advanceDaemonLevel` — Grow Up / school can call `advanceDaemonLevel` later
- [x] `discoverDaemon` metadata: optional `shadow321SessionId`, `innerWorkDigest` (simplified 321 / bar paths unchanged)
- [ ] Run `npx tsx scripts/with-env.ts "npx prisma migrate deploy"`
- [ ] Optional: Daemons UI shows session link + promoted NPC; wire school quests to `advanceDaemonLevel`

## Phase 9: Verification

- [ ] Full build / check / backend tests
- [ ] Manual QA: multi-suggest → accept vs edit → DB shows merges for matching NPC

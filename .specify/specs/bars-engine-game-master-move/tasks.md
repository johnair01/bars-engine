# Tasks: BARS Engine — Game Master Move

## Types & shared libs

- [ ] `GmWaveMove` + map to/from `BarWavePhase`
- [ ] `Artifact`, `QuestProposal`, `PlayerQuestContext` types (`src/lib/game-master-quest/` or `bar-forge`)
- [ ] Zod schemas for move, resolve, collective-context query/response

## `GET /api/game-master/collective-context`

- [ ] Resolve `instanceId` or `campaignRef` → `Instance`
- [ ] Return kotter stage, domains, hub state subset per auth
- [ ] Tests or manual checklist

## `POST /api/game-master/move`

- [ ] Route + auth (reuse `barsApiAuth` where appropriate)
- [ ] Optional `context` merge for grounded moves
- [ ] `clean_up` + `wake_up` behavior; stubs for `grow_up` / `show_up`

## `POST /api/game-master/resolve-quest`

- [ ] Load player + instance; validate ids
- [ ] Pull BARs from registry ids + inline bars
- [ ] Integrate `matchBarToQuests` (or internals) + ranking
- [ ] Attach `presentingFace`, `artifactPrize` per proposal
- [ ] `maxProposals`, optional `preferFaces`

## Quest completion → artifact (when ready)

- [ ] Choose persistence (inventory / BAR / ledger)
- [ ] Server action or `POST /api/quests/[questId]/complete`

## Docs

- [ ] [openapi/bars-engine-gm-quest.yaml](../../openapi/bars-engine-gm-quest.yaml) matches implemented routes
- [ ] `docs/BAR_FORGE_API.md` link to GM quest spec/OpenAPI

## Verify

- [ ] `npm run build` && `npm run check`
- [ ] `npm run db:sync` only if schema changes

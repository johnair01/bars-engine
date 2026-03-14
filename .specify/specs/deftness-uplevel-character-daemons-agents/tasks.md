# Tasks: Deftness Uplevel — Character, Daemons, and Agent Coordination

## DC-2: Archetype Playbooks

- [x] Verify NationMove has archetypeId; seed for 8 archetypes if missing
- [x] Implement getPlaybookForArchetype(archetypeId)
- [x] Implement getPlaybookForPlayer(playerId)
- [x] Surface "Your Playbook" in Archetype modal or character view
- [x] Run `npm run build` and `npm run check`

## DC-1: Ouroboros Character Interview

- [x] Create interview nodes (Adventure or Passage)
- [x] Implement getOuroborosInterviewState, advanceOuroborosInterview
- [x] Build OuroborosInterview component
- [x] Add route /character/create or /onboarding/character
- [x] On completion: persist archetypeId, nationId, campaignDomainPreference, avatarConfig
- [ ] Add cert-ouroboros-character-interview-v1 verification quest
- [x] Run `npm run build` and `npm run check`

## DC-3: Daemons System

- [x] Add Daemon, DaemonSummon models to schema
- [x] Run `npm run db:sync`
- [x] Implement discoverDaemon, summonDaemon, getActiveDaemonMoves
- [x] Create 321 Wake Up flow (variant of Shadow321Form)
- [x] Create ritual flow for summoning
- [x] Implement duration/dismissal (expiresAt check)
- [x] Integrate daemon moves into nation-moves application
- [x] Add Daemons nav link to dashboard Get Started
- [ ] Add Grow Up school leveling (Phase 3b)
- [ ] Add cert-daemons-discovery-v1 verification quest
- [x] Run `npm run build` and `npm run check`

## DC-4: Agent-Domain Backlog Ownership

- [x] Add ownerFace to backlog model (DB or BACKLOG.md format)
- [x] Implement assignBacklogItemOwner, getBacklogItemsByOwner
- [x] Admin UI: assign owner when viewing backlog
- [ ] Agent context builder: include owned items when face known
- [x] Run `npm run build` and `npm run check`

## DC-5: Sage Coordination Protocol

- [ ] Implement getSageCoordinationSuggestions
- [ ] Extend sage:brief to output assignment suggestions
- [ ] Add convergence detection
- [ ] Optional: runSageSynthesis
- [ ] Run `npm run build` and `npm run check`

## DC-6: Six-Face Parallel Handling

- [ ] Document manual decomposition protocol (v0)
- [ ] Implement decomposeFeature (v1)
- [ ] Implement runParallelFeatureWork (v1)
- [ ] Implement synthesizeFeatureOutputs (v1)
- [ ] Full pipeline (v2) — when resource allows
- [ ] Run `npm run build` and `npm run check`

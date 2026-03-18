# Tasks: NPC & Simulated Player Content Ecology

## Phase 1: Single-Player Companionship

- [x] Flesh out proposeActorAction per simulated-collaborators plan
- [x] Add getActorGuidance(flow, currentNodeId, roleId, questState)
- [x] Wire actor guidance into onboarding/quest flows
- [x] UI: "Librarian suggests…" (simulated) — clear labeling
- [x] Verify single-player can receive guidance in at least one flow

## Phase 2: Simulated Player Cohort

- [x] Add creatorType or isAgent to Player schema
- [x] Run npm run db:sync after schema change
- [x] Seed script: create N simulated players (varied nation/archetype)
- [ ] Run simulateAgentGameLoop for cohort; validate output
- [ ] Optional: admin UI to view/run simulation

## Phase 3: NPC Content Proposal

- [x] Agent-facing entry point to BAR/quest pipeline
- [x] Persona-driven generation (nation, archetype, goal)
- [x] Admin approval gate before publication
- [x] Schema: proposedByAgentId on BAR/quest records
- [x] Clear provenance on agent-created artifacts

## Verification

- [ ] npm run build and npm run check pass
- [ ] Backend tests pass if modified

# Spec: Onboarding Flow Completion + First Playtest Quest

**Source**: External spec kit (onboarding_spec_kit.md). Integrated with current BARS Engine per [ANALYSIS.md](./ANALYSIS.md).

## Purpose

Unblock shipping the Bruised Banana onboarding flow so real players can:

1. Complete onboarding
2. Generate starter quests
3. Complete their first quest
4. Produce observable system effects

**Practice**: Deftness Development — API-first, contract before UI, extend existing models.

## Design Decisions

| Topic | Decision |
|-------|----------|
| onboarding_state | Derive from storyProgress + flags, or add optional Player field. No parallel state machine. |
| API routes | GET /api/onboarding/state, POST /api/onboarding/advance. Server Actions primary; routes for external. |
| Nation/Archetype | Use existing Nation, Playbook. Extend fields if needed. No new tables. |
| Starter quests | Reuse getStarterQuestsForPlayer, assignOrientationThreads. Optional POST /api/quests/generate-starter. |
| Strengthen the Residency | Extend Twine with 4 completion branches. Wire completionEffects to visible effects. |
| Emotional grammar | Reuse resolveMoveForContext. No HTTP API unless external. |

## Functional Requirements

### FR1: Onboarding State API

- `GET /api/onboarding/state` returns `{ playerId, onboardingState, nationId, playbookId, campaignDomainPreference, hasLens }`.
- `onboardingState` is one of: `new_player`, `campaign_intro`, `identity_setup`, `vector_declaration`, `onboarding_complete`, `starter_quests_generated`.
- Derive from Player fields + storyProgress + thread progress.

### FR2: Advance Onboarding API

- `POST /api/onboarding/advance` accepts `{ event }`.
- Valid events: `campaign_intro_viewed`, `nation_selected`, `archetype_selected`, `developmental_lens_selected`, `intended_impact_selected`, `bar_created`, `onboarding_completed`, `starter_quests_generated`.
- Server validates event, updates state via existing flows. Returns `{ success, onboardingState, error }`.

### FR3: Strengthen the Residency — 4 Completion Options

- Quest has 4 branches: Contribute Support, Invite an Ally, Share Feedback, Share the Campaign.
- Each branch sets completion type in inputs.
- completionEffects branches on type to trigger: vibeulon mint, funding signal, invite count, feedback log.

### FR4: Visible System Effects

- Quest completion triggers at least one observable effect: funding progress, invite counter, activity feed, vibeulons minted.
- Effects update campaign UI (revalidatePath).

## Acceptance Criteria

A new player can:

1. Complete onboarding
2. Generate starter quests automatically (existing)
3. See Nation, Archetype, Intended Impact (existing data; optional Campaign Entry UI)
4. Receive "Strengthen the Residency" quest (existing)
5. Complete the quest using at least one of 4 options
6. Observe a visible campaign change
7. Mint vibeulons through participation (existing)

## Non-Goals

- Campaign map layer 2
- Phase transition system
- Advanced procedural quest generation
- BAR → quest generator
- Quest dependency graphs

## References

- [ANALYSIS.md](./ANALYSIS.md) — integration mapping
- [starter-quest-generator](../starter-quest-generator/spec.md)
- [docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md](../../docs/STARTER_QUEST_GENERATOR_INTEGRATION_ANALYSIS.md)

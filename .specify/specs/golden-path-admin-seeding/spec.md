# Spec: Golden Path Admin Seeding

**Source**: [GAP_ANALYSIS_GM_FACES.md](../golden-path-onboarding-action-loop/GAP_ANALYSIS_GM_FACES.md) — Regent priority 7, 8.

## Purpose

Simplify admin seeding: 5 starter quests, one milestone, campaign description. "Seed campaign in 30 min" flow. Current seeding is scattered (seed-onboarding-thread, seed-bruised-banana-adventure). Enforce quest grammar: action, successCondition.

**Practice**: Deftness Development — deterministic scripts, spec kit first.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Script | `scripts/seed-golden-path-campaign.ts` — one script to seed instance with 5 starter quests, milestone, description |
| Quest grammar | CustomBar: use description for action; add `successCondition String?` or encode in metadata |
| Input | Instance slug or id; optional override for quest titles |
| Output | 5 CustomBars (quests), linked to thread; instance updated with targetDescription |

## API Contracts

### Seed script (CLI)

**Input**: `npx tsx scripts/seed-golden-path-campaign.ts --instance=bruised-banana`  
**Output**: Log of created quests, milestone, instance update

## Functional Requirements

### FR1: Quest grammar

- Ensure CustomBar has or uses: action (description or new field), successCondition (new field or metadata)
- Add `successCondition String?` to CustomBar if not present
- Run `npm run db:sync` if schema change

### FR2: seed-golden-path-campaign script

- Create script that: creates 5 starter quests with action + successCondition, links to orientation thread, updates instance targetDescription
- Idempotent where possible (skip if quests exist)
- Log created IDs

### FR3: npm script

- Add `seed:golden-path` or `seed:campaign` to package.json

## Out of Scope (v0)

- Admin UI for seeding
- Dynamic quest generation

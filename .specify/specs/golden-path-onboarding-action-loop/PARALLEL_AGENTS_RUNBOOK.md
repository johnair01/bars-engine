# Golden Path — Parallel Agent Runbook

**Purpose**: Run 7 agents in parallel, each implementing one golden path stream. Each agent gets one backlog prompt.

## How to Launch

Open 7 Cursor agent sessions (or Composer tabs) and paste the corresponding prompt into each. Agents can run simultaneously; schema changes (Invite, PlayerQuest, CustomBar, NextActionBridge) are on different models — coordinate `npm run db:sync` if multiple agents touch schema (run once after all schema edits, or have one agent own schema).

## Agent Assignments

| Agent | Stream | Prompt | Key Files |
|-------|--------|--------|-----------|
| **1** | Invitation Shape | [golden-path-invitation-shape.md](../../backlog/prompts/golden-path-invitation-shape.md) | prisma/schema.prisma (Invite), src/actions/ |
| **2** | Campaign Landing | [golden-path-campaign-landing.md](../../backlog/prompts/golden-path-campaign-landing.md) | src/app/campaigns/[slug]/landing/ |
| **3** | Friction | [golden-path-friction.md](../../backlog/prompts/golden-path-friction.md) | prisma/schema.prisma (PlayerQuest), QuestDetailModal |
| **4** | Cleanup → BAR | [golden-path-cleanup-bar.md](../../backlog/prompts/golden-path-cleanup-bar.md) | emotional-first-aid.ts, charge-metabolism.ts, Shadow321Runner |
| **5** | Next Action Bridge | [golden-path-next-action-bridge.md](../../backlog/prompts/golden-path-next-action-bridge.md) | prisma/schema.prisma, quest-engine.ts, QuestDetailModal |
| **6** | Visible Impact | [golden-path-visible-impact.md](../../backlog/prompts/golden-path-visible-impact.md) | quest-engine.ts (completeQuest), completion UI |
| **7** | Admin Seeding | [golden-path-admin-seeding.md](../../backlog/prompts/golden-path-admin-seeding.md) | scripts/seed-golden-path-campaign.ts, CustomBar |

## Schema Coordination

- **Agent 1** (Invitation): Invite model
- **Agent 3** (Friction): PlayerQuest model
- **Agent 5** (Next Action Bridge): NextActionBridge or CustomBar
- **Agent 7** (Admin Seeding): CustomBar.successCondition (if added)

If running in parallel: each agent runs `npm run db:sync` after its schema edit. Prisma merges schema changes. If conflicts occur, resolve manually and re-run.

## Verification

Each agent runs `npm run build` and `npm run check` before marking done. After all 7 complete, run full build and manual smoke test of golden path flow.

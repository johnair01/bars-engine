# Spec Kit Prompt: Game Loop Integration

## Role

You are a Spec Kit agent responsible for wiring the core game loop so new players can play it. Apply **Deftness Development** — spec kit first, API-first (contract before UI), deterministic over AI.

## Objective

Implement the Game Loop Integration spec per [.specify/specs/game-loop-integration/spec.md](../specs/game-loop-integration/spec.md). Wire BAR → Quest → Campaign → Completion. Add game-loop rule content, surface from dashboard, and make paths explicit.

## Prompt (API-First)

> Implement Game Loop Integration per [.specify/specs/game-loop-integration/spec.md](../specs/game-loop-integration/spec.md). **API-first**: Phase 1 uses static content; no new Server Actions required. Define contracts in spec before UI. Spec: [.specify/specs/game-loop-integration/spec.md](../specs/game-loop-integration/spec.md).

## Requirements

- **Content**: `content/rules/game-loop.md` — 4-step loop, 4 moves table, Game Map link (already created)
- **Wiki**: Add `game-loop` to VALID_SLUGS and SLUG_TITLES in `src/app/wiki/rules/[slug]/page.tsx`
- **GetStartedPane**: Add Game Loop card as first card; link to `/wiki/rules/game-loop`
- **RecentChargeSection**: Change Explore button label to "Explore → Extend to Quest"
- **CampaignModal**: Add copy "Campaign quests complete on the Gameboard. Go to Gameboard to finish campaign work."
- **Verification quest**: Create `cert-game-loop-integration-v1` (Twine story + CustomBar + seed script)
- **Persistence**: No schema changes
- **API**: Phase 1 — no new actions; Phase 2 optional `getGameLoopStatus`

## Checklist (API-First Order)

- [ ] Content `content/rules/game-loop.md` exists (done)
- [ ] Wiki serves game-loop at `/wiki/rules/game-loop`
- [ ] GetStartedPane shows Game Loop card first
- [ ] RecentChargeSection Explore button says "Explore → Extend to Quest"
- [ ] CampaignModal includes Gameboard completion copy
- [ ] Verification quest `cert-game-loop-integration-v1` created and seeded
- [ ] Run `npm run build` and `npm run check` — fail-fix

## Deliverables

- [ ] `.specify/specs/game-loop-integration/spec.md` (done)
- [ ] `.specify/specs/game-loop-integration/plan.md` (done)
- [ ] `.specify/specs/game-loop-integration/tasks.md` (done)
- [ ] `content/rules/game-loop.md` (done)
- [ ] Wiki integration (VALID_SLUGS, SLUG_TITLES)
- [ ] GetStartedPane update
- [ ] RecentChargeSection update
- [ ] CampaignModal update
- [ ] Verification quest + seed script

## References

- [Deftness Development Skill](.agents/skills/deftness-development/SKILL.md)
- [Spec Kit Translator](.agents/skills/spec-kit-translator/SKILL.md)
- [Game Map Lobbies](.specify/specs/game-map-lobbies/spec.md)
- [Charge Capture UX](.specify/specs/charge-capture-ux-micro-interaction/spec.md)
- [CYOA Certification Quests](.specify/specs/cyoa-certification-quests/)

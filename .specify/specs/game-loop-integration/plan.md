# Plan: Game Loop Integration

## Overview

Wire the core game loop (BAR → Quest → Campaign → Completion) so new players can play it. API-first: define contracts before UI. Add game-loop rule content, surface from dashboard, and make BAR→Quest and Quest→Campaign paths explicit.

## Phases

### Phase 1: Content + Wiring (No New API)

1. **Game Loop rule content**
   - Create `content/rules/game-loop.md`
   - 4-step loop, 4 moves table, link to Game Map
   - Ecological tone; ~1 page

2. **Wiki integration**
   - Add `game-loop` to `VALID_SLUGS` and `SLUG_TITLES` in `src/app/wiki/rules/[slug]/page.tsx`
   - Ensure content path resolves (content/rules/game-loop.md)

3. **GetStartedPane**
   - Add Game Loop card as first card in grid
   - Link to `/wiki/rules/game-loop`
   - Preserve existing cards (BARs, Quests, EFA, Donate)

4. **RecentChargeSection**
   - Update Explore button: label "Explore → Extend to Quest" or add tooltip
   - File: `src/components/charge-capture/RecentChargeSection.tsx`

5. **CampaignModal**
   - Add copy: "Campaign quests complete on the Gameboard. Go to Gameboard to finish campaign work."
   - Link to `/campaign/board` or `/game-map`
   - File: `src/components/dashboard/CampaignModal.tsx`

6. **Verification quest**
   - Create `cert-game-loop-integration-v1` Twine story
   - Steps: dashboard → Game Loop → capture → Explore → Campaign modal → complete
   - Seed script: `scripts/seed-cert-game-loop-integration.ts` or extend existing cert seed

### Phase 2: Optional Personalization (Future)

- Implement `getGameLoopStatus(playerId)` Server Action
- Use in GetStartedPane for contextual "Next step"
- Optional: `getGameLoopContent()` if wiki needs server-rendered rule

## File Impact

| File | Change |
|------|--------|
| `content/rules/game-loop.md` | New |
| `src/app/wiki/rules/[slug]/page.tsx` | Add game-loop slug |
| `src/components/GetStartedPane.tsx` | Add Game Loop card |
| `src/components/charge-capture/RecentChargeSection.tsx` | Update Explore button label |
| `src/components/dashboard/CampaignModal.tsx` | Add Gameboard routing copy |
| `scripts/seed-cert-game-loop-integration.ts` | New (or extend) |
| `prisma/schema.prisma` | No change |

## Dependencies

- [Game Map Lobbies](.specify/specs/game-map-lobbies/spec.md)
- [Charge Capture UX](.specify/specs/charge-capture-ux-micro-interaction/spec.md)
- [Quest Completion Context Restriction](.specify/specs/quest-completion-context-restriction/spec.md)

## Verification

- `npm run build` — passes
- `npm run check` — passes
- Manual: Complete verification quest `cert-game-loop-integration-v1`

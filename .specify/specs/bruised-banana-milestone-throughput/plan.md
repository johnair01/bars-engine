# Plan: Bruised Banana Milestone Throughput & Player Guidance

Implement per [.specify/specs/bruised-banana-milestone-throughput/spec.md](./spec.md).

## Code inventory (reference)

| Area | Files / routes |
|------|----------------|
| Campaign entry | [`src/app/page.tsx`](../../src/app/page.tsx) (campaign entry / threads), [`src/components/dashboard/CampaignModal.tsx`](../../src/components/dashboard/CampaignModal.tsx) |
| Hub & spokes | [`src/app/campaign/hub/page.tsx`](../../src/app/campaign/hub/page.tsx), [`src/components/campaign/CampaignHubView.tsx`](../../src/components/campaign/CampaignHubView.tsx), [`src/actions/campaign-portals.ts`](../../src/actions/campaign-portals.ts), [`src/lib/campaign-hub/types.ts`](../../src/lib/campaign-hub/types.ts) |
| Board / map | [`src/app/campaign/board/page.tsx`](../../src/app/campaign/board/page.tsx), [`src/lib/campaign-map.ts`](../../src/lib/campaign-map.ts) |
| Gameboard | [`src/actions/gameboard.ts`](../../src/actions/gameboard.ts) (`getOrCreateGameboardSlots`, `kotterStage`) |
| Campaign routing | [`src/app/campaign/page.tsx`](../../src/app/campaign/page.tsx), [`src/app/campaign/twine/page.tsx`](../../src/app/campaign/twine/page.tsx), [`src/app/campaign/initiation/page.tsx`](../../src/app/campaign/initiation/page.tsx) |
| Landing | [`src/app/campaigns/landing/[slug]/page.tsx`](../../src/app/campaigns/landing/[slug]/page.tsx), [`src/actions/campaign-landing.ts`](../../src/actions/campaign-landing.ts) |
| Instance | [`prisma/schema.prisma`](../../prisma/schema.prisma) `Instance` (`kotterStage`, `goalAmountCents`, `currentAmountCents`, `campaignHubState`, `campaignRef`) |
| Config | [`src/actions/config.ts`](../../src/actions/config.ts) (`resolvePostOnboardingBoardPath`) |
| Game loop | [`src/actions/quest-placement.ts`](../../src/actions/quest-placement.ts), `addQuestToCampaign` per [game-loop spec](../game-loop-bars-quest-thread-campaign/spec.md) |

## Phases

### Phase 1 — Data + rules module (no UI)

- Define **`getBruisedBananaMilestoneSnapshot(instanceId | campaignRef)`** (or equivalent) returning: `{ kotterStage, goalProgress, phaseLabel, milestoneKey }`.
- Define **`getGuidedActionsForPlayer(playerId, campaignRef)`** returning ordered `{ label, href, kind }[]` with deterministic rules:
  - If onboarding incomplete → initiation / orientation first.
  - Else if vault at cap → `/hand/compost` or drafts/quests room (per [vault-limits](../../src/lib/vault-limits.ts)).
  - Else if no gameboard participation → `/campaign/board?ref=...`.
  - Else suggest hub spoke or quest-map container subquest (link patterns from [quest-map](../bruised-banana-quest-map/spec.md)).
- Unit tests for pure functions (no DB or mocked Prisma).

### Phase 2 — Dashboard / hub UI

- **Dashboard:** Extend `CampaignModal` or campaign entry card with **milestone strip** + **primary CTA** from `getGuidedActionsForPlayer` (first 1–2).
- **Campaign hub:** Optional second row under Kotter copy: “**Next for the residency**” with links.
- Copy: Voice Style Guide; **no shame** for vault cap.

### Phase 3 — Admin + polish

- Admin or instance JSON: **milestone labels** override (optional).
- Wiki link from [`/wiki/campaign/bruised-banana`](../../src/app/wiki/campaign/bruised-banana/page.tsx) to “how progress works.”
- Update [BACKLOG](../../backlog/BACKLOG.md) row BBMT status when shipped.

## Risks

- **Over-guidance** — Too many CTAs; cap at **3** visible actions.
- **Stale rules** — Document fallback when `getOrCreateGameboardSlots` errors (show board link only).
- **Multi-instance** — Rules must use **resolved** `campaignRef` from active instance, not hardcoded `bruised-banana` only in server code (client may default display ref).

## Verification

- `npm run check` — after each phase.
- Manual: log in as test player → see milestone → tap guided action → land on correct route with `ref` preserved.

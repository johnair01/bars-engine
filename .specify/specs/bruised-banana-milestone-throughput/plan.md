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

## North star path (traceability)

**Purpose:** Tie the **priority ladder** in [`computeGuidedActions`](../../src/lib/bruised-banana-milestone/guided-actions.ts) to an **intended completion** and **what the player can see move**. Update this table when guidance rules change.

| Player state (precondition) | Primary guided action (first CTA) | Intended completion | Progress / signal |
|----------------------------|-----------------------------------|----------------------|-------------------|
| `onboardingComplete === false` | Continue campaign onboarding → `/campaign?ref=` | Finish orientation / initiation / first campaign quests until server marks onboarding complete | Next visit: primary CTA **promotes** past onboarding (vault → board → hub ladder) |
| Vault drafts or unplaced at cap | Vault compost → `/hand/compost` (or Hand) | Free capacity per [vault-limits](../../src/lib/vault-limits.ts) | Primary CTA **no longer** vault-first; player unblocked for board/hub |
| Onboarding ok, vault ok, **no** gameboard participation | Pick a slot → `/campaign/board?ref=` | Claim / bid / steward a slot (`getOrCreateGameboardSlots` participation) | `hasGameboardParticipation` true → hub becomes primary; board shows player’s slot |
| Onboarding ok, vault ok, **has** gameboard participation | Campaign hub → `/campaign/hub?ref=` | Enter a spoke CYOA, landing, or collective route without dead links | `campaignHubState` / spoke progress where persisted; **no** broken passage targets ([UGA](../unified-cyoa-graph-authoring/spec.md)) |
| **Secondary** (filled after primary) | Event, Market, Campaign story, Gameboard | Contextual engagement | Fundraiser % moves on **donation** paths (`/event/donate/wizard`); Kotter label from **Instance** |

**Known gaps (do not paper over):** If hub/spoke completion **does not** yet update `MilestoneSnapshot` fields, the North star still requires **honest** signals elsewhere in the same session (e.g. donation line, board state, onboarding promotion). File a follow-up task if **no** row applies after step 4 of the verification quest.

---

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

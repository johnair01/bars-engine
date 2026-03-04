# Spec: Bruised Banana Post-Onboarding Short Wins

## Purpose

Implement P6/FR10 from [Campaign Onboarding Twine v2](../campaign-onboarding-twine-v2/spec.md): after Bruised Banana signup, preload 2–5 orientation quests appropriate to the player's lens so they hit the ground running with short wins.

**Blocker addressed**: Onboarding feels incomplete without short wins. Players need meaningful work immediately after sensing urgency and receiving the residency vision.

## User Story

**As a player** who just signed up from the Bruised Banana initiation flow, I want 2–5 orientation quests that connect to my lens (community/creative/strategic/allyship) preloaded in my Journeys, so I land in relevant work and get short wins.

**Acceptance**: When `createCampaignPlayer` completes with lens in campaignState, the player has a Bruised Banana orientation thread assigned with 2–4 short-win quests. Lens→domain mapping (already in assignOrientationThreads) filters Market quests; the new thread gives immediate, completable tasks.

## Functional Requirements

- **FR1**: Create `bruised-banana-orientation-thread` with 2–4 short-win quests (e.g. Explore the Market, Request from Library).
- **FR2**: When `assignOrientationThreads` is called and state contains `lens` (Bruised Banana campaign signup), assign `bruised-banana-orientation-thread` in addition to standard orientation threads.
- **FR3**: Seed script idempotent; run via `npm run seed:onboarding` or new `seed:bruised-banana-short-wins`.
- **FR4**: Remove TODO in `createCampaignPlayer`; document that lens-based preload is implemented via assignOrientationThreads + bruised-banana thread.

## Non-functional Requirements

- Minimal: reuse existing quest patterns (Twine, completionEffects). No schema changes.
- Short-win quests are completable in 1–3 steps (e.g. visit Market, submit Library Request).

## Dependencies

- [Campaign Onboarding Twine v2](../campaign-onboarding-twine-v2/spec.md) — lens in campaignState
- assignOrientationThreads — [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- createCampaignPlayer — [src/app/campaign/actions/campaign.ts](../../src/app/campaign/actions/campaign.ts)

## Reference

- BX spec FR10: [campaign-onboarding-twine-v2](../campaign-onboarding-twine-v2/spec.md)
- assignOrientationThreads lens→domain: lines 254–267 in quest-thread.ts

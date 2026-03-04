# Prompt: Campaign Onboarding Twine v2 — Bruised Banana Initiation

**Use this prompt when implementing the Twine-authored Bruised Banana initiation flow with Learn More passages and donation telemetry.**

## Context

The Bruised Banana campaign onboarding is being updated to a Twine-authored initiation experience. The flow guides players through lens selection, signal capture, BAR creation, micro-quest attachment, vibeulon mint, Game Master selection, and commitment gate. Learn-more pages live as KB_* Twine passages; donation uses a hybrid flow (Twine pre-chamber + external portal) with telemetry.

## Prompt text

> Implement the Campaign Onboarding Twine v2 per [.specify/specs/campaign-onboarding-twine-v2/spec.md](../specs/campaign-onboarding-twine-v2/spec.md). Create bruised-banana-initiation.twee with passages: Start, LensSelection, SetLens*, Signal, Refine, Quadrant*, Claim, Structure, Weave, Mint, ChooseGM, GM*, Commit, KB_*, Donate_*, DonateSmall/DonateMedium/DonateLarge, ExternalDonate. Wire onboarding state capture (lens, rawSignal, refinedSignal, quadrant, gm, barPublished, barAttachedToQuest, vibeulonMinted); fire analytics events at each step. At Claim: create public BAR with refinedSignal + lens + quadrant + campaignTag. At Structure: attach BAR to onboarding micro-quest. At Mint: mint vibeulon (real or demo). Donation: Donate_* sets source; tier selection; fire onboarding_donate_clicked before opening external URL; append params if safe. After signup: preload 2–5 orientation quests by lens/gm/quadrant. Add cert-campaign-onboarding-twine-v2-v1 verification quest. Use game language: WHO (Game Master), WHAT (BAR), WHERE (lens → allyship domain), Energy (vibeulons). Follow [Voice Style Guide](/wiki/voice-style-guide): presence first, mechanics second.

## Checklist

- [ ] Phase 1: bruised-banana-initiation.twee + seed/import
- [ ] Phase 2: KB_* passage navigation + return links
- [ ] Phase 3: Onboarding state + analytics events
- [ ] Phase 4: BAR creation at Claim step
- [ ] Phase 5: Micro-quest attach + vibeulon mint
- [ ] Phase 6: Donation hybrid + telemetry
- [ ] Phase 7: Orientation preload after signup
- [ ] Phase 8: cert-campaign-onboarding-twine-v2-v1 verification quest

## Reference

- Spec: [.specify/specs/campaign-onboarding-twine-v2/spec.md](../specs/campaign-onboarding-twine-v2/spec.md)
- Plan: [.specify/specs/campaign-onboarding-twine-v2/plan.md](../specs/campaign-onboarding-twine-v2/plan.md)
- Tasks: [.specify/specs/campaign-onboarding-twine-v2/tasks.md](../specs/campaign-onboarding-twine-v2/tasks.md)
- Related: [lore-cyoa-onboarding](lore-cyoa-onboarding.md), [onboarding-adventures-unification](onboarding-adventures-unification.md)

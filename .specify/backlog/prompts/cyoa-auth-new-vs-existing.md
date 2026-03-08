# Prompt: CYOA Auth — New vs Existing Players

**Use this prompt when implementing campaign CYOA auth to support both new and existing players.**

## Context

The campaign onboarding CYOA currently shows sign-up only at the Signup node. Existing players get "Account already exists. Please log in." The flow should: (1) offer sign-in or log-in, (2) let logged-in players continue without re-auth and unlock campaign quests, (3) recognize new vs existing players.

## Prompt text

> Implement the CYOA Auth — New vs Existing Players per [.specify/specs/cyoa-auth-new-vs-existing/spec.md](../specs/cyoa-auth-new-vs-existing/spec.md). Phase 1: Create applyCampaignStateToExistingPlayer(campaignState) — merge state into storyProgress, call assignOrientationThreads. Phase 2: Add login mode to CampaignAuthForm; create loginWithCampaignState that logs in then applies campaign state. Phase 3: Pass hasPlayer from campaign twine page to BruisedBananaTwinePlayer; when Signup node + hasPlayer, show "Continue to campaign" instead of auth form. Run build and check.

## Checklist

- [ ] Phase 1: applyCampaignStateToExistingPlayer
- [ ] Phase 2: CampaignAuthForm login mode
- [ ] Phase 3: hasPlayer + Continue to campaign
- [ ] Build, check, manual tests

## Reference

- Spec: [.specify/specs/cyoa-auth-new-vs-existing/spec.md](../specs/cyoa-auth-new-vs-existing/spec.md)
- Plan: [.specify/specs/cyoa-auth-new-vs-existing/plan.md](../specs/cyoa-auth-new-vs-existing/plan.md)
- Tasks: [.specify/specs/cyoa-auth-new-vs-existing/tasks.md](../specs/cyoa-auth-new-vs-existing/tasks.md)
- Related: [cyoa-onboarding-reveal](cyoa-onboarding-reveal.md), [bruised-banana-post-onboarding-short-wins](bruised-banana-post-onboarding-short-wins.md)

# How Bruised Banana progress works

This page summarizes what players see on the **dashboard** and **campaign hub** as *residency progress* (BBMT — [.specify/specs/bruised-banana-milestone-throughput/spec.md](../.specify/specs/bruised-banana-milestone-throughput/spec.md)).

## What “forward” means

1. **Kotter stage (1–8)** — The active instance’s campaign phase. Admins advance `kotterStage` in Admin → Instances; the UI shows the stage name and a **domain × Kotter** action line (e.g. gathering-resources × stage).
2. **Fundraising bar** — When `goalAmountCents` is set, the strip shows raised vs goal (from `currentAmountCents`).
3. **Suggested next step** — A deterministic hint, not coercion:
   - Finish **onboarding** (welcome + first quests) before other links take priority.
   - If the **vault** is at capacity for drafts or unplaced quests → **Vault compost** (`/hand/compost`) first (no shame — space is a real constraint).
   - If you haven’t engaged the **gameboard** yet (no steward/bid/aid on slots) → **Gameboard**.
   - Otherwise → **Campaign hub** (8 spokes), plus secondary links (event, market, story) up to three actions.

## Code

- Library: `src/lib/bruised-banana-milestone/`
- Server loader: `src/actions/campaign-milestone-guidance.ts`
- UI: `src/components/campaign/CampaignMilestoneStrip.tsx`

## Wiki

See also [Bruised Banana campaign wiki](/wiki/campaign/bruised-banana).

# Plan: Bruised Banana Post-Onboarding Short Wins

## Summary

Create a Bruised Banana orientation thread with 2–4 short-win quests; assign it when lens is present in campaign signup state. Resolves TODO in createCampaignPlayer.

## Implementation

### 1. Seed script: bruised-banana-orientation-thread

Add to `scripts/seed-onboarding-thread.ts` (or new `scripts/seed-bruised-banana-short-wins.ts`):

- **Thread**: `bruised-banana-orientation-thread`, title "Help the Bruised Banana", threadType: orientation, status: active
- **Quest 1**: "Explore the Market" — Twine story: visit dashboard, see your quests. Completion: attest "I've explored the Market"
- **Quest 2**: Reuse or link to "Request from Library" (k-space-librarian-quest) — or a short "Help the Knowledge Base" that completes when they submit a Library Request

Keep to 2 quests for minimal; can expand to 4 later.

### 2. assignOrientationThreads: assign bruised-banana thread when lens present

In `assignOrientationThreads`, after assigning standard orientation threads:
- If params was derived from state and `state.lens` is a non-empty string, also assign `bruised-banana-orientation-thread`
- Need to pass state through: params already has allyshipDomains from lens. We need to know lens was present. Add `lens?: string` to OrientationPersonalization; when building params from storyProgress, set `params.lens = state.lens`. When params.lens is set, assign bruised-banana thread.

### 3. createCampaignPlayer: pass lens to assignOrientationThreads

When calling assignOrientationThreads, pass personalization with lens when state.lens exists. Actually assignOrientationThreads already reads from storyProgress — the player is created with storyProgress in the same block. So when we call assignOrientationThreads(player.id), it reads storyProgress. The params will have allyshipDomains from lens. But we need to pass lens explicitly for the bruised-banana thread check. The assignOrientationThreads builds params from storyProgress — it has access to state.lens. So we just need to add `lens: state.lens` to params when we have it, and then check params.lens when deciding to assign bruised-banana thread. Good — no change to createCampaignPlayer needed; the logic is in assignOrientationThreads.

### 4. Remove TODO

Remove the TODO comment in campaign.ts.

## File Impacts

| Action | File |
|--------|------|
| Modify | scripts/seed-onboarding-thread.ts — add bruised-banana thread + 2 quests |
| Modify | src/actions/quest-thread.ts — assign bruised-banana thread when lens in params |
| Modify | src/app/campaign/actions/campaign.ts — remove TODO |

## Verification

1. Sign up from Bruised Banana flow with lens selected
2. After signup, verify "Help the Bruised Banana" thread appears in Journeys with 2 short-win quests
3. Complete "Explore the Market" — attest, complete
4. Sign up without lens (e.g. conclave direct) — bruised-banana thread should NOT appear (only for campaign signups with lens)

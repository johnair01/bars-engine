# Lead Branching CYOA — Implementation Plan

**Spec**: [spec.md](spec.md) · **Status**: ready when scheduled (parent Phase 6 lands first)

Reuse the anonymous `EventInviteStory` engine; do **not** touch the auth-gated `Adventure` engine.

## Step 1 — Story builder (pure)
`src/lib/campaign-leads/branching-story.ts`
- `leadToBranchingStory(input: LeadStoryInput): EventInviteStory`
- Compose: welcome (name + message) → branch "what pulls you?" (domain arms) → orient card →
  branch "which myth?" (pick from `ALLYSHIP_MYTHS`) → "how you help" (matched quest titles, framed
  by superpower/face) → ending node (claim).
- Per-domain / per-face template fragments; converge all arms on one ending id.
- Validate output with `parseEventInviteStory` in a dev assertion + unit tests.

## Step 2 — Reader ending slot
- Extend `EventInviteStoryReader` (or wrap) so a passage flagged `claim` renders an injected
  `signupSlot` (the existing `InviteSignupForm`) instead of the default ending CTA. Additive prop;
  existing EventInviteStory usages unaffected.

## Step 3 — Route branch + fallback
`src/app/invite/[token]/welcome/page.tsx`
- If the lead has goals/quests → build + render the branching story with `signupSlot`.
- Else → render v1 `LeadWelcomeCYOA` (zero regression).

## Step 4 — Anonymous path capture
- Reuse `clientSessionId` (localStorage) + the `submitAllyshipIntake` pattern; persist the chosen
  path (additive: lead `pathJson` or a linked `LatentAllyshipIntake`).

## Step 5 — Owner visibility + verify
- Show the captured path on `/campaign/[ref]/leads/[leadId]` (parent Phase 6).
- Verify claim still assigns quests via `claimCampaignLeadForPlayer`.
- Validation: reuse `parseEventInviteStory`; add bounded cycle-check only if back-references allowed.

## File impact
| Area | Files |
|------|-------|
| Builder | `src/lib/campaign-leads/branching-story.ts` (+ tests) |
| Reader | `src/components/event-invite/EventInviteStoryReader.tsx` (additive slot prop) |
| Route | `src/app/invite/[token]/welcome/page.tsx` |
| Persistence | reuse `src/actions/allyship-intake.ts` pattern (no required schema) |

## Risks
- Reader coupling to its own ending CTA → mitigate with an additive `endingSlot`/`claimSlot` prop, default unchanged.
- Template sprawl → start with ONE branching template (domain + one myth branch), expand later.

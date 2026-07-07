# Tasks: Lead Branching CYOA

Prereq: parent Phase 6 (lead detail + goals) landed. Reuse `EventInviteStory`, not `Adventure`.

- [ ] 1 `src/lib/campaign-leads/branching-story.ts` — `leadToBranchingStory` (pure) + 1 branching template
- [ ] 2 Unit tests: output passes `parseEventInviteStory`; all arms reach the claim ending
- [ ] 3 `EventInviteStoryReader` — additive `claimSlot`/`endingSlot` prop; default unchanged
- [ ] 4 `/invite/[token]/welcome` — render branching story when lead has goals/quests; else linear fallback
- [ ] 5 Anonymous path capture (clientSessionId localStorage; reuse submitAllyshipIntake pattern); persist path (additive)
- [ ] 6 Show chosen path on `/campaign/[ref]/leads/[leadId]`
- [ ] 7 Verify claim assigns quests (claimCampaignLeadForPlayer) — path unchanged
- [ ] 8 (optional) bounded cycle-detection if back-references allowed

## Verification
- [ ] `cert-lead-branching-cyoa-v1`: two distinct paths → same claim ending → 2 quests assigned → owner sees path
- [ ] `npm run check` / tsc / eslint green

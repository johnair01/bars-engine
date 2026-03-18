# BAR Extendable to Quest Seed — Verification

## Summary

**Status:** Extendable. Allyship domain is inherited from campaign context when the BAR is emitted in a campaign; personal quests (no campaignRef) do not require allyship domain.

## Design: Allyship Domain Inheritance

- **Personal quest** (BAR has no campaignRef): Allyship domain not required. Player can extend BAR to a personal quest without domain.
- **Campaign quest** (BAR has campaignRef): Allyship domain required. When emitting from a campaign-linked adventure, `allyshipDomain` is inherited from the Instance (via `campaignRef`).

## Existing Quest-Seed Flow

The BAR → Quest flow is implemented in `src/lib/bar-quest-generation/`:

1. **generateQuestProposalFromBar** — Admin enters BAR ID on `/admin/quest-proposals`, generates a QuestProposal
2. **Eligibility** (`eligibility.ts`) — BAR must pass:
   - `status` = active ✓
   - `title` ≥ 3 chars ✓
   - `description` ≥ 10 chars ✓
   - **allyshipDomain**: required only when `campaignRef` is set (campaign quests)
   - Not already converted (no `sourceBarId` pointing back)

3. **Interpretation** — Uses: id, title, description, allyshipDomain (defaults when absent), campaignRef, type, moveType
4. **Publish** — Creates CustomBar quest from approved proposal

## emitBarFromPassage BAR Fields

| Field | Set? | Quest-gen use |
|-------|------|---------------|
| title | ✓ | Required |
| description | ✓ | Required (min 10 chars) |
| status | ✓ active | Required |
| type | ✓ vibe | Used in interpretation |
| creatorId | ✓ | Used |
| allyshipDomain | ✓ inherited | When campaignRef: from Instance.allyshipDomain or primaryCampaignDomain |
| campaignRef | ✓ when in campaign | Passed from adventure/play context; enables campaign quest generation |
| agentMetadata | ✓ | Provenance (passage/adventure) |

## Inheritance Flow

1. Adventure play page receives `campaignRef` from URL or adventure
2. AdventurePlayer passes `campaignRef` to `emitBarFromPassage`
3. emitBarFromPassage looks up Instance by `campaignRef` or `slug`
4. Sets BAR.allyshipDomain = Instance.allyshipDomain ?? Instance.primaryCampaignDomain
5. Sets BAR.campaignRef = campaignRef

## CustomBar Schema

CustomBar already has all fields needed for quest-seed extension. No schema changes required.

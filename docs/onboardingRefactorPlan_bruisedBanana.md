# Onboarding Refactor Plan — Bruised Banana

## Overview

This document describes how to replace the current Bruised Banana onboarding flow with the Quest Grammar–generated flow. The Campaign Owner inputs the 6 Unpacking Questions interactively; `compileQuest` produces a QuestPacket; nodes are rendered via CampaignReader. Incremental strategy: keep old flow behind a flag; ship new flow after verification.

## Where the Current Onboarding Flow Lives

| Component | Location | Role |
|-----------|----------|------|
| Campaign page | `src/app/campaign/page.tsx` | Renders CampaignReader; passes `ref=bruised-banana`, `adventureSlug=bruised-banana`, `startNodeId=BB_Intro` |
| CampaignReader | `src/app/campaign/components/CampaignReader.tsx` | Fetches nodes from API; renders text + choices; processes macros; hands off to CampaignAuthForm at signup |
| API route | `src/app/api/adventures/[slug]/[nodeId]/route.ts` | Serves nodes: `getBruisedBananaFromPassages` (DB) or `getBruisedBananaNode` (code) |
| CampaignAuthForm | `src/app/campaign/components/CampaignAuthForm.tsx` | Signup form; passes `campaignState` to `createCampaignPlayer` → `storyProgress` |
| Passages | DB `Adventure` + `Passage` | Editable via Admin Adventures; seeded by `scripts/seed-bruised-banana-adventure.ts` |
| assignOrientationThreads | `src/actions/quest-thread.ts` | Preloads orientation quests from `storyProgress` (nationId, playbookId, campaignDomainPreference, developmentalHint) |

## How to Replace with QuestPacket Flow

### 1. Generate QuestPacket for segment A/B

- Campaign Owner inputs Q1–Q6 + aligned action via Campaign Owner–facing UI (`/admin/quest-grammar` or similar)
- Call `compileQuest({ unpackingAnswers, alignedAction, segment: 'player' })` and `compileQuest({ ..., segment: 'sponsor' })`
- Output: two QuestPackets (player variant, sponsor variant)

### 2. Convert QuestPacket to Passages

- Map `QuestPacket.nodes` to `Passage` records
- Each node: `nodeId` = `node.id`, `text` = `node.text`, `choices` = `JSON.stringify(node.choices)`
- Create or update Adventures `bruised-banana-initiation-player` and `bruised-banana-initiation-sponsor` with these Passages
- Admin action `publishQuestPacketToPassages` in `src/actions/quest-grammar.ts` writes to DB

### 3. Render nodes as onboarding steps

- Campaign page: when `?ref=bruised-banana&ritual=initiation&segment=player` (or `sponsor`), redirects to `/campaign/initiation?segment=player`
- Initiation page: loads Adventure `bruised-banana-initiation-player` (or `-sponsor`) with `startNodeId=node_0`
- API route: serves from Passages for `bruised-banana-initiation-{segment}` when slug matches
- CampaignReader: no changes; it already fetches by nodeId and renders

### 4. Wire donation into existing flow

- Donation node (transcendence) includes link to `/event/donate` or external URL
- CampaignReader intercepts link click → fire `onboarding_donate_clicked` (or `donationClicked`) → open external URL with params
- Existing Event Donation Honor System handles the transaction

## Incremental Strategy (Flag-Based Rollout)

1. **Phase 1**: Implement Quest Grammar Compiler + Campaign Owner input UI. No change to live flow.
2. **Phase 2**: Create `bruised-banana-initiation` Adventure. Seed from `compileQuest` output. Add `?ritual=initiation&segment=player` support to campaign page and API.
3. **Phase 3**: Test new flow internally. Keep default `?ref=bruised-banana` pointing to current BB_Intro flow.
4. **Phase 4**: After verification, switch default to initiation flow, or add segment detection (e.g. from landing CTA).
5. **Phase 5**: Deprecate old flow when initiation flow is stable.

## Invocation

```ts
import { compileQuest } from '@/lib/quest-grammar'

const packet = compileQuest({
  unpackingAnswers: { q1, q2, q3, q4, q5, q6 },
  alignedAction: '...',
  segment: 'player',
  campaignId: 'bruised-banana',
})
// packet.nodes → Passages
// packet.signature → metadata for admin
```

## Reference

- Spec: [.specify/specs/quest-grammar-compiler/spec.md](../.specify/specs/quest-grammar-compiler/spec.md)
- SpecBAR: [.specify/specs/bruised-banana-launch-specbar/spec.md](../.specify/specs/bruised-banana-launch-specbar/spec.md)
- Campaign Onboarding Twine v2: [.specify/specs/campaign-onboarding-twine-v2/spec.md](../.specify/specs/campaign-onboarding-twine-v2/spec.md)

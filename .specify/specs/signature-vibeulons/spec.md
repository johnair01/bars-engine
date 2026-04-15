# Signature Vibeulons (X)

## Overview

Add `creatorId` to Vibulon to record who "signed" each vibeulon. Enables "who earned what, for what" visibility and future signature-based features.

## Schema

- **Vibulon.creatorId** (String?, nullable): The player who "signed" this vibeulon.
- Relation: `creator Player? @relation("VibulonCreator", ...)`

## Mint Rules

| Source | creatorId |
|--------|-----------|
| **EFA completion** (emotional_first_aid, shadow_321_completion) | `playerId` (self-signature for Clean Up) |
| **Quest completion** (quest mint to completer) | `quest.creatorId` when quest has creator and `!quest.isSystem` |
| **BAR creator mint** (bar_creator_quest_completion) | `bar.creatorId` |
| **Completion effect grantVibeulons** | `quest.creatorId` when not system |
| Other mints (signup seed, economy, etc.) | `null` |

## Implementation

- [x] Add creatorId to Vibulon schema
- [x] EFA: emotional-first-aid.ts — creatorId: player.id
- [x] Quest completion: quest-engine.ts — creatorId from quest.creatorId when !isSystem
- [x] BAR creator mint: creatorId: bar.creatorId
- [x] grantVibeulons completion effect: creatorId from quest

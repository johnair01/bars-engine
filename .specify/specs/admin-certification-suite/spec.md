# Spec: Admin Certification Suite

## Purpose

Complete the Admin Certification Suite so certification quests work as a "final gate" for admins: unified discovery (Market + Adventures), economic reward (1 Vibeulon on completion), Graveyard lifecycle with hard-lock and Restore, and admin-only visibility.

## Current State

- Certification quests (isSystem) visible in Market and Adventures for admins
- Graveyard section in Market shows completed cert quests with "Restore to Market" button
- restoreCertificationQuest action exists (deletes PlayerQuest + TwineRun)
- Vibeulon minting on completion (quest engine)
- **Gaps**: Completed cert quests may still appear in Available list; Adventures allows clicking through to play for completed certs; pickupMarketQuest error message could be clearer

## User Stories

### P1: Quest disappears from Available when completed
**As an admin**, I want completed certification quests to NOT appear in the Market's available list, so I only see them in the Graveyard.

**Acceptance**: getMarketContent filters publicQuests to exclude system quests where the current player has a completed PlayerQuest. Graveyard quests do not appear in the main "others" list.

### P2: Hard-lock — cannot launch completed cert from Adventures
**As an admin**, I want completed certification quests on the Adventures page to NOT link to play, so I cannot re-run them without restoring first.

**Acceptance**: Adventures page: for stories with a certification quest that the current player has completed, render a non-clickable card (or card that links to Market/Graveyard) instead of linking to /adventures/[id]/play. Show "Completed" and optionally "Restore in Market" link.

### P3: Clear error when trying to pick up completed quest
**As an admin**, I want a clear error when attempting to pick up a quest I've already completed, so I know to restore from the Graveyard.

**Acceptance**: pickupMarketQuest returns `{ error: 'Quest completed. Restore from Graveyard to re-run.' }` when the player has a completed assignment for a system quest (instead of generic "Already accepted").

### P4: Restore revalidates Adventures
**As an admin**, I want the Restore action to refresh the Adventures page, so I see the quest as available again there too.

**Acceptance**: restoreCertificationQuest calls revalidatePath('/adventures') in addition to /bars/available and /.

## Functional Requirements

- **FR1**: Market available list excludes system quests with completed PlayerQuest for current player.
- **FR2**: Adventures page does not link to play for completed certification quests.
- **FR3**: pickupMarketQuest returns specific error for completed system quests.
- **FR4**: restoreCertificationQuest revalidates /adventures.

## Reference

- Original prompt: [prompt_i_admin_certification.md](/Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_i_admin_certification.md)
- admin-certification: [src/actions/admin-certification.ts](../../src/actions/admin-certification.ts)
- market: [src/actions/market.ts](../../src/actions/market.ts)
- admin-validation-quests: [.specify/specs/admin-validation-quests/spec.md](../admin-validation-quests/spec.md)

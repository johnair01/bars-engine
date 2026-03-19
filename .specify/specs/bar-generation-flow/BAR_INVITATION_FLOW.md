# BAR Generation Flow: Invitation BARs

## How this BAR was created

The BAR "A fellow player has invited you into the game. Accept to begin your journey." is an **invitation BAR** — a delivery vehicle for inviting someone into the game. It can be created two ways:

### 1. Completion effect: `strengthenResidency` (invite branch)

**Source**: `src/actions/quest-engine.ts` → `processCompletionEffects` → `case 'strengthenResidency'`

When a player completes an onboarding quest that has:
```json
{ "effects": [{ "type": "strengthenResidency", "fromInput": "completionType" }] }
```
and the completion input is `completionType: 'invite'`, the engine calls `_forgeInvitationBarInTx`. This creates:
- An `Invite` (token, forgerId, invitationTargetType/Id)
- A `CustomBar` with `inviteId`, `sourceBarId` (quest), `creatorId` (the completer)

**Seeded in**: `scripts/seed-onboarding-thread.ts` — END_INVITE passage with `strengthenResidency` effect.

### 2. Manual forge: Forge Invitation form

**Source**: `src/actions/forge-invitation-bar.ts` → `forgeInvitationBar`

Player goes to `/hand/forge-invitation` and submits the form. Creates Invite + CustomBar with `inviteId`, `invitationBarId` on Invite.

---

## Intended use

- **Creator**: The BAR is meant to be *shared* — the creator gets an invite URL (`/invite/{token}` or `/invite/claim/{barId}`) and sends it to the invitee.
- **Invitee**: Visits the URL, signs up, and joins the game.
- The BAR is a **delivery vehicle**, not a draft to edit. It shouldn't appear in "Private Drafts" alongside editable content.

---

## Why it shows in Hand

**Hand page** (`src/app/hand/page.tsx`) fetches **Private Drafts** as:
```ts
creatorId: playerId, visibility: 'private', claimedById: null, status: 'active', type: { not: 'quest' }
```
Invitation BARs match this: they're private, unclaimed, active, type `bar`. So they appear in the drafts section.

---

## Kaizen improvements

1. **Exclude invitation BARs from Private Drafts** — BARs with `inviteId` are invitation vehicles. Show them in a dedicated "Invitations I've forged" section (or exclude from drafts).
2. **Add delete BAR** — Allow creators to delete BARs they don't want. Requires: ownership check, soft-delete or hard delete, revalidation.
3. **Traceability** — Add `sourceType` or metadata to BARs created by completion effects so we can filter or audit system-generated BARs.

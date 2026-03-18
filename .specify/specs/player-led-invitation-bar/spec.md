# Spec: Player-Led Invitation BAR

## Purpose

Expand the invitation-via-BAR ritual so **players** forge invitation BARs that give recipients a unique advantage and personal connection to the game. Invitations can target a **nation**, **school**, or **sect**, enabling players to apply social leverage. Player-led sign-up flows into the existing Bruised Banana campaign onboarding and integrates with the "Invite an Ally" quest.

**Extends**: [invitation-via-bar-ritual](../invitation-via-bar-ritual/spec.md)

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Who creates** | Players (not just admins) can forge invitation BARs. Requires `gameAccountReady`. |
| **Invitation target** | `Invite.invitationTargetType`: `nation` \| `school` \| `sect` (optional). `Invite.invitationTargetId`: nationId, face key, or sectId. |
| **Forger** | `Invite.forgerId` (Player) — who created/sent the invitation. Enables "invited by X" and social leverage. |
| **Pre-fill** | When signing up via player-forged BAR, pre-fill nation/school from invitation target or forger. |
| **Quest link** | "Invite an Ally" (starter-invite-ally) and Strengthen END_INVITE branch: completing them can create/forge an invitation BAR. |
| **Flow merge** | Player-led sign-up uses same `createCharacter` + `assignOrientationThreads`; orientation personalization includes `invitedByPlayerId`, `invitationTargetType`, `invitationTargetId`. |

## Conceptual Model

### Nation, School, Sect

| Term | Mapping | Schema |
|------|---------|--------|
| **Nation** | Cultural resonance (Argyra, Pyrakanth, etc.) | `Nation` model, `Player.nationId` |
| **School** | Developmental path / Game Master Face | `CustomBar.gameMasterFace` — shaman, challenger, regent, architect, diplomat, sage |
| **Sect** | Sub-group or faction (Phase 4) | Deferred; future model or reuse |

### Schema Additions

| Model | Field | Type | Description |
|-------|-------|------|-------------|
| Invite | forgerId | String? | Player who forged/sent the invitation |
| Invite | invitationTargetType | String? | `nation` \| `school` \| `sect` |
| Invite | invitationTargetId | String? | nationId, face key (e.g. `shaman`), or sectId |
| Player | invitedByPlayerId | String? | Who invited this player (for analytics, "invited by X") |

## User Stories

### 1. Player-forged invitation BARs

- **P1**: As a player with `gameAccountReady`, I can forge an invitation BAR targeting a nation, school, or sect, so I can invite people into my community.
- **P2**: The forged BAR creates an Invite with `forgerId`, `invitationTargetType`, `invitationTargetId`; the BAR has `inviteId`.
- **P3**: I can share `/invite/claim/[barId]` or `/invite/[token]` with the recipient.

### 2. Recipient experience

- **P4**: As a recipient of a player-forged BAR, I land on the invite page with nation/school pre-filled from the invitation target (or forger's choices), so my entry feels personal.
- **P5**: After sign-up, I am linked to my inviter (`invitedByPlayerId`) and flow into the same Bruised Banana orientation as campaign sign-ups.

### 3. Quest integration

- **P6**: Completing "Invite an Ally" or the "Invite an Ally" branch of Strengthen the Residency allows me to forge an invitation BAR (or opens the forge flow).
- **P7**: The forged BAR is linked to the quest completion for tracking (e.g. "invited people to campaign" metric).

### 4. Onboarding flow merge

- **P8**: Player-led sign-up and campaign sign-up both use `assignOrientationThreads` with personalization; `invitedByPlayerId` and invitation target inform orientation content when available.

## Functional Requirements

### Phase 2: Schema + forge + pre-fill

- **FR1**: Add `forgerId`, `invitationTargetType`, `invitationTargetId` to Invite; add `invitedByPlayerId` to Player. Run `db:sync`.
- **FR2**: Create `forgeInvitationBar(playerId, targetType, targetId)` — creates Invite + CustomBar with inviteId; returns barId and token.
- **FR3**: Invite page pre-fills nation/school from invite when `invitationTargetType` and `invitationTargetId` are set (or from forger's nationId when target is nation).
- **FR4**: `createCharacter` accepts optional `invitedByPlayerId`; sets `Player.invitedByPlayerId` when invite has forgerId.

### Phase 3: Quest integration

- **FR5**: Strengthen the Residency END_INVITE branch and Invite an Ally quest: on completion, offer forge flow or auto-create invitation BAR.
- **FR6**: `processCompletionEffects` when `completionType=invite`: trigger forge flow or create BAR linked to quest.

### Phase 4: Deferred

- Sect support, analytics, "invited by X" UI.

## Dependencies

- [invitation-via-bar-ritual](../invitation-via-bar-ritual/spec.md)
- [bruised-banana-onboarding-flow](../bruised-banana-onboarding-flow/spec.md)
- [onboarding-flow-completion](../onboarding-flow-completion/spec.md)

## References

- [game-master-face-moves](../game-master-face-moves/spec.md) — Diplomat: Create invitation
- [conceptual-model](../../memory/conceptual-model.md)

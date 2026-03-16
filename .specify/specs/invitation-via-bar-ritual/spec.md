# Spec: Invitation-via-BAR Ritual

## Purpose

Implement the ritual flow: **Invitation (via BAR) → sign-up → orientation quest → game access**. Players receive an invitation delivered as a BAR; completing the ritual (claiming the invitation and signing up) gates access to the game world.

**Problem**: Invites exist but the token-based sign-up flow has no landing route (`/invite/[token]`). The gate for "game account ready" (invite + orientation complete) is implicit. Invitation BARs (CustomBar linked to Invite) are not modeled.

**Practice**: Schema first, gate explicit. Minimal surface: invite landing, gate helper, optional BAR linkage.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Invite landing** | `/invite/[token]` shows invite validity + sign-up form (createCharacter). Token from URL. |
| **Gate** | `gameAccountReady` = player has `inviteId` + `onboardingComplete`. Helper in auth lib. |
| **BAR linkage** | `CustomBar.inviteId` (optional). When set, BAR is an "invitation BAR" carrying that invite. |
| **Claim flow** | `/invite/claim/[barId]` resolves BAR → invite, redirects to `/invite/[token]`. Enables "invitation via BAR" share links. |
| **Routes to gate** | Game-world routes (e.g. `/world/*`, `/hand/*`, `/quest`, `/campaign/*`) check `gameAccountReady`; redirect to `/conclave/guided` or onboarding if not ready. |

## Conceptual Model

### Invite + CustomBar

| Model | Field | Type | Description |
|------|-------|------|-------------|
| Invite | (existing) | | token, status, maxUses, uses |
| CustomBar | inviteId | String? | When set, this BAR is an invitation BAR linked to that invite |
| Player | (existing) | | inviteId, onboardingComplete |

### gameAccountReady

```ts
// Derived, not stored
gameAccountReady(player) = player.inviteId != null && player.onboardingComplete === true
```

## User Stories

### P1: Invite landing page

**As a** recipient with an invite link, **I want** to visit `/invite/[token]` and see a sign-up form, **so** I can create my character and join.

**Acceptance**: `/invite/[token]` exists; shows invite validity; invalid/used token shows error; valid token shows createCharacter form (nation, playbook, identity).

### P2: Invitation via BAR claim

**As a** recipient who received an invitation BAR link, **I want** to visit `/invite/claim/[barId]` and be redirected to sign-up with the correct token, **so** I can complete the ritual.

**Acceptance**: Resolve BAR → invite; redirect to `/invite/[token]`. Invalid BAR or already-used invite shows error.

### P3: Game account ready gate

**As a** product owner, **I want** game-world routes to require `gameAccountReady`, **so** only players who have completed invitation + orientation can access the game.

**Acceptance**: Routes like `/world/*`, `/hand/*`, `/quest` redirect to onboarding when `!gameAccountReady`.

### P4: Admin create invitation BAR

**As an** admin, **I want** to create an invite and optionally link it to a BAR, **so** I can share invitation links via BAR content.

**Acceptance**: Admin can create Invite; optionally create CustomBar with inviteId; share `/invite/claim/[barId]` or `/invite/[token]`.

## Functional Requirements

### Phase 1: Invite landing + gate

- **FR1**: Add `/invite/[token]` route — fetch invite by token; if invalid/used, show error; if valid, render sign-up form (createCharacter with token in hidden field).
- **FR2**: Add `isGameAccountReady(player)` in `@/lib/auth` or auth utils. Returns `player.inviteId != null && player.onboardingComplete`.
- **FR3**: Gate `/world/*`, `/hand/*`, `/quest` (and optionally `/campaign/*` when not initiation): if `!isGameAccountReady`, redirect to `/conclave/guided` or `/conclave/onboarding`.
- **FR4**: Fix `/quest` redirect: change from `/invite/ANTIGRAVITY` to `/conclave/guided` for unauthenticated users (or keep invite as fallback if desired).

### Phase 2: BAR linkage + claim

- **FR5**: Add `inviteId` (String?, optional) to CustomBar in Prisma. Run `db:sync`.
- **FR6**: Add `/invite/claim/[barId]` route — fetch BAR, require inviteId; fetch invite; if invalid/used, show error; else redirect to `/invite/[token]`.
- **FR7**: Admin: extend create-invite script or admin UI to optionally create a CustomBar with inviteId when creating an invite. (Or document manual flow for v0.)

## Non-Functional Requirements

- **Backward compatibility**: Existing players with inviteId + onboardingComplete continue to work. Guided/campaign sign-ups create auto-invite; they get inviteId; gate passes when onboarding complete.
- **No breaking changes**: createCharacter, createGuidedPlayer, createCampaignPlayer unchanged in core logic.

## Out of Scope (This Spec)

- Sending invitation BARs to non-players by email (future: BarShare with toEmail).
- Orientation quest content changes.
- Invite creation UI in admin (scripts/create-invite.ts suffices for v0).

## Dependencies

- `prisma/schema.prisma` — Invite, Player, CustomBar
- `src/actions/conclave.ts` — createCharacter
- `src/lib/auth.ts` — getCurrentPlayer

## References

- Conversation summary: Invitation-via-BAR Ritual
- [cyoa-invitation-throughput](../cyoa-invitation-throughput/spec.md) — landing + ref
- [conceptual-model](../../memory/conceptual-model.md)

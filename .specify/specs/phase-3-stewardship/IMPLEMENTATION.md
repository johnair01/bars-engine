# Phase 3 — Stewardship Model: Implementation Scoping

**Source:** Code audit + SPEC.md decisions + decision session 2026-04-22
**Model:** B-2 (CampaignMembership + StewardScope)
**Status:** READY FOR ESTIMATION

---

## What We're Building

A scoped stewardship permission system for campaigns:

- **Campaign creators opt in** to stewardship (not auto-assigned)
- **CampaignMembership table** tracks who is a member vs. steward vs. owner per campaign
- **StewardScope** gates who can edit what — deck structure, spokes, portals, invites
- **Decomposition lifecycle** handles the zero-steward edge case
- **Campaign deck** is architecturally steward-owned, member-playable

---

## Migration (Sprint 0 — Database)

### Add enums

```prisma
enum MembershipRole {
  MEMBER
  STEWARD
  OWNER   // campaign creator — can promote/demote, set discoverability
}

enum StewardScope {
  FULL        // general steward — can touch everything
  DECK        // owns campaign deck structure
  SPOKE_1
  SPOKE_2
  SPOKE_3
  SPOKE_4
  // N spokes derived from campaign deck type at campaign init
}
```

### Add CampaignMembership table

```prisma
model CampaignMembership {
  id            String         @id @default(cuid())
  campaignId    String
  playerId      String
  role          MembershipRole
  stewardScope  StewardScope?  // null unless role = STEWARD
  createdAt     DateTime       @default(now())

  campaign Campaign @relation("CampaignMemberships", fields: [campaignId], references: [id], onDelete: Cascade)
  player  Player  @relation("CampaignMemberships", fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([campaignId, playerId])
  @@index([campaignId])
  @@index([playerId])
}
```

### Add fields to Campaign

```prisma
model Campaign {
  // ...
  /// Phase 3: steward ownership (extends createdById)
  /// Null = no steward yet (campaign in creation, not live)
  status             CampaignStatus @default(DRAFT)
  abandonmentFlagged Boolean        @default(false)  // decomposition in progress
  decompositionAt    DateTime?                        // decomposition timer deadline

  memberships CampaignMembership[] @relation("CampaignMemberships")
}
```

### Backfill existing campaigns

All campaigns where `createdById` is set → add `CampaignMembership` with `role = OWNER` for the creator. No migration needed for campaigns without membership records yet (they remain in draft until a steward opts in).

**Migration script:** `db/migrations/phase3-stewardship-backfill.sql`

---

## API Surface Changes

### New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/campaigns/:id/memberships` | List all members + roles + scopes |
| POST | `/api/campaigns/:id/memberships` | Add member/steward (steward-only) |
| PATCH | `/api/campaigns/:id/memberships/:playerId` | Change role or scope (owner-only) |
| DELETE | `/api/campaigns/:id/memberships/:playerId` | Remove member or demote steward |
| POST | `/api/campaigns/:id/memberships/:playerId/demote-self` | Steward demotes themselves → triggers decomposition check |
| GET | `/api/campaigns/:id/decomposition-status` | Check abandonment timer state |
| POST | `/api/campaigns/:id/accept-stewardship` | Accept stewardship invitation |
| GET | `/api/players/me/stewardship-orientation` | Check if current player has completed orientation |
| POST | `/api/players/me/stewardship-orientation/complete` | Mark orientation complete |

### Permission helpers needed

```
src/lib/campaign/stewardship.ts    — getCampaignRole(playerId, campaignId) → MembershipRole | null
src/lib/campaign/stewardship.ts    — canEdit(campaignId, playerId, scope) → boolean
src/lib/campaign/stewardship.ts    — requireSteward(campaignId, playerId) — throws 403
src/lib/campaign/stewardship.ts    — requireScope(campaignId, playerId, requiredScope) — throws 403
src/lib/campaign/decomposition.ts — triggerDecomposition(campaignId) — sets abandonment flag + timer
src/lib/campaign/decomposition.ts  — checkDecompositionTimer() — cron job, checks all abandoned campaigns
```

### Existing endpoints to gate

| Endpoint | Gate | Notes |
|----------|------|-------|
| POST `/api/campaigns/:id/deck/draw` | MEMBER or STEWARD | Any member can draw |
| PATCH `/api/campaigns/:id/deck` | DECK scope or FULL | Only deck steward can edit structure |
| POST/PATCH `/api/campaigns/:id/portals` | SPOKE_N or FULL | Scoped to spoke |
| POST `/api/campaigns/:id/invite` | STEWARD | Any steward can invite |
| POST `/api/campaigns/:id/quest-placement` | STEWARD | Draw-from-deck needs member check |
| POST `/api/campaigns/:id/deck/restruct` | OWNER only | Changes spoke architecture; orphan cleanup required |

---

## Frontend Changes

### New pages/components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CampaignMembershipList` | `campaign-detail.tsx` | Show steward list + scope badges |
| `MembershipManager` | `admin-campaign-deck.ts` | Add/promote/demote/remove members |
| `StewardScopeSelector` | membership promotion flow | Assign SPOKE_1–N at promotion time |
| `AbandonmentBanner` | `campaign-detail.tsx` | Visible when `abandonmentFlagged = true` |
| `StewardshipOrientationGate` | instance view | "Become a Steward" trigger for any player |
| `CampaignCreatorStewardGate` | campaign creation | Opt-in prompt + teaching moment at completion |
| `OrphanCleanupModal` | deck restructure | Block save until orphans reassigned or deleted |

### Updated flows

| Flow | Change |
|------|--------|
| Campaign creation | Final step: "Will you steward this campaign?" → Yes/No |
| Campaign detail | Steward list visible; abandonment banner if flagged |
| Deck draw | Members can draw; no scope gate on draw |
| Deck edit | Steward-only; scope gate |
| Portal create/edit | Scoped — SPOKE_N steward for that spoke, or FULL |
| Invite | Any steward can invite |
| Member promotion | Owner selects scope at promotion time; **orientation must be completed first** (checked via `GET /api/players/me/stewardship-orientation` before promotion proceeds) |

---

## Orphan Cleanup (O-1)

**Resolved decision (this session):** Orphan cleanup model.

When a steward restructures deck spokes:
1. System detects branches (CampaignPortals) that no longer attach to a valid spoke
2. Steward presented with orphan list before save completes
3. Must reassign each orphan to a valid spoke, or delete it
4. **Save blocked** until orphan list is empty (zero orphans required to commit)
5. Quest graphs attached to orphaned branches flagged for same cleanup

**Implementation:**
- `PATCH /api/campaigns/:id/deck/restruct` — accepts `{ spokeCount, orphanReassignments: [{orphanId, newSpokeIndex}] }`
- Validation: if `orphanReassignments` does not cover all orphans → 422 + orphan list returned
- Frontend: `OrphanCleanupModal` shows before save, blocks commit until resolved

---

## Decomposition Timer

- `campaign.decompositionAt = now() + 30 days` set when abandonment triggered
- Cron job: daily check on all campaigns where `abandonmentFlagged = true AND decompositionAt < now()`
- On timer expiry:
  - BARs: each member can export (existing export flow)
  - Quests: transfer to individual PlayerQuest inventories
  - Campaign deck: `status → ARCHIVED`, `decompositionAt → null`, `abandonmentFlagged → false`
  - Campaign hidden from public/discoverable lists

**Cron job:** `src/lib/campaign/decomposition.ts` — `checkAllDecompositionTimers()` — daily via existing cron infrastructure.

---

## Estimation

| Layer | Tasks | Notes |
|-------|-------|-------|
| Database migration | 1 SQL migration + backfill script | ~0.5 day |
| Permission lib (`stewardship.ts`) | 4 helpers + tests | ~0.5 day |
| New API endpoints | 9 endpoints | ~1 day |
| Gate existing endpoints | 6 endpoints | ~0.5 day |
| Decomposition logic | abandonment lifecycle + cron | ~0.5 day |
| Frontend: membership UI | new components | ~1 day |
| Frontend: gates + banners | updated flows | ~0.5 day |
| Orphan cleanup | backend validation + modal | ~0.5 day |
| **Total** | | **~5 days** |

**Note:** Estimation assumes O-4 (decomposition timeout) and O-2 (spoke count) are resolved before implementation starts. If not, those items become parallel tracks.

---

## Open Questions Log

| # | Question | Resolution | Owner | Priority |
|---|----------|-----------|-------|----------|
| O-1 | Deck restructure mutation | Orphan cleanup — save blocked until all orphans reassigned or deleted | RESOLVED | — |
| O-2 | Spoke count per deck type | 52-card deck = 4 spokes; 64-card deck = 8 spokes | RESOLVED | — |
| O-3 | Promote to steward without orientation? | No — orientation must be completed before promotion | RESOLVED | — |
| O-4 | Decomposition timeout | 30 days | RESOLVED | — |

**All open questions resolved.** Phase 3 is fully scoped.

---

## Metadata

Owner: [unassigned]
Sprint 0: Migration (0.5d)
Sprint 1: Core — permission lib + new endpoints (2d)
Sprint 2: Gate existing endpoints + decomposition (1d)
Sprint 3: Frontend membership UI + orphan cleanup (2d)
Sprint 4: Integration + testing (1d)
**Total: ~6.5 days**
Blocks: Phase 4 (#43), Phase 5, Phase 6 (#44)
Status: READY FOR DEVELOPMENT — 2026-04-22

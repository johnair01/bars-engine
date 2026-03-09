# Tasks: AID Decline Fork, Clock, and Lore Update

## Phase 1: Decline clock (schema + config + offerAid)

- [x] Add `expiresAt DateTime?` to GameboardAidOffer in prisma/schema.prisma
- [x] Run `npm run db:sync`
- [x] Add `aidOfferTtlHours` parsing from AppConfig.features (default 24)
- [x] In offerAid: compute and store expiresAt on create

## Phase 2: Decline clock UI

- [x] Ensure expiresAt is included in slot aidOffers include
- [x] GameboardClient: show "Respond by [date]" or "Expires in Xh" on each pending offer
- [x] Treat expired offers (expiresAt < now) as non-actionable for steward

## Phase 3: Fork on decline

- [x] Implement forkDeclinedAidQuest(offerId) in gameboard.ts
- [x] Add getDeclinedAidOffersForOfferer or extend getOrCreateGameboardSlots to return declined quest-type offers for offerer
- [x] GameboardClient: "Your declined AID" section with Fork button per offer
- [x] Prevent double-fork (filter or mark forked)

## Phase 4: Lore updates

- [x] Create docs/JIRA_GITHUB_CYOA_METAPHOR.md
- [x] Update .agent/context/game-master-sects.md: Architect as sys-admin teacher
- [x] Update FOUNDATIONS.md: version-managed backlog, metaphor, Architect
- [x] Update ARCHITECTURE.md: fork lifecycle, AID offer lifecycle, Architect
- [x] Update .specify/memory/conceptual-model.md: version management, backlog stewardship

## Phase 5: Verification quest

- [x] Create cert-aid-decline-fork-v1 Twine story (4 steps)
- [x] Add cert-aid-decline-fork-v1 to scripts/seed-cyoa-certification-quests.ts
- [x] npm run build and npm run check

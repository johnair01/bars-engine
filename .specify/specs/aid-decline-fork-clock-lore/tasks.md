# Tasks: AID Decline Fork, Clock, and Lore Update

## Phase 1: Decline clock (schema + config + offerAid)

- [ ] Add `expiresAt DateTime?` to GameboardAidOffer in prisma/schema.prisma
- [ ] Run `npm run db:sync`
- [ ] Add `aidOfferTtlHours` parsing from AppConfig.features (default 24)
- [ ] In offerAid: compute and store expiresAt on create

## Phase 2: Decline clock UI

- [ ] Ensure expiresAt is included in slot aidOffers include
- [ ] GameboardClient: show "Respond by [date]" or "Expires in Xh" on each pending offer
- [ ] Treat expired offers (expiresAt < now) as non-actionable for steward

## Phase 3: Fork on decline

- [ ] Implement forkDeclinedAidQuest(offerId) in gameboard.ts
- [ ] Add getDeclinedAidOffersForOfferer or extend getOrCreateGameboardSlots to return declined quest-type offers for offerer
- [ ] GameboardClient: "Your declined AID" section with Fork button per offer
- [ ] Prevent double-fork (filter or mark forked)

## Phase 4: Lore updates

- [ ] Create docs/JIRA_GITHUB_CYOA_METAPHOR.md
- [ ] Update .agent/context/game-master-sects.md: Architect as sys-admin teacher
- [ ] Update FOUNDATIONS.md: version-managed backlog, metaphor, Architect
- [ ] Update ARCHITECTURE.md: fork lifecycle, AID offer lifecycle, Architect
- [ ] Update .specify/memory/conceptual-model.md: version management, backlog stewardship

## Phase 5: Verification quest

- [ ] Create cert-aid-decline-fork-v1 Twine story (4 steps)
- [ ] Add cert-aid-decline-fork-v1 to scripts/seed-cyoa-certification-quests.ts
- [ ] npm run build and npm run check

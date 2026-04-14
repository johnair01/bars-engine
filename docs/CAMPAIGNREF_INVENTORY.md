# campaignRef inventory (issue #40)

**Spec kit:** [.specify/specs/campaignref-inventory-audit/spec.md](../.specify/specs/campaignref-inventory-audit/spec.md)  
**Parent ontology:** [.specify/specs/campaign-ontology-alignment/spec.md](../.specify/specs/campaign-ontology-alignment/spec.md)  
**Glossary (issue #39):** [docs/architecture/campaign-ontology-glossary.md](architecture/campaign-ontology-glossary.md)

## Classification tags

Use these when deciding migration order to canonical `campaignId`:

| Tag | Meaning |
|-----|---------|
| **canonical_identity** | Persists or resolves the initiative (DB row, server resolution to `Campaign`) |
| **routing** | URL/query/session handoff (`?ref=`, `returnTo`, redirects) |
| **content_grouping** | Adventures, slots, CYOA metadata, templates scoped by ref string |
| **progression** | Deck, spokes, milestones, Kotter, hub journey keyed by ref |
| **legacy_compat** | `OR: [{ campaignRef }, { slug }]` (or equivalent dual lookup) |
| **docs_only** | Comments, seeds, certification copy (low migration risk) |

## Migration map (subsystem → keys today)

“Mixed” means both `campaignId` and `campaignRef` appear in the same flow. **Tags** match § Classification tags above.

| Subsystem | `campaignId` | `campaignRef` | `instanceId` | Primary tags | Notes |
|-----------|:------------:|:-------------:|:------------:|--------------|--------|
| Prisma schema (`Instance`, `Campaign`, slots, deck, portals, milestones, `CustomBar`, etc.) | partial | yes | yes | canonical_identity, progression, content_grouping | Many models store `campaignRef` string; some relations use `campaignId` where FK exists |
| Campaign deck / gameboard / Kotter bump | | yes | mixed | progression, legacy_compat | `campaign-deck.ts`, `gameboard.ts` — dual slug/ref lookups common |
| Spoke moves / seed beds / GSCP | | yes | | progression, content_grouping | `spoke-move-seeds.ts`, `generated-spoke-cyoa.ts` |
| Campaign invitations / allyship intake | | yes | yes | canonical_identity, routing, legacy_compat | `campaign-invitation.ts`, `allyship-intake.ts` — instance + ref OR-branches |
| Portals / contributions / milestones | | yes | | progression | `campaign-portals.ts`, `campaign-contributions.ts`, milestone actions |
| CYOA intake / nursery | | yes | | routing, content_grouping | `cyoa-intake.ts`, `nursery-ritual.ts` |
| Slot → adventure launch | | yes | | content_grouping, routing | `campaign-slot-adventures.ts` |
| World spatial (`/world/[instanceSlug]/…`) | | via instance | yes | routing | `instance.campaignRef` for spoke states; map is instance-scoped |
| Donate / DSW / event hero | | yes | | routing, content_grouping | `donate.ts`, wizard components, `event/` pages |
| Composer / CYOA build schemas | | yes | | content_grouping | `cyoa-build/schemas.ts`, `composer-context.ts` |
| Lobby / API create-instance | | yes | yes | routing | `api/lobby/create-instance` |
| Bar create / quest placement / threads | | yes | mixed | content_grouping, progression | `create-bar.ts`, `quest-placement.ts`, `quest-thread.ts` |
| Hub journey client state | | yes | | progression | `hub-journey-state.ts` |
| OpenAPI / Bar Forge | | yes | | docs_only / contract | YAML examples for external clients |

## Tier-1 files (first migration passes)

Highest match counts in `src/actions` (see auto-index below). Use these when prioritizing `campaignId` resolution helpers or query refactors.

| Module | Primary tags | Migration note |
|--------|--------------|----------------|
| `campaign-deck.ts` | progression, legacy_compat | Central deck + portal session resolution; OR `campaignRef` / `slug` |
| `gameboard.ts` | progression, content_grouping | Board surface keyed by ref |
| `spoke-move-seeds.ts` | progression | Spoke/scene graph |
| `campaign-invitation.ts` | canonical_identity, legacy_compat | Heavy `instance` + `campaignRef` OR logic |
| `campaign-contributions.ts` | progression | Milestones / contributions |
| `campaign-portals.ts` | progression | Portal CRUD and links |
| `admin-campaign-deck.ts` | progression | Admin deck authoring |
| `cyoa-intake.ts` | content_grouping, routing | Intake flows |
| `generated-spoke-cyoa.ts` | content_grouping, progression | GSCP wizard |
| `allyship-intake.ts` | canonical_identity, routing | Spawned instances + refs |

## Regenerate file index

```bash
npm run campaignref:inventory
```

---

<!-- campaignref-inventory:auto:start -->

Auto-generated (**do not edit by hand** — run `npm run campaignref:inventory`).

Total files with at least one `campaignRef`: **260** (code roots: src, prisma, scripts, openapi).

> Spec references under `.specify/` are excluded from this scan; many specs mention `campaignRef` narratively.

### prisma (1 files)

| File | Matches |
|------|--------:|
| `prisma/schema.prisma` | 44 |

### src/actions (54 files)

| File | Matches |
|------|--------:|
| `src/actions/campaign-deck.ts` | 42 |
| `src/actions/gameboard.ts` | 42 |
| `src/actions/spoke-move-seeds.ts` | 41 |
| `src/actions/campaign-invitation.ts` | 35 |
| `src/actions/campaign-contributions.ts` | 26 |
| `src/actions/campaign-portals.ts` | 25 |
| `src/actions/admin-campaign-deck.ts` | 24 |
| `src/actions/cyoa-intake.ts` | 24 |
| `src/actions/generated-spoke-cyoa.ts` | 17 |
| `src/actions/allyship-intake.ts` | 14 |
| `src/actions/campaign-slot-adventures.ts` | 14 |
| `src/actions/nursery-ritual.ts` | 13 |
| `src/actions/emit-bar-from-passage.ts` | 12 |
| `src/actions/composer-context.ts` | 10 |
| `src/actions/cast-iching.ts` | 9 |
| `src/actions/quest-placement.ts` | 9 |
| `src/actions/campaign-home.ts` | 8 |
| `src/actions/campaign-marketplace-slots.ts` | 8 |
| `src/actions/campaign-milestone-guidance.ts` | 8 |
| `src/actions/create-bar-from-move-choice.ts` | 8 |
| `src/actions/create-bar.ts` | 8 |
| `src/actions/plant-seed-from-cyoa.ts` | 8 |
| `src/actions/plant-seed-from-spoke.ts` | 8 |
| `src/actions/quest-generation.ts` | 8 |
| `src/actions/campaign-landing.ts` | 7 |
| `src/actions/donate.ts` | 7 |
| `src/actions/quest-engine.ts` | 7 |
| `src/actions/quest-grammar.ts` | 7 |
| `src/actions/appreciation.ts` | 6 |
| `src/actions/instance.ts` | 6 |
| `src/actions/offer-bar-from-dsw.ts` | 6 |
| `src/actions/party-mini-game-bar.ts` | 6 |
| `src/actions/plant-bar-on-spoke.ts` | 6 |
| `src/actions/quest-proposals.ts` | 5 |
| `src/actions/campaign-overview.ts` | 4 |
| `src/actions/campaign-spoke-states.ts` | 4 |
| `src/actions/compile-spoke-quest.ts` | 4 |
| `src/actions/conclave.ts` | 4 |
| `src/actions/event-bingo.ts` | 4 |
| `src/actions/gm-face-move-quest-seed.ts` | 4 |
| `src/actions/quest-completion.ts` | 4 |
| `src/actions/swap-listing.ts` | 4 |
| `src/actions/agent-content-proposal.ts` | 3 |
| `src/actions/archetype-agent-ecology.ts` | 3 |
| `src/actions/campaign-link.ts` | 3 |
| `src/actions/event-campaign-engine.ts` | 3 |
| `src/actions/config.ts` | 2 |
| `src/actions/generate-quest.ts` | 2 |
| `src/actions/library.ts` | 2 |
| `src/actions/onboarding-bar.ts` | 2 |
| `src/actions/quest-thread.ts` | 2 |
| `src/actions/agent-game-loop.ts` | 1 |
| `src/actions/cyoa-generator.ts` | 1 |
| `src/actions/forge-invitation-bar.ts` | 1 |

### src/app (66 files)

| File | Matches |
|------|--------:|
| `src/app/adventure/[id]/play/AdventurePlayer.tsx` | 31 |
| `src/app/campaign/spoke/[index]/page.tsx` | 22 |
| `src/app/campaign/board/GameboardClient.tsx` | 19 |
| `src/app/campaign/board/page.tsx` | 15 |
| `src/app/campaign/components/CampaignReader.tsx` | 14 |
| `src/app/campaign/landing/page.tsx` | 14 |
| `src/app/adventure/[id]/play/page.tsx` | 13 |
| `src/app/cyoa-intake/[id]/CyoaIntakeRunner.tsx` | 13 |
| `src/app/page.tsx` | 13 |
| `src/app/quest/create/page.tsx` | 13 |
| `src/app/campaign/[ref]/spoke/[n]/seeds/page.tsx` | 12 |
| `src/app/campaign/hub/page.tsx` | 12 |
| `src/app/campaign/marketplace/page.tsx` | 11 |
| `src/app/campaign/page.tsx` | 11 |
| `src/app/campaign/marketplace/MarketplaceStallActions.tsx` | 10 |
| `src/app/admin/campaign/[ref]/author/actions.ts` | 9 |
| `src/app/admin/campaign/[ref]/author/page.tsx` | 9 |
| `src/app/adventure/hub/[questId]/page.tsx` | 9 |
| `src/app/campaign/event/[eventSlug]/initiation/page.tsx` | 9 |
| `src/app/admin/campaign/[ref]/deck/page.tsx` | 8 |
| `src/app/event/donate/wizard/page.tsx` | 8 |
| `src/app/admin/campaign/[ref]/deck/AdminCampaignDeckWizard.tsx` | 7 |
| `src/app/admin/templates/GenerateTemplateButton.tsx` | 7 |
| `src/app/conclave/guided/page.tsx` | 7 |
| `src/app/iching/page.tsx` | 7 |
| `src/app/admin/adventures/[id]/passages/[passageId]/edit/page.tsx` | 6 |
| `src/app/api/adventures/[slug]/[nodeId]/route.ts` | 6 |
| `src/app/campaign/[ref]/fundraising/page.tsx` | 6 |
| `src/app/campaign/spoke/[index]/generated/page.tsx` | 6 |
| `src/app/demo/orientation/DemoOrientationClient.tsx` | 6 |
| `src/app/admin/quest-from-context/QuestFromContextForm.tsx` | 5 |
| `src/app/campaign/spoke/[index]/generated/GeneratedSpokeCyoaWizard.tsx` | 5 |
| `src/app/campaign/twine/page.tsx` | 5 |
| `src/app/campaigns/landing/[slug]/page.tsx` | 5 |
| `src/app/event/page.tsx` | 5 |
| `src/app/admin/adventures/[id]/page.tsx` | 4 |
| `src/app/admin/campaign/[ref]/community-character/page.tsx` | 4 |
| `src/app/admin/quest-from-context/page.tsx` | 4 |
| `src/app/campaign/board/CampaignMapChrome.tsx` | 4 |
| `src/app/conclave/guided/components/GuidedAuthForm.tsx` | 4 |
| `src/app/admin/adventures/actions.ts` | 3 |
| `src/app/admin/campaign/[ref]/author/GenerateAllForm.tsx` | 3 |
| `src/app/admin/campaign/[ref]/author/GenerateFromDeckForm.tsx` | 3 |
| `src/app/adventures/page.tsx` | 3 |
| `src/app/map/page.tsx` | 3 |
| `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx` | 3 |
| `src/app/admin/allyship-intakes/page.tsx` | 2 |
| `src/app/admin/templates/page.tsx` | 2 |
| `src/app/campaign/initiation/page.tsx` | 2 |
| `src/app/composer/[adventureId]/page.tsx` | 2 |
| `src/app/event/EventHero.tsx` | 2 |
| `src/app/world/[instanceSlug]/[roomSlug]/page.tsx` | 2 |
| `src/app/admin/adventures/[id]/CampaignRefForm.tsx` | 1 |
| `src/app/admin/adventures/[id]/passages/[passageId]/edit/actions.ts` | 1 |
| `src/app/admin/instances/page.tsx` | 1 |
| `src/app/admin/templates/actions.ts` | 1 |
| `src/app/adventures/[id]/play/PassageRenderer.tsx` | 1 |
| `src/app/api/lobby/create-instance/route.ts` | 1 |
| `src/app/api/onboarding/donation-url/route.ts` | 1 |
| `src/app/campaign/[ref]/page.tsx` | 1 |
| `src/app/campaign/components/CampaignAuthForm.tsx` | 1 |
| `src/app/campaign/slot/[slotId]/page.tsx` | 1 |
| `src/app/cyoa-intake/[id]/page.tsx` | 1 |
| `src/app/invite/event/[barId]/page.tsx` | 1 |
| `src/app/wiki/campaign/bruised-banana/house/page.tsx` | 1 |
| `src/app/wiki/campaign/bruised-banana/page.tsx` | 1 |

### src/lib (74 files)

| File | Matches |
|------|--------:|
| `src/lib/cyoa-intake/spoke-generator.ts` | 21 |
| `src/lib/vault-bingo.ts` | 17 |
| `src/lib/campaign-map.ts` | 13 |
| `src/lib/gameboard.ts` | 13 |
| `src/lib/spatial-world/nursery-rooms.ts` | 13 |
| `src/lib/cyoa-build/types.ts` | 12 |
| `src/lib/cyoa/__tests__/build-contract.test.ts` | 12 |
| `src/lib/campaign-domain-deck.ts` | 10 |
| `src/lib/spoke-move-beds.ts` | 10 |
| `src/lib/campaign-marketplace-queries.ts` | 9 |
| `src/lib/cyoa/build-contract.ts` | 9 |
| `src/lib/__tests__/kotter-quest-seed-grammar.test.ts` | 8 |
| `src/lib/bruised-banana-milestone/snapshot.ts` | 8 |
| `src/lib/campaign-subcampaigns.ts` | 8 |
| `src/lib/narrative-os/instance-overlays.ts` | 8 |
| `src/lib/bar-quest-generation/__tests__/interpretation.test.ts` | 7 |
| `src/lib/cyoa-build/__tests__/schemas.test.ts` | 7 |
| `src/lib/demo-orientation/resolve.ts` | 7 |
| `src/lib/quest-scope.ts` | 7 |
| `src/lib/ui/campaign-skin.ts` | 7 |
| `src/lib/ui/resolve-campaign-skin.ts` | 7 |
| `src/lib/vault-event-invite-bars.ts` | 7 |
| `src/lib/bar-quest-generation/generate.ts` | 6 |
| `src/lib/bruised-banana-milestone/guided-actions.ts` | 6 |
| `src/lib/campaign-instance-resolve.ts` | 6 |
| `src/lib/cyoa-composer/__tests__/checkpoint-persistence.test.ts` | 6 |
| `src/lib/donation-instance.ts` | 6 |
| `src/lib/iching-cast-context.ts` | 6 |
| `src/lib/bar-quest-generation/eligibility.ts` | 5 |
| `src/lib/bruised-banana-milestone/__tests__/guided-actions.test.ts` | 5 |
| `src/lib/campaign-passage-permissions.ts` | 5 |
| `src/lib/cyoa-intake/inferGmFace.ts` | 5 |
| `src/lib/gm-face-move-quest-persist.ts` | 5 |
| `src/lib/offer-bar/validate.ts` | 5 |
| `src/lib/resolve-marketplace-campaign-ref.ts` | 5 |
| `src/lib/template-library/index.ts` | 5 |
| `src/lib/allyship-intake-permissions.ts` | 4 |
| `src/lib/bar-quest-generation/campaign-phase.ts` | 4 |
| `src/lib/bar-quest-generation/proposal-builder.ts` | 4 |
| `src/lib/campaign-deck.ts` | 4 |
| `src/lib/cyoa-build/schemas.ts` | 4 |
| `src/lib/event-invite-bar-permissions.ts` | 4 |
| `src/lib/kotter-quest-seed-grammar.ts` | 4 |
| `src/lib/onboarding-cyoa-generator/generateOnboardingCYOA.ts` | 4 |
| `src/lib/party-mini-game/definitions.ts` | 4 |
| `src/lib/spatial-world/octagon-campaign-hub.ts` | 4 |
| `src/lib/bar-quest-generation/publish.ts` | 3 |
| `src/lib/campaign-hub/hub-journey-state.ts` | 3 |
| `src/lib/demo-orientation/__tests__/apiSlug.test.ts` | 3 |
| `src/lib/donation-wizard.ts` | 3 |
| `src/lib/event-invite-party.ts` | 3 |
| `src/lib/__tests__/spoke-move-beds.test.ts` | 2 |
| `src/lib/bar-quest-generation/types.ts` | 2 |
| `src/lib/bruised-banana-house-state.ts` | 2 |
| `src/lib/bruised-banana-milestone/types.ts` | 2 |
| `src/lib/campaign-deck-quests.ts` | 2 |
| `src/lib/campaign-player-home.ts` | 2 |
| `src/lib/cyoa-intake/intakeSurface.ts` | 2 |
| `src/lib/cyoa-intake/npc-slot-resolver.ts` | 2 |
| `src/lib/generated-spoke-cyoa/types.ts` | 2 |
| `src/lib/narrative/collaborative-quest-api.ts` | 2 |
| `src/lib/offer-bar/__tests__/validate.test.ts` | 2 |
| `src/lib/starter-quests.ts` | 2 |
| `src/lib/bar-quest-generation/interpretation.ts` | 1 |
| `src/lib/bruised-banana-milestone/__tests__/snapshot.test.ts` | 1 |
| `src/lib/campaign-hub/__tests__/hub-journey-state.test.ts` | 1 |
| `src/lib/cyoa-composer/__tests__/branch-point-detection.test.ts` | 1 |
| `src/lib/cyoa-composer/__tests__/revalidation-trigger-guard.test.ts` | 1 |
| `src/lib/generated-spoke-cyoa/generate-passages.ts` | 1 |
| `src/lib/offer-bar/types.ts` | 1 |
| `src/lib/onboarding-cyoa-generator/types.ts` | 1 |
| `src/lib/party-mini-game/completion-effects-party-mini-game.ts` | 1 |
| `src/lib/quest-wizard-kotter-stamp.ts` | 1 |
| `src/lib/spatial-world/bb-campaign-clearing-path.ts` | 1 |

### src/components (29 files)

| File | Matches |
|------|--------:|
| `src/components/campaign/CampaignHubView.tsx` | 19 |
| `src/components/event/DonationSelfServiceWizard.tsx` | 15 |
| `src/components/campaign/SpokeNurseryBeds.tsx` | 9 |
| `src/components/world/SpokePortalModal.tsx` | 9 |
| `src/components/dashboard/CampaignModal.tsx` | 8 |
| `src/components/admin/CampaignRefLinks.tsx` | 6 |
| `src/components/campaign/GmFaceMovesPanel.tsx` | 6 |
| `src/components/campaign/CampaignDonateButton.tsx` | 5 |
| `src/components/dashboard/CampaignsResponsibleSection.tsx` | 5 |
| `src/components/event/OfferBarModal.tsx` | 5 |
| `src/components/quest-creation/QuestWizard.tsx` | 5 |
| `src/components/admin/InstanceEditModal.tsx` | 4 |
| `src/components/adventure/seams/SeamBarCreate.tsx` | 4 |
| `src/components/campaign-hub/CollaborationBoard.tsx` | 4 |
| `src/components/campaign/CampaignDonateCta.tsx` | 4 |
| `src/components/campaign/GmFaceMoveQuestPickButton.tsx` | 4 |
| `src/components/CastingRitual.tsx` | 4 |
| `src/components/hand/CampaignInviteBarSendCard.tsx` | 4 |
| `src/components/campaign/ContributionProgressBar.tsx` | 3 |
| `src/components/composer/ComposerContainer.tsx` | 3 |
| `src/components/CreateBarForm.tsx` | 3 |
| `src/components/cyoa/YesAndDrawer.tsx` | 3 |
| `src/components/campaign/CampaignMilestoneStrip.tsx` | 2 |
| `src/components/CastIChingModal.tsx` | 2 |
| `src/components/hand/VaultCampaignInviteBars.tsx` | 2 |
| `src/components/QuestThread.tsx` | 2 |
| `src/components/admin/InstanceListWithEdit.tsx` | 1 |
| `src/components/dashboard/DashboardSectionButtons.tsx` | 1 |
| `src/components/hand/PlacementModal.tsx` | 1 |

### src/other (1 files)

| File | Matches |
|------|--------:|
| `src/hooks/useSpokeQuest.ts` | 7 |

### scripts (33 files)

| File | Matches |
|------|--------:|
| `scripts/seed-campaign-portal-adventure.ts` | 15 |
| `scripts/seed-keeping-warm-campaign.ts` | 11 |
| `scripts/seed-bruised-banana-house-instance.ts` | 8 |
| `scripts/verify-event-invite-seed.ts` | 8 |
| `scripts/seed-cyoa-certification-quests.ts` | 7 |
| `scripts/seed_bruised_banana_quest_map.ts` | 6 |
| `scripts/seed-allyship-instances.ts` | 6 |
| `scripts/seed-bruised-banana-event-invite-bar.ts` | 6 |
| `scripts/seed-bruised-banana-house-quests.ts` | 5 |
| `scripts/seed-demo-orientation-link.ts` | 5 |
| `scripts/seed-golden-path-campaign.ts` | 5 |
| `scripts/list-bb-instances.ts` | 4 |
| `scripts/seed-bruised-banana-residency-milestone.ts` | 4 |
| `scripts/campaignref-inventory.ts` | 3 |
| `scripts/run-bruised-banana-wake-up-verification.ts` | 3 |
| `scripts/seed-bb-campaign-octagon-room.ts` | 3 |
| `scripts/seed-mtgoa-chapter1-cyoa.ts` | 3 |
| `scripts/find-schema-drift.ts` | 2 |
| `scripts/import-npc-twee.ts` | 2 |
| `scripts/seed-bb-donation-demo-bar.ts` | 2 |
| `scripts/seed-bruised-banana-adventure.ts` | 2 |
| `scripts/seed-bruised-banana-campaign.ts` | 2 |
| `scripts/seed-campaign-subcampaigns.ts` | 2 |
| `scripts/seed-clothing-swap-event-invite-bar.ts` | 2 |
| `scripts/seed-first-quest-stub-options.ts` | 2 |
| `scripts/seed-onboarding-thread.ts` | 2 |
| `scripts/propose-agent-content.ts` | 1 |
| `scripts/seed-chained-initiation.ts` | 1 |
| `scripts/seed-creator-scene-grid-deck.ts` | 1 |
| `scripts/seed-cyoa-intake-bruised-banana.ts` | 1 |
| `scripts/seed-mtgoa-spatial-world.ts` | 1 |
| `scripts/seed-nursery-rooms.ts` | 1 |
| `scripts/strand-invitation-gap-analysis.ts` | 1 |

### openapi (2 files)

| File | Matches |
|------|--------:|
| `openapi/bar-forge-custom-gpt.yaml` | 12 |
| `openapi/bar-forge-api.yaml` | 1 |

<!-- campaignref-inventory:auto:end -->

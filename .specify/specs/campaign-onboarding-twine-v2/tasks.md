# Tasks: Campaign Onboarding Twine v2 — Bruised Banana Initiation

## Phase 1: Twine Story + Source of Truth

- [ ] Create `content/twine/bruised-banana-initiation.twee` (or `content/campaigns/bruised-banana/initiation.twee`)

- [ ] Add passages: Start, LensSelection, SetLens*, Signal, Refine, Quadrant*, Claim, Structure, Weave, Mint, ChooseGM, GM*, Commit, KB_*, Donate_*, DonateSmall/DonateMedium/DonateLarge, ExternalDonate

- [ ] Document state variables in story (lens, rawSignal, refinedSignal, quadrant, barPublished, barAttachedToQuest, signalConnected, vibeulonMinted, gm, donationSource, donationTier)

- [ ] Add seed script or import step to load Twine story into TwineStory table (slug: `bruised-banana-initiation`)

- [ ] Wire campaign page to use initiation story when `ref=bruised-banana`

## Phase 2: Twine Renderer + Learn More

- [ ] Verify KB_* passage navigation works ([[Label|KB_SomePage]] and return links)

- [ ] Ensure each KB_* passage includes return link to ritual spine

- [ ] Extend PassageRenderer or campaign API to accept and persist state from passage transitions (SetLens*, Refine, Quadrant*, GM*)

## Phase 3: Onboarding State + Analytics

- [ ] Create or extend `src/lib/onboarding-state.ts` for in-memory state (lens, rawSignal, refinedSignal, quadrant, gm, barPublished, barAttachedToQuest, vibeulonMinted)

- [ ] Optional: persist state to Player.storyProgress when signed in

- [ ] Add analytics events: `onboarding_lens_selected`, `onboarding_signal_entered`, `onboarding_refined_entered`, `onboarding_quadrant_selected`, `onboarding_bar_published`, `onboarding_microquest_attached`, `onboarding_vibeulon_minted_demo`, `onboarding_gm_selected`, `onboarding_kb_opened`, `onboarding_donate_clicked`

- [ ] Fire events at appropriate passage transitions

## Phase 4: BAR Creation Integration

- [ ] At Claim step: create CustomBar with title (first ~40 chars of refinedSignal), content (refinedSignal), tags (lens, quadrant, campaignTag "BruisedBanana"), rawSignal in metadata

- [ ] Handle creatorId (system user or placeholder for anonymous)

- [ ] Mark barPublished = true in state

## Phase 5: Micro-Quest Attach + Mint

- [ ] Ensure onboarding micro-quest exists for Bruised Banana (create if missing)

- [ ] At Structure step: attach created BAR to onboarding micro-quest; mark barAttachedToQuest = true

- [ ] At Mint step: mint real vibeulon if available; otherwise record demo event and set vibeulonMinted = true

- [ ] UI: show vibeulon feedback (simulated if demo)

## Phase 6: Donation Hybrid + Telemetry

- [ ] Implement Donate_* passages (Donate_<Source> sets donationSource; DonateSmall/DonateMedium/DonateLarge set tier)

- [ ] Intercept external donation URL click; fire `onboarding_donate_clicked` with { donationSource, donationTier, lens, gm, campaignId }

- [ ] Append query params to external URL if safe

## Phase 7: Signup → Orientation Preload

- [ ] Extend `assignOrientationThreads` to accept lens, gm, quadrant

- [ ] Use lens/gm/quadrant to preload 2–5 orientation quests in campaign instance

- [ ] Ensure Bruised Banana instance has orientation quests tagged by lens/domain

## Phase 8: Verification Quest

- [ ] Add `cert-campaign-onboarding-twine-v2-v1` to `scripts/seed-cyoa-certification-quests.ts`

- [ ] Twine story: verify initiation flow, BAR creation, micro-quest attach, vibeulon mint, GM selection, commitment gate, optional donation

- [ ] Final passage: no link; completing mints reward

- [ ] Narrative: preparing the party for the Bruised Banana Fundraiser

## Verification

- [ ] `/campaign?ref=bruised-banana` loads initiation Twine story

- [ ] Full flow: lens → signal → refine → quadrant → claim → BAR created → Structure → attach → Mint → vibeulon → ChooseGM → Commit

- [ ] KB_* passages navigable and returnable

- [ ] Donation click fires telemetry and opens external URL

- [ ] Signup leads to orientation quests preloaded by lens

- [ ] `npm run seed:cert:cyoa` seeds cert-campaign-onboarding-twine-v2-v1

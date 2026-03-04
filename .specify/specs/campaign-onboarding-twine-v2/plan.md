# Plan: Campaign Onboarding Twine v2 — Bruised Banana Initiation

## Summary

Replace or augment the current Bruised Banana campaign flow with a Twine-authored initiation story. The story guides players through lens selection, signal capture, BAR creation, micro-quest attach, vibeulon mint, Game Master selection, and commitment gate. Learn-more pages are KB_* passages; donation is hybrid (Twine pre-chamber + external portal) with telemetry. Orientation quests preload after signup based on lens/gm/quadrant.

## Phase 1: Twine Story + Source of Truth

### 1.1 Create Twine story file

**File**: `content/twine/bruised-banana-initiation.twee` (or `content/campaigns/bruised-banana/initiation.twee`)

- Passages: Start, LensSelection, SetLens* (allyship/creative/strategic/community), Signal, Refine, Quadrant* (me/it/we/its), Claim, Structure, Weave, Mint, ChooseGM, GM* (6 faces), Commit, KB_*, Donate_*, DonateSmall/DonateMedium/DonateLarge, ExternalDonate
- State variables documented in passage tags or comments: lens, rawSignal, refinedSignal, quadrant, barPublished, barAttachedToQuest, signalConnected, vibeulonMinted, gm, donationSource, donationTier
- No SugarCube macros in runtime; app sets variables via bindings or passage metadata

### 1.2 Seed / import pipeline

- Add seed script or import step to load Twine story into TwineStory table
- Slug: `bruised-banana-initiation` or equivalent
- Campaign page (`/campaign?ref=bruised-banana`) uses this story instead of (or in addition to) current dynamic BB nodes

## Phase 2: Twine Renderer + Learn More

### 2.1 KB passage navigation

**File**: `src/app/adventures/[id]/play/PassageRenderer.tsx` (or equivalent)

- Ensure `[[Label|KB_SomePage]]` and `[[Back|Claim]]` (or similar) work
- No special-case UI; standard link parsing already supports passage names
- Verify KB_* passages always include return link to ritual spine

### 2.2 Passage bindings for state

- When navigating to SetLens*, Refine, Quadrant*, GM*, etc., capture user input via existing bindings (e.g. BIND markers, form inputs)
- Extend PassageRenderer or campaign API to accept and persist state from passage transitions

## Phase 3: Onboarding State + Analytics

### 3.1 State persistence

**File**: New or extend `src/lib/onboarding-state.ts` (or campaign context)

- In-memory state: lens, rawSignal, refinedSignal, quadrant, gm, barPublished, barAttachedToQuest, vibeulonMinted
- Optional: persist to server via Player.storyProgress or new OnboardingState model when signed in
- State survives passage navigation within session

### 3.2 Analytics events

**File**: `src/lib/analytics.ts` or equivalent (or use existing event logging)

- Events: `onboarding_lens_selected`, `onboarding_signal_entered`, `onboarding_refined_entered`, `onboarding_quadrant_selected`, `onboarding_bar_published`, `onboarding_microquest_attached`, `onboarding_vibeulon_minted_demo`, `onboarding_gm_selected`, `onboarding_kb_opened`, `onboarding_donate_clicked`
- Fire at appropriate passage transitions or form submissions
- `onboarding_donate_clicked` payload: { donationSource, donationTier, lens, gm, campaignId }

## Phase 4: BAR Creation Integration

### 4.1 Claim step → create BAR

**File**: `src/actions/create-bar.ts` or new `src/actions/onboarding-bar.ts`

- When reaching Claim (or passage that triggers BAR creation): create CustomBar with visibility 'public', title (first ~40 chars of refinedSignal), description (refinedSignal), tags (lens, quadrant, campaignTag "BruisedBanana")
- Store rawSignal in metadata (docQuestMetadata or new JSON field)
- Creator: anonymous or placeholder until signup; may need schema for "unclaimed" BAR
- Mark barPublished = true in state

### 4.2 Schema considerations

- CustomBar.creatorId is required — use system user or allow null if schema permits
- Tags: use existing inputs JSON or add campaignTag field
- Check [prisma/schema.prisma](../../prisma/schema.prisma) for BAR creation constraints

## Phase 5: Micro-Quest Attach + Mint

### 5.1 Onboarding micro-quest

**File**: Seed script or Admin

- Ensure onboarding micro-quest exists for Bruised Banana campaign (create if missing)
- Slug or id: deterministic (e.g. `onboarding-micro-quest-bruised-banana`)

### 5.2 Structure step → attach BAR to quest

- At Structure passage: link created BAR to onboarding micro-quest (BarQuest or ThreadQuest relation)
- Mark barAttachedToQuest = true

### 5.3 Mint step → vibeulon

- If real mint exists: call existing mint flow
- Otherwise: record `onboarding_vibeulon_minted_demo` and set vibeulonMinted = true
- UI: show "1 vibeulon" or similar as simulated feedback

## Phase 6: Donation Hybrid + Telemetry

### 6.1 Donate_* passages

- Donate_<Source> sets donationSource (e.g. Donate_EmotionalFuel → "EmotionalFuel")
- User chooses tier → DonateSmall (spark), DonateMedium (flame), DonateLarge (heat)
- ExternalDonate passage: link to external donation URL

### 6.2 Pre-click telemetry

**File**: PassageRenderer or link interceptor

- Intercept click on external donation URL
- Fire `onboarding_donate_clicked` with { donationSource, donationTier, lens, gm, campaignId }
- Append query params to URL: `?source=...&tier=...&lens=...&gm=...` (if external portal supports)

### 6.3 External URL config

- Instance.stripeOneTimeUrl or similar; append params if Stripe supports UTM-style params

## Phase 7: Signup → Orientation Preload

### 7.1 assignOrientationThreads extension

**File**: `src/actions/quest-thread.ts`

- Already accepts allyshipDomains, developmentalHint
- Add lens (or map lens → allyshipDomain), gm, quadrant to params
- Use to filter or flavor 2–5 orientation quests
- Create campaign player with storyProgress containing onboarding state

### 7.2 Campaign instance

- Ensure Bruised Banana instance has orientation quests tagged by lens/domain
- Preload after signup redirect to /conclave/onboarding

## Phase 8: Verification Quest

### 8.1 cert-campaign-onboarding-twine-v2-v1

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add Twine story: verify initiation flow, BAR creation, micro-quest attach, vibeulon mint, GM selection, commitment gate, optional donation
- Final passage: no link; completing mints reward
- Narrative: preparing the party for the Bruised Banana Fundraiser

## File Structure

| Action | File |
|--------|------|
| Create | `content/twine/bruised-banana-initiation.twee` (or campaigns path) |
| Create | `src/lib/onboarding-state.ts` (or extend existing) |
| Create | `src/actions/onboarding-bar.ts` (or extend create-bar) |
| Modify | `src/app/campaign/page.tsx` (use initiation story when ref=bruised-banana) |
| Modify | `src/app/adventures/[id]/play/PassageRenderer.tsx` (state bindings, KB links) |
| Modify | `src/actions/twine.ts` or advanceRun (state + analytics hooks) |
| Modify | `src/actions/quest-thread.ts` (orientation preload from lens/gm/quadrant) |
| Modify | `scripts/seed-cyoa-certification-quests.ts` (cert-campaign-onboarding-twine-v2-v1) |
| Create/Modify | Analytics/event logging for onboarding events |

## Verification

- Play `/campaign?ref=bruised-banana` → initiation Twine story loads
- Navigate: lens → signal → refine → quadrant → claim → BAR created
- Structure → BAR attached to micro-quest
- Mint → vibeulon (demo or real)
- ChooseGM → gm selected
- Commit → donate/signup/preview
- KB_* → navigate and return
- Donate_* → tier selected → external URL opens with telemetry fired
- Signup → orientation quests preloaded by lens
- `npm run seed:cert:cyoa` → cert-campaign-onboarding-twine-v2-v1 appears

## Reference

- Spec: [.specify/specs/campaign-onboarding-twine-v2/spec.md](spec.md)
- Lore CYOA: [.specify/specs/lore-cyoa-onboarding/spec.md](../lore-cyoa-onboarding/spec.md)
- Onboarding Adventures Unification: [.specify/specs/onboarding-adventures-unification/spec.md](../onboarding-adventures-unification/spec.md)

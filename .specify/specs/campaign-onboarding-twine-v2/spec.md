# Spec: Campaign Onboarding Twine v2 — Bruised Banana Initiation + Learn More + Donation Telemetry

## Purpose

Update the Bruised Banana campaign onboarding to a Twine-authored initiation experience. The flow guides players through signal capture, BAR creation, micro-quest attachment, vibeulon mint, Game Master selection, and a commitment gate (donate/signup/preview). Learn-more pages live as Twine passages (KB_*); donation uses hybrid Twine + external portal with telemetry.

## Context / Goal

We already support Twine adventures (passage parsing + link navigation). This spec wires the Bruised Banana onboarding to a new Twine story that implements the Librarian Campaign Voice Style Guide initiation sequence: presence first, mechanics second.

## Conceptual Model (Game Language)

- **WHO**: Game Master (6 faces) — selected during onboarding; flavors quest copy later
- **WHAT**: BAR (kernel) — created from refined signal; attached to micro-quest
- **WHERE**: Lens maps to allyship domain (allyship / creative / strategic / community → GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING)
- **Energy**: Vibeulons — minted (real or demo) at Mint step
- **Personal throughput**: Initiation ritual spine — Signal → Refinement → Action → Crystallization

## User Stories

### P1: Twine-authored initiation flow

**As a visitor**, I want to play through a Twine story that guides me through lens selection, signal capture, refinement, quadrant, BAR publish, micro-quest attach, vibeulon mint, Game Master selection, and commitment gate, so that I experience the initiation ritual before signing up.

**Acceptance**: Bruised Banana onboarding uses `bruised-banana-initiation.twee` (or equivalent) as the flow. Passages: Start, LensSelection, SetLens*, Signal, Refine, Quadrant*, Claim, Structure, Weave, Mint, ChooseGM, GM*, Commit, KB_*, Donate_*, DonateSmall/DonateMedium/DonateLarge, ExternalDonate.

### P2: Learn more as Twine passages

**As a visitor**, I want optional "Learn more" links that jump to KB_* passages and return to the ritual spine, so I can deepen understanding without leaving the flow.

**Acceptance**: KB_* passages are navigable; each includes a return link. No separate KB system required.

### P3: Donation hybrid + telemetry

**As a visitor**, I want to click a donation link in Twine, see an immersive pre-donation passage (Donate_*), choose a tier (spark/flame/heat), then open the external donation portal, so that my choice is captured and the portal receives context.

**Acceptance**: Donation click fires `onboarding_donate_clicked` with donationSource, donationTier, lens, gm, campaignId. External URL receives these as query params (if safe).

### P4: BAR creation during onboarding

**As a visitor**, I want my refined signal to become a public BAR at the Claim step, so that my contribution is crystallized before signup.

**Acceptance**: BAR created with title (first ~40 chars of refinedSignal), content (refinedSignal), tags (lens, quadrant, campaignTag "BruisedBanana"), rawSignal in metadata.

### P5: Micro-quest attach + vibeulon mint

**As a visitor**, I want my BAR attached to an onboarding micro-quest at Structure, and a vibeulon minted (real or demo) at Mint, so that I experience the quest loop.

**Acceptance**: BAR attached to pre-existing onboarding micro-quest; mint step records demo or real vibeulon.

### P6: Orientation quests preloaded after signup

**As a visitor who signs up**, I want 2–5 orientation quests appropriate to my lens preloaded in the campaign instance, so that I land in relevant work.

**Acceptance**: `assignOrientationThreads` (or equivalent) uses lens/gm/quadrant to preload orientation quests.

## Functional Requirements

### Twine story

- **FR1**: Twine file `bruised-banana-initiation.twee` (or equivalent) MUST exist with passages: Start, LensSelection, SetLens*, Signal, Refine, Quadrant*, Claim, Structure, Weave, Mint, ChooseGM, GM*, Commit, KB_*, Donate_*, DonateSmall/DonateMedium/DonateLarge, ExternalDonate.
- **FR2**: State variables: lens, rawSignal, refinedSignal, quadrant, barPublished, barAttachedToQuest, signalConnected, vibeulonMinted, gm, donationSource, donationTier. Implementation MUST NOT rely on SugarCube macros executing in-browser; treat as logical variables set by app-side actions where possible.

### Learn more navigation

- **FR3**: Twine passage navigation MUST support jumping to KB_* passages and returning via links. No special-case UI required.

### Onboarding state capture

- **FR4**: Persist onboarding state in memory (and optionally to server once signed in): lens, rawSignal, refinedSignal, quadrant, gm, barPublished, barAttachedToQuest, vibeulonMinted.
- **FR5**: Analytics events MUST be fired: `onboarding_lens_selected`, `onboarding_signal_entered`, `onboarding_refined_entered`, `onboarding_quadrant_selected`, `onboarding_bar_published`, `onboarding_microquest_attached`, `onboarding_vibeulon_minted_demo`, `onboarding_gm_selected`, `onboarding_kb_opened` (include kb_page id), `onboarding_donate_clicked` (include source, tier, lens, gm).

### BAR creation

- **FR6**: At Claim step, create PUBLIC CustomBar with title (first ~40 chars of refinedSignal), content (refinedSignal), tags (lens, quadrant, campaignTag "BruisedBanana"), rawSignal in metadata. Mark barPublished = true.

### Micro-quest + mint

- **FR7**: At Structure step, attach created BAR to pre-existing onboarding micro-quest (create one if missing).
- **FR8**: At Mint step, mint real vibeulon if available; otherwise record demo event and set vibeulonMinted = true. UI-only simulated vibeulon allowed.

### Donation telemetry

- **FR9**: When user clicks external donation URL, fire `onboarding_donate_clicked` with donationSource, donationTier, lens, gm, campaignId before opening link. Append as query params to external URL if safe.

### Orientation preload

- **FR10**: After signup, use lens/gm/quadrant to preload 2–5 orientation quests in campaign instance. GM flavors quest copy later (not required this iteration).

## Non-functional Requirements

- Wire into existing Twine + onboarding infrastructure. Minimal new systems.
- No full in-app knowledge base system.
- No new UI flourishes beyond existing Twine renderer.
- No forced seat-transfer / compost mechanics.

## Non-goals (this iteration)

- Full in-app knowledge base system
- New UI flourishes beyond existing Twine renderer
- Forced seat-transfer / compost mechanics

## Verification Quest

- **FR11**: Verification quest `cert-campaign-onboarding-twine-v2-v1` MUST be seeded by `npm run seed:cert:cyoa` (or equivalent). Narrative: preparing the party for the Bruised Banana Fundraiser. Steps: play through initiation flow, create BAR, attach to micro-quest, mint vibeulon, select GM, reach commitment gate, optionally donate. Final passage has no link; completing mints reward.

## Reference

- **SpecBAR**: [bruised-banana-launch-specbar](../bruised-banana-launch-specbar/spec.md) — emergent SpecBAR affecting launch thread; oneshot via Campaign Owner unpacking input
- Quest Grammar Compiler: [.specify/specs/quest-grammar-compiler/spec.md](../quest-grammar-compiler/spec.md) — generates QuestPacket from 6 Unpacking Questions (Campaign Owner inputs interactively); populates Passages
- Voice Style Guide: [src/app/wiki/voice-style-guide/page.tsx](../../src/app/wiki/voice-style-guide/page.tsx)
- Twine parser: [src/lib/twine-parser.ts](../../src/lib/twine-parser.ts)
- Adventures API (BB nodes): [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- Onboarding controller: [src/app/conclave/onboarding/page.tsx](../../src/app/conclave/onboarding/page.tsx)
- assignOrientationThreads: [src/actions/quest-thread.ts](../../src/actions/quest-thread.ts)
- Lore CYOA onboarding: [.specify/specs/lore-cyoa-onboarding/spec.md](../lore-cyoa-onboarding/spec.md)

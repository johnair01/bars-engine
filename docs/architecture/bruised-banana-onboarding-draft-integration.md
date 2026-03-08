# Bruised Banana Onboarding Draft — Integration Spec

## Purpose

Define how `bruised_banana_onboarding_draft.twee` integrates into the Bars-engine system. This document captures integration decisions and outlines implementation steps.

---

## 1. Role of the Draft

| Role | Description |
|------|-------------|
| **Reference** | Informs templates, corpus, and generation prompts |
| **Corpus source** | Input for template extraction and template derivation |
| **Authoring-only** | Draft stays in .twee; separate translation step produces grammar-compliant flow |

The draft is **not** the canonical runtime flow. A translation pipeline converts it into quest/BAR flow grammar for validation, simulation, and execution.

---

## 2. Format and Runtime

| Decision | Value |
|----------|-------|
| **Target format** | SugarCube (standardize; convert from Harlowe if needed) |
| **Runtime** | Existing Twine player — `BruisedBananaTwinePlayer`, `QuestTwinePlayer` |
| **Authoring** | .twee file; translation step into grammar |

---

## 3. Grammar Mapping

| Draft Concept | Translation |
|---------------|-------------|
| Authoring | .twee with custom tags (cluster, emotional-alchemy, emits) |
| Runtime | Grammar-compliant flow (introduction, prompt, choice, action, BAR_capture, completion) |

**Translation step:** A separate process maps .twee passages and links to quest flow nodes. Draft remains authoring-only; translation produces the executable flow.

---

## 4. Event Emission

Events from the draft are wired into the engine:

| Draft Event | Engine Use |
|-------------|------------|
| nation_selected | State, analytics, persistence |
| archetype_selected | State, analytics, persistence |
| developmental_lens_selected | State, analytics, persistence |
| identity_profile_initialized | State, analytics, persistence |
| intended_impact_selected | State, analytics, persistence |
| bar_created | State, analytics, persistence; aligns with flow simulator |
| intended_impact_bar_attached | State, analytics, persistence |
| onboarding_completed | State, analytics, persistence |

Align with flow simulator contract: `orientation_viewed`, `prompt_viewed`, `bar_created`, `quest_completed`, etc. Add new event types where needed for nation/archetype/lens/impact.

---

## 5. Emotional-Alchemy Branching

The Invitation branches (aligned, curious, skeptical) **affect downstream content**:

- Different copy in later passages
- Different quests surfaced (e.g., quest generation or selection conditioned on emotional-alchemy tag)
- State stored for personalization

---

## 6. First Quest Stub → Real Quests

The stub options become **real quests** surfaced from the gameboard or campaign deck:

- Strengthen the Residency
- Invite one aligned person
- Offer a skill or resource
- Share the residency page
- Contribute financially
- Submit structured feedback

These quests live in the campaign deck and appear on the gameboard after onboarding.

---

## 7. Begin Play Flow

| Step | Target |
|------|--------|
| "Begin play" click | Log-in / sign-in page |
| After auth | Dashboard |

Onboarding completion leads to auth (if not already signed in), then dashboard. Dashboard surfaces gameboard, campaign, and first quests.

---

## 8. Implementation Outline

### Phase A: Format and Translation

1. ~~Convert draft from Harlowe to SugarCube~~ — **Done.** File: `content/twine/onboarding/bruised-banana-onboarding-draft.twee`
2. ~~Implement translation step: .twee → quest flow grammar~~ — **Done.** `src/lib/twee-to-flow/` — `translateTweeToFlow(tweeSource)` produces Flow JSON. Run `npm run test:twee-to-flow`.
3. Map custom tags (cluster, emotional-alchemy, template choose-one, result emits) to grammar primitives — **Done.** Tags parsed by extended twee-parser; translator maps to FlowNode types (introduction, prompt, choice, BAR_capture, completion, handoff).

### Phase B: Event Wiring

4. ~~Wire draft events to engine~~ — **Done.** BruisedBananaTwinePlayer emits orientation_viewed, prompt_viewed, choice_selected, nation_selected, archetype_selected, developmental_lens_selected, identity_profile_initialized, intended_impact_selected, bar_created, intended_impact_bar_attached, onboarding_completed, begin_play via /api/onboarding/events.
5. ~~Ensure alignment with flow simulator contract~~ — **Done.** Events match flow simulator expected_events.
6. ~~Add new event types for identity (nation, archetype, lens, impact)~~ — **Done.** Campaign state applies nation (by name), intended_impact→campaignDomainPreference; pending BAR supports barContent (draft) and refinedSignal (legacy). Draft uses 8 canonical archetypes (The Bold Heart, The Devoted Guardian, etc.) via `[TOKEN] SET playbook=...`; campaignState.playbook maps to playbookId.

### Phase C: Corpus and Template Integration

7. ~~Ingest translated flow into quest corpus~~ — **Done.** `npm run export:bruised-banana-flow` writes `reports/quest-corpus/bruised-banana-onboarding-flow.json`. Use for extraction/template derivation.
8. ~~Use draft as reference for template derivation~~ — **Done.** Flow artifact available; template extraction engine can consume it.
9. ~~Inform generation prompts with draft structure~~ — **Done.** `buildQuestPromptContext` accepts `includeOnboardingFlowReference: true`; injects structure summary (emotional-alchemy, identity, BAR_capture, etc.) into AI prompts.

### Phase D: Downstream Content

10. ~~Implement emotional-alchemy branching effects (copy variation, quest conditioning)~~ — **Done.** (1) **State**: `emotional_alchemy` (aligned/curious/skeptical) stored in campaignState → storyProgress. (2) **Copy variation**: BruisedBananaTwinePlayer interpolates `{{key}}` and `{{emotional_alchemy_framing}}` in passage text; Create a BAR uses branch-specific framing. (3) **Quest conditioning**: CustomBar has optional `emotionalAlchemyTag`; First Quest Stub quests tagged (aligned/curious/skeptical); `getCampaignDeckQuestIds` and `drawFromCampaignDeck` filter by player's emotional_alchemy when playerId provided.
11. ~~Create or tag real quests for stub options; surface from gameboard/campaign deck~~ — **Done.** `npm run seed:first-quest-stub` seeds 6 First Quest Stub options as CustomBars with `campaignRef: bruised_banana`, `type: quest`, `status: active`; they appear in the campaign deck for period 1.
12. ~~Wire "Begin play" → sign-in → dashboard~~ — **Done.** BruisedBananaTwinePlayer: BeginPlay → sign-in (if not signed in) or dashboard (`/`).
13. ~~Implement BAR creation as Form + Submit; map "Create a BAR" passage to BAR_capture node~~ — **Done.** Create a BAR passage uses `{{INPUT:barContent}}`; navigating to Onboarding Complete triggers `createOnboardingBar` with `barContent`; pending BAR supports `barContent` and `refinedSignal`.
14. Extract template from draft; enable admin composer to create variations — **Out of scope for Phase D** (depends on template extraction engine).

---

## 9. Identity, BAR, and Admin

| Topic | Decision |
|-------|----------|
| **Developmental Lens** | Relates to Game Master face |
| **BAR creation** | Form + Submit; maps to BAR_capture node |
| **Admin composer** | Admins can compose variations from a template derived from this draft |

---

## 10. References

- [quest-bar-flow-grammar.md](quest-bar-flow-grammar.md)
- [quest-template-extraction-engine.md](quest-template-extraction-engine.md)
- [template-conditioned-quest-generation.md](template-conditioned-quest-generation.md)
- [campaign-onboarding-twine-v2/spec.md](../.specify/specs/campaign-onboarding-twine-v2/spec.md)
- Draft: `bruised_banana_onboarding_draft.twee`

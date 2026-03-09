# Specs Without Backlog Items — Implementation Analysis

**Generated**: 2025-03-06

This document analyzes the 28 specs that exist but are not yet in the backlog, categorizing them by implementation status and whether they need backlog items.

---

## Implemented — Add Backlog Item (mark as Done)

These specs have been implemented. Add backlog entries to record completion and link to the spec.

| Spec | Evidence | Suggested Backlog Entry |
|------|----------|-------------------------|
| **321-shadow-process** | `Shadow321Form`, `deriveMetadata321`, `metadata321` in create-bar, InsightBAR type, `/shadow/321` page | 321 Shadow Process (digital 3→2→1 flow, BAR creation, metadata import) |
| **market-clear-filters** | `handleClearAllFilters` calls `updateCampaignDomainPreference([])` + `refreshContent()` in `bars/available/page.tsx` | Market Clear Filters (cert feedback: Clear all filters now clears campaign domain preference) |
| **quest-upgrade-to-cyoa** | `UpgradeQuestToCYOAFlow`, `upgradeQuestToCYOA` action, Admin quests page + Quest Grammar "Upgrade from quest" | Quest Upgrade to CYOA (admin upgrade existing quests to full CYOA adventures) |
| **cert-quest-grammar-runtime-error** | `telemetryHooks` stripped in quest-grammar server actions; skipRevalidate for Report Issue; layout fixes | Cert Quest Grammar Runtime Error (telemetryHooks, Report Issue, layout) |
| **cyoa-auth-new-vs-existing** | `applyCampaignStateToExistingPlayer`, CampaignAuthForm Log In mode, "Continue to campaign" for logged-in players | CYOA Auth New vs Existing (sign-in/log-in at auth node, existing players continue) |
| **cyoa-onboarding-reveal** | "Begin the Journey" CTA on landing; redirect to `/conclave/onboarding` after sign-up; campaign state personalization | CYOA Onboarding Reveal (discoverability, quest handoff, campaign state) |
| **gameboard-quest-review-loop** | `previewGameboardAlignedQuest`, `publishGameboardQuestFromPreview`, `QuestOutlineReview` in GameboardClient | Gameboard Quest Review Loop (preview-review-accept-publish flow) |
| **quest-wizard-parity** | QuestWizard has `moveType`, `allyshipDomain` required; createQuestFromWizard passes both | Quest Wizard Parity (move + domain required, scope, reward, success criteria) |
| **deftness-development-skill** | Skill at `.agents/skills/deftness-development/SKILL.md` | Deftness Development Skill (spec kit, API-first, scaling) |
| **admin-validation-quests** | `scripts/seed-admin-tests.ts` — Quick Mint, Labyrinth, Resurrection Loop | Admin Validation Quests (3 test quests for v0.1.0 walkthrough) |
| **bar-quest-campaign-flow** | `campaignRef`, `campaignGoal` in schema; `linkQuestToCampaign`; `addCustomSubquestToGameboard`; InsightBAR type | BAR Quest Campaign Flow (InsightBAR, campaign tagging, subquest linkage) |
| **bruised-banana-onboarding-flow** | Phase 1 & 2 done per spec (route alignment, BB intro nodes, nation/playbook/domain, 4 moves) | Bruised Banana Onboarding Flow (Phase 1–2 done; Phase 3 pending) |
| **env-database-url** | `docs/ENV_AND_VERCEL.md`, README, RUNBOOK reference `.env.example`; spec marks deliverables [x] | Env DATABASE_URL (local dev env setup) |
| **env-seed-scripts-onboarding** | `scripts/require-db-env.ts`, dotenv in seed scripts, ENV_AND_VERCEL "Running seed scripts" | Env Seed Scripts Onboarding (clear message when DATABASE_URL missing) |
| **fundraiser-landing-refactor** | Landing (logged out): hero + CTAs only, no 4 moves grid; Event page primary; InviteButton `/event?ref=bruised-banana` | Fundraiser Landing Refactor (T revision: event as invite, no moves on landing) |
| **twine-normalization** | `normalizeTwineStory`, `ParsedTwineSchema`, `getStartPassageId` in `schemas.ts`; used in twine.ts, adventures play | Twine Normalization (canonical structure, startPassage fallbacks) |
| **twine-hardening** | `ParsedTwineSchema` with `startPassagePid`/`startPassageName` fallbacks; `getStartPassageId`; Zod validation | Twine Hardening (robust parser, graceful errors) |
| **twine-completion** | PassageRenderer: `hasActualInputs`; when no inputs, auto-complete without calling `completeQuest`; no empty REQUIRED ACTION box | Twine Completion Hardening (empty inputs handled, no double-complete) |
| **momentum-unpacking-skill** | Skill at `.agents/skills/momentum-unpacking-skill/SKILL.md`; prompt exists | Momentum Unpacking Skill (6 questions → backlog next steps) |

---

## Not Implemented — Add Backlog Item (track as Ready/Pending)

These specs describe work that has not been implemented. Add backlog entries to track them.

| Spec | Summary | Priority |
|------|---------|----------|
| **admin-agent-forge** | Admin-only 3-2-1 Forge: distortion gate, stages, friction mint, AgentSpec/AgentPatch, vibeulon routing | Enhancement |
| **admin-twine-builder** | CMS for Adventures: CRUD, passage editor, macro engine, PlayerAdventureProgress | Enhancement |
| **attunement-translation** | Vibeulon economy: Global/Local, attune, transmute, VibeulonLedger | Economy |
| **cyoa-certification-quests** | Cert quests for CYOA onboarding: landing CTA, campaign flow, sign-up redirect | Quality |
| **game-rules-wiki-update** | Wiki rules: BAR ecology, decks, quests, vibeulons, compost, slot market | Docs |
| **push-to-main-vercel-deploy** | Process doc: pre-push checks, commit strategy, Vercel deploy, post-deploy verification | Infra |
| **sustainability-onboarding-lore** | Wiki: `/wiki/onboarding-path`, `/wiki/sustainability`, `/wiki/integral-emergence`, Bruised Banana expansion | Docs |
| **wake-up-campaign-birthday-pivot** | Campaign as narrative funnel: 5 Acts (Fracture, Spiral, Greenhouse, Ask, Oath) | Design |

---

## Superseded / Merged / Deferred

| Spec | Notes |
|------|-------|
| **bruised-banana-house-integration** | Has ANALYSIS.md but no spec.md; referenced in backlog for House integration. Deferred — add when House work is prioritized. |
| **simulated-collaborators** | Spec file not found. May have been renamed or removed. |

---

## Summary

| Category | Count |
|----------|-------|
| **Implemented** (add backlog, mark Done) | 19 |
| **Not implemented** (add backlog, track) | 8 |
| **Superseded/Deferred** | 2 |

---

## Recommended Next Steps

1. ~~**Add backlog entries** for the 19 implemented specs~~ — **Done** (ER–FJ, [x] Done).
2. ~~**Add backlog entries** for the 8 not-implemented specs~~ — **Done** (EJ–EQ, [ ] Ready).
3. **Handle deferred**: Add bruised-banana-house-integration when House work is prioritized; confirm simulated-collaborators status.

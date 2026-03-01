# Tasks: Onboarding Adventures Unification (Option C + D)

## Phase 1: Investigation (complete)

- [x] **1.1** Document root cause: BB has no Adventure record; Admin pane queries db.adventure.findMany()
- [x] **1.2** Map edit surfaces: Wake-Up = Admin Adventures; BB = Event campaign editor (Instance fields)
- [x] **1.3** Create spec and backlog prompt
- [x] **1.4** Choose Option C (full migration) + D (campaignRef) — admin tools able to edit pages is shipping blocker

## Phase 2: Schema + Template Resolver

- [x] **2.1** Add `campaignRef String?` to Adventure model in prisma/schema.prisma; run db:sync
- [x] **2.2** Create `src/lib/template-resolver.ts`: resolve `{{instance.wakeUpContent}}`, `{{instance.showUpContent}}`, `{{instance.storyBridgeCopy}}` against Instance
- [x] **2.3** Template resolver: support optional `{{#if x}}...{{/if}}` or simple `{{x}}` only for Phase 1

## Phase 3: Seed Bruised Banana Adventure (Phase 1 nodes)

- [x] **3.1** Create `scripts/seed-bruised-banana-adventure.ts`: upsert Adventure slug=bruised-banana, campaignRef=bruised-banana, title="Bruised Banana Campaign", status=ACTIVE, startNodeId=BB_Intro
- [x] **3.2** Add Passages: BB_Intro (template: `{{instance.introText}}`), BB_ShowUp, BB_LearnMore, BB_Developmental_Q1, BB_SetDevelopmental_*, BB_Moves_Intro through BB_Moves_ShowUp, signup
- [x] **3.3** Add npm script `seed:bruised-banana` in package.json
- [x] **3.4** Run seed; verify Adventure + Passages in DB

## Phase 4: API Route — Prefer Passages for bruised-banana

- [x] **4.1** API route: When ref=bruised-banana, find Adventure by slug=bruised-banana (or campaignRef=bruised-banana)
- [x] **4.2** If Adventure exists and Passage exists for nodeId: load Passage, resolve templates, return node. Choices from Passage.choices JSON.
- [x] **4.3** Fallback: if no Passage, call getBruisedBananaNode() (for dynamic nodes: BB_ChooseNation, BB_NationInfo_*, etc.)
- [x] **4.4** Campaign page: when campaignRef=bruised-banana, ensure it uses adventureSlug=bruised-banana for API calls (or API infers from ref)

## Phase 5: Campaign Page + CampaignReader

- [x] **5.1** Campaign page: when campaignRef=bruised-banana, pass adventureSlug=bruised-banana to CampaignReader (currently defaults to wake-up)
- [x] **5.2** Verify /campaign?ref=bruised-banana fetches from /api/adventures/bruised-banana/BB_Intro

## Phase 6: Dynamic Nodes (Phase 2 — optional)

- [ ] **6.1** Migrate BB_ChooseNation, BB_ChoosePlaybook, BB_ChooseDomain to Passages (choices as template or keep API)
- [ ] **6.2** Migrate BB_NationInfo_*, BB_PlaybookInfo_* — template with nation/playbook data or keep API

## Verification

- [x] **V1** Admin sees 2 adventures: Wake-Up Campaign, Bruised Banana Campaign
- [x] **V2** Admin edits Bruised Banana passage (e.g. BB_Intro text) → save → /campaign?ref=bruised-banana shows updated content
- [x] **V3** Campaign flows unchanged: /campaign and /campaign?ref=bruised-banana work

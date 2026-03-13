# Spec Kit Backlog

This is the central ledger for all pending development objectives and emergent needs for the BARS Engine.

## Objective Stack

| Priority | ID | Feature Name | Category | Status | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0 (Urgent)** | **PD** | **[Production Database Divergence](.specify/specs/production-database-divergence/spec.md)** (demo blocker: prod login/signup fail; ensure admin@admin.local) | Infra | [x] Done | - |
| 0.01 | RB | [Bruised Banana Residency Ship](.specify/specs/bruised-banana-residency-ship/spec.md) (main loop, pre-launch seeds, psychofauna prompt; orchestrates PD + loop:ready) | Infra | [x] Done | PD |
| 0.02 | DS | [Dev Setup Anti-Fragile](.specify/specs/dev-setup-anti-fragile/spec.md) (loop:ready remediation hints, INCIDENTS.md, DB_STRATEGY, bootstrap script; learn from schema/migration/seed issues) | Infra | [ ] Ready | - |
| **0 (Urgent)** | **AJ** | **[Certification Feedback Multi-Report](.specify/specs/certification-feedback-multi-report/spec.md)** (emergent) | UI | [x] Done | L |
| **0.1** | **AK** | **[Certification Feedback Stability](.specify/specs/cert-feedback-stability/spec.md)** (emergent) | UI | [x] Done | L |
| **0.2** | **AL** | **[Certification Quest Passage Links](.specify/specs/cert-quest-passage-links/spec.md)** (emergent) | UI | [x] Done | L |
| **0.3** | **AM** | **[Progress Indicator Enhancement](.specify/specs/cert-progress-indicator-enhancement/spec.md)** (emergent) | UI | [x] Done | L |
| **0.4** | **AN** | **[Vibeulon Payoff Visibility](.specify/specs/cert-vibeulon-payoff-visibility/spec.md)** (emergent) | UI | [x] Done | L |
| 0.5 | AO | [CYOA Slides (Chunk Long Text)](.specify/specs/cert-cyoa-slides/spec.md) (emergent, larger UX) | UI | [x] Done | L |
| 0.6 | AP | [CYOA Continue Story Horizontal](.specify/specs/cyoa-continue-story-horizontal/spec.md) (emergent) | UI | [x] Done | AO |
| 0.7 | AQ | [Campaign Onboarding Feature Merge](.specify/specs/campaign-onboarding-feature-merge/spec.md) (emergent) | UI | [x] Done | AG |
| 1 | A | [Market Identity & Dynamic Filtering](file:///Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_a_market_identity.md) | UI | [x] Done | - |
| 1.1 | E1 | Client Directive Regression Fix | UI | [x] Done | A |
| 1.2 | F | [Roadblock Metabolism System](.specify/specs/roadblock-metabolism/spec.md) | Infra | [x] Done | A |
| 1.2.1 | F1 | [Roadblock Metabolism Fixes](.specify/specs/roadblock-metabolism-fixes/spec.md) | Infra | [x] Done | F |
| 1.3 | G | [System Quest Market Discovery](file:///Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_g_system_visibility.md) | UI | [x] Done | A |
| 1.4 | H | [Validation UI/UX Repair](file:///Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_h_validation_repair.md) | UI | [x] Done | B |
| 1.5 | I | [Admin Certification Suite](.specify/specs/admin-certification-suite/spec.md) | Infra | [x] Done | G, H |
| 2 | B | [Twine Economy & Infrastructure Bridge](file:///Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_b_twine_bridge.md) | Economy | [x] Done | A |
| 3 | C | [Spec Kit Backlog Management](file:///Users/test/.gemini/antigravity/brain/3ff95f09-ab1b-444f-bde9-6eb4bfba0e9e/prompt_c_backlog_management.md) | Infra | [x] Done | - |
| 4 | D | [Intention-Activated Value](.specify/specs/intention-activated-value/spec.md) (Philosophy & Docs) | Docs | [x] Done | - |
| 5 | E | [Admin Validation Suite (Twine)](.specify/specs/admin-validation-suite-twine/spec.md) | Quality | [x] Done | B |
| 6 | J | [Env Seed Scripts Onboarding](.specify/backlog/prompts/env-seed-scripts-onboarding.md) | Infra | [x] Done | - |
| 6.1 | EA | [Backend–Vercel Integration](.specify/specs/backend-vercel-integration/spec.md) (Python backend deploy to Railway/Render; NEXT_PUBLIC_BACKEND_URL; CORS) | Infra | [x] Done | - |
| 7 | K | [In-App CYOA Editing](.specify/specs/cyoa-in-app-editing/spec.md) | UI | [x] Done | - |
| 8 | L | [Certification Quest UX (Links + Feedback)](.specify/specs/certification-quest-ux/spec.md) | UI | [x] Done | - |
| 9 | M | [Admin Adventures Discoverability](.specify/specs/admin-adventures-discoverability/spec.md) | UI | [x] Done | - |
| 10 | N | [Verification Quest Completion Display](.specify/specs/verification-quest-completion/spec.md) | UI | [x] Done | - |
| 11 | O | Verification Quest → Backlog Update (completed quests update corresponding backlog prompt) | Infra | [x] Done | N |
| 12 | P | [Bruised Banana Donation Link](.specify/specs/bruised-banana-donation/spec.md) | UI | [x] Done | - |
| 13 | Q | [Allyship Domains (WHERE) + Campaign Path](.specify/specs/bruised-banana-allyship-domains/spec.md) | UI | [x] Done | - |
| 14 | R | [Lore: Conceptual Model](.specify/specs/lore-conceptual-model/spec.md) | Docs | [x] Done | - |
| 15 | S | [Campaign Kotter Structure + Domain × Kotter](.specify/specs/campaign-kotter-domains/spec.md) | UI/Docs | [x] Done | Q, R |
| 16 | T | [Landing + Invitation Throughput](.specify/specs/cyoa-invitation-throughput/spec.md) | UI | [Superseded by fundraiser-landing-refactor] | - |
| 17 | U | [Domain-Aligned Intentions](.specify/specs/domain-aligned-intentions/spec.md) (intention options keyed by allyship domain) | UI | [x] Done | D, Q |
| 18 | V | [Vibeulon Visibility (Movement Feed)](.specify/specs/vibeulon-visibility/spec.md) | UI | [x] Done | - |
| 19 | W | [Appreciation Mechanic](.specify/specs/appreciation-mechanic/spec.md) (give vibeulons to player/quest; API-first, MVP social loop) | Economy | [x] Done | - |
| 20 | X | Signature Vibeulons (creatorId on Vibulon; EFA + BAR completion) | Economy | [x] Done | - |
| 21 | Y | Bruised Banana House Instance (instance, recurring quests, house state) | UI/Infra | [ ] Ready | S, T |
| 22 | Z | [Offers, Bounty Board, Donation Packs](.specify/specs/offers-bounty-donation-packs/spec.md) | Economy | [x] Done | P |
| 23 | AA | [Event Page Campaign Editor](.specify/specs/event-page-campaign-editor/spec.md) (high priority) | UI | [x] Done | - |
| 24 | AB | [Event Donation Honor System](.specify/specs/event-donation-honor-system/spec.md) (high priority) | UI/Economy | [x] Done | P, Z |
| 25 | AC | [Event-Driven CYOA + Developmental Assessment](.specify/backlog/prompts/event-driven-cyoa-developmental-assessment.md) | UI | [Superseded by AG] | T, K |
| 26 | AD | [2D Sprite Avatar from CYOA Choices](.specify/specs/avatar-from-cyoa-choices/spec.md) | UI | [x] Done | AG |
| 27 | AE | [Story/Quest Map Exploration](.specify/specs/story-quest-map-exploration/spec.md) | UI/Exploration | [x] Done | - |
| 28 | AF | [Lore Index and Knowledge Base](.specify/specs/lore-index-knowledge-base/spec.md) | Docs/UI | [Superseded by AG] | R |
| 29 | AG | [Lore Index + Event-Driven CYOA Onboarding](.specify/specs/lore-cyoa-onboarding/spec.md) (merges AF + AC) | Docs/UI | [x] Done | R, T, K |
| 30 | AH | [2-Minute Ride: Story Bridge + UX Expansion](.specify/specs/two-minute-ride-story-bridge/spec.md) | UI | [x] Done | AG |
| 31 | AI | [K-Space Librarian: Quest-Driven Docs + BAR-Fueled Canon](.specify/specs/k-space-librarian/spec.md) | Docs/UI | [x] Done | - |
| 31.1 | BQ | [K-Space Librarian Post-Onboarding](.specify/specs/k-space-librarian-post-onboarding/spec.md) (basic quest after onboarding) | Docs/UI | [x] Done | AI |
| 32 | AR | [Onboarding Adventures Unification](.specify/specs/onboarding-adventures-unification/spec.md) (investigation) | UI | [x] Done | AG |
| 33 | AS | [Game Master Face Sentences](.specify/specs/game-master-face-sentences/spec.md) | UI | [x] Done | AQ, AH |
| 34 | AT | [JRPG Composable Sprite Avatar + Build-a-Bear Onboarding](.specify/specs/jrpg-composable-sprite-avatar/spec.md) | UI | [x] Done | AD |
| 35 | AU | [Avatar Sprite Assets](.specify/specs/avatar-sprite-assets/spec.md) | UI | [x] Done | AT |
| 36 | AV | [Existing Players Character Generation](.specify/specs/existing-players-character-generation/spec.md) (orientation quest) | UI | [x] Done | AU |
| 37 | AW | [Avatar Visibility + Cert Report Issue](.specify/specs/avatar-visibility-and-cert-report-issue/spec.md) | UI | [ ] Ready | AV |
| 38 | AX | [Avatar Click-to-Enlarge + Admin Sprite Viewer](.specify/specs/avatar-enlarge-and-admin-sprite-view/spec.md) | UI | [ ] Ready | AW |
| 39 | AY | [Avatar Sprite Quality Process](.specify/specs/avatar-sprite-quality-process/spec.md) (emergent: Gathertown/Stardew vibe) | UI | [ ] Ready | AU |
| 40 | AZ | [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md) (PDF ingestion, Quest Library, Grow Up) | UI/Infra | [ ] Ready | - |
| 40.1 | BC | [Book Upload Unexpected Response](.specify/specs/book-upload-unexpected-response/spec.md) (fix PDF upload > 1MB) | Infra | [x] Done | AZ |
| 40.2 | BD | [PDF Extract Worker Fix](.specify/specs/pdf-extract-worker-fix/spec.md) (emergent: pdf.worker.mjs not found) | Infra | [x] Done | AZ |
| 0.8 | BE | [OpenAI API Key Access](.specify/specs/openai-api-key-access/spec.md) (emergent: Incorrect API key for AI features) | Infra | [x] Done | - |
| 40.3 | BF | [Book Analysis Schema Fix](.specify/specs/book-analysis-schema-fix/spec.md) (emergent: allyshipDomain required in schema) | Infra | [x] Done | AZ |
| 40.4 | BI | [Book Analysis Timeout Fix](.specify/specs/book-analysis-timeout-fix/spec.md) (emergent: stuck Analyzing on large books) | Infra | [x] Done | AZ |
| 40.5 | BK | [Book Analysis Rate Limit Fix](.specify/specs/book-analysis-rate-limit-fix/spec.md) (emergent: TPM rate limit, token efficiency) | Infra | [x] Done | AZ |
| 40.6 | BL | [AI Deftness and Token Efficiency Strategy](.specify/specs/ai-deftness-token-strategy/spec.md) (chunk filter, cache, heuristics, control plane) | Infra | [x] Done | BK, AZ |
| 50 | BA | [Playbook → Archetype Terminology Rename](.specify/specs/playbook-to-archetype-rename/spec.md) (lower priority) | Infra | [x] Done | - |
| 41 | BB | [Admin Manual Avatar Assignment](.specify/specs/admin-manual-avatar-assignment/spec.md) (testing sprite stacking) | UI | [x] Done | AX |
| 42 | BG | [Avatar Gallery Preview and Sprite Stacking Fix](.specify/specs/avatar-gallery-preview-and-stacking/spec.md) (preview before assign, fix layer replace) | UI | [ ] Ready | BB |
| 43 | BH | [Avatar Stacking Fix and Base-Only Preview](.specify/specs/avatar-stacking-base-preview/spec.md) (base when unselected, fix layer stacking) | UI | [ ] Ready | BB |
| 0.9 | BJ | [Avatar Overwrite, Transparency, and Size Fix](.specify/specs/avatar-overwrite-transparency-fix/spec.md) (emergent: nation/archetype overwrite, ChatGPT prompts) | UI | [x] Done | BB |
| **0.10** | **BM** | **[PDF Parse New Build Fix](.specify/specs/pdf-parse-new-build-fix/spec.md)** (emergent: pdf-child.js module not found, blocks build) | Infra | [x] Done | AZ |
| **0.34** | **CW** | **[Book Upload Vercel Client Exception](.specify/specs/book-upload-vercel-client-exception/spec.md)** (emergent: client-side exception on PDF upload; BLOB token, module bundling) | Infra | [x] Done | BU |
| **0.11** | **BZ** | **[Bruised Banana Launch SpecBAR](.specify/specs/bruised-banana-launch-specbar/spec.md)** (emergent: oneshot campaign via interactive unpacking; affects launch thread) | UI | [x] Done | - |
| **0.14** | **CA** | **[Cert Existing Players V1 Feedback](.specify/specs/cert-existing-players-v1-feedback/spec.md)** (emergent) | UI | [x] Done | AV, L |
| **0.15** | **CB** | **[Restart Completed Adventures](.specify/specs/adventure-restart-completed/spec.md)** (emergent: admin re-run cert from Adventures page) | UI | [x] Done | L |
| **0.48** | **DL** | **[Admin World Canonical Archetypes](.specify/specs/admin-world-canonical-archetypes/spec.md)** (emergent: /admin/world shows 16 archetypes; filter to 8 canonical) | UI | [x] Done | - |
| 0.12 | BY | [Quest Grammar Compiler (V1)](.specify/specs/quest-grammar-compiler/spec.md) (6 Unpacking Qs → QuestPacket, Campaign Owner input, segment variants) | UI/Infra | [x] Done | BZ |
| 0.15 | CC | [Quest Grammar Allyship Unpacking](.specify/specs/quest-grammar-allyship-unpacking/spec.md) (emergent: experience types, life state, multi-select reservations, move-based aligned action, quest type per move) | UI | [x] Done | BY |
| 0.16 | CD | [Quest Grammar UX Flow](.specify/specs/quest-grammar-ux-flow/spec.md) (generation flow as CYOA; multi-select; emotional alchemy ontology; archetype/lens; .twee → Adventure + Thread; recursive; repeatable prompt-to-Twine; player-move vs storyteller-story for gap bridging) | UI/Infra | [x] Done | BY, CC |
| 0.13 | BX | [Campaign Onboarding Twine v2](.specify/specs/campaign-onboarding-twine-v2/spec.md) (Bruised Banana initiation + Learn More + donation telemetry) | UI | [x] Done | AG, BY |
| 0.13.1 | CG | [Bruised Banana Post-Onboarding Short Wins](.specify/specs/bruised-banana-post-onboarding-short-wins/spec.md) (P6/FR10: lens-based preload; short wins after signup) | UI | [x] Done | BX |
| 40.7 | BN | [Book Quest Draft and Admin Review](.specify/specs/book-quest-draft-review/spec.md) (draft status, review page, edit/approve before publish) | Infra/UI | [x] Done | AZ |
| 40.8 | BO | [Book Quest Enhancements](.specify/specs/book-quest-enhancements/spec.md) (vibeulon reward, Game Master face, upgrade to thread, Twine context) | Infra/UI | [x] Done | BN |
| 40.9 | BP | [Book Quest Twine Export](.specify/specs/book-quest-twine-export/spec.md) (export JSON for Twine adventure building) | Infra/UI | [x] Done | BO |
| 40.10 | BV | [Book Admin Loading Animations](.specify/specs/book-admin-loading-animations/spec.md) (spinner/analyzing animation for extract, analyze, publish, upload) | UI | [x] Done | AZ |
| **40.11** | **BU** | **[Book Upload Vercel ENOENT](.specify/specs/book-upload-vercel-enoent/spec.md)** (emergent: mkdir public fails on Vercel; use Blob storage) | Infra | [x] Done | AZ |
| 40.12 | DW | [Quest Library Wave Routing](.specify/specs/quest-library-wave-routing/spec.md) (route book quests by moveType: EFA pool, Dojo, Discovery, Gameboard; auto-assign on approve; model quest training) | UI/Infra | [ ] Ready | AZ, BN |
| 45 | BQ | [Dashboard UI Vibe Cleanup](.specify/specs/dashboard-ui-vibe-cleanup/spec.md) (simplify dashboard, remove unused features, add guiding quests) | UI | [x] Done | - |
| 44 | BN | [Bruised Banana Quest Map (Kotter-Based)](.specify/specs/bruised-banana-quest-map/spec.md) | UI/Infra | [x] Done | S |
| 46 | BR | [Admin Mobile Readiness](.specify/specs/admin-mobile-readiness/spec.md) (instance edit prefill, quick progress update, mint/transfer without prompt) | UI | [x] Done | AA |
| 47 | BS | [Go-Live Integration](.specify/specs/go-live-integration/spec.md) (loop:ready, cert-go-live-v1, pre-launch seed doc) | Infra | [x] Done | BR |
| 48 | BT | [Market Redesign for Launch](.specify/specs/market-redesign-launch/spec.md) (player-created quests only, easy filtering, Play on all breakpoints, cert-market-redesign-v1) | UI | [x] Done | BS |
| 49 | BW | [Campaign In-Context Editing](.specify/specs/campaign-in-context-editing/spec.md) (admin edit copy, slides, branching from modal while in campaign flow) | UI | [x] Done | - |
| 0.17 | CE | [Nation and Playbook Choice Privileging](.specify/specs/nation-playbook-choice-privileging/spec.md) (limit choices to 2–3; privilege nation element + playbook WAVE paths; authoring-time first, runtime filtering later) | UI/Infra | [x] Done | CD |
| 0.18 | CF | [Playbook Primary WAVE Spec](.specify/specs/playbook-primary-wave/spec.md) (schema, seed, getPlaybookPrimaryWave) | Infra | [x] Done | - |
| 0.19 | CH | [Rules of Hooks Fix](.specify/backlog/prompts/rules-of-hooks-fix.md) (LibraryRequestModal: move hooks before conditional return; 5 violations) | Quality | [x] Done | - |
| 0.20 | CI | [Quest Grammar Cert Feedback](.specify/specs/quest-grammar-cert-feedback/spec.md) (Report Issue stability; form config; AI enrichment primary) | UI | [x] Done | - |
| 0.21 | CJ | [Admin Quest Edit from Dashboard](.specify/specs/admin-quest-edit-from-dashboard/spec.md) (edit link in quest modal when admin; extend to CYOA) | UI | [x] Done | - |
| **0.22** | **CK** | **[Prisma Client Browser Fix](.specify/specs/prisma-client-browser-fix/spec.md)** (Compile & preview: Prisma in browser; server action for compileQuestWithPrivileging) | Infra | [x] Done | - |
| 0.23 | CL | [Admin CYOA Preview, DRAFT-Only, New Passage Wizard](.specify/specs/admin-cyoa-preview-draft-wizard/spec.md) (admin preview for DRAFT; all extensions → DRAFT; wizard for New Passage) | UI/Infra | [x] Done | CK |
| 0.24 | CM | [321 EFA Integration](.specify/specs/321-efa-integration/spec.md) (321 as Emotional First Aid tool; gold star vibeulon for 321 completion; separate from delta + BAR creator mints) | Economy/UI | [x] Done | - |
| 0.25 | CN | [Creation Quest Bootstrap](.specify/specs/creation-quest-bootstrap/spec.md) (heuristic-first runtime, AI fallback; extractCreationIntent, generateCreationQuest, assembleArtifact) | Infra | [x] Done | BY, BL |
| 0.26 | CO | [I Ching Alignment and Game Master Sects](.specify/specs/iching-alignment-game-master-sects/spec.md) (aligned I Ching draw; kotterStage, nation, archetype, developmental lens; Game Master as sect head) | Infra/UI | [x] Done | S, AS |
| 0.27 | CP | [I Ching Unplayed Hexagram Preference](.specify/specs/iching-unplayed-preference/spec.md) (prefer hexagrams not yet received; throughput-first; fall back to duplicates when all played) | Infra | [x] Done | CO |
| 0.28 | CR | [I Ching Grammatic Quests](.specify/specs/iching-grammatic-quests/spec.md) (I Ching context in compileQuest; random unpacking + hexagram → QuestPacket/CYOA; replace CustomBar) | Infra/UI | [x] Done | CO, BY |
| 0.30 | CS | [Random Unpacking Canonical Kernel](.specify/specs/random-unpacking-canonical-kernel/spec.md) (satisfaction/dissatisfaction from emotional alchemy moves; Q1 from nation+playbook; random move + self-sabotage) | Infra | [x] Done | CR, BY |
| **0.29** | **CQ** | **[Quest Grammar Action Node](.specify/specs/quest-grammar-action-node/spec.md)** (donation node → action node; campaign-agnostic; high-leverage deftness; unlocks Quest Quality Automation) | Infra | [x] Done | CI |
| 0.31 | CT | [Quest Completion Context Restriction](.specify/specs/quest-completion-context-restriction/spec.md) (campaign quests → gameboard only; personal/public → dashboard, wallet; CYOA nodes → no completion) | Infra/UI | [x] Done | - |
| 0.32 | CU | [Adventure Completion Record](.specify/specs/adventure-completion-record/spec.md) (deferred: explicit record when player completes adventure; vibeulons + "I completed this adventure" for badges/history) | Infra | [x] Done | CT |
| 0.33 | CV | [Gameboard and Campaign Deck](.specify/specs/gameboard-campaign-deck/spec.md) (blocker for onboarding; 8 quests/period from deck; complete→replace; spend vibeulons to convert/add subquest; lower priority than I Ching grammar) | UI/Economy | [x] Done | CT |
| 0.35 | CX | [Onboarding CYOA Generator](.specify/specs/onboarding-cyoa-generator/spec.md) (Campaign Owner unpacking → Donate/Sign Up CYOA; random test harness for quest grammar) | UI/Infra | [x] Done | BY, CR, CS |
| 0.36 | CY | [Gameboard Quest Generation](.specify/specs/gameboard-quest-generation/spec.md) (Kotter-stage-aligned deck; subquest support; starter subquests; feedback for improvement) | UI/Infra | [x] Done | CV, BN |
| 0.37 | CZ | [Gameboard UI Update](.specify/specs/gameboard-ui-update/spec.md) (completion validation; admin edit; add quest modal; wizard context; admin grammatical generation) | UI | [x] Done | CY |
| 0.38 | DA | [Quest Wizard Template Alignment](.specify/specs/quest-wizard-template-alignment/spec.md) (deprecate Party Prep, Connection, Inner↔External; refine Dreams & Schemes; Personal Development = Grow Up) | UI | [x] Done | - |
| 0.39 | DB | [Gameboard Deep Engagement](.specify/specs/gameboard-deep-engagement/spec.md) (3-step completion Wake/Clean/Show; steward visibility; vibeulon bidding; AID/fork; hexagram+campaign quest generation) | UI/Economy | [x] Done | CZ |
| 0.40 | DC | [Branched Path Orientation](.specify/specs/branched-path-orientation/spec.md) (altitude + longitudinal + domain; 2–4 choices) | UI/Infra | [/] Phase 1 done | CE |
| 0.41 | DD | [NPC Agent Game Loop Simulation](.specify/specs/npc-agent-game-loop-simulation/spec.md) (pickQuestForAgent, simulateAgentGameLoop) | Infra | [x] Done | - |
| 0.42 | DE | [Auto Flow Chained Initiation](.specify/specs/auto-flow-chained-initiation/spec.md) (intro + character creation + moves/GM packets; lens/nation/playbook/domain branching; publishChainedInitiationAdventure) | UI/Infra | [x] Done | BY, BX |
| 0.43 | DF | [Branching Quest](.specify/specs/branching-quest/spec.md) (I Ching in-quest; Altitude Map 6 options, collapsible, reorderable; per-node choice type altitudinal/horizontal; 3-layer depth limit) | UI/Infra | [x] Done | BY, DC |
| 0.44 | DG | [Dashboard-First Orientation Flow](.specify/specs/dashboard-orientation-flow/spec.md) (configurable post-signup redirect; conclave deprecated for new campaigns; orientation required; Game Master face style; Bruised Banana MVP) | UI/Infra | [x] Done | BX, CX |
| 0.45 | DH | [AID Decline Fork, Clock, and Lore](.specify/specs/aid-decline-fork-clock-lore/spec.md) (decline clock; fork-on-decline; Jira–GitHub–CYOA metaphor; Architect as sys-admin teacher) | UI/Docs | [x] Done | DB |
| 0.45.1 | DQ | [Flow Simulator CLI + Bounded Simulated Actor Roles](.specify/specs/flow-simulator-cli/spec.md) (CLI flow simulation; Bruised Banana fixtures; Librarian/Collaborator/Witness scaffold) | Infra | [ ] Ready | - |
| 0.46 | DI | [Lore-Immersive Onboarding](.specify/specs/lore-immersive-onboarding/spec.md) (story world + campaign actions equally; draw players into Conclave/heist; lore embedded in flow; immersive digital theater) | UI/Content | [x] Done | AG, AH, DE, DG |
| 0.47 | DJ | [Onboarding Quest Generation Unblock](.specify/specs/onboarding-quest-generation-unblock/spec.md) (I Ching step; feedback field; grammatical example; skeleton-first; lens as first choice; CYOA process) | UI/Infra | [ ] Ready | CX, CD, CR |
| 0.48 | DK | [Cert Onboarding Quest Generation Unblock](.specify/specs/cert-onboarding-quest-generation-unblock/spec.md) (verification quest cert-onboarding-quest-generation-unblock-v1; I Ching, feedback, skeleton, publish) | UI | [ ] Ready | DJ |
| 0.49 | DL | [Campaign Map Phase 1](.specify/specs/campaign-map-phase-1/spec.md) (Opening Momentum; Layer 1 Phase Header, Layer 2 Domain Regions, Layer 3 Field Activity; extends gameboard) | UI | [ ] Ready | CY, DG |
| 0.50 | DM | [Starter Quest Generator v1](.specify/specs/starter-quest-generator/spec.md) (domain-biased starter quests; resolveMoveForContext; 5 templates; extends bruised-banana short wins) | UI/Infra | [x] Done | CG, BX |
| 0.51 | DN | [Onboarding Flow Completion](.specify/specs/onboarding-flow-completion/spec.md) (state machine API; Strengthen 4 branches; visible effects; cert-onboarding-flow-completion-v1) | UI/Infra | [x] Done | DM, CG |
| 0.52 | DO | [Admin Onboarding Flow API](.specify/specs/admin-onboarding-flow-api/spec.md) (API-first; GET /api/admin/onboarding/flow; template structure on admin page; cert-admin-onboarding-flow-api-v1) | UI/Infra | [x] Done | BX |
| 0.53 | DP | [Admin Onboarding Graph View](.specify/specs/admin-onboarding-graph-view/spec.md) (graph/tree view; choice branches + convergence; Play draft, View API links) | UI | [x] Done | DO |
| 0.54 | DQ | [Admin Onboarding Passage Edit](.specify/specs/admin-onboarding-passage-edit/spec.md) (node-level edit; GET/PATCH passages API; PassageEditModal; clickable graph nodes) | UI/Infra | [x] Done | DP |
| 0.54 | DS | [Campaign Entry UI](.specify/specs/campaign-entry-ui/spec.md) (You've entered the Bruised Banana Campaign; Nation, Archetype, Intended Impact, starter quests; dismissible banner) | UI | [x] Done | DN |
| 0.55 | DR | [Twine Authoring IR + Twee Compiler](.specify/specs/twine-authoring-ir/spec.md) (IR schema, irToTwee, validateIrStory, compile/validate APIs; mobile admin UI; compiler-first) | UI/Infra | [x] Done | - |
| 0.56 | DT | [Flow Simulator CLI + Bounded Simulated Actor Roles](.specify/specs/flow-simulator-cli/spec.md) (CLI for quest flow simulation; Bruised Banana fixtures; Librarian/Collaborator/Witness scaffold) | Infra | [ ] Ready | - |
| 0.57 | DU | [Prisma P6009 Response Size Fix](.specify/specs/prisma-p6009-response-size-fix/spec.md) (listBooks over-fetch; exclude extractedText; anti-fragile error handling) | Infra | [ ] Ready | AZ |
| **0.58** | **DV** | **[Prisma Migrate Deploy DATABASE_URL](.specify/specs/prisma-migrate-deploy-database-url/spec.md)** (emergent: build fails when DATABASE_URL missing; skip migrate when unset, run prisma generate + next build) | Infra | [x] Done | - |
| **0.59** | **DX** | **[Report Feedback Stability](.specify/specs/report-feedback-stability/spec.md)** (emergent: Report Issue kicks to dashboard; API-first fix—POST /api/feedback/cert, executeBindingsForPassage skipRevalidate) | UI | [x] Done | L, CI |
| 0.60 | DY | [Twine Authoring Preview, Filter, Template](.specify/specs/cert-twine-authoring-preview-filter-template/spec.md) (emergent: in-editor preview, Twine page filter, template support) | UI | [x] Done | DR |
| 0.61 | DZ | [Onboarding Flow Nations, Archetypes, Domains](.specify/specs/cert-onboarding-flow-nations-archetypes-domains/spec.md) (emergent: [[Continue]] removal, nation/archetype paths, domain links, first quest stub) | UI | [x] Done | DN |
| 0.62 | EA | [Admin Onboarding Convergence Node Naming](.specify/specs/cert-admin-onboarding-convergence-node-naming/spec.md) (emergent: convergence nodes labeled consistently, not after first branch) | UI | [x] Done | DO |
| 0.63 | EB | [K-Space Report to Library Skill](.specify/specs/cert-k-space-report-to-skill/spec.md) (emergent: link to skill/guide instead of request form) | UI | [x] Done | AI |
| 0.64 | EC | [Claude Code Workflow Integration](.specify/specs/claude-code-workflow-integration/spec.md) (CLAUDE.md workflow guidance for contributors; spec workflow, agent refresh, fail-fix) | Infra | [x] Done | - |
| 0.65 | ED | [Narrative Transformation Engine v0](.specify/specs/narrative-transformation-engine/spec.md) (parse stuck narrative → lock detection → transformation moves → Emotional Alchemy / 3-2-1 link → quest seed) | Infra | [ ] Ready | CM, BY |
| 0.66 | EE | [Transformation Move Library v1](.specify/specs/transformation-move-library/spec.md) (WCGS + Nation + Archetype layers; Nation Move Profiles; quest seed wake/cleanup/grow/show/bar) | Infra | [ ] Ready | ED |
| 0.67 | EF | [Nation Move Profiles v0](.specify/specs/nation-move-profiles/spec.md) (Emotional Alchemy integration; emotion channel, developmental emphasis, move style per nation) | Infra | [ ] Ready | EE |
| 0.68 | EG | [Archetype Move Styles v0](.specify/specs/archetype-move-styles/spec.md) (8 trigram-linked Playbooks; agency style, prompt modifiers, quest style; archetypeKey = playbook slug) | Infra | [ ] Ready | EE |
| 0.68.1 | EZ | [Archetype Influence Overlay v1](.specify/specs/archetype-influence-overlay/spec.md) (canonical trigram archetypes; agency overlay; Experiment/Integrate expression; superpowers separate) | Infra | [ ] Ready | EG, EE |
| 0.69 | EH | [Superpower Move Extensions v0](.specify/specs/superpower-move-extensions/spec.md) (Allyship prestige; Connector, Storyteller, etc.; extends base archetypes for domain quests) | Infra | [ ] Ready | EG |
| 0.70 | EI | [Archetype Key Resolution](.specify/specs/archetype-key-resolution/spec.md) (ARCHETYPE_KEYS → playbook slug mapping; resolveArchetypeKeyForTransformation; transformation/avatar use playbook slugs) | Infra | [ ] Ready | EG |
| 0.71 | EJ | [Admin Agent Forge](.specify/specs/admin-agent-forge/spec.md) (admin-only 3-2-1 Forge; distortion gate; friction mint; AgentSpec/AgentPatch; vibeulon routing) | Infra | [ ] Ready | - |
| 0.72 | EK | [Admin Twine Adventure Builder](.specify/specs/admin-twine-builder/spec.md) (CMS for Adventures; CRUD; passage editor; macro engine; PlayerAdventureProgress) | UI | [x] Done | - |
| 0.73 | EL | [Attunement Translation](.specify/specs/attunement-translation/spec.md) (Vibeulon economy: Global/Local; attune; transmute; VibeulonLedger) | Economy | [ ] Ready | - |
| 0.74 | EM | [CYOA Certification Quests](.specify/specs/cyoa-certification-quests/spec.md) (cert quests for CYOA onboarding: landing CTA, campaign flow, sign-up redirect) | Quality | [ ] Ready | AG |
| 0.75 | EN | [Game Rules Wiki Update](.specify/specs/game-rules-wiki-update/spec.md) (wiki rules: BAR ecology, decks, quests, vibeulons, compost, slot market) | Docs | [x] Done | - |
| 0.76 | EO | [Push to Main and Vercel Deployment](.specify/specs/push-to-main-vercel-deploy/spec.md) (process: pre-push checks, commit strategy, Vercel deploy, post-deploy verification) | Infra | [ ] Ready | - |
| 0.77 | EP | [Sustainability and Onboarding Lore](.specify/specs/sustainability-onboarding-lore/spec.md) (wiki: onboarding-path, sustainability, integral-emergence; Bruised Banana expansion) | Docs | [ ] Ready | R |
| 0.78 | EQ | [Wake-Up Campaign Birthday Pivot](.specify/specs/wake-up-campaign-birthday-pivot/spec.md) (campaign as narrative funnel: 5 Acts — Fracture, Spiral, Greenhouse, Ask, Oath) | UI/Design | [ ] Ready | - |
| 0.79 | ER | [321 Shadow Process](.specify/specs/321-shadow-process/spec.md) (digital 3→2→1 flow; BAR creation; metadata321; deriveMetadata321) | Infra | [x] Done | - |
| 0.80 | ES | [Market Clear Filters](.specify/specs/market-clear-filters/spec.md) (Clear all filters clears campaign domain preference; cert feedback) | UI | [x] Done | - |
| 0.81 | ET | [Quest Upgrade to CYOA](.specify/specs/quest-upgrade-to-cyoa/spec.md) (admin upgrade existing quests to full CYOA adventures) | UI/Infra | [x] Done | - |
| 0.82 | EU | [Cert Quest Grammar Runtime Error](.specify/specs/cert-quest-grammar-runtime-error/spec.md) (telemetryHooks stripped; Report Issue; layout) | UI | [x] Done | CI |
| 0.83 | EV | [CYOA Auth New vs Existing](.specify/specs/cyoa-auth-new-vs-existing/spec.md) (sign-in/log-in at auth node; applyCampaignStateToExistingPlayer; Continue to campaign) | UI | [x] Done | AG |
| 0.84 | EW | [CYOA Onboarding Reveal](.specify/specs/cyoa-onboarding-reveal/spec.md) (Begin the Journey; redirect to onboarding; campaign state personalization) | UI | [x] Done | AG |
| 0.85 | EX | [Gameboard Quest Review Loop](.specify/specs/gameboard-quest-review-loop/spec.md) (preview-review-accept-publish flow; QuestOutlineReview) | UI | [x] Done | CY |
| 0.86 | EY | [Quest Wizard Parity](.specify/specs/quest-wizard-parity/spec.md) (moveType + allyshipDomain required; scope; reward; success criteria) | UI | [x] Done | - |
| 0.87 | EZ | [Deftness Development Skill](.specify/specs/deftness-development-skill/spec.md) (spec kit, API-first, scaling robustness) | Infra | [x] Done | - |
| 0.88 | FA | [Admin Validation Quests](.specify/specs/admin-validation-quests/spec.md) (Quick Mint, Labyrinth, Resurrection Loop; seed-admin-tests) | Quality | [x] Done | E |
| 0.89 | FB | [BAR Quest Campaign Flow](.specify/specs/bar-quest-campaign-flow/spec.md) (InsightBAR; campaignRef/campaignGoal; linkQuestToCampaign; subquest) | UI/Infra | [x] Done | CV |
| 0.90 | FC | [Bruised Banana Onboarding Flow](.specify/specs/bruised-banana-onboarding-flow/spec.md) (Phase 1–2 done: route alignment, BB nodes, nation/playbook/domain) | UI | [x] Done | AG |
| 0.91 | FD | [Env DATABASE_URL](.specify/specs/env-database-url/spec.md) (local dev env setup; .env.example; docs) | Infra | [x] Done | - |
| 0.92 | FE | [Env Seed Scripts Onboarding](.specify/specs/env-seed-scripts-onboarding/spec.md) (require-db-env; clear message when DATABASE_URL missing) | Infra | [x] Done | FD |
| 0.93 | FF | [Fundraiser Landing Refactor](.specify/specs/fundraiser-landing-refactor/spec.md) (event as invite; no 4 moves on landing; T revision) | UI | [x] Done | T |
| 0.94 | FG | [Twine Normalization](.specify/specs/twine-normalization/spec.md) (normalizeTwineStory; ParsedTwineSchema; canonical structure) | Infra | [x] Done | - |
| 0.95 | FH | [Twine Hardening](.specify/specs/twine-hardening/spec.md) (startPassage fallbacks; Zod validation; graceful errors) | Infra | [x] Done | FG |
| 0.96 | FI | [Twine Completion Hardening](.specify/specs/twine-completion/spec.md) (hasActualInputs; auto-complete when no inputs; no double-complete) | UI | [x] Done | - |
| 0.97 | FJ | [Momentum Unpacking Skill](.specify/specs/momentum-unpacking-skill/spec.md) (6 questions → backlog next steps) | Infra | [x] Done | - |
| 0.98 | FK | [Transformation Move Registry v0](.specify/specs/transformation-move-registry/spec.md) (canonical 8 moves; WCGS mapping; filter, render, assembleQuestSeed) | Infra | [ ] Ready | ED, EE |
| 0.99 | FL | [Transformation Encounter Geometry v0](.specify/specs/transformation-encounter-geometry/spec.md) (3-axis cube: Hide↔Seek, Truth↔Dare, Interior↔Exterior; 8 encounter types; nation/archetype weighting) | Infra | [ ] Ready | FK |
| 1.00 | FM | [BAR → Quest Generation Engine v0](.specify/specs/bar-quest-generation-engine/spec.md) (BAR eligibility → interpretation → emotional alchemy → quest proposal → admin review → publication) | Infra/UI | [ ] Ready | BY, DM |
| 1.01 | FN | [Transformation Simulation Harness v0](.specify/specs/transformation-simulation-harness/spec.md) (CLI: quest, agent, campaign, onboarding; full pipeline; deterministic; simulation-logs) | Infra | [ ] Ready | DT, FK, FL, FO |
| 1.02 | FO | [Minimal Agent Mind Model v0](.specify/specs/minimal-agent-mind-model/spec.md) (6 core variables; createAgent, selectAgentAction, integrateAgentResult; narrative triggers; transformation pipeline integration) | Infra | [ ] Ready | FK |
| 1.03 | FP | [Game Map and Lobby Navigation](.specify/specs/game-map-lobbies/spec.md) (four lobbies: Library, EFA, Dojos, Gameboard; Game Map UI; orientations; adventure relationship) | UI | [x] Done | DW |
| 1.04 | FQ | [Book Quest Targeted Extraction v0](.specify/specs/book-quest-targeted-extraction/spec.md) (TOC extraction; section→dimension mapping; move/nation/archetype/Kotter filters; targeted analysis; token savings) | Infra | [ ] Ready | AZ, BN |
| 1.05 | FR | [Onboarding Feature Discovery](.specify/specs/onboarding-feature-discovery/spec.md) (BARs, quests, EFA, donation—quests + docs; send experience; excite players) | UI/Docs | [x] Done | FP |
| 1.06 | FS | [Onboarding BARs in BARs Wallet](.specify/specs/onboarding-bars-wallet/spec.md) (onboarding BARs → wallet, not marketplace; exclude from market query) | UI/Infra | [x] Done | BX |
| 1.07 | FT | [Public BARs in Library](.specify/specs/public-bars-library/spec.md) (browse public BARs for discovery; /library/bars; distinct from marketplace) | UI | [x] Done | FP |
| 1.08 | RD | [Reflective Data Privacy + Shareability Model v0](.specify/specs/reflective-data-privacy-shareability/spec.md) (data classes; visibility levels; identity layers; derived artifact rules; agent access boundaries; provenance; consent; API-first) | Infra | [ ] Ready | - |
| 1.09 | GA | [BAR Response + Threading Model v0 (RACI)](.specify/specs/bar-response-threading-raci/spec.md) (response intents → RACI roles; take_quest, consult; getBarThread, getBarRoles; max depth 2) | Infra | [ ] Ready | - |
| 1.10 | GB | [Quest Stewardship + Role Resolution Engine v0](.specify/specs/quest-stewardship-role-resolution/spec.md) (resolve stewards, quest state, roles from BAR responses; proposed→active→completed) | Infra | [ ] Ready | GA |
| 1.11 | GC | [Actor Capability + Quest Eligibility Engine v0](.specify/specs/actor-capability-quest-eligibility-engine/spec.md) (matching layer: eligible quests, recommended quests, eligible actors, BAR responders; API-first) | Infra | [ ] Ready | GA, GB |
| 1.12 | GD | [Charge Capture UX + Micro-Interaction v0](.specify/specs/charge-capture-ux-micro-interaction/spec.md) (felt charge → BAR in <10s; 3–5 taps; private by default; post-capture Reflect/Explore/Act) | UI | [ ] Ready | - |
| 1.13 | GE | [Charge → Quest Generator v0](.specify/specs/charge-quest-generator/spec.md) (charge BAR → 3–4 quest suggestions; Wake/Clean/Grow/Show; template-based; nation/archetype influence; BAR linking) | Infra/UI | [x] Done | GD |
| 1.14 | GF | [Singleplayer Charge Metabolism](.specify/specs/singleplayer-charge-metabolism/spec.md) (321 → quest/bar/fuel; friction subquest; tetris key-unlock; Shadow321Session; metabolizability learning) | UI/Infra | [ ] Ready | CM, CN |
| 1.15 | GG | [Custom Portal Onboarding Flow v0](.specify/specs/custom-portal-onboarding/spec.md) (invite token → 5-scene questionnaire → campaignState → createCampaignPlayer; extends Bruised Banana) | UI/Infra | [ ] Ready | DG, BX |
| 1.16 | GH | [Event Campaign Engine + Event Artifact System v1](.specify/specs/event-campaign-engine/spec.md) (campaign = production organism; event = artifact; domain vs topic; Kotter/Epiphany Bridge; calendar export) | Infra/UI | [ ] Ready | GA, GB |
| 1.17 | GI | [Archetype Agent Ecology v0](.specify/specs/archetype-agent-ecology/spec.md) (archetype-based AI agents; rule-based; BAR/quest/campaign/event integration; API-first) | Infra | [ ] Ready | GH |
| 1.18 | GJ | [Campaign Playbook System v0](.specify/specs/campaign-playbook-system/spec.md) (living strategy doc per campaign; Kotter stages; domain strategy; RACI; manual + automated synthesis; export; deck) | UI/Infra | [ ] Ready | S |
| 1.19 | GK | [Campaign Invitation System v0](.specify/specs/campaign-invitation-system/spec.md) (invite actors with roles; RACI integration; consent-based; playbook integration; send/accept/decline/confirm-role) | UI/Infra | [ ] Ready | GJ |
| 1.20 | GL | [Dashboard Header: Explore, Character, Campaign](.specify/specs/dashboard-header-explore-character-campaign/spec.md) (3 sections; remove Act 1/2; campaign stage button; modals with full-page links) | UI | [x] Done | BQ |
| 1.21 | GM | [Dashboard Section Modal Buttons](.specify/specs/dashboard-section-modal-buttons/spec.md) (Explore/Character/Campaign as buttons; modals contain existing actions + full-page link) | UI | [x] Done | GL |
| 1.22 | GN | [Dashboard Header Row + Play the Game Box](.specify/specs/dashboard-header-row-and-play-box/spec.md) (identity + vibeulons in one row; Explore/Character/Campaign in labeled box) | UI | [x] Done | GM |
## Bruised Banana Campaign (Cursor Plan Alignment)

**Onboarding flow status (Mar 2025)**: DG, DQ, DS, DM, DN, DR done. DJ/DK (quest generation) are admin-side, not player flow.

**Emergent SpecBAR**: [bruised-banana-launch-specbar](.specify/specs/bruised-banana-launch-specbar/spec.md) — oneshot the campaign via interactive unpacking input (Campaign Owner / Allyship Target / Ally). This SpecBAR affects the larger launch thread; BY (Quest Grammar + Campaign Owner input) and BX (Campaign Onboarding Twine v2) are pulled into this flow.

The following items align with [.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md](.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md). Use game language (WHO, WHAT, WHERE, Energy, Personal throughput) in specs. Backlog prompts: [bruised-banana-donation](.specify/backlog/prompts/bruised-banana-donation.md), [bruised-banana-quest-map](.specify/backlog/prompts/bruised-banana-quest-map.md), [bruised-banana-allyship-domains](.specify/backlog/prompts/bruised-banana-allyship-domains.md), [lore-conceptual-model](.specify/backlog/prompts/lore-conceptual-model.md), [campaign-kotter-domains](.specify/backlog/prompts/campaign-kotter-domains.md), [offers-bounty-donation-packs](.specify/backlog/prompts/offers-bounty-donation-packs.md), [event-page-campaign-editor](.specify/backlog/prompts/event-page-campaign-editor.md), [admin-mobile-readiness](.specify/backlog/prompts/admin-mobile-readiness.md), [go-live-integration](.specify/backlog/prompts/go-live-integration.md), [market-redesign-launch](.specify/backlog/prompts/market-redesign-launch.md), [lore-cyoa-onboarding](.specify/backlog/prompts/lore-cyoa-onboarding.md) (merges event-driven-cyoa + lore-index), [avatar-from-cyoa-choices](.specify/backlog/prompts/avatar-from-cyoa-choices.md), [story-quest-map-exploration](.specify/backlog/prompts/story-quest-map-exploration.md), [two-minute-ride-story-bridge](.specify/backlog/prompts/two-minute-ride-story-bridge.md), [k-space-librarian](.specify/backlog/prompts/k-space-librarian.md), [k-space-librarian-post-onboarding](.specify/backlog/prompts/k-space-librarian-post-onboarding.md), [cyoa-continue-story-horizontal](.specify/backlog/prompts/cyoa-continue-story-horizontal.md), [cert-feedback-stability](.specify/backlog/prompts/cert-feedback-stability.md), [report-feedback-stability](.specify/backlog/prompts/report-feedback-stability.md), [cert-quest-passage-links](.specify/backlog/prompts/cert-quest-passage-links.md), [cert-progress-indicator-enhancement](.specify/backlog/prompts/cert-progress-indicator-enhancement.md), [cert-vibeulon-payoff-visibility](.specify/backlog/prompts/cert-vibeulon-payoff-visibility.md), [campaign-onboarding-feature-merge](.specify/backlog/prompts/campaign-onboarding-feature-merge.md), [onboarding-adventures-unification](.specify/backlog/prompts/onboarding-adventures-unification.md), [game-master-face-sentences](.specify/backlog/prompts/game-master-face-sentences.md), [vibeulon-visibility](.specify/backlog/prompts/vibeulon-visibility.md), [momentum-unpacking-skill](.specify/backlog/prompts/momentum-unpacking-skill.md), [jrpg-composable-sprite-avatar](.specify/backlog/prompts/jrpg-composable-sprite-avatar.md), [avatar-sprite-assets](.specify/backlog/prompts/avatar-sprite-assets.md), [existing-players-character-generation](.specify/backlog/prompts/existing-players-character-generation.md), [avatar-visibility-and-cert-report-issue](.specify/backlog/prompts/avatar-visibility-and-cert-report-issue.md), [cert-existing-players-v1-feedback](.specify/backlog/prompts/cert-existing-players-v1-feedback.md), [avatar-enlarge-and-admin-sprite-view](.specify/backlog/prompts/avatar-enlarge-and-admin-sprite-view.md), [avatar-sprite-quality-process](.specify/backlog/prompts/avatar-sprite-quality-process.md), [playbook-to-archetype-rename](.specify/backlog/prompts/playbook-to-archetype-rename.md), [admin-manual-avatar-assignment](.specify/backlog/prompts/admin-manual-avatar-assignment.md), [avatar-gallery-preview-and-stacking](.specify/backlog/prompts/avatar-gallery-preview-and-stacking.md), [avatar-stacking-base-preview](.specify/backlog/prompts/avatar-stacking-base-preview.md), [avatar-overwrite-transparency-fix](.specify/backlog/prompts/avatar-overwrite-transparency-fix.md), [campaign-onboarding-twine-v2](.specify/backlog/prompts/campaign-onboarding-twine-v2.md), [quest-grammar-compiler](.specify/backlog/prompts/quest-grammar-compiler.md), [quest-grammar-cert-feedback](.specify/backlog/prompts/quest-grammar-cert-feedback.md), [quest-grammar-allyship-unpacking](.specify/backlog/prompts/quest-grammar-allyship-unpacking.md), [quest-grammar-ux-flow](.specify/backlog/prompts/quest-grammar-ux-flow.md), [quest-grammar-action-node](.specify/backlog/prompts/quest-grammar-action-node.md), [bruised-banana-launch-specbar](.specify/backlog/prompts/bruised-banana-launch-specbar.md), [adventure-restart-completed](.specify/backlog/prompts/adventure-restart-completed.md), [playbook-primary-wave-spec](.specify/backlog/prompts/playbook-primary-wave-spec.md), [gameboard-campaign-deck](.specify/backlog/prompts/gameboard-campaign-deck.md), [gameboard-quest-generation](.specify/backlog/prompts/gameboard-quest-generation.md), [dashboard-orientation-flow](.specify/backlog/prompts/dashboard-orientation-flow.md), [lore-immersive-onboarding](.specify/backlog/prompts/lore-immersive-onboarding.md), [onboarding-quest-generation-unblock](.specify/backlog/prompts/onboarding-quest-generation-unblock.md), [cert-onboarding-quest-generation-unblock](.specify/backlog/prompts/cert-onboarding-quest-generation-unblock.md), [campaign-map-phase-1](.specify/backlog/prompts/campaign-map-phase-1.md), [starter-quest-generator](.specify/backlog/prompts/starter-quest-generator.md), [admin-onboarding-flow-api](.specify/backlog/prompts/admin-onboarding-flow-api.md), [admin-onboarding-graph-view](.specify/backlog/prompts/admin-onboarding-graph-view.md), [admin-onboarding-passage-edit](.specify/backlog/prompts/admin-onboarding-passage-edit.md), [campaign-entry-ui](.specify/backlog/prompts/campaign-entry-ui.md), [cert-twine-authoring-preview-filter-template](.specify/backlog/prompts/cert-twine-authoring-preview-filter-template.md), [cert-onboarding-flow-nations-archetypes-domains](.specify/backlog/prompts/cert-onboarding-flow-nations-archetypes-domains.md), [cert-admin-onboarding-convergence-node-naming](.specify/backlog/prompts/cert-admin-onboarding-convergence-node-naming.md), [cert-k-space-report-to-skill](.specify/backlog/prompts/cert-k-space-report-to-skill.md), [transformation-simulation-harness](.specify/backlog/prompts/transformation-simulation-harness.md), [minimal-agent-mind-model](.specify/backlog/prompts/minimal-agent-mind-model.md), [archetype-agent-ecology](.specify/backlog/prompts/archetype-agent-ecology.md), [campaign-playbook-system](.specify/backlog/prompts/campaign-playbook-system.md), [campaign-invitation-system](.specify/backlog/prompts/campaign-invitation-system.md), [dashboard-header-explore-character-campaign](.specify/backlog/prompts/dashboard-header-explore-character-campaign.md), [dashboard-section-modal-buttons](.specify/backlog/prompts/dashboard-section-modal-buttons.md), [dashboard-header-row-and-play-box](.specify/backlog/prompts/dashboard-header-row-and-play-box.md), [game-map-lobbies](.specify/backlog/prompts/game-map-lobbies.md), [book-quest-targeted-extraction](.specify/backlog/prompts/book-quest-targeted-extraction.md), [onboarding-feature-discovery](.specify/backlog/prompts/onboarding-feature-discovery.md), [onboarding-bars-wallet](.specify/backlog/prompts/onboarding-bars-wallet.md), [public-bars-library](.specify/backlog/prompts/public-bars-library.md).

**House integration**: See [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](.specify/specs/bruised-banana-house-integration/ANALYSIS.md) for domain definitions, blocker catalog, and phased plan. **Emergent SpecBAR**: BZ (oneshot campaign via Campaign Owner unpacking input) affects launch thread. Prioritize: BZ → BY → BX, then AH → U → V, W, X.

**Future**: BAR editing flow — edit own BARs before sent; after sent, recipients can add data (original kept) or pay vibeulon + move to change. Instance ownership (roleKey) for campaign editing. Spec when ready.

## Certification Feedback (Emergent)

Feedback from `.feedback/cert_feedback.jsonl` triaged into backlog:

| Source | Issue | Status |
|--------|-------|--------|
| cert-allyship-domains-v1 | Clear filters didn't remove the filters and bring back filtered out quests | [x] Fixed — Clear all filters now clears campaignDomainPreference and refetches |
| cert-event-donation-honor-v1 | No Venmo, Stripe, PayPal, or Cash App links on donation page | [x] Fixed — seed now sets placeholder URLs on active instance |
| cert-* (emergent) | Report Issue shows "feedback logged" on return; cannot report multiple issues | [x] Fixed — reset on navigate + "Report another issue" button |
| cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1 | Feedback form kicks to dashboard while typing; loses text | [x] Fixed — sessionStorage persistence + restore |
| cert-lore-cyoa-onboarding-v1, cert-two-minute-ride-v1 | /wiki and URLs not clickable; need more links in passage text | [x] Fixed — use passage.text for markdown links |
| cert-two-minute-ride-v1 STEP_3 | Progress visible but need colorful status bar (green) | [x] Fixed — green bar in CampaignReader |
| cert-two-minute-ride-v1 STEP_4 | No visible vibeulon payoff before sign-up | [x] Done — BB_Moves_ShowUp already has vibeulon copy in API |
| cert-two-minute-ride-v1 STEP_1 | Huge wall of text; need slides/chunks to click through | [x] Fixed — slide mode in CampaignReader + PassageRenderer (>500 chars) |
| cert-cyoa-slides (follow-up) | Continue should advance story, not just slides | [x] Fixed — unified Continue in CampaignReader + PassageRenderer; graph split for BB_Intro/BB_ShowUp |
| cert-* (emergent) | Campaign flow lacks wake-up features: developmental lens before nation/archetype; read about nations/archetypes before choosing | [x] Fixed — developmental lens in main flow; BB_NationInfo_*/BB_PlaybookInfo_* nodes |
| cert-existing-players-character-v1 STEP_4 | Avatar not built on create; Report Issue kicks to dashboard | [x] Fixed — CA: skipRevalidate in modal, threadId, avatar via runCompletionEffects |
| cert-campaign-onboarding-twine-v2-v1 STEP_2 | Feedback form kicks to dashboard when typing; double-bracket artifacts in Twine story text | [x] Fixed — skipRevalidate in modal; extractTokenSets now strips [[links]] and <<if>> blocks |
| k-space-librarian-quest STEP_3 | Doc link mismatch: links to any doc regardless of question asked | [ ] Ready — separate spec |
| cert-quest-grammar-v1 STEP_1 | Report Issue reverts to dashboard; unpacking form needs dropdowns + short responses; node output nonsensical—AI prompt, fractal subsections, admin edit | [x] Done → [quest-grammar-cert-feedback](specs/quest-grammar-cert-feedback/spec.md) |
| cert-quest-grammar-v1 STEP_3 | Runtime Error: telemetryHooks passed to client; Report Issue kicks when typing; page layout right-justified | [x] Fixed — telemetryHooks stripped; skipRevalidate + sessionStorage for FEEDBACK; mx-auto layout |
| cert-quest-grammar-v1 STEP_1 | Allyship unpacking: experience types (Gather Resource, etc.), life state (Flowing/Stalled/Neutral), multi-select reservations, move-based aligned action (Wake Up, Clean Up, Grow Up, Show Up), quest type per move | [x] Fixed — CC: life state dropdown + distance; q6Context for reservations |
| cert-quest-grammar-v1, cert-* (completed) | Completed cert adventure links to Market; admin cannot re-run for testing—need Restart on Adventures page | [x] Fixed — CB: AdventureRestartButton on Adventures page for completed certs |
| cert-* (recurring) | Report Issue kicks to dashboard while typing/submitting; multiple prior fixes (skipRevalidate, sessionStorage) insufficient | [x] Fixed — [report-feedback-stability](specs/report-feedback-stability/spec.md): API-first POST /api/feedback/cert, executeBindingsForPassage skipRevalidate when advancing to FEEDBACK |
| cert-twine-authoring-ir-v1 STEP_4 | In-editor preview; filter on Twine story page; template support (set as template, create from template) | [ ] Ready — [cert-twine-authoring-preview-filter-template](specs/cert-twine-authoring-preview-filter-template/spec.md) |
| cert-onboarding-flow-completion-v1 STEP_1 | [[Continue]] artifacts; nation/archetype explanation paths; domain summaries + links; first quest stub | [x] Fixed — [cert-onboarding-flow-nations-archetypes-domains](specs/cert-onboarding-flow-nations-archetypes-domains/spec.md) |
| cert-admin-onboarding-flow-api-v1 STEP_2 | Convergence node named after first branch; should be generic "Convergence" label | [ ] Ready — [cert-admin-onboarding-convergence-node-naming](specs/cert-admin-onboarding-convergence-node-naming/spec.md) |
| k-space-librarian-quest STEP_3 (Mar 4) | Link to report-to-library skill instead of library request itself | [x] Fixed — [cert-k-space-report-to-skill](specs/cert-k-space-report-to-skill/spec.md) |

---

## Prioritization Logic
- **Priority 1**: Emergent blocks or high-leverage UI/UX fixes.
- **Priority 2-3**: Core roadmap features (Attunement phases, ritual mechanics).
- **Priority 4-5**: Optimization, polish, and automated testing suites.

---
*Maintained by the Spec Kit Translator skill.*

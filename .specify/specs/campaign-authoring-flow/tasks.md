# Tasks: Campaign Authoring Flow

## Phase 1: Context-Aware Editor (No AI required for display)

### 1a — Passage table: Face badge + fill status

- [x] **1a.1** Add `getFaceForNodeId(nodeId: string)` export to `src/lib/template-library/index.ts` — returns `{ face, color }` from `FACE_PLACEHOLDER` map (no db call).
- [x] **1a.2** Add `isPlaceholderText(text: string)` export — returns true if text matches `getPlaceholderForSlot` output pattern.
- [x] **1a.3** Adventure detail page (`src/app/admin/adventures/[id]/page.tsx`): add "Face" column to passage table with colored face badge per `getFaceForNodeId(passage.nodeId)`.
- [x] **1a.4** Same table: add fill-status dot (gray = placeholder, green = authored) using `isPlaceholderText(passage.text)`.

### 1b — Passage edit page: Context panel

- [x] **1b.1** In `EditPassagePage` (`src/app/admin/adventures/[id]/passages/[passageId]/edit/page.tsx`): fetch `adventure.campaignRef`, `adventure.subcampaignDomain`, active instance `targetDescription` + `kotterStage`.
- [x] **1b.2** Fetch preceding passage(s): sort all adventure passages by slot order (context_1 < context_2 < ... < artifact), find up to 2 passages before current.
- [x] **1b.3** Add `PassageContextPanel` component — shows: face badge + function guidance, campaign ref + domain + goal, preceding passage snippets (collapsed by default).
- [x] **1b.4** Render `PassageContextPanel` above the `EditPassageForm`.

### 1c — "Generate with [Face]" button

- [x] **1c.1** Add `generateSinglePassage(passageId: string)` server action in `src/app/admin/adventures/[id]/passages/[passageId]/edit/actions.ts`. Fetches adventure context server-side. Calls backend `POST /api/agents/generate-passage`. Returns `{ text: string }`.
- [x] **1c.2** Add "Generate with [Face]" button to `EditPassageForm` — styled with face color, disabled while pending.
- [x] **1c.3** On click: call `generateSinglePassage`, populate controlled textarea with result, show yellow "AI draft" indicator. Editing clears the indicator.
- [x] **1c.4** Backend: added `POST /api/agents/generate-passage` route in `backend/app/routes/agents.py`. Accepts `{ node_id, face, campaign_function, campaign_ref?, subcampaign_domain?, campaign_goal?, kotter_stage?, preceding_texts }`. Routes to per-face system prompt via inline pydantic-ai Agent. Returns `{ text: string }`.
- [ ] **1c.5** `npm run build` and `npm run check` — fail-fix.

## Phase 2: Campaign Authoring Hub

- [x] **2.1** Created `/admin/campaign/[ref]/author` page — lists all Adventures for `campaignRef`, grouped by subcampaignDomain.
- [x] **2.2** Each Adventure row shows: title, passage pills (face-colored, dimmed if placeholder), fill progress bar + X/N count, Promote button when all authored.
- [x] **2.3** "Generate Adventure from Deck" button per domain — admin selects Kotter stage → calls `generateAdventureFromDeck(campaignRef, domain, kotterStage)` → spawns Adventure from encounter-9-passage template.
- [x] **2.4** `choice` slot: finds top 3 quests by `campaignRef + allyshipDomain + kotterStage` → generates choices referencing quest titles targeting `response`.
- [x] **2.5** `artifact` slot: sets `passage.linkedQuestId` to highest-reward quest for domain; text seeded with quest title + description.
- [ ] **2.6** `npm run build` and `npm run check` — fail-fix.

## Phase 3: PDF Quest Bridge

- [x] **3.1** Passage editor: collapsible "Quest" panel with search input → filters up to 100 quests scoped to `adventure.campaignRef` (or global fallback). "Import" button populates the controlled textarea.
- [x] **3.2** "Link" button per quest → calls `linkPassageToQuest` server action, sets `passage.linkedQuestId`, shows linked quest badge with "Unlink" button. Syncs on save (existing behavior: `updatePassage` writes back to `CustomBar.description`).
- [x] **3.3** Book quest detection: quests with `docQuestMetadata` show "Book" badge. Import prefers `storyContent` (if plain text) over `description`.
- [ ] **3.4** `npm run build` and `npm run check` — fail-fix.

## Phase 4: Campaign from Kernel

- [x] **4.1** Added `narrativeKernel String?` to `Instance` in `prisma/schema.prisma`. Ran `npm run db:sync` (Prisma Client regenerated; run `prisma migrate deploy` for prod).
- [x] **4.2** `KernelForm` client component in hub — textarea + "Save Kernel" → calls `saveNarrativeKernel` server action → updates `instance.narrativeKernel`.
- [x] **4.3** `GenerateAllForm` — Kotter stage selector + "Generate All Subcampaigns" button → calls `generateAllSubcampaigns(campaignRef, kotterStage)`. Disabled until kernel is set. Shows "up to 2 minutes" note while pending.
- [x] **4.4** Backend `POST /api/agents/generate-campaign` — takes `{ kernel, domains, kotter_stage, campaign_ref }`. Runs all slots per domain concurrently via `asyncio.gather`. Face agents mapped per slot (context→Shaman, anomaly→Challenger, choice→Diplomat, response→Regent, artifact→Architect). Returns `{ passages: { [domain]: { [nodeId]: text } } }`.
- [x] **4.5** `generateAllSubcampaigns` creates one Adventure per domain from `encounter-9-passage` template, overwrites all passage texts with AI-generated content (not placeholders → fill status shows authored). Adventures shown in hub immediately after `router.refresh()`.
- [ ] **4.6** `npm run build` and `npm run check` — fail-fix.

## Verification

- [ ] **V1** Open BB subcampaign Adventure in admin — passages show face badges (Shaman/Challenger etc.) and fill status dots.
- [ ] **V2** Open a placeholder passage — context panel shows face + function + campaign goal. "Generate" button visible.
- [ ] **V3** Click "Generate with Shaman" — textarea fills with generated context passage.
- [ ] **V4** (Phase 2) Campaign hub shows 3 subcampaigns with fill status. "Generate from Deck" produces playable Adventure.
- [ ] **V5** (Phase 4) Provide kernel → system generates all 27 passages as drafts → admin can promote.

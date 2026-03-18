# Tasks: Avatar System Strategy & Pipeline Reanalysis

## Phase 1: Fix stacking, visibility, enlarge, gallery preview

### Visibility (from AW)

- [x] **1.1** `autoCompleteQuestFromTwine` calls `processCompletionEffects` (via `runCompletionEffectsForQuest`)
- [x] **1.2** `advanceRun` calls `advanceThreadForPlayer` when threadId present
- [x] **1.3** Build Your Character quest derives avatarPreviewConfig on-the-fly when avatarConfig null
- [x] **1.4** PassageRenderer has FEEDBACK passage + Report Issue link
- [x] **1.5** Audit cert quests — verify every step has Report Issue link (manual check)

### Stacking (from BG, BH)

- [x] **1.6** `slugifyName` returns `''` not `'unknown'` for degenerate input; `deriveAvatarConfig` uses `nationKey: ''` → nation layers skipped
- [x] **1.7** Avatar component: `failedLayers.has('base')` triggers initials fallback
- [x] **1.8** Assign Avatar form: base-only `previewConfig` when no nation/archetype selected
- [x] **1.9** Avatar container: `bg-zinc-900` solid background
- [x] **1.10** Overlay layers use transparent backgrounds — asset concern, verify sprites (SPRITE_ASSETS.md + STYLE_GUIDE.md document requirement; overlay-only prompts in CHATGPT_PROMPTS.md)

### Enlarge (from AX)

- [x] **1.11** Dashboard avatar click → modal (`DashboardAvatarWithModal`)
- [x] **1.12** Modal: click-outside, Escape, close button (`AvatarModal`)

### Gallery (from BG, AX)

- [x] **1.13** Assign Avatar form: live preview via `useMemo` previewConfig
- [x] **1.14** Admin: `/admin/avatars` — player avatar gallery
- [x] **1.15** Admin: Preview by config via AssignAvatarForm dropdowns

### Sprite Assets (from AX)

- [x] **1.16** Admin: `/admin/avatars/assets` — layer list, expected keys, missing files
- [x] **1.17** Admin: Upload PNG for layer+key (`SpriteAssetsClient` + `uploadSpriteAsset`)

## Phase 2: Quality process (from AY)

- [x] **2.1** STYLE_GUIDE.md — palette, review gates, layer design, per-nation motifs; SPRITE_ASSETS.md references it
- [x] **2.2** `npm run sprites:derive-base` — palette-swap script fully implemented (`scripts/derive-base-sprites.ts`); `--init-from-default` flag
- [x] **2.3** SPRITE_ASSETS.md has AI prompt table (per-file prompts) + LPC workflow with attribution

## Phase 3: Agent-built assets (future)

- [ ] Define spec when agent capability is ready
- [ ] Game Master agents (Architect, Shaman) generate sprites; feedback loop; cost reduction

## Verification

- [x] `npm run loop:ready` passes
- [ ] Manual: complete Build Your Character → avatar on dashboard
- [ ] Manual: Assign Avatar form preview; base-only; full stacking
- [ ] Manual: Dashboard avatar click → larger view

# Tasks: Avatar System Strategy & Pipeline Reanalysis

## Phase 1: Fix stacking, visibility, enlarge, gallery preview

### Visibility (from AW)

- [ ] **1.1** `autoCompleteQuestFromTwine` calls `processCompletionEffects` when quest has completionEffects
- [ ] **1.2** `advanceRun` passes threadId; calls `advanceThreadForPlayer` when completing quest in thread
- [ ] **1.3** Build Your Character quest displays avatar preview when avatarConfig is null but nationId+playbookId exist
- [ ] **1.4** Report Issue: FEEDBACK passage and Report Issue link on Build Your Character START
- [ ] **1.5** Report Issue: Audit cert quests; every step has Report Issue link

### Stacking (from BG, BH)

- [ ] **1.6** `deriveAvatarConfig` MUST NOT set `nationKey: 'unknown'` when no nation; use `nationKey: ''` so nation layers are skipped
- [ ] **1.7** Avatar component: when base layer fails, show initials fallback (not partial layers)
- [ ] **1.8** Assign Avatar form: base-only preview when nation and archetype unselected; show base layer
- [ ] **1.9** Avatar container has solid background (e.g. bg-zinc-900) so transparency is not confusing
- [ ] **1.10** Overlay layers use transparent backgrounds per SPRITE_ASSETS.md

### Enlarge (from AX)

- [ ] **1.11** Dashboard header avatar is clickable; onClick opens modal with Avatar at larger size
- [ ] **1.12** Modal: click-outside, Escape, close button to dismiss

### Gallery (from BG, AX)

- [ ] **1.13** Assign Avatar form: live preview area; updates when nation, playbook, base variant change
- [ ] **1.14** Admin: `/admin/avatars` or section in admin players — list players with avatars
- [ ] **1.15** Admin: Preview by config (nation, playbook dropdowns) — optional

### Sprite Assets (from AX, optional Phase 1)

- [ ] **1.16** Admin: Sprite Assets view — list layers; expected keys; which files exist vs missing
- [ ] **1.17** Admin: Upload PNG for layer+key — optional

## Phase 2: Quality process (from AY)

- [ ] **2.1** STYLE_GUIDE.md documents palette, review gates; update docs/SPRITE_ASSETS.md
- [ ] **2.2** `npm run sprites:derive-base` — derive base variants from canonical
- [ ] **2.3** Nation/playbook placeholder prompts or LPC sourcing

## Phase 3: Agent-built assets (future)

- [ ] Define spec when agent capability is ready
- [ ] Game Master agents (Architect, Shaman) generate sprites; feedback loop; cost reduction

## Verification

- [ ] `npm run loop:ready` passes
- [ ] Manual: complete Build Your Character → avatar on dashboard
- [ ] Manual: Assign Avatar form preview; base-only; full stacking
- [ ] Manual: Dashboard avatar click → larger view

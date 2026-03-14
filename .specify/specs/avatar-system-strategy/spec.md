# Spec: Avatar System Strategy & Pipeline Reanalysis

## Purpose

Reanalyze the avatar pipeline for deftness and agent-implementability. Bundle current avatar backlog (visibility, enlarge, quality process, gallery preview, stacking fix) into a coherent strategy. Set a future vision: Game Master agents building assets and learning low-cost image generation.

**Supersedes**: [AW](../avatar-visibility-and-cert-report-issue/spec.md), [AX](../avatar-enlarge-and-admin-sprite-view/spec.md), [AY](../avatar-sprite-quality-process/spec.md), [BG](../avatar-gallery-preview-and-stacking/spec.md), [BH](../avatar-stacking-base-preview/spec.md).

**Practice**: Deftness Development — spec kit first, API-first, deterministic over AI. Reduce iteration cost; prepare for agent-built assets.

## Current State

| Asset | Description |
|-------|-------------|
| **Layer system** | base → nation_body → playbook_outfit → nation_accent → playbook_accent. Defined in [avatar-parts.ts](../../src/lib/avatar-parts.ts). |
| **Sprite creation** | Manual: ChatGPT/AI prompts for placeholders; LPC; commission. Docs: [SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md). |
| **Admin** | Manual avatar assignment; no sprite asset management UI. |
| **Known bugs** | Stacking (layers replace instead of composite); visibility (autoCompleteQuestFromTwine bypasses completion effects); no click-to-enlarge; no admin sprite viewer. |

## Deftness Reanalysis

| Dimension | What reduces iteration cost |
|-----------|----------------------------|
| **Schema/config clarity** | `deriveAvatarConfig` well-defined; nationKey/playbookKey from slugify; no `nationKey: 'unknown'` when unselected. |
| **Asset pipeline** | Upload, preview, derive-base. Admin can add/replace PNGs without code edits. |
| **Stacking/composition** | Base-only preview when no nation/archetype; full layer composite; transparent overlays; solid background. |
| **Quality gates** | Style guide (STYLE_GUIDE.md); review checklist; Gathertown/Stardew vibe. |

## Agent-Implementability

| Task | Today | Future (Phase 3) |
|------|-------|------------------|
| **Sprite generation** | Human or external AI (ChatGPT prompts) | Game Master agents (Architect, Shaman) generate via prompts; feedback loop. |
| **Asset upload** | Manual (filesystem) | Agent can upload; admin approves. |
| **Config derivation** | Code (`deriveAvatarConfig`) | Same; agents may propose configs. |
| **Preview rendering** | Avatar component | Same; agents may render for verification. |

**Future vision**: Game Master agents own asset creation; learn from cert feedback; increasingly low-cost image assets. Not there yet — Phase 3 placeholder.

## Phased Approach

### Phase 1 (now): Fix stacking, visibility, enlarge, gallery preview

- **Stacking**: Fix `nationKey: 'unknown'`; base-only preview when unselected; full layer composite; solid background.
- **Visibility**: `autoCompleteQuestFromTwine` calls `processCompletionEffects`; `deriveAvatarFromExisting` runs; avatar preview on Build Your Character quest.
- **Enlarge**: Dashboard avatar click → modal with larger view.
- **Gallery**: Admin Assign Avatar form has live preview; preview before assign.
- **Report Issue**: Build Your Character + cert quests have Report Issue links.

**Minimal human art**: Use existing placeholders.

### Phase 2: Quality process

- **Style guide**: STYLE_GUIDE.md; palette; review gates.
- **Derive-base**: Base variants (default, male, female, neutral) from canonical; `npm run sprites:derive-base`.
- **Nation/playbook placeholders**: AI prompts or LPC; overlay-only requirement.

**Still human or external AI**; no agent-built assets yet.

### Phase 3 (future): Agent-built assets

- Game Master agents (Architect, Shaman) generate sprites via prompts.
- Feedback loop: cert feedback; quality signals; cost reduction over time.
- **Placeholder**: Deferred; spec when agent capability is ready.

## User Stories (from bundled specs)

### P1: Avatar visibility (AW)

**As an existing player**, when I complete Build Your Character quest, my avatar is saved and appears on the dashboard.

**Acceptance**: `autoCompleteQuestFromTwine` calls `processCompletionEffects`; `deriveAvatarFromExisting` runs.

### P2: Avatar preview before completion (AW)

**As an existing player** with nation and archetype, I see my character as a preview in the Build Your Character flow before I click Confirm.

**Acceptance**: Quest renders avatar preview derived from `player.nationId` and `player.playbookId` when `avatarConfig` is null.

### P3: Click-to-enlarge (AX)

**As a player**, I click my avatar in the dashboard header and a larger view opens.

**Acceptance**: Modal with Avatar at larger size; click-outside or Escape to close.

### P4: Admin sprite viewer (AX)

**As an admin**, I can view player avatars and preview by config (nation/playbook).

**Acceptance**: `/admin/avatars` or equivalent; list players with avatars; preview by config.

### P5: Admin sprite assets (AX)

**As an admin**, I can browse and upload sprite files by layer.

**Acceptance**: Sprite Assets view; list layers and files; upload PNG for layer+key.

### P6: Stacking fix (BG, BH)

**As an admin**, when I assign an avatar, I see the full composed avatar: base + nation + playbook layers stacked.

**Acceptance**: No `nationKey: 'unknown'`; base-only preview when unselected; transparent overlays; solid background.

### P7: Live preview before assign (BG)

**As an admin**, I see a live preview of the composed avatar in the Assign Avatar form as I change nation, playbook, and base variant.

**Acceptance**: Preview updates reactively; shows same composition as Avatar component.

### P8: Report Issue (AW)

**As a tester**, Build Your Character and all cert quest steps have Report Issue links.

**Acceptance**: FEEDBACK passage; Report Issue link on every step.

## Dependencies

- [avatar-parts.ts](../../src/lib/avatar-parts.ts)
- [avatar-utils.ts](../../src/lib/avatar-utils.ts)
- [SPRITE_ASSETS.md](../../docs/SPRITE_ASSETS.md)
- [avatar-sprite-quality-process/STYLE_GUIDE.md](../avatar-sprite-quality-process/STYLE_GUIDE.md)

## Non-Goals (this spec)

- Agent-built assets (Phase 3)
- Animated sprite sheets
- Changing the layer model

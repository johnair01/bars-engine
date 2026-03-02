# Plan: Avatar Overwrite, Transparency, and Size Fix

## Summary

Address overwrite/transparency by (1) documenting overlay-only asset requirements and ChatGPT prompts, (2) regenerating placeholders as reference, (3) optionally increasing avatar display sizes. No code change required for stacking if assets are correct; prompts enable contributors to generate base-aligned overlays.

## Phase 1: Asset requirements and prompts (immediate)

### 1.1 Create ChatGPT prompts doc

- [CHATGPT_PROMPTS.md](CHATGPT_PROMPTS.md) — base reference, nation_body, nation_accent, playbook_outfit, playbook_accent templates with per-nation/archetype inserts
- Emphasize: OVERLAY ONLY, transparent elsewhere, fits region

### 1.2 Regenerate placeholders

- Run `npm run sprites:analyze-base` (if base changed)
- Run `npm run sprites:nation-placeholders`
- Use output as reference: correct overlay shapes, transparency, proportions

### 1.3 Update SPRITE_ASSETS.md

- Add "Overlay-only requirement" section
- Link to base-silhouette.json and CHATGPT_PROMPTS.md
- Clarify: nation/playbook = partial overlays, not full characters

## Phase 2: Verify stacking (code check)

### 2.1 AssignAvatarForm / deriveAvatarConfig

- Ensure `nationKey: ''` and `playbookKey: ''` when unselected (no 'unknown')
- Base-only preview when nothing selected

### 2.2 Avatar component

- Container has `bg-zinc-900` (already present)
- Layers stack in correct order (avatar-parts.ts)
- Base failure → initials fallback

### 2.3 Asset paths

- Nation/playbook layers only added when keys are set
- No 404s for missing layers

## Phase 3: Avatar size (optional)

### 3.1 Display size increase

In [src/components/Avatar.tsx](../../../src/components/Avatar.tsx):

```ts
// Current
const sizeClasses = {
  sm: 'w-8 h-8 text-xs',   // 32px
  md: 'w-10 h-10 text-sm', // 40px
  lg: 'w-14 h-14 text-lg', // 56px
  xl: 'w-64 h-64 text-4xl' // 256px
}

// Option: bump sm/md/lg for readability
const sizeClasses = {
  sm: 'w-10 h-10 text-xs',   // 40px
  md: 'w-12 h-12 text-sm',   // 48px
  lg: 'w-16 h-16 text-lg',   // 64px
  xl: 'w-64 h-64 text-4xl'   // 256px
}
```

### 3.2 Source resolution (future)

- 128×128 source would require: new asset dimensions, base-silhouette.json scale, placeholder script update, Avatar component (object-contain handles scaling)
- Defer unless 64×64 proves insufficient after overlay fix

## File impacts

| Action | Path |
|--------|------|
| Create | .specify/specs/avatar-overwrite-transparency-fix/CHATGPT_PROMPTS.md |
| Modify | docs/SPRITE_ASSETS.md (overlay-only section) |
| Optional | src/components/Avatar.tsx (sizeClasses) |
| Run | npm run sprites:nation-placeholders |

## Verification

1. Regenerate placeholders; verify at `/admin/avatars` that base + nation + playbook stack
2. Use ChatGPT prompt to generate one nation_body overlay; test stacking
3. If overwrite persists with correct assets, investigate CSS (object-fit, blend modes) or asset alpha channel

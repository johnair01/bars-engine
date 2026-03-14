# Plan: Avatar System Strategy & Pipeline Reanalysis

## Summary

Bundle avatar backlog items (AW, AX, AY, BG, BH) into a coherent strategy. Implement Phase 1: stacking fix, visibility, enlarge, gallery preview. Phase 2: quality process. Phase 3: agent-built assets (future placeholder).

## Implementation Order

### Phase 1: Fix stacking, visibility, enlarge, gallery preview

1. **Visibility**: `autoCompleteQuestFromTwine` calls `processCompletionEffects`; ensure `deriveAvatarFromExisting` runs; avatar preview in Build Your Character quest.
2. **Stacking**: Fix `nationKey: 'unknown'`; base-only preview when nation/archetype unselected; full layer composite; solid background.
3. **Enlarge**: Dashboard avatar click → modal with larger view.
4. **Gallery**: Assign Avatar form live preview; preview before assign.
5. **Report Issue**: Report Issue links on Build Your Character and cert quests.

### Phase 2: Quality process

6. Style guide; derive-base script; nation/playbook placeholder prompts.

### Phase 3: Agent-built assets (future)

7. Placeholder; spec when agent capability is ready.

## File Impacts

| Action | File |
|--------|------|
| Edit | `src/actions/twine.ts` — autoCompleteQuestFromTwine calls processCompletionEffects |
| Edit | `src/lib/avatar-utils.ts` — deriveAvatarConfig; no nationKey: 'unknown' |
| Edit | `src/components/Avatar.tsx` — base failure fallback; solid background |
| Edit | Dashboard header — avatar click → modal |
| Create | `src/components/AvatarEnlargeModal.tsx` (or similar) |
| Edit | Assign Avatar form — live preview; base-only config |
| Edit | `scripts/seed-onboarding-thread.ts` — Report Issue |
| Edit | `scripts/seed-cyoa-certification-quests.ts` — Report Issue audit |
| Create | `/admin/avatars` or equivalent |
| Create | Sprite Assets view (optional for Phase 1) |

## Verification

- [ ] Build Your Character completion sets avatarConfig; avatar renders on dashboard
- [ ] Avatar preview in quest before completion
- [ ] Dashboard avatar click opens larger view
- [ ] Assign Avatar form shows live preview; base-only when unselected
- [ ] Full layer stacking (base + nation + playbook visible)
- [ ] Report Issue on Build Your Character and cert steps
- [ ] loop:ready passes

# Plan: Admin World — Canonical Archetypes Only

## Summary

Filter Admin World archetypes to show only the 8 canonical archetypes (The Bold Heart, etc.). Root cause: dual seed sources (trigram names vs archetype names) populate the playbooks table; filter at query time.

## Phases

### Phase 1: Add canonical constant and filter

1. Create `src/lib/canonical-archetypes.ts` with `CANONICAL_ARCHETYPE_NAMES`.
2. Update `getAdminWorldData` in `src/actions/admin.ts` to filter playbooks by `name in CANONICAL_ARCHETYPE_NAMES`.
3. Run build and check.

### Phase 2: Verify consumers

- Admin World page — uses getAdminWorldData playbooks ✓
- Admin Players — uses getAdminWorldData for archetypes dropdown ✓
- Admin Avatars — uses getAdminWorldData ✓
- AssignAvatarForm — receives archetypes from parent ✓

All use the same `getAdminWorldData`; no further changes needed.

## Files

| File | Change |
|------|--------|
| `src/lib/canonical-archetypes.ts` | New — CANONICAL_ARCHETYPE_NAMES |
| `src/actions/admin.ts` | Filter playbooks in getAdminWorldData |

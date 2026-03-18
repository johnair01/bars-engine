# Plan: Walkable Sprites — Test and Production Release

**Source**: [walkable-sprites-implementation](.specify/specs/walkable-sprites-implementation/), [push-to-main-vercel-deploy](.specify/specs/push-to-main-vercel-deploy/)

---

## Summary

Three phases: (1) Manual test plan execution, (2) Verification quest creation, (3) Production deployment with pre- and post-deploy checklists.

---

## Phase 1: Manual Test Plan

**Goal**: Verify all implemented features work locally.

**Test matrix**:

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | **No avatarConfig** | Log in as player without nation/archetype; go to /lobby | MapAvatarGate: "Build your character", links to character-creator and profile |
| 2 | **With avatarConfig** | Log in as player with nation+archetype; go to /lobby | Map canvas loads; player sprite (or default.png) visible |
| 3 | **WASD direction** | In Lobby, press W/S/A/D | Sprite frame updates (north/south/east/west) |
| 4 | **World room** | Go to /world/[instance]/[room] with avatarConfig | Same as Lobby: sprite visible, WASD works |
| 5 | **Missing sprite fallback** | Use avatarConfig that maps to non-existent PNG (e.g. argyra-bold-heart) | Falls back to default.png or green rect |
| 6 | **default.png** | Confirm `public/sprites/walkable/default.png` exists | File present, 512×64 format |

**Commands**:
```bash
npm run build
npm run build:type-check
npm run dev   # then manually test
```

---

## Phase 2: Verification Quest

**Goal**: Create cert-walkable-sprites-v1 for structured validation.

**Tasks**:
1. Create Twine story with passages: MapAvatarGate check → Build character → Return to Lobby → Sprite visible → WASD direction → Complete.
2. Add CustomBar: `isSystem: true`, `visibility: 'public'`, deterministic id `cert-walkable-sprites-v1`, reward (e.g. 1 vibeulon).
3. Add to `scripts/seed-cyoa-certification-quests.ts` or create `scripts/seed-walkable-cert-quest.ts`.
4. Run seed; confirm quest appears on Adventures with "Certification" badge.
5. Complete quest end-to-end.

**Reference**: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/spec.md)

---

## Phase 3: Production Deployment

**Goal**: Push to main and verify production.

### 3.1 Pre-Push Checklist

```bash
npm run build
npm run build:type-check
npm run lint
# npm run smoke   # if available
```

- [ ] All pass
- [ ] No uncommitted schema changes (or migrations exist)
- [ ] `public/sprites/walkable/default.png` committed

### 3.2 Commit and Push

```bash
git add -A
git status
git commit -m "feat: walkable sprites Phase 1 — avatar gate, Pixi player sprites, direction

- Avatar config as map gate; MapAvatarGate when missing
- RoomRenderer: setPlayerSpriteUrl, setPlayerDirection, sprite loading
- LobbyCanvas/RoomCanvas: pass walkableSpriteUrl, track WASD direction
- Fallback to default.png on texture load failure"
git push origin main
```

### 3.3 Post-Deploy Verification

- [ ] Vercel deployment "Ready"
- [ ] Home page loads
- [ ] /login loads
- [ ] /lobby loads (with avatarConfig: sprite; without: MapAvatarGate)
- [ ] WASD moves player; sprite direction updates

### 3.4 Rollback

If critical bug:
```bash
git revert HEAD --no-edit
git push origin main
```

---

## File Impact Summary

| Phase | Files |
|-------|-------|
| Phase 1 | Manual only |
| Phase 2 | New Twine story, seed script, CustomBar |
| Phase 3 | git operations |

---

## Implementation Order

1. **Phase 1** — Run manual tests; fix any issues
2. **Phase 2** — Create verification quest; seed; validate
3. **Phase 3** — Pre-push gates → commit → push → post-deploy smoke

---

## Reference

- [push-to-main-vercel-deploy plan](../push-to-main-vercel-deploy/plan.md)
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md)
- [docs/LOOP_READINESS_CHECKLIST.md](../../docs/LOOP_READINESS_CHECKLIST.md)

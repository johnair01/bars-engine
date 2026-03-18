# Tasks: Walkable Sprites — Test and Production Release

Implement per [spec.md](./spec.md) and [plan.md](./plan.md).

---

## Phase 1: Manual Test Plan

- [ ] Run `npm run build` — pass
- [ ] Run `npm run build:type-check` — pass
- [ ] Run `npm run dev`
- [ ] **Test 1**: Log in as player without avatarConfig; go to /lobby → MapAvatarGate with "Build your character"
- [ ] **Test 2**: Log in as player with nation+archetype; go to /lobby → map canvas, player sprite visible
- [ ] **Test 3**: In Lobby, press W/S/A/D → sprite direction updates
- [ ] **Test 4**: Go to /world/[instance]/[room] with avatarConfig → sprite visible, WASD works
- [ ] **Test 5**: Verify fallback when sprite URL 404s (optional: mock or use non-existent combo)
- [ ] **Test 6**: Confirm `public/sprites/walkable/default.png` exists
- [ ] Fix any issues found

---

## Phase 2: Verification Quest

- [ ] Create Twine story for cert-walkable-sprites-v1 (steps: MapAvatarGate → build character → Lobby → sprite → WASD → complete)
- [ ] Add CustomBar: isSystem, visibility public, id cert-walkable-sprites-v1, reward
- [ ] Add seed script entry (seed-cyoa-certification-quests.ts or new seed-walkable-cert-quest.ts)
- [ ] Run seed script
- [ ] Confirm quest appears on /adventures with "Certification" badge
- [ ] Complete quest end-to-end

---

## Phase 3: Production Deployment

- [ ] Run `npm run build` — pass
- [ ] Run `npm run build:type-check` — pass
- [ ] Run `npm run lint` — pass (or known acceptable warnings)
- [ ] Confirm `public/sprites/walkable/default.png` is committed
- [ ] Stage and commit with descriptive message
- [ ] Push to main
- [ ] Verify Vercel deployment "Ready"
- [ ] Post-deploy smoke: home, login, /lobby (with and without avatarConfig)
- [ ] Document rollback procedure if not already in push-to-main spec

---

## Final Verification

- [ ] All Phase 1 tests pass
- [ ] Verification quest completable
- [ ] Production deploy successful
- [ ] Post-deploy smoke passes

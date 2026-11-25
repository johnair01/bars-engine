# WSC — WorkAdventure Sprite Bridge & Character Link

**Spec:** [.specify/specs/wa-sprite-character-link/spec.md](../specs/wa-sprite-character-link/spec.md)
**Comparison:** [compare-workadventure-sprites.md](../specs/wa-sprite-character-link/compare-workadventure-sprites.md)
**Plan / Tasks:** [plan.md](../specs/wa-sprite-character-link/plan.md) · [tasks.md](../specs/wa-sprite-character-link/tasks.md)
**Verification:** `cert-wa-sprite-link-v1`

## Problem

A player can finish the bars-engine character creator and still enter `world.masteringallyship.com` as WorkAdventure's fallback "ghost". The two systems share identity (`sub = Player.id`) but not a sprite contract: bars-engine uses a 64×64 layered portrait and a 512×64 / 8-frame walkable sheet; WorkAdventure needs a 96×128 / 12-frame woka sheet at 32×32 cells. PR #991 built the Admin API bridge and 40 provisional sheets, but there is no creator step that shows the player the body they will inhabit, and no compiler that derives the woka sheet from the same character config.

## Decision

Use WorkAdventure's **full-body `woka` part**, not its six layer parts, as the in-world render of `Player.avatarConfig`. One character, three renders:

- portrait 64×64 layers,
- walkable 512×64 (8 frames),
- woka 96×128 (12 frames).

`waWokaId` is optional inside the existing `avatarConfig` JSON. Default texture id: `wa:<nationKey>:<archetypeKey>`. No Prisma migration.

## Phase 0 (this run)

1. Read the comparison and correct any claim that does not match WA 1.35 or current code.
2. Confirm the bridge decision and the four open questions.
3. Add this row to `BACKLOG.md` and run `npm run backlog:seed` (check the ledger tail first).

## Phase 1 — harden the bridge

- Add the invariant test: `room/access` must never return `isCharacterTexturesValid: true` with `characterTextures: []`.
- Test anonymous `characterTextureIds` echo, unknown-id rejection, `domainKey` preservation, and `woka` (not `body`) in `woka/list`.
- Compiler: 96×128 gate + lower-body coverage gate + catalog hash.
- Fix the OIDC `/openid-callback` session-expiry path (state/PKCE cookie across the bars-engine login redirect; 2-minute code TTL).
- Verify the signed-in admin renders a real sheet, not `character_color21.png` / `character_eyes23.png`.

## Phase 2 — link the creator

- New Server Action `saveCharacterSprite({ textureId })` in `src/actions/character-sprite.ts`; session auth; unknown-id rejection; writes `avatarConfig.waWokaId`.
- Add a **Body** step to `/character/create` (`OuroborosInterviewClient`) after nation + archetype; preselect `wa:<nation>:<archetype>`; 96×128 preview; keyboard accessible.
- Reconcile prompt if nation/archetype later change and `waWokaId` no longer matches.
- Render the chosen body on `/character/[shareToken]`.
- Keep WA's picker as the fallback for players who enter the world before creating a character; both write paths use the same mapper.

## Phase 3 — compile real art

Portrait layers cannot produce legs. Define a full-body 12-frame walk source per nation × archetype, compose 3×4 at 32×32, apply the nation palette, and keep provisional sheets as fallback until the compiled sheets pass the lower-body gate.

## Non-goals

- Mapping WA's `body/eyes/hair/clothes/hat/accessory` parts 1:1.
- Per-player AI generation at request time.
- A WorkAdventure fork or custom image.
- Changing the portrait/walkable canvas sizes.

## Acceptance

- Signed-in player picks a body in bars-engine and enters the dojo as that body; no ghost.
- Anonymous visitor picks and keeps a body locally without a player row.
- No `valid: true` with zero textures.
- `npm run wa:woka` is deterministic and fails on a bust-only frame.
- `cert-wa-sprite-link-v1` passes on production.

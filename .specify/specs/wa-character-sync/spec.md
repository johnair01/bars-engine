# Spec: WorkAdventure character sync (login first, one character, adjustable look)

## Purpose

A person enters the Calrunian Dojo only as a signed-in bars-engine player, and the character they walk with is the
one bars-engine holds for them. The world never shows a second, separate creator.

**Problem**: On 2026-11-24 the live world let anyone in as a guest, showed WorkAdventure's own picker, and failed to
save an admin's look (`POST /api/save-textures` answered 404 in the play container log). Two characters existed: the
WorkAdventure picker's and the bars-engine one.

**Practice**: Deftness Development. Spec kit first, API-first, deterministic over AI. Ouroboros seed (interview
questions are in "Open questions" and go to the Council Board).

## What was observed (proven on 2026-11-24, read-only)

| Fact | Evidence |
|------|----------|
| Anonymous entry is on | play container env `DISABLE_ANONYMOUS=false`; a guest reached the dojo with no login or guest-choice screen shown. `docs/WA_IDENTITY_AND_ASSETS.md` (PR 991) says it should be `true`; Wendell (2026-11-25) wants a guest option kept, behind a login offer. |
| Tall woka works for a guest | `argyra/bold-heart.png?fh=64` is 96x256 (3x4 cells of 32x64); the figure walks in the live world. |
| Admin look fails to save | box log: three `404` from `https://bars-engine.vercel.app/api/save-textures`. In PR 991 the route's only 404 is `player not found` (lookup by `Player.id` only). |
| Join resolves id or email, save does not | `/api/room/access` falls back to email; `/api/save-textures` does not. |
| Cause of the 404 | **Unproven.** Response body and the identifier WorkAdventure sent were not captured. |

## Design Decisions

| Topic | Decision |
|-------|----------|
| Entry | A visitor is always offered bars-engine login first. "Continue as guest" is a choice on that screen, not a silent default. Every guest wears the same fixed guest look (set by Wendell 2026-11-25), so guests are recognisable in the workspace; a guest cannot choose or save a look. Whether the box needs `DISABLE_ANONYMOUS` changed, or WorkAdventure's own login screen already offers both, is unproven (on 2026-11-24 a guest reached the world with no screen in my browser). |
| Source of truth | `Player` in bars-engine. The character sheet there (nation, archetype, layers) changes only through bars-engine moves. |
| Look in the world | Temporary cosmetic adjustment is allowed. It is stored apart from the sheet (a `lookOverride`), never written into the sheet fields, and can be cleared back to the sheet's own look. |
| Creator | One. The bars-engine creator is the only place to make a character; the WorkAdventure picker only edits the cosmetic override (or is hidden). |
| Tall sprites | The woka list serves the tall sheet and its `?fh=` per texture. The play fork must read frame height per texture, not as one global (see Risks). |

## Conceptual Model

WHO: a `Player` (id = OIDC `sub`). WHAT: a character sheet (static, bars-engine moves only) plus an optional
`lookOverride` (cosmetic, player-editable). WHERE: the dojo world on `box`, reading both through `/api/room/access`
and `/api/woka/list`.

## API Contracts

- `GET /api/room/access`: returns the sheet's textures, replaced by `lookOverride` when present.
- `POST /api/save-textures`: writes only `lookOverride`; looks the player up by id, then by email (same as join);
  logs `userIdentifier` and the lookup result on a miss; returns 404 with a readable body.
- `POST /api/save-name`: same lookup rule.

## User Stories

### P1: Enter as myself

As a visitor, I am offered sign-in before the world loads, with "Continue as guest" as one option, so I never walk in as a guest without having been asked.
**Acceptance**: a private window opening the world URL shows the login offer and a guest button; guest enters in the one shared guest look; login enters as my character.

### P1: Walk as my character

As a signed-in player, I arrive in my sheet's look at the right height, and it walks in four directions.
**Acceptance**: the tall figure's walk cycle is seen on four directions; a 32px figure in the same room is unbroken.

### P2: Adjust my look

As a player, I can change how my character looks in the world without changing my sheet.
**Acceptance**: Finish in the picker saves; reload keeps it; "back to sheet look" restores the sheet; the sheet
fields are unchanged.

## Functional Requirements

### Phase 1: Make the failure visible
- FR1: `save-textures` and `save-name` log identifier and lookup result; add the email fallback.
- FR2: Make the entry screen offer login with a guest button. First find out what WorkAdventure's login screen already does with the current env (read-only), then change the box only if needed (needs Wendell's go-ahead).

### Phase 2: Adjustable look
- FR3: Add `lookOverride` to the player data and read it in `room/access`.
- FR4: `save-textures` writes `lookOverride` only.

### Phase 3: Tall sprites that do not break others
- FR5: Per-texture frame height in the play fork (not a global), with 32px sheets unaffected.

## Non-Functional Requirements

- Every step is verifiable locally first (`scripts/local/check.sh --build`), then on the box read-only.
- The play container change is a rebuild of `wa-play-tall`; no change to stock images.

## Persisted data & Prisma

Adds a nullable field for `lookOverride` on the player. Needs a committed migration (`npx prisma migrate dev`,
`db:record-schema-hash`). Not in this PR; this PR is the spec only.

## Risks

- The tall patch uses one global frame height. A 32px sheet loaded after a `?fh=64` one may slice wrongly (the
  picker previews looked garbled on 2026-11-24). Unproven; test before changing.
- Cookie reuse: bars-engine may confirm an admin session without the creation flow. The login-first gate must
  decide what a returning admin sees when they have no character.

## Open questions (Council Board; reach test first)

1. Is the WorkAdventure picker hidden, or kept as the cosmetic editor?
2. What can the cosmetic override change (colours only, or any layer)?
3. How long is "temporary": until the next bars-engine move, a day, or until cleared?
4. What does an admin with no character see on first entry?
5. Where does a person without an account go: sign-up in the same flow?
6. Which woka is the shared guest look, and does a guest keep it in every room?

## Verification Quest

Open the world in a private window; sign in; arrive in your sheet's look; walk four directions; change the
cosmetic look, reload, see it kept; clear it, see the sheet's look return.

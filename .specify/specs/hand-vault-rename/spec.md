# Spec: Rename `/hand` → `/vault`

## Purpose

Rename the legacy `/hand` route (which is actually the unbounded vault) to `/vault`. Free up the "hand" name for the new bounded in-world inventory (see [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md)).

## Problem

The route `/hand` and its sub-routes (`/hand/drafts`, `/hand/quests`, `/hand/charges`, `/hand/who`, `/hand/library`) are misnamed. They show the player's complete BAR collection — that's a vault, not a hand. The actual "hand" (bounded in-world inventory, Pokemon team) is now a separate concept (other spec).

This rename clears up the confusion and makes the new HandModal name accurate.

## Practice

Deftness Development — spec kit first. This is a mechanical refactor with high blast radius (~80 file references), so it's worth a deliberate plan.

## Design Decisions

| Topic | Decision |
|-------|----------|
| New URL | `/vault` (not `/storage`, not `/library`) — matches the existing project vocabulary (vault-queries.ts, vault-limits.ts, etc.) |
| Sub-routes | `/vault/drafts`, `/vault/quests`, `/vault/charges`, `/vault/who`, `/vault/library`. Same structure as `/hand/*` today. |
| Backwards compat | Old `/hand` and `/hand/*` routes 301-redirect to `/vault` and `/vault/*` for at least 6 months. External links and bookmarks must not break. |
| Code references | Update all imports, links, and internal references to use `/vault` paths. The redirect handles user-facing legacy URLs only. |
| Component renames | `/src/app/hand/` directory → `/src/app/vault/`. Component file names follow. |
| Server-action names | `loadVaultCoreData`, etc., are already correctly named — no rename needed. |
| Documentation | Update README, ARCHITECTURE, agent context files, memory notes |
| Tests | Update test files referencing `/hand/*` paths |
| Mobile / API consumers | Audit fetch calls and external integrations for hardcoded `/hand` references |

## Conceptual Model

| Dimension | Before | After |
|-----------|--------|-------|
| "Hand" | The full vault (misnamed) | A bounded in-world inventory (6 BARs) |
| "Vault" | Internal concept; not a route | A real route at `/vault` |
| `/hand` | Vault page | 301 → `/vault` |
| HandModal | Stub (created 2026-04-11) | Real bounded inventory UI |
| `/vault` | Doesn't exist | The vault page (formerly `/hand`) |

## Rename Surface

| Path / file | Action |
|-------------|--------|
| `src/app/hand/page.tsx` | Move to `src/app/vault/page.tsx` |
| `src/app/hand/drafts/page.tsx` | Move to `src/app/vault/drafts/page.tsx` |
| `src/app/hand/quests/page.tsx` | Move to `src/app/vault/quests/page.tsx` |
| `src/app/hand/charges/page.tsx` | Move to `src/app/vault/charges/page.tsx` |
| `src/app/hand/who/page.tsx` | Move to `src/app/vault/who/page.tsx` |
| `src/app/hand/library/page.tsx` | Move to `src/app/vault/library/page.tsx` |
| Any `src/app/hand/<sub>/<file>` | Mirror under `src/app/vault/...` |
| All `Link href="/hand"` | Update to `/vault` (audit via grep) |
| All `router.push('/hand')` | Update to `/vault` |
| All `revalidatePath('/hand')` | Update to `/vault` |
| All `'/hand/'` string literals in tests/seeds | Update |
| Component imports `from '@/app/hand/...'` | Update |

## Redirect Logic

In `next.config.js` or `src/middleware.ts`:

```typescript
// Permanent redirect: /hand → /vault, preserving sub-paths and query params
{
  source: '/hand',
  destination: '/vault',
  permanent: true,
}
{
  source: '/hand/:path*',
  destination: '/vault/:path*',
  permanent: true,
}
```

This ensures bookmarks, shared links, external integrations, and Twee/CYOA references with hardcoded `/hand` URLs continue to work.

## User Stories

### P0 — Rename

**HVR-1**: As a user navigating to `/hand`, I am 301-redirected to `/vault`, so external links don't break.

**HVR-2**: As a developer searching for vault code, all references use `/vault` consistently. No mixed references.

**HVR-3**: As a developer running tests, all tests pass with the new paths. No flaky redirects in test environment.

### P1 — Documentation

**HVR-4**: As a new contributor reading the README and ARCHITECTURE docs, the routes mentioned match the actual code.

**HVR-5**: As an agent reading memory notes, the references to `/hand` as the vault have been corrected.

## Functional Requirements

### Phase 1 — Audit

- **FR1**: Find all references to `/hand` in `src/`, `tests/`, `scripts/`, `prisma/`, `docs/`, `.specify/`, and memory files
- **FR2**: Categorize: file paths, route literals, link components, fetch URLs, doc/comment references
- **FR3**: Produce a written diff plan listing every file to change

### Phase 2 — Move + Rename

- **FR4**: Move `src/app/hand/` → `src/app/vault/`
- **FR5**: Update all internal references in one commit (atomic, easier to revert if needed)
- **FR6**: Add Next.js redirect rules for legacy paths

### Phase 3 — Update Docs + Tests

- **FR7**: Update README, ARCHITECTURE, FOUNDATIONS
- **FR8**: Update agent context files referencing `/hand`
- **FR9**: Update memory notes referencing `/hand`-as-vault to `/vault`
- **FR10**: Update test references

### Phase 4 — Verify

- **FR11**: `npm run build` passes
- **FR12**: `npm run check` passes
- **FR13**: Manual click-through of vault from HUD button → arrives at `/vault`
- **FR14**: Manual visit to `/hand` → redirects to `/vault`

## Non-Functional Requirements

- **NFR1**: The redirect must be a 301 (permanent) so caches respect it
- **NFR2**: No `/hand` references should remain in the codebase except in the redirect rules and migration documentation
- **NFR3**: Tests must pass under both pre-rename and post-rename branches (no test brittleness)

## Persisted Data & Prisma

No schema changes. This is a route rename only.

## Dependencies

- [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md) — the reason for the rename. The new `HandModal` (already shipped as stub) is the actual hand UI.
- [world-portal-save-state](../world-portal-save-state/spec.md) — sibling. After rename, the departure modal routes to `/vault`.

## References

- `src/app/hand/` — current directory to move
- `src/lib/vault-queries.ts` — server functions are already correctly named
- `src/components/world/PlayerHud.tsx` — currently links to `/hand`; will update to `/vault`
- `src/components/world/HandModal.tsx` — currently footer-links to `/hand`; will update

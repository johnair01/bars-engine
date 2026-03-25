# Plan: Party mini-game — event game layer

Implement per [spec.md](./spec.md). **v1 pilot:** Bruised Banana April 4 (dance) / April 5 (scheming).

## Phase order

1. **Content + static render (Phase 1)** — Lowest risk; unblocks comms and QA on copy.
2. **Client interactive grid (Phase 2)** — `sessionStorage` or equivalent; document login merge later.
3. **BAR metabolize (Phase 3)** — Server action + `CustomBar` create; revalidate `/hand`.
4. **CYOA / playstyle (Phase 4)** — Defer until 1–3 are stable; separate sub-milestone.

## Likely file / surface impacts

| Area | Notes |
|------|--------|
| Event UI | Extend [`src/app/event`](../../../src/app/event) or campaign-scoped block; follow **UI Covenant** + [`cultivation-cards.css`](../../../src/styles/cultivation-cards.css) for game aesthetic. |
| Content | `src/lib/...` or `content/` TS const for grid definitions (`PartyMiniGameDefinition` shape from spec). |
| Actions | New server action e.g. `src/actions/party-mini-game-bar.ts` for Phase 3 only. |
| Prisma | **None** for Phase 1–2 if config is code-first; add model only if we need DB-backed authoring (post–v1 pilot). |

## Bruised Banana routing

- Align with existing **`/event`** Apr blocks and [docs/events](../../../docs/events) copy where referenced.
- Use `campaignRef: bruised-banana` (or resolved instance ref) on BAR stamp when applicable.

## Verification

- `npm run build` / `npm run check` after each phase.
- Manual: phone viewport + one BAR created in synthetic DB mode (`make dev-local` or equivalent).

## Out of scope for this plan document

- Admin UI for non-dev authoring of grids (backlog follow-up).
- Playstyle → quest pack bias (spec Phase 4+).

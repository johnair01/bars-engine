# Plan: 321 → BAR draft experience

Implement per [.specify/specs/321-bar-draft-experience/spec.md](./spec.md).

## Phase 1 — Derivation contract (bars-core + types)

1. Add **`BarDraftFrom321`** type (or extend exported `Metadata321` with deprecation notes) in `packages/bars-core` (or shared types used by app + core).
2. Implement **`deriveBarDraftFrom321`** with deterministic rules:
   - **`systemTitle`**: short neutral default — e.g. mask/shadow name + date slice, or first N chars of **composed one-liner**, not `q1 — q5` concatenation; document rule.
   - **`body`**: 2–4 sentences or tight bullets from: charge summary, insight (q5), aligned action, integration line — **exclude** raw repetition of every labeled field unless in `source321FullText`.
   - **`moveType`**: map 321 aligned action strings to `wakeUp` | `cleanUp` | `growUp` | `showUp`.
   - **`tags`**: structured prefixes + selected chips from q2/q4/q6 **without** splitting `identityFreeText` into random words (cap + filter).
   - **`source321FullText`**: optional output of **legacy** `deriveMetadata321`-style concatenation for “Show original” only.
3. Unit tests: fixtures from sample phase2/phase3 JSON → expected draft shape.

## Phase 2 — Session lifecycle & reversibility

1. **`Shadow321Runner`** / **`Shadow321Form`**: defer **`clearSession()`** until terminal outcomes; for **Create BAR**, navigate without clearing, or persist **`shadow321_session`** until BAR submit success.
2. **`CreateBarPageClient`**: do **not** `removeItem` on first read if we need back-navigation; alternatively **copy** into React state immediately and keep storage until success (document chosen strategy).
3. Optional: pass **`sessionId`** if `Shadow321Session` row exists — back button loads artifact with server state.

## Phase 3 — Quick BAR UI mode

1. **`CreateBarForm`**: detect `from321` / `mode=quickFrom321` (prop from page).
2. **Layout**: body (description) primary; title as secondary / Advanced with label “List label (optional)”.
3. **Validation**: `allyshipDomain` required in this mode.
4. **Hide**: nation + archetype multi-select from default (Advanced accordion).
5. **Image**: wire file input if `CustomBar` / storage already supports; else stub + task to schema/storage spec.

## Phase 4 — Server action

1. **`createCustomBar`**: accept new fields consistent with `BarDraftFrom321`; map `systemTitle` → DB `title`; store full 321 source in metadata JSON if needed.
2. Backward compatibility: old `metadata321` prefill still works during transition.

## Phase 5 — Milestone tags (stretch)

1. Document tag namespace; add deterministic `move:` / `domain:` tags in derivation.
2. Connect to milestone guidance only where [bruised-banana-milestone-throughput](../bruised-banana-milestone-throughput/spec.md) tasks already expect hooks.

## File impact (expected)

| Area | Files |
|------|--------|
| Derivation | `packages/bars-core/src/quest-grammar/deriveMetadata321.ts` (split or sibling `deriveBarDraftFrom321.ts`) |
| Tests | `packages/bars-core` or `src/lib/**/__tests__` |
| 321 UI | `Shadow321Runner.tsx`, `Shadow321Form.tsx` |
| Create BAR | `CreateBarForm.tsx`, `CreateBarPageClient.tsx`, `src/app/create-bar/**` |
| Actions | `src/actions/create-bar.ts` |

## Order of execution

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (stretch).
